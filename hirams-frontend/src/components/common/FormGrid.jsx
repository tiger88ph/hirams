import React from "react";
import {
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  Typography,
} from "@mui/material";

export default function FormGrid({
  fields = [],
  switches = [],
  formData = {},
  errors = {},
  handleChange,
  handleSwitchChange,
}) {
  return (
    <Grid container spacing={1.5}>
      {fields.map((field) => {
        const isDateField =
          field.type === "date" ||
          field.type === "time" ||
          field.type === "datetime-local";

        const disabled = field.dependsOn ? !formData[field.dependsOn] : false;

        // ✅ Handle SELECT field
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
                SelectProps={{
                  MenuProps: {
                    disablePortal: false,
                    PaperProps: {
                      sx: { zIndex: 3000 },
                    },
                  },
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

        // ✅ Handle CHECKBOX field
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

        // ✅ Handle all other text fields (including multiline)
        return (
          <Grid item xs={field.xs || 12} key={field.name}>
            <TextField
              label={field.label}
              name={field.name}
              type={field.type || "text"}
              placeholder={field.placeholder || ""}
              fullWidth
              size="small"
              value={formData[field.name] || ""}
              onChange={handleChange}
              error={!!errors[field.name]}
              helperText={errors[field.name] || ""}
              disabled={disabled}
              multiline={field.multiline || false} // ✅ now supports textarea
              minRows={field.minRows || undefined} // ✅ respects minRows
              sx={field.sx || {}}
              InputLabelProps={isDateField ? { shrink: true } : {}}
            />
          </Grid>
        );
      })}

      {switches.map((sw) => (
        <Grid item xs={sw.xs || 6} key={sw.name}>
          <FormControlLabel
            control={
              <Switch
                color="primary"
                name={sw.name}
                checked={formData[sw.name] || false}
                onChange={handleSwitchChange || handleChange}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {sw.label}
              </Typography>
            }
          />
        </Grid>
      ))}
    </Grid>
  );
}
