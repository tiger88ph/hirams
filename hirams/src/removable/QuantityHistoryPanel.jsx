import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Inventory2Outlined } from "@mui/icons-material";
import BaseButton from "../../../../../../../components/form/BaseButton.jsx";
import getThemeColors from "../../../../../../../utils/style/getThemeColors.js";
import icons from "../../../../../../../utils/style/iconFormatStyles.jsx";
import { fmtDate } from "../../../../../../../utils/formatters/formatter.js";

const useColors = (c, isDark) => ({
  blueBorder: c.blue.border,
  blueText: c.blue.text,
  blueTextStrong: c.blue.textStrong,
  blueBg: c.blue.bg,
  greenBorder: c.green.border,
  greenText: c.green.text,
  containerBg: c.slate.outerBg,
  containerBorder: c.slate.border,
  divider: c.slate.border,
  rowDivider: c.slate.borderRow,
  rowBgDisabled: c.slate.hover,
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  mutedColor: c.slate.mutedColor,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  errorText: c.red.text,
  errorBg: c.red.bg,
  errorBorder: c.red.border,
  pendingText: c.orange.text,
  pendingBg: c.orange.bg,
  pendingBorder: c.orange.border,
  activeText: c.green.textDark,
  activeBg: c.green.bg,
  activeBorder: c.green.border,
  activeHoverBg: c.green.hoverBg,
  activeHoverBorder: c.green.hoverBorder,
  cancelText: c.red.text,
  cancelBg: c.red.bg,
  cancelBorder: c.red.border,
  cancelHoverBg: c.red.hoverBg,
  cancelHoverBorder: c.red.hoverBorder,
});

const COL = {
  no: { width: 32, flexShrink: 0 },
  receipt: { width: 110, flexShrink: 0 },
  qty: { flex: 1, minWidth: 90 },
  serial: { width: 150, flexShrink: 0 },
  date: { width: 100, flexShrink: 0 },
  action: { width: 110, flexShrink: 0 },
};

