import React from "react";
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

function ModalContainer({
  open,
  handleClose,
  title,
  subTitle = "",
  children,
  onSave,
  saveLabel = "Save",
  loading = false,
  showFooter = true,
  showSave = true,
  footerLogo = "/hirams-icon-rectangle.png", // default logo
  width, // optional width override
}) {
  // Default width sizes
  const defaultWidth = { xs: "90%", sm: 440, md: 650 };

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
          className="shine-border"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: width || defaultWidth,
            maxWidth: "95%",
            maxHeight: "90vh",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 2,
            boxShadow: 26,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
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
            <Typography variant="subtitle1">
              {title}
              {subTitle &&
                ` / ${subTitle.length > 15 ? subTitle.slice(0, 15) + "…" : subTitle}`}
            </Typography>

            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "gray", "&:hover": { color: "black" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box
            id="modal-description"
            sx={{
              p: { xs: 2, sm: 3 },
              overflowY: "auto",
              flex: 1, // content takes remaining space and scrolls if needed
            }}
          >
            {children}
          </Box>

          {/* Footer */}
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
                    sx={{ height: 32, width: "auto", objectFit: "contain" }}
                  />
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={handleClose}
                    sx={{
                      textTransform: "none",
                      color: "#555",
                      "&:hover": { bgcolor: "#f0f0f0" },
                    }}
                  >
                    Cancel
                  </Button>

                  {showSave && (
                    <Button
                      variant="contained"
                      onClick={onSave}
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        bgcolor: "#034FA5",
                        "&:hover": { bgcolor: "#336FBF" },
                      }}
                    >
                      {loading ? "Saving..." : saveLabel}
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
