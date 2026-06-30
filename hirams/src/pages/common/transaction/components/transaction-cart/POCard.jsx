import { useState, useEffect } from "react";
import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import {
  ReceiptLongOutlined,
  StoreOutlined,
  Inventory2Outlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccountCircleOutlined,
  AccessTimeOutlined,
  CancelOutlined,
  Visibility,
  ShoppingCart,
  RemoveShoppingCart,
} from "@mui/icons-material";

import api from "../../../../../utils/api/api";

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const fmtDateTime = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
};

const STAMP_CONFIGS = {
  VOID: {
    label: "VOID",
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.15)",
    border: "#fca5a5",
    inner: "rgba(239,68,68,0.3)",
  },
  DLVRD: {
    label: "DLVRD",
    color: "#86efac",
    bg: "rgba(21,128,61,0.15)",
    border: "#86efac",
    inner: "rgba(21,128,61,0.3)",
  },
  RCVD: {
    label: "RCV'D",
    color: "#7dd3fc",
    bg: "rgba(3,105,161,0.15)",
    border: "#7dd3fc",
    inner: "rgba(3,105,161,0.3)",
  },
  PAID: {
    label: "PAID",
    color: "#5eead4",
    bg: "rgba(15,118,110,0.15)",
    border: "#5eead4",
    inner: "rgba(15,118,110,0.3)",
  },
  PO: {
    label: "P.O.",
    color: "#c4b5fd",
    bg: "rgba(124,58,237,0.15)",
    border: "#c4b5fd",
    inner: "rgba(124,58,237,0.3)",
  },
  CART: {
    label: "CART",
    color: "#93c5fd",
    bg: "rgba(29,78,216,0.15)",
    border: "#93c5fd",
    inner: "rgba(29,78,216,0.3)",
  },
};

// ── Replace StampIcon component ───────────────────────────────────
function StampIcon({ config, sm }) {
  const size = sm ? 24 : 22;
  const iconSize = sm ? "0.9rem" : "0.8rem";
  const fontSize = sm ? "0.45rem" : "0.4rem";

  if (!config)
    return (
      <Skeleton
        variant="circular"
        width={size}
        height={size}
        sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,0.1)" }}
      />
    );

  // ── Multi-badge (e.g. RCV'D 95% + DLVRD 40%) ─────────────────
  if (config.type === "multi") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          flexShrink: 0,
        }}
      >
        {config.badges.map((badge, i) => (
          <SingleStampBadge
            key={i}
            badge={badge}
            sm={sm}
            size={size}
            fontSize={fontSize}
          />
        ))}
      </Box>
    );
  }

  // ── Single badge ──────────────────────────────────────────────
  if (config.label === "CART") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderRadius: "50%",
          border: "2px solid #0369a1",
          outline: "1px solid #0369a1",
          outlineOffset: "2px",
          boxShadow: "0 0 0 1px #7dd3fc",
          backgroundColor: "transparent",
        }}
      >
        <ShoppingCart sx={{ fontSize: iconSize, color: "#7dd3fc" }} />
      </Box>
    );
  }

  return (
    <SingleStampBadge badge={config} sm={sm} size={size} fontSize={fontSize} />
  );
}

