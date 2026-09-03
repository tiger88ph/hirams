import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import getThemeColors from "../../utils/style/getThemeColors";

// ── Theme map — only tokens this component actually uses ──────────────────
const useColors = (c) => ({
  progressTrack: c.slate.mutedBg,
  green: {
    bgSoft: c.green.bgSoft,
    paid: c.green.paid,
  },
  blue: {
    bgSoft: c.blue.bgSoft,
    textStrong: c.blue.textStrong,
  },
});

/**
 * ProgressBar
 *
 * Animated horizontal progress bar with a centered percentage label.
 * Turns green + shows a "paid" tint once `value >= doneThreshold`.
 *
 * Props:
 *  - value: number (0-100)
 *  - doneThreshold: number, defaults to 100 — value at/above this is treated as "done"
 *  - height: number, bar height in px, defaults to 18
 *  - showLabel: boolean, whether to render the "%" label, defaults to true
 *  - sx: additional sx applied to the outer wrapper
 */
function ProgressBar({
  value = 0,
  doneThreshold = 100,
  height = 18,
  showLabel = true,
  sx = {},
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const done = safeValue >= doneThreshold;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        px: 1,
        ...sx,
      }}
    >
      <Box
        sx={{
          flex: 1,
          height,
          background: colors.progressTrack,
          borderRadius: "99px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <style>{`@keyframes progressBarSlide { from { background-position: 0 0; } to { background-position: 20px 0; } }`}</style>
        <Box
          sx={{
            width: `${safeValue}%`,
            height: "100%",
            borderRadius: "99px",
            position: "relative",
            overflow: "hidden",
            background: done
              ? `linear-gradient(90deg,${colors.green.bgSoft},${colors.green.paid})`
              : `linear-gradient(90deg,${colors.blue.bgSoft},${colors.blue.textStrong})`,
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.2) 4px,rgba(255,255,255,0.2) 8px)",
              backgroundSize: "20px 20px",
              animation: "progressBarSlide 0.6s linear infinite",
            },
            transition: "width 0.4s ease",
          }}
        />
        {showLabel && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color:
                  safeValue > 45
                    ? "#fff"
                    : done
                      ? colors.green.paid
                      : colors.blue.textStrong,
                lineHeight: 1,
                textShadow:
                  safeValue > 45 ? "0 1px 2px rgba(0,0,0,0.25)" : "none",
                transition: "color 0.3s",
              }}
            >
              {safeValue}%
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ProgressBar;
