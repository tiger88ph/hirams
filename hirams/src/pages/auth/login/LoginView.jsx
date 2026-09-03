import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Link, useTheme } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from "@mui/icons-material";
import BaseButton from "../../../components/form/BaseButton";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthTextField from "../../../components/auth/AuthTextField";
import DotSpinner from "../../../components/loader/DotSpinner";
import getThemeColors from "../../../utils/style/getThemeColors";


// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  textSecondary: c.gray.textSecondary,
  iconMuted: c.gray.textDisabled,
  successText: c.green.text,
  dangerText: c.red.text,
});


export default function LoginView({
  formData,
  loading,
  showPassword,
  setShowPassword,
  statusMessage,
  fieldErrors,
  handleChange,
  handleLogin,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);


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
              statusMessage.includes("Processing") ||
              statusMessage.includes("Redirecting")
                ? colors.successText
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
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        startIcon={<AccountCircle sx={{ color: colors.iconMuted }} />}
        error={!!fieldErrors.username}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      <AuthTextField
        label="Password"
        name="strPassword"
        type={showPassword ? "text" : "password"}
        value={formData.strPassword}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        startIcon={<Lock sx={{ color: colors.iconMuted }} />}
        endIcon={showPassword ? <VisibilityOff /> : <Visibility />}
        onEndIconClick={() => setShowPassword((prev) => !prev)}
        error={!!fieldErrors.password}
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
          onClick={() => navigate("/register")}
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.85rem" },
            textDecoration: "none",
            "&:hover": { textDecoration: "none" },
          }}
        >
          Register Account
        </Link>
        <Link
          component="button"
          onClick={() => navigate("/forgotPassword")}
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.85rem" },
            textDecoration: "none",
            "&:hover": { textDecoration: "none" },
          }}
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