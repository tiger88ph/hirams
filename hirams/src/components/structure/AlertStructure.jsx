import React, { useMemo } from "react";
import { Modal, Box, Typography, Fade, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Close } from "@mui/icons-material";
import BaseButton from "../form/BaseButton";
import getThemeColors from "../../utils/style/getThemeColors";
import icons from "../../utils/style/iconFormatStyles";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  // Gray — text hierarchy
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,

  // Slate — borders, panels, hover
  slateBorder: c.slate.border,
  slateHover: c.slate.hover,
  slateMutedBg: c.slate.mutedBg,
  slateOuterBg: c.slate.outerBg,

  // Blue — backdrop, shadows
  blueBg: c.blue.bg,
  blueText: c.blue.text,
  blueTextDark: c.blue.textDark,

  // Green — success
  greenPaid: c.green.paid,
  greenBg: c.green.bg,
  greenTextDark: c.green.textDark,

  // Amber — warning
  amberText: c.amber.text,
  amberBg: c.amber.bg,
  amberTextDark: c.amber.textDark,

  // Red — error/danger
  redDanger: c.red.danger,
  redBg: c.red.bg,
  redTextDark: c.red.textDark,
});

// ── Variant map: builds all type styles from theme colors ──────────────
const buildVariantMap = (c, colors) => ({
  info: {
    iconEl: icons.view,
    accent: colors.blueText,
    iconBg: colors.blueBg,
    iconColor: colors.blueText,
    stripeBg: `linear-gradient(135deg, ${colors.blueText} 0%, ${colors.blueTextDark} 100%)`,
  },
  success: {
    iconEl: icons.approve,
    accent: colors.greenPaid,
    iconBg: colors.greenBg,
    iconColor: colors.greenPaid,
    stripeBg: `linear-gradient(135deg, ${colors.greenPaid} 0%, ${colors.greenTextDark} 100%)`,
  },
  warning: {
    iconEl: icons.reset,
    accent: colors.amberText,
    iconBg: colors.amberBg,
    iconColor: colors.amberText,
    stripeBg: `linear-gradient(135deg, ${colors.amberText} 0%, ${colors.amberTextDark} 100%)`,
  },
  error: {
    iconEl: icons.delete,
    accent: colors.redDanger,
    iconBg: colors.redBg,
    iconColor: colors.redDanger,
    stripeBg: `linear-gradient(135deg, ${colors.redDanger} 0%, ${colors.redTextDark} 100%)`,
  },
  neutral: {
    iconEl: icons.view,
    accent: colors.textSecondary,
    iconBg: colors.slateMutedBg,
    iconColor: colors.textSecondary,
    stripeBg: `linear-gradient(135deg, ${colors.textSecondary} 0%, ${colors.textPrimary} 100%)`,
  },
});

const AlertStructure = ({
  open,
  onClose,
  title = "Notification",
  message = "",
  type = "neutral",
  confirmText = "OK",
  cancelText,
  cancelLabel,
  onConfirm,
  onCancel,
  customIcon,
  headerTitle = "System Message",
  maxWidth = 420,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Theme resolution — memoized
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  const variantMap = useMemo(
    () => buildVariantMap(base, colors),
    [base, colors],
  );

  const v = variantMap[type] || variantMap.neutral;
  const iconToShow = customIcon ?? v.iconEl;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  const confirmActionColor =
    type === "error"
      ? "delete"
      : type === "warning"
        ? "revert"
        : type === "success"
          ? "approve"
          : "default";

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
 
        backgroundColor: isDark ? "rgba(0,0,0,0.6)" : colors.blueBg,
      }}
    >
      <Fade in={open} timeout={200}>
        <Box
          sx={{
            position: "relative",
            width: { xs: "90vw", sm: maxWidth },
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.background.paper,
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: isDark
              ? `0 0 0 1px ${colors.slateBorder}, 0 8px 16px rgba(0,0,0,0.35), 0 24px 56px rgba(0,0,0,0.5)`
              : `0 0 0 1px ${colors.slateBorder}, 0 8px 16px ${colors.slateOuterBg}, 0 24px 56px ${colors.blueBg}`,
            outline: "none",
          }}
        >
          {/* Left colored stripe */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "4px",
              background: v.stripeBg,
            }}
          />

          {/* Header — fixed */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pl: 3.5,
              pr: 3,
              pt: 2,
              pb: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: colors.textDisabled,
              }}
            >
              {headerTitle}
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: colors.textDisabled,
                width: 24,
                height: 24,
                borderRadius: "6px",
                "&:hover": {
                  bgcolor: colors.slateHover,
                  color: colors.textSecondary,
                },
                transition: "all 0.15s",
              }}
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",
              pl: 3.5,
              pr: 3,
              pt: 2,
              pb: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: v.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: 0.25,
                  color: v.iconColor,
                }}
              >
                {iconToShow}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: colors.textPrimary,
                    lineHeight: 1.3,
                    mb: 0.5,
                  }}
                >
                  {title}
                </Typography>
                {typeof message === "string" ? (
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      color: colors.textSecondary,
                      lineHeight: 1.6,
                    }}
                  >
                    {message}
                  </Typography>
                ) : (
                  message
                )}
              </Box>
            </Box>
          </Box>

          {/* Footer — fixed */}
          <Box sx={{ flexShrink: 0, pl: 3.5, pr: 3, pb: 2.5 }}>
            <Box
              sx={{
                height: 1,
                bgcolor: colors.slateBorder,
                ml: -3.5,
                mr: -3,
                mb: 2,
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {cancelText && (
                <BaseButton
                  label={cancelText}
                  onClick={onClose}
                  variant="outlined"
                  actionColor="back"
                />
              )}
              {onCancel && (
                <BaseButton
                  label={cancelLabel ?? "No"}
                  onClick={onCancel}
                  variant="outlined"
                  actionColor="back"
                />
              )}
              <BaseButton
                label={confirmText}
                onClick={handleConfirm}
                variant="contained"
                actionColor={confirmActionColor}
              />
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AlertStructure;
