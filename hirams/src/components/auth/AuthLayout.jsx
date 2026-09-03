import React from "react";
import { Box, Paper, Divider, Typography, useTheme } from "@mui/material";
import getThemeColors from "../../utils/style/getThemeColors";


// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  pageBg: c.slate.outerBg,
  paperBg: c.slate.innerBg,
  textSecondary: c.gray.textSecondary,
  bottomAccent: c.gray.textDisabled, // closest structural neutral
});


const AuthLayout = ({
  title,
  children,
  buttonColor = "#034FA5",
  width = 400,
  maxWidth = "100%",
}) => {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);


  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: { xs: "flex-start", sm: "center" },
        bgcolor: colors.pageBg,
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
          bgcolor: colors.paperBg,
          minHeight: { xs: "100dvh", sm: "unset" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top accent bar — keeps prop-driven brand color */}
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

          {/* Title — uses prop-driven brand color */}
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

          {/* Content */}
          <Box sx={{ flex: 1 }}>{children}</Box>

          {/* Footer — uses theme token */}
          <Typography
            variant="caption"
            sx={{ mt: 2, display: "block", color: colors.textSecondary }}
          >
            &copy; {new Date().getFullYear()} HiRAMS. All rights reserved.
          </Typography>
        </Box>

        {/* Bottom accent bar — uses theme structural token */}
        <Box
          sx={{ height: 4, width: "100%", bgcolor: colors.bottomAccent, flexShrink: 0 }}
        />
      </Paper>
    </Box>
  );
};


export default AuthLayout;