const ItemInfo = ({ p, txnCode, deliveryDate, c }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "6px",
        background: c.mutedBg,
        border: `0.5px solid ${c.mutedBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Inventory2Outlined sx={{ fontSize: "0.75rem", color: c.mutedColor }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.4,
          mb: 0.2,
          flexWrap: "wrap",
        }}
      >
        {(p?.strBrand || p?.strModel) && (
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 600,
              color: c.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
          </Typography>
        )}
        {txnCode && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 0.35,
              py: 0.08,
              borderRadius: "50px",
              background: c.blueBg,
              border: `0.5px solid ${c.blueBorder}`,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.45rem",
                fontWeight: 500,
                color: c.blueTextStrong,
                lineHeight: 1,
              }}
            >
              {txnCode}
            </Typography>
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: "0.58rem",
          color: c.textSecondary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p?.transaction_item?.strName ?? "—"}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.48rem",
          color: c.mutedColor,
          lineHeight: 1,
          mt: 0.15,
        }}
      >
        Delivery: {deliveryDate}
      </Typography>
    </Box>
  </Box>
);

const HeaderCell = ({ label, col, c }) => (
  <Box sx={{ ...col, textAlign: "center" }}>
    <Typography
      sx={{
        fontSize: "0.55rem",
        fontWeight: 700,
        color: c.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const SerialBadges = ({ serials, c }) => {
  if (!serials.length) {
    return (
      <Typography sx={{ fontSize: "0.65rem", color: c.textFaint }}>
        —
      </Typography>
    );
  }
  const visible = serials.length > 2 ? serials.slice(0, 1) : serials;
  const overflow = serials.length - visible.length;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.4,
        width: "100%",
      }}
    >
      {visible.map((sn) => (
        <Typography
          key={sn}
          title={sn}
          sx={{
            fontSize: "0.58rem",
            fontWeight: 600,
            px: 0.6,
            py: 0.2,
            borderRadius: "5px",
            lineHeight: 1.4,
            color: c.blueText,
            background: c.blueBg,
            border: `1px solid ${c.blueBorder}`,
            maxWidth: 110,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sn}
        </Typography>
      ))}
      {overflow > 0 && (
        <Box
          title={serials.slice(visible.length).join(", ")}
          sx={{
            flexShrink: 0,
            minWidth: 20,
            height: 20,
            px: 0.4,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.55rem",
            fontWeight: 700,
            color: c.textSecondary,
            background: c.rowBgDisabled,
            border: `1px solid ${c.containerBorder}`,
            cursor: "default",
          }}
        >
          +{overflow}
        </Box>
      )}
    </Box>
  );
};

const StatusActionButton = ({
  isPending,
  isCancelled,
  statusUpdatingId,
  row,
  onClick,
  c,
  isDark,
}) => {
  if (isPending) {
    return (
      <Box
        sx={{
          width: "100%",
          fontSize: "0.58rem",
          fontWeight: 700,
          py: 0.4,
          borderRadius: "6px",
          whiteSpace: "nowrap",
          textAlign: "center",
          color: c.pendingText,
          background: c.pendingBg,
          border: `1px solid ${c.pendingBorder}`,
          cursor: "not-allowed",
          userSelect: "none",
        }}
      >
        Pending
      </Box>
    );
  }
  if (isCancelled) {
    return (
      <Box
        component="button"
        onClick={onClick}
        disabled={statusUpdatingId === row.nInventoryId}
        sx={{
          width: "100%",
          fontSize: "0.58rem",
          fontWeight: 700,
          py: 0.4,
          borderRadius: "6px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          color: c.pendingText,
          background: c.pendingBg,
          border: `1px solid ${c.pendingBorder}`,
          opacity: statusUpdatingId === row.nInventoryId ? 0.6 : 1,
          transition: "all 0.15s ease",
          "&:hover": {
            background: c.pendingBg,
            borderColor: c.pendingBorder,
          },
          "&:disabled": { cursor: "not-allowed" },
        }}
      >
        {statusUpdatingId === row.nInventoryId ? "Updating..." : "Re-activate"}
      </Box>
    );
  }
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={statusUpdatingId === row.nInventoryId}
      sx={{
        width: "100%",
        fontSize: "0.58rem",
        fontWeight: 700,
        py: 0.4,
        borderRadius: "6px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        color: c.pendingText,
        background: c.pendingBg,
        border: `1px solid ${c.pendingBorder}`,
        opacity: statusUpdatingId === row.nInventoryId ? 0.6 : 1,
        transition: "all 0.15s ease",
        "&:hover": {
          background: c.pendingBg,
          borderColor: c.pendingBorder,
        },
        "&:disabled": { cursor: "not-allowed" },
      }}
    >
      {statusUpdatingId === row.nInventoryId ? "Updating..." : "Cancel"}
    </Box>
  );
};

export default function QuantityHistoryPanel({
  nPurchaseItemId,
  tone,
  p,
  receivedHistoryRows = [],
  deliveredHistoryRows = [],
  toggleRowStatus,
  statusUpdatingId,
  statusError,
  historyLoading,
  historyError,
  onBack,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const c = useMemo(() => useColors(base, isDark), [base, isDark]);

  const isReceivedRow = tone === "received";
  const rows = isReceivedRow ? receivedHistoryRows : deliveredHistoryRows;
  const qtyDone = isReceivedRow ? p?.nInventoryQty : p?.nDeliveredQty;
  const qtyTotal = p?.nQuantity;
  const deliveredQtyForOption = isReceivedRow ? p?.nDeliveredQty : 0;

  const tx = p?.transaction_item?.transaction;
  const txnCode = tx?.strCode ?? "";
  const deliveryDate = fmtDate(tx?.dtDelivery) || "—";

  return (
    <>
      <Box
        sx={{
          borderRadius: "8px",
          border: `0.5px solid ${c.containerBorder}`,
          background: c.containerBg,
          overflow: "hidden",
        }}
      >
        {/* Header — item info + qty summary */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `0.5px solid ${c.divider}`,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <ItemInfo p={p} txnCode={txnCode} deliveryDate={deliveryDate} c={c} />
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: c.textPrimary,
              flexShrink: 0,
            }}
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
          <>
            <Box
              sx={{
                px: 1.5,
                py: 0.7,
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
                background: c.rowBgDisabled,
                borderBottom: `0.5px solid ${c.divider}`,
              }}
            >
              <HeaderCell label="No." col={COL.no} c={c} />
              <HeaderCell label="Receipt No." col={COL.receipt} c={c} />
              <HeaderCell label="Quantity" col={COL.qty} c={c} />
              <HeaderCell label="S/N" col={COL.serial} c={c} />
              <HeaderCell label="Date" col={COL.date} c={c} />
              <HeaderCell label="Action" col={COL.action} c={c} />
            </Box>

            <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
              {rows.map((row, rowIdx) => {
                const rowSerials = (row.serialNumbers || []).filter(Boolean);
                const isActive = row.cStatus === "A";
                const isPending = row.cStatus === "P";
                const isCancelled = row.cStatus === "C";
                const isDisabledRow = !isActive;

                const handleToggle = () =>
                  toggleRowStatus(
                    row,
                    p?.nPurchaseItemId,
                    isReceivedRow,
                    deliveredQtyForOption,
                    p?.strUOM,
                  );

                return (
                  <Box
                    key={row.nInventoryId ?? rowIdx}
                    sx={{
                      borderBottom:
                        rowIdx === rows.length - 1
                          ? "none"
                          : `0.5px solid ${c.rowDivider}`,
                      background: isDisabledRow
                        ? c.rowBgDisabled
                        : "transparent",
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
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                      }}
                    >
                      <Box sx={{ ...COL.no, textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            color: c.textFaint,
                          }}
                        >
                          {rowIdx + 1}
                        </Typography>
                      </Box>

                      <Box sx={{ ...COL.receipt, textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 500,
                            color: c.textSecondary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.strReceiptNumber || "—"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          ...COL.qty,
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "center",
                          gap: 0.3,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: c.textPrimary,
                            lineHeight: 1,
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
                          }}
                        >
                          {p?.strUOM ?? ""}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          ...COL.serial,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <SerialBadges serials={rowSerials} c={c} />
                      </Box>

                      <Box sx={{ ...COL.date, textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            color: c.textMuted,
                            whiteSpace: "nowrap",
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
                      </Box>

                      <Box
                        sx={{
                          ...COL.action,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <StatusActionButton
                          isPending={isPending}
                          isCancelled={isCancelled}
                          statusUpdatingId={statusUpdatingId}
                          row={row}
                          onClick={handleToggle}
                          c={c}
                          isDark={isDark}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {isReceivedRow && statusError && (
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
    </>
  );
}
