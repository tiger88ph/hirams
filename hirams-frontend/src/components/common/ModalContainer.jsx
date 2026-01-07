import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DotSpinner from "./DotSpinner";

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
  footerLogo = "/hirams-icon-rectangle.png",
  width,
  customLoading = null,
  showCancel = true,      // ✅ new prop
  cancelLabel = "Cancel", // ✅ new prop
  onCancel,               // ✅ new prop
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f9fafb",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
              }}
            >
              {title}
              {subTitle &&
                ` / ${
                  subTitle.length > 15 ? subTitle.slice(0, 24) + "…" : subTitle
                }`}
            </Typography>

            <IconButton
              size="small"
              onClick={handleCancelClick}
              sx={{ color: "gray", "&:hover": { color: "black" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* CONTENT AREA */}
          <Box
            id="modal-description"
            sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", flex: 1, position: "relative" }}
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
                  <Box component="img" src={footerLogo} alt="Logo" sx={{ height: 32 }} />
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  {showCancel && (
                    <Button
                      onClick={handleCancelClick}
                      sx={{
                        textTransform: "none",
                        color: "#555",
                        "&:hover": { bgcolor: "#f0f0f0" },
                      }}
                      disabled={isLoading}
                    >
                      {cancelLabel}
                    </Button>
                  )}

                  {showSave && (
                    <Button
                      variant="contained"
                      onClick={onSave}
                      sx={{
                        textTransform: "none",
                        bgcolor: "#034FA5",
                        "&:hover": { bgcolor: "#336FBF" },
                      }}
                      disabled={isLoading}
                    >
                      {saveLabel}
                    </Button>
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


