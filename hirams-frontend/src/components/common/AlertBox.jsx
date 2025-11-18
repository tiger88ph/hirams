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
  fontWeight = 500,
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
        sx={{
          color: textColor,
          fontWeight,
          lineHeight: 1.6,
          textAlign,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export default AlertBox;
