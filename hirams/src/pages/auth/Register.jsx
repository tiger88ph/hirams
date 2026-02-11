import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stepper, Step, StepLabel } from "@mui/material";
import { ArrowBack, ArrowForward, HowToReg, Login } from "@mui/icons-material";
import ReCAPTCHA from "react-google-recaptcha";

import BaseButton from "../../components/common/BaseButton";
import AuthLayout from "../../components/common/AuthLayout";
import FormGrid from "../../components/common/FormGrid";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../utils/swal";
import { validateFormData } from "../../utils/form/validation";

const steps = ["Personal Information", "Account Credentials"];

const Register = () => {
  const navigate = useNavigate();
  const { sex, statuses } = useMapping();
  const activeKey = Object.keys(statuses)[0];
  const pendingKey = Object.keys(statuses)[2];

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password" && errors.cpassword)
      setErrors((prev) => ({ ...prev, cpassword: "" }));
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    const missing = [];
    if (password.length < 8) missing.push("8 characters");
    if (!/[A-Z]/.test(password)) missing.push("uppercase");
    if (!/[a-z]/.test(password)) missing.push("lowercase");
    if (!/[0-9]/.test(password)) missing.push("number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
      missing.push("special character");
    return missing.length ? `Password needs: ${missing.join(", ")}` : "";
  };

  const validateConfirmPassword = (password, cpassword) => {
    if (!cpassword) return "Please confirm your password";
    if (password && cpassword && password !== cpassword)
      return "Passwords do not match";
    return "";
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 0) {
      const personalFields = ["firstName", "lastName", "nickname", "sex"];
      const personalErrors = validateFormData(formData, "USER");
      personalFields.forEach((key) => {
        if (personalErrors[key]) stepErrors[key] = personalErrors[key];
      });
    }

    if (step === 1) {
      const accountFields = ["username", "email", "password", "cpassword"];
      const accountErrors = validateFormData(formData, "USER");

      const passwordError = validatePassword(formData.password);
      if (passwordError) accountErrors.password = passwordError;

      const cpasswordError = validateConfirmPassword(
        formData.password,
        formData.cpassword,
      );
      if (cpasswordError) accountErrors.cpassword = cpasswordError;

      accountFields.forEach((key) => {
        if (accountErrors[key]) stepErrors[key] = accountErrors[key];
      });
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) navigate("/");
    else setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!validateStep(activeStep)) return;

    try {
      setLoading(true);

      await withSpinner(
        `${formData.firstName} ${formData.lastName}`.trim() || "User",
        async () => {
          const usernameCheck = await api.post("users/check-exist", {
            strUserName: formData.username,
          });
          if (usernameCheck.exists) {
            setErrors({ username: "This username already exists." });
            return showSwal("ERROR", {
              title: "Registration Failed",
              text: "This username already exists.",
              icon: "error",
            });
          }

          const emailCheck = await api.post("users/check-exist", {
            strEmail: formData.email,
          });
          if (emailCheck.exists) {
            setErrors({ email: "This email already exists." });
            return showSwal("ERROR", {
              title: "Registration Failed",
              text: "This email already exists.",
              icon: "error",
            });
          }

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
            recaptcha: recaptchaValue,
          };

          await api.post("users", payload);

          await showSwal("SUCCESS", {
            title: "Registration Successful!",
            text: "Your account has been created successfully.",
            icon: "success",
          });

          navigate("/");
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepFields = (step) => {
    if (step === 0)
      return [
        { label: "First Name", name: "firstName", xs: 4 },
        { label: "Middle Name", name: "middleName", xs: 4 },
        { label: "Last Name", name: "lastName", xs: 4 },
        { label: "Nickname", name: "nickname", xs: 6 },
        {
          label: "Sex",
          name: "sex",
          type: "select",
          xs: 6,
          options: Object.entries(sex).map(([key, label]) => ({
            label,
            value: label,
          })),
        },
      ];

    if (step === 1)
      return [
        { label: "Username", name: "username", xs: 4 },
        { label: "Email", name: "email", type: "email", xs: 8 },
        { label: "Password", name: "password", type: "password", xs: 6 },
        {
          label: "Confirm Password",
          name: "cpassword",
          type: "password",
          xs: 6,
        },
      ];

    return [];
  };

  // ✅ Show reCAPTCHA before rendering the form
  if (!recaptchaVerified) {
    return (
      <AuthLayout title="VERIFY CAPTCHA" width={600}>
        <Box
          sx={{
            mt: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(value) => {
              setRecaptchaValue(value);
              setRecaptchaVerified(true);
            }}
          />

          {/* Back button below the reCAPTCHA */}
          <BaseButton
            label="Back to Login"
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{
              mt: 2,
              color: "#555",
              borderColor: "#bfc4c9",
              "&:hover": { bgcolor: "#f3f4f6", borderColor: "#9ca3af" },
            }}
            icon={<Login />}
          />
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="REGISTER AN ACCOUNT" width={600}>
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <FormGrid
        fields={getStepFields(activeStep)}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <BaseButton
          label={activeStep === 0 ? "Back to Login" : "Back"}
          variant="outlined"
          onClick={handleBack}
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
            disabled={loading}
            icon={<HowToReg />}
          />
        )}
      </Box>
    </AuthLayout>
  );
};

export default Register;
