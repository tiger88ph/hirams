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
  showFooter = true,  // Controls the entire footer
  showSave = true,    // Controls only the Save button
  backgroundLogo = "/hirams-icon-square.png",
  footerLogo = "/hirams-icon-rectangle.png",
}) {
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
      sx={{ zIndex: 2000, outline: "none" }}
    >
      <Fade in={open} timeout={250}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 440, md: 500 },
            bgcolor: "rgba(255, 255, 255, 0.85)",
            borderRadius: 2,
            boxShadow: 26,
            overflow: "hidden",
            outline: "none",
            borderTop: "4px solid #034FA5",
            position: "relative",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {/* Optional background logo */}
          {backgroundLogo && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 220,
                height: 220,
                backgroundImage: `url(${backgroundLogo})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain",
                opacity: 0.08,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Modal content */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
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

            {/* Body */}
            <Box id="modal-description" sx={{ p: { xs: 2, sm: 3 } }}>
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
                      alt="HIRAMS Logo"
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

          {/* Bottom accent */}
          <Box sx={{ height: 4, width: "100%", bgcolor: "grey.700" }} />
        </Box>
      </Fade>
    </Modal>
  );
}

export default ModalContainer;
