import React from "react";
import { Box, keyframes } from "@mui/material";

// Define the bounce animation
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const DotSpinner = ({
  dotCount = 3,
  size = 12,
  color = "primary.main",
  gap = 1,
  speed = 0.6,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[...Array(dotCount)].map((_, i) => (
        <Box
          key={i}
          sx={{
            width: size,
            height: size,
            bgcolor: color,
            borderRadius: "50%",
            animation: `${bounce} ${speed}s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
    </Box>
  );
};

export default DotSpinner;
