// components/common/AuthTextField.jsx
import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";

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
  return (
    <TextField
      label={label}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      fullWidth
      size="small"
      sx={{ mb: 2 }}
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
