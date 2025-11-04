import React, { useEffect, useRef } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

export default function FormGrid({
  fields = [],
  formData = {},
  errors = {},
  handleChange,
  onLastFieldTab,
  autoFocus = true, // ✅ new optional prop
}) {
  const firstInputRef = useRef(null);
  const inputRefs = useRef([]);

  // ✅ Focus first input when form is first rendered (not on every keystroke)
  useEffect(() => {
    if (!autoFocus) return;
    if (firstInputRef.current) {
      const timer = setTimeout(() => {
        firstInputRef.current.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]); // ✅ no longer depends on `fields`

  // ✅ Handle Enter or Tab to move to next field
  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const nextIndex = index + 1;

      if (nextIndex < inputRefs.current.length) {
        inputRefs.current[nextIndex]?.focus();
      } else if (onLastFieldTab) {
        onLastFieldTab();
      }
    }
  };

  return (
    <Grid container spacing={1.5}>
      {fields.map((field, index) => {
        const isDateField =
          field.type === "date" ||
          field.type === "time" ||
          field.type === "datetime-local";
        const disabled = field.dependsOn ? !formData[field.dependsOn] : false;

        const commonProps = {
          inputRef: (el) => {
            inputRefs.current[index] = el;
            if (index === 0) firstInputRef.current = el;
          },
          onKeyDown: (e) => handleKeyDown(e, index),
        };

        if (field.type === "select") {
          return (
            <Grid item xs={field.xs || 12} key={field.name}>
              <TextField
                select
                fullWidth
                size="small"
                label={field.label}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                error={!!errors[field.name]}
                helperText={errors[field.name] || ""}
                {...commonProps}
              >
                {(field.options || []).map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          );
        }

        if (field.type === "checkbox") {
          return (
            <Grid item xs={field.xs || 12} key={field.name}>
              <FormControlLabel
                control={
                  <Checkbox
                    name={field.name}
                    checked={!!formData[field.name]}
                    onChange={handleChange}
                    color="primary"
                    inputRef={(el) => {
                      inputRefs.current[index] = el;
                      if (index === 0) firstInputRef.current = el;
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                }
                label={field.label || ""}
              />
            </Grid>
          );
        }

        return (
          <Grid item xs={field.xs || 12} key={field.name}>
            <TextField
              label={field.label}
              name={field.name}
              type={field.type || "text"}
              fullWidth
              size="small"
              value={formData[field.name] || ""}
              onChange={handleChange}
              error={!!errors[field.name]}
              helperText={errors[field.name] || ""}
              disabled={disabled}
              multiline={field.multiline || false}
              minRows={field.minRows || undefined}
              InputLabelProps={isDateField ? { shrink: true } : {}}
              {...commonProps}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
