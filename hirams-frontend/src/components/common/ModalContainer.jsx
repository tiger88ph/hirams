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
  subTitle = "", // new prop
  children,
  onSave,
  saveLabel = "Save",
  loading = false,
  showFooter = true,
}) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropProps={{
        sx: {
          backdropFilter: open ? "blur(3px)" : "none",
          WebkitBackdropFilter: open ? "blur(3px)" : "none",
          backgroundColor: "rgba(0,0,0,0.3)",
          transition: "backdrop-filter 0.3s ease",
        },
      }}
      sx={{ zIndex: 2000 }}
    >
      <Fade in={open} timeout={300}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 420, md: 480 },
            bgcolor: "rgba(255, 255, 255, 0.6)",
            borderRadius: 2,
            boxShadow: 24,
            overflow: "hidden",
            borderTop: "4px solid #034FA5",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            position: "relative",
            transition: "all 0.3s ease",
          }}
        >
          {/* Background logo overlay */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 250,
              height: 250,
              backgroundImage: "url('/hirams-icon-square.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
              opacity: 0.1,
              pointerEvents: "none",
            }}
          />

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
              <Typography variant="subtitle1" sx={{ fontWeight: 100 }}>
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
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>{children}</Box>

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
                  <img
                    src="/hirams-icon-rectangle.png"
                    alt="HIRAMS Logo"
                    style={{
                      height: "32px",
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />

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
                  </Box>
                </Box>
              </>
            )}
          </Box>

          {/* Bottom gray accent border */}
          <Box sx={{ height: 4, width: "100%", bgcolor: "#5a585b" }} />
        </Box>
      </Fade>
    </Modal>
  );
}

export default ModalContainer;
