import React from "react";
import { Paper, Typography, Divider } from "@mui/material";

const InfoSection = ({ title, children }) => (
  <Paper
    elevation={3}
    sx={{ p: 2, mb: 2.5, borderRadius: 2, backgroundColor: "#fff" }}
  >
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        mb: 1.5,
        color: "primary.main",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 1.5 }} />
    {children}
  </Paper>
);

export default InfoSection;
