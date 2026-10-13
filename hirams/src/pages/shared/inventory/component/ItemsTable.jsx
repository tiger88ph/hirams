import { Fragment, useMemo } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import {
  Visibility,
  ReceiptLongOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";
import getThemeColors from "../../../../utils/style/getThemeColors.js";
import { fmtPHP, fmtQty } from "../../../../utils/formatters/formatter.js";
import {
  itemTotal,
  hasDeliveredRows,
  rowTransactionItemId,
  rowTransactionId,
} from "../itemRows.js";
import PickableValue from "../../jev/components/AmountPick.jsx";
// ─────────────────────────────────────────────────────────────────────
// THE INVENTORY "ITEMS" TABLE
// The voucher-particulars layout (sticky column header, scrollable rows,
// Grand Total bar) that answers one question everywhere it is used — WHICH
// batches does this JEV cover?
//
//   • the Pending JEV drill-down      → interactive, rows open the item,
//                                       ACTIONS column shown;
//   • the "Add / Edit Entry" modal    → read-only, scoped to that JEV's own
//                                       rows (a click there would unmount
//                                       the very form being filled in);
//   • the shared read-only JEV viewer → read-only, for JEVs with no voucher
//                                       behind them, so its Particulars
//                                       block never comes up empty.
//
// Self-contained: it paints its own theme colours, so a host only hands
// over `rows` + `total` (+ `sellingPrices` on the DELIVERED side, which
// adds UNIT SELLING PRICE and TOTAL SELLING PRICE — a price only means
// something once the batch has gone out, so a received table stays as it
// was).
// ─────────────────────────────────────────────────────────────────────

// Cell geometry is SHARED by the column header and the item rows so every
// title sits exactly above its own data column. QTY / UNIT PRICE / TOTAL /
// ACTIONS all use ONE width so the columns line up evenly.
const COL_W = 90;

const cellSx = (width, align = "left") => ({
  width,
  flexShrink: 0,
  textAlign: align,
});

// ONLY the tokens this table paints with. Named `makeColors` (not
// `useColors`) so calling it inside useMemo doesn't trip
// react-hooks/rules-of-hooks — same trick JevListView uses.
const makeColors = (c) => ({
  border: c.slate.border,
  itemHeaderBg: c.slate.itemHeaderBg,
  divider: c.slate.divider,
  hover: c.slate.hover,
  outerBg: c.slate.outerBg,
  scrollbarThumb: c.slate.scrollbarThumb,
  totalBg: c.slate.totalBg,
  totalBorder: c.slate.totalBorder,
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
  purple: { bg: c.purple.bg, border: c.purple.border, text: c.purple.text },
  blue: { text: c.blue.text },
  orange: { text: c.orange.text },
  // foreground for the count badge that sits on gray.textSecondary
  textOnFill: c.gray.textOnFill,
});

// `wrap` lets the longer selling-price titles break onto a second line
// instead of punching through a column that is only COL_W wide — the
// header cell keeps the exact width of the cell it labels either way.
const HeaderCell = ({
  label,
  colors,
  width,
  grow = false,
  align = "left",
  wrap = false,
}) => (
  <Box
    sx={{
      // Matches the data cell it labels: fixed columns never shrink,
      // the grow column stretches the same way on every breakpoint.
      ...(grow
        ? { flex: { sm: 1 }, minWidth: { xs: 180, sm: 0 } }
        : cellSx(width)),
      textAlign: align,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.55rem",
        fontWeight: 700,
        color: colors.gray.textSecondary,
        letterSpacing: "0.03em",
        whiteSpace: wrap ? "normal" : "nowrap",
      }}
    >
      {label}
    </Typography>
  </Box>
);

// Icon square + overlapping sequence badge
const RowIcon = ({ icon, index, colors, tint }) => (
  <Box sx={{ position: "relative", flexShrink: 0 }}>
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "7px",
        background: tint.bg,
        border: `0.5px solid ${tint.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Box
      sx={{
        position: "absolute",
        top: -5,
        left: -5,
        minWidth: 13,
        height: 13,
        px: 0.25,
        borderRadius: "50px",
        background: colors.gray.textSecondary,
        border: `1.5px solid ${colors.outerBg}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.4rem",
          fontWeight: 600,
          color: colors.textOnFill,
          lineHeight: 1,
        }}
      >
        {index + 1}
      </Typography>
    </Box>
  </Box>
);

