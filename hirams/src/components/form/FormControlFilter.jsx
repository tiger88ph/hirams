import React, { useMemo } from "react";
import { Box, Select, MenuItem, FormControl } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";
import icons from "../../utils/style/iconFormatStyles";
// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  // Text
  textPrimary: c.gray.textPrimary,

  // Slate — borders
  border: c.slate.border,
  borderHover: c.slate.btnBorder,

  // Blue — focus
  focusBorder: c.blue.border,

  // Menu items
  menuText: c.gray.textPrimary,
});


export default function FormControlFilter({
  value,
  onChange,
  options = [],
  allLabel = "All",
  allValue = "all",
  icon = icons.filter,
  minWidth = 0,
}) {
  // ✅ Standard wiring — PROMPT 1 pattern
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const selectedLabel =
    value === allValue
      ? allLabel
      : (options.find((o) => o.value === value)?.label ?? value);

  return (
    <FormControl size="small" sx={{ minWidth, flexShrink: 0 }}>
      <Select
        value={value}
        onChange={onChange}
        displayEmpty
        IconComponent={() => null}
        renderValue={() => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "center", sm: "flex-start" },
              gap: { xs: 0, sm: 0.75 },
            }}
          >
            {icon}
            <Box
              component="span"
              sx={{
                display: { xs: "none", sm: "inline" },
                fontSize: "0.8rem",
                color: colors.textPrimary,
                whiteSpace: "nowrap",
              }}
            >
              {selectedLabel}
            </Box>
          </Box>
        )}
        sx={{
          height: 36,
          borderRadius: "50px",
          fontSize: "0.8rem",
          bgcolor: theme.palette.background.paper,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.border,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.borderHover,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.focusBorder,
            borderWidth: "1px",
          },
          "& .MuiSelect-select": {
            py: "6px",
            pr: { xs: "8px !important", sm: "28px !important" },
            pl: { xs: "8px", sm: "10px" },
          },
          "& .MuiSelect-icon": { display: "none" },
        }}
      >
        <MenuItem value={allValue}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "0.82rem", color: colors.menuText }}>
              {allLabel}
            </span>
          </Box>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: "0.82rem", color: colors.menuText }}>
                {opt.label}
              </span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}