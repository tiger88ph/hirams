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
import { Visibility, VisibilityOff, AccountCircle, Lock } from "@mui/icons-material";

import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";
import AlertDialogCard from "../../components/common/AlertCard"; // ✅ Import your reusable alert

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ State for alert modal
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    // ✅ Show alert automatically when page loads
    setAlertOpen(true);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      console.log("Logging in:", formData);
      await new Promise((res) => setTimeout(res, 1000));
      alert("Login successful!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="LOGIN">
      {/* ✅ Show the AlertCard on page load */}
      <AlertDialogCard
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Welcome to HiRAMS!"
        message="This is a sample alert popup shown when the login page is loaded."
      />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 100, mb: 0 }}>
          Welcome Back!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Please login to access your HiRAMS dashboard.
        </Typography>
      </Box>

      <AuthTextField
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
      />

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
