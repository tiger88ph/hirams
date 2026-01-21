import React from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AlertHeaderTitle from "./AlertHeaderTitle";
import FormGrid from "./FormGrid";

function VerificationModalCard({
  entityName,
  verificationInput,
  setVerificationInput,
  verificationError,
  onBack,
  onConfirm,
  actionWord = "Delete",
  instructionLabel = "Please enter the specified character to proceed",
  confirmButtonColor = "error",
  confirmButtonText,
  helperText = `Enter the first character of "${entityName}" to confirm the ${actionWord.toLowerCase()}.`,
  // support additional helperText
}) {
  const capitalizedAction =
    actionWord.charAt(0).toUpperCase() + actionWord.slice(1).toLowerCase();

  // FormGrid configuration
  const fields = [
    {
      name: "verification",
      label: instructionLabel,
      xs: 12,
      multiline: false,
      maxLength: 1,
    },
  ];

  const formData = { verification: verificationInput };
  const errors = { verification: verificationError };

  const handleChange = (e) => setVerificationInput(e.target.value);

  return (
    <Box sx={{ p: 0.5 }}>
      {/* Header */}
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

      {/* FormGrid Input */}
      <Box sx={{ mt: 2 }}>
        <FormGrid
          fields={fields.map((f) => ({
            ...f,
            helperText: helperText || f.helperText,
          }))}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          autoFocus
        />
      </Box>

      {/* Buttons */}
      {/* <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          mt: 2,
        }}
      >
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
            "&:hover": { borderColor: "#9ca3af", bgcolor: "#f3f4f6" },
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
          Back
        </Button>

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
      </Box> */}
    </Box>
  );
}

export default VerificationModalCard;
