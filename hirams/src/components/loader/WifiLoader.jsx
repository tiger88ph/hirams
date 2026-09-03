import React, { useMemo } from "react";
import { Box, keyframes } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  front: c.violet.text,
  back: c.slate.mutedColor,
  text: c.gray.textSecondary,
});

// ─────────────────────────────────────────────────────────────────
// KEYFRAMES — ported 1:1 from the Uiverse "wifi-loader" CSS
// ─────────────────────────────────────────────────────────────────
const circleOuter = keyframes`
  0% { stroke-dashoffset: 25; }
  25% { stroke-dashoffset: 0; }
  65% { stroke-dashoffset: 301; }
  80% { stroke-dashoffset: 276; }
  100% { stroke-dashoffset: 276; }
`;

const circleMiddle = keyframes`
  0% { stroke-dashoffset: 17; }
  25% { stroke-dashoffset: 0; }
  65% { stroke-dashoffset: 204; }
  80% { stroke-dashoffset: 187; }
  100% { stroke-dashoffset: 187; }
`;

const circleInner = keyframes`
  0% { stroke-dashoffset: 9; }
  25% { stroke-dashoffset: 0; }
  65% { stroke-dashoffset: 106; }
  80% { stroke-dashoffset: 97; }
  100% { stroke-dashoffset: 97; }
`;

const textAnimation = keyframes`
  0% { clip-path: inset(0 100% 0 0); }
  50% { clip-path: inset(0); }
  100% { clip-path: inset(0 0 0 100%); }
`;

const WifiLoader = ({
  size = 64, // px, maps to the loader's overall box (outer svg is size + 22)
  frontColor, // maps to --front-color (defaults to theme violet)
  backColor, // maps to --back-color (defaults to theme muted/neutral)
  textColor, // maps to --text-color (defaults to theme secondary text)
  message = false,
  loadingText = "Searching",
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const resolvedFront = frontColor ?? colors.front;
  const resolvedBack = backColor ?? colors.back;
  const resolvedText = textColor ?? colors.text;

  const circleSx = {
    fill: "none",
    strokeWidth: "6px",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    transform: "rotate(-100deg)",
    transformOrigin: "center",
  };

  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: message ? 4.5 : 0,
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50px",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Outer ring */}
        <Box
          component="svg"
          viewBox="0 0 86 86"
          sx={{ position: "absolute", height: "86px", width: "86px", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <Box
            component="circle"
            cx="43" cy="43" r="40"
            sx={{ ...circleSx, stroke: resolvedBack, strokeDasharray: "62.75 188.25", animation: `${circleOuter} 1.8s ease infinite 0.3s` }}
          />
          <Box
            component="circle"
            cx="43" cy="43" r="40"
            sx={{ ...circleSx, stroke: resolvedFront, strokeDasharray: "62.75 188.25", animation: `${circleOuter} 1.8s ease infinite 0.15s` }}
          />
        </Box>

        {/* Middle ring */}
        <Box
          component="svg"
          viewBox="0 0 60 60"
          sx={{ position: "absolute", height: "60px", width: "60px", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <Box
            component="circle"
            cx="30" cy="30" r="27"
            sx={{ ...circleSx, stroke: resolvedBack, strokeDasharray: "42.5 127.5", animation: `${circleMiddle} 1.8s ease infinite 0.25s` }}
          />
          <Box
            component="circle"
            cx="30" cy="30" r="27"
            sx={{ ...circleSx, stroke: resolvedFront, strokeDasharray: "42.5 127.5", animation: `${circleMiddle} 1.8s ease infinite 0.1s` }}
          />
        </Box>

        {/* Inner ring */}
        <Box
          component="svg"
          viewBox="0 0 34 34"
          sx={{ position: "absolute", height: "34px", width: "34px", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <Box
            component="circle"
            cx="17" cy="17" r="14"
            sx={{ ...circleSx, stroke: resolvedBack, strokeDasharray: "22 66", animation: `${circleInner} 1.8s ease infinite 0.2s` }}
          />
          <Box
            component="circle"
            cx="17" cy="17" r="14"
            sx={{ ...circleSx, stroke: resolvedFront, strokeDasharray: "22 66", animation: `${circleInner} 1.8s ease infinite 0.05s` }}
          />
        </Box>
      </Box>

      {/* Label — data-text double-layer shine effect, same trick as the original CSS */}
      {message && (
        <Box
          data-text={loadingText}
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textTransform: "lowercase",
            fontWeight: 500,
            fontSize: "14px",
            letterSpacing: "0.2px",
            "&::before, &::after": { content: "attr(data-text)" },
            "&::before": { color: resolvedText },
            "&::after": {
              color: resolvedFront,
              animation: `${textAnimation} 3.6s ease infinite`,
              position: "absolute",
              left: 0,
            },
          }}
        />
      )}
    </Box>
  );
};

export default WifiLoader;