import React from "react";
import { Box, Typography } from "@mui/material";

function AlertHeaderTitle({
  children,
  bgColor = "#F3F9FF",
  borderColor = "#C6E2FF",
  textColor = "#084B8A",
  borderRadius = 2,
  p = 2,
  mb = 3,
  fontWeight = 600,
  textAlign = "left",
}) {
  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius,
        p,
        mb,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          color: textColor,
          fontWeight,
          textAlign,
          fontSize: "1rem",
          letterSpacing: 0.3,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export default AlertHeaderTitle;
