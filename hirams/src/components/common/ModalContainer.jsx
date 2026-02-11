import React, { useEffect, useState } from "react";
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
import BaseButton from "./BaseButton"; // ✅ import your BaseButton

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
  customLoading = null,
  showCancel = true,
  cancelLabel = "Cancel",
  onCancel,
  disableBackdropClick = true,
}) {
  const [internalLoading, setInternalLoading] = useState(true);
  const isLoading = customLoading ?? internalLoading;

  useEffect(() => {
    if (customLoading !== null) return;

    if (open) {
      const timer = setTimeout(() => setInternalLoading(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setInternalLoading(true);
    }
  }, [open, customLoading]);

  const defaultWidth = { xs: "90%", sm: 440, md: 650 };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleClose();
    }
  };

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
      <Fade in={open} timeout={250}>
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
            pointerEvents: isLoading ? "none" : "auto",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1, // reduced from 2 to 1
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f9fafb",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {" "}
              {/* changed alignItems to center */}
              {/* Title */}
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontSize: { xs: ".8rem", sm: ".85rem", md: ".95rem" }, // slightly smaller
                  lineHeight: 1.2, // reduces vertical space
                }}
                noWrap
              >
                {title}
              </Typography>
              {/* Subtitle */}
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

          {/* CONTENT AREA */}
          <Box
            id="modal-description"
            sx={{
              p: { xs: 2, sm: 3 },
              overflowY: "auto",
              flex: 1,
              position: "relative",
            }}
          >
            <Box sx={{ opacity: isLoading ? 0 : 1 }}>{children}</Box>
          </Box>

          {/* FIXED LOADING OVERLAY */}
          {isLoading && (
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
              <DotSpinner />
            </Box>
          )}

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
                      disabled={isLoading}
                      variant="outlined"
                      sx={{ color: "#555" }}
                    />
                  )}

                  {showSave && (
                    <BaseButton
                      label={saveLabel}
                      onClick={onSave}
                      disabled={isLoading}
                      sx={{
                        bgcolor: "#034FA5",
                        "&:hover": { bgcolor: "#336FBF" },
                      }}
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
