import React, { useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import FormGrid from "./FormGrid";
import { getDueDateColor } from "../../utils/helpers/dueDateColor"; // ← adjust path

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

  // ── Due date color ────────────────────────────────────────────────────────
  const submissionColor = getDueDateColor(details?.dtDocSubmission);
  const dueDateColor = getDueDateColor(assignForm.dtAODueDate);

  const fieldsWithMax = useMemo(() => {
    return assignAOFields.map((field) => {
      if (field.type === "datetime-local" || field.type === "date") {
        return {
          ...field,
          inputProps: {
            ...(field.inputProps || {}),
            max: maxDate,
          },
          // ← this reaches MUI TextField's input element styling
          InputProps: {
            ...(field.InputProps || {}),
            style: {
              color: dueDateColor ?? "inherit",
              fontWeight: dueDateColor ? 600 : 400,
            },
          },
        };
      }
      return field;
    });
  }, [assignAOFields, maxDate, dueDateColor]); // ← add dueDateColor dep

  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 400, mb: 0 }}>
        {mode} an Account Officer
      </Typography>

      {/* Submission Date — also colorized */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 100,
          fontSize: "0.675rem",
          lineHeight: 0.8,
          fontStyle: "italic",
          mb: 3,
          color: submissionColor ?? "text.primary", // ← apply color here too
          ...(submissionColor && { fontWeight: 600 }),
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

      <FormGrid
        fields={fieldsWithMax}
        formData={assignForm}
        errors={assignErrors}
        handleChange={handleAssignChange}
      />
    </Box>
  );
}

export default AssignModalCard;