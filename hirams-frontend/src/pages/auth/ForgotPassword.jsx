import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  InputAdornment,
  Link,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // For navigation

  const handleChange = (e) => setEmail(e.target.value);

  const handleReset = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      console.log("Sending password reset link to:", email);
      await new Promise((res) => setTimeout(res, 1000));
      alert("Password reset link sent! Check your email.");
    } catch (error) {
      console.error("Error sending reset link:", error);
      alert("Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login"); // Redirect to login page
  };

  const buttonColor = "#034FA5";
  const accentColor = "#FF7905";

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
        {/* Top color bar */}
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

          {/* Title */}
          <Typography
            variant="h5"
            sx={{ mb: 2, fontWeight: 600, color: buttonColor }}
          >
            FORGOT PASSWORD
          </Typography>

          {/* Info Text */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Enter your email address below and we'll send you a link to reset
              your password.
            </Typography>
          </Box>

          {/* Email Field */}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={handleChange}
            fullWidth
            size="small"
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: accentColor }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Reset Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleReset}
            disabled={loading}
            sx={{
              textTransform: "none",
              py: 1.5,
              mb: 2,
              bgcolor: buttonColor,
              "&:hover": { bgcolor: "#033f8d" },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Send Reset Link"
            )}
          </Button>

          {/* Back to Login */}
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToLogin}
            sx={{ display: "block", mb: 2, fontSize: "0.85rem" }}
          >
            Back to Login
          </Link>

          {/* Footer */}
          <Typography variant="caption" color="text.secondary">
            &copy; {new Date().getFullYear()} HiRAMS. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default ForgotPassword;
