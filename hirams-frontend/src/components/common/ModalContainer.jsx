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
    >
      <Fade in={open} timeout={250}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 440, md: 650 },
            bgcolor: "rgba(255, 255, 255, 0.92)",
            borderRadius: 2,
            boxShadow: 26,
            overflow: "hidden",
            outline: "none",
            borderTop: "4px solid #034FA5",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
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

          <Box sx={{ position: "relative", zIndex: 2 }}>
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
                  ` / ${
                    subTitle.length > 15
                      ? subTitle.slice(0, 15) + "…"
                      : subTitle
                  }`}
              </Typography>

              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ color: "gray", "&:hover": { color: "black" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box id="modal-description" sx={{ p: { xs: 2, sm: 3 } }}>
              {children}
            </Box>

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
        </Box>
      </Fade>
    </Modal>
  );
}

export default ModalContainer;
