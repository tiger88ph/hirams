import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ReceiptLongOutlined } from "@mui/icons-material";
import { resolveConfirmStyle } from "../../utils/style/sharedConfirmStyles.jsx";
import getThemeColors from "../../utils/style/getThemeColors.js";
import { useMemo } from "react";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  textSecondary: c.gray.textSecondary,
  btnText: c.slate.btnText,
  mutedBg: c.slate.mutedBg,
  btnBg: c.slate.btnBg,
  btnBorder: c.slate.btnBorder,
  btnHoverBg: c.slate.btnHoverBg,
  border: c.slate.border,
  outerBg: c.slate.outerBg,
  disabledBg: c.slate.mutedBg,
});

export default function ConfirmationStructure({
  style: rawStyle,
  voucherNumber,
  loading = false,
  onConfirm,
  onBack,
  buttonsMaxWidth = 320,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const conf = useMemo(
    () => resolveConfirmStyle(rawStyle, isDark),
    [rawStyle, isDark],
  );

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
      {/* Icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          background: colors.outerBg,
          border: `1.5px solid ${conf.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${conf.dotColor}22`,
        }}
      >
        {conf.icon ? (
          conf.icon
        ) : conf.Icon ? (
          <conf.Icon sx={{ fontSize: "1.4rem", color: conf.iconColor }} />
        ) : null}
      </Box>

      {/* Title + description */}
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
            color: colors.textSecondary,
            lineHeight: 1.6,
            maxWidth: 240,
            mx: "auto",
          }}
        >
          {conf.desc}
        </Typography>
      </Box>

      {/* Voucher number badge */}
      {voucherNumber && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: "50px",
            background: colors.mutedBg,
            border: `0.5px solid ${conf.border}`,
          }}
        >
          <ReceiptLongOutlined
            sx={{ fontSize: "0.65rem", color: conf.color }}
          />
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

      {/* Action buttons */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          width: "100%",
          maxWidth: buttonsMaxWidth,
        }}
      >
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
            background: loading ? colors.disabledBg : colors.btnBg,
            border: `0.5px solid ${colors.btnBorder}`,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.15s",
            "&:hover": !loading
              ? { background: colors.btnHoverBg, borderColor: colors.border }
              : {},
            "&:active": !loading ? { opacity: 0.8 } : {},
          }}
        >
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 600, color: colors.btnText }}
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
            background: loading ? colors.disabledBg : conf.confirmBg,
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
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              // confirmBg is always a gradient (see VARIANTS in sharedConfirmStyles.jsx),
              // and MUI's getContrastText/decomposeColor can't parse gradient strings —
              // it only accepts solid colors (#nnn, rgb(), hsl(), etc). Every gradient
              // variant is dark/saturated enough that white text reads fine, so hardcode it.
              color: "#fff",
            }}
          >
            {loading ? "Updating…" : conf.confirmLabel}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
