import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthAPI from "../../../api/endpoints/auth.api.js";
import UserAPI from "../../../api/endpoints/user.api.js";
import useMapping from "../../../utils/mappings/useMapping";
import {
  showSwal,
  showSpinner,
  withSpinner,
} from "../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../utils/form/validation";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../../utils/helpers/passwordFormat";
import uiMessages from "../../../utils/helpers/uiMessages";
import Swal from "sweetalert2";

export default function useRegister() {
  const navigate = useNavigate();
  const { sex, statuses } = useMapping();
  const pendingKey = Object.keys(statuses)[2];

  const [activeStep, setActiveStep] = useState(0);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSending, setOtpSending] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    sex: "",
    type: "V",
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
    cpassword: "",
  });
  const [errors, setErrors] = useState({});

  // ── Resend Timer ──────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Field Change ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

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
    }
  };

  // ── Step Validation ──────────────────────────────────────────────────────
  const validateStep = (step) => {
    const stepErrors = {};
    if (step === 0) {
      const personalErrors = validateFormData(formData, "USER");
      ["firstName", "lastName", "nickname", "sex"].forEach((k) => {
        if (personalErrors[k]) stepErrors[k] = personalErrors[k];
      });
    }
    if (step === 1) {
      const accountErrors = validateFormData(formData, "USER");
      const pwErr = validatePassword(formData.password);
      const cpwErr = validateConfirmPassword(
        formData.password,
        formData.cpassword,
      );
      if (pwErr) accountErrors.password = pwErr;
      if (cpwErr) accountErrors.cpassword = cpwErr;
      ["username", "email", "password", "cpassword"].forEach((k) => {
        if (accountErrors[k]) stepErrors[k] = accountErrors[k];
      });
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // ── Send OTP ─────────────────────────────────────────────────────────────
  const sendOtp = async ({ silent = false } = {}) => {
    const doSend = async () => {
      await AuthAPI.sendOtp({
        strEmail: formData.email,
        strUserName: formData.username,
      });
      startResendTimer();
      setOtp("");
      setOtpError(false);
    };
    if (silent) {
      await doSend();
    } else {
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

  // ── Next Step ────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!validateStep(activeStep)) return;

    if (activeStep === 1) {
      try {
        await withSpinner("Checking details…", async () => {
          const usernameCheck = await UserAPI.checkExists({
            strUserName: formData.username,
          });
          if (usernameCheck.exists) {
            setErrors({ username: uiMessages.common.usernameExists });
            throw new Error("username_exists");
          }

          const emailCheck = await UserAPI.checkExists({
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
        /* errors already set */
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

  // ── Final Register ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (otp.length < 6) {
      setOtpError(true);
      return;
    }

    try {
      await withSpinner(
        `${formData.firstName} ${formData.lastName}`.trim() || "User",
        async () => {
          await AuthAPI.verifyOtp({ strEmail: formData.email, otp });

          const payload = {
            strFName: formData.firstName,
            strMName: formData.middleName || "",
            strLName: formData.lastName,
            strNickName: formData.nickname || "",
            cSex: Object.keys(sex).find((key) => sex[key] === formData.sex),
            strEmail: formData.email,
            strPhoneNo: formData.phoneNumber || "",
            strUserName: formData.username,
            strPassword: formData.password,
            cStatus: pendingKey,
            cUserType: "V",
            recaptcha: recaptchaValue,
          };
          await UserAPI.createUser(payload);
          await showSwal("REGISTRATION_SUCCESS");
          navigate("/");
        },
      );
    } catch {
      setOtpError(true);
    }
  };

  // ── Field Config ──────────────────────────────────────────────────────────
  const getStepFields = (step) => {
    if (step === 0)
      return [
        { label: "First Name", name: "firstName", xs: 4, sm: 4 },
        { label: "Middle Name", name: "middleName", xs: 4, sm: 4 },
        { label: "Last Name", name: "lastName", xs: 4, sm: 4 },
        { label: "Nickname", name: "nickname", xs: 4, sm: 6 },
        {
          label: "Phone number",
          name: "phoneNumber",
          type: "phone",
          xs: 5,
          sm: 4,
        },
        {
          label: "Sex",
          name: "sex",
          type: "select",
          xs: 3,
          sm: 6,
          options: Object.entries(sex).map(([, label]) => ({
            label,
            value: label,
          })),
        },
      ];
    if (step === 1)
      return [
        { label: "Username", name: "username", type: "username", xs: 6, sm: 4 },
        { label: "Email", name: "email", type: "email", xs: 6, sm: 8 },
        {
          label: "Password",
          name: "password",
          type: "password",
          xs: 12,
          sm: 6,
        },
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

  return {
    navigate,
    activeStep,
    recaptchaValue,
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
  };
}