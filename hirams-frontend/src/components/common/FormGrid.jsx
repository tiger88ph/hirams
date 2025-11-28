import React, { useEffect, useRef } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  FormControl,
  InputLabel,
} from "@mui/material";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function FormGrid({
  fields = [],
  switches = [],
  formData = {},
  errors = {},
  handleChange,
  handleSwitchChange,
  onLastFieldTab,
  autoFocus = true,
}) {
  const firstInputRef = useRef(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!autoFocus) return;
    if (firstInputRef.current) {
      const timer = setTimeout(() => firstInputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleKeyDown = (e, index, multiline) => {
    if (!multiline) {
      if ((e.key === "Enter" && !multiline) || e.key === "Tab") {
        e.preventDefault();
        const nextIndex = index + 1;
        if (nextIndex < inputRefs.current.length) {
          inputRefs.current[nextIndex]?.focus();
        } else if (onLastFieldTab) {
          onLastFieldTab();
        }
      }
    }
  };

  const renderQuill = (field, index) => {
    const bgColor = "#fafafa"; // or whatever your form background is

    return (
      <FormControl fullWidth size="small" error={!!errors[field.name]}>
        <InputLabel
          shrink
          sx={{
            backgroundColor: bgColor,
            px: 0.5,
            borderRadius: 0.25,
          }}
        >
          {field.label}
        </InputLabel>

        <ReactQuill
          theme="snow"
          value={formData[field.name] || ""}
          onChange={(val) =>
            handleChange({ target: { name: field.name, value: val } })
          }
          placeholder={field.placeholder || ""}
          modules={{
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
            ],
          }}
          style={{
            minHeight: field.minRows ? field.minRows * 24 : 100,
            backgroundColor: bgColor, // ensures editor background matches label
          }}
          ref={(el) => (inputRefs.current[index] = el)}
        />

        {errors[field.name] && (
          <Typography variant="caption" color="error">
            {errors[field.name]}
          </Typography>
        )}
      </FormControl>
    );
  };

  return (
    <Grid container spacing={1.5}>
      {fields.map((field, index) => {
        const isDateField =
          field.type === "date" ||
          field.type === "time" ||
          field.type === "datetime-local";

        const disabled = field.dependsOn ? !formData[field.dependsOn] : false;

        // SELECT FIELD
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
                inputRef={(el) => {
                  inputRefs.current[index] = el;
                  if (index === 0) firstInputRef.current = el;
                }}
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

        // CHECKBOX FIELD
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
                  />
                }
                label={field.label || ""}
              />
            </Grid>
          );
        }

        // MULTILINE FIELD
        if (field.multiline) {
          // If you want plain textarea, use plainMultiline
          if (field.plainMultiline) {
            return (
              <Grid item xs={field.xs || 12} key={field.name}>
                <TextField
                  label={field.label}
                  name={field.name}
                  fullWidth
                  size="small"
                  multiline
                  minRows={field.minRows || 3}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  error={!!errors[field.name]}
                  helperText={errors[field.name] || ""}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  onKeyDown={(e) => handleKeyDown(e, index, true)}
                />
              </Grid>
            );
          }

          // Otherwise use ReactQuill
          return (
            <Grid item xs={field.xs || 12} key={field.name}>
              {renderQuill(field, index)}
            </Grid>
          );
        }

        // NORMAL TEXTFIELD
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
              InputLabelProps={isDateField ? { shrink: true } : {}}
              inputRef={(el) => {
                inputRefs.current[index] = el;
                if (index === 0) firstInputRef.current = el;
              }}
              onKeyDown={(e) => handleKeyDown(e, index, field.multiline)}
            />
          </Grid>
        );
      })}

      {/* SWITCHES */}
      {switches.map((sw) => (
        <Grid item xs={sw.xs || 12} key={sw.name}>
          <FormControlLabel
            control={
              <Switch
                name={sw.name}
                checked={!!formData[sw.name]}
                onChange={handleSwitchChange}
                color="primary"
              />
            }
            label={sw.label || ""}
          />
        </Grid>
      ))}
    </Grid>
  );
}
