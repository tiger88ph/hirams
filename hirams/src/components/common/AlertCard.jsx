// src/components/common/DialogCard.jsx
import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Fade,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import {
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ErrorOutline,
  Close,
} from "@mui/icons-material";

// --- Core Navy Palette ---
const navy = {
  main: "#034FA5",
  dark: "#002B5B",
  light: "#0566C7",
};

// --- Variant Colors with Navy Influence ---
const variantMap = {
  info: {
    icon: <InfoOutlined sx={{ fontSize: 38, color: navy.light }} />,
    color: navy.light,
  },
  success: {
    icon: <CheckCircleOutline sx={{ fontSize: 38, color: "#1B9C85" }} />,
    color: "#1B9C85",
  },
  warning: {
    icon: <WarningAmberOutlined sx={{ fontSize: 38, color: "#E8AA42" }} />,
    color: "#E8AA42",
  },
  error: {
    icon: <ErrorOutline sx={{ fontSize: 38, color: "#D32F2F" }} />,
    color: "#D32F2F",
  },
  neutral: {
    icon: <InfoOutlined sx={{ fontSize: 38, color: navy.main }} />,
    color: navy.main,
  },
};

/**
 * Universal Dialog Card with Navy Blue Theme
 */
const AlertDialogCard = ({
  open,
  onClose,
  title = "Notification",
  message = "",
  type = "neutral",
  confirmText = "OK",
  cancelText,
  onConfirm,
  customIcon,
  headerTitle = "System Message",
}) => {
  const variant = variantMap[type] || variantMap.neutral;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            width: 420,
            bgcolor: "background.paper",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            outline: "none",
            transition: "all 0.3s ease",
            border: `1px solid ${navy.main}22`,
          }}
        >
          {/* ===== Header ===== */}
          <Box
            sx={{
              background: `linear-gradient(90deg, ${navy.main} 0%, ${navy.light} 100%)`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 1.2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, letterSpacing: 0.3 }}
            >
              {headerTitle}
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* ===== Content ===== */}
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Stack alignItems="center" spacing={1.5}>
              {customIcon || variant.icon}
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: navy.dark }}
              >
                {title}
              </Typography>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                mb: 3,
                lineHeight: 1.6,
              }}
            >
              {message}
            </Typography>

            {/* ===== Actions ===== */}
            <Stack
              direction={cancelText ? "row" : "column"}
              spacing={1.5}
              justifyContent="center"
            >
              {cancelText && (
                <Button
                  variant="outlined"
                  onClick={onClose}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    py: 1.1,
                    borderColor: navy.main,
                    color: navy.main,
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: navy.light,
                      color: navy.light,
                    },
                  }}
                >
                  {cancelText}
                </Button>
              )}

              <Button
                variant="contained"
                onClick={handleConfirm}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                  py: 1.1,
                  bgcolor: navy.main,
                  "&:hover": { bgcolor: navy.light },
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {confirmText}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AlertDialogCard;
