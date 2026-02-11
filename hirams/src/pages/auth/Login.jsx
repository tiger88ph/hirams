import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Link, useTheme } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
  Login as LoginIcon,
} from "@mui/icons-material";
import BaseButton from "../../components/common/BaseButton";
import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";
import DotSpinner from "../../components/common/DotSpinner";
import api from "../../utils/api/api";

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleLogin = async () => {
    const { strUserName, strPassword } = formData;

    setStatusMessage("");
    setFieldErrors({});

    if (!strUserName.trim() || !strPassword) {
      setStatusMessage("Please enter your Username and Password.");
      setFieldErrors({
        username: !strUserName.trim(),
        password: !strPassword,
      });
      return;
    }

    setLoading(true);
    setStatusMessage("Processing... Please Wait.");

    try {
      const response = await api.post("login", {
        strUserName: strUserName.trim(),
        strPassword,
      });

      const user = response?.user;

      if (response?.success && user) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user.nUserId);
        localStorage.setItem("role", user.cUserType?.toUpperCase().trim());
        localStorage.setItem("status", user.cStatus?.toUpperCase().trim());

        setStatusMessage("Redirecting...");

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      // Removed console.error to hide errors in console
      
      if (error.status === 404) {
        setStatusMessage("Login failed. Account does not exist or inactive.");
        setFieldErrors({ username: true });
      } else if (error.status === 401) {
        setStatusMessage("Password is incorrect.");
        setFieldErrors({ password: true });
      } else {
        setStatusMessage("Something went wrong. Please try again later.");
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
        type={showPassword ? "text" : "password"}
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

      {/* Create Account & Forgot Password */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "flex-start",
          mb: 2,
          gap: { xs: 0.5, sm: 0 },
        }}
      >
        <Link
          component="button"
          onClick={() => navigate("/register")}
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.85rem" },
            lineHeight: { xs: 1, sm: 1.2 },
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
            fontSize: { xs: "0.7rem", sm: "0.85rem" },
            lineHeight: { xs: 1, sm: 1.2 },
            ml: { sm: "auto" },
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
        icon={
          !(loading || statusMessage.includes("Redirecting")) && (
            <LoginIcon fontSize="small" />
          )
        }
        sx={{
          width: "100%",
          py: { xs: 1.2, sm: 1.5 },
          mb: 1,
          bgcolor: "#034FA5",
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
          "&:hover": { bgcolor: "#033f8d" },
        }}
      />
    </AuthLayout>
  );
};

export default Login;