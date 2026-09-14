import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import {
  Inventory2Outlined,
  VisibilityOutlined,
  AddOutlined,
} from "@mui/icons-material";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import { fmtDate } from "../../../../../utils/formatters/formatter.js";

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

  const noReceivedYet = (p?.nInventoryQty || 0) === 0;

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
              <Box
                onClick={onOpenReceivedHistory}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 0.4,
                  py: 0.4,
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: c.receivedBadgeBg,
                  border: `1px solid ${c.receivedBadgeBorder}`,
                  flexShrink: 0,
                  transition: "background 0.15s",
                  "&:hover": { background: c.receivedBadgeBorder },
                }}
              >
                <VisibilityOutlined
                  sx={{ fontSize: "0.9rem", color: c.receivedButtonColor }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                <Box
                  onClick={onStartReceived}
                  title="Open Update Received modal"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.4,
                    px: 0.4,
                    py: 0.4,
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: c.deliveredBadgeBg,
                    border: `1px solid ${c.deliveredBadgeBorder}`,
                    flexShrink: 0,
                    transition: "background 0.15s",
                    "&:hover": { background: c.deliveredBadgeBorder },
                  }}
                >
                  <AddOutlined
                    sx={{ fontSize: "0.9rem", color: c.deliveredButtonColor }}
                  />
                </Box>

                {(isReceivedEdit || receivedHistoryRows.length > 0) && (
                  <Box
                    onClick={onOpenReceivedHistory}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 0.4,
                      py: 0.4,
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: c.receivedBadgeBg,
                      border: `1px solid ${c.receivedBadgeBorder}`,
                      flexShrink: 0,
                      transition: "background 0.15s",
                      "&:hover": { background: c.receivedBadgeBorder },
                    }}
                  >
                    <VisibilityOutlined
                      sx={{ fontSize: "0.9rem", color: c.receivedButtonColor }}
                    />
                  </Box>
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
                <Box
                  onClick={onOpenDeliveredHistory}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.4,
                    px: 0.4,
                    py: 0.4,
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: c.deliveredBadgeBg,
                    border: `1px solid ${c.deliveredBadgeBorder}`,
                    flexShrink: 0,
                    transition: "background 0.15s",
                    "&:hover": { background: c.deliveredBadgeBorder },
                  }}
                >
                  <VisibilityOutlined
                    sx={{ fontSize: "0.9rem", color: c.deliveredButtonColor }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    onClick={noReceivedYet ? undefined : onStartDelivered}
                    title={
                      noReceivedYet
                        ? "No received inventory yet"
                        : "Open Update Delivered modal"
                    }
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 0.4,
                      py: 0.4,
                      borderRadius: "6px",
                      cursor: noReceivedYet ? "not-allowed" : "pointer",
                      opacity: noReceivedYet ? 0.5 : 1,
                      background: c.deliveredBadgeBg,
                      border: `1px solid ${c.deliveredBadgeBorder}`,
                      flexShrink: 0,
                      transition: "background 0.15s",
                      "&:hover": {
                        background: noReceivedYet
                          ? c.deliveredBadgeBg
                          : c.deliveredBadgeBorder,
                      },
                    }}
                  >
                    <AddOutlined
                      sx={{ fontSize: "0.9rem", color: c.deliveredButtonColor }}
                    />
                  </Box>

                  {(isDeliveredEdit || deliveredHistoryRows.length > 0) && (
                    <Box
                      onClick={onOpenDeliveredHistory}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.4,
                        px: 0.4,
                        py: 0.4,
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: c.deliveredBadgeBg,
                        border: `1px solid ${c.deliveredBadgeBorder}`,
                        flexShrink: 0,
                        transition: "background 0.15s",
                        "&:hover": { background: c.deliveredBadgeBorder },
                      }}
                    >
                      <VisibilityOutlined
                        sx={{
                          fontSize: "0.9rem",
                          color: c.deliveredButtonColor,
                        }}
                      />
                    </Box>
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