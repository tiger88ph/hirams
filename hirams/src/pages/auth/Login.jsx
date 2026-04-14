import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Link, useTheme } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from "@mui/icons-material";
import BaseButton from "../../components/common/BaseButton";
import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";
import DotSpinner from "../../components/common/DotSpinner";
import api from "../../utils/api/api";
import uiMessages from "../../utils/helpers/uiMessages";
import { saveMappings } from "../../utils/mappings/mappingCache";

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();

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
      const data = await api.get("mappings");
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
      const response = await api.post("auth/login", {
        strUserName: strUserName.trim(),
        strPassword,
      });

      const user = response?.user;

      if (response?.success && user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user.nUserId);
        localStorage.setItem("role", user.cUserType?.toUpperCase().trim());
        localStorage.setItem("status", user.cStatus?.toUpperCase().trim());

        setStatusMessage(`${uiMessages.common.successInput}`);
        await prefetchMappings();
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      if (error.status === 404) {
        setStatusMessage(`${uiMessages.common.failedAttempt}`);
        setFieldErrors({ username: true });
      } else if (error.status === 401) {
        setStatusMessage(`${uiMessages.common.invalidPassword}`);
        setFieldErrors({ password: true });
      } else {
        setStatusMessage(`${uiMessages.common.errorMessage}`);
      }
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="LOGIN">
      <Box sx={{ mb: statusMessage ? 2 : 3.5 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 100, fontSize: { xs: "1rem", sm: "1.25rem" } }}
        >
          Welcome Back!
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Please login to access your HiRAMS dashboard.
        </Typography>
      </Box>

      {statusMessage && (
        <Typography
          sx={{
            color:
              statusMessage.includes("Processing") ||
              statusMessage.includes("Redirecting")
                ? "green"
                : "red",
            mb: 1,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {statusMessage}
        </Typography>
      )}

      <AuthTextField
        label="User Name"
        name="strUserName"
        value={formData.strUserName}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
        error={!!fieldErrors.username}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      <AuthTextField
        label="Password"
        name="strPassword"
        type={showPassword ? "password" : "text" }
        value={formData.strPassword}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        startIcon={<Lock sx={{ color: "#5a585b" }} />}
        endIcon={showPassword ? <VisibilityOff /> : <Visibility />}
        onEndIconClick={() => setShowPassword((prev) => !prev)}
        error={!!fieldErrors.password}
        sx={{ mb: 1 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      {/* Register Account & Forgot Password — always one row */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Link
          component="button"
          onClick={() => navigate("/register")}
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.85rem" },
            textDecoration: "none",
            "&:hover": { textDecoration: "none" },
          }}
        >
          Register Account
        </Link>

        <Link
          component="button"
          onClick={() => navigate("/forgotPassword")}
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.85rem" },
            textDecoration: "none",
            "&:hover": { textDecoration: "none" },
          }}
        >
          Forgot Password?
        </Link>
      </Box>

      <BaseButton
        label={
          loading || statusMessage.includes("Redirecting") ? (
            <DotSpinner size={8} />
          ) : (
            "Login"
          )
        }
        onClick={handleLogin}
        disabled={loading}
        sx={{
          width: "100%",
          py: { xs: 1.2, sm: 1.5 },
          mb: 1,
        }}
        actionColor="login"
      />
    </AuthLayout>
  );
};

export default Login;