import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from "@mui/icons-material";

function Login() {
  const navigate = useNavigate(); // <-- Add this line
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgotPassword"); // Redirect to the forgot password page
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const accentColor = "#FF7905"; // Icon color
  const buttonColor = "#034FA5"; // Button & top bar color

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 400,
          maxWidth: "90%",
          borderRadius: 3,
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Top color bar touching edges */}
        <Box sx={{ height: 6, width: "100%", bgcolor: buttonColor }} />

        <Box sx={{ p: 5, pt: 3 }}>
          {/* Logo */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <img
              src="/hirams-logo.png"
              alt="Company Logo"
              style={{ width: 150, height: 40 }}
            />
          </Box>

          {/* Divider */}
          <Divider sx={{ mb: 2 }} />

          {/* Login Title */}
          <Typography
            variant="h5"
            sx={{ mb: 1, fontWeight: 600, color: buttonColor }}
          >
            LOGIN
          </Typography>

          {/* Welcome Info */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 100, color: "text.primary", mb: 0 }}
            >
              Welcome Back!
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Please login to access your HiRAMS dashboard.
            </Typography>
          </Box>

          {/* Username */}
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: accentColor }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Password */}
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            size="small"
            sx={{ mb: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: accentColor }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? (
                      <VisibilityOff sx={{ color: accentColor }} />
                    ) : (
                      <Visibility sx={{ color: accentColor }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Remember Me + Forgot Password */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "nowrap",
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
                <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                  Remember me
                </Typography>
              }
              sx={{ ml: 0 }}
            />

            <Link
              component="button"
              variant="body2"
              onClick={handleForgotPassword}
              sx={{ fontSize: "0.85rem" }}
            >
              Forgot Password?
            </Link>
          </Box>

          {/* Login Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{
              textTransform: "none",
              py: 1.5,
              mb: 2,
              bgcolor: buttonColor,
              "&:hover": { bgcolor: "#033f8d" },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Login"}
          </Button>

          {/* Footer */}
          <Typography variant="caption" color="text.secondary">
            &copy; {new Date().getFullYear()} HiRAMS. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
