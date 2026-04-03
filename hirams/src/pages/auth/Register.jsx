import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
} from "@mui/material";
import { ArrowBack, ArrowForward, HowToReg, Login } from "@mui/icons-material";
import ReCAPTCHA from "react-google-recaptcha";

import BaseButton from "../../components/common/BaseButton";
import AuthLayout from "../../components/common/AuthLayout";
import FormGrid from "../../components/common/FormGrid";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import { showSwal, showSpinner, withSpinner } from "../../utils/helpers/swal.jsx";
import { validateFormData } from "../../utils/form/validation";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../utils/helpers/passwordFormat";
import uiMessages from "../../utils/helpers/uiMessages";
import Swal from "sweetalert2";

const steps = ["Personal Information", "Account Credentials", "Verification"];

// ── OTP Input — 6 individual digit boxes ─────────────────────────────────────
function OtpInput({ value, onChange, error }) {
  const inputRefs = useRef([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

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
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
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
            value={digits[i] === " " ? "" : digits[i] || ""}
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
                bgcolor: digits[i] && digits[i] !== " " ? "#eff6ff" : "#fafafa",
                "& fieldset": {
                  borderColor: error
                    ? "error.main"
                    : digits[i] && digits[i] !== " "
                      ? "#3b82f6"
                      : "#d1d5db",
                  borderWidth: digits[i] && digits[i] !== " " ? 2 : 1,
                },
              },
            }}
          />
        ))}
      </Box>
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", textAlign: "center", mt: 0.5 }}
        >
          Invalid OTP. Please try again.
        </Typography>
      )}
    </Box>
  );
}

