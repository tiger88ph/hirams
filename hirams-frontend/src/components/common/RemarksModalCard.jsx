import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

/**
 * Reusable Remarks Modal Card
 *
 * @param {string} remarks - Current remark text value
 * @param {function} setRemarks - Setter function for remark input
 * @param {string} remarksError - Error message (if any)
 * @param {function} onBack - Back button handler
 * @param {function} onSave - Save button handler
 * @param {string} title - Title of the modal (default: "Add Remarks")
 * @param {string} placeholder - Placeholder text for remarks input
 * @param {string} saveButtonColor - MUI color (default: "primary")
 * @param {string} saveButtonText - Custom text for save button
 */
function RemarksModalCard({
  remarks,
  setRemarks,
  remarksError,
  onBack,
  onSave,
  title = "Add Remarks",
  placeholder = "Type your remarks here...",
  saveButtonColor = "primary",
  saveButtonText = "Save Remarks",
}) {
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
          fontWeight: 600,
          color: "#333",
        }}
      >
        {title}
      </Typography>

      {/* Input Field */}
      <TextField
        label="Remarks"
        placeholder={placeholder}
        multiline
        minRows={4}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        error={!!remarksError}
        helperText={
          remarksError ||
          "Please enter your remarks. Press Ctrl + Enter to save quickly."
        }
        fullWidth
        sx={{
          mb: 3,
          "& .MuiInputBase-root": { bgcolor: "#fff" },
        }}
        inputProps={{ maxLength: 500 }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSave();
          }
        }}
      />

      {/* Action Buttons */}
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

        {/* Save Button */}
        <Button
          variant="contained"
          color={saveButtonColor}
          onClick={onSave}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            px: { xs: 2, sm: 3 },
            py: 0.8,
            borderRadius: "9999px",
          }}
        >
          {saveButtonText}
        </Button>
      </Box>
    </Box>
  );
}

export default RemarksModalCard;
