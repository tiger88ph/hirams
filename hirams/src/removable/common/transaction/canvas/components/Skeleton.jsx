import { Box, Skeleton, useTheme } from "@mui/material";
import { useMemo } from "react";
import getThemeColors from "../../../../../utils/style/getThemeColors";


// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  rowBorderLeft: c.slate.borderAccent || c.slate.border,
  rowBorderBottom: c.slate.borderSoft || c.slate.border,
});


// ── Transaction Items Table Skeleton ──────────────────────────────
export const TransactionItemsTableSkeleton = ({ rows = 5 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  return (
    <Box sx={{ borderRadius: "10px", overflow: "hidden" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1.5,
            py: 1.1,
            borderLeft: `4px solid ${colors.rowBorderLeft}`,
            borderBottom:
              i < rows - 1 ? `1px solid ${colors.rowBorderBottom}` : "none",
          }}
        >
          <Skeleton variant="circular" width={18} height={18} />
          <Skeleton variant="text" width="35%" height={18} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="text" width={50} height={18} />
          <Skeleton variant="text" width={70} height={18} />
          <Skeleton variant="rounded" width={28} height={20} sx={{ borderRadius: "5px" }} />
        </Box>
      ))}
    </Box>
  );
};