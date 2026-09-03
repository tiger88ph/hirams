import React, { useMemo, useState, useEffect } from "react";
import { Box, keyframes, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  ball1: c.violet.text,
  ball2: c.cyan.text,
});

// ─────────────────────────────────────────────────────────────────
// KEYFRAMES — ported 1:1 from the provided .loader CSS
// ─────────────────────────────────────────────────────────────────
const rotate = keyframes`
  0% { transform: rotate(0deg) scale(0.8); }
  50% { transform: rotate(360deg) scale(1.2); }
  100% { transform: rotate(720deg) scale(0.8); }
`;

const ball1 = keyframes`
  0% { box-shadow: calc(30 * var(--size)) 0 0 var(--color-2); }
  50% {
    box-shadow: 0 0 0 var(--color-2);
    margin-bottom: 0;
    transform: translate(calc(15 * var(--size)), calc(15 * var(--size)));
  }
  100% {
    box-shadow: calc(30 * var(--size)) 0 0 var(--color-2);
    margin-bottom: calc(10 * var(--size));
  }
`;

const ball2 = keyframes`
  0% { box-shadow: calc(30 * var(--size)) 0 0 var(--color-1); }
  50% {
    box-shadow: 0 0 0 var(--color-1);
    margin-top: calc(-20 * var(--size));
    transform: translate(calc(15 * var(--size)), calc(15 * var(--size)));
  }
  100% {
    box-shadow: calc(30 * var(--size)) 0 0 var(--color-1);
    margin-top: 0;
  }
`;

// ── Label keyframes — kept exactly like the original DotSpinner ──
const fadeInUp = keyframes`
 0% { opacity: 0; transform: translateY(9px); }
 18% { opacity: 1; transform: translateY(0); }
 80% { opacity: 1; transform: translateY(0); }
 100% { opacity: 0; transform: translateY(-8px); }
`;

const shimmer = keyframes`
 0% { background-position: -200% center; }
 100% { background-position: 200% center; }
`;

const MESSAGES = [
  "Please wait…",
  "Hang tight!",
  "Almost there…",
  "On the go…",
  "Loading magic ✨",
  "Just a moment…",
  "Fetching data…",
  "Working on it…",
  "Stay with us…",
  "Nearly done…",
];

const DotSpinner = ({
  scale = 0.55, // multiplier for --size (1 = original CSS size; smaller = smaller loader)
  color1, // maps to --color-1 (defaults to theme violet)
  color2, // maps to --color-2 (defaults to theme cyan)
  message = false,
  messageCycle = true,
  messageInterval = 2200,
  loadingMessage = null,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const resolvedColor1 = color1 ?? colors.ball1;
  const resolvedColor2 = color2 ?? colors.ball2;

  // Shimmer gradient uses the same two colors driving the balls
  const shimmerFrom = resolvedColor1;
  const shimmerAccent = resolvedColor2;

  const [msgIndex, setMsgIndex] = useState(0);
  const [msgKey, setMsgKey] = useState(0);

  useEffect(() => {
    if (!messageCycle || !message) return;
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
      setMsgKey((k) => k + 1);
    }, messageInterval);
    return () => clearInterval(id);
  }, [messageCycle, message, messageInterval]);

  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      {/* Ball loader */}
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          style={{
            "--color-1": resolvedColor1,
            "--color-2": resolvedColor2,
            "--size": `${scale}px`,
          }}
          sx={{
            animation: `${rotate} 1s infinite`,
            height: "calc(50 * var(--size))",
            width: "calc(50 * var(--size))",
            position: "relative",
            "&::before, &::after": {
              content: '""',
              display: "block",
              borderRadius: "50%",
              height: "calc(20 * var(--size))",
              width: "calc(20 * var(--size))",
            },
            "&::before": {
              animation: `${ball1} 1s infinite`,
              backgroundColor: "var(--color-1)",
              boxShadow: "calc(30 * var(--size)) 0 0 var(--color-2)",
              marginBottom: "calc(10 * var(--size))",
            },
            "&::after": {
              animation: `${ball2} 1s infinite`,
              backgroundColor: "var(--color-2)",
              boxShadow: "calc(30 * var(--size)) 0 0 var(--color-1)",
            },
          }}
        />
      </Box>

      {/* Label — same shimmer-gradient styling as the original DotSpinner */}
      {message && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 220,
            textAlign: "center",
            overflow: "visible",
          }}
        >
          <Typography
            key={msgKey}
            variant="caption"
            sx={{
              display: "block",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              background: `linear-gradient(90deg, ${shimmerFrom} 0%, ${shimmerAccent} 50%, ${shimmerFrom} 100%)`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: messageCycle
                ? `${fadeInUp} ${messageInterval}ms ease forwards, ${shimmer} 2.4s linear infinite`
                : `${shimmer} 2.4s linear infinite`,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              lineHeight: 1.6,
              width: "100%",
            }}
          >
            {loadingMessage ?? MESSAGES[msgIndex]}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DotSpinner;