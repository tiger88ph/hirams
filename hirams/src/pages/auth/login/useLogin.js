import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import uiMessages from "../../../utils/helpers/uiMessages.js";
import { saveMappings } from "../../../utils/storage/mappingCache.js";
import { setItem } from "../../../utils/storage/localStorage.js";
import AuthAPI from "../../../api/endpoints/auth.api.js";
import MappingAPI from "../../../api/endpoints/mapping.api.js";

export default function useLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    strUserName: "",
    strPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  // "success" = processing/redirecting, "error" = something went wrong.
  // Replaces guessing the colour by sniffing the message text.
  const [statusTone, setStatusTone] = useState("error");
  const [fieldErrors, setFieldErrors] = useState({});

  const setStatus = (message, tone = "error") => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  // Field errors take over the status line, so the stale "Processing…" must
  // be dropped the moment "Password is incorrect." shows up.
  const showFieldErrors = (errors) => {
    setStatusMessage("");
    setStatusTone("error");
    setFieldErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatusMessage("");
    setFieldErrors({});
  };

  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const timer = setTimeout(() => setFieldErrors({}), 5000);
      return () => clearTimeout(timer);
    }
  }, [fieldErrors]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const prefetchMappings = async () => {
    try {
      const data = await MappingAPI.getMappings();
      saveMappings(data);
    } catch (e) {
      console.warn("Mapping prefetch failed:", e);
    }
  };

  const handleLogin = async () => {
    if (loading) return; // Enter / double click while a request is running

    const { strUserName, strPassword } = formData;

    setStatusMessage("");
    setFieldErrors({});

    if (!strUserName.trim() || !strPassword) {
      // Field-specific messages live under the inputs, not on the status line.
      const errors = {};
      if (!strUserName.trim()) errors.username = "Username is required.";
      if (!strPassword) errors.password = "Password is required.";
      showFieldErrors(errors);
      return;
    }

    setLoading(true);
    setStatus(uiMessages.common.processingInput, "success");

    let redirecting = false;

    try {
      const payload = {
        strUserName: strUserName.trim(),
        strPassword,
      };

      const response = await AuthAPI.login(payload);
      const user = response?.user;

      if (response?.success && user) {
        setItem("token", response.token);
        setItem("user", user);
        setItem("userId", user.nUserId);
        setItem("role", user.cUserType?.toUpperCase().trim());
        setItem("status", user.cStatus?.toUpperCase().trim());

        setStatus(uiMessages.common.successInput, "success");
        await prefetchMappings();
        // Hold `loading` through the redirect window so the Register /
        // Forgot Password links stay locked while "Redirecting…" shows.
        redirecting = true;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate("/dashboard");
      } else {
        setStatus(uiMessages.common.errorMessage, "error");
      }
    } catch (error) {
      if (error?.status === 404) {
        showFieldErrors({ username: uiMessages.common.failedAttempt });
      } else if (error?.status === 401) {
        showFieldErrors({ password: uiMessages.common.invalidPassword });
      } else {
        setStatus(uiMessages.common.errorMessage, "error");
      }
    } finally {
      if (!redirecting) setLoading(false);
    }
  };

  return {
    formData,
    loading,
    showPassword,
    setShowPassword,
    statusMessage,
    statusTone,
    fieldErrors,
    handleChange,
    handleLogin,
  };
}