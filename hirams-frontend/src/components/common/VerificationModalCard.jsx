import React from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AlertHeaderTitle from "./AlertHeaderTitle";

function VerificationModalCard({
  entityName,
  verificationInput,
  setVerificationInput,
  verificationError,
  onBack,
  onConfirm,
  actionWord = "Delete",
  instructionLabel = "Enter first letter of name",
  confirmButtonColor = "error",
  confirmButtonText,
}) {
  const capitalizedAction =
    actionWord.charAt(0).toUpperCase() + actionWord.slice(1).toLowerCase();

  return (
    <Box sx={{ p: 0.5 }}>
      
      {/* Professional Header (same as RemarksModalCard) */}
      <AlertHeaderTitle>
        {capitalizedAction} Verification for{" "}
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            color:
              confirmButtonColor === "error"
                ? "#d32f2f"
                : confirmButtonColor === "success"
                ? "#2e7d32"
                : "#1565c0",
          }}
        >
          {entityName}
        </Box>
      </AlertHeaderTitle>

      {/* Input */}
      <TextField
        label={instructionLabel}
        value={verificationInput}
        onChange={(e) => setVerificationInput(e.target.value)}
        error={!!verificationError}
        helperText={
          verificationError ||
          `Please enter the required confirmation to ${actionWord.toLowerCase()} this item.`
        }
        fullWidth
        sx={{
          mb: 3,
          "& .MuiInputBase-root": {
            bgcolor: "#fff",
            borderRadius: 2,
          },
        }}
        inputProps={{ maxLength: 50 }}
      />

      {/* Buttons (same layout + styling as RemarksModalCard) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          mt: 1,
        }}
      >
        {/* Back Button */}
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            textTransform: "none",
            borderRadius: "9999px",
            fontSize: "0.85rem",
            px: 2.5,
            py: 1,
            color: "#555",
            borderColor: "#bfc4c9",
            "&:hover": {
              borderColor: "#9ca3af",
              bgcolor: "#f3f4f6",
            },
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
          Back
        </Button>

        {/* Confirm Button */}
        <Button
          variant="contained"
          color={confirmButtonColor}
          onClick={onConfirm}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            px: 3,
            py: 1,
            borderRadius: "9999px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        >
          {confirmButtonText || `Confirm ${capitalizedAction}`}
        </Button>
      </Box>
    </Box>
  );
}

export default VerificationModalCard;