// Sticky Grand Total bar — identical shell to the voucher particulars
// footer. On the delivered side it also sums the TOTAL SELLING PRICE
// column (sellingTotal = null hides that line, so a received table looks
// exactly as it always did).
const TotalFooter = ({
  colors,
  count,
  countLabel,
  amount,
  sellingTotal = null,
}) => {
  const rows = [
    {
      label: "Total Purchase Price",
      value: fmtPHP(amount),
      raw: amount,
      color: colors.orange.text,
    },
    ...(sellingTotal != null
      ? [
          {
            label: "Total Selling Price",
            value: fmtPHP(sellingTotal),
            raw: sellingTotal,
            color: colors.gray.textPrimary,
          },
        ]
      : []),
  ];

  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.875,
        display: "flex",
        alignItems: "center",
        background: colors.totalBg,
        borderTop: `1px solid ${colors.totalBorder}`,
        flexShrink: 0,
        zIndex: 5,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: "7px",
          background: colors.purple.bg,
          border: `0.5px solid ${colors.purple.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mr: 1,
          flexShrink: 0,
        }}
      >
        <ReceiptLongOutlined
          sx={{ fontSize: "0.85rem", color: colors.purple.text }}
        />
      </Box>

      {/* LEFT: title + item count */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.67rem",
            fontWeight: 700,
            color: colors.gray.textPrimary,
          }}
        >
          Grand Total
        </Typography>
        <Typography
          sx={{ fontSize: "0.54rem", color: colors.gray.textSecondary }}
        >
          {count} {countLabel}
        </Typography>
      </Box>

      {/* RIGHT: Label: Value pairs */}
      <Box
        sx={{
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 1.5,
          rowGap: 0.35,
          alignItems: "baseline",
        }}
      >
        {rows.map(({ label, value, raw, color }) => (
          <Fragment key={label}>
            <Typography
              sx={{
                fontSize: "0.58rem",
                fontWeight: 600,
                color: colors.gray.textSecondary,
                textAlign: "right",
              }}
            >
              {label}:
            </Typography>
            {/* Click-to-fill (entry modal only — see AmountPick.jsx) */}
            <PickableValue
              value={raw}
              sx={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color,
                textAlign: "right",
              }}
            >
              {value}
            </PickableValue>
          </Fragment>
        ))}
      </Box>
    </Box>
  );
};

// The unit selling price of ONE row: undefined = nothing to show (the
// lookup hasn't reached it, the row has no transaction item, or its set
// carries no price) — printed as a dash instead of a made-up ₱0.00.
const unitSellingPriceOf = (row, prices) => {
  const id = rowTransactionItemId(row);
  if (id == null) return undefined;
  return prices?.[String(id)];
};

// The row's share of the TOTAL SELLING PRICE column = unit × qty (qty is
// already absolute on a mapped row). Unknown price stays unknown so the
// cell prints a dash instead of a ₱0.00 nobody set.
const rowSellingTotal = (row, prices) => {
  const unit = unitSellingPriceOf(row, prices);
  return unit === undefined ? undefined : unit * Number(row.nQuantity ?? 0);
};

const fmtSelling = (value) => (value === undefined ? "—" : fmtPHP(value));

export default function ItemsTable({
  rows = [],
  total = 0,
  // Read-only hosts (the entry modal, the shared JEV viewer) pass no
  // onRowClick: no ACTIONS column, no hover, no pointer cursor.
  readonly = false,
  onRowClick = null,
  // nTransactionItemId → unit selling price, from useSellingPrices.
  // Only read on the delivered side, so a host may just always pass it.
  sellingPrices = {},
  // null = decide from the rows themselves (a delivered batch shows the
  // selling columns, nothing else does). false is for a host that KNOWS
  // its view is the RECEIVED side even though a delivered aggregate sits
  // in it — the shared JEV viewer passes it for an R JEV, whose table is
  // the batches received under that JEV, valued at cost.
  showSellingOverride = null,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => makeColors(base), [base]);

  const interactive = !readonly && typeof onRowClick === "function";

  const showSelling = showSellingOverride ?? hasDeliveredRows(rows);

  console.log(
    rows[0] && {
      showSelling,
      txn: rowTransactionId(rows[0]),
      item: rowTransactionItemId(rows[0]),
      sellingPrices,
    },
  );
  const sellingTotal = useMemo(() => {
    if (!showSelling) return null;
    let known = false;
    const sum = rows.reduce((acc, row) => {
      const value = rowSellingTotal(row, sellingPrices);
      if (value !== undefined) known = true;
      return acc + Number(value ?? 0);
    }, 0);
    // Nothing priced yet (the prices arrive after first paint) — print no
    // line at all rather than a ₱0.00 under a column of dashes.
    return known ? sum : null;
  }, [rows, showSelling, sellingPrices]);

  const headerSx = {
    px: 2,
    py: 1,
    display: "flex",
    alignItems: "center",
    gap: 1,
    // Same wrapping rules as the item rows, so headers stay lined up
    // with their columns on narrow screens too.
    flexWrap: { xs: "wrap", sm: "nowrap" },
    background: colors.itemHeaderBg,
    borderBottom: `0.5px solid ${colors.divider}`,
    position: "sticky",
    top: 0,
    zIndex: 1,
  };
  const panelSx = {
    mb: 1.5,
    borderRadius: "10px",
    border: `0.5px solid ${colors.border}`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxHeight: "60vh",
  };
  const scrollSx = {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    "&::-webkit-scrollbar": { width: 3 },
    "&::-webkit-scrollbar-thumb": {
      background: colors.scrollbarThumb,
      borderRadius: 2,
    },
  };
  const valueSx = {
    fontSize: "0.66rem",
    fontWeight: 700,
    color: colors.gray.textSecondary,
  };
  const actionBtnSx = {
    width: 20,
    height: 20,
    color: colors.blue.text,
    opacity: 0.6,
    p: 0,
  };

  if (!rows.length) {
    return (
      <Box
        sx={{
          mb: 1.5,
          borderRadius: "10px",
          border: `0.5px solid ${colors.border}`,
          px: 2,
          py: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: "0.65rem", color: colors.gray.textMuted }}>
          No items found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={panelSx}>
      <Box sx={scrollSx}>
        {/* COLUMN HEADER */}
        <Box sx={headerSx}>
          <Box sx={{ width: 30, flexShrink: 0 }} />
          <HeaderCell label="BRAND | MODEL" colors={colors} grow />
          <HeaderCell
            label="QTY"
            colors={colors}
            width={COL_W}
            align="center"
          />
          <HeaderCell
            label="PURCHASE PRICE"
            colors={colors}
            width={COL_W}
            align="right"
            wrap
          />
          {showSelling && (
            <HeaderCell
              label="SELLING PRICE"
              colors={colors}
              width={COL_W}
              align="right"
              wrap
            />
          )}
          <HeaderCell
            label="TOTAL PURCHASE"
            colors={colors}
            width={COL_W}
            align="right"
            wrap
          />
          {showSelling && (
            <HeaderCell
              label="TOTAL SELLING"
              colors={colors}
              width={COL_W}
              align="right"
              wrap
            />
          )}
          {interactive && (
            <HeaderCell
              label="ACTIONS"
              colors={colors}
              width={COL_W}
              align="center"
            />
          )}
        </Box>

        {rows.map((row, idx) => {
          const isLast = idx === rows.length - 1;
          return (
            <Box
              key={row.id ?? `item-${idx}`}
              onClick={interactive ? () => onRowClick(row) : undefined}
              sx={{
                px: 2,
                py: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "space-between",
                flexWrap: { xs: "wrap", sm: "nowrap" },
                borderBottom: isLast ? "none" : `0.5px solid ${colors.divider}`,
                cursor: interactive ? "pointer" : "default",
                "&:hover": interactive
                  ? { background: colors.hover }
                  : undefined,
              }}
            >
              {/* LEFT: icon + brand/model + date */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flex: { sm: 1 },
                  minWidth: { xs: 180, sm: 0 },
                }}
              >
                <RowIcon
                  colors={colors}
                  tint={colors.purple}
                  index={idx}
                  icon={
                    <Inventory2Outlined
                      sx={{
                        fontSize: "0.85rem",
                        color: colors.purple.text,
                      }}
                    />
                  }
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: colors.gray.textPrimary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.strBrandModel}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.56rem",
                      color: colors.gray.textMuted,
                      mt: 0.1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.dtLog}
                  </Typography>
                </Box>
              </Box>

              {/* QTY | PURCHASE PRICE | SELLING PRICE | TOTAL PURCHASE | TOTAL SELLING | ACTIONS */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                {/* QTY */}
                <Box sx={cellSx(COL_W, "center")}>
                  <Typography sx={valueSx}>
                    {fmtQty(row.nQuantity)}{" "}
                    <Typography
                      component="span"
                      sx={{ fontSize: "0.5rem", color: valueSx.color }}
                    >
                      {row.strUOM}
                    </Typography>
                  </Typography>
                </Box>

                {/* PURCHASE PRICE */}
                <Box sx={cellSx(COL_W, "right")}>
                  <PickableValue
                    value={Number(
                      row._raw?.purchaseOption?.dUnitPrice ?? 0,
                    )}
                    sx={valueSx}
                  >
                    {fmtPHP(Number(row._raw?.purchaseOption?.dUnitPrice ?? 0))}
                  </PickableValue>
                </Box>

                {/* SELLING PRICE — delivered rows only */}
                {showSelling && (
                  <Box sx={cellSx(COL_W, "right")}>
                    <PickableValue
                      value={unitSellingPriceOf(row, sellingPrices)}
                      sx={valueSx}
                    >
                      {fmtSelling(unitSellingPriceOf(row, sellingPrices))}
                    </PickableValue>
                  </Box>
                )}

                {/* TOTAL PURCHASE PRICE */}
                <Box sx={cellSx(COL_W, "right")}>
                  <PickableValue value={itemTotal(row)} sx={valueSx}>
                    {fmtPHP(itemTotal(row))}
                  </PickableValue>
                </Box>

                {/* TOTAL SELLING PRICE — delivered rows only */}
                {showSelling && (
                  <Box sx={cellSx(COL_W, "right")}>
                    <PickableValue
                      value={rowSellingTotal(row, sellingPrices)}
                      sx={valueSx}
                    >
                      {fmtSelling(rowSellingTotal(row, sellingPrices))}
                    </PickableValue>
                  </Box>
                )}

                {/* ACTIONS */}
                {interactive && (
                  <Box
                    sx={{
                      ...cellSx(COL_W),
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(row);
                      }}
                      sx={actionBtnSx}
                    >
                      <Visibility sx={{ fontSize: "0.75rem" }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <TotalFooter
        colors={colors}
        count={rows.length}
        countLabel={rows.length === 1 ? "item" : "items"}
        amount={total}
        sellingTotal={sellingTotal}
      />
    </Box>
  );
}
