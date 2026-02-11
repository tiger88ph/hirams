import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Link,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import { AccountCircle, ArrowBack, LockReset } from "@mui/icons-material";
import BaseButton from "../../components/common/BaseButton";
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
          Enter your email address below and we'll send you a link to reset your
          password.
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <BaseButton
          label="Back"
          variant="outlined"
          onClick={() => navigate("/")}
          icon={<ArrowBack fontSize="small" />}
          sx={{
            color: "#555",
            borderColor: "#bfc4c9",
            "&:hover": {
              bgcolor: "#f3f4f6",
              borderColor: "#9ca3af",
            },
          }}
        />

        <BaseButton
          label={
            loading ? <CircularProgress size={18} color="inherit" /> : "Reset"
          }
          onClick={handleReset}
          disabled={loading}
          icon={!loading && <LockReset fontSize="small" />}
          sx={{
            bgcolor: "#034FA5",
            "&:hover": { bgcolor: "#033f8d" },
          }}
        />
      </Box>
    </AuthLayout>
  );
};

export default ForgotPassword;
