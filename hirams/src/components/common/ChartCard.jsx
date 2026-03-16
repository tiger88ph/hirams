import React from "react";
import { Card, Typography, Box } from "@mui/material";

export default function ChartCard({
  title,
  height = 300,
  children,
}) {
  return (
    <Card
      sx={{
        height,
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      {title && (
        <Typography variant="subtitle1" mb={1}>
          {title}
        </Typography>
      )}

      {/* THIS BOX FIXES RECHARTS */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </Card>
  );
}