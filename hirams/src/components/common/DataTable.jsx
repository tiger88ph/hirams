/**
 * DataTable  (v2.3)
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared compact table used by TransactionCanvas, TransactionPricing, and
 * AddBulkItem.  Supports the full two-row banded header layout that
 * TransactionPricing uses (group band row  +  column-label row), while
 * keeping every existing prop 100 % backward-compatible.
 *
 * ─── CHANGELOG v2.4 ──────────────────────────────────────────────────────────
 * • wrapRow now receives (row, rowIndex, paperNode, isLastRow) — 4th arg lets
 *   callers apply bottom-radius or other last-row styles without needing
 *   rows.length in their closure.
 *
 * ─── CHANGELOG v2.3 ──────────────────────────────────────────────────────────
 * • Data-row Grid now uses alignItems="stretch" (was "flex-start") so all
 *   cells in a row share the same height — matching the old manual layout.
 * • Summary row border logic fixed: the last visible cell correctly omits
 *   its right border; borderTop "2px solid #CBD5E1" is applied on every cell.
 * • buildCellSx: `pl` / `pr` padding now uses theme spacing numbers (MUI sx)
 *   consistently — no mixing of number and string values.
 *
 * ─── ColumnDef ───────────────────────────────────────────────────────────────
 * {
 *   key            string
 *   label          string
 *   labelColor     string
 *   xs             number        MUI Grid xs (0.5–12)
 *   align          "left"|"center"|"right"   data cell align. Default: "left"
 *   headerAlign    "left"|"center"|"right"   header align.   Default: "center"
 *   required       bool
 *   band           "sell"|"budget"|"cost"
 *   borderLeft     bool
 *   borderRight    bool
 *   hideBorder     bool
 *   rowSpan        bool
 *   summaryColSpan number
 *   render         (row, i) => ReactNode
 *   value          (row, i) => string|num
 *   headerRender   () => ReactNode
 *   summaryRender  (summaryRow) => ReactNode
 *   summaryValue   (summaryRow) => string|num
 *   cellSxExtra    object | ((row,i)=>object)
 *   headerSxExtra  object
 * }
 *
 * ─── GroupDef ────────────────────────────────────────────────────────────────
 * { label, span, color, bgColor, borderLeft, borderRight }
 *
 * ─── OverlayDef ──────────────────────────────────────────────────────────────
 * { label, left?, right?, width, pl? }
 */

import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { Skeleton } from "@mui/material";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const BASE_BORDER = "1px solid #DDE3EE";

const BAND_BG = {
  sell: "rgba(59,130,246,0.04)",
  budget: "rgba(20,184,166,0.04)",
  cost: "rgba(245,158,11,0.04)",
};
const BAND_BG_SUMMARY = {
  sell: "rgba(59,130,246,0.06)",
  budget: "rgba(20,184,166,0.06)",
  cost: "rgba(245,158,11,0.06)",
};
const BAND_BORDER_COLOR = {
  sell: "rgba(59,130,246,0.25)",
  budget: "rgba(20,184,166,0.25)",
  cost: "rgba(245,158,11,0.25)",
};

/* ═══════════════════════════════════════════════════════════════════
   SX BUILDERS
═══════════════════════════════════════════════════════════════════ */

/**
 * Build sx for a data cell or summary cell.
 *
 * Key points:
 *  • isSummary=true  → uses BAND_BG_SUMMARY, skips cellSxExtra, adds borderTop
 *  • isLast=true     → suppresses the automatic right border (last col)
 */
const buildCellSx = (
  col,
  { isSummary = false, isLast = false, row = null, rowIndex = null } = {},
) => {
  const bandBg = isSummary ? BAND_BG_SUMMARY[col.band] : BAND_BG[col.band];
  const bandBorderColor = BAND_BORDER_COLOR[col.band] || "#DDE3EE";

  const extra = isSummary
    ? {}
    : col.cellSxExtra
      ? typeof col.cellSxExtra === "function"
        ? col.cellSxExtra(row, rowIndex)
        : col.cellSxExtra
      : {};

  const dataAlign = col.align ?? "left";

  return {
    py: 0.75,
    display: "flex",
    alignItems: "center",
    justifyContent:
      dataAlign === "right"
        ? "flex-end"
        : dataAlign === "center"
          ? "center"
          : "flex-start",
    ...(dataAlign === "right" && { pr: 1 }),
    ...(dataAlign === "left" && { pl: 1 }),
    ...(bandBg && { background: bandBg }),
    ...(col.borderLeft && { borderLeft: `1px solid ${bandBorderColor}` }),
    ...(col.borderRight && { borderRight: `1px solid ${bandBorderColor}` }),
    // Auto right-border unless: explicit borderRight, hideBorder, or last col
    ...(!col.borderRight &&
      !col.hideBorder &&
      !isLast && { borderRight: BASE_BORDER }),
    ...(isSummary && { borderTop: "2px solid #CBD5E1" }),
    ...extra,
  };
};

