// ConfirmationDialog.jsx
import { Box, Typography } from "@mui/material";
import { ReceiptLongOutlined } from "@mui/icons-material";

/**
 * ConfirmationDialog
 *
 * A self-contained confirmation panel — drop it inline wherever you need
 * a "are you sure?" step (inside a modal, a drawer, a page section, etc.).
 *
 * Props
 * ─────
 * @param {object}   style          - One of the CONFIRM_STYLES entries (see below).
 * @param {string}   voucherNumber  - Badge text, e.g. voucher.strNumber.
 * @param {boolean}  loading        - Disables buttons and shows "Updating…" on confirm.
 * @param {Function} onConfirm      - Called when the user clicks the confirm button.
 * @param {Function} onBack         - Called when the user clicks "No, Go Back".
 */
export default function ConfirmationDialog({
  style: conf,
  voucherNumber,
  loading = false,
  onConfirm,
  onBack,
    buttonsMaxWidth = 320, // ← new prop with default
}) {
  if (!conf) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: conf.bg,
        px: 3,
        py: 4,
        gap: 2,
        animation: "fadeSlideIn 0.18s ease",
        "@keyframes fadeSlideIn": {
          from: { opacity: 0, transform: "scale(0.97)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      {/* ── Icon ── */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          background: "#fff",
          border: `1.5px solid ${conf.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${conf.dotColor}22`,
        }}
      >
        {conf.icon}
      </Box>

      {/* ── Title + description ── */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: 800,
            color: conf.color,
            lineHeight: 1.3,
            mb: 0.75,
          }}
        >
          {conf.title}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.7rem",
            color: "#6B7280",
            lineHeight: 1.6,
            maxWidth: 240,
            mx: "auto",
          }}
        >
          {conf.desc}
        </Typography>
      </Box>

      {/* ── Voucher number badge ── */}
      {voucherNumber && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: "50px",
            background: "rgba(0,0,0,0.05)",
            border: `0.5px solid ${conf.border}`,
          }}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.65rem", color: conf.color }} />
          <Typography
            sx={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: conf.color,
              lineHeight: 1,
            }}
          >
            {voucherNumber}
          </Typography>
        </Box>
      )}

      {/* ── Action buttons ── */}
      <Box sx={{ display: "flex", gap: 1, width: "100%", maxWidth: buttonsMaxWidth }}>
        {/* Go Back */}
        <Box
          onClick={loading ? undefined : onBack}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 0.875,
            borderRadius: "8px",
            background: loading ? "#F3F4F6" : "#fff",
            border: "0.5px solid #E5E7EB",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.15s",
            "&:hover": !loading
              ? { background: "#F9FAFB", borderColor: "#D1D5DB" }
              : {},
            "&:active": !loading ? { opacity: 0.8 } : {},
          }}
        >
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#374151" }}
          >
            No, Go Back
          </Typography>
        </Box>

        {/* Confirm */}
        <Box
          onClick={loading ? undefined : onConfirm}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 0.875,
            borderRadius: "8px",
            background: loading ? "#9CA3AF" : conf.confirmBg,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            boxShadow: `0 2px 8px ${conf.dotColor}44`,
            "&:hover": !loading
              ? { opacity: 0.9, transform: "translateY(-0.5px)" }
              : {},
            "&:active": !loading
              ? { opacity: 0.85, transform: "translateY(0)" }
              : {},
          }}
        >
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}
          >
            {loading ? "Updating…" : conf.confirmLabel}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}