const Register = () => {
  const navigate = useNavigate();
  const { sex, statuses } = useMapping();
  const pendingKey = Object.keys(statuses)[2];

  const [activeStep, setActiveStep] = useState(0);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  // OTP step state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSending, setOtpSending] = useState(false); // only for resend label

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    sex: "",
    type: "V",
    email: "",
    username: "",
    password: "",
    cpassword: "",
  });

  const [errors, setErrors] = useState({});

  // ── Resend countdown ─────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Field change ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
        cpassword: formData.cpassword
          ? validateConfirmPassword(value, formData.cpassword)
          : prev.cpassword,
      }));
      if (!value) setFormData((prev) => ({ ...prev, cpassword: "" }));
    } else if (name === "cpassword") {
      setErrors((prev) => ({
        ...prev,
        cpassword: validateConfirmPassword(formData.password, value),
      }));
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 0) {
      const personalErrors = validateFormData(formData, "USER");
      ["firstName", "lastName", "nickname", "sex"].forEach((key) => {
        if (personalErrors[key]) stepErrors[key] = personalErrors[key];
      });
    }

    if (step === 1) {
      const accountErrors = validateFormData(formData, "USER");
      const pwErr = validatePassword(formData.password);
      const cpwErr = validateConfirmPassword(formData.password, formData.cpassword);
      if (pwErr) accountErrors.password = pwErr;
      if (cpwErr) accountErrors.cpassword = cpwErr;
      ["username", "email", "password", "cpassword"].forEach((key) => {
        if (accountErrors[key]) stepErrors[key] = accountErrors[key];
      });
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  // silent=true → use withSpinner (first send); silent=false → use showSpinner (resend)
  const sendOtp = async ({ silent = false } = {}) => {
    const doSend = async () => {
      await api.post("auth/send-otp", {
        strEmail: formData.email,
        strUserName: formData.username,
      });
      startResendTimer();
      setOtp("");
      setOtpError(false);
    };

    if (silent) {
      // Called from handleNext — spinner is already open via withSpinner wrapper
      await doSend();
    } else {
      // Resend button — show its own spinner
      setOtpSending(true);
      try {
        await showSpinner("Sending verification code…", 300);
        await doSend();
        Swal.close();
      } catch {
        Swal.close();
        setErrors({ email: "Failed to send OTP. Please check your email." });
      } finally {
        setOtpSending(false);
      }
    }
  };

  // ── Next ──────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!validateStep(activeStep)) return;

    if (activeStep === 1) {
      try {
        await withSpinner("Checking details…", async () => {
          const usernameCheck = await api.post("users/check-exist", {
            strUserName: formData.username,
          });
          if (usernameCheck.exists) {
            setErrors({ username: uiMessages.common.usernameExists });
            throw new Error("username_exists");
          }

          const emailCheck = await api.post("users/check-exist", {
            strEmail: formData.email,
          });
          if (emailCheck.exists) {
            setErrors({ email: uiMessages.common.emailExists });
            throw new Error("email_exists");
          }

          await sendOtp({ silent: true });
        });

        setActiveStep((prev) => prev + 1);
      } catch {
        // errors already set above; spinner closed by withSpinner
      }
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  // ── Back ──────────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (activeStep === 0) navigate("/");
    else {
      setOtp("");
      setOtpError(false);
      setActiveStep((prev) => prev - 1);
    }
  };

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (otp.length < 6) { setOtpError(true); return; }

    try {
      await withSpinner(
        `${formData.firstName} ${formData.lastName}`.trim() || "User",
        async () => {
          // 1. Verify OTP
          try {
            await api.post("auth/verify-otp", { strEmail: formData.email, otp });
          } catch {
            setOtpError(true);
            throw new Error("otp_invalid");
          }

          // 2. Register user
          const payload = {
            strFName: formData.firstName,
            strMName: formData.middleName || "",
            strLName: formData.lastName,
            strNickName: formData.nickname || "",
            cSex: Object.keys(sex).find((key) => sex[key] === formData.sex),
            strEmail: formData.email,
            strUserName: formData.username,
            strPassword: formData.password,
            cStatus: pendingKey,
            cUserType: "V",
            recaptcha: recaptchaValue,
          };

          await api.post("users", payload);
          await showSwal("REGISTRATION_SUCCESS");
          navigate("/");
        },
      );
    } catch {
      // errors already set; spinner closed by withSpinner
    }
  };

  // ── Field configs ─────────────────────────────────────────────────────────
  const getStepFields = (step) => {
    if (step === 0)
      return [
        { label: "First Name", name: "firstName", xs: 12, sm: 4 },
        { label: "Middle Name", name: "middleName", xs: 12, sm: 4 },
        { label: "Last Name", name: "lastName", xs: 12, sm: 4 },
        { label: "Nickname", name: "nickname", xs: 12, sm: 6 },
        {
          label: "Sex",
          name: "sex",
          type: "select",
          xs: 12,
          sm: 6,
          options: Object.entries(sex).map(([, label]) => ({ label, value: label })),
        },
      ];

    if (step === 1)
      return [
        { label: "Username", name: "username", type: "username", xs: 12, sm: 4 },
        { label: "Email", name: "email", type: "email", xs: 12, sm: 8 },
        { label: "Password", name: "password", type: "password", xs: 12, sm: 6 },
        {
          label: "Confirm Password",
          name: "cpassword",
          type: "password",
          xs: 12,
          sm: 6,
          disabled: !formData.password || formData.password.length < 6,
        },
      ];

    return [];
  };

  // ── reCAPTCHA gate ────────────────────────────────────────────────────────
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
          <Box sx={{ transform: { xs: "scale(0.88)", sm: "scale(1)" }, transformOrigin: "center" }}>
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(value) => {
                setRecaptchaValue(value);
                setRecaptchaVerified(true);
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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <AuthLayout title="REGISTER AN ACCOUNT" width={600}>
      {/* Stepper — hide labels on xs, show only icons */}
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

      {/* Steps 0 & 1 — FormGrid */}
      {activeStep < 2 && (
        <FormGrid
          fields={getStepFields(activeStep)}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          autoFocus={`${recaptchaVerified}-${activeStep}`}
        />
      )}

      {/* Step 2 — OTP verification */}
      {activeStep === 2 && (
        <Box sx={{ textAlign: "center", py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Enter Verification Code
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: { xs: "0.78rem", sm: "0.82rem" } }}
          >
            A 6-digit code was sent to <strong>{formData.email}</strong>.
            <br />
            Enter it below to complete registration.
          </Typography>

          <OtpInput value={otp} onChange={setOtp} error={otpError} />

          {/* Resend */}
          <Box sx={{ mt: 2 }}>
            {resendTimer > 0 ? (
              <Typography variant="caption" color="text.disabled">
                Resend code in {resendTimer}s
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: otpSending ? "text.disabled" : "#3b82f6",
                  cursor: otpSending ? "default" : "pointer",
                  fontWeight: 500,
                }}
                onClick={!otpSending ? () => sendOtp({ silent: false }) : undefined}
              >
                {otpSending ? "Sending…" : "Resend Code"}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Navigation */}
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
};

export default Register;