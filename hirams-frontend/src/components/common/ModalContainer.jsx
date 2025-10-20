import React from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function ModalContainer({
  open,
  handleClose,
  title,
  children,
  onSave,
  saveLabel = "Save",
  loading = false,
  showFooter = true,
}) {
  return (
    <Modal open={open} onClose={handleClose} sx={{ zIndex: 2000 }}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 420, md: 480 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          overflow: "hidden",
        }}
      >
        {/* 🧭 Header */}
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
          </Typography>

          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: "gray", "&:hover": { color: "black" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 📦 Body (children passed from specific modal) */}
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>{children}</Box>

        {showFooter && (
          <>
            <Divider />
            {/* 🦶 Footer */}
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
              {/* Left side — logo */}
              <img
                src="/hirams-logo.png"
                alt="HIRAMS Logo"
                style={{ height: "22px", width: "auto", objectFit: "contain" }}
              />

              {/* Right side — action buttons */}
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
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  {loading ? "Saving..." : saveLabel}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
}

export default ModalContainer;