const buildHeaderCellSx = (col, isLast) => {
  const bandBorderColor = BAND_BORDER_COLOR[col.band] || "#DDE3EE";
  const hAlign = col.headerAlign ?? "center";
  return {
    py: 0.6,
    display: "flex",
    alignItems: "center",
    justifyContent:
      hAlign === "right"
        ? "flex-end"
        : hAlign === "left"
          ? "flex-start"
          : "center",
    ...(hAlign === "right" && { pr: 1 }),
    ...(hAlign === "left" && { pl: 0.75 }),
    ...(BAND_BG[col.band] && { background: BAND_BG[col.band] }),
    ...(col.borderLeft && { borderLeft: `1px solid ${bandBorderColor}` }),
    ...(col.borderRight && { borderRight: `1px solid ${bandBorderColor}` }),
    ...(!col.borderRight &&
      !col.hideBorder &&
      !isLast && { borderRight: BASE_BORDER }),
    ...(col.headerSxExtra || {}),
  };
};

/* ═══════════════════════════════════════════════════════════════════
   Helper: cumulative left-offset % per column (for rowSpan overlays)
═══════════════════════════════════════════════════════════════════ */
const computeColumnOffsets = (columns) => {
  let running = 0;
  return columns.map((col) => {
    const left = (running / 12) * 100;
    const width = (col.xs / 12) * 100;
    running += col.xs;
    return { left, width };
  });
};

/* ═══════════════════════════════════════════════════════════════════
   Helper: merge columns for summary row via summaryColSpan
   Returns [{ col, xs, spannedCols, isLast }]
═══════════════════════════════════════════════════════════════════ */
const buildSummaryCells = (columns) => {
  const cells = [];
  let skip = 0;

  columns.forEach((col, ci) => {
    if (skip > 0) {
      skip--;
      return;
    }

    const span =
      col.summaryColSpan && col.summaryColSpan > 1 ? col.summaryColSpan : 1;
    let mergedXs = 0;
    const spannedCols = [];
    for (let s = 0; s < span && ci + s < columns.length; s++) {
      mergedXs += columns[ci + s].xs;
      spannedCols.push(columns[ci + s]);
    }

    // "last visible cell" = this span reaches the final column
    const isLast = ci + span - 1 === columns.length - 1;

    cells.push({ col, xs: mergedXs, spannedCols, isLast });
    skip = span - 1;
  });

  return cells;
};

