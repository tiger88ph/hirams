import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthAPI from "../../../api/endpoints/auth.api.js";
import uiMessages from "../../../utils/helpers/uiMessages";

export default function useForgotPassword() {
  const navigate = useNavigate();

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
      const checkResponse = await AuthAPI.checkUsername({
        strUserName: username.trim(),
      });

      if (!checkResponse?.exists) {
        setStatusMessage(uiMessages.common.failedAttempt);
        setFieldErrors({ username: true });
        return; // ← finally will still fire
      }

      await AuthAPI.forgotPassword({
        strUserName: username.trim(),
        strEmail: email.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      if (error.status === 404) {
        setStatusMessage(
          "This email is not registered to the provided username.",
        );
        setFieldErrors({ email: true });
      } else if (error.status === 422) {
        setStatusMessage("Please check your inputs and try again.");
        setFieldErrors({ username: true, email: true });
      } else {
        setStatusMessage(uiMessages.common.errorMessage);
      }
    } finally {
      setLoading(false); // ← always runs, no more stuck spinner
    }
  };

  return {
    formData,
    loading,
    statusMessage,
    fieldErrors,
    submitted,
    handleChange,
    handleReset,
    navigate,
  };
}