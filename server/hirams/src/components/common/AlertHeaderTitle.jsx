import React from "react";
import { Box, Typography } from "@mui/material";

function AlertHeaderTitle({
  children,
  bgColor = "#F3F9FF",
  borderColor = "#C6E2FF",
  textColor = "#084B8A",
  borderRadius = 2,
  p = 1.5,
  mb = 2,
  fontWeight = 500,
  textAlign = "center",
  lineHeight = 1.2, // default line height
  fontSize = ".850rem", // corrected default font size
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
          letterSpacing: 0.3,
          lineHeight,
          fontSize, // use the prop directly
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export default AlertHeaderTitle;
