import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Link, CircularProgress, Typography, useTheme } from "@mui/material";
import { AccountCircle, ArrowBack } from "@mui/icons-material";
import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleReset = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending reset link to:", email);
      await new Promise((res) => setTimeout(res, 1000));
      alert("Password reset link sent!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="FORGOT PASSWORD">
      {/* Instruction */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            lineHeight: { xs: 1.2, sm: 1.5 },
          }}
        >
          Enter your email address below and we'll send you a link to reset your password.
        </Typography>
      </Box>

      {/* Email Input */}
      <AuthTextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
        sx={{ mb: 2 }}
        inputProps={{ style: { fontSize: theme.typography.body2.fontSize } }}
      />

      {/* Send Reset Link Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleReset}
        disabled={loading}
        sx={{
          textTransform: "none",
          py: { xs: 1.2, sm: 1.5 },
          mb: 2,
          bgcolor: "#034FA5",
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
          "&:hover": { bgcolor: "#033f8d" },
        }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : "Send Reset Link"}
      </Button>

      {/* Back to Login Link */}
      <Link
        component="button"
        variant="body2"
        onClick={() => navigate("/")}
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          fontSize: { xs: "0.7rem", sm: "0.85rem" },
          gap: 0.5, // space between icon and text
        }}
      >
        <ArrowBack fontSize="small" />
        Back to Login
      </Link>
    </AuthLayout>
  );
};

export default ForgotPassword;
