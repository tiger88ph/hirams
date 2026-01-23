import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Link,
  useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff, AccountCircle, Lock } from "@mui/icons-material";

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
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); // always show above username
  const [fieldErrors, setFieldErrors] = useState({}); // { username: true, password: true }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setStatusMessage("");
    setFieldErrors({});
  };

  // Clear field errors after 5 seconds
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const timer = setTimeout(() => setFieldErrors({}), 5000);
      return () => clearTimeout(timer);
    }
  }, [fieldErrors]);

  // Clear status message after 5 seconds
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
      // Save user info
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.nUserId);
      localStorage.setItem("role", user.cUserType?.toUpperCase().trim());
      localStorage.setItem("status", user.cStatus?.toUpperCase().trim());

      // Show "Redirecting..." with spinner
      setStatusMessage("Redirecting...");

      // Keep spinner visible while redirecting
      setTimeout(() => {
        navigate("/dashboard"); // redirect after 1s
      }, 1000);
    }
  } catch (error) {
    console.error("Login error:", error);

    if (error.status === 404) {
      setStatusMessage("Login failed. Account does not exist or inactive.");
      setFieldErrors({ username: true });
    } else if (error.status === 401) {
      setStatusMessage("Password is incorrect.");
      setFieldErrors({ password: true });
    } else {
      setStatusMessage("Something went wrong. Please try again later.");
    }

    setLoading(false); // stop spinner on error
  }
};


  return (
    <AuthLayout title="LOGIN">
      {/* Header */}
      <Box sx={{ mb: statusMessage ? 2 : 3.5 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 100,
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
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

      {/* Status message - always above username */}
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

      {/* Username */}
      <AuthTextField
        label="User Name"
        name="strUserName"
        value={formData.strUserName}
        onChange={handleChange}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
        error={!!fieldErrors.username}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      {/* Password */}
      <AuthTextField
        label="Password"
        name="strPassword"
        type={showPassword ? "text" : "password"}
        value={formData.strPassword}
        onChange={handleChange}
        startIcon={<Lock sx={{ color: "#5a585b" }} />}
        endIcon={showPassword ? <VisibilityOff /> : <Visibility />}
        onEndIconClick={() => setShowPassword((prev) => !prev)}
        error={!!fieldErrors.password}
        sx={{ mb: 1 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      {/* Remember me & Forgot Password */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              color="primary"
              sx={{ p: 0.5 }}
            />
          }
          label={
            <Typography
              sx={{
                fontSize: { xs: "0.7rem", sm: "0.85rem" },
                lineHeight: { xs: 1, sm: 1.2 },
              }}
            >
              Remember me
            </Typography>
          }
        />

        <Link
          component="button"
          variant="body2"
          onClick={() => navigate("/forgotPassword")}
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.85rem" },
            lineHeight: { xs: 1, sm: 1.2 },
            mt: { xs: 0.5, sm: 0 },
            ml: { xs: 0, sm: "auto" },
            alignSelf: { xs: "flex-start", sm: "center" },
          }}
        >
          Forgot Password?
        </Link>
      </Box>

      <Button
  variant="contained"
  fullWidth
  onClick={handleLogin}
  disabled={loading}
  sx={{
    textTransform: "none",
    py: { xs: 1.2, sm: 1.5 },
    mb: 1,
    bgcolor: "#034FA5",
    fontSize: { xs: "0.75rem", sm: "0.875rem" },
    "&:hover": { bgcolor: "#033f8d" },
  }}
>
  {(loading || statusMessage.includes("Redirecting")) ? (
    <DotSpinner size={8} />
  ) : (
    "Login"
  )}
</Button>

    </AuthLayout>
  );
};

export default Login;
