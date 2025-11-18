import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AlertHeaderTitle from "./AlertHeaderTitle";

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
    <Box sx={{ p: 0.5 }}>
      
      {/* Professional Header */}
      <AlertHeaderTitle>{title}</AlertHeaderTitle>

      {/* Input Field */}
      <TextField
        label="Remarks"
        placeholder={placeholder}
        multiline
        minRows={3}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        error={!!remarksError}
        helperText={
          remarksError ||
          "Tip: Press Ctrl + Enter to save instantly."
        }
        fullWidth
        sx={{
          mb: 3,
          "& .MuiInputBase-root": {
            bgcolor: "#fff",
            borderRadius: 2,
          },
        }}
        inputProps={{ maxLength: 500 }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSave();
          }
        }}
      />

      {/* Buttons */}
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

        {/* Save Button */}
        <Button
          variant="contained"
          color={saveButtonColor}
          onClick={onSave}
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
          {saveButtonText}
        </Button>
      </Box>
    </Box>
  );
}

export default RemarksModalCard;
