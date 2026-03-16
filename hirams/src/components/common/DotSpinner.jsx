import React, { useState, useEffect } from "react";
import { Box, keyframes, Typography } from "@mui/material";

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
`;

const rippleRing = keyframes`
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.8); opacity: 0; }
`;

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
  dotCount = 3,
  size = 14,
  color = "#1976d2",
  gap = 1.2,
  speed = 0.65,
  message = false,
  messageCycle = true,
  messageInterval = 2200,
  loadingMessage = null, // ← add this
}) => {
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
      {/* Dots */}
      <Box
        sx={{
          display: "flex",
          gap,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[...Array(dotCount)].map((_, i) => (
          <Box key={i} sx={{ position: "relative", width: size, height: size }}>
            {/* Ripple ring */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px solid ${color}`,
                animation: `${rippleRing} ${speed * 1.7}s ${i * 0.23}s infinite ease-out`,
                opacity: 0,
              }}
            />
            {/* Dot */}
            <Box
              sx={{
                width: size,
                height: size,
                bgcolor: color,
                borderRadius: "50%",
                animation: `${bounce} ${speed}s ${i * 0.18}s infinite ease-in-out`,
                position: "relative",
                zIndex: 1,
              }}
            />
          </Box>
        ))}
      </Box>

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
              background: `linear-gradient(90deg, ${color} 0%, #90caf9 50%, ${color} 100%)`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: messageCycle
                ? `${fadeInUp} ${messageInterval}ms ease forwards, ${shimmer} 2.4s linear infinite`
                : `${shimmer} 2.4s linear infinite`,
              whiteSpace: "pre-wrap", // ← respects wrapping
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
