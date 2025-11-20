import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Link, CircularProgress, Typography } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { ArrowBack } from "@mui/icons-material";
import AuthLayout from "../../components/common/AuthLayout";
import AuthTextField from "../../components/common/AuthTextField";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email) return alert("Please enter your email.");
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Enter your email address below and we'll send you a link to reset your
          password.
        </Typography>
      </Box>

      <AuthTextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        startIcon={<AccountCircle sx={{ color: "#5a585b" }} />}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={handleReset}
        disabled={loading}
        sx={{
          textTransform: "none",
          py: 1.5,
          mb: 2,
          bgcolor: "#034FA5",
          "&:hover": { bgcolor: "#033f8d" },
        }}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <Link
        component="button"
        variant="body2"
        onClick={() => navigate("/")}
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          fontSize: "0.85rem",
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
