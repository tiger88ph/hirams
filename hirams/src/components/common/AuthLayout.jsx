import React from "react";
import { Box, Paper, Divider, Typography } from "@mui/material";

const AuthLayout = ({
  title,
  children,
  buttonColor = "#034FA5",
  width = 400, // ✅ default width can now be adjusted
  maxWidth = "90%", // optional maxWidth adjustment
}) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width,
          maxWidth,
          borderRadius: 3,
          textAlign: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <Box sx={{ height: 6, width: "100%", bgcolor: buttonColor }} />

        <Box sx={{ p: 5, pt: 3 }}>
          {/* Logo */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/hirams-icon-rectangle.png`}
              alt="Company Logo"
              style={{ width: 150, height: 40 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Title */}
          <Typography
            variant="h5"
            sx={{ mb: 2, fontWeight: 600, color: buttonColor }}
          >
            {title}
          </Typography>

          {children}

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: "block" }}
          >
            &copy; {new Date().getFullYear()} HiRAMS. All rights reserved.
          </Typography>
        </Box>

        {/* Bottom gray border */}
        <Box sx={{ height: 4, width: "100%", bgcolor: "#5a585b" }} />
      </Paper>
    </Box>
  );
};

export default AuthLayout;
