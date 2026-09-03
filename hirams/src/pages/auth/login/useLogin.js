import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import uiMessages from "../../../utils/helpers/uiMessages.js";
import { saveMappings } from "../../../utils/mappings/mappingCache.js";
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
  const [fieldErrors, setFieldErrors] = useState({});

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
    const { strUserName, strPassword } = formData;

    setStatusMessage("");
    setFieldErrors({});

    if (!strUserName.trim() || !strPassword) {
      setStatusMessage(`${uiMessages.common.invalidInput}`);
      setFieldErrors({
        username: !strUserName.trim(),
        password: !strPassword,
      });
      return;
    }

    setLoading(true);
    setStatusMessage(`${uiMessages.common.processingInput}`);

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

        setStatusMessage(`${uiMessages.common.successInput}`);
        await prefetchMappings();
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      if (error?.status === 404) {
        setStatusMessage(`${uiMessages.common.failedAttempt}`);
        setFieldErrors({ username: true });
      } else if (error?.status === 401) {
        setStatusMessage(`${uiMessages.common.invalidPassword}`);
        setFieldErrors({ password: true });
      } else {
        setStatusMessage(`${uiMessages.common.errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    showPassword,
    setShowPassword,
    statusMessage,
    fieldErrors,
    handleChange,
    handleLogin,
  };
}