/* ═══════════════════════════════════════════════════════════════════
   DataTable
═══════════════════════════════════════════════════════════════════ */
function DataTable({
  columns = [],
  columnGroups = null,
  overlayHeaders = null,
  rows = [],
  summaryRow = null,
  loading = false,
  emptyText = "No items available.",
  minWidth = "900px",
  rowKey,
  rowSx,
  wrapRow,
  footer,
}) {
  const hasGroups = Array.isArray(columnGroups) && columnGroups.length > 0;
  const hasOverlays =
    Array.isArray(overlayHeaders) && overlayHeaders.length > 0;

  const rowSpanColumns = hasGroups ? columns.filter((c) => c.rowSpan) : [];
  const hasRowSpan = rowSpanColumns.length > 0;

  const columnOffsets =
    hasGroups && hasRowSpan ? computeColumnOffsets(columns) : [];

  /* ── default data cell content ── */
  const renderCell = (col, row, i) => {
    if (col.render) return col.render(row, i);
    const val = col.value ? col.value(row, i) : row[col.key];
    return (
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "#1E293B",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.3,
          width: "100%",
          textAlign:
            col.align === "right"
              ? "right"
              : col.align === "center"
                ? "center"
                : "left",
        }}
      >
        {val ?? "—"}
      </Typography>
    );
  };

  /* ── summary content helpers ── */
  const hasSummaryContent = (col) => {
    if (col.summaryRender || col.summaryValue) return true;
    const val = summaryRow?.[col.key];
    return val !== undefined && val !== null;
  };

  const hasSpanSummaryContent = (spannedCols) =>
    spannedCols.some((c) => hasSummaryContent(c));

  const renderSummaryCell = (col) => {
    if (col.summaryRender) return col.summaryRender(summaryRow);
    const val = col.summaryValue
      ? col.summaryValue(summaryRow)
      : summaryRow?.[col.key];
    if (val === undefined || val === null) return null;
    return (
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 800,
          color: "#334155",
          whiteSpace: "nowrap",
        }}
      >
        {val}
      </Typography>
    );
  };

  /* ── row wrapper ── */
  const wrap = (row, i, node) =>
    wrapRow ? wrapRow(row, i, node, i === rows.length - 1) : node;

  /* ─────────────────────────────────────────────────────────────────
     HEADER
  ───────────────────────────────────────────────────────────────── */
  const renderHeader = () => (
    <Paper
      elevation={0}
      sx={{
        py: 0,
        background: "#F0F4FA",
        borderRadius: "10px 10px 0 0",
        overflow: "hidden",
        border: BASE_BORDER,
        borderBottom: "none",
        ...((hasOverlays || (hasGroups && hasRowSpan)) && {
          position: "relative",
        }),
      }}
    >
      {/* Row 1 — group band labels */}
      {hasGroups && (
        <Grid container alignItems="stretch">
          {columnGroups.map((g, gi) => (
            <Grid
              key={gi}
              item
              xs={g.span}
              sx={{
                py: 0.4,
                textAlign: "center",
                background: g.bgColor || "transparent",
                borderBottom: BASE_BORDER,
                ...(g.borderLeft && {
                  borderLeft: `1px solid ${g.borderLeft}`,
                }),
                ...(g.borderRight && {
                  borderRight: `1px solid ${g.borderRight}`,
                }),
                ...(!g.borderRight &&
                  gi < columnGroups.length - 1 && { borderRight: BASE_BORDER }),
              }}
            >
              {g.label && (
                <Typography
                  sx={{
                    fontSize: "0.5rem",
                    color: g.color || "#475569",
                    fontWeight: 700,
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                  }}
                >
                  {g.label}
                </Typography>
              )}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Row 2 — individual column labels */}
      <Grid container alignItems="center">
        {columns.map((col, ci) => (
          <Grid
            key={col.key}
            item
            xs={col.xs}
            sx={{
              ...buildHeaderCellSx(col, ci === columns.length - 1),
              ...(hasGroups && col.rowSpan && { visibility: "hidden" }),
            }}
          >
            {col.headerRender ? (
              col.headerRender()
            ) : (
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: col.labelColor
                    ? col.labelColor
                    : col.required
                      ? "#1976d2"
                      : "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {col.label}
              </Typography>
            )}
          </Grid>
        ))}
      </Grid>

      {/* rowSpan overlay cells */}
      {hasGroups &&
        hasRowSpan &&
        columns.map((col, ci) => {
          if (!col.rowSpan) return null;
          const { left, width } = columnOffsets[ci];
          const isLast = ci === columns.length - 1;
          const bandBorderColor = BAND_BORDER_COLOR[col.band] || "#DDE3EE";

          return (
            <Box
              key={`rowspan-${col.key}`}
              sx={{
                position: "absolute",
                top: 0,
                height: "100%",
                left: `${left}%`,
                width: `${width}%`,
                display: "flex",
                alignItems: "center",
                justifyContent: (() => {
                  const ha = col.headerAlign ?? "center";
                  return ha === "right"
                    ? "flex-end"
                    : ha === "left"
                      ? "flex-start"
                      : "center";
                })(),
                ...((col.headerAlign ?? "center") === "left" && { pl: 0.75 }),
                ...((col.headerAlign ?? "center") === "right" && { pr: 1 }),
                background: "#F0F4FA",
                ...(BAND_BG[col.band] && { background: BAND_BG[col.band] }),
                ...(col.borderLeft && {
                  borderLeft: `1px solid ${bandBorderColor}`,
                }),
                ...(col.borderRight && {
                  borderRight: `1px solid ${bandBorderColor}`,
                }),
                ...(!col.borderRight &&
                  !col.hideBorder &&
                  !isLast && { borderRight: BASE_BORDER }),
                pointerEvents: "none",
                zIndex: 1,
                ...(col.headerSxExtra || {}),
              }}
            >
              {col.headerRender ? (
                col.headerRender()
              ) : (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: col.labelColor
                      ? col.labelColor
                      : col.required
                        ? "#1976d2"
                        : "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                </Typography>
              )}
            </Box>
          );
        })}

      {/* Absolute overlay headers */}
      {hasOverlays &&
        overlayHeaders.map(({ label, left, right, width, pl }) => (
          <Box
            key={label}
            sx={{
              position: "absolute",
              top: 0,
              height: "100%",
              width: `${width}%`,
              ...(left !== undefined && { left: `${left}%` }),
              ...(right !== undefined && { right: `${right}%` }),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...(pl !== undefined && { pl }),
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#475569" }}
            >
              {label}
            </Typography>
          </Box>
        ))}
    </Paper>
  );

  /* ─────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Box sx={{ overflowX: "auto", pb: 1 }}>
        <Box sx={{ minWidth }}>
          {renderHeader()}
          {loading && (
            <Box sx={{ border: BASE_BORDER, borderTop: "none" }}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                    borderBottom: i < 4 ? BASE_BORDER : "none",
                  }}
                >
                  {columns.map((col) => (
                    <Box key={col.key} sx={{ flex: col.xs }}>
                      <Skeleton
                        variant="text"
                        width={`${55 + ((i * 13 + (col.key?.length ?? 3) * 7) % 35)}%`}
                        height={14}
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          )}
          {/* EMPTY */}
          {!loading && rows.length === 0 && (
            <Box
              sx={{
                height: 80,
                border: BASE_BORDER,
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {emptyText}
              </Typography>
            </Box>
          )}

          {/* DATA ROWS — alignItems="stretch" so all cells share row height */}
          {!loading &&
            rows.map((row, rowIndex) => {
              const key = rowKey ? rowKey(row, rowIndex) : (row.id ?? rowIndex);
              const extraSx = rowSx ? rowSx(row, rowIndex) : {};

              const paperNode = (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 0,
                    border: BASE_BORDER,
                    borderTop: "none",
                    overflow: "visible",
                    "&:hover": { background: "#FAFBFF" },
                    transition: "background 0.15s ease",
                    ...extraSx,
                  }}
                >
                  {/* ↓ stretch so tall cells (e.g. USP with error msg) push all siblings */}
                  <Grid container alignItems="stretch">
                    {columns.map((col, ci) => (
                      <Grid
                        key={col.key}
                        item
                        xs={col.xs}
                        sx={buildCellSx(col, {
                          isSummary: false,
                          isLast: ci === columns.length - 1,
                          row,
                          rowIndex,
                        })}
                      >
                        {renderCell(col, row, rowIndex)}
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              );

              return (
                <React.Fragment key={key}>
                  {wrap(row, rowIndex, paperNode)}
                </React.Fragment>
              );
            })}

          {/* SUMMARY ROW */}
          {!loading && summaryRow !== null && rows.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "0 0 10px 10px",
                border: BASE_BORDER,
                borderTop: "none",
                background: "#F0F4FA",
                overflow: "hidden",
              }}
            >
              <Grid container alignItems="stretch">
                {buildSummaryCells(columns).map(
                  ({ col, xs, spannedCols, isLast }) => {
                    const hasContent = hasSpanSummaryContent(spannedCols);
                    return (
                      <Grid
                        key={col.key}
                        item
                        xs={xs}
                        sx={{
                          ...buildCellSx(col, { isSummary: true, isLast }),
                          ...(!hasContent && { py: 0, minHeight: 0 }),
                        }}
                      >
                        {renderSummaryCell(col)}
                      </Grid>
                    );
                  },
                )}
              </Grid>
            </Paper>
          )}

          {/* FOOTER SLOT */}
          {footer && <Box sx={{ mt: 1 }}>{footer}</Box>}
        </Box>
      </Box>
    </Box>
  );
}

export default DataTable;
