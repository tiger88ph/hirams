import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ReceiptLongOutlined,
  StoreOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTimeOutlined,
  CancelOutlined,
  Visibility,
} from "@mui/icons-material";

import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import { fmtDate, fmtPHP } from "../../../../../utils/formatters/formatter.js";
import { CART_STATUS_STYLES } from "../../../../../utils/style/sharedConfirmStyles.jsx";
import CartRowPanel from "./CartRowPanel";
import { BadgeCycler } from "./Stamp.jsx";
import {
  getOptionArrival,
  getPoArrival,
  getArrivalBadges,
} from "../../../../../utils/helpers/purchaseProgress.js";
const getColor = (colors, path) =>
  path.split(".").reduce((obj, key) => obj?.[key], colors);

const useColors = (c) => ({
  border: c.slate.border,
  borderRow: c.slate.borderRow,
  bgCard: c.slate.outerBg,
  itemHeaderBg: c.slate.itemHeaderBg,
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textHeading: c.gray.textHeading,
  slateMutedColor: c.slate.mutedColor,
  orangeText: c.orange.text,
  blueText: c.blue.text,
  blueBg: c.blue.bg,
  blueBorder: c.blue.border,
  blueTextStrong: c.blue.textStrong,
  greenText: c.green.text,
  redText: c.red.text,
  redBg: c.red.bg,
  redBorder: c.red.border,
  hoverBg: c.slate.hover,
  btnBg: c.slate.btnBg,
  btnBorder: c.slate.btnBorder,
  btnHoverBg: c.slate.btnHoverBg,
  scrollbarThumb: c.slate.scrollbarThumb,
});

