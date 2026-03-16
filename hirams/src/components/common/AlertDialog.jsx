// src/components/common/AlertDialog.jsx
import React from "react";
import { Modal, Box, Typography, Fade, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import {
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ErrorOutline,
} from "@mui/icons-material";
import BaseButton from "./BaseButton";

const variantMap = {
  info: {
    Icon: InfoOutlined,
    accent: "#0566C7",
    iconBg: "rgba(5,102,199,0.08)",
    iconColor: "#0566C7",
    stripeBg: "linear-gradient(135deg, #0566C7 0%, #034FA5 100%)",
  },
  success: {
    Icon: CheckCircleOutline,
    accent: "#0D9373",
    iconBg: "rgba(13,147,115,0.08)",
    iconColor: "#0D9373",
    stripeBg: "linear-gradient(135deg, #0D9373 0%, #0a7560 100%)",
  },
  warning: {
    Icon: WarningAmberOutlined,
    accent: "#C8861A",
    iconBg: "rgba(200,134,26,0.08)",
    iconColor: "#C8861A",
    stripeBg: "linear-gradient(135deg, #C8861A 0%, #a06814 100%)",
  },
  error: {
    Icon: ErrorOutline,
    accent: "#C0272D",
    iconBg: "rgba(192,39,45,0.08)",
    iconColor: "#C0272D",
    stripeBg: "linear-gradient(135deg, #C0272D 0%, #991b1b 100%)",
  },
  neutral: {
    Icon: InfoOutlined,
    accent: "#034FA5",
    iconBg: "rgba(3,79,165,0.08)",
    iconColor: "#034FA5",
    stripeBg: "linear-gradient(135deg, #034FA5 0%, #002B5B 100%)",
  },
};

const AlertDialog = ({
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
  const v = variantMap[type] || variantMap.neutral;
  const { Icon } = v;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  // Map alert type to BaseButton actionColor
  const confirmActionColor =
    type === "error"
      ? "delete"
      : type === "warning"
        ? "revert"
        : type === "success"
          ? "approve"
          : "default";

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
        backgroundColor: "rgba(0,10,30,0.4)",
      }}
    >
      <Fade in={open} timeout={200}>
        <Box
          sx={{
            position: "relative",
            width: { xs: "90vw", sm: 400 },
            bgcolor: "#fff",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: `
              0 0 0 1px rgba(0,0,0,0.06),
              0 8px 16px rgba(0,0,0,0.08),
              0 24px 56px rgba(0,10,30,0.18)
            `,
            outline: "none",
          }}
        >
          {/* ── Colored left stripe ── */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "4px",
              background: v.stripeBg,
            }}
          />

          {/* ── Header ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              pt: 2,
              pb: 0,
              pl: 3.5,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#94A3B8",
              }}
            >
              {headerTitle}
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: "#CBD5E1",
                width: 24,
                height: 24,
                borderRadius: "6px",
                "&:hover": { backgroundColor: "#F1F5F9", color: "#64748B" },
                transition: "all 0.15s",
              }}
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          {/* ── Body ── */}
          <Box sx={{ px: 3, pt: 2, pb: 2.5, pl: 3.5 }}>
            {/* Icon + Title row */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  backgroundColor: v.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: 0.25,
                }}
              >
                {customIcon ?? <Icon sx={{ fontSize: 20, color: v.iconColor }} />}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    lineHeight: 1.3,
                    mb: 0.5,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "#64748B",
                    lineHeight: 1.6,
                  }}
                >
                  {message}
                </Typography>
              </Box>
            </Box>

            {/* Divider */}
            <Box
              sx={{
                height: "1px",
                backgroundColor: "#F1F5F9",
                mx: -3,
                ml: -3.5,
                mb: 2,
              }}
            />

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              {cancelText && (
                <BaseButton
                  label={cancelText}
                  onClick={onClose}
                  variant="outlined"
                  actionColor="back"
                  sx={{
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                  }}
                />
              )}
              <BaseButton
                label={confirmText}
                onClick={handleConfirm}
                variant="contained"
                actionColor={confirmActionColor}
              />
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AlertDialog;