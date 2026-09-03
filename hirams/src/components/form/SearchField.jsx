import React, { useMemo } from "react";
import { TextField, InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  // Slate — borders
  slateBorder: c.slate.border,
  slateBorderStrong: c.slate.borderStrong || c.slate.border,

  // Gray — text, inputs
  textSecondary: c.gray.textSecondary,
  textPrimary: c.gray.textPrimary,
  inputBg: c.gray.inputBg,
  inputFocusBg: c.gray.inputFocusBg,

  // Blue — focus border / primary accent
  blueBorder: c.blue.border,
  blueBorderStrong: c.blue.borderStrong,
});

const CustomSearchField = ({
  label = "Search",
  value,
  onChange,
  placeholder,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        "& .MuiOutlinedInput-root": {
          height: 32,
          fontSize: "0.8rem",
          borderRadius: "9999px",
          backgroundColor: colors.inputBg,
          "& fieldset": {
            borderRadius: "9999px",
            borderColor: colors.slateBorder,
          },
          "&:hover fieldset": {
            borderColor: colors.textSecondary,
          },
          "&.Mui-focused fieldset": {
            borderColor: colors.blueBorderStrong,
            borderWidth: 2,
          },
          "& input": {
            padding: "4px 12px",
            color: colors.textPrimary,
          },
          "&.Mui-focused": {
            backgroundColor: colors.inputFocusBg,
          },
        },
        "& .MuiInputLabel-root": {
          fontSize: "0.75rem",
          color: colors.textSecondary,
          transform: "translate(12px, 6px) scale(1)",
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(12px, -6px) scale(0.7)",
          backgroundColor: theme.palette.background.paper,
          padding: "0 3px",
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default CustomSearchField;
