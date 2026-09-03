import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import {
  ReceiptLongOutlined,
  StoreOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTimeOutlined,
  CancelOutlined,
  Visibility,
  ShoppingCart,
} from "@mui/icons-material";

import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import { fmtDate, fmtPHP } from "../../../../../utils/formatters/formatter.js";
import { CART_STATUS_STYLES } from "../../../../../utils/style/sharedConfirmStyles.jsx";
import CartRowPanel from "./CartRowPanel";

const getColor = (colors, path) =>
  path.split(".").reduce((obj, key) => obj?.[key], colors);
const getBadgeSize = (sm) => (sm ? 24 : 22);

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

function StampIcon({ config, sm, c }) {
  const size = getBadgeSize(sm);
  const iconSize = sm ? "0.9rem" : "0.8rem";
  const fontSize = sm ? "0.45rem" : "0.4rem";
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  useEffect(() => {
    if (!config || config.type !== "multi") return;
    const badges = config.badges;
    if (!badges || badges.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBadgeIndex((prev) => (prev + 1) % badges.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [config]);

  if (!config)
    return (
      <Skeleton
        variant="circular"
        width={size}
        height={size}
        sx={{ flexShrink: 0, bgcolor: c.borderRow }}
      />
    );

  if (config.type === "multi") {
    const visibleBadge = config.badges[currentBadgeIndex];
    return (
      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <SingleStampBadge
          badge={visibleBadge}
          sm={sm}
          size={size}
          fontSize={fontSize}
        />
      </Box>
    );
  }

  if (config.label === "CART") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `2px solid ${config.color}`,
          outline: `1px solid ${config.color}`,
          outlineOffset: "2px",
          boxShadow: `0 0 0 1px ${config.inner}`,
          backgroundColor: config.bg,
        }}
      >
        <ShoppingCart sx={{ fontSize: iconSize, color: config.color }} />
      </Box>
    );
  }

  return (
    <SingleStampBadge badge={config} sm={sm} size={size} fontSize={fontSize} />
  );
}

function BadgeCycler({ showVoucher, isVoucherActive, stampConfig, sm, c }) {
  const slots = [];
  if (showVoucher) slots.push("voucher");
  slots.push("stamp");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (slots.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slots.length);
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVoucher]);

  const current = slots[index % slots.length];
  const containerSize = getBadgeSize(sm);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: containerSize,
        height: containerSize,
      }}
    >
      {current === "voucher" ? (
        <VoucherBadge isActive={isVoucherActive} sm={sm} c={c} />
      ) : (
        <StampIcon config={stampConfig} sm={sm} c={c} />
      )}
    </Box>
  );
}

function SingleStampBadge({ badge, sm, size, fontSize }) {
  const pctFontSize = sm ? "0.42rem" : "0.38rem";
  const lblFontSize = sm ? "0.33rem" : "0.30rem";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `2px solid ${badge.border}`,
        outline: `1px solid ${badge.border}`,
        outlineOffset: "2px",
        boxShadow: `0 0 0 1px ${badge.inner}`,
        backgroundColor: badge.bg,
      }}
    >
      {badge.pct != null ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "rotate(-12deg)",
            gap: "1px",
          }}
        >
          <Box
            sx={{
              fontSize: pctFontSize,
              fontWeight: 900,
              color: badge.color,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {badge.pct}%
          </Box>
          <Box
            sx={{
              fontSize: lblFontSize,
              fontWeight: 800,
              color: badge.color,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {badge.label}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            fontSize,
            fontWeight: 900,
            color: badge.color,
            backgroundColor: badge.bg,
            border: `2px solid ${badge.border}`,
            borderRadius: "4px",
            px: sm ? 0.4 : 0.3,
            py: sm ? 0.2 : 0.15,
            lineHeight: 1.3,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transform: "rotate(-15deg)",
            boxShadow: `inset 0 0 0 1px ${badge.inner}`,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {badge.label}
        </Box>
      )}
    </Box>
  );
}

