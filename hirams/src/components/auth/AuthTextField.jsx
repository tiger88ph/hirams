import React from "react";
import { TextField, InputAdornment, IconButton, useTheme } from "@mui/material";
import getThemeColors from "../../utils/style/getThemeColors";


// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  inputBg: c.gray.inputBg,
  inputFocusBg: c.gray.inputFocusBg,
});


const AuthTextField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  startIcon,
  endIcon,
  onEndIconClick,
  ...props
}) => {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);


  return (
    <TextField
      label={label}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      fullWidth
      size="small"
      sx={{
        mb: 2,
        "& .MuiOutlinedInput-root": {
          backgroundColor: colors.inputBg,
          "&.Mui-focused": {
            backgroundColor: colors.inputFocusBg,
          },
        },
      }}
      InputProps={{
        startAdornment: startIcon ? (
          <InputAdornment position="start">{startIcon}</InputAdornment>
        ) : null,
        endAdornment: endIcon ? (
          <InputAdornment position="end">
            <IconButton onClick={onEndIconClick} edge="end">
              {endIcon}
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...props}
    />
  );
};


export default AuthTextField;