import React, { useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
  Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DotSpinner from "./DotSpinner";
import BaseButton from "./BaseButton";

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
}) {
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

  return (
    <Modal
      open={open}
      onClose={handleBackdropClick}
      closeAfterTransition
      disableEnforceFocus
      disableAutoFocus
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      BackdropProps={{
        sx: {
          backdropFilter: open ? "blur(3px)" : "none",
          WebkitBackdropFilter: open ? "blur(3px)" : "none",
          backgroundColor: "rgba(0,0,0,0.25)",
        },
      }}
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
            bgcolor: "rgba(255,255,255,0.95)",
            borderRadius: 2,
            boxShadow: 26,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderBottom: "4px solid #B0E0E6",
            borderTop: "4px solid #115293",
            // ✅ removed pointerEvents — handled per section below
          }}
        >
          {/* HEADER — always interactive */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1,
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f9fafb",
              pointerEvents: "auto", // ✅ always clickable
              zIndex: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontSize: { xs: ".8rem", sm: ".85rem", md: ".95rem" },
                  lineHeight: 1.2,
                }}
                noWrap
              >
                {title}
              </Typography>
              {subTitle && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 400,
                    color: "text.secondary",
                    fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
                    lineHeight: 1.2,
                    maxWidth: "200px",
                  }}
                  noWrap
                >
                  {subTitle}
                </Typography>
              )}
            </Box>

            {/* ✅ X always works */}
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "gray", "&:hover": { color: "black" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* CONTENT AREA — blocked during loading */}
          <Box
            id="modal-description"
            sx={{
              p: { xs: 2, sm: 3 },
              overflowY: "auto",
              flex: 1,
              position: "relative",
              minHeight: "100px",
              pointerEvents: loading ? "none" : "auto", // ✅ only content blocked
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
                }}
              >
                <DotSpinner message={true} loadingMessage={customMessage} />
              </Box>
            </Fade>
          </Box>

          {/* FOOTER */}
          {showFooter && (
            <>
              <Divider />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  bgcolor: "#fafafa",
                  borderTop: "1px solid #e0e0e0",
                  // ✅ no pointerEvents block here
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
                      // ✅ cancel never disabled — always allows closing
                      variant="outlined"
                      actionColor="cancel"
                    />
                  )}
                  {showSave && (
                    <BaseButton
                      label={saveLabel}
                      onClick={onSave}
                      disabled={loading || disabled} // ✅ only Save is blocked
                      actionColor="approve"
                    />
                  )}
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