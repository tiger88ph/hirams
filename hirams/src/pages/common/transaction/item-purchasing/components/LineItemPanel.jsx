import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, IconButton } from "@mui/material";
import {
  Inventory2Outlined,
  EditOutlined,
  CheckCircleOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import MiniBaseButton from "../../../../../components/form/MiniBaseButton.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import { fmtDate, fmtPHP } from "../../../../../utils/formatters/formatter.js";

const useColors = (c) => ({
  border: c.slate.border,
  rowBg: c.slate.itemHeaderBg,
  innerBg: c.slate.innerBg,
  iconBoxBg: c.slate.mutedBg,
  iconBoxBorder: c.slate.mutedBorder,
  iconColor: c.slate.mutedColor,
  codeBadgeBg: c.blue.bg,
  codeBadgeBorder: c.blue.border,
  codeBadgeText: c.blue.text,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  labelMuted: c.gray.textMuted,
  mutedText: c.slate.mutedText,
  // Received colors
  receivedBadgeBg: c.blue.bg,
  receivedBadgeBorder: c.blue.border,
  receivedBadgeText: c.blue.text,
  receivedButtonColor: c.blue.textStrong,
  receivedButtonBorder: c.blue.border,
  receivedButtonHover: c.blue.hover,
  snText: c.blue.text,
  // Delivered colors
  deliveredBadgeBg: c.green.bg,
  deliveredBadgeBorder: c.green.border,
  deliveredBadgeText: c.green.text,
  deliveredButtonColor: c.green.text,
  deliveredButtonBorder: c.green.border,
  deliveredButtonHover: c.green.hover,
});

export const IconBox = ({
  size = 34,
  bg,
  border,
  radius = "8px",
  mr = 1,
  children,
  sx = {},
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg || c.iconBoxBg,
        border: border || `0.5px solid ${c.iconBoxBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        mr,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default function LineItemPanel({
  opt,
  p,
  lineTotal,
  maxQty,
  isReceivedEdit,
  isDeliveredEdit,
  deliveredMax,
  isReceivedFull,
  isReceivedSingle,
  isDeliveredFull,
  isDeliveredSingle,
  receivedSNRemaining,
  deliveredSNRemaining,
  receivedHistoryRows,
  deliveredHistoryRows,
  onStartReceived,
  onStartDelivered,
  onOpenReceivedHistory,
  onOpenDeliveredHistory,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" · ") ||
    p?.transaction_item?.strName ||
    "Item";

  const getReceivedLabel = () => {
    const rows = receivedHistoryRows || [];
    const qtyA = rows.reduce((sum, r) => sum + Number(r.nQuantity || 0), 0);
    return `Items Received [${qtyA}]`;
  };

  const getDeliveredLabel = () => {
    const rows = deliveredHistoryRows || [];
    const qtyA = rows.reduce((s, r) => s + Number(r.nQuantity || 0), 0);
    return `Delivered [${qtyA}]`;
  };

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: "10px",
        border: `0.5px solid ${c.border}`,
        overflow: "hidden",
      }}
    >
      {/* Selected item info */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "stretch",
          borderBottom: `0.5px solid ${c.border}`,
          background: c.rowBg,
        }}
      >
        <IconBox sx={{ alignSelf: "center" }}>
          <Inventory2Outlined
            sx={{ fontSize: "0.85rem", color: c.iconColor }}
          />
        </IconBox>
        <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}
          >
            {(p?.strBrand || p?.strModel) && (
              <Typography
                sx={{
                  fontSize: "0.67rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                }}
              >
                {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
              </Typography>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: "0.58rem",
              color: c.textSecondary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}
          >
            {p?.transaction_item?.strName ?? "—"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: c.textMuted,
              lineHeight: 1,
              mt: 0.25,
            }}
          >
            Item Delivery:{" "}
            {fmtDate(
              p?.transaction_item?.transaction?.dtDelivery ??
                "No Delivery Date Attached.",
            )}
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            textAlign: "right",
            alignSelf: "center",
            px: 0.7,
            py: 0.7,
            borderRadius: "6px",
            background: c.codeBadgeBg,
            border: `0.5px solid ${c.codeBadgeBorder}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.codeBadgeText,
              lineHeight: 1,
            }}
          >
            {p?.transaction_item?.transaction?.strCode ?? "—"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
        {/* ── Received summary row ── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.5 }}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1,
              py: 0.6,
              borderRadius: "7px",
              background: c.innerBg,
              border: `0.5px solid ${c.border}`,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}
            >
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: c.labelMuted,
                }}
              >
                Received
              </Typography>
              <Box
                sx={{
                  px: 0.5,
                  py: 0.15,
                  borderRadius: "4px",
                  background: isReceivedEdit ? c.receivedBadgeBg : c.iconBoxBg,
                  border: `0.5px solid ${isReceivedEdit ? c.receivedBadgeBorder : c.border}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: isReceivedEdit ? c.receivedBadgeText : c.mutedText,
                    lineHeight: 1,
                  }}
                >
                  {p?.nInventoryQty ?? 0} / {p?.nQuantity || 0}
                  {p?.receivedSerialNumbers?.length > 0 && (
                    <Box component="span" sx={{ color: c.snText, ml: 0.4 }}>
                      {" "}
                      · {p.receivedSerialNumbers.length} SN
                    </Box>
                  )}
                </Typography>
              </Box>
            </Box>
            {isReceivedFull ? (
              <IconButton
                size="small"
                onClick={onOpenReceivedHistory}
                sx={{
                  width: 26,
                  height: 26,
                  color: c.receivedButtonColor,
                  border: `0.5px solid ${c.receivedButtonBorder}`,
                  borderRadius: "6px",
                  flexShrink: 0,
                  "&:hover": { background: c.receivedButtonHover },
                }}
              >
                <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
              </IconButton>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                <MiniBaseButton
                  icon={<EditOutlined />}
                  label="Add"
                  variant="green"
                  lightMode
                  tooltip="Open Update Received modal"
                  onClick={onStartReceived}
                  sx={{ flexShrink: 0 }}
                />
                {(isReceivedEdit || receivedHistoryRows.length > 0) && (
                  <IconButton
                    size="small"
                    onClick={onOpenReceivedHistory}
                    sx={{
                      width: 26,
                      height: 26,
                      color: c.receivedButtonColor,
                      border: `0.5px solid ${c.receivedButtonBorder}`,
                      borderRadius: "6px",
                      flexShrink: 0,
                      "&:hover": { background: c.receivedButtonHover },
                    }}
                  >
                    <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* ── Delivered summary row ── */}
        {(p?.nInventoryQty || 0) > 0 && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.5 }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1,
                py: 0.6,
                borderRadius: "7px",
                background: c.innerBg,
                border: `0.5px solid ${c.border}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flex: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: c.labelMuted,
                  }}
                >
                  Delivered
                </Typography>
                <Box
                  sx={{
                    px: 0.5,
                    py: 0.15,
                    borderRadius: "4px",
                    background: isDeliveredEdit
                      ? c.deliveredBadgeBg
                      : c.iconBoxBg,
                    border: `0.5px solid ${isDeliveredEdit ? c.deliveredBadgeBorder : c.border}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      color: isDeliveredEdit
                        ? c.deliveredBadgeText
                        : c.mutedText,
                      lineHeight: 1,
                    }}
                  >
                    {p?.nDeliveredQty ?? 0} / {p?.nQuantity || 0}
                  </Typography>
                </Box>
              </Box>
              {isDeliveredFull ? (
                <IconButton
                  size="small"
                  onClick={onOpenDeliveredHistory}
                  sx={{
                    width: 26,
                    height: 26,
                    color: c.deliveredButtonColor,
                    border: `0.5px solid ${c.deliveredButtonBorder}`,
                    borderRadius: "6px",
                    flexShrink: 0,
                    "&:hover": { background: c.deliveredButtonHover },
                  }}
                >
                  <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                </IconButton>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flexShrink: 0,
                  }}
                >
                  <MiniBaseButton
                    icon={<EditOutlined />}
                    label="Add"
                    variant="green"
                    lightMode
                    disabled={(p?.nInventoryQty || 0) === 0}
                    tooltip={
                      (p?.nInventoryQty || 0) === 0
                        ? "No received inventory yet"
                        : "Open Update Delivered modal"
                    }
                    onClick={onStartDelivered}
                    sx={{ flexShrink: 0 }}
                  />
                  {(isDeliveredEdit || deliveredHistoryRows.length > 0) && (
                    <IconButton
                      size="small"
                      onClick={onOpenDeliveredHistory}
                      sx={{
                        width: 26,
                        height: 26,
                        color: c.deliveredButtonColor,
                        border: `0.5px solid ${c.deliveredButtonBorder}`,
                        borderRadius: "6px",
                        flexShrink: 0,
                        "&:hover": { background: c.deliveredButtonHover },
                      }}
                    >
                      <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
