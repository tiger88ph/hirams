import React, { useRef } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  useTheme,
} from "@mui/material";
import { ArrowBack, ArrowForward, HowToReg, Login } from "@mui/icons-material";
import ReCAPTCHA from "react-google-recaptcha";

import BaseButton from "../../../components/form/BaseButton";
import AuthLayout from "../../../components/auth/AuthLayout";
import FormGrid from "../../../components/form/FormGrid";
import getThemeColors from "../../../utils/style/getThemeColors";

const steps = ["Personal Information", "Account Credentials", "Verification"];

// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  inputBg: c.gray.inputBg,
  inputFilledBg: c.blue.bg,
  borderDefault: c.slate.border,
  borderFilled: c.blue.borderStrong,
  borderError: c.red.borderStrong,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  linkPrimary: c.blue.text,
});

// ── OTP Input Component ─────────────────────────────────────────────
function OtpInput({ value, onChange, error }) {
  const inputRefs = useRef([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  // ✅ Standard wiring — inside component since it's defined in this file
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  const handleDigitChange = (e, index) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    const joined = next.join("").replace(/ /g, "");
    onChange(joined);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        onChange(next.join("").replace(/ /g, ""));
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.5, sm: 1 },
          justifyContent: "center",
          mt: 1,
          flexWrap: "nowrap",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <TextField
            key={i}
            inputRef={(el) => (inputRefs.current[i] = el)}
            value={digits[i] || ""}
            onChange={(e) => handleDigitChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            inputProps={{
              maxLength: 1,
              inputMode: "numeric",
              style: {
                textAlign: "center",
                fontSize: "1.2rem",
                fontWeight: 700,
                padding: "10px 0",
              },
            }}
            error={error}
            sx={{
              width: { xs: 40, sm: 52 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: digits[i] ? colors.inputFilledBg : colors.inputBg,
                "& fieldset": {
                  borderColor: error
                    ? colors.borderError
                    : digits[i]
                      ? colors.borderFilled
                      : colors.borderDefault,
                  borderWidth: digits[i] ? 2 : 1,
                },
              },
            }}
          />
        ))}
      </Box>
      {error && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 0.5,
            color: colors.borderError,
          }}
        >
          Invalid OTP. Please try again.
        </Typography>
      )}
    </Box>
  );
}

export default function RegisterView({
  navigate,
  activeStep,
  recaptchaVerified,
  setRecaptchaValue,
  setRecaptchaVerified,
  otp,
  setOtp,
  otpError,
  resendTimer,
  otpSending,
  formData,
  errors,
  handleChange,
  handleNext,
  handleBack,
  handleSave,
  sendOtp,
  getStepFields,
}) {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  // ── reCAPTCHA Gate ──────────────────────────────────────────────────
  if (!recaptchaVerified) {
    return (
      <AuthLayout title="VERIFY CAPTCHA" width={420}>
        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            sx={{
              transform: { xs: "scale(0.88)", sm: "scale(1)" },
              transformOrigin: "center",
            }}
          >
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(value) => {
                if (value) {
                  setRecaptchaValue(value);
                  setRecaptchaVerified(true);
                }
              }}
              onTimeout={() => {
                setRecaptchaValue(null);
                setRecaptchaVerified(false);
                console.warn("reCAPTCHA timed out — please try again");
              }}
              onErrored={() => {
                setRecaptchaValue(null);
                setRecaptchaVerified(false);
              }}
            />
          </Box>
          <BaseButton
            label="Back to Login"
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{ mt: 1 }}
            actionColor="login"
            icon={<Login />}
          />
        </Box>
      </AuthLayout>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────
  return (
    <AuthLayout title="REGISTER AN ACCOUNT" width={600}>
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    display: { xs: "none", sm: "block" },
                    fontSize: { sm: "0.75rem" },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {activeStep < 2 && (
        <FormGrid
          fields={getStepFields(activeStep)}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          autoFocus={`${recaptchaVerified}-${activeStep}`}
        />
      )}

      {activeStep === 2 && (
        <Box sx={{ textAlign: "center", py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Enter Verification Code
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              fontSize: { xs: "0.78rem", sm: "0.82rem" },
              color: colors.textSecondary,
            }}
          >
            A 6-digit code was sent to <strong>{formData.email}</strong>.<br />
            Enter it below to complete registration.
          </Typography>
          <OtpInput value={otp} onChange={setOtp} error={otpError} />
          <Box sx={{ mt: 2 }}>
            {resendTimer > 0 ? (
              <Typography variant="caption" sx={{ color: colors.textDisabled }}>
                Resend code in {resendTimer}s
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: otpSending ? colors.textDisabled : colors.linkPrimary,
                  cursor: otpSending ? "default" : "pointer",
                  fontWeight: 500,
                }}
                onClick={
                  !otpSending ? () => sendOtp({ silent: false }) : undefined
                }
              >
                {otpSending ? "Sending…" : "Resend Code"}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 3,
          gap: 1,
          flexWrap: { xs: "wrap", sm: "nowrap" },
        }}
      >
        <BaseButton
          label={activeStep === 0 ? "Back to Login" : "Back"}
          variant="outlined"
          onClick={handleBack}
          actionColor="back"
          icon={activeStep === 0 ? <Login /> : <ArrowBack />}
        />
        {activeStep < steps.length - 1 ? (
          <BaseButton
            label="Next"
            onClick={handleNext}
            icon={<ArrowForward />}
          />
        ) : (
          <BaseButton
            label="Register"
            onClick={handleSave}
            disabled={otp.length < 6}
            actionColor="register"
            icon={<HowToReg />}
          />
        )}
      </Box>
    </AuthLayout>
  );
}
