import React, { useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import FormGrid from "./FormGrid";

function AssignModalCard({
  mode = "Assign",
  details,
  assignForm,
  assignErrors,
  assignAOFields,
  handleAssignChange,
  onBack,
  onSave,
}) {
  // Format date for datetime-local max attribute
  const formatLocalDate = (date) => {
    const pad = (n) => (n < 10 ? "0" + n : n);
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  };

  const submissionDate = details?.dtDocSubmission
    ? new Date(details.dtDocSubmission)
    : null;

  const maxDate = submissionDate ? formatLocalDate(submissionDate) : null;

  // Add max attribute to date/datetime fields
  const fieldsWithMax = useMemo(() => {
    return assignAOFields.map((field) => {
      if (field.type === "datetime-local" || field.type === "date") {
        return {
          ...field,
          inputProps: {
            ...(field.inputProps || {}),
            max: maxDate,
          },
        };
      }
      return field;
    });
  }, [assignAOFields, maxDate]);

  return (
    <Box sx={{ p: 0.5 }}>
      {/* Header */}
      <Typography variant="subtitle1" sx={{ fontWeight: 400, mb: 2 }}>
        {mode} an Account Officer
      </Typography>

      {/* Submission Date */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 100,
          fontSize: "0.675rem",
          lineHeight: 0.8,
          fontStyle: "italic",
          color: "text.primary",
          mb: 3,
        }}
      >
        Doc. Submission:{" "}
        {details?.dtDocSubmission
          ? new Date(details.dtDocSubmission).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
          : "No submission date"}
      </Typography>

      {/* Form */}
      <FormGrid
        fields={fieldsWithMax}
        formData={assignForm}
        errors={assignErrors}
        handleChange={handleAssignChange}
      />

      {/* Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}>
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
          color="success"
          onClick={onSave}
          disabled={!assignForm.nAssignedAO || !assignForm.dtAODueDate}
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
          Save
        </Button>
      </Box>
    </Box>
  );
}

export default AssignModalCard;
