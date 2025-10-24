import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

/**
 * Reusable confirmation verification card
 *
 * @param {string} entityName - The name of the entity being verified (e.g., "John Doe")
 * @param {string} verificationInput - The user's input value
 * @param {function} setVerificationInput - Setter function for input
 * @param {string} verificationError - Error message (if any)
 * @param {function} onBack - Back button handler
 * @param {function} onConfirm - Confirm button handler
 * @param {string} actionWord - The action label (e.g., "Delete", "Deactivate")
 * @param {string} instructionLabel - Custom label for input field (optional)
 * @param {string} confirmButtonColor - MUI color (default: "error")
 * @param {string} confirmButtonText - Custom text for confirm button (optional)
 */
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
    <Box
      sx={{
        minHeight: { xs: "auto", sm: 220 },
        p: { xs: 2, sm: 3 },
        bgcolor: "#f9f9f9",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {/* Header */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          wordBreak: "break-word",
          fontWeight: 600,
          color: "#333",
        }}
      >
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
      </Typography>

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
          "& .MuiInputBase-root": { bgcolor: "#fff" },
        }}
        inputProps={{ maxLength: 50 }}
      />

      {/* Button Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Back Button */}
        <Button
          variant="contained"
          onClick={onBack}
          sx={{
            textTransform: "none",
            bgcolor: "#6b7280",
            "&:hover": { bgcolor: "#80868F" },
            borderRadius: "9999px",
            fontSize: "0.8rem",
            px: { xs: 1.5, sm: 2 },
            py: 0.8,
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
            fontSize: "0.8rem",
            px: { xs: 2, sm: 3 },
            py: 0.8,
            borderRadius: "9999px",
          }}
        >
          {confirmButtonText || `Confirm ${capitalizedAction}`}
        </Button>
      </Box>
    </Box>
  );
}

export default VerificationModalCard;
