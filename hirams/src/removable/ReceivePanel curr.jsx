import React, { useState, useEffect } from "react";
import { Box, Typography, Divider, Collapse, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Inventory2Outlined,
  CheckCircleOutlined,
  UnfoldMore,
  UnfoldLess,
  HistoryOutlined,
  MoveToInboxOutlined,
  OutputOutlined,
  ArrowBackOutlined, // ← NEW
  ReceiptLongOutlined, // ← NEW
} from "@mui/icons-material";
import JevAPI from "../../../../../../../api/endpoints/jev.api.js";
import JevEntriesAPI from "../../../../../../../api/endpoints/jev-entries.api.js"; // ← NEW
import useKeysLabels from "../../../../../../../hooks/useKeysLabels.js"; // ← NEW
import icons from "../../../../../../../utils/style/iconFormatStyles.jsx"; // ← NEW
import FormGrid from "../../../../../../../components/form/FormGrid.jsx";
import InventoryAPI from "../../../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../../../api/endpoints/purchase-order.api.js";
import SerialNumberAPI from "../../../../../../../api/endpoints/serial-number.api.js";
import {
  showSwal,
  withSpinner,
} from "../../../../../../../utils/helpers/swal.jsx";
import { fmtDate } from "../../../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../../../utils/style/getThemeColors.js";
import BaseButton from "../../../../../../../components/form/BaseButton.jsx";
import { fmtPHP } from "../../../../../../../utils/formatters/formatter.js";
import JevViewPanel from "../../../../voucher/components/JevViewPanel.jsx";
const useColors = (c) => ({
  cardBg: c.slate.outerBg,
  cardBorder: c.slate.border,
  rowHover: c.slate.itemHover,
  rowBgDisabled: c.slate.hover,
  divider: c.slate.divider,
  rowDivider: c.slate.borderRow,
  inputBg: c.gray.inputBg,
  inputBorder: c.slate.btnBorder,
  inputFocusBorder: c.blue.text,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  blueText: c.blue.text,
  blueTextAlt: c.blue.textStrong,
  blueBg: c.blue.bg,
  blueBgSoft: c.blue.bgSoft,
  blueBorder: c.blue.border,
  greenText: c.green.text,
  deepBlueText: c.teal.text,
  errorText: c.red.text,
  errorBg: c.red.bg,
  btnBgDisabled: c.slate.btnBg,
  iconMuted: c.slate.mutedColor,
  pendingText: c.orange.text,
  pendingBg: c.orange.bg,
  pendingBorder: c.orange.border,
});