// ── Extracted single badge renderer ──────────────────────────────
function SingleStampBadge({ badge, sm, size, fontSize }) {
  const pctFontSize = sm ? "0.42rem" : "0.38rem";
  const lblFontSize = sm ? "0.33rem" : "0.30rem";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        borderRadius: "50%",
        border: `2px solid ${badge.border}`,
        outline: `1px solid ${badge.border}`,
        outlineOffset: "2px",
        boxShadow: `0 0 0 1px ${badge.inner}`,
        backgroundColor: badge.bg,
      }}
    >
      {badge.pct != null ? (
        // Percentage + label stacked
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
        // Normal label stamp
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
function VoucherBadge({ isActive, sm }) {
  const color = isActive ? "#93c5fd" : "#86efac";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        mr: sm ? 0.7 : 0,
        gap: 0.15,
      }}
    >
      <ReceiptLongOutlined
        sx={{ fontSize: sm ? "0.85rem" : "0.8rem", color }}
      />
      <Box
        sx={{
          fontSize: sm ? "0.38rem" : "0.36rem",
          fontWeight: 800,
          color,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {isActive ? (sm ? "VOUCHER" : "VCHR") : "CLOSED"}
      </Box>
    </Box>
  );
}

export default function POCard({
  po,
  cartStatus,
  addToCartKey,
  cancelCartKey,
  cancelPoKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  optionHistories,
  deliveredKey,
  removedFromCartKey,
  currentUserId,
  onUpdateClick,
  collapsed,
  onRemoved,
  openCartKey,
  closeCartKey,
  isEligible,
  isSelected,
  onToggleSelect,
  voucherStatus,
  voucherActiveKey,
  voucherClosedKey,
  selectError,
  onCreateVoucherClick,
}) {
  const [open, setOpen] = useState(true);
  const [removingOptionId, setRemovingOptionId] = useState(null);

  useEffect(() => {
    setOpen(!collapsed);
  }, [collapsed]);

  const options = po.purchase_order_options || [];
  const stampConfig = (() => {
    const statuses = options.map((o) =>
      String(
        optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
          ?.nStatus ?? "",
      ),
    );
    const anyMatch = (k) => statuses.some((s) => s === String(k));

    if (anyMatch(cancelCartKey) || anyMatch(cancelPoKey))
      return { type: "single", ...STAMP_CONFIGS.VOID };

    // ── Compute qty percentages across all options ────────────────
    let totalOrdered = 0,
      totalReceived = 0,
      totalDelivered = 0;
    options.forEach((o) => {
      const p = o.purchase_option;
      const ordered = p?.nQuantity || 0;
      const received = Math.min(p?.nInventoryQty || 0, ordered);
      const delivered = Math.min(p?.nDeliveredQty || 0, ordered);
      totalOrdered += ordered;
      totalReceived += received;
      totalDelivered += delivered;
    });

    const receivedPct =
      totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    const deliveredPct =
      totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;

    const anyReceived = totalReceived > 0;
    const anyDelivered = totalDelivered > 0;
    const allReceived = totalOrdered > 0 && totalReceived >= totalOrdered;
    const allDelivered = totalOrdered > 0 && totalDelivered >= totalOrdered;

    if (anyReceived || anyDelivered) {
      const badges = [];

      // Only show RCVD badge if received is still in progress
      if (!allReceived || !anyDelivered) {
        badges.push({
          ...STAMP_CONFIGS.RCVD,
          pct: allReceived ? null : receivedPct,
        });
      }

      // Show DLVRD badge if any delivery happened
      if (anyDelivered) {
        badges.push({
          ...STAMP_CONFIGS.DLVRD,
          pct: allDelivered ? null : deliveredPct,
        });
      }

      // If badges is empty somehow, fall through to single-stamp
      if (badges.length > 0) {
        return { type: "multi", badges };
      }
    }

    // ── Single-stamp fallback — lowest step ───────────────────────
    const stepOrder = [
      { key: addToCartKey, stamp: STAMP_CONFIGS.CART },
      { key: purchaseOrderKey, stamp: STAMP_CONFIGS.PO },
      { key: paidKey, stamp: STAMP_CONFIGS.PAID },
      { key: receivedKey, stamp: STAMP_CONFIGS.RCVD },
      { key: deliveredKey, stamp: STAMP_CONFIGS.DLVRD },
    ];
    for (const { key, stamp } of stepOrder) {
      if (anyMatch(key)) return { type: "single", ...stamp };
    }

    return null;
  })();

  const total = options.reduce(
    (s, o) =>
      s +
      (o.purchase_option?.nQuantity || 0) *
        (o.purchase_option?.dUnitPrice || 0),
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
    options.every(
      (o) =>
        String(
          optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
            ?.nStatus ?? "",
        ) === String(purchaseOrderKey),
    );

  const showCheckbox =
    isEligible &&
    (!voucherStatus ||
      (String(voucherStatus) !== String(voucherActiveKey) &&
        String(voucherStatus) !== String(voucherClosedKey)));

  const handleRemoveOption = async (nPurchaseOptionId) => {
    setRemovingOptionId(nPurchaseOptionId);
    try {
      await api.post("purchase-order/remove-from-cart", {
        nPurchaseOptionId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement: true,
      });
      await onRemoved?.();
      window.dispatchEvent(new CustomEvent("cart_data_updated"));
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    } finally {
      setRemovingOptionId(null);
    }
  };

  return (
    <Box
      sx={{
        border: "0.5px solid #E5E7EB",
        borderRadius: 2,
        overflow: "hidden",
        background: "#fff",
        width: "100%",
        display: "block",
        alignSelf: "start",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── HEADER (responsive) ── */}
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
            py: 0.875,
            background: "linear-gradient(135deg, #1e3a5f 0%, #1a3254 100%)",
            borderBottom: open ? "0.5px solid #2d4f7c" : "none",
          }}
        >
          {showCheckbox && (
            <Box sx={{ position: "relative", flexShrink: 0, mr: sm ? 0.7 : 0 }}>
              <Box
                onClick={() => onToggleSelect(po.nPurchaseOrderId)}
                sx={{
                  width: sm ? 18 : 16,
                  height: sm ? 18 : 16,
                  borderRadius: "4px",
                  cursor: "pointer",
                  border: selectError
                    ? "2px solid #ef4444"
                    : isSelected
                      ? "2px solid #86efac"
                      : "2px solid rgba(134,239,172,0.3)",
                  background: isSelected ? "#16a34a" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  animation: selectError ? "errorShake 0.3s ease" : "none",
                }}
              >
                {isSelected && (
                  <Box
                    component="span"
                    sx={{
                      color: "#fff",
                      fontSize: sm ? "0.65rem" : "0.6rem",
                      lineHeight: 1,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </Box>
                )}
              </Box>
              {selectError && (
                <Box
                  sx={{
                    position: "absolute",
                    left: "calc(100% + 8px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 20,
                    background: "rgba(239,68,68,0.95)",
                    color: "#fff",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    lineHeight: 1.3,
                    px: 0.75,
                    py: 0.4,
                    borderRadius: "5px",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    animation: "optionErrorFade 0.18s ease-out",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      right: "100%",
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderWidth: 4,
                      borderStyle: "solid",
                      borderColor:
                        "transparent rgba(239,68,68,0.95) transparent transparent",
                    },
                  }}
                >
                  Same supplier only
                </Box>
              )}
            </Box>
          )}

          {showVoucherBadge && (
            <VoucherBadge
              isActive={String(voucherStatus) === String(voucherActiveKey)}
              sm={sm}
            />
          )}
          <StampIcon config={stampConfig} sm={sm} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: sm ? 0.75 : 0.5,
                mb: sm ? 0.35 : 0.25,
              }}
            >
              <StoreOutlined
                sx={{ fontSize: sm ? "0.9rem" : "0.75rem", color: "#90caf9" }}
              />
              <Typography
                sx={{
                  fontSize: sm ? "0.75rem" : "0.65rem",
                  fontWeight: 700,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1,
                  letterSpacing: sm ? "0.02em" : undefined,
                }}
              >
                {primarySupplier} | {companyName}
              </Typography>
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
                        color: "#90caf9",
                        flexShrink: 0,
                      }}
                    />
                  ),
                  text: po.strPurchaseOrderNo,
                  bg: "rgba(255,255,255,0.08)",
                  border: "rgba(255,255,255,0.12)",
                },
                {
                  icon: (
                    <AccountCircleOutlined
                      sx={{
                        fontSize: sm ? "0.65rem" : "0.6rem",
                        color: "#90caf9",
                        flexShrink: 0,
                      }}
                    />
                  ),
                  text: assignedAOName,
                  bg: "rgba(144,202,249,0.12)",
                  border: "rgba(144,202,249,0.25)",
                },
              ].map(({ icon, text, bg, border }, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: sm ? 0.3 : 0.25,
                    px: sm ? 0.6 : 0.5,
                    py: sm ? 0.15 : 0.1,
                    borderRadius: "50px",
                    background: bg,
                    border: `0.5px solid ${border}`,
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
                      color: "#90caf9",
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

          {sm && (
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#90caf9",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Typography>
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
                  px: 0.4,
                  borderRadius: "50px",
                  background: "#3b82f6",
                  border: "1.5px solid #1e3a5f",
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
                    color: "#fff",
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
                border: "0.5px solid rgba(144,202,249,0.3)",
                color: "#90caf9",
                "&:hover": { background: "rgba(255,255,255,0.1)" },
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

      {/* ── BODY ── */}
      {open && (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              maxHeight: 320,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "#E5E7EB",
                borderRadius: 2,
              },
              "&::-webkit-scrollbar-thumb:hover": { background: "#D1D5DB" },
            }}
          >
            {options.map((opt, idx) => {
              const p = opt.purchase_option;
              const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
              const txnCode = p?.transaction_item?.transaction?.strCode ?? "—";
              const deliveryDate = fmtDateTime(
                p?.transaction_item?.transaction?.dtDelivery ?? "—",
              );
              const isRemoving = removingOptionId === p?.nPurchaseOptionId;
              const showRemove = po.cStatus === openCartKey;

              const removeBtn = showRemove ? (
                isRemoving ? (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fecaca",
                        borderTopColor: "#ef4444",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                  </Box>
                ) : (
                  <IconButton
                    size="small"
                    disabled={removingOptionId !== null}
                    onClick={() => handleRemoveOption(p?.nPurchaseOptionId)}
                    sx={{
                      width: 22,
                      height: 22,
                      color: "#ef4444",
                      border: "0.5px solid rgba(239,68,68,0.3)",
                      borderRadius: "6px",
                      "&:hover": { background: "rgba(239,68,68,0.08)" },
                      p: 0,
                    }}
                  >
                    <RemoveShoppingCart sx={{ fontSize: "0.8rem" }} />
                  </IconButton>
                )
              ) : null;

              return (
                <Box
                  key={opt.nPurchaseOrder_OptionId}
                  sx={{
                    borderBottom:
                      idx < options.length - 1 ? "0.5px solid #F3F4F6" : "none",
                    "&:hover": { background: "#F9FAFB" },
                    transition: "background 0.15s",
                  }}
                >
                  {/* Mobile */}
                  <Box
                    sx={{
                      display: { xs: "flex", sm: "none" },
                      flexDirection: "column",
                      px: 1,
                      py: 0.75,
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: "#9CA3AF",
                          lineHeight: 1,
                          pt: 0.3,
                          width: 14,
                          flexShrink: 0,
                          textAlign: "center",
                        }}
                      >
                        {idx + 1}
                      </Typography>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "7px",
                          background: "#F3F4F6",
                          border: "0.5px solid #E5E7EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Inventory2Outlined
                          sx={{ fontSize: "0.78rem", color: "#9CA3AF" }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.35,
                            mb: 0.15,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              px: 0.35,
                              py: 0.08,
                              borderRadius: "3px",
                              background: "#EFF6FF",
                              border: "0.5px solid #BFDBFE",
                              flexShrink: 0,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.48rem",
                                fontWeight: 600,
                                color: "#3B82F6",
                                lineHeight: 1,
                              }}
                            >
                              {txnCode}
                            </Typography>
                          </Box>
                          {(p?.strBrand || p?.strModel) && (
                            <Typography
                              sx={{
                                fontSize: "0.62rem",
                                fontWeight: 600,
                                color: "#111827",
                                lineHeight: 1.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                              }}
                            >
                              {[p?.strBrand, p?.strModel]
                                .filter(Boolean)
                                .join(" · ")}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: "0.56rem",
                            color: "#6B7280",
                            lineHeight: 1.2,
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
                            color: "#C4C9D4",
                            lineHeight: 1,
                            mt: 0.15,
                          }}
                        >
                          {deliveryDate}
                        </Typography>
                      </Box>
                      {showRemove && (
                        <Box sx={{ flexShrink: 0 }}>
                          {isRemoving ? (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  border: "2px solid #fecaca",
                                  borderTopColor: "#ef4444",
                                  borderRadius: "50%",
                                  animation: "spin 0.6s linear infinite",
                                }}
                              />
                            </Box>
                          ) : (
                            <IconButton
                              size="small"
                              disabled={removingOptionId !== null}
                              onClick={() =>
                                handleRemoveOption(p?.nPurchaseOptionId)
                              }
                              sx={{
                                width: 20,
                                height: 20,
                                color: "#ef4444",
                                border: "0.5px solid rgba(239,68,68,0.3)",
                                borderRadius: "6px",
                                "&:hover": {
                                  background: "rgba(239,68,68,0.08)",
                                },
                                p: 0,
                              }}
                            >
                              <RemoveShoppingCart
                                sx={{ fontSize: "0.68rem" }}
                              />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pl: "42px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.44rem",
                            color: "#9CA3AF",
                            lineHeight: 1,
                          }}
                        >
                          unit
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.55rem",
                            fontWeight: 600,
                            color: "#9CA3AF",
                            lineHeight: 1,
                          }}
                        >
                          ₱
                          {Number(p?.dUnitPrice || 0).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.2,
                          px: 0.45,
                          py: 0.12,
                          borderRadius: "4px",
                          background: "#F3F4F6",
                          border: "0.5px solid #E5E7EB",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            color: "#374151",
                            lineHeight: 1,
                          }}
                        >
                          {p?.nQuantity}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.44rem",
                            color: "#9CA3AF",
                            lineHeight: 1,
                          }}
                        >
                          {p?.strUOM}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "#D85A30",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₱
                        {lineTotal.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Desktop */}
                  <Box
                    sx={{
                      display: { xs: "none", sm: "flex" },
                      alignItems: "stretch",
                      px: 1.5,
                      py: 0.875,
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 0.75,
                        alignSelf: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: "#9CA3AF",
                          lineHeight: 1,
                        }}
                      >
                        {idx + 1}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "8px",
                        background: "#F3F4F6",
                        border: "0.5px solid #E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        alignSelf: "center",
                        mr: 1,
                      }}
                    >
                      <Inventory2Outlined
                        sx={{ fontSize: "0.95rem", color: "#9CA3AF" }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 0.2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 0.5,
                            py: 0.1,
                            borderRadius: "3px",
                            background: "#EFF6FF",
                            border: "0.5px solid #BFDBFE",
                            flexShrink: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.55rem",
                              fontWeight: 600,
                              color: "#3B82F6",
                              lineHeight: 1,
                            }}
                          >
                            {txnCode}
                          </Typography>
                        </Box>
                        {(p?.strBrand || p?.strModel) && (
                          <Typography
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.2,
                            }}
                          >
                            {[p?.strBrand, p?.strModel]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.62rem",
                          color: "#6B7280",
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
                          color: "#C4C9D4",
                          lineHeight: 1,
                          mt: 0.2,
                        }}
                      >
                        Delivery: {deliveryDate}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 72,
                        flexShrink: 0,
                        textAlign: "right",
                        alignSelf: "center",
                        pr: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.58rem",
                          fontWeight: 600,
                          color: "#9CA3AF",
                          lineHeight: 1.2,
                        }}
                      >
                        ₱
                        {Number(p?.dUnitPrice || 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 60,
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#374151",
                          lineHeight: 1,
                        }}
                      >
                        {p?.nQuantity}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.55rem",
                          color: "#9CA3AF",
                          lineHeight: 1,
                          mt: 0.2,
                        }}
                      >
                        {p?.strUOM}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 80,
                        flexShrink: 0,
                        textAlign: "right",
                        alignSelf: "center",
                        pl: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#D85A30",
                          lineHeight: 1.2,
                        }}
                      >
                        ₱
                        {lineTotal.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                    {showRemove && (
                      <Box
                        sx={{
                          width: 28,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pl: 0.5,
                          ml: 2,
                        }}
                      >
                        {removeBtn}
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ── FOOTER ── */}
          <Box sx={{ borderTop: "0.5px solid #E5E7EB", background: "#F8FAFC" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 0.875,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <AccessTimeOutlined
                  sx={{ fontSize: "0.6rem", color: "#D1D5DB" }}
                />
                <Typography
                  sx={{ fontSize: "0.55rem", color: "#D1D5DB", lineHeight: 1 }}
                >
                  Created {fmtDate(po.dtPurchaseOrderCreated)}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {showCheckbox && (
                  <Box
                    onClick={() => onCreateVoucherClick?.({ po })}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 1,
                      py: 0.4,
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: "#0c2d1e",
                      border: "1px solid #166534",
                      "&:hover": { background: "#166534" },
                      transition: "background 0.15s",
                    }}
                  >
                    <ReceiptLongOutlined
                      sx={{ fontSize: "0.65rem", color: "#86efac" }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "#86efac",
                        lineHeight: 1,
                        letterSpacing: "0.04em",
                      }}
                    >
                      CREATE VOUCHER
                    </Typography>
                  </Box>
                )}

                {po.cStatus === cancelCartKey ? (
                  <Box
                    sx={{
                      fontSize: "0.6rem",
                      background: "rgba(239,68,68,0.1)",
                      border: "0.5px solid rgba(239,68,68,0.3)",
                      color: "#ef4444",
                      fontWeight: 600,
                      borderRadius: "50px",
                      px: 1,
                      py: 0.25,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <CancelOutlined style={{ fontSize: "0.65rem" }} />
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        color: "#ef4444",
                        lineHeight: 1,
                      }}
                    >
                      Cancelled
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    onClick={() => onUpdateClick({ po, statusLabel })}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 1,
                      py: 0.4,
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: "#1e3a5f",
                      border: "1px solid #2d4f7c",
                      "&:hover": { background: "#2d4f7c" },
                      transition: "background 0.15s",
                    }}
                  >
                    <Visibility
                      sx={{ fontSize: "0.65rem", color: "#90caf9" }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "#90caf9",
                        lineHeight: 1,
                        letterSpacing: "0.04em",
                      }}
                    >
                      VIEW
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
