import React, { useMemo } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import VerifiedIcon from "@mui/icons-material/Verified";
import FormGrid from "../form/FormGrid";
import getThemeColors from "../../utils/style/getThemeColors";


// ── Component-local color map — ONLY tokens this file uses ──
const useColors = (c) => ({
  // Neutral / structural
  border: c.slate.border,
  textSecondary: c.gray.textSecondary,
  paperBg: c.slate.outerBg,
  // Accent colors
  amberBg: c.amber.bg,
  amberBorder: c.amber.border,
  amberText: c.amber.text,
  greenBg: c.green.bg,
  greenBorder: c.green.border,
  greenText: c.green.text,
  tealBg: c.teal.bg,
  tealBorder: c.teal.border,
  tealText: c.teal.text,
  blueBg: c.blue.bg,
  blueBorder: c.blue.border,
  blueText: c.blue.text,
  purpleBg: c.purple.bg,
  purpleBorder: c.purple.border,
  purpleText: c.purple.text,
  // Divider gradients
  dividerGradient: {
    dark: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
    light: "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
  },
  // Card shadow
  cardShadow: {
    dark: "0 2px 8px rgba(0,0,0,0.4)",
    light: "0 2px 8px rgba(0,0,0,0.08)",
  },
});


export default function TransacRemarksModalContent({
  remarks,
  setRemarks,
  remarksError,
  onBack,
  onSave,
  actionWord = "updating",
  entityName = "this item",
  selectedAOName = null,
  saveButtonColor = "primary",
  saveButtonText = "Save Remarks",
  // ── optional status picker ───────────────────────────────────────────────
  selectLabel = "",
  selectValue = "",
  onSelectChange = null,
  selectOptions = [],
  selectHelperText = "",
}) {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const dividerGradient = isDark ? colors.dividerGradient.dark : colors.dividerGradient.light;
  const cardShadow = isDark ? colors.cardShadow.dark : colors.cardShadow.light;
  const iconOpacity = isDark ? 0.18 : 0.12;


  const fields = [
    {
      name: "remarks",
      label: "Remarks",
      type: "text",
      xs: 12,
    },
  ];


  const formData = { remarks };
  const errors = { remarks: remarksError };


  const handleChange = ({ target: { name, value } }) => {
    if (name === "remarks") setRemarks(value);
  };


  // Each action's gradient/icon color now comes straight from the shared
  // color tokens — bg → border as gradient stops, text as icon color
  const getIconConfig = () => {
    const action = actionWord.toLowerCase();

    if (action.includes("revert")) {
      return {
        icon: RestoreIcon,
        gradient: `linear-gradient(135deg, ${colors.amberBg} 0%, ${colors.amberBorder} 100%)`,
        iconColor: colors.amberText,
        title: "Revert",
      };
    }
    if (action.includes("verif") || action.includes("approve")) {
      return {
        icon: VerifiedIcon,
        gradient: `linear-gradient(135deg, ${colors.greenBg} 0%, ${colors.greenBorder} 100%)`,
        iconColor: colors.greenText,
        title: "Verify",
      };
    }
    if (action.includes("final")) {
      return {
        icon: CheckCircleIcon,
        gradient: `linear-gradient(135deg, ${colors.tealBg} 0%, ${colors.tealBorder} 100%)`,
        iconColor: colors.tealText,
        title: "Finalize",
      };
    }
    if (
      action.includes("edit") ||
      action.includes("update") ||
      action.includes("modify")
    ) {
      return {
        icon: EditIcon,
        gradient: `linear-gradient(135deg, ${colors.blueBg} 0%, ${colors.blueBorder} 100%)`,
        iconColor: colors.blueText,
        title: "Update",
      };
    }
    if (action.includes("complete") || action.includes("finish")) {
      return {
        icon: CheckCircleIcon,
        gradient: `linear-gradient(135deg, ${colors.tealBg} 0%, ${colors.tealBorder} 100%)`,
        iconColor: colors.tealText,
        title: "Complete",
      };
    }
    return {
      icon: EditIcon,
      gradient: `linear-gradient(135deg, ${colors.purpleBg} 0%, ${colors.purpleBorder} 100%)`,
      iconColor: colors.purpleText,
      title: "Provide Remarks",
    };
  };


  const { icon: IconComponent, gradient, iconColor } = getIconConfig();
  const showSelect = onSelectChange !== null && selectOptions.length > 0;


  return (
    <Box>
      <Box
        sx={{
          border: "1px solid",
          borderColor: colors.border,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: cardShadow,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "relative",
            background: gradient,
            overflow: "hidden",
            px: 2.5,
            py: 2.5,
          }}
        >
          {/* Faded watermark icon */}
          <Box
            sx={{
              position: "absolute",
              right: -25,
              top: "60%",
              transform: "translateY(-50%)",
              color: iconColor,
              opacity: iconOpacity,
              pointerEvents: "none",
            }}
          >
            <IconComponent sx={{ fontSize: { xs: 100, sm: 120, md: 140 } }} />
          </Box>

          {/* Content */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.813rem" },
                color: colors.textSecondary,
                mb: selectedAOName ? 1.5 : 0,
                lineHeight: 1,
              }}
            >
              {entityName}
            </Typography>

            {selectedAOName && selectedAOName.trim() !== "" && (
              <Typography
                variant="body2"
                sx={{
                  color: colors.textSecondary,
                  fontSize: { xs: "0.75rem", sm: "0.813rem" },
                  fontWeight: 500,
                }}
              >
                Target: <strong>{selectedAOName}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Divider */}
        <Box
          sx={{
            height: "1px",
            background: dividerGradient,
          }}
        />

        {/* Form */}
        <Box sx={{ px: 2.5, py: 2, backgroundColor: colors.paperBg }}>
          {/* ── Optional status select ──────────────────────────────────── */}
          {showSelect && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="remarks-card-select-label">
                  {selectLabel}
                </InputLabel>
                <Select
                  labelId="remarks-card-select-label"
                  label={selectLabel}
                  value={selectValue}
                  onChange={(e) => onSelectChange(e.target.value)}
                >
                  {selectOptions.map(({ key, label }) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
                {selectHelperText && (
                  <FormHelperText>{selectHelperText}</FormHelperText>
                )}
              </FormControl>
            </Box>
          )}

          <FormGrid
            fields={fields}
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            onLastFieldTab={onSave}
            autoFocus={true}
          />
        </Box>
      </Box>
    </Box>
  );
}