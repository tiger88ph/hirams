import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Link, useTheme } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from "@mui/icons-material";
import BaseButton from "../../../components/ui/form/BaseButton";
import AuthLayout from "../../../components/ui/auth/AuthLayout";
import AuthTextField from "../../../components/ui/auth/AuthTextField";
import DotSpinner from "../../../components/ui/loader/DotSpinner";
import getThemeColors from "../../../utils/style/getThemeColors";

// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  textSecondary: c.gray.textSecondary,
  iconMuted: c.gray.textDisabled,
  successText: c.green.text,
  dangerText: c.red.text,
  linkPrimary: c.blue.text,
});

export default function LoginView({
  formData,
  loading,
  showPassword,
  setShowPassword,
  statusMessage,
  statusTone,
  fieldErrors,
  handleChange,
  handleLogin,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  // Submit on Enter, but never while a login is already running.
  const submitOnEnter = (e) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  // Shared hover/focus treatment — the links used to give no feedback at all.
  const linkSx = {
    fontSize: { xs: "0.75rem", sm: "0.85rem" },
    textDecoration: "none",
    transition: "color 0.15s ease",
    "&:hover": { color: colors.linkPrimary, textDecoration: "underline" },
    "&:focus-visible": {
      outline: `2px solid ${colors.linkPrimary}`,
      outlineOffset: 2,
      borderRadius: 0.5,
    },
    // Locked while a login request is running.
    "&:disabled": {
      color: colors.textSecondary,
      textDecoration: "none",
      cursor: "not-allowed",
    },
  };

  return (
    <AuthLayout title="LOGIN">
      <Box sx={{ mb: statusMessage ? 2 : 3.5 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 100, fontSize: { xs: "1rem", sm: "1.25rem" } }}
        >
          Welcome Back!
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Please login to access your HiRAMS dashboard.
        </Typography>
      </Box>

      {statusMessage && (
        <Typography
          sx={{
            color:
              statusTone === "success"
                ? colors.successText
                : statusTone === "info"
                  ? colors.textSecondary
                  : colors.dangerText,
            mb: 1,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {statusMessage}
        </Typography>
      )}

      <AuthTextField
        label="User Name"
        name="strUserName"
        value={formData.strUserName}
        onChange={handleChange}
        onKeyDown={submitOnEnter}
        autoFocus
        autoComplete="username"
        spellCheck={false}
        autoCapitalize="none"
        startIcon={<AccountCircle sx={{ color: colors.iconMuted }} />}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || ""}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      <AuthTextField
        label="Password"
        name="strPassword"
        type={showPassword ? "text" : "password"}
        value={formData.strPassword}
        onChange={handleChange}
        onKeyDown={submitOnEnter}
        autoComplete="current-password"
        startIcon={<Lock sx={{ color: colors.iconMuted }} />}
        // Eye follows the app-wide convention (FormGrid): eye-off while the
        // password is hidden, eye while it is visible.
        endIcon={showPassword ? <Visibility /> : <VisibilityOff />}
        onEndIconClick={() => setShowPassword((prev) => !prev)}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || ""}
        sx={{ mb: 1 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Link
          component="button"
          type="button"
          disabled={loading}
          onClick={() => navigate("/register")}
          sx={linkSx}
        >
          Register Account
        </Link>
        <Link
          component="button"
          type="button"
          disabled={loading}
          onClick={() => navigate("/forgotPassword")}
          sx={linkSx}
        >
          Forgot Password?
        </Link>
      </Box>

      <BaseButton
        label={
          loading || statusMessage.includes("Redirecting") ? (
            <DotSpinner size={8} />
          ) : (
            "Login"
          )
        }
        onClick={handleLogin}
        disabled={loading}
        sx={{ width: "100%", py: { xs: 1.2, sm: 1.5 }, mb: 1 }}
        actionColor="login"
      />
    </AuthLayout>
  );
}
