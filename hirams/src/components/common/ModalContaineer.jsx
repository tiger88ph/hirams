import React, { useEffect, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
  Fade,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  const scrollRef = useRef(null);

  // Reset scroll to top the moment loading kicks in
  useEffect(() => {
    if (loading && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [loading]);

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
            maxHeight: "75vh",
            bgcolor: "rgba(255,255,255,0.95)",
            borderRadius: 2,
            boxShadow: 26,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderBottom: "4px solid #B0E0E6",
            borderTop: "4px solid #115293",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1,
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f9fafb",
              pointerEvents: "auto",
              zIndex: 1,
              flexShrink: 0,
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

            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "gray", "&:hover": { color: "black" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* BODY — positioning context; skeleton anchors here, NOT inside scroll */}
          <Box
            sx={{
              flex: 1,
              position: "relative",
              minHeight: "100px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* SCROLLABLE CONTENT */}
            <Box
              ref={scrollRef}
              id="modal-description"
              sx={{
                p: { xs: 2, sm: 3 },
                overflowY: "auto",
                flex: 1,
                pointerEvents: loading ? "none" : "auto",
                opacity: loading ? 0 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {children}
            </Box>

            {/* SKELETON OVERLAY
                - position: absolute + inset: 0 anchors to the BODY box above
                - completely independent of scroll position
                - always covers the full visible content area               */}
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                  bgcolor: "rgba(255,255,255,0.97)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                {/* Skeleton rows — static, never scroll */}
                <Box
                  sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    overflow: "hidden",
                    flex: 1,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Skeleton variant="rounded" width="100%" height={60} sx={{ borderRadius: "6px" }} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="50%" height={30} sx={{ borderRadius: "6px" }} />
                    <Skeleton variant="rounded" width="50%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="40%" height={30} sx={{ borderRadius: "6px" }} />
                    <Skeleton variant="rounded" width="60%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                   <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="32%" height={30} sx={{ borderRadius: "6px", flexShrink: 0 }} />
                    <Skeleton variant="rounded" width="68%" height={30} sx={{ borderRadius: "6px" }} />
                  </Box>
                </Box>

                {/* Message pill — centered over skeleton, anchored to BODY box */}
                {customMessage && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 2,
                        py: 0.85,
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(17,82,147,0.18)",
                        boxShadow: "0 2px 16px rgba(17,82,147,0.12)",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            backgroundColor: "#115293",
                            animation: "dotBounce 1.2s ease-in-out infinite",
                            animationDelay: `${i * 0.2}s`,
                            "@keyframes dotBounce": {
                              "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
                              "40%": { transform: "scale(1)", opacity: 1 },
                            },
                          }}
                        />
                      ))}
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 500,
                          color: "#115293",
                          letterSpacing: "0.01em",
                          whiteSpace: "nowrap",
                          ml: 0.25,
                        }}
                      >
                        {customMessage}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
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
                  flexShrink: 0,
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