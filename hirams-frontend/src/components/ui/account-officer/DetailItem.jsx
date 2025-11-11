import React from "react";
import { Grid, Box, Typography } from "@mui/material";

const DetailItem = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mt: 0.2, lineHeight: 1.2 }}>
        {value || "—"}
      </Typography>
    </Box>
  </Grid>
);

export default DetailItem;
