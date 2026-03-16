// components/common/AlertBox.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

function InfoDialog({
  children,
  bgColor = "#e0f2fe",
  borderColor = "#38bdf8",
  textColor = "#0369a1",
  borderRadius = 2,
  p = 2,
  mb = 2.5,
  fontWeight = 400,
  fontSize = "0.850rem",
  lineHeight = 1,
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
        overflow: "hidden",
      }}
    >
      <Typography
        variant="body2"
        component="div"
        sx={{
          color: textColor,
          fontWeight,
          fontSize,
          lineHeight,
          textAlign,
          overflowX: "auto",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}
export default InfoDialog;
