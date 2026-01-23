// components/common/AlertBox.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

function AlertBox({
  children,
  bgColor = "#e0f2fe",
  borderColor = "#38bdf8",
  textColor = "#0369a1",
  borderRadius = 2,
  p = 2,
  mb = 2.5,
  fontWeight = 400,
  fontSize = "0.850rem", // default slightly smaller
  lineHeight = 1,      // tighter line height
  textAlign = "center",
}) {
  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: borderRadius,
        p: p,
        mb: mb,
      }}
    >
      <Typography
        variant="body2"
        component="div" 
        sx={{
          color: textColor,
          fontWeight,
          fontSize,     // use smaller font
          lineHeight,   // tighter line height
          textAlign,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export default AlertBox;