function VoucherBadge({ isActive, sm, c }) {
  const color = isActive ? c.blueText : c.greenText;
  const size = getBadgeSize(sm);
  const iconSize = sm ? "1rem" : "0.9rem";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        gap: 0,
      }}
    >
      <ReceiptLongOutlined sx={{ fontSize: iconSize, color }} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 0.8,
        }}
      >
        <Box
          sx={{
            fontSize: sm ? "0.32rem" : "0.30rem",
            fontWeight: 800,
            color,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {isActive ? "OPEN" : "CLOSED"}
        </Box>
        <Box
          sx={{
            fontSize: sm ? "0.30rem" : "0.28rem",
            fontWeight: 700,
            color,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          VOUCHER
        </Box>
      </Box>
    </Box>
  );
}

export default function CartCardPanel({
  po,
  cartStatus,
  addToCartKey,
  cancelCartKey,
  cancelPoKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  currentUserId,
  onUpdateClick,
  collapsed,
  onRemoved,
  openCartKey,
  optionHistories,
  voucherStatus,
  voucherActiveKey,
  voucherClosedKey,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  // Shadow colors not defined in getThemeColors — using inline fallbacks
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

  useEffect(() => {
    setOpen(!collapsed);
  }, [collapsed]);

  const options = po.purchase_order_options || [];
  const hasAnyEWT = options.some((o) => o.purchase_option?.dEWT > 0);

  const stampConfig = (() => {
    const statuses = options.map((o) =>
      String(
        optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
          ?.nStatus ?? "",
      ),
    );
    const anyMatch = (k) => statuses.some((s) => s === String(k));
    if (anyMatch(cancelCartKey) || anyMatch(cancelPoKey))
      return { type: "single", ...stamps.VOID };

    let totalOrdered = 0,
      totalReceived = 0,
      totalDelivered = 0;
    options.forEach((o) => {
      const p = o.purchase_option;
      const ordered = p?.nQuantity || 0;
      totalOrdered += ordered;
      totalReceived += Math.min(p?.nInventoryQty || 0, ordered);
      totalDelivered += Math.min(p?.nDeliveredQty || 0, ordered);
    });

    const receivedPct =
      totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    const deliveredPct =
      totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;
    const allReceived = totalOrdered > 0 && totalReceived >= totalOrdered;
    const allDelivered = totalOrdered > 0 && totalDelivered >= totalOrdered;

    if (totalReceived > 0 || totalDelivered > 0) {
      const badges = [];
      if (!allReceived || totalDelivered === 0)
        badges.push({ ...stamps.RCVD, pct: allReceived ? null : receivedPct });
      if (totalDelivered > 0)
        badges.push({
          ...stamps.DLVRD,
          pct: allDelivered ? null : deliveredPct,
        });
      if (badges.length > 0) return { type: "multi", badges };
    }

    const stepOrder = [
      { key: addToCartKey, stamp: stamps.CART },
      { key: purchaseOrderKey, stamp: stamps.PO },
      { key: paidKey, stamp: stamps.PAID },
      { key: receivedKey, stamp: stamps.RCVD },
      { key: deliveredKey, stamp: stamps.DLVRD },
    ];
    for (const { key, stamp } of stepOrder)
      if (anyMatch(key)) return { type: "single", ...stamp };
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
  const totalCount = options.length;
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
    options.every(
      (o) =>
        String(
          optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
            ?.nStatus ?? "",
        ) === String(purchaseOrderKey),
    );

  const poIsPaidRcvdDvrd = options.some((o) => {
    const p = o.purchase_option;
    const ordered = p?.nQuantity || 0;
    const received = Math.min(p?.nInventoryQty || 0, ordered);
    const delivered = Math.min(p?.nDeliveredQty || 0, ordered);
    const status = String(
      optionHistories[Number(p?.nPurchaseOptionId)]?.nStatus ?? "",
    );
    const isPaid = status === String(paidKey);
    return isPaid || received > 0 || delivered > 0;
  });

  const handleRemoveOption = async (nPurchaseOptionId) => {
    setRemovingOptionId(nPurchaseOptionId);
    try {
      await PurchaseOrderAPI.removeFromCart({
        nPurchaseOptionId,
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
                key={opt.nPurchaseOrder_OptionId}
                opt={opt}
                idx={idx}
                totalCount={options.length}
                colors={base}
                isRemoving={
                  removingOptionId === opt.purchase_option?.nPurchaseOptionId
                }
                showRemove={po.cStatus === openCartKey}
                onRemove={handleRemoveOption}
                removingOptionId={removingOptionId}
                hasAnyEWT={hasAnyEWT}
                poIsPaidRcvdDvrd={poIsPaidRcvdDvrd}
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

            {po.cStatus === cancelCartKey ? (
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
