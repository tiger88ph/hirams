import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  AccountCircle,
  ArrowBack,
  LockReset,
  Email,
  CheckCircleOutline,
} from "@mui/icons-material";
import BaseButton from "../../../components/form/BaseButton";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthTextField from "../../../components/auth/AuthTextField";
import DotSpinner from "../../../components/loader/DotSpinner";
import getThemeColors from "../../../utils/style/getThemeColors";


// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  iconMuted: c.gray.textDisabled,
  successText: c.green.text,
  dangerText: c.red.text,
});


export default function ForgotPasswordView({
  formData,
  loading,
  statusMessage,
  fieldErrors,
  submitted,
  handleChange,
  handleReset,
  navigate,
}) {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);


  // ── Success screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <AuthLayout title="CHECK YOUR EMAIL">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            py: 2,
            gap: 2,
          }}
        >
          <CheckCircleOutline
            sx={{ fontSize: { xs: 48, sm: 64 }, color: colors.successText }}
          />

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 500, fontSize: { xs: "0.95rem", sm: "1.1rem" } }}
          >
            Reset Link Sent!
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: colors.textSecondary,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              lineHeight: 1.6,
              maxWidth: 320,
            }}
          >
            We've sent a password reset link to{" "}
            <strong>{formData.email}</strong>. Please check your inbox and
            follow the instructions to reset your password.
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: colors.textDisabled, fontSize: "0.7rem" }}
          >
            The link will expire in 60 minutes.
          </Typography>

          <BaseButton
            label="Back to Login"
            onClick={() => navigate("/")}
            icon={<ArrowBack fontSize="small" />}
            actionColor="back"
            sx={{ mt: 1 }}
          />
        </Box>
      </AuthLayout>
    );
  }


  // ── Main form ───────────────────────────────────────────────────────
  return (
    <AuthLayout title="FORGOT PASSWORD">
      <Box sx={{ mb: statusMessage ? 2 : 3.5 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 100, fontSize: { xs: "1rem", sm: "1.25rem" } }}
        >
          Reset your password
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            lineHeight: 1.5,
          }}
        >
          Enter your username and registered email address. We'll send you a
          link to reset your password.
        </Typography>
      </Box>

      {/* Status message */}
      {statusMessage && (
        <Typography
          sx={{
            color: statusMessage.includes("Processing")
              ? colors.successText
              : colors.dangerText,
            mb: 1,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {statusMessage}
        </Typography>
      )}

      {/* Username */}
      <AuthTextField
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleReset()}
        startIcon={<AccountCircle sx={{ color: colors.iconMuted }} />}
        error={!!fieldErrors.username}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      {/* Email */}
      <AuthTextField
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleReset()}
        startIcon={<Email sx={{ color: colors.iconMuted }} />}
        error={!!fieldErrors.email}
        sx={{ mb: 3 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <BaseButton
          label="Back"
          variant="outlined"
          onClick={() => navigate("/")}
          icon={<ArrowBack fontSize="small" />}
          actionColor="back"
          disabled={loading}
        />

        <BaseButton
          label={loading ? <DotSpinner size={8} /> : "Send Reset Link"}
          onClick={handleReset}
          disabled={loading}
          icon={!loading && <LockReset fontSize="small" />}
          actionColor="reset"
        />
      </Box>
    </AuthLayout>
  );
}