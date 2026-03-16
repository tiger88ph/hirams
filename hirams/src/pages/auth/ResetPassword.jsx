import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockReset,
  CheckCircleOutline,
  ErrorOutline,
  AccessTime,
  Lock,
  ArrowBack,
  AccountCircle
} from "@mui/icons-material";
import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";
import BaseButton from "../../components/common/BaseButton";
import DotSpinner from "../../components/common/DotSpinner";
import api from "../../utils/api/api";
import uiMessages from "../../utils/helpers/uiMessages";

const ResetPassword = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();

  const token            = searchParams.get("token");
  const usernameFromLink = searchParams.get("username") || "";

  const [formData, setFormData]           = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [validating, setValidating]       = useState(true);
  const [tokenValid, setTokenValid]       = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError]             = useState(false);
  const [fieldErrors, setFieldErrors]     = useState({});
  const [success, setSuccess]             = useState(false);

  // Validate token on mount
  useEffect(() => {
    const run = async () => {
      if (!token) { setTokenValid(false); setValidating(false); return; }
      try {
        await api.post("auth/validate-reset-token", { token });
        setTokenValid(true);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };
    run();
  }, [token]);

  // Only auto-clear field errors, never auto-clear status messages
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const t = setTimeout(() => setFieldErrors({}), 5000);
      return () => clearTimeout(t);
    }
  }, [fieldErrors]);

  const setError = (msg) => {
    setIsError(true);
    setStatusMessage(msg);
  };

  const setInfo = (msg) => {
    setIsError(false);
    setStatusMessage(msg);
  };

  const clearStatus = () => {
    setStatusMessage("");
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearStatus();
  };

  const handleSubmit = async () => {
    const { password, confirmPassword } = formData;
    clearStatus();

    if (!password || !confirmPassword) {
      setError(uiMessages.common.invalidInput);
      setFieldErrors({ password: !password, confirmPassword: !confirmPassword });
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setFieldErrors({ password: true });
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setFieldErrors({ password: true, confirmPassword: true });
      return;
    }

    setLoading(true);
    setInfo("Processing your request…");

    try {
      await api.post("auth/reset-password", {
        token,
        strPassword: password,
        strPassword_confirmation: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      if (error.status === 400 || error.status === 422) {
        setError("This reset link has expired. Please request a new one.");
      } else {
        setError(uiMessages.common.errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Validating state ──────────────────────────────────────────────────────
  if (validating) {
    return (
      <AuthLayout title="PASSWORD RESET">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 2 }}>
          <DotSpinner size={10} />
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            Verifying your reset link…
          </Typography>
        </Box>
      </AuthLayout>
    );
  }

  // ── Invalid / expired token ───────────────────────────────────────────────
  if (!tokenValid) {
    return (
      <AuthLayout title="PASSWORD RESET">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 2, gap: 2 }}>
          <ErrorOutline sx={{ fontSize: { xs: 48, sm: 64 }, color: "error.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: "0.95rem", sm: "1.1rem" } }}>
            Link Invalid or Expired
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: "0.75rem", sm: "0.875rem" }, lineHeight: 1.6, maxWidth: 320 }}>
            This password reset link is no longer valid. It may have already been used
            or has expired — links are only valid for <strong>60 minutes</strong>.
          </Typography>
          <BaseButton
            label="Request a New Link"
            onClick={() => navigate("/forgotPassword")}
            icon={<LockReset fontSize="small" />}
            actionColor="reset"
            sx={{ mt: 1 }}
          />
        </Box>
      </AuthLayout>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout title="PASSWORD RESET">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 2, gap: 2 }}>
          <CheckCircleOutline sx={{ fontSize: { xs: 48, sm: 64 }, color: "success.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: { xs: "0.95rem", sm: "1.1rem" } }}>
            Password Updated!
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: "0.75rem", sm: "0.875rem" }, lineHeight: 1.6, maxWidth: 320 }}>
            Your password has been reset successfully. Redirecting you to the login page…
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>
            You will be redirected in a few seconds.
          </Typography>
          <DotSpinner size={8} />
        </Box>
      </AuthLayout>
    );
  }

  // ── Main reset form ───────────────────────────────────────────────────────
  return (
    <AuthLayout title="RESET PASSWORD">
      <Box sx={{ mb: statusMessage ? 2 : 3.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 100, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
          Choose a new password
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: "0.75rem", sm: "0.875rem" }, lineHeight: 1.5 }}>
          Hi <strong>{usernameFromLink}</strong>, enter a new secure password for your HiRAMS account below.
        </Typography>
      </Box>

      {/* Expiry notice */}
      <Box sx={{
        display: "flex", alignItems: "flex-start", gap: 1,
        background: "#fffde7", border: "1px solid #ffe082",
        borderLeft: "4px solid #ffc107", borderRadius: 1,
        px: 1.5, py: 1, mb: 2,
      }}>
        <AccessTime sx={{ fontSize: 15, color: "#f9a825", mt: 0.2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: "0.72rem", color: "#6d5100", lineHeight: 1.6 }}>
          This link will expire in <strong>60 minutes</strong>. If you did not request a
          password reset, you can safely ignore this page.
        </Typography>
      </Box>

      {/* Status message — only shown, never auto-dismissed */}
      {statusMessage && (
        <Typography sx={{
          color: isError ? "red" : "green",
          mb: 1,
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}>
          {statusMessage}
        </Typography>
      )}

      {/* Username read-only */}
      <AuthTextField
        label="Username"
        name="username"
        value={usernameFromLink}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
        sx={{ mb: 2 }}
        inputProps={{
          readOnly: true,
          style: { fontSize: theme.typography.body2.fontSize, color: "#9e9e9e", cursor: "not-allowed" },
        }}
      />

      {/* New password */}
      <AuthTextField
        label="New Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        startIcon={<Lock sx={{ color: "#5a585b" }} />}
        endIcon={showPassword ? <Visibility /> : <VisibilityOff />}
        onEndIconClick={() => setShowPassword((p) => !p)}
        error={!!fieldErrors.password}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      {/* Confirm password */}
      <AuthTextField
        label="Confirm Password"
        name="confirmPassword"
        type={showConfirm ? "text" : "password"}
        value={formData.confirmPassword}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        startIcon={<Lock sx={{ color: "#5a585b" }} />}
        endIcon={showConfirm ? <Visibility /> : <VisibilityOff />}
        onEndIconClick={() => setShowConfirm((p) => !p)}
        error={!!fieldErrors.confirmPassword}
        sx={{ mb: 3 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <BaseButton
          label="Login"
          variant="outlined"
          onClick={() => navigate("/")}
          icon={<ArrowBack fontSize="small" />}
          actionColor="back"
          disabled={loading}
        />
        <BaseButton
          label="Reset Password"
          onClick={handleSubmit}
          disabled={loading}
          icon={!loading && <LockReset fontSize="small" />}
          actionColor="reset"
        />
      </Box>
    </AuthLayout>
  );
};

export default ResetPassword;