import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Link,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from "@mui/icons-material";

import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";
import AlertDialogCard from "../../components/common/AlertCard";
import api from "../../utils/api/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    strFName: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    setAlertOpen(true);
  }, []);

  // ✅ Handle input changes (including checkbox)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Handle login
  const handleLogin = async () => {
    const { strFName } = formData;

    if (!strFName.trim()) {
      alert("Please enter your first name.");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Logging in with:", strFName);

      // ✅ `api.post` already returns parsed JSON
      const response = await api.post("login", { strFName: strFName.trim() });
      console.log("📥 API response:", response);

      if (response?.success && response.user) {
        const user = response.user;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user.nUserId);

        alert(`Welcome, ${user.strFName}! 👋`);
        navigate("/dashboard");
      } else {
        alert(response?.message || "User not found. Please check your name.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again later.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="LOGIN">
      {/* Welcome alert */}
      <AlertDialogCard
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Welcome to HiRAMS!"
        message="This is a sample alert popup shown when the login page is loaded."
      />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 100 }}>
          Welcome Back!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Please login to access your HiRAMS dashboard.
        </Typography>
      </Box>

      {/* Username field */}
      <AuthTextField
        label="User Name"
        name="strFName"
        value={formData.strFName}
        onChange={handleChange}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
      />

      {/* Password field (optional for now) */}
      <AuthTextField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        startIcon={<Lock sx={{ color: "#5a585b" }} />}
        endIcon={showPassword ? <VisibilityOff /> : <Visibility />}
        onEndIconClick={() => setShowPassword((prev) => !prev)}
      />

      {/* Remember / Forgot */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              Remember me
            </Typography>
          }
        />

        <Link
          component="button"
          variant="body2"
          onClick={() => navigate("/forgotPassword")}
          sx={{ fontSize: "0.85rem" }}
        >
          Forgot Password?
        </Link>
      </Box>

      {/* Login button */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleLogin}
        disabled={loading}
        sx={{
          textTransform: "none",
          py: 1.5,
          mb: 1,
          bgcolor: "#034FA5",
          "&:hover": { bgcolor: "#033f8d" },
        }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : "Login"}
      </Button>
    </AuthLayout>
  );
};

export default Login;
