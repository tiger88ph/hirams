import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthAPI from "../../../api/endpoints/auth.api.js";
import uiMessages from "../../../utils/helpers/uiMessages";

export default function useResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const usernameFromLink = searchParams.get("username") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const run = async () => {
      if (!token) {
        setTokenValid(false);
        setValidating(false);
        return;
      }
      try {
        await AuthAPI.validateResetToken({ token });
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
      setFieldErrors({
        password: !password,
        confirmPassword: !confirmPassword,
      });
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
      await AuthAPI.resetPassword({
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

  return {
    navigate,
    usernameFromLink,
    formData,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    loading,
    validating,
    tokenValid,
    statusMessage,
    isError,
    fieldErrors,
    success,
    handleChange,
    handleSubmit,
  };
}