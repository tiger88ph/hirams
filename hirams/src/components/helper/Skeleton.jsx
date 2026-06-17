/**
 * Skeleton.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized skeleton/loading-state helpers.
 *
 * Exports:
 *  • DataTableSkeleton   — drop-in loading state for <DataTable>
 *  • TransactionSkeleton — full Transaction page skeleton
 *
 * Usage:
 *   import { DataTableSkeleton, TransactionSkeleton } from "./Skeleton";
 *
 *   // Inside DataTable (replaces the inline loading block):
 *   {loading && <DataTableSkeleton columns={columns} rows={5} />}
 *
 *   // Inside a Transaction page:
 *   if (loading) return <TransactionSkeleton />;
 */

import React from "react";
import { Box, Grid, Paper, Skeleton } from "@mui/material";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS  (mirror DataTable)
═══════════════════════════════════════════════════════════════════ */
const BASE_BORDER = "1px solid #DDE3EE";

/* ═══════════════════════════════════════════════════════════════════
   Primitive: animated shimmer cell
═══════════════════════════════════════════════════════════════════ */
function ShimmerCell({ flex, widthPct = 60, height = 14 }) {
  return (
    <Box sx={{ flex, px: 1, display: "flex", alignItems: "center" }}>
      <Skeleton
        variant="text"
        width={`${widthPct}%`}
        height={height}
        animation="wave"
        sx={{ borderRadius: 1 }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DataTableSkeleton
   ─────────────────────────────────────────────────────────────────
   Props:
     columns   ColumnDef[]   — same columns array passed to DataTable
     rows      number        — skeleton row count (default 5)
     hasHeader boolean       — show header shimmer (default true)
     minWidth  string        — matches DataTable's minWidth (default "900px")
═══════════════════════════════════════════════════════════════════ */
export function DataTableSkeleton({
  columns = [],
  rows = 5,
  hasHeader = true,
  minWidth = "900px",
}) {
  /* Seed widths so adjacent rows look different */
  const seedWidth = (rowIdx, colKey = "") =>
    55 + ((rowIdx * 13 + (colKey?.length ?? 3) * 7) % 35);

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Box sx={{ overflowX: "auto", pb: 1 }}>
        <Box sx={{ minWidth }}>
          {/* Header shimmer */}
          {hasHeader && (
            <Paper
              elevation={0}
              sx={{
                background: "#F0F4FA",
                borderRadius: "10px 10px 0 0",
                border: BASE_BORDER,
                borderBottom: "none",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0.6,
                }}
              >
                {columns.map((col) => (
                  <Box key={col.key} sx={{ flex: col.xs, px: 1 }}>
                    <Skeleton
                      variant="text"
                      width="50%"
                      height={12}
                      animation="wave"
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Data rows */}
          <Box sx={{ border: BASE_BORDER, borderTop: "none" }}>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <Box
                key={rowIdx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0.75,
                  background: rowIdx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  borderBottom: rowIdx < rows - 1 ? BASE_BORDER : "none",
                }}
              >
                {columns.map((col) => (
                  <ShimmerCell
                    key={col.key}
                    flex={col.xs}
                    widthPct={seedWidth(rowIdx, col.key)}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   CustomTableSkeleton
   ─────────────────────────────────────────────────────────────────
   Drop-in replacement for the inline SkeletonRow / TableLoadingState
   inside CustomTable.  Mirrors the exact chrome of CustomTable:
     • gradient header row with # column + all data columns
     • banded data rows with left accent border
     • seeded shimmer widths so adjacent rows look naturally varied
     • DotSpinner fallback when useSkeleton=false (same as original)
 
   Props:
     columns      ColumnDef[]  — same columns array passed to CustomTable
     rows         number       — skeleton row count; capped at 6 (default 5)
     useSkeleton  boolean      — false → renders DotSpinner instead (default true)
═══════════════════════════════════════════════════════════════════ */
export function CustomTableSkeleton({
  columns = [],
  rows = 5,
  useSkeleton = true,
}) {
  const clampedRows = Math.min(rows > 0 ? rows : 5, 6);
  const seedWidth = (rowIdx, colKey = "", colIdx = 0) =>
    55 + ((rowIdx * 13 + (colKey?.length ?? colIdx) * 7) % 35);

  if (!useSkeleton) {
    /* Mirrors the DotSpinner fallback in TableLoadingState */
    return (
      <Box sx={{ p: 1.5, textAlign: "center", background: "#fafafa" }}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={1}
        >
          {/* Inline pulse dots — no DotSpinner import needed here */}
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="circular"
              width={8}
              height={8}
              animation="wave"
              sx={{ display: "inline-block", mx: 0.25 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <>
      {Array.from({ length: clampedRows }).map((_, rowIdx) => (
        <Box
          key={`ct-skeleton-${rowIdx}`}
          sx={{
            px: 1.5,
            py: 0.75,
            background: rowIdx % 2 === 0 ? "#ffffff" : "#f9fafb",
            borderLeft: "3px solid #e2e8f0", // mirrors CustomTable accent
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* # column */}
            <Box
              sx={{ width: "40px", display: "flex", justifyContent: "center" }}
            >
              <Skeleton
                variant="text"
                width={18}
                height={14}
                animation="wave"
                sx={{ borderRadius: 1 }}
              />
            </Box>

            {/* Data columns */}
            {columns.map((col, ci) => (
              <Box
                key={col.key ?? `ct-sk-col-${ci}`}
                sx={{ flex: col.xs ?? 1, px: 0.5 }}
              >
                <Skeleton
                  variant="text"
                  width={`${seedWidth(rowIdx, col.key, ci)}%`}
                  height={14}
                  animation="wave"
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PurchasePageSkeleton
   ─────────────────────────────────────────────────────────────────
   Loading state for the canvas tab inside TransactionForPurchase.
   Mirrors the exact layout of PurchaseItemsTable:
     • Transaction details card  (icon + text + avatar)
     • Section label + status badge row
     • Table header row          (4 flex columns)
     • 5 banded item rows        (checkbox + name / badge / value / action)
═══════════════════════════════════════════════════════════════════ */
export function PurchasePageSkeleton() {
  return (
    <Box>
      {/* ── Transaction details card ── */}
      <Box
        sx={{
          mb: 1, p: 1.5,
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          background: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Skeleton variant="rounded" width={30} height={30} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rounded" width={120} height={14} sx={{ mb: 0.75, borderRadius: "5px" }} />
            <Skeleton variant="text" width="60%" height={12} />
          </Box>
          <Skeleton variant="circular" width={52} height={52} sx={{ flexShrink: 0 }} />
        </Box>
      </Box>
 
      {/* ── Section label + status badge ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Skeleton variant="rounded" width={110} height={16} sx={{ borderRadius: "4px" }} />
        <Skeleton variant="rounded" width={80}  height={22} sx={{ borderRadius: "6px" }} />
      </Box>
 
      {/* ── Table header ── */}
      <Box
        sx={{
          display: "flex", alignItems: "center",
          px: 1.5, py: 0.75,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          borderBottom: "none",
          gap: 1,
        }}
      >
        {[42, 28, 16, 8].map((flex, i) => (
          <Box
            key={i}
            sx={{ flex, display: "flex", justifyContent: i === 0 ? "flex-start" : "center" }}
          >
            <Skeleton variant="text" width="55%" height={11} />
          </Box>
        ))}
      </Box>
 
      {/* ── Item rows ── */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex", alignItems: "center",
            px: 1.5, py: 0.9,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderTop: "none",
            borderLeft: "4px solid #bfdbfe",
            gap: 1,
            ...(i === 4 && {
              borderBottomLeftRadius: "10px",
              borderBottomRightRadius: "10px",
            }),
          }}
        >
          {/* Name column — checkbox + text */}
          <Box sx={{ flex: 42, display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton variant="rounded" width={16} height={16} sx={{ flexShrink: 0 }} />
            <Skeleton
              variant="text"
              width={`${55 + (i % 3) * 15}%`}
              height={13}
              sx={{ borderRadius: "4px" }}
            />
          </Box>
 
          {/* Status badge column */}
          <Box sx={{ flex: 28, px: 1 }}>
            <Skeleton
              variant="rounded"
              height={18}
              sx={{
                borderRadius: "99px",
                width: `${40 + (i % 4) * 15}%`,
                mx: "auto",
              }}
            />
          </Box>
 
          {/* Value column */}
          <Box sx={{ flex: 16, display: "flex", justifyContent: "center" }}>
            <Skeleton variant="text" width={56} height={13} />
          </Box>
 
          {/* Action column */}
          <Box sx={{ flex: 8, display: "flex", justifyContent: "center" }}>
            <Skeleton variant="circular" width={20} height={20} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
 /* ═══════════════════════════════════════════════════════════════════
   PurchaseCartSkeleton
   ─────────────────────────────────────────────────────────────────
   Loading state for TransactionPurchaseCart.
   Two-column grid of 3 POCards each — mirrors the card layout with
   header, 3 line-item rows, and a footer.
═══════════════════════════════════════════════════════════════════ */
export function PurchaseCartSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 0.5,
        width: "100%",
        alignItems: "flex-start",
      }}
    >
      {[0, 1].map((col) => (
        <Box
          key={col}
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, minWidth: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ border: "0.5px solid #E5E7EB", borderRadius: 2, overflow: "hidden" }}>
              {/* Card header */}
              <Box sx={{ px: 1.5, py: 0.875, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <Skeleton variant="circular" width={12} height={12} />
                    <Skeleton variant="text" width={110} height={14} />
                    <Skeleton variant="rounded" width={20} height={14} sx={{ borderRadius: "50px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Skeleton variant="rounded" width={55} height={14} sx={{ borderRadius: "4px" }} />
                    <Skeleton variant="rounded" width={55} height={14} sx={{ borderRadius: "4px" }} />
                    <Skeleton variant="rounded" width={45} height={14} sx={{ borderRadius: "4px" }} />
                  </Box>
                </Box>
                <Skeleton variant="rounded" width={22} height={22} sx={{ borderRadius: "50px" }} />
              </Box>

              {/* Line item rows */}
              {[0, 1, 2].map((row) => (
                <Box
                  key={row}
                  sx={{
                    px: 1.5, py: 0.875,
                    display: "flex", alignItems: "center", gap: 1.25,
                    borderTop: "0.5px solid #F3F4F6",
                  }}
                >
                  <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "8px", flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="65%" height={13} />
                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.3 }}>
                      <Skeleton variant="rounded" width={38} height={11} sx={{ borderRadius: "3px" }} />
                      <Skeleton variant="text" width={55} height={11} />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Skeleton variant="text" width={58} height={13} />
                    <Skeleton variant="text" width={42} height={11} />
                  </Box>
                </Box>
              ))}

              {/* Card footer */}
              <Box
                sx={{
                  borderTop: "0.5px solid #E5E7EB",
                  px: 1.5, py: 0.875,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <Skeleton variant="text" width={75} height={11} />
                <Skeleton variant="text" width={65} height={16} />
              </Box>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   PurchaseCartModalSkeleton
   ─────────────────────────────────────────────────────────────────
   Full loading state for PurchaseCartUpdateStatusModal (LoadingSkeleton).
   Covers: stepper row, dark header card (company/supplier/PO row), 
   section divider, 3 line-item rows, and a dark footer total.
═══════════════════════════════════════════════════════════════════ */
export function PurchaseCartModalSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Stepper */}
      <Box sx={{ background: "linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)", borderBottom: "0.5px solid #e2e8f0", px: 2, pt: 1.25, pb: 1.75 }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {[0,1,2,3,4].map((i) => (
            <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Skeleton variant="circular" width={22} height={22} />
              <Skeleton variant="text" width="70%" height={9} />
              <Skeleton variant="text" width="50%" height={8} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Dark header */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Box sx={{ background: "linear-gradient(160deg, #1a2f4e 0%, #142540 60%, #0f1e33 100%)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", p: 1.5 }}>
          {/* Company + Supplier cards */}
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            {[0, 1].map((i) => (
              <Box key={i} sx={{ flex: 1, px: 1, py: 0.85, borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.5 }}>
                  <Skeleton variant="circular" width={10} height={10} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
                  <Skeleton variant="text" width={45} height={10} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
                </Box>
                <Skeleton variant="text" width="80%" height={12} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
                <Skeleton variant="text" width="60%" height={10} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
                <Skeleton variant="text" width="45%" height={10} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
              </Box>
            ))}
          </Box>
          {/* PO row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: "7px", flexShrink: 0, bgcolor: "rgba(255,255,255,0.08)" }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="55%" height={14} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                <Skeleton variant="rounded" width={70} height={18} sx={{ borderRadius: "50px", bgcolor: "rgba(255,255,255,0.08)" }} />
                <Skeleton variant="text" width={35} height={10} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.625 }}>
              <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: "6px", bgcolor: "rgba(255,255,255,0.08)" }} />
              <Skeleton variant="rounded" width={68} height={24} sx={{ borderRadius: "6px", bgcolor: "rgba(255,255,255,0.08)" }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Section divider */}
      <Box sx={{ px: 2, pt: 1, pb: 0.5, display: "flex", alignItems: "center", gap: 0.75 }}>
        <Skeleton variant="text" width={35} height={10} />
        <Box sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }} />
      </Box>

      {/* Line items */}
      <Box sx={{ mx: 1.5, mb: 1.5, borderRadius: "10px", border: "0.5px solid #E5E7EB", overflow: "hidden" }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ px: 1.5, py: 0.875, display: "flex", alignItems: "center", gap: 1, borderBottom: i < 2 ? "0.5px solid #F3F4F6" : "none" }}>
            <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "8px", flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.3 }}>
                <Skeleton variant="rounded" width={30} height={11} sx={{ borderRadius: "3px" }} />
                <Skeleton variant="text" width={`${50 + i * 12}%`} height={13} />
              </Box>
              <Skeleton variant="text" width="45%" height={10} />
              <Skeleton variant="text" width="30%" height={9} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44 }}>
              <Skeleton variant="text" width={20} height={13} />
              <Skeleton variant="text" width={24} height={10} />
            </Box>
            <Box sx={{ width: 80, textAlign: "right" }}>
              <Skeleton variant="text" width="80%" height={13} sx={{ ml: "auto" }} />
              <Skeleton variant="text" width="55%" height={10} sx={{ ml: "auto" }} />
            </Box>
          </Box>
        ))}
        {/* Dark footer total */}
        <Box sx={{ px: 1.5, py: 0.875, display: "flex", alignItems: "center", gap: 1, background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)" }}>
          <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "8px", flexShrink: 0, bgcolor: "rgba(255,255,255,0.08)" }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={12} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            <Skeleton variant="text" width="25%" height={10} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
          </Box>
          <Box sx={{ width: 44, flexShrink: 0 }} />
          <Box sx={{ width: 80, textAlign: "right" }}>
            <Skeleton variant="text" width="85%" height={14} sx={{ ml: "auto", bgcolor: "rgba(255,255,255,0.1)" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   VoucherUpdateModalSkeleton
   ─────────────────────────────────────────────────────────────────
   Loading state for VoucherUpdateModal (LoadingSkeleton).
   Covers: dark header with 2 info cards, section divider,
   3 PO rows with icon + text + actions.
═══════════════════════════════════════════════════════════════════ */
export function VoucherUpdateModalSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Dark header */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Box sx={{ background: "linear-gradient(160deg, #1a2f4e 0%, #0f1e33 100%)", borderRadius: "16px", p: 1.5 }}>
          {/* Two info cards */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {[0, 1].map((i) => (
              <Box key={i} sx={{ flex: 1, px: 1, py: 0.85, borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.5 }}>
                  <Skeleton variant="circular" width={10} height={10} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
                  <Skeleton variant="text" width={45} height={10} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
                </Box>
                <Skeleton variant="text" width="80%" height={12} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
                <Skeleton variant="text" width="55%" height={10} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Section divider */}
      <Box sx={{ px: 2, pt: 1, pb: 0.5, display: "flex", alignItems: "center", gap: 0.75 }}>
        <Skeleton variant="text" width={60} height={10} />
        <Box sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }} />
      </Box>

      {/* PO rows */}
      <Box sx={{ mx: 1.5, mb: 1.5, borderRadius: "10px", border: "0.5px solid #E5E7EB", overflow: "hidden" }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ px: 1.5, py: 0.875, display: "flex", alignItems: "center", gap: 1, borderBottom: i < 2 ? "0.5px solid #F3F4F6" : "none" }}>
            <Skeleton variant="text" width={16} height={12} />
            <Skeleton variant="rounded" width={30} height={30} sx={{ borderRadius: "7px" }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={`${45 + i * 15}%`} height={13} />
              <Skeleton variant="text" width="25%" height={10} sx={{ mt: 0.3 }} />
            </Box>
            <Skeleton variant="text" width={55} height={13} />
            <Skeleton variant="rounded" width={20} height={20} sx={{ borderRadius: "50px" }} />
            <Skeleton variant="rounded" width={20} height={20} sx={{ borderRadius: "4px" }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   DEFAULT EXPORT — named map for convenience
   import Skeletons from "./Skeleton"
   <Skeletons.DataTable columns={…} />
   <Skeletons.Transaction />
   <Skeletons.CustomTable columns={…} />
   <Skeletons.PurchasePage />
═══════════════════════════════════════════════════════════════════ */
const Skeletons = {
  DataTable: DataTableSkeleton,
  CustomTable: CustomTableSkeleton,
  PurchasePage: PurchasePageSkeleton,
    PurchaseCart: PurchaseCartSkeleton,  // ← add
    PurchaseCartModal: PurchaseCartModalSkeleton,
    VoucherUpdateModal: VoucherUpdateModalSkeleton,
};
 


export default Skeletons;
