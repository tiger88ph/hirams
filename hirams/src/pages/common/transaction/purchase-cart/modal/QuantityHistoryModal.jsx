import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../layouts/modal/ModalContainer";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const useColors = (c, isDark) => ({
  // Tone colors
  blueBorder: c.blue.border,
  blueText: c.blue.text,
  greenBorder: c.green.border,
  greenText: c.green.text,
  // Container
  containerBg: c.slate.outerBg,
  containerBorder: c.slate.border,
  // Dividers / rows
  divider: c.slate.border,
  rowDivider: c.slate.borderRow,
  rowBgDisabled: c.slate.hover,
  // Text
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  // Error
  errorText: c.red.text,
  errorBg: c.red.bg,
  errorBorder: c.red.border,
  // Pending pill — orange
  pendingText: c.orange.text,
  pendingBg: c.orange.bg,
  pendingBorder: c.orange.border,
  // Re-activate button — green
  activeText: c.green.textDark,
  activeBg: c.green.bg,
  activeBorder: c.green.border,
  activeHoverBg: c.green.hoverBg,
  activeHoverBorder: c.green.hoverBorder,
  // Cancel button — red
  cancelText: c.red.text,
  cancelBg: c.red.bg,
  cancelBorder: c.red.border,
  cancelHoverBg: c.red.hoverBg,
  cancelHoverBorder: c.red.hoverBorder,
});

