import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
  Fade,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import DotSpinner from "../../components/loader/DotSpinner";
import BaseButton from "../../components/form/BaseButton";
import getThemeColors from "../../utils/style/getThemeColors";

// ── PROMPT 1 — useColors(c): SOLID colors ONLY ───────────────────────
const useColors = (c, isDark) => ({
  border: c.slate.border,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  blueTextDark: c.blue.textStrong,

  // ✅ 100% SOLID — NO opacity in ANY mode!
  modalBg: isDark ? "#0F172A" : "#FFFFFF",
  headerFooterBg: isDark ? "#1E293B" : "#F8FAFC",
  overlayBg: isDark ? "#1E293B" : "rgba(30,41,59,0.05)",
});

function ModalContainer({
  open,
  handleClose,
  title,
  subTitle = "",
  children,
  onSave,
  saveLabel = "Save",
  showFooter = true,
  showSave = true,
  footerLogo = `${import.meta.env.BASE_URL}images/hirams-icon-rectangle.png`,
  width,
  loading = false,
  showCancel = true,
  cancelLabel = "Cancel",
  onCancel,
  disableBackdropClick = true,
  disabled = false,
  customMessage = null,
  contentPadding = { xs: 1, sm: 2 },
  extraActions = null,
  contentOnly = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ✅ Wired EXACTLY as PROMPT 1 specifies
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base, isDark), [base, isDark]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key !== "Enter") return;
      if (loading || disabled || !showSave || !onSave) return;

      const active = document.activeElement;
      if (active?.closest(".ql-editor")) return;
      if (active?.tagName === "BUTTON") return;

      e.preventDefault();
      e.stopPropagation();
      onSave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, disabled, showSave, onSave]);

  const defaultWidth = { xs: "90%", sm: 440, md: 650 };
  const handleCancelClick = () => (onCancel ? onCancel() : handleClose());
  const handleBackdropClick = (event, reason) => {
    if (disableBackdropClick && reason === "backdropClick") return;
    handleClose(event, reason);
  };

  const showHeader = !contentOnly;
  const showFooterFinal = !contentOnly && showFooter;

  return (
    <Modal
      open={open}
      onClose={handleBackdropClick}
      closeAfterTransition
      disableEnforceFocus
      disableAutoFocus
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Fade in={open} timeout={150}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: width || defaultWidth,
            maxWidth: "95%",
            maxHeight: "90vh",
            bgcolor: contentOnly ? "transparent" : colors.modalBg, // ✅ SOLID
            borderRadius: contentOnly ? 0 : 2,
            boxShadow: contentOnly ? "none" : 26,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          {showHeader && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                py: 1.5,
                borderBottom: `1px solid ${colors.border}`,
                bgcolor: colors.headerFooterBg, // ✅ SOLID
                pointerEvents: "auto",
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                {/* ✅ VERTICAL NAVY BAR — BACK FOREVER */}
                <Box
                  sx={{
                    width: 4,
                    height: 24,
                    borderRadius: "9999px",
                    bgcolor: colors.blueTextDark,
                    flexShrink: 0,
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: ".7rem", sm: ".75rem", md: ".85rem" },
                      fontWeight: 600,
                      lineHeight: 1,
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {title}
                  </Typography>
                  {subTitle && (
                    <Typography
                      sx={{
                        fontSize: { xs: "0.68em", sm: "0.7em" },
                        fontStyle: "italic",
                        fontWeight: 400,
                        lineHeight: 1.2,
                        color: colors.textSecondary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "200px",
                      }}
                    >
                      {subTitle}
                    </Typography>
                  )}
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={handleClose}
                sx={{
                  color: colors.textSecondary,
                  "&:hover": { color: colors.textPrimary },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* CONTENT AREA */}
          <Box
            id="modal-description"
            sx={{
              p: contentOnly ? 0 : contentPadding,
              overflowY: "auto",
              flex: 1,
              position: "relative",
              minHeight: "100px",
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            <Box
              sx={{ opacity: loading ? 0 : 1, transition: "opacity 0.2s ease" }}
            >
              {children}
            </Box>

            <Fade in={loading} timeout={200} unmountOnExit>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1200,
                  pointerEvents: "none",
                  bgcolor: colors.overlayBg,
                }}
              >
                <DotSpinner message={true} loadingMessage={customMessage} />
              </Box>
            </Fade>
          </Box>

          {/* FOOTER */}
          {showFooterFinal && (
            <>
              <Divider sx={{ borderColor: colors.border }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  bgcolor: colors.headerFooterBg, // ✅ SOLID
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                {footerLogo && (
                  <Box
                    component="img"
                    src={footerLogo}
                    alt="Logo"
                    sx={{ height: 32 }}
                  />
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  {showCancel && (
                    <BaseButton
                      label={cancelLabel}
                      onClick={handleCancelClick}
                      variant="outlined"
                      actionColor="cancel"
                      disabled={loading}
                    />
                  )}
                  {showSave && (
                    <BaseButton
                      label={saveLabel}
                      onClick={onSave}
                      disabled={loading || disabled}
                      actionColor="approve"
                    />
                  )}
                  {extraActions}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}

export default ModalContainer;
