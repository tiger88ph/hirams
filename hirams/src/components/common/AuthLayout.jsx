import React from "react";
import { Box, Paper, Divider, Typography } from "@mui/material";

const AuthLayout = ({
  title,
  children,
  buttonColor = "#034FA5",
  width = 400,
  maxWidth = "100%",
}) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: { xs: "flex-start", sm: "center" },
        bgcolor: "#f5f5f5",
        p: { xs: 0, sm: 2 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: { xs: "100%", sm: width },
          maxWidth: { xs: "100%", sm: maxWidth },
          borderRadius: { xs: 0, sm: 3 },
          textAlign: "center",
          overflow: "hidden",
          position: "relative",
          // On mobile, fill the full viewport height so it doesn't feel clipped
          minHeight: { xs: "100dvh", sm: "unset" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top accent bar */}
        <Box
          sx={{ height: 6, width: "100%", bgcolor: buttonColor, flexShrink: 0 }}
        />

        <Box
          sx={{
            p: { xs: 3, sm: 5 },
            pt: { xs: 2.5, sm: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/hirams-icon-rectangle.png`}
              alt="Company Logo"
              style={{ width: 130, height: "auto" }}
            />
          </Box>

          <Divider sx={{ mb: { xs: 9, sm: 6 } }} />
          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: buttonColor,
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
              letterSpacing: { xs: 0.5, sm: 1 },
            }}
          >
            {title}
          </Typography>

          {/* Content grows to fill available space */}
          <Box sx={{ flex: 1 }}>{children}</Box>

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
        <Box
          sx={{ height: 4, width: "100%", bgcolor: "#5a585b", flexShrink: 0 }}
        />
      </Paper>
    </Box>
  );
};

export default AuthLayout;