export default function QuantityHistoryModal({
  open,
  onClose,
  tone,
  title,
  rows,
  qtyDone,
  qtyTotal,
  p,
  toggleRowStatus,
  statusUpdatingId,
  statusError,
  historyLoading,
  historyError,
  isReceivedRow,
  deliveredQtyForOption,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base, isDark), [base, isDark]);

  // Tone colors from shared palette
  const toneColors =
    tone === "received"
      ? { border: c.blueBorder, text: c.blueText }
      : { border: c.greenBorder, text: c.greenText };

  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" · ") ||
    p?.transaction_item?.strName ||
    "Item";

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={
        title || `${tone === "received" ? "Received" : "Delivered"} History`
      }
      subTitle={itemLabel}
      showSave={false}
      cancelLabel="Close"
      width={{ xs: "92%", sm: 520, md: 600 }}
      contentPadding={{ xs: 1.5, sm: 2 }}
    >
      <Box
        sx={{
          borderRadius: "8px",
          border: `0.5px solid ${c.containerBorder}`,
          background: c.containerBg,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `0.5px solid ${c.divider}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: c.textSecondary,
            }}
          >
            {title ||
              `${tone === "received" ? "Received" : "Delivered"} Batches`}
          </Typography>
          <Typography
            sx={{ fontSize: "0.8rem", fontWeight: 700, color: c.textPrimary }}
          >
            {qtyDone ?? 0} / {qtyTotal || 0} {p?.strUOM ?? ""}
          </Typography>
        </Box>

        {/* Content */}
        {historyLoading ? (
          <Box sx={{ px: 1.5, py: 2 }}>
            <Typography sx={{ fontSize: "0.7rem", color: c.textFaint }}>
              Loading history...
            </Typography>
          </Box>
        ) : historyError ? (
          <Box sx={{ px: 1.5, py: 2 }}>
            <Typography sx={{ fontSize: "0.7rem", color: c.errorText }}>
              {historyError}
            </Typography>
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ px: 1.5, py: 2 }}>
            <Typography sx={{ fontSize: "0.7rem", color: c.textFaint }}>
              No {tone} batches recorded yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
            {rows.map((row, rowIdx) => {
              const rowSerials = (row.serialNumbers || []).filter(Boolean);
              const isActive = row.cStatus === "A";
              const isPending = row.cStatus === "P";
              const isCancelled = row.cStatus === "C";
              const isDisabledRow = !isActive;

              return (
                <Box
                  key={row.nInventoryId ?? rowIdx}
                  sx={{
                    borderBottom:
                      rowIdx === rows.length - 1
                        ? "none"
                        : `0.5px solid ${c.rowDivider}`,
                    background: isDisabledRow ? c.rowBgDisabled : "transparent",
                    opacity: isDisabledRow ? 0.6 : 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {/* Row Number */}
                    <Typography
                      sx={{
                        width: 26,
                        flexShrink: 0,
                        fontSize: "0.62rem",
                        fontWeight: 600,
                        color: c.textFaint,
                        textAlign: "right",
                      }}
                    >
                      {rowIdx + 1}
                    </Typography>

                    {/* Receipt No */}
                    <Typography
                      sx={{
                        minWidth: 80,
                        flexShrink: 0,
                        fontSize: "0.68rem",
                        fontWeight: 500,
                        color: c.textSecondary,
                      }}
                    >
                      {row.strReceiptNumber || "—"}
                    </Typography>

                    {/* QTY + UOM */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "flex-end",
                          gap: 0.3,
                          minWidth: 50,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: c.textPrimary,
                            lineHeight: 1,
                            textAlign: "right",
                          }}
                        >
                          {row.nQuantity}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.55rem",
                            color: c.textMuted,
                            textTransform: "uppercase",
                            lineHeight: 1,
                            textAlign: "left",
                          }}
                        >
                          {p?.strUOM ?? ""}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Date */}
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        color: c.textMuted,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        width: 90,
                        textAlign: "center",
                      }}
                    >
                      {row.dtLog
                        ? new Date(row.dtLog).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </Typography>

                    {/* Action column */}
                    <Box
                      sx={{
                        ml: 0.75,
                        width: 100,
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {isPending ? (
                        <Box
                          sx={{
                            width: 100,
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            py: 0.4,
                            borderRadius: "6px",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                            color: c.pendingText,
                            background: c.pendingBg,
                            border: `1px solid ${c.pendingBorder}`,
                            boxShadow: isDark
                              ? "inset 0 1px 0 rgba(255,255,255,0.08)"
                              : "inset 0 1px 0 rgba(255,255,255,0.6)",
                            cursor: "not-allowed",
                            userSelect: "none",
                          }}
                        >
                          Pending
                        </Box>
                      ) : isCancelled ? (
                        <Box
                          component="button"
                          onClick={() =>
                            toggleRowStatus(
                              row,
                              p?.nPurchaseOptionId,
                              isReceivedRow,
                              deliveredQtyForOption,
                              p?.strUOM,
                            )
                          }
                          disabled={statusUpdatingId === row.nInventoryId}
                          sx={{
                            width: 100,
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            py: 0.4,
                            borderRadius: "6px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            color: c.activeText,
                            background: c.activeBg,
                            border: `1px solid ${c.activeBorder}`,
                            boxShadow: isDark
                              ? "0 1px 2px rgba(74,222,128,0.1)"
                              : "0 1px 2px rgba(21,128,61,0.08)",
                            opacity:
                              statusUpdatingId === row.nInventoryId ? 0.6 : 1,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              background: c.activeHoverBg,
                              borderColor: c.activeHoverBorder,
                              boxShadow: isDark
                                ? "0 2px 4px rgba(74,222,128,0.15)"
                                : "0 2px 4px rgba(21,128,61,0.15)",
                            },
                            "&:active": {
                              transform: "translateY(0.5px)",
                              boxShadow: isDark
                                ? "0 1px 1px rgba(74,222,128,0.1)"
                                : "0 1px 1px rgba(21,128,61,0.1)",
                            },
                            "&:disabled": {
                              cursor: "not-allowed",
                              "&:hover": {
                                background: c.activeBg,
                                borderColor: c.activeBorder,
                                boxShadow: isDark
                                  ? "0 1px 2px rgba(74,222,128,0.1)"
                                  : "0 1px 2px rgba(21,128,61,0.08)",
                              },
                            },
                          }}
                        >
                          {statusUpdatingId === row.nInventoryId
                            ? "Updating..."
                            : "Re-activate"}
                        </Box>
                      ) : (
                        <Box
                          component="button"
                          onClick={() =>
                            toggleRowStatus(
                              row,
                              p?.nPurchaseOptionId,
                              isReceivedRow,
                              deliveredQtyForOption,
                              p?.strUOM,
                            )
                          }
                          disabled={statusUpdatingId === row.nInventoryId}
                          sx={{
                            width: 100,
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            py: 0.4,
                            borderRadius: "6px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            color: c.cancelText,
                            background: c.cancelBg,
                            border: `1px solid ${c.cancelBorder}`,
                            boxShadow: isDark
                              ? "0 1px 2px rgba(248,113,113,0.1)"
                              : "0 1px 2px rgba(220,38,38,0.08)",
                            opacity:
                              statusUpdatingId === row.nInventoryId ? 0.6 : 1,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              background: c.cancelHoverBg,
                              borderColor: c.cancelHoverBorder,
                              boxShadow: isDark
                                ? "0 2px 4px rgba(248,113,113,0.15)"
                                : "0 2px 4px rgba(220,38,38,0.15)",
                            },
                            "&:active": {
                              transform: "translateY(0.5px)",
                              boxShadow: isDark
                                ? "0 1px 1px rgba(248,113,113,0.1)"
                                : "0 1px 1px rgba(220,38,38,0.1)",
                            },
                            "&:disabled": {
                              cursor: "not-allowed",
                              "&:hover": {
                                background: c.cancelBg,
                                borderColor: c.cancelBorder,
                                boxShadow: isDark
                                  ? "0 1px 2px rgba(248,113,113,0.1)"
                                  : "0 1px 2px rgba(220,38,38,0.08)",
                              },
                            },
                          }}
                        >
                          {statusUpdatingId === row.nInventoryId
                            ? "Updating..."
                            : "Cancel"}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Serial Numbers */}
                  {rowSerials.length > 0 && (
                    <Box
                      sx={{
                        px: 1.5,
                        pb: 0.75,
                        pl: 4,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 600,
                          color: c.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        S/N:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.62rem",
                          color: c.textSecondary,
                          wordBreak: "break-all",
                        }}
                      >
                        {rowSerials.join(", ")}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Status Error */}
        {tone === "received" && statusError && (
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 500,
              color: c.errorText,
              px: 1.5,
              py: 0.75,
              background: c.errorBg,
              borderTop: `0.5px solid ${c.errorBorder}`,
            }}
          >
            {statusError}
          </Typography>
        )}
      </Box>
    </ModalContainer>
  );
}