export default function CartCardPanel({
  po,
  cartStatus,
  cartKey,
  forApprovalKey,
  forPaymentKey,
  pendingReceiptKey,
  forDeliveryKey,
  deliveredKey,
  cancelledPOKey,
  removedFromCartKey,
  currentUserId,
  onUpdateClick,
  collapsed,
  onRemoved,
  voucherStatus,
  voucherActiveKey,
  voucherClosedKey,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const cardShadow = isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)";
  const innerShadowColor = isDark
    ? "rgba(15,23,42,0.4)"
    : "rgba(255,255,255,0.7)";

  const stamps = Object.fromEntries(
    Object.entries(CART_STATUS_STYLES).map(([key, val]) => [
      key,
      {
        label: val.label,
        color: getColor(base, val.colorKey),
        bg: getColor(base, val.bgKey),
        border: getColor(base, val.borderKey),
        inner: innerShadowColor,
      },
    ]),
  );

  const [open, setOpen] = useState(!collapsed);
  const [removingOptionId, setRemovingOptionId] = useState(null);
  const [inventoryRows, setInventoryRows] = useState({});

  useEffect(() => {
    setOpen(!collapsed);
  }, [collapsed]);

  const options = po.purchase_order_options || [];
  const hasAnyEWT = options.some((o) => o.purchase_option?.dEWT > 0);

  // ── Load inventory rows so approved (A) and pending (P) can be split ──
  useEffect(() => {
    const ids = (po.purchase_order_options || [])
      .map((o) => o.purchase_option)
      .filter((p) => (p?.nInventoryQty || 0) > 0 || (p?.nDeliveredQty || 0) > 0)
      .map((p) => p.nPurchaseItemId)
      .filter(Boolean);
    if (!ids.length) return;

    let active = true;
    const load = async () => {
      const results = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await InventoryAPI.getHistory(id);
            results[id] = res?.rows || res?.inventory || [];
          } catch {
            results[id] = [];
          }
        }),
      );
      if (active) setInventoryRows(results);
    };
    load();
    window.addEventListener("inventory_data_updated", load);
    return () => {
      active = false;
      window.removeEventListener("inventory_data_updated", load);
    };
  }, [po]);

  const statsFor = (p) => {
    const rows = inventoryRows[p?.nPurchaseItemId];
    if (!rows) return null; // not loaded yet
    const a = getOptionArrival(p, rows);
    return {
      totalQty: a.ordered,
      approvedRcvd: a.approvedReceived,
      pendingRcvd: a.pendingReceived,
      approvedDlvd: a.approvedDelivered,
      pendingDlvd: a.pendingDelivered,
    };
  };
  const stampConfig = (() => {
    const status = String(po.nStatus ?? "");

    if (status === String(cancelledPOKey))
      return { type: "single", ...stamps.VOID };

    // ✅ RCVD / DLVRD percentage badges
    const arrival = getPoArrival(options, inventoryRows);
    const badges = getArrivalBadges(arrival).map(({ type, pct }) => ({
      ...stamps[type],
      pct,
    }));
    if (badges.length > 0) return { type: "multi", badges };

    const stepOrder = [
      { key: cartKey, stamp: stamps.CART },
      { key: forApprovalKey, stamp: stamps.PO },
      { key: forPaymentKey, stamp: stamps.PENDING },
      { key: pendingReceiptKey, stamp: stamps.PAID },
      { key: forDeliveryKey, stamp: stamps.RCVD },
      { key: deliveredKey, stamp: stamps.DLVRD },
    ];
    for (const { key, stamp } of stepOrder)
      if (status === String(key)) return { type: "single", ...stamp };
    return null;
  })();
  const total = options.reduce(
    (s, o) =>
      s +
      (o.purchase_option?.nQuantity || 0) *
        (o.purchase_option?.dUnitPrice || 0),
    0,
  );
  const poEwtTotal = options.reduce(
    (s, o) => s + (Number(o.purchase_option?.dEWT) || 0),
    0,
  );
  const statusLabel = cartStatus?.[po.cStatus] ?? po.cStatus;
  const firstOpt = options[0];
  const primarySupplier =
    firstOpt?.purchase_option?.supplier?.strSupplierNickName ?? "—";
  const companyName =
    firstOpt?.purchase_option?.transaction_item?.transaction?.company
      ?.strCompanyNickName ?? "—";
  const aoUser = firstOpt?.purchase_option?.transaction_item?.transaction?.user;
  const assignedAOName = aoUser ? `${aoUser.strNickName}`.trim() : "—";

  const showVoucherBadge =
    voucherStatus &&
    (String(voucherStatus) === String(voucherActiveKey) ||
      String(voucherStatus) === String(voucherClosedKey)) &&
    String(po.nStatus) === String(forApprovalKey);
  const poIsPaidRcvdDvrd = (() => {
    const isPaidOrLater = [pendingReceiptKey, forDeliveryKey, deliveredKey]
      .map(String)
      .includes(String(po.nStatus));
    const hasReceivedOrDelivered = options.some((o) => {
      const p = o.purchase_option;
      const ordered = p?.nQuantity || 0;
      const received = Math.min(p?.nInventoryQty || 0, ordered);
      const delivered = Math.min(p?.nDeliveredQty || 0, ordered);
      return received > 0 || delivered > 0;
    });
    return isPaidOrLater || hasReceivedOrDelivered;
  })();
  const handleRemoveOption = async (nPurchaseItemId) => {
    setRemovingOptionId(nPurchaseItemId);
    try {
      await PurchaseOrderAPI.removeFromCart({
        nPurchaseItemId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement: true,
      });
      await onRemoved?.();
      window.dispatchEvent(new CustomEvent("cart_data_updated"));
    } catch (err) {
      console.error("Remove failed:", err);
    } finally {
      setRemovingOptionId(null);
    }
  };

  return (
    <Box
      sx={{
        border: `0.5px solid ${c.border}`,
        borderRadius: 2,
        overflow: "hidden",
        background: c.bgCard,
        width: "100%",
        boxShadow: `0 1px ${isDark ? "4px" : "3px"} ${cardShadow}`,
      }}
    >
      {/* Header */}
      {[false, true].map((sm) => (
        <Box
          key={sm ? "sm" : "xs"}
          sx={{
            display: sm
              ? { xs: "none", sm: "flex" }
              : { xs: "flex", sm: "none" },
            alignItems: "center",
            gap: sm ? 1 : 0.75,
            px: sm ? 1.5 : 1,
            py: 1,
            background: c.itemHeaderBg,
            borderBottom: open ? `0.5px solid ${c.border}` : "none",
          }}
        >
          <BadgeCycler
            showVoucher={showVoucherBadge}
            isVoucherActive={String(voucherStatus) === String(voucherActiveKey)}
            stampConfig={stampConfig}
            sm={sm}
            c={c}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: sm ? 0.35 : 0.25,
                ml: 0.3,
              }}
            >
              <StoreOutlined
                sx={{
                  fontSize: sm ? "0.9rem" : "0.75rem",
                  color: c.textSecondary,
                }}
              />
              <Typography
                sx={{
                  fontSize: sm ? "0.65rem" : "0.55rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1,
                }}
              >
                {primarySupplier}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: sm ? 0.5 : 0.4,
                }}
              >
                {[{ text: companyName }].map(({ text }, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: sm ? 0.3 : 0.25,
                      px: sm ? 0.6 : 0.5,
                      py: sm ? 0.15 : 0.1,
                      borderRadius: "50px",
                      background: c.mutedBg,
                      border: `0.5px solid ${c.mutedBorder}`,
                      flexShrink: i === 0 ? 0 : 1,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: sm ? "0.55rem" : "0.5rem",
                        fontWeight: 600,
                        color: c.textSecondary,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: sm ? 0.5 : 0.4,
              }}
            >
              {[
                {
                  icon: (
                    <ReceiptLongOutlined
                      sx={{
                        fontSize: sm ? "0.8rem" : "0.6rem",
                        color: c.textSecondary,
                        flexShrink: 0,
                      }}
                    />
                  ),
                  text: `${po.strPurchaseOrderNo} - ${assignedAOName}`,
                },
              ].map(({ icon, text }, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: sm ? 0.3 : 0.25,
                    px: sm ? 0.6 : 0.5,
                    py: sm ? 0.15 : 0.1,
                    borderRadius: "50px",
                    background: c.mutedBg,
                    border: `0.5px solid ${c.mutedBorder}`,
                    flexShrink: i === 0 ? 0 : 1,
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {icon}
                  <Typography
                    sx={{
                      fontSize: sm ? "0.55rem" : "0.5rem",
                      fontWeight: 600,
                      color: c.textSecondary,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {!poIsPaidRcvdDvrd && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                mr: sm ? 1 : 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: sm ? "0.72rem" : "0.65rem",
                  fontWeight: 800,
                  color: c.orangeText,
                  textAlign: "right",
                  lineHeight: 1.2,
                }}
              >
                {fmtPHP(total)}
              </Typography>
              <Typography
                sx={{
                  fontSize: sm ? "0.52rem" : "0.48rem",
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: c.textSecondary,
                  textAlign: "right",
                  lineHeight: 1.2,
                }}
              >
                {poEwtTotal > 0 ? `EWT: ${fmtPHP(poEwtTotal)}` : "No EWT"}
              </Typography>
            </Box>
          )}

          <Box sx={{ position: "relative", flexShrink: 0 }}>
            {!open && (
              <Box
                sx={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  minWidth: sm ? 14 : 13,
                  height: sm ? 14 : 13,
                  borderRadius: "50px",
                  background: c.textSecondary,
                  border: `1.5px solid ${c.itemHeaderBg}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: sm ? "0.45rem" : "0.42rem",
                    fontWeight: 700,
                    color: c.bgCard,
                    lineHeight: 1,
                  }}
                >
                  {options.length}
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={() => setOpen((v) => !v)}
              sx={{
                width: sm ? 22 : 20,
                height: sm ? 22 : 20,
                borderRadius: "50px",
                border: `0.5px solid ${c.border}`,
                color: c.textSecondary,
                "&:hover": { background: c.hoverBg },
                p: 0,
              }}
            >
              {open ? (
                <KeyboardArrowUp sx={{ fontSize: sm ? "0.9rem" : "0.85rem" }} />
              ) : (
                <KeyboardArrowDown
                  sx={{ fontSize: sm ? "0.9rem" : "0.85rem" }}
                />
              )}
            </IconButton>
          </Box>
        </Box>
      ))}

      {/* Expanded Content — ROWS */}
      {open && (
        <>
          <Box
            sx={{
              maxHeight: "20vh",
              overflowY: "auto",
              overflowX: "hidden",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": {
                background: c.scrollbarThumb,
                borderRadius: 2,
              },
            }}
          >
            {options.map((opt, idx) => (
              <CartRowPanel
                key={opt.nPurchaseOrder_ItemId}
                opt={opt}
                idx={idx}
                totalCount={options.length}
                colors={base}
                isRemoving={
                  removingOptionId === opt.purchase_option?.nPurchaseItemId
                }
                showRemove={String(po.nStatus) === String(cartKey)}
                onRemove={handleRemoveOption}
                removingOptionId={removingOptionId}
                hasAnyEWT={hasAnyEWT}
                poIsPaidRcvdDvrd={poIsPaidRcvdDvrd}
                arrivedStats={
                  poIsPaidRcvdDvrd ? statsFor(opt.purchase_option) : null
                }
              />
            ))}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              borderTop: `0.5px solid ${c.border}`,
              background: c.itemHeaderBg,
              px: 1.5,
              py: 0.875,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <AccessTimeOutlined
                  sx={{ fontSize: "0.6rem", color: c.slateMutedColor }}
                />
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    color: c.slateMutedColor,
                    lineHeight: 1,
                  }}
                >
                  {fmtDate(po.dtPurchaseOrderCreated)}
                </Typography>
              </Box>
            </Box>

            {String(po.nStatus) === String(cancelledPOKey) ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: c.redBg,
                  border: `0.5px solid ${c.redBorder}`,
                  color: c.redText,
                  borderRadius: "50px",
                  px: 1,
                  py: 0.25,
                }}
              >
                <CancelOutlined sx={{ fontSize: "0.65rem" }} />
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 600 }}>
                  Cancelled
                </Typography>
              </Box>
            ) : (
              <Box
                onClick={() => onUpdateClick({ po, statusLabel })}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: { xs: 0, sm: 0.4 },
                  px: { xs: 0.6, sm: 1 },
                  py: 0.4,
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: c.btnBg,
                  border: `1px solid ${c.btnBorder}`,
                  "&:hover": { background: c.btnHoverBg },
                }}
              >
                <Visibility sx={{ fontSize: "0.65rem", color: c.blueText }} />
                <Typography
                  sx={{
                    display: { xs: "none", sm: "inline" },
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: c.blueText,
                    letterSpacing: "0.04em",
                  }}
                >
                  VIEW
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
