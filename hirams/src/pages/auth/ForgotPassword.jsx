import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import {
  AccountCircle,
  ArrowBack,
  LockReset,
  Email,
  CheckCircleOutline,
} from "@mui/icons-material";
import BaseButton from "../../components/common/BaseButton";
import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";
import DotSpinner from "../../components/common/DotSpinner";
import api from "../../utils/api/api";
import uiMessages from "../../utils/helpers/uiMessages";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [formData, setFormData] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Auto-clear field errors after 5s
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const timer = setTimeout(() => setFieldErrors({}), 5000);
      return () => clearTimeout(timer);
    }
  }, [fieldErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatusMessage("");
    setFieldErrors({});
  };

const handleReset = async () => {
  const { username, email } = formData;

  setStatusMessage("");
  setFieldErrors({});

  if (!username.trim() || !email.trim()) {
    setStatusMessage(uiMessages.common.invalidInput);
    setFieldErrors({ username: !username.trim(), email: !email.trim() });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    setStatusMessage("Please enter a valid email address.");
    setFieldErrors({ email: true });
    return;
  }

  setLoading(true);
  setStatusMessage(uiMessages.common.processingInput);

  try {
    const checkResponse = await api.post("auth/check-username", {
      strUserName: username.trim(),
    });

    if (!checkResponse?.exists) {
      setStatusMessage(uiMessages.common.failedAttempt);
      setFieldErrors({ username: true });
      return;                        // ← finally will still fire
    }

    await api.post("auth/forgot-password", {
      strUserName: username.trim(),
      strEmail: email.trim(),
    });

    setSubmitted(true);
  } catch (error) {
    if (error.status === 404) {
      setStatusMessage("This email is not registered to the provided username.");
      setFieldErrors({ email: true });
    } else if (error.status === 422) {
      setStatusMessage("Please check your inputs and try again.");
      setFieldErrors({ username: true, email: true });
    } else {
      setStatusMessage(uiMessages.common.errorMessage);
    }
  } finally {
    setLoading(false);               // ← always runs, no more stuck spinner
  }
};

  // ── Success screen ──────────────────────────────────────────────────────────
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
            sx={{ fontSize: { xs: 48, sm: 64 }, color: "success.main" }}
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
              color: "text.secondary",
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
            sx={{ color: "text.disabled", fontSize: "0.7rem" }}
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

  // ── Main form ───────────────────────────────────────────────────────────────
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
            color: "text.secondary",
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
            color: statusMessage.includes("Processing") ? "green" : "red",
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
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
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
        startIcon={<Email sx={{ color: "#5a585b" }} />}
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
};

export default ForgotPassword;