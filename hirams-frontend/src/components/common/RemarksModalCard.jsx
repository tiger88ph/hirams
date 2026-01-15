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
        <Typography 
          component="span" 
          sx={{ 
            fontWeight: "bold", 
            fontStyle: "italic",
            fontSize: { xs: "0.775rem", sm: ".950rem", md: "1.025rem" },
            wordBreak: "break-word"
          }}
        >
          "{entityName}"
        </Typography>
        {selectedAOName && selectedAOName.trim() !== "" && (
          <>
            <Typography
              component="span"
              sx={{ 
                fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" }
              }}
            >
              {" "}to{" "}
            </Typography>
            <Typography 
              component="span" 
              sx={{ 
                fontWeight: "bold", 
                fontStyle: "italic",
                fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                wordBreak: "break-word"
              }}
            >
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
    </Box>
  );
}