import React, { useMemo } from "react";
import { Card, Typography, Box, useTheme } from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  cardBg: c.slate.hoverBg || c.slate.mutedBg,
  titleColor: c.gray.textPrimary,
  borderColor: c.slate.border,
});

export default function ChartStructure({ title, height = 300, children }) {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === "dark";

  // Theme resolution — memoized
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  return (
    <Card
      elevation={0}
      sx={{
        height,
        display: "flex",
        flexDirection: "column",
        p: 2,
        bgcolor: colors.cardBg,
        border: `1px solid ${colors.borderColor}`,
        borderRadius: 2,
      }}
    >
      {title && (
        <Typography
          variant="subtitle1"
          mb={1}
          sx={{
            color: colors.titleColor,
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {title}
        </Typography>
      )}

      {/* ✅ THIS BOX FIXES RECHARTS — flex:1 + minHeight:0 prevents overflow */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </Card>
  );
}