import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FormGrid from "../form/FormGrid";
import getThemeColors from "../../utils/style/getThemeColors";

// ── Component-local color map — ONLY tokens this file uses ──
const useColors = (c) => ({
  // Neutral / structural
  border: c.slate.border,
  textSecondary: c.gray.textSecondary,
  paperBg: c.slate.outerBg,
  // Danger / red accent
  redBg: c.red.bg,
  redBorder: c.red.border,
  redText: c.red.text,
  // Divider gradient
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

export function TransacVerificationModalContent({
  entityName,
  verificationInput,
  setVerificationInput,
  verificationError,
  onBack,
  onConfirm,
  actionWord = "Delete",
  instructionLabel = `Enter the first character of "${entityName}" to confirm the ${actionWord.toLowerCase()}.`,
  confirmButtonColor = "error",
  confirmButtonText,
  helperText = ``,
}) {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const dividerGradient = isDark
    ? colors.dividerGradient.dark
    : colors.dividerGradient.light;
  const cardShadow = isDark ? colors.cardShadow.dark : colors.cardShadow.light;
  const iconOpacity = isDark ? 0.18 : 0.12;

  const capitalizedAction =
    actionWord.charAt(0).toUpperCase() + actionWord.slice(1).toLowerCase();

  // FormGrid configuration
  const fields = [
    {
      name: "verification",
      label: instructionLabel,
      xs: 12,
      multiline: false,
      maxLength: 1,
    },
  ];

  const formData = { verification: verificationInput };
  const errors = { verification: verificationError };
  const handleChange = (e) => setVerificationInput(e.target.value);

  // Handle when Enter is pressed on the last (and only) field
  const handleLastFieldTab = () => {
    onConfirm?.();
  };

  // Icon configuration — uses shared red tokens for gradient and icon color
  const IconComponent = DeleteForeverIcon;
  const gradient = `linear-gradient(135deg, ${colors.redBg} 0%, ${colors.redBorder} 100%)`;
  const iconColor = colors.redText;

  return (
    <Box>
      {/* Professional Card Container */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: colors.border,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: cardShadow,
        }}
      >
        {/* Header with Gradient Background and Faded Icon */}
        <Box
          sx={{
            position: "relative",
            background: gradient,
            overflow: "hidden",
            px: 2.5,
            py: 2.5,
          }}
        >
          {/* Large Faded Icon in Background */}
          <Box
            sx={{
              position: "absolute",
              right: -20,
              top: "50%",
              transform: "translateY(-50%)",
              color: iconColor,
              opacity: iconOpacity,
              pointerEvents: "none",
            }}
          >
            <IconComponent sx={{ fontSize: { xs: 90, sm: 110, md: 125 } }} />
          </Box>

          {/* Content */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Entity Name */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.813rem" },
                color: colors.textSecondary,
                lineHeight: 1,
              }}
            >
              {entityName}
            </Typography>
          </Box>
        </Box>

        {/* Divider with subtle shadow */}
        <Box
          sx={{
            height: "1px",
            background: dividerGradient,
          }}
        />

        {/* FormGrid Input */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            backgroundColor: colors.paperBg,
          }}
        >
          <FormGrid
            fields={fields.map((f) => ({
              ...f,
              helperText: helperText || f.helperText,
            }))}
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            onLastFieldTab={handleLastFieldTab}
            autoFocus
          />
        </Box>
      </Box>
    </Box>
  );
}

export default TransacVerificationModalContent;