// ── JEV view: replaces the item rows while a JEV is open ───────────────────
const humanizeKey = (k) =>
  String(k)
    .replace(/^(str|dt|n|d|c)(?=[A-Z])/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

const fmtJevVal = (k, v) => {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (/^dt/.test(k) || /date/i.test(k)) {
    const d = new Date(v);
    if (!isNaN(d))
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
  }
  return String(v);
};
function useJevBalance(jevId, grandTotal) {
  const [state, setState] = useState({
    balanced: false,
    loading: false,
    message: "",
  });
  const [tick, setTick] = useState(0);

  // re-check when entries are added/edited/deleted (fired by JevViewPanel)
  useEffect(() => {
    if (!jevId) return;
    const h = (e) => {
      if (String(e.detail?.jevId) === String(jevId)) setTick((k) => k + 1);
    };
    window.addEventListener("jev_entry_data_updated", h);
    window.addEventListener("jev_entry_data_deleted", h);
    return () => {
      window.removeEventListener("jev_entry_data_updated", h);
      window.removeEventListener("jev_entry_data_deleted", h);
    };
  }, [jevId]);

  useEffect(() => {
    if (!jevId) return;
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    JevEntriesAPI.getByJevId(jevId)
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        const from = list
          .filter((e) => Number(e.dAmount) < 0)
          .reduce((s, e) => s + Math.abs(Number(e.dAmount || 0)), 0);
        const to = list
          .filter((e) => Number(e.dAmount) >= 0)
          .reduce((s, e) => s + Math.abs(Number(e.dAmount || 0)), 0);
        const balanced = from > 0 && to > 0 && from === to;
        const matches =
          Number(from.toFixed(2)) === Number(grandTotal.toFixed(2));

        let message = "";
        if (from === 0 && to === 0) message = "JEV Entries not yet added";
        else if (!balanced) message = "JEV entries not balanced yet";
        else if (!matches)
          message = "JEV entries balanced but do not match the total";

        setState({ balanced: balanced && matches, loading: false, message });
      })
      .catch((err) => {
        console.error("JEV balance check failed:", err);
        if (active)
          setState({
            balanced: false,
            loading: false,
            message: "JEV entries not balanced yet",
          });
      });
    return () => {
      active = false;
    };
  }, [jevId, grandTotal, tick]);

  return state;
}
function JevView({
  c,
  p,
  jevId,
  qty,
  eqValue,
  jev,
  loading,
  error,
  jevPendingKey,
  isFinanceOfficer,
  isManagement,
  balance,
}) {
  const isPending = String(jev?.cStatus) === String(jevPendingKey);

  return (
    <Box>
      {/* ITEM INFO (same info as the item row) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "6px",
            background: c.btnBgDisabled,
            border: `0.5px solid ${c.inputBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Inventory2Outlined
            sx={{ fontSize: "0.75rem", color: c.iconMuted }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                }}
              >
                {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
              </Typography>
            )}
            <Box
              sx={{
                display: "inline-flex",
                px: 0.35,
                py: 0.08,
                borderRadius: "50px",
                background: c.blueBg,
                border: `0.5px solid ${c.blueBorder}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.45rem",
                  fontWeight: 500,
                  color: c.blueTextAlt,
                  lineHeight: 1,
                }}
              >
                {p?.transaction_item?.transaction?.strCode ?? "—"}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: "0.58rem", color: c.textSecondary }}>
            {p?.transaction_item?.strName ?? "—"}
          </Typography>
          <Typography
            sx={{ fontSize: "0.48rem", color: c.iconMuted, mt: 0.15 }}
          >
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                px: 0.6,
                py: 0.18,
                borderRadius: "6px",
                fontSize: "0.45rem",
                fontWeight: 600,
                color: c.blueText,
                background: c.blueBgSoft,
                border: `1px solid ${c.blueBorder}`,
                whiteSpace: "nowrap",
              }}
            >
              ₱ {fmtPHP(eqValue)}
            </Box>
            <Typography
              sx={{ fontSize: "0.8rem", fontWeight: 800, color: c.blueText }}
            >
              {qty}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "0.4rem",
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            {p?.strUOM ?? ""}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: c.divider, mb: 1.25 }} />

      {jev && isPending && !balance.loading && balance.message && (
        <Typography
          sx={{
            fontSize: "0.55rem",
            fontStyle: "italic",
            color: c.errorText,
            mb: 1,
          }}
        >
          {balance.message}
        </Typography>
      )}

      {/* JEV CONTENT */}
      {loading ? (
        <Typography sx={{ fontSize: "0.65rem", color: c.textFaint }}>
          Loading JEV...
        </Typography>
      ) : error ? (
        <Typography sx={{ fontSize: "0.65rem", color: c.errorText }}>
          {error}
        </Typography>
      ) : !jev ? (
        <Typography sx={{ fontSize: "0.65rem", color: c.textFaint }}>
          No JEV data available.
        </Typography>
      ) : (
        <JevViewPanel
          key={jevId}
          jev={{ ...jev, nJEVId: jev?.nJEVId ?? jevId }}
          particularsGrandTotal={eqValue}
          jevPendingKey={jevPendingKey}
          isFinanceOfficer={isFinanceOfficer}
          isManagement={isManagement}
          isJevBalanced={balance.balanced}
          jevBalanceLoading={balance.loading}
          isAssigneeType={false}
          assigneeLinks={[]}
          supplierLinks={[]}
        />
      )}
    </Box>
  );
}
function BatchHistoryTable({
  batches,
  uom,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
  unitPrice = 0,
}) {
  if (!batches || batches.length === 0) {
    return (
      <Typography sx={{ fontSize: "0.65rem", color: c.textFaint, py: 1 }}>
        No batches recorded yet.
      </Typography>
    );
  }

  const statusLabel = (status) => {
    if (status === "A") return "Active";
    if (status === "P") return "Pending";
    if (status === "C") return "Cancelled";
    return "—";
  };
  const statusColors = (status) => {
    if (status === "A")
      return { color: c.greenText, bg: c.blueBgSoft, border: c.blueBorder };
    if (status === "P")
      return {
        color: c.pendingText ?? "#b45309",
        bg: c.blueBgSoft,
        border: c.blueBorder,
      };
    if (status === "C")
      return { color: c.errorText, bg: c.errorBg, border: c.errorText };
    return { color: c.textFaint, bg: c.rowBgDisabled, border: c.divider };
  };

  const COLS = {
    no: { width: 28, flexShrink: 0 },
    receipt: { flex: 1, minWidth: 80 },
    qty: { flex: 1, minWidth: 60 },
    sn: { flex: 1, minWidth: 80 },
    status: { flex: 1, minWidth: 70 },
    date: { flex: 1, minWidth: 70 },
    equivalent: { flex: 1, minWidth: 80 }, // ← NEW
    action: { flex: 1, minWidth: 70 },
  };
  const headerCellSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const bodyCellSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  return (
    <Box
      sx={{
        borderRadius: "6px",
        border: `0.5px solid ${c.divider}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 0.5,
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          gap: 1,
          background: c.rowBgDisabled,
          borderBottom: `0.5px solid ${c.divider}`,
        }}
      >
        <Box sx={{ ...COLS.no, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            No.
          </Typography>
        </Box>
        <Box sx={{ ...COLS.receipt, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Receipt No.
          </Typography>
        </Box>
        <Box sx={{ ...COLS.qty, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Quantity
          </Typography>
        </Box>
        <Box sx={{ ...COLS.equivalent, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Equivalent
          </Typography>
        </Box>
        <Box sx={{ ...COLS.sn, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            S/N
          </Typography>
        </Box>
        <Box sx={{ ...COLS.status, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Status
          </Typography>
        </Box>
        <Box sx={{ ...COLS.date, ...headerCellSx }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Date
          </Typography>
        </Box>

        {allowActions && (
          <Box sx={{ ...COLS.action, ...headerCellSx }}>
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textMuted,
                textTransform: "uppercase",
              }}
            >
              Action
            </Typography>
          </Box>
        )}
      </Box>

      {batches.map((b, i) => {
        const serials = (b.serialNumbers || []).filter(Boolean);
        const isPending = b.cStatus === "P" && !actionableWhenPending;
        const isCancelled = b.cStatus === "C";
        const statusStyle = statusColors(b.cStatus);
        return (
          <Box
            key={b.nInventoryId ?? `${b.receiptNumber}-${i}`}
            sx={{
              px: 1,
              py: 0.6,
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: { xs: "wrap", sm: "nowrap" },
              borderBottom:
                i === batches.length - 1
                  ? "none"
                  : `0.5px solid ${c.rowDivider}`,
            }}
          >
            <Box sx={{ ...COLS.no, ...bodyCellSx }}>
              <Typography
                sx={{ fontSize: "0.6rem", fontWeight: 600, color: c.textFaint }}
              >
                {i + 1}
              </Typography>
            </Box>

            <Box sx={{ ...COLS.receipt, ...bodyCellSx }}>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: c.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.receiptNumber || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                ...COLS.qty,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 0.3,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: c.textPrimary,
                  lineHeight: 1,
                }}
              >
                {b.qty}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.52rem",
                  color: c.textMuted,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {uom}
              </Typography>
            </Box>
            <Box sx={{ ...COLS.equivalent, ...bodyCellSx }}>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: c.textPrimary,
                  whiteSpace: "nowrap",
                }}
              >
                {(Number(b.qty || 0) * Number(unitPrice || 0)).toLocaleString(
                  "en-US",
                  { style: "currency", currency: "PHP" },
                )}
              </Typography>
            </Box>
            <Box sx={{ ...COLS.sn, ...bodyCellSx }}>
              {serials.length ? (
                <Typography
                  title={serials.join(", ")}
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: c.blueText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {serials.length > 1
                    ? `${serials[0]} +${serials.length - 1}`
                    : serials[0]}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: "0.6rem", color: c.textFaint }}>
                  —
                </Typography>
              )}
            </Box>

            <Box sx={{ ...COLS.status, ...bodyCellSx }}>
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  fontSize: "0.5rem",
                  fontWeight: 700,
                  px: 0.7,
                  py: 0.2,
                  borderRadius: "6px",
                  color: statusStyle.color,
                  background: statusStyle.bg,
                  border: `1px solid ${statusStyle.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {statusLabel(b.cStatus)}
              </Box>
            </Box>

            <Box sx={{ ...COLS.date, ...bodyCellSx }}>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: c.textMuted,
                  whiteSpace: "nowrap",
                }}
              >
                {b.dtLog
                  ? new Date(b.dtLog).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </Typography>
            </Box>

            {allowActions && (
              <Box sx={{ ...COLS.action, ...bodyCellSx }}>
                {isPending ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      py: 0.35,
                      px: 0.6,
                      borderRadius: "6px",
                      color: c.pendingText ?? "#b45309",
                      background: c.blueBgSoft,
                      border: `1px solid ${c.blueBorder}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Pending
                  </Box>
                ) : (
                  <Box
                    component="button"
                    onClick={() => onToggleStatus?.(b)}
                    disabled={statusUpdatingId === b.nInventoryId}
                    sx={{
                      width: "fit-content",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      py: 0.35,
                      px: 0.6,
                      borderRadius: "6px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      color: c.pendingText,
                      background: c.pendingBg,
                      border: `1px solid ${c.pendingBorder}`,
                      opacity: statusUpdatingId === b.nInventoryId ? 0.6 : 1,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        background: c.pendingBg,
                        borderColor: c.pendingBorder,
                      },
                      "&:disabled": { cursor: "not-allowed" },
                    }}
                  >
                    {statusUpdatingId === b.nInventoryId
                      ? "Updating..."
                      : isCancelled
                        ? "Re-activate"
                        : "Cancel"}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
function ReceivedItemRow({
  idx,
  p,
  batches,
  expanded,
  onToggleExpand,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
  showReceivedProgress = false,
  showDeliveredProgress = false,
  approvedProgressQty,
  pendingProgressQty = 0,
  showEqBadge = false,
  onViewJev, // ← NEW (replaces onCreateJev/creatingJev)
  statusLabel = "Status",
}) {
  const jevId = (batches || []).find((b) => b.nJEVId)?.nJEVId; // ← NEW
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: c.btnBgDisabled,
              border: `0.5px solid ${c.inputBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inventory2Outlined
              sx={{ fontSize: "0.75rem", color: c.iconMuted }}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: -5,
              left: -5,
              minWidth: 13,
              height: 13,
              px: 0.25,
              borderRadius: "50px",
              background: c.textMuted,
              border: `1.5px solid ${c.cardBg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.4rem",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {idx + 1}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                  color: c.blueTextAlt,
                  lineHeight: 1,
                }}
              >
                {p?.transaction_item?.transaction?.strCode ?? "—"}
              </Typography>
            </Box>
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
              color: c.iconMuted,
              lineHeight: 1,
              mt: 0.15,
            }}
          >
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>
        {/* STATUS SUMMARY */}
        {(() => {
          const qty = (batches || []).reduce((sum, b) => sum + (b.qty || 0), 0);
          const unitPrice = p?.dUnitPrice ?? 0;
          const received = Number(p?.nInventoryQty ?? 0);
          const ordered = Number(p?.nQuantity || 0);
          const showProgress = showReceivedProgress || showDeliveredProgress;

          const progressQty = showProgress
            ? Number(
                approvedProgressQty ?? (showDeliveredProgress ? qty : received),
              )
            : qty;
          const pendingQty = Number(pendingProgressQty) || 0;

          const eqValue = qty * unitPrice;
          const eqApproved = progressQty * unitPrice;
          const eqPending = pendingQty * unitPrice;
          const eqOrdered = ordered * unitPrice;

          const badge = (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 0.2,
                px: 0.6,
                py: 0.18,
                borderRadius: "6px",
                fontSize: "0.45rem",
                fontWeight: 600,
                color: c.blueText,
                background: c.blueBgSoft,
                border: `1px solid ${c.blueBorder}`,
                whiteSpace: "nowrap",
                lineHeight: 1.1,
              }}
            >
              {showProgress ? (
                <>
                  ₱{fmtPHP(eqApproved)}
                  {eqPending > 0 && (
                    <Box
                      component="span"
                      sx={{ color: c.errorText, fontWeight: 700 }}
                    >
                      (₱ {fmtPHP(eqPending)})
                    </Box>
                  )}
                  <Box component="span">/ ₱ {fmtPHP(eqOrdered)}</Box>
                </>
              ) : (
                <>₱ {fmtPHP(eqValue)}</>
              )}
            </Box>
          );

          return (
            <Box sx={{ textAlign: "right", flexShrink: 0, px: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.5rem",
                  color: c.textMuted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {statusLabel}
              </Typography>
              <Box sx={{ textAlign: "right" }}>
                {/* Stacked layout: badge on its own row above qty (progress tabs) */}
                {showEqBadge && showProgress && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mb: 0.25,
                    }}
                  >
                    {badge}
                  </Box>
                )}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.5,
                    flexWrap: "nowrap",
                  }}
                >
                  {/* Inline layout: badge beside qty (non-progress tabs, e.g. Pending JEV) */}
                  {showEqBadge && !showProgress && badge}

                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: c.blueText,
                      display: showProgress ? "flex" : undefined,
                      alignItems: "baseline",
                      gap: 0.25,
                      justifyContent: "flex-end",
                      lineHeight: 1.1,
                    }}
                  >
                    {showProgress ? progressQty : qty}
                    {showProgress && pendingQty > 0 && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: c.errorText,
                        }}
                      >
                        ({pendingQty} Pend)
                      </Box>
                    )}
                    {showProgress && (
                      <Box
                        component="span"
                        sx={{ fontSize: "0.55rem", fontWeight: 700 }}
                      >
                        / {ordered}
                      </Box>
                    )}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: "0.4rem",
                    color: c.textMuted,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    mt: 0.15,
                  }}
                >
                  {p?.strUOM ?? ""}
                </Typography>
              </Box>
            </Box>
          );
        })()}
        <Box
          component="button"
          onClick={onToggleExpand}
          sx={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `0.5px solid ${c.inputBorder}`,
            borderRadius: "50px",
            background: expanded ? c.blueBgSoft : "transparent",
            color: expanded ? c.blueText : c.iconMuted,
            cursor: "pointer",
            ml: 0.5,
          }}
          title={expanded ? "Hide quantity history" : "Show quantity history"}
        >
          <HistoryOutlined sx={{ fontSize: "0.85rem" }} />
        </Box>

        {jevId && (
          <Box
            component="button"
            onClick={() => onViewJev?.(jevId, p, batches)}
            sx={{
              height: 28,
              display: "flex",
              alignItems: "center",
              gap: 0.3,
              px: 0.8,
              flexShrink: 0,
              border: `0.5px solid ${c.blueBorder}`,
              borderRadius: "50px",
              background: c.blueBgSoft,
              color: c.blueText,
              cursor: "pointer",
              fontSize: "0.55rem",
              fontWeight: 700,
              ml: 0.5,
              whiteSpace: "nowrap",
            }}
            title="View JEV"
          >
            View JEV
          </Box>
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ pb: 1.25, pl: 0 }}>
          <Divider sx={{ borderColor: c.divider, mb: 1 }} />
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              mb: 0.75,
            }}
          >
            Logs
          </Typography>
          <BatchHistoryTable
            batches={batches}
            uom={p?.strUOM ?? ""}
            c={c}
            onToggleStatus={onToggleStatus}
            statusUpdatingId={statusUpdatingId}
            allowActions={allowActions}
            actionableWhenPending={actionableWhenPending}
            showStatus={showStatus}
            unitPrice={p?.dUnitPrice}
          />
        </Box>
      </Collapse>

      <Divider sx={{ borderColor: c.divider }} />
    </Box>
  );
}

// ── One item's row (header + collapsible receive form) ─────────────────────
function ItemReceiveRow({
  idx,
  p,
  value,
  onChange,
  expanded,
  onToggleExpand,
  historyExpanded,
  onToggleHistoryExpand,
  batches,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
  statusLabel = "Status", // ← NEW
}) {
  const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
  const isSingle =
    !((p?.nInventoryQty || 0) >= (p?.nQuantity || 0)) && maxQty === 1;
  // const itemLabel =
  [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

  const setQty = (qty) => onChange({ ...value, qty });
  const setReceiptNo = (receiptNo) => onChange({ ...value, receiptNo });
  const setSerials = (serials) => onChange({ ...value, serials });
  const toggleSN = () => onChange({ ...value, showSN: !value.showSN });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: c.btnBgDisabled,
              border: `0.5px solid ${c.inputBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inventory2Outlined
              sx={{ fontSize: "0.75rem", color: c.iconMuted }}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: -5,
              left: -5,
              minWidth: 13,
              height: 13,
              px: 0.25,
              borderRadius: "50px",
              background: c.textMuted,
              border: `1.5px solid ${c.cardBg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.4rem",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {idx + 1}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                  color: c.blueTextAlt,
                  lineHeight: 1,
                }}
              >
                {p?.transaction_item?.transaction?.strCode ?? "—"}
              </Typography>
            </Box>
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
              color: c.iconMuted,
              lineHeight: 1,
              mt: 0.15,
            }}
          >
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        {/* TO RECEIVE summary */}
        <Box sx={{ textAlign: "right", flexShrink: 0, px: 1 }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              color: c.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {statusLabel}
          </Typography>
          <Box sx={{ textAlign: "right" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0.5,
                flexWrap: "nowrap",
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 0.6,
                  py: 0.18,
                  borderRadius: "6px",
                  fontSize: "0.45rem",

                  fontWeight: 600,
                  color: c.blueText,
                  background: c.blueBgSoft,
                  border: `1px solid ${c.blueBorder}`,
                  whiteSpace: "nowrap",
                  lineHeight: 1.1,
                }}
              >
                ₱ {fmtPHP(Number(maxQty || 0) * Number(p?.dUnitPrice || 0))}
              </Box>

              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: c.blueText,
                  lineHeight: 1.1,
                }}
              >
                {maxQty}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: "0.4rem",
                color: c.textMuted,
                fontWeight: 500,
                textTransform: "uppercase",
                mt: 0.15,
              }}
            >
              {p?.strUOM ?? ""}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <Box
            component="button"
            onClick={onToggleHistoryExpand}
            sx={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "50px",
              background: historyExpanded ? c.blueBgSoft : "transparent",
              color: historyExpanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
              mr: 0.25,
            }}
            title={
              historyExpanded
                ? "Hide quantity history"
                : "Show quantity history"
            }
          >
            <HistoryOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>

          <Box
            component="button"
            onClick={onToggleExpand}
            sx={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "50px",
              background: expanded ? c.blueBgSoft : "transparent",
              color: expanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
            }}
            title={expanded ? "Hide receive form" : "Show receive form"}
          >
            <MoveToInboxOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>
        </Box>
      </Box>

      <Collapse in={historyExpanded}>
        <Box sx={{ pb: 1.25, pl: 0 }}>
          <Divider sx={{ borderColor: c.divider, mb: 1 }} />
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              mb: 0.75,
            }}
          >
            Logs
          </Typography>
          <BatchHistoryTable
            batches={batches}
            uom={p?.strUOM ?? ""}
            c={c}
            onToggleStatus={onToggleStatus}
            statusUpdatingId={statusUpdatingId}
            allowActions={allowActions}
            actionableWhenPending={actionableWhenPending}
            showStatus={showStatus}
            unitPrice={p?.dUnitPrice}
          />
        </Box>
      </Collapse>
      <Collapse in={expanded}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pb: 1.25,
            pl: 0,
          }}
        >
          <Divider sx={{ borderColor: c.divider }} />
          {/* Qty + SN toggle + Receipt No — single row */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Typography
                sx={{
                  flex: isSingle ? 1.4 : 1,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Quantity to Receive
              </Typography>
              <Typography
                sx={{
                  width: 55,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Receipt No.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              {isSingle ? (
                <Box
                  component="button"
                  onClick={() => setQty(value.qty === "1" ? "" : "1")}
                  sx={{
                    flex: 1.4,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: value.qty === "1" ? "#fff" : c.blueText,
                    background: value.qty === "1" ? c.blueText : c.blueBgSoft,
                    border: `0.5px solid ${c.blueBorder}`,
                    borderRadius: "7px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <CheckCircleOutlined
                    sx={{ fontSize: "0.85rem", flexShrink: 0 }}
                  />
                  {value.qty === "1"
                    ? "1 Received"
                    : `Mark 1 ${p?.strUOM ?? ""}`}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flex: 1 }}>
                  <Box
                    component="input"
                    type="number"
                    min={0}
                    max={maxQty}
                    value={value.qty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= maxQty) setQty(e.target.value);
                    }}
                    sx={{
                      flex: 1,
                      height: 32,
                      px: 0.9,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: c.textPrimary,
                      border: `0.5px solid ${c.inputBorder}`,
                      borderRight: "none",
                      borderRadius: "7px 0 0 7px",
                      outline: "none",
                      background: c.inputBg,
                    }}
                  />
                  <Box
                    sx={{
                      height: 32,
                      px: 1,
                      display: "flex",
                      alignItems: "center",
                      background: c.btnBgDisabled,
                      border: `0.5px solid ${c.inputBorder}`,
                      borderRadius: "0 7px 7px 0",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: c.textMuted,
                        textTransform: "uppercase",
                      }}
                    >
                      {p?.strUOM ?? "—"}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box
                component="button"
                onClick={toggleSN}
                disabled={!value.qty || Number(value.qty) <= 0}
                sx={{
                  width: 78,
                  height: 32,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.3,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: value.showSN ? c.blueText : c.textMuted,
                  background: value.showSN ? c.blueBgSoft : c.cardBg,
                  border: `0.5px solid ${value.showSN ? c.blueBorder : c.inputBorder}`,
                  borderRadius: "7px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                }}
                title={
                  value.showSN ? "Hide serial numbers" : "Add serial numbers"
                }
              >
                {value.showSN ? "− SN" : "+ SN"}
              </Box>

              <Box
                component="input"
                type="text"
                value={value.receiptNo}
                placeholder="e.g. RR-2025-0001"
                onChange={(e) => setReceiptNo(e.target.value)}
                sx={{
                  flex: 1,
                  height: 32,
                  px: 0.9,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  border: `0.5px solid ${c.inputBorder}`,
                  borderRadius: "7px",
                  outline: "none",
                  background: c.inputBg,
                }}
              />
            </Box>
          </Box>

          {value.showSN && (
            <FormGrid
              fields={[
                {
                  name: "serials",
                  label: "Serial Numbers",
                  type: "serialNumber",
                  xs: 12,
                  placeholder: "Scan or type S/N and press Enter...",
                  maxItems: Number(value.qty) || 0,
                },
              ]}
              switches={[]}
              formData={{ serials: value.serials }}
              errors={{}}
              handleChange={(e) => {
                if (e.target.name === "serials") setSerials(e.target.value);
              }}
              autoFocus={false}
            />
          )}
        </Box>
      </Collapse>

      <Divider sx={{ borderColor: c.divider }} />
    </Box>
  );
}
// ── One item's row (header + collapsible DELIVER form) ─────────────────────
function ItemDeliverRow({
  idx,
  p,
  value,
  onChange,
  expanded,
  onToggleExpand,
  historyExpanded,
  onToggleHistoryExpand,
  batches,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
  availableQty = 0,
  deliveredQty = 0,
  deliveredMaxOverride = null,
  showEqBadge = false, // ← NEW
  statusLabel = "Status",
}) {
  const deliveredMax =
    deliveredMaxOverride != null
      ? deliveredMaxOverride
      : Math.max(0, availableQty - deliveredQty);
  const isSingle =
    !(deliveredQty >= availableQty) && availableQty > 0 && deliveredMax === 1;
  const undeliveredSerials = (p?.receivedSerialNumbers || []).filter(
    (sn) => !(p?.deliveredSerialNumbers || []).includes(sn),
  );
  const setQty = (qty) => onChange({ ...value, qty });
  const setReceiptNo = (receiptNo) => onChange({ ...value, receiptNo });
  const setSerials = (serials) => onChange({ ...value, serials });
  const toggleSN = () => onChange({ ...value, showSN: !value.showSN });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: c.btnBgDisabled,
              border: `0.5px solid ${c.inputBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inventory2Outlined
              sx={{ fontSize: "0.75rem", color: c.iconMuted }}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: -5,
              left: -5,
              minWidth: 13,
              height: 13,
              px: 0.25,
              borderRadius: "50px",
              background: c.textMuted,
              border: `1.5px solid ${c.cardBg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.4rem",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {idx + 1}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                  color: c.blueTextAlt,
                  lineHeight: 1,
                }}
              >
                {p?.transaction_item?.transaction?.strCode ?? "—"}
              </Typography>
            </Box>
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
              color: c.iconMuted,
              lineHeight: 1,
              mt: 0.15,
            }}
          >
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        {/* AVAILABLE TO DELIVER */}
        {(() => {
          const eqValue =
            Number(deliveredMax || 0) * Number(p?.dUnitPrice || 0);
          return (
            <Box sx={{ textAlign: "right", flexShrink: 0, px: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.5rem",
                  color: c.textMuted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {statusLabel}
              </Typography>
              <Box sx={{ textAlign: "right" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.5,
                    flexWrap: "nowrap",
                  }}
                >
                  {showEqBadge && (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 0.6,
                        py: 0.18,
                        borderRadius: "6px",
                        fontSize: "0.45rem",
                        fontWeight: 600,
                        color: c.blueText,
                        background: c.blueBgSoft,
                        border: `1px solid ${c.blueBorder}`,
                        whiteSpace: "nowrap",
                        lineHeight: 1.1,
                      }}
                    >
                      ₱ {fmtPHP(eqValue)}
                    </Box>
                  )}

                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: c.blueText,
                      lineHeight: 1.1,
                    }}
                  >
                    {deliveredMax}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.4rem",
                    color: c.textMuted,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    mt: 0.15,
                  }}
                >
                  {p?.strUOM ?? ""}
                </Typography>
              </Box>
            </Box>
          );
        })()}
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <Box
            component="button"
            onClick={onToggleHistoryExpand}
            sx={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "50px",
              background: historyExpanded ? c.blueBgSoft : "transparent",
              color: historyExpanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
              mr: 0.25,
            }}
            title={
              historyExpanded
                ? "Hide quantity history"
                : "Show quantity history"
            }
          >
            <HistoryOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>

          <Box
            component="button"
            onClick={onToggleExpand}
            sx={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "50px",
              background: expanded ? c.blueBgSoft : "transparent",
              color: expanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
            }}
            title={expanded ? "Hide deliver form" : "Show deliver form"}
          >
            <OutputOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>
        </Box>
      </Box>

      <Collapse in={historyExpanded}>
        <Box sx={{ pb: 1.25, pl: 0 }}>
          <Divider sx={{ borderColor: c.divider, mb: 1 }} />
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              mb: 0.75,
            }}
          >
            Logs
          </Typography>
          <BatchHistoryTable
            batches={batches}
            uom={p?.strUOM ?? ""}
            c={c}
            onToggleStatus={onToggleStatus}
            statusUpdatingId={statusUpdatingId}
            allowActions={allowActions}
            actionableWhenPending={actionableWhenPending}
            showStatus={showStatus}
            unitPrice={p?.dUnitPrice}
          />
        </Box>
      </Collapse>

      <Collapse in={expanded}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pb: 1.25,
            pl: 0,
          }}
        >
          <Divider sx={{ borderColor: c.divider }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Typography
                sx={{
                  flex: isSingle ? 1.4 : 1,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Quantity to Deliver
              </Typography>
              <Typography
                sx={{
                  width: 55,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Receipt No.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              {isSingle ? (
                <Box
                  component="button"
                  onClick={() => setQty(value.qty === "1" ? "" : "1")}
                  sx={{
                    flex: 1.4,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: value.qty === "1" ? "#fff" : c.blueText,
                    background: value.qty === "1" ? c.blueText : c.blueBgSoft,
                    border: `0.5px solid ${c.blueBorder}`,
                    borderRadius: "7px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <CheckCircleOutlined
                    sx={{ fontSize: "0.85rem", flexShrink: 0 }}
                  />
                  {value.qty === "1"
                    ? "1 Delivered"
                    : `Mark 1 ${p?.strUOM ?? ""}`}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flex: 1 }}>
                  <Box
                    component="input"
                    type="number"
                    min={0}
                    max={deliveredMax}
                    value={value.qty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= deliveredMax) setQty(e.target.value);
                    }}
                    sx={{
                      flex: 1,
                      height: 32,
                      px: 0.9,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: c.textPrimary,
                      border: `0.5px solid ${c.inputBorder}`,
                      borderRight: "none",
                      borderRadius: "7px 0 0 7px",
                      outline: "none",
                      background: c.inputBg,
                    }}
                  />
                  <Box
                    sx={{
                      height: 32,
                      px: 1,
                      display: "flex",
                      alignItems: "center",
                      background: c.btnBgDisabled,
                      border: `0.5px solid ${c.inputBorder}`,
                      borderRadius: "0 7px 7px 0",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: c.textMuted,
                        textTransform: "uppercase",
                      }}
                    >
                      {p?.strUOM ?? "—"}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box
                component="button"
                onClick={toggleSN}
                disabled={!value.qty || Number(value.qty) <= 0}
                sx={{
                  width: 78,
                  height: 32,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.3,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: value.showSN ? c.blueText : c.textMuted,
                  background: value.showSN ? c.blueBgSoft : c.cardBg,
                  border: `0.5px solid ${value.showSN ? c.blueBorder : c.inputBorder}`,
                  borderRadius: "7px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                }}
                title={
                  value.showSN ? "Hide serial numbers" : "Add serial numbers"
                }
              >
                {value.showSN ? "− SN" : "+ SN"}
              </Box>

              <Box
                component="input"
                type="text"
                value={value.receiptNo}
                placeholder="e.g. RN-00XXX"
                onChange={(e) => setReceiptNo(e.target.value)}
                sx={{
                  flex: 1,
                  height: 32,
                  px: 0.9,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  border: `0.5px solid ${c.inputBorder}`,
                  borderRadius: "7px",
                  outline: "none",
                  background: c.inputBg,
                }}
              />
            </Box>
          </Box>

          {value.showSN && (
            <FormGrid
              fields={[
                {
                  name: "serials",
                  label: "Serial Numbers",
                  type: "serialNumber",
                  xs: 12,
                  placeholder: "Scan or type S/N and press Enter...",
                  maxItems: Number(value.qty) || 0,
                  allowedValues: undeliveredSerials, // ← logic ref: UpdateDeliveredModal
                },
              ]}
              switches={[]}
              formData={{ serials: value.serials }}
              errors={{}}
              handleChange={(e) => {
                if (e.target.name === "serials") setSerials(e.target.value);
              }}
              autoFocus={false}
            />
          )}
        </Box>
      </Collapse>

      <Divider sx={{ borderColor: c.divider }} />
    </Box>
  );
}
function ItemsSection({ count, children, c }) {
  return (
    <Box
      sx={{
        borderRadius: "0 0 8px 8px",
        border: `0.5px solid ${c.cardBorder}`,
        borderTop: "none",
        background: c.cardBg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          minHeight: 375,
          maxHeight: 375,
          overflowY: "auto",
        }}
      >
        {count === 0 ? (
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: c.textFaint,
              py: 1.5,
              textAlign: "center",
            }}
          >
            No data available.
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}
const ExpandAllButton = ({ expanded, onClick, c, icon, expandedIcon }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.4,
      px: 1,
      py: 0.4,
      borderRadius: "6px",
      border: `0.5px solid ${c.inputBorder}`,
      background: "transparent",
      color: c.textMuted,
      fontSize: "0.62rem",
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0,
      whiteSpace: "nowrap",
      "&:hover": { background: c.rowHover },
    }}
  >
    {expanded ? (
      expandedIcon ? (
        <Box component={expandedIcon} sx={{ fontSize: "0.85rem" }} />
      ) : (
        <UnfoldLess sx={{ fontSize: "0.85rem" }} />
      )
    ) : (
      <Box component={icon} sx={{ fontSize: "0.85rem" }} />
    )}
    {expanded ? "Collapse All" : "Expand All"}
  </Box>
);

const TAB_OPTIONS = [
  { key: "TO_RECEIVE", label: "To Receive" },
  { key: "PENDING", label: "Pending JEV - Received" },
  { key: "RECEIVED", label: "Received" },
  { key: "FOR_DELIVERY", label: "For Delivery" },
  { key: "PENDING_DELIVERED", label: "Pending JEV - Delivered" },
  { key: "DELIVERED", label: "Delivered" },
];
// ── Tab bar now doubles as the active section's header — tabs on the left,
// an optional Expand All / Collapse All control (for the active section's
// item rows) on the right.
function SectionTabs({ active, onChange, counts, c, extraControl, hideExtra }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.75,
        p: 0.4,
        borderRadius: "10px 10px 0 0",
        border: `0.5px solid ${c.cardBorder}`,
        borderBottom: "none",
        background: c.rowBgDisabled,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {TAB_OPTIONS.map((tab) => {
          const isActive = active === tab.key;
          const count = counts[tab.key];
          return (
            <Box
              key={tab.key}
              component="button"
              onClick={() => onChange(tab.key)}
              sx={{
                flex: { xs: "1 0 auto", sm: "0 0 auto" },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.4,
                px: 1.25,
                py: 0.55,
                borderRadius: "4px",
                border: "none",
                background: isActive ? c.cardBg : "transparent",
                color: isActive ? c.blueText : c.textMuted,
                fontSize: "0.65rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: isActive ? `0 0 0 0.5px ${c.blueBorder}` : "none",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {count != null && (
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: isActive ? c.blueText : c.textFaint,
                    opacity: 0.85,
                  }}
                >
                  ({count})
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {extraControl && !hideExtra && (
        <Box sx={{ flexShrink: 0, pr: 0.4 }}>{extraControl}</Box>
      )}
    </Box>
  );
}
export default function ReceivePanel({
  options = [],
  patchOption,
  nPurchaseOrderId,
  currentUserId,
  forDeliveryKey,
  deliveredKey,
  pendingReceiptKey,
  onDone,
  onStateChange,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  const [creatingJev, setCreatingJev] = useState(false);
  const { jevPendingKey, isFinanceOfficer, isManagement } = useKeysLabels();

  const [jevToggling, setJevToggling] = useState(false);
  const [formByItem, setFormByItem] = useState({});
  const [expandedByItem, setExpandedByItem] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [allExpandedReceived, setAllExpandedReceived] = useState(false);
  const [allExpandedPending, setAllExpandedPending] = useState(false);
  const [activeTab, setActiveTab] = useState("TO_RECEIVE"); // "TO_RECEIVE" | "PENDING" | "RECEIVED"
  // Split batches by status
  const [approvedBatchesByItem, setApprovedBatchesByItem] = useState({});
  const [pendingBatchesByItem, setPendingBatchesByItem] = useState({});
  const [allBatchesByItem, setAllBatchesByItem] = useState({}); // full history, any cStatus — used for "To Receive" read-only view on the ALL tab
  const [historyExpandedByItem, setHistoryExpandedByItem] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deliverFormByItem, setDeliverFormByItem] = useState({});
  const [deliverExpandedByItem, setDeliverExpandedByItem] = useState({});
  const [allExpandedForDelivery, setAllExpandedForDelivery] = useState(false);
  const [allExpandedPendingDelivered, setAllExpandedPendingDelivered] =
    useState(false);
  const [allExpandedDelivered, setAllExpandedDelivered] = useState(false);

  const [approvedDeliveredBatchesByItem, setApprovedDeliveredBatchesByItem] =
    useState({});
  const [pendingDeliveredBatchesByItem, setPendingDeliveredBatchesByItem] =
    useState({});
  const [allDeliveredBatchesByItem, setAllDeliveredBatchesByItem] = useState(
    {},
  );
  const [jevView, setJevView] = useState(null); // { jevId, p, batches } | null
  const [jevData, setJevData] = useState(null);
  const [jevLoading, setJevLoading] = useState(false);
  const [jevError, setJevError] = useState("");
  const jevRows = (() => {
    const all = jevView?.batches || [];
    const linked = all.filter((b) => b.nJEVId === jevView?.jevId);
    return linked.length ? linked : all;
  })();
  const jevQty = jevRows.reduce((s, b) => s + (b.qty || 0), 0);
  const jevEqValue = jevQty * Number(jevView?.p?.dUnitPrice || 0);
  const jevBalance = useJevBalance(jevView?.jevId, jevEqValue);
  const canManageJev = isManagement || isFinanceOfficer;
  const jevIsPending = String(jevData?.cStatus) === String(jevPendingKey);
  const loadBatches = React.useCallback(async () => {
    const approved = {};
    const pending = {};
    const all = {};
    const deliveredApproved = {};
    const deliveredPending = {};
    const allDelivered = {};
    await Promise.all(
      options.map(async (o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id == null) return;
        try {
          const res = await InventoryAPI.getHistory(id);
          const rows = res?.rows || res?.inventory || [];
          const mapRow = (r) => ({
            nInventoryId: r.nInventoryId,
            receiptNumber: r.strReceiptNumber || null,
            qty: Math.abs(Number(r.nQuantity)) || 0,
            dtLog: r.dtLog,
            serialNumbers: r.serialNumbers || [],
            cStatus: String(r.cStatus || "").trim(),
            nJEVId: r.nJEVId ?? null,
          });
          const receivedRows = rows.filter((r) => Number(r.nQuantity) > 0);
          const deliveredRows = rows.filter((r) => Number(r.nQuantity) < 0);

          approved[id] = receivedRows
            .filter((r) => String(r.cStatus || "").trim() === "A")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          pending[id] = receivedRows
            .filter((r) => String(r.cStatus || "").trim() === "P")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          all[id] = receivedRows
            .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog))
            .map(mapRow);

          deliveredApproved[id] = deliveredRows
            .filter((r) => String(r.cStatus || "").trim() === "A")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          deliveredPending[id] = deliveredRows
            .filter((r) => String(r.cStatus || "").trim() === "P")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          allDelivered[id] = deliveredRows
            .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog))
            .map(mapRow);
        } catch (e) {
          approved[id] = [];
          pending[id] = [];
          all[id] = [];
          deliveredApproved[id] = [];
          deliveredPending[id] = [];
          allDelivered[id] = [];
        }
      }),
    );
    setApprovedBatchesByItem(approved);
    setPendingBatchesByItem(pending);
    setAllBatchesByItem(all);
    setApprovedDeliveredBatchesByItem(deliveredApproved);
    setPendingDeliveredBatchesByItem(deliveredPending);
    setAllDeliveredBatchesByItem(allDelivered);
  }, [options]);

  useEffect(() => {
    const initialForm = {};
    const initialExpanded = {};
    const initialDeliverForm = {};
    const initialDeliverExpanded = {};
    options.forEach((o) => {
      const id = o.purchase_option?.nPurchaseItemId;
      if (id != null) {
        initialForm[id] = {
          qty: "",
          receiptNo: "",
          serials: [],
          showSN: false,
        };
        initialExpanded[id] = false;
        initialDeliverForm[id] = {
          qty: "",
          receiptNo: "",
          serials: [],
          showSN: false,
        };
        initialDeliverExpanded[id] = false;
      }
    });
    setFormByItem(initialForm);
    setExpandedByItem(initialExpanded);
    setDeliverFormByItem(initialDeliverForm);
    setDeliverExpandedByItem(initialDeliverExpanded);
    setHistoryExpandedByItem({});
    setAllExpanded(false);
    setAllExpandedForDelivery(false);
    setError("");
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Re-fetch whenever an inventory row status changes elsewhere too
  useEffect(() => {
    const handler = () => loadBatches();
    window.addEventListener("inventory_data_updated", handler);
    return () => window.removeEventListener("inventory_data_updated", handler);
  }, [loadBatches]);
  const setItemValue = (id, value) =>
    setFormByItem((prev) => ({ ...prev, [id]: value }));

  const toggleExpand = (id) =>
    setExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleHistoryExpand = (id) =>
    setHistoryExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

  // Expand all — receive-form rows (To Receive, TO_RECEIVE tab)
  const toggleExpandAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpandedByItem((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllReceived = () => {
    const next = !allExpandedReceived;
    setAllExpandedReceived(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      receivedItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`r-${id}`] = next;
      });
      return updated;
    });
  };
  const toggleExpandAllPending = () => {
    const next = !allExpandedPending;
    setAllExpandedPending(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      pendingJevItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`p-${id}`] = next;
      });
      return updated;
    });
  };

  // Expand all — history rows in "To Receive" when tab is ALL
  const toggleExpandAllToReceiveHistory = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      toReceiveItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`t-${id}`] = next;
      });
      return updated;
    });
  };
  const setDeliverItemValue = (id, value) =>
    setDeliverFormByItem((prev) => ({ ...prev, [id]: value }));

  const toggleDeliverExpand = (id) =>
    setDeliverExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleExpandAllForDelivery = () => {
    const next = !allExpandedForDelivery;
    setAllExpandedForDelivery(next);
    setDeliverExpandedByItem((prev) => {
      const updated = { ...prev };
      forDeliveryItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[id] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllPendingDelivered = () => {
    const next = !allExpandedPendingDelivered;
    setAllExpandedPendingDelivered(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      pendingJevDeliveredItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`pd-${id}`] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllDelivered = () => {
    const next = !allExpandedDelivered;
    setAllExpandedDelivered(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      deliveredItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`dl-${id}`] = next;
      });
      return updated;
    });
  };
  // ── Approve/Cancel/Re-activate a batch row
  const toggleBatchStatus = async (id, batch, isDelivered = false) => {
    const newStatus = batch.cStatus === "C" ? "A" : "C";
    setStatusUpdatingId(batch.nInventoryId);
    try {
      await InventoryAPI.updateInventory(batch.nInventoryId, {
        cStatus: newStatus,
      });

      const option = options.find(
        (o) => o.purchase_option?.nPurchaseItemId === id,
      );
      const p = option?.purchase_option;
      const delta =
        (newStatus === "A" ? 1 : -1) * Math.abs(Number(batch.qty) || 0);
      const field = isDelivered ? "nDeliveredQty" : "nInventoryQty";
      patchOption?.(id, {
        [field]: Math.max(0, (p?.[field] || 0) + delta),
      });

      if (nPurchaseOrderId && currentUserId != null) {
        await PurchaseOrderAPI.syncStatus({
          nPurchaseOrderId,
          nPurchaseItemId: id,
          nUserId: currentUserId,
          nReceivedStatus: forDeliveryKey,
          nDeliveredStatus: deliveredKey,
          nPaidStatus: pendingReceiptKey,
        });
      }

      await loadBatches();
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    } catch (err) {
      console.error("Failed to update batch status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const itemsToSave = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    const v = formByItem[id];
    return v && v.qty !== "" && Number(v.qty) > 0 && v.receiptNo.trim() !== "";
  });

  const isFormValid = itemsToSave.length > 0;
  const fetchJev = async (id, silent = false) => {
    if (!silent) setJevLoading(true);
    try {
      const res = await JevAPI.getById(id);
      setJevData(res?.jev ?? res?.data ?? res ?? null);
    } catch (err) {
      console.error("Failed to load JEV:", err);
      if (!silent) setJevError("Failed to load JEV. Please try again.");
      else throw err;
    } finally {
      if (!silent) setJevLoading(false);
    }
  };

  const handleViewJev = (nJEVId, p, batches) => {
    setJevView({ jevId: nJEVId, p, batches });
    setJevData(null);
    setJevError("");
    fetchJev(nJEVId);
  };

  const handleBackFromJev = () => {
    setJevView(null);
    setJevData(null);
    setJevError("");
  };

  const handleToggleJevFinalize = async (action) => {
    if (!jevView || jevToggling) return;
    const id = jevView.jevId;
    const itemId = jevView.p?.nPurchaseItemId;
    const finalizing = action === "finalize_jev";
    setJevToggling(true);
    try {
      await withSpinner("JEV", async () => {
        await JevAPI.update(id, { cStatus: "toggle" });

        // Flip the quantity rows tied to this JEV: P -> A on finalize, A -> P on undo
        if (itemId != null) {
          const res = await InventoryAPI.getHistory(itemId);
          const rows = res?.rows || res?.inventory || [];
          const fromStatus = finalizing ? "P" : "A";
          const toStatus = finalizing ? "A" : "P";

          const linked = rows.filter(
            (r) =>
              String(r.nJEVId) === String(id) &&
              String(r.cStatus || "").trim() === fromStatus,
          );

          for (const r of linked) {
            await InventoryAPI.updateInventory(r.nInventoryId, {
              cStatus: toStatus,
            });
          }

          if (linked.length && nPurchaseOrderId && currentUserId != null) {
            await PurchaseOrderAPI.syncStatus({
              nPurchaseOrderId,
              nPurchaseItemId: itemId,
              nUserId: currentUserId,
              nReceivedStatus: forDeliveryKey,
              nDeliveredStatus: deliveredKey,
              nPaidStatus: pendingReceiptKey,
            });
          }
        }

        await fetchJev(id, true);
        await loadBatches();
      });
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      await showSwal(
        "SUCCESS",
        {},
        {
          entity: "JEV",
          action: finalizing ? "finalized" : "status updated",
        },
      );
    } catch (err) {
      console.error("Toggle JEV status failed:", err);
      await showSwal("ERROR", {}, { entity: "JEV" });
    } finally {
      setJevToggling(false);
    }
  };
  const handleSave = async () => {
    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const itemName =
        [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";
      const v = formByItem[id];
      const newReceived = Number(v.qty);
      const currentDelivered = p?.nDeliveredQty || 0;
      const projectedTotalReceived = (p?.nInventoryQty || 0) + newReceived;

      if (projectedTotalReceived < currentDelivered) {
        setError(
          `${itemName}: Total received (${projectedTotalReceived}) can't be less than Delivered (${currentDelivered}).`,
        );
        return;
      }
      if (v.serials.length > newReceived) {
        setError(
          `${[p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item"}: too many serial numbers for the quantity entered.`,
        );
        return;
      }
    }
    setError("");
    setSaving(true);

    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = formByItem[id];
      const newReceived = Number(v.qty);

      patchOption?.(id, {
        nInventoryQty: (p?.nInventoryQty || 0) + newReceived,
        receivedSerialNumbers: [
          ...(p?.receivedSerialNumbers || []),
          ...v.serials,
        ],
      });

      try {
        await withSpinner("Inventory", async () => {
          const res = await InventoryAPI.createInventory({
            nPurchaseItemId: id,
            nQuantity: newReceived,
            strReceiptNumber: v.receiptNo.trim() || null,
            cStatus: "P",
          });
          const newInventoryId = res.inventory?.nInventoryId ?? null;
          if (newInventoryId && v.serials.length > 0) {
            for (const sn of v.serials) {
              await SerialNumberAPI.createSerialNumber({
                nInventoryId: newInventoryId,
                strSerialNumber: sn,
              });
            }
          }
          if (nPurchaseOrderId && currentUserId != null) {
            await PurchaseOrderAPI.syncStatus({
              nPurchaseOrderId,
              nPurchaseItemId: id,
              nUserId: currentUserId,
              nReceivedStatus: forDeliveryKey,
              nDeliveredStatus: deliveredKey,
              nPaidStatus: pendingReceiptKey,
            });
          }
        });
      } catch (apiErr) {
        console.error("Failed to save received for item", id, apiErr);
      }
    }

    setSaving(false);
    window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    window.dispatchEvent(new CustomEvent("cart_data_updated"));
    await showSwal(
      "SUCCESS",
      {},
      { entity: `${itemsToSave.length} item(s) received`, action: "recorded" },
    );
    onDone?.();
  };
  const deliverItemsToSave = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    const v = deliverFormByItem[id];
    return v && v.qty !== "" && Number(v.qty) > 0 && v.receiptNo.trim() !== "";
  });

  const isDeliverFormValid = deliverItemsToSave.length > 0;
  const handleSaveDelivered = async () => {
    for (const o of deliverItemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = deliverFormByItem[id];
      const newDelivered = Number(v.qty);
      const deliveredMax = getRemainingToDeliverQty(id); // ← fixed: accounts for pending too
      const itemName =
        [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

      if (newDelivered > deliveredMax) {
        setError(
          `${itemName}: Delivered can't exceed available quantity (${deliveredMax}).`,
        );
        return;
      }
      if (v.serials.length > newDelivered) {
        setError(
          `${itemName}: too many serial numbers for the quantity entered.`,
        );
        return;
      }
      const undeliveredSerials = (p?.receivedSerialNumbers || []).filter(
        (sn) => !(p?.deliveredSerialNumbers || []).includes(sn),
      );
      const requiredSerials = Math.min(newDelivered, undeliveredSerials.length);
      if (requiredSerials > 0 && v.serials.length < requiredSerials) {
        setError(
          `${itemName}: please add ${requiredSerials} serial number(s) to match the delivered quantity.`,
        );
        return;
      }
    }
    setError("");
    setSaving(true);

    for (const o of deliverItemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = deliverFormByItem[id];
      const newDelivered = Number(v.qty);

      patchOption?.(id, {
        nDeliveredQty: (p?.nDeliveredQty || 0) + newDelivered,
        deliveredSerialNumbers: [
          ...(p?.deliveredSerialNumbers || []),
          ...v.serials,
        ],
      });

      try {
        await withSpinner("Inventory", async () => {
          const res = await InventoryAPI.createInventory({
            nPurchaseItemId: id,
            nQuantity: -newDelivered,
            strReceiptNumber: v.receiptNo.trim() || null,
            cStatus: "P",
          });
          const newInventoryId = res.inventory?.nInventoryId ?? null;
          if (newInventoryId && v.serials.length > 0) {
            for (const sn of v.serials) {
              await SerialNumberAPI.createSerialNumber({
                nInventoryId: newInventoryId,
                strSerialNumber: sn,
              });
            }
          }
          if (nPurchaseOrderId && currentUserId != null) {
            await PurchaseOrderAPI.syncStatus({
              nPurchaseOrderId,
              nPurchaseItemId: id,
              nUserId: currentUserId,
              nReceivedStatus: forDeliveryKey,
              nDeliveredStatus: deliveredKey,
              nPaidStatus: pendingReceiptKey,
            });
          }
        });
      } catch (apiErr) {
        console.error("Failed to save delivered for item", id, apiErr);
      }
    }

    setSaving(false);
    window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    window.dispatchEvent(new CustomEvent("cart_data_updated"));
    await showSwal(
      "SUCCESS",
      {},
      {
        entity: `${deliverItemsToSave.length} item(s) delivered`,
        action: "recorded",
      },
    );
    onDone?.();
  };
  // ── Sections ─────────────────────────────────────────────────
  // Pending JEV (received) — has at least one PENDING (cStatus = P) received batch

  const pendingJevItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (pendingBatchesByItem[id] || []).length > 0;
  });

  // Pending items (received) that don't have a JEV linked to any of their pending batches yet
  const pendingJevItemsWithoutJev = pendingJevItems.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return !(pendingBatchesByItem[id] || []).some((b) => b.nJEVId);
  });

  const isCreateJevValid = pendingJevItemsWithoutJev.length > 0;

  const handleCreateJev = async () => {
    setCreatingJev(true);
    try {
      for (const o of pendingJevItemsWithoutJev) {
        const id = o.purchase_option?.nPurchaseItemId;
        try {
          await InventoryAPI.createJevForPending(id);
        } catch (err) {
          console.error("Failed to create JEV for item", id, err);
        }
      }
      await loadBatches();
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    } catch (err) {
      console.error("Failed to create JEV:", err);
      setError("Failed to create JEV. Please try again.");
    } finally {
      setCreatingJev(false);
    }
  };
  // Received — has at least one APPROVED or PENDING received batch.
  // Include pending-only items so the tab can show e.g. 0 (30 Pend) / 70.
  const receivedItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (
      (approvedBatchesByItem[id] || []).length > 0 ||
      (pendingBatchesByItem[id] || []).length > 0
    );
  });
  // To Receive — still needs receiving (partial or not started)
  const toReceiveItems = options.filter((o) => {
    const p = o.purchase_option;
    return Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0)) > 0;
  });
  // ── Progress-quantity helpers ──
  const getApprovedReceivedQty = (id) =>
    (approvedBatchesByItem[id] || []).reduce((sum, b) => sum + (b.qty || 0), 0);

  const getPendingReceivedQty = (id) =>
    (pendingBatchesByItem[id] || []).reduce((sum, b) => sum + (b.qty || 0), 0);

  const getApprovedDeliveredQty = (id) =>
    (approvedDeliveredBatchesByItem[id] || []).reduce(
      (sum, b) => sum + (b.qty || 0),
      0,
    );

  // Pending delivery rows also "claim" quantity — they're awaiting JEV approval,
  // but the qty is no longer free to deliver again.
  const getPendingDeliveredQty = (id) =>
    (pendingDeliveredBatchesByItem[id] || []).reduce(
      (sum, b) => sum + (b.qty || 0),
      0,
    );

  // What's actually still free to deliver = approved received − (approved delivered + pending delivered)
  const getRemainingToDeliverQty = (id) =>
    Math.max(
      0,
      getApprovedReceivedQty(id) -
        getApprovedDeliveredQty(id) -
        getPendingDeliveredQty(id),
    );

  // For Delivery — only items that still have something un-claimed to deliver
  const forDeliveryItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    if (id == null) return false;
    return getRemainingToDeliverQty(id) > 0;
  });
  // Pending JEV (delivered) — has at least one PENDING (cStatus = P) delivered batch
  const pendingJevDeliveredItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (pendingDeliveredBatchesByItem[id] || []).length > 0;
  });
  // Delivered — has at least one APPROVED or PENDING delivered batch.
  // Include pending-only items so the tab can show e.g. 0 (30 Pend) / 70.
  const deliveredItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (
      (approvedDeliveredBatchesByItem[id] || []).length > 0 ||
      (pendingDeliveredBatchesByItem[id] || []).length > 0
    );
  });
  useEffect(() => {
    if (jevView) {
      onStateChange?.({
        label: null,
        onConfirm: null,
        canConfirm: false,
        saving: false,
        jevOpen: true,
        onJevBack: handleBackFromJev,
        jevAction:
          canManageJev && jevData && !jevLoading
            ? {
                kind: jevIsPending ? "finalize" : "undo",
                label: jevIsPending ? "Finalize" : "Undo Finalize",
                tooltip: jevBalance.loading
                  ? "Checking JEV balance…"
                  : jevIsPending && !jevBalance.balanced
                    ? jevBalance.message ||
                      "JEV totals must be equal before finalizing"
                    : jevIsPending
                      ? "Finalize this JEV"
                      : "Undo Finalize this JEV",
                disabled:
                  jevToggling ||
                  jevBalance.loading ||
                  (jevIsPending && !jevBalance.balanced),
                onClick: () =>
                  handleToggleJevFinalize(
                    jevIsPending ? "finalize_jev" : "undo_finalize_jev",
                  ),
              }
            : null,
      });
      return;
    }
    if (activeTab === "TO_RECEIVE") {
      onStateChange?.({
        label: "Confirm Received",
        onConfirm: handleSave,
        canConfirm: isFormValid,
        saving,
      });
    } else if (activeTab === "FOR_DELIVERY") {
      onStateChange?.({
        label: "Confirm Delivered",
        onConfirm: handleSaveDelivered,
        canConfirm: isDeliverFormValid,
        saving,
      });
    } else if (activeTab === "PENDING") {
      onStateChange?.({
        label: "Create JEV",
        onConfirm: handleCreateJev,
        canConfirm: isCreateJevValid,
        saving: creatingJev,
      });
    } else {
      onStateChange?.({
        label: null,
        onConfirm: null,
        canConfirm: false,
        saving: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jevView,
    jevData,
    jevLoading,
    jevToggling,
    jevIsPending,
    canManageJev,
    jevBalance.loading,
    jevBalance.balanced,
    jevBalance.message,
    activeTab,
    isFormValid,
    isDeliverFormValid,
    isCreateJevValid,
    saving,
    creatingJev,
    formByItem,
    deliverFormByItem,
  ]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <SectionTabs
          hideExtra={!!jevView}
          active={activeTab}
          onChange={(key) => {
            if (jevView) handleBackFromJev();
            setActiveTab(key);
          }}
          counts={{
            TO_RECEIVE: toReceiveItems.length,
            PENDING: pendingJevItems.length,
            RECEIVED: receivedItems.length,
            FOR_DELIVERY: forDeliveryItems.length,
            PENDING_DELIVERED: pendingJevDeliveredItems.length,
            DELIVERED: deliveredItems.length,
          }}
          c={c}
          extraControl={
            activeTab === "DELIVERED" && deliveredItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedDelivered}
                onClick={toggleExpandAllDelivered}
                c={c}
                icon={OutputOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "PENDING_DELIVERED" &&
              pendingJevDeliveredItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedPendingDelivered}
                onClick={toggleExpandAllPendingDelivered}
                c={c}
              />
            ) : activeTab === "FOR_DELIVERY" && forDeliveryItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedForDelivery}
                onClick={toggleExpandAllForDelivery}
                c={c}
                icon={OutputOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "RECEIVED" && receivedItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedReceived}
                onClick={toggleExpandAllReceived}
                c={c}
                icon={MoveToInboxOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "PENDING" && pendingJevItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedPending}
                onClick={toggleExpandAllPending}
                c={c}
                icon={MoveToInboxOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "TO_RECEIVE" && toReceiveItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpanded}
                onClick={toggleExpandAll}
                c={c}
                icon={MoveToInboxOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : null
          }
        />
        {jevView && (
          <ItemsSection count={1} c={c}>
            <JevView
              c={c}
              p={jevView.p}
              jevId={jevView.jevId}
              qty={jevQty}
              eqValue={jevEqValue}
              jev={jevData}
              loading={jevLoading}
              error={jevError}
              jevPendingKey={jevPendingKey}
              isFinanceOfficer={isFinanceOfficer}
              isManagement={isManagement}
              balance={jevBalance}
            />
          </ItemsSection>
        )}

        <Box sx={{ display: jevView ? "none" : "block" }}>
          {activeTab === "RECEIVED" && (
            <ItemsSection count={receivedItems.length} c={c}>
              {receivedItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "RECEIVED").label
                    }
                    showReceivedProgress
                    showEqBadge
                    approvedProgressQty={getApprovedReceivedQty(id)}
                    pendingProgressQty={getPendingReceivedQty(id)}
                    batches={allBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`r-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`r-${id}`)}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, false)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    onViewJev={handleViewJev}
                  />
                );
              })}
            </ItemsSection>
          )}

          {activeTab === "PENDING_DELIVERED" && (
            <ItemsSection count={pendingJevDeliveredItems.length} c={c}>
              {pendingJevDeliveredItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "PENDING_DELIVERED")
                        .label
                    }
                    showEqBadge
                    batches={pendingDeliveredBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`pd-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`pd-${id}`)}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, true)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    actionableWhenPending
                    onViewJev={handleViewJev}
                  />
                );
              })}
            </ItemsSection>
          )}
          {activeTab === "FOR_DELIVERY" && (
            <ItemsSection count={forDeliveryItems.length} c={c}>
              {forDeliveryItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;

                const value = deliverFormByItem[id] || {
                  qty: "",
                  receiptNo: "",
                  serials: [],
                  showSN: false,
                };
                return (
                  <ItemDeliverRow
                    key={id}
                    idx={idx}
                    p={p}
                    value={value}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "FOR_DELIVERY").label
                    }
                    showEqBadge
                    onChange={(v) => setDeliverItemValue(id, v)}
                    expanded={!!deliverExpandedByItem[id]}
                    onToggleExpand={() => toggleDeliverExpand(id)}
                    historyExpanded={!!historyExpandedByItem[`fd-${id}`]}
                    onToggleHistoryExpand={() =>
                      toggleHistoryExpand(`fd-${id}`)
                    }
                    batches={allDeliveredBatchesByItem[id] || []}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, true)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    showStatus
                    availableQty={getApprovedReceivedQty(id)}
                    deliveredQty={
                      getApprovedDeliveredQty(id) + getPendingDeliveredQty(id)
                    }
                    deliveredMaxOverride={getRemainingToDeliverQty(id)}
                  />
                );
              })}
            </ItemsSection>
          )}
          {activeTab === "PENDING" && (
            <ItemsSection count={pendingJevItems.length} c={c}>
              {pendingJevItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "PENDING").label
                    }
                    showEqBadge
                    batches={pendingBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`p-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`p-${id}`)}
                    c={c}
                    onToggleStatus={(batch) => toggleBatchStatus(id, batch)}
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    actionableWhenPending
                    onViewJev={handleViewJev}
                  />
                );
              })}
            </ItemsSection>
          )}

          {activeTab === "TO_RECEIVE" && (
            <ItemsSection count={toReceiveItems.length} c={c}>
              {toReceiveItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;

                const value = formByItem[id] || {
                  qty: "",
                  receiptNo: "",
                  serials: [],
                  showSN: false,
                };
                return (
                  <ItemReceiveRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "TO_RECEIVE").label
                    }
                    value={value}
                    onChange={(v) => setItemValue(id, v)}
                    expanded={!!expandedByItem[id]}
                    onToggleExpand={() => toggleExpand(id)}
                    historyExpanded={!!historyExpandedByItem[id]}
                    onToggleHistoryExpand={() => toggleHistoryExpand(id)}
                    batches={allBatchesByItem[id] || []}
                    c={c}
                    onToggleStatus={(batch) => toggleBatchStatus(id, batch)}
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    showStatus
                  />
                );
              })}
            </ItemsSection>
          )}
          {activeTab === "DELIVERED" && (
            <ItemsSection count={deliveredItems.length} c={c}>
              {deliveredItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "DELIVERED").label
                    }
                    showDeliveredProgress
                    showEqBadge
                    approvedProgressQty={getApprovedDeliveredQty(id)}
                    pendingProgressQty={getPendingDeliveredQty(id)}
                    batches={allDeliveredBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`dl-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`dl-${id}`)}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, true)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    onViewJev={handleViewJev}
                  />
                );
              })}
            </ItemsSection>
          )}
        </Box>
      </Box>

      {error && (
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: c.errorText,
            p: 1,
            background: c.errorBg,
            borderRadius: "6px",
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
