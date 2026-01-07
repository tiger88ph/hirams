import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AlertHeaderTitle from "./AlertHeaderTitle";
import FormGrid from "./FormGrid"; // your FormGrid component

export default function RemarksModalCard({
  remarks,
  setRemarks,
  remarksError,
  onBack,
  onSave,

  /** Optional customization */
  actionWord = "updating",
  entityName = "this item",
  selectedAOName = null,
  saveButtonColor = "primary",
  saveButtonText = "Save Remarks",
}) {
  const fields = [
    {
      name: "remarks",
      label: "Remarks",
      multiline: true,
      minRows: 3,
      plainMultiline: true,
      placeholder: `Optional: Add remarks for ${actionWord} ${entityName}.`,
    },
  ];

  const formData = { remarks };
  const errors = { remarks: remarksError };

  const handleChange = ({ target: { name, value } }) => {
    if (name === "remarks") setRemarks(value);
  };

  return (
    <Box sx={{ p: 0.5 }}>
      {/* Header */}
      <AlertHeaderTitle>
        Remarks for {actionWord}{" "}
        <Typography component="span" sx={{ fontWeight: "bold", fontStyle: "italic" }}>
          "{entityName}"
        </Typography>
        {selectedAOName && selectedAOName.trim() !== "" && (
          <>
            {" "}to{" "}
            <Typography component="span" sx={{ fontWeight: "bold", fontStyle: "italic" }}>
              "{selectedAOName}"
            </Typography>
          </>
        )}
      </AlertHeaderTitle>

      {/* FormGrid instead of plain TextField */}
      <FormGrid
        fields={fields}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        autoFocus
      />

      {/* Buttons */}
      {/* <Box
        sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 1 }}
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
      </Box> */}
    </Box>
  );
}
