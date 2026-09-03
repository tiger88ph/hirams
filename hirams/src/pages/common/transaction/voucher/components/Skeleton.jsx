import { Box, Skeleton, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { Inventory2Outlined } from "@mui/icons-material";
import getThemeColors from "../../../../../utils/style/getThemeColors";

// ── Plain neutral colors only — no accent colors in skeletons ──────────
const useColors = (c) => ({
  slate: {
    outerBg: c.slate.outerBg,
    mutedBg: c.slate.mutedBg,
    mutedBorder: c.slate.mutedBorder,
    divider: c.slate.divider,
  },
  gray: {
    textMuted: c.gray.textMuted,
  },
  skeleton: {
    base: c.skeleton.base,
    strong: c.skeleton.strong,
    soft: c.skeleton.soft,
  },
});

/**
 * Voucher Update Page Skeleton
 * Content only — no header/footer chrome, that's PageLayout's job.
 * Mirrors: Section label → Particulars list
 */
export function VoucherUpdateSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const rowCount = 3;

  return (
    <>
      <style>{`
        @keyframes voucher-update-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: ${isDark ? "0.75" : "0.85"}; }
        }
      `}</style>

      {/* ── Section Label + badge ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 0.5,
          mb: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Skeleton
            variant="text"
            width={90}
            height={10}
            sx={{ bgcolor: colors.skeleton.strong, my: 0 }}
          />
          <Skeleton
            variant="rounded"
            width={24}
            height={24}
            sx={{ bgcolor: colors.skeleton.base, borderRadius: "50%" }}
          />
        </Box>
        <Skeleton
          variant="rounded"
          width={85}
          height={22}
          sx={{ bgcolor: colors.slate.mutedBg, borderRadius: "50px" }}
        />
      </Box>

      {/* ── Particulars List ── */}
      <Box
        sx={{
          mb: 1.5,
          borderRadius: "10px",
          border: `0.5px solid ${colors.slate.mutedBorder}`,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: rowCount }).map((_, idx) => (
          <Box
            key={idx}
            sx={{
              px: 1.5,
              py: 0.875,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom:
                idx < rowCount - 1
                  ? `0.5px solid ${colors.slate.divider}`
                  : "none",
              animation: `voucher-update-pulse 1.8s ease-in-out ${idx * 0.1}s infinite`,
            }}
          >
            {/* Row number */}
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: colors.skeleton.strong,
                width: 16,
                textAlign: "center",
              }}
            >
              {idx + 1}
            </Typography>

            {/* Icon box */}
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "7px",
                background: colors.slate.mutedBg,
                border: `0.5px solid ${colors.slate.mutedBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Inventory2Outlined
                sx={{ fontSize: "0.85rem", color: colors.gray.textMuted }}
              />
            </Box>

            {/* Particulars text */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton
                variant="text"
                width="70%"
                height={10}
                sx={{ bgcolor: colors.skeleton.strong, my: 0 }}
              />
              <Skeleton
                variant="text"
                width="45%"
                height={7}
                sx={{ bgcolor: colors.skeleton.soft, my: 0, mt: 0.2 }}
              />
            </Box>

            {/* Amount */}
            <Skeleton
              variant="text"
              width={65}
              height={10}
              sx={{ bgcolor: colors.skeleton.base, flexShrink: 0, my: 0 }}
            />

            {/* Edit button */}
            <Skeleton
              variant="circular"
              width={20}
              height={20}
              sx={{ bgcolor: colors.skeleton.base, flexShrink: 0 }}
            />

            {/* Delete button */}
            <Skeleton
              variant="circular"
              width={20}
              height={20}
              sx={{ bgcolor: colors.skeleton.base, flexShrink: 0 }}
            />
          </Box>
        ))}
      </Box>
    </>
  );
}
