// components/common/FormGrid.jsx
import { Grid, TextField, FormControlLabel, Switch, Typography, MenuItem } from "@mui/material";

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
      {fields.map((field) => (
        <Grid item xs={field.xs || 12} key={field.name}>
          <TextField
            {...field}
            fullWidth
            size="small"
            value={formData[field.name] || ""}
            onChange={handleChange}
            error={!!errors[field.name]}
            helperText={errors[field.name] || ""}
          />
        </Grid>
      ))}

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
