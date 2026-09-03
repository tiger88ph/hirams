import React, { useMemo } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import FormGrid from "../form/FormGrid";
import { getDueDateColor } from "../../utils/helpers/dueDateColor";
import getThemeColors from "../../utils/style/getThemeColors";


// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  textPrimary: c.slate.borderStrong,
  textMuted: c.gray.textSecondary,
});


function AssignAOModalContent({
  mode = "Assign",
  details,
  assignForm,
  assignErrors,
  assignAOFields,
  handleAssignChange,
  onBack,
  onSave,
}) {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);


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


  // ── Due date color ──────────────────────────────────────────────────
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
          InputProps: {
            ...(field.InputProps || {}),
            style: {
              color: dueDateColor ?? colors.textPrimary,
              fontWeight: dueDateColor ? 600 : 400,
            },
          },
        };
      }
      return field;
    });
  }, [assignAOFields, maxDate, dueDateColor, colors.textPrimary]);


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
          color: submissionColor ?? colors.textPrimary,
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


export default AssignAOModalContent;