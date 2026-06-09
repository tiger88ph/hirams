// PurchaseCartUpdateStatusModal.jsx
import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer";
import { Box, Typography, Skeleton, IconButton } from "@mui/material";
import {
  ShoppingCartOutlined,
  LockOutlined,
  CancelOutlined,
  ReceiptLongOutlined,
  StoreOutlined,
  LocalShippingOutlined,
  AccountCircleOutlined,
  Inventory2Outlined,
  FileDownloadOutlined,
  RemoveShoppingCart, // ← ADD
  PrintOutlined,
} from "@mui/icons-material";
import api from "../../../../../utils/api/api";
import FormGrid from "../../../../../components/common/FormGrid";
// ── Style Configs ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  open: {
    label: "Cart is Open",
    color: "#1D4ED8",
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    border: "#BFDBFE",
    dotColor: "#3B82F6",
    icon: <ShoppingCartOutlined sx={{ fontSize: "1rem" }} />,
  },
  close: {
    label: "Cart is Closed",
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <LockOutlined sx={{ fontSize: "1rem" }} />,
  },
  cancel: {
    label: "Cart is Cancelled",
    color: "#B91C1C",
    bg: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
    border: "#FCA5A5",
    dotColor: "#EF4444",
    icon: <CancelOutlined sx={{ fontSize: "1rem" }} />,
  },
};

const CONFIRM_STYLES = {
  open: {
    color: "#1D4ED8",
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    border: "#BFDBFE",
    dotColor: "#3B82F6",
    icon: (
      <ShoppingCartOutlined sx={{ fontSize: "1.4rem", color: "#1D4ED8" }} />
    ),
    title: "Re-open this Cart?",
    desc: "This will reactivate the cart and allow further edits.",
    confirmLabel: "Yes, Re-open Cart",
    confirmBg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)",
  },
  close: {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <LockOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Close this Cart?",
    desc: "Closing the cart will lock it from further edits. This action can be reviewed later.",
    confirmLabel: "Yes, Close Cart",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  },
  cancel: {
    color: "#dc2626",
    bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    border: "#fecaca",
    dotColor: "#ef4444",
    icon: <CancelOutlined sx={{ fontSize: "1.4rem", color: "#dc2626" }} />,
    title: "Cancel this Cart?",
    desc: "Cancelling the cart will void all items. This action cannot be undone.",
    confirmLabel: "Yes, Cancel Cart",
    confirmBg: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const fmtPHP = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ── Shared Sub-components ─────────────────────────────────────────────────────
const IconBox = ({
  size = 34,
  bg = "#F3F4F6",
  border = "0.5px solid #E9EAEB",
  radius = "8px",
  mr = 1,
  children,
  sx = {},
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg,
      border,
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

const Label = ({ children, sx = {} }) => (
  <Typography
    sx={{
      fontSize: "0.54rem",
      fontWeight: 700,
      color: "#9CA3AF",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      lineHeight: 1,
      mb: 0.3,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const DarkCard = ({ icon, title, children }) => (
  <Box
    sx={{
      flex: 1,
      px: 1,
      py: 0.75,
      borderRadius: "8px",
      background: "rgba(255,255,255,0.07)",
      border: "0.5px solid rgba(255,255,255,0.12)",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}>
      {icon}
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "#93c5fd",
          lineHeight: 1,
        }}
      >
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

const DarkText = ({ children, sub, sx = {} }) => (
  <>
    <Typography
      sx={{
        fontSize: "0.65rem",
        fontWeight: 700,
        color: "#fff",
        lineHeight: 1.2,
        mb: 0.2,
        ...sx,
      }}
    >
      {children}
    </Typography>
    {sub && (
      <Typography
        sx={{
          fontSize: "0.55rem",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.3,
        }}
      >
        {sub}
      </Typography>
    )}
  </>
);

const SectionLabel = ({ children }) => (
  <Box
    sx={{
      px: 2,
      pt: 1,
      pb: 0.5,
      display: "flex",
      alignItems: "center",
      gap: 0.75,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "text.disabled",
      }}
    >
      {children}
    </Typography>
    <Box sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }} />
  </Box>
);

const ShippingPaymentRow = ({ shippingLabel, paymentLabel }) => (
  <Box
    sx={{
      px: 1.5,
      py: 0.875,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      borderBottom: "0.5px solid #F3F4F6",
      "&:hover": { background: "#F8FAFC" },
      transition: "background 0.12s",
    }}
  >
    {[
      {
        Icon: LocalShippingOutlined,
        label: "Shipping Details",
        value: shippingLabel,
      },
      null,
      {
        Icon: ReceiptLongOutlined,
        label: "Payment Terms",
        value: paymentLabel,
      },
    ].map((item, i) =>
      item === null ? (
        <Box
          key={i}
          sx={{
            width: "0.5px",
            height: 28,
            background: "#E5E7EB",
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            ml: 2,
            mr: 2,
          }}
        >
          <IconBox mr={1}>
            <item.Icon sx={{ fontSize: "0.85rem", color: "#9CA3AF" }} />
          </IconBox>
          <Box sx={{ minWidth: 0 }}>
            <Label>{item.label}</Label>
            <Typography
              sx={{
                fontSize: "0.67rem",
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.2,
                "& p": { margin: 0, lineHeight: 1.5 },
                "& br": { display: "block", content: '""', mb: 0.25 },
              }}
              dangerouslySetInnerHTML={
                item.value ? { __html: item.value } : undefined
              }
            >
              {!item.value ? "—" : undefined}
            </Typography>
          </Box>
        </Box>
      ),
    )}
  </Box>
);

// ── Cart Progress Stepper ─────────────────────────────────────────────────────
// Mirrors the 5-step tracker from PurchaseItemInfoModal (HorizontalProgressTracker)
// Steps: Added to Cart → Purchase Order → Paid → Received → Delivered
// Current step is derived from optionHistories (same fetch as the modal already does)

const CART_STEPS = [
  {
    key: "addToCart",
    label: "Added to Cart",
    sublabel: "Queued",
    icon: <ShoppingCartOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#93c5fd",
    activeBg: "#1d4ed8",
  },
  {
    key: "purchaseOrder",
    label: "Purchase Order",
    sublabel: "P.O. Issued",
    icon: <ReceiptLongOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
    activeBg: "#7c3aed",
  },
  {
    key: "paid",
    label: "Paid",
    sublabel: "Payment Done",
    icon: <FileDownloadOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#0f766e",
    bg: "#ccfbf1",
    border: "#5eead4",
    activeBg: "#0f766e",
  },
  {
    key: "received",
    label: "Received",
    sublabel: "From Supplier",
    icon: <LocalShippingOutlined sx={{ fontSize: "0.78rem" }} />,
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    activeBg: "#0369a1",
  },
  {
    key: "delivered",
    label: "Delivered",
    sublabel: "To Client",
    icon: <Inventory2Outlined sx={{ fontSize: "0.78rem" }} />,
    color: "#15803d",
    bg: "#dcfce7",
    border: "#86efac",
    activeBg: "#15803d",
  },
];

// Map a status key value → step index (same logic as stepIndexByKey in PurchaseItemInfoModal)
function getCartStepIndex(
  statusVal,
  { addToCartKey, purchaseOrderKey, paidKey, receivedKey, deliveredKey },
) {
  if (!statusVal) return -1;
  const s = String(statusVal);
  if (s === String(addToCartKey)) return 0;
  if (s === String(purchaseOrderKey)) return 1;
  if (s === String(paidKey)) return 2;
  if (s === String(receivedKey)) return 3;
  if (s === String(deliveredKey)) return 4;
  return -1;
}

const STEPPER_KEYFRAMES = `
  @keyframes cart-pip-pulse   { 0%,100%{box-shadow:0 0 0 3px var(--pip-bg)} 50%{box-shadow:0 0 0 5px var(--pip-bg)} }
  @keyframes cart-pip-pop     { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes cart-pip-fadein  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("cart-pip-kf")
) {
  const s = document.createElement("style");
  s.id = "cart-pip-kf";
  s.textContent = STEPPER_KEYFRAMES;
  document.head.appendChild(s);
}

function CartProgressStepper({
  // optionHistories: { [nPurchaseOptionId]: historyRecord } — same map the modal already fetches
  optionHistories,
  options,
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  cancelPoKey,
  cancelCartKey,
  historiesLoading,
}) {
  // Derive the "lowest common" step across all options (the bottleneck step)
  // and whether any are cancelled
  const { currentIndex, isCancelled } = React.useMemo(() => {
    if (!options.length) return { currentIndex: 0, isCancelled: false };

    let minIndex = Infinity;
    let cancelled = false;

    for (const opt of options) {
      const id = Number(opt.purchase_option?.nPurchaseOptionId);
      const h = optionHistories[id];
      const statusVal = h?.nStatus;

      // Check cancellation
      if (
        statusVal &&
        (String(statusVal) === String(cancelPoKey) ||
          String(statusVal) === String(cancelCartKey))
      ) {
        cancelled = true;
        continue;
      }

      const idx = getCartStepIndex(statusVal, {
        addToCartKey,
        purchaseOrderKey,
        paidKey,
        receivedKey,
        deliveredKey,
      });

      // No history yet → treat as step 0 (Added to Cart)
      const effectiveIdx = idx === -1 ? 0 : idx;
      if (effectiveIdx < minIndex) minIndex = effectiveIdx;
    }

    return {
      currentIndex: minIndex === Infinity ? 0 : minIndex,
      isCancelled: cancelled,
    };
  }, [
    options,
    optionHistories,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    cancelPoKey,
    cancelCartKey,
  ]);

  if (historiesLoading) {
    return (
      <Box
        sx={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)",
          borderBottom: "0.5px solid #e2e8f0",
          px: 2,
          pt: 1.25,
          pb: 1.75,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.25,
          }}
        >
          <Skeleton variant="text" width={90} height={10} />
          <Skeleton variant="text" width={40} height={10} />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {CART_STEPS.map((_, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Skeleton variant="circular" width={22} height={22} />
              <Skeleton variant="text" width="70%" height={9} />
              <Skeleton variant="text" width="50%" height={8} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)",
        borderBottom: "0.5px solid #e2e8f0",
        px: 2,
        pt: 1.25,
        pb: 1.75,
      }}
    >
      {/* Steps row */}
      <Box sx={{ display: "flex", alignItems: "flex-start", pt: 2 }}>
        {CART_STEPS.map((step, i) => {
          const isDone = !isCancelled && i < currentIndex;
          const isCurrent = !isCancelled && i === currentIndex;
          const isPending = isCancelled || i > currentIndex;
          const isLast = i === CART_STEPS.length - 1;
          const delay = `${i * 70}ms`;

          return (
            <Box
              key={step.key}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                animation: "cart-pip-fadein 0.3s ease both",
                animationDelay: delay,
              }}
            >
              {/* Connector line */}
              {!isLast && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 11,
                    left: "50%",
                    width: "100%",
                    height: "1.5px",
                    borderRadius: "2px",
                    zIndex: 0,
                    background: isDone
                      ? `linear-gradient(to right, ${step.color}99, ${CART_STEPS[i + 1].color}55)`
                      : "#e2e8f0",
                  }}
                />
              )}

              {/* Circle */}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                  mb: 0.5,
                  animation:
                    isDone || isCurrent
                      ? "cart-pip-pop 0.35s ease both"
                      : "none",
                  animationDelay: delay,
                  ...(isDone && {
                    background: step.bg,
                    border: `2px solid ${step.border}`,
                    color: step.color,
                  }),
                  ...(isCurrent && {
                    "--pip-bg": step.bg,
                    background: step.activeBg,
                    border: `2px solid ${step.activeBg}`,
                    color: "#fff",
                    boxShadow: `0 0 0 3px ${step.bg}`,
                    animation: `cart-pip-pop 0.35s ease both, cart-pip-pulse 2s ease-in-out ${delay} infinite`,
                    animationDelay: delay,
                  }),
                  ...(isPending &&
                    !isCancelled && {
                      background: "#f1f5f9",
                      border: "2px solid #e2e8f0",
                      color: "#cbd5e1",
                    }),
                  ...(isCancelled &&
                    i === 0 && {
                      background: "#fee2e2",
                      border: "2px solid #fca5a5",
                      color: "#ef4444",
                    }),
                  ...(isCancelled &&
                    i > 0 && {
                      background: "#f1f5f9",
                      border: "2px solid #e2e8f0",
                      color: "#cbd5e1",
                    }),
                }}
              >
                {isCancelled && i === 0 ? (
                  <CancelOutlined sx={{ fontSize: "0.78rem" }} />
                ) : isDone || isCurrent ? (
                  step.icon
                ) : (
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#cbd5e1",
                    }}
                  />
                )}
              </Box>

              {/* Label */}
              <Typography
                sx={{
                  fontSize: "0.56rem",
                  fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                  color:
                    isCancelled && i === 0
                      ? "#b91c1c"
                      : isCurrent
                        ? step.color
                        : isDone
                          ? "#374151"
                          : "#CBD5E1",
                  textAlign: "center",
                  lineHeight: 1.3,
                  px: 0.25,
                }}
              >
                {step.label}
              </Typography>

              {/* Sublabel */}
              <Typography
                sx={{
                  fontSize: "0.5rem",
                  color: isPending && !isCancelled ? "#e2e8f0" : "#94A3B8",
                  textAlign: "center",
                  lineHeight: 1.2,
                  mt: 0.15,
                  px: 0.25,
                }}
              >
                {isCancelled && i === 0 ? "Cancelled" : step.sublabel}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// DarkHeader props — add total:
const DarkHeader = ({
  po,
  options,
  assignedAOName,
  firstOption,
  actionButtons,
  allOptionsAtPO,
  handleUpdate,
  cancelCartKey,
  total, // ← ADD
}) => (
  <Box
    sx={{
      px: 2,
      pt: 2,
      pb: 1.5,
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,

        pointerEvents: "none",
      },
    }}
  >
    {/* GROUP CONTAINER */}
    <Box
      sx={{
        background:
          "linear-gradient(160deg, #1a2f4e 0%, #142540 60%, #0f1e33 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        p: 1.5,

        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Company + Supplier cards */}
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        {/* Company */}
        <DarkCard
          icon={<StoreOutlined sx={{ fontSize: "0.6rem", color: "#93c5fd" }} />}
          title="Company"
        >
          <DarkText
            sub={
              firstOption?.purchase_option?.transaction_item?.transaction
                ?.company?.strAddress
            }
          >
            {firstOption?.purchase_option?.transaction_item?.transaction
              ?.company?.strCompanyName ?? "—"}
          </DarkText>

          {firstOption?.purchase_option?.transaction_item?.transaction?.company
            ?.strTIN && (
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.3,
              }}
            >
              TIN:{" "}
              {
                firstOption.purchase_option.transaction_item.transaction.company
                  .strTIN
              }
            </Typography>
          )}
        </DarkCard>

        {/* Supplier */}
        <DarkCard
          icon={
            <LocalShippingOutlined
              sx={{ fontSize: "0.6rem", color: "#93c5fd" }}
            />
          }
          title="Supplier"
        >
          <DarkText sub={firstOption?.purchase_option?.supplier?.strAddress}>
            {firstOption?.purchase_option?.supplier?.strSupplierName ?? "—"}
          </DarkText>

          {firstOption?.purchase_option?.supplier?.strTIN && (
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.3,
              }}
            >
              TIN: {firstOption.purchase_option.supplier.strTIN}
            </Typography>
          )}
        </DarkCard>
      </Box>
      {/* PO row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconBox
          size={28}
          bg="rgba(144,202,249,0.12)"
          border="0.5px solid rgba(144,202,249,0.2)"
          radius="7px"
          mr={0}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.8rem", color: "#90caf9" }} />
        </IconBox>

        <Box sx={{ flex: 1, minWidth: 0, ml: 1 }}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}
          >
            {po?.strPurchaseOrderNo ?? "—"}
          </Typography>

          {/* AO + Count row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mt: 0.4,
              flexWrap: "nowrap",
            }}
          >
            {/* AO badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.3,
                px: 0.625,
                py: 0.25,
                borderRadius: "50px",
                background: "rgba(255,255,255,0.07)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(4px)",
                flexShrink: 0,
              }}
            >
              <AccountCircleOutlined
                sx={{ fontSize: "0.6rem", color: "#93c5fd" }}
              />

              <Typography
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: "#93c5fd",
                  lineHeight: 1,
                }}
              >
                {assignedAOName}
              </Typography>
            </Box>

            {/* Item count */}
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {options.length} {options.length === 1 ? "item" : "items"}
            </Typography>
          </Box>
        </Box>

        {/* Action buttons */}
        {handleUpdate && (
          <Box sx={{ display: "flex", gap: 0.625, flexShrink: 0 }}>
            {allOptionsAtPO ? (
              <>
                {/* Cancel */}
                <Box
                  onClick={() => handleUpdate(cancelCartKey)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.4,
                    px: 0.875,
                    py: 0.5,
                    borderRadius: "6px",
                    background: "rgba(239,68,68,0.15)",
                    border: "0.5px solid rgba(239,68,68,0.3)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      background: "rgba(239,68,68,0.25)",
                      borderColor: "rgba(239,68,68,0.5)",
                      transform: "translateY(-0.5px)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
                      opacity: 0.85,
                    },
                  }}
                >
                  <CancelOutlined
                    sx={{ fontSize: "0.65rem", color: "#f87171" }}
                  />

                  <Typography
                    sx={{
                      fontSize: "0.63rem",
                      fontWeight: 600,
                      color: "#f87171",
                      lineHeight: 1,
                    }}
                  >
                    Cancel
                  </Typography>
                </Box>
              </>
            ) : (
              actionButtons.map(
                ({
                  key,
                  label,
                  icon,
                  textColor,
                  bg,
                  border,
                  hoverBg,
                  hoverBorder,
                }) => (
                  <Box
                    key={key}
                    onClick={() => handleUpdate(key)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 0.875,
                      py: 0.5,
                      borderRadius: "6px",
                      background: bg,
                      border: `0.5px solid ${border}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        background: hoverBg,
                        borderColor: hoverBorder,
                        transform: "translateY(-0.5px)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                        opacity: 0.85,
                      },
                    }}
                  >
                    {icon}

                    <Typography
                      sx={{
                        fontSize: "0.63rem",
                        fontWeight: 600,
                        color: textColor,
                        lineHeight: 1,
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                ),
              )
            )}
          </Box>
        )}
      </Box>
    </Box>
  </Box>
);
const LineItems = ({
  options,
  total,
  openCartKey,
  removedFromCartKey,
  currentUserId,
  onRemoved,
  poStatus,
}) => {
  const [removingOptionId, setRemovingOptionId] = useState(null);

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
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    } finally {
      setRemovingOptionId(null);
    }
  };
  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        borderRadius: "10px",
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
        maxHeight: 300,
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: 3 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "#D1D5DB",
          borderRadius: 2,
        },
        "&::-webkit-scrollbar-thumb:hover": { background: "#9CA3AF" },
      }}
    >
      {options.map((opt, idx) => {
        const p = opt.purchase_option;
        const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
        return (
          <Box
            key={opt.nPurchaseOrder_OptionId ?? idx}
            sx={{
              px: 1.5,
              py: 0.875,
              display: "flex",
              alignItems: "stretch",
              borderBottom: "0.5px solid #F3F4F6",
              "&:hover": { background: "#F8FAFC" },
              transition: "background 0.12s",
            }}
          >
            {/* Row number */}
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

            <IconBox sx={{ alignSelf: "center" }}>
              <Inventory2Outlined
                sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}
              />
            </IconBox>
            <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  mb: 0.2,
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 0.4,
                    py: 0.1,
                    borderRadius: "3px",
                    background: "#EFF6FF",
                    border: "0.5px solid #BFDBFE",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.5rem",
                      fontWeight: 700,
                      color: "#3B82F6",
                      lineHeight: 1,
                    }}
                  >
                    {p?.transaction_item?.transaction?.strCode ?? "—"}
                  </Typography>
                </Box>
                {(p?.strBrand || p?.strModel) && (
                  <Typography
                    sx={{
                      fontSize: "0.67rem",
                      fontWeight: 600,
                      color: "#111827",
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
                  color: "#6B7280",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                }}
              >
                {p?.transaction_item?.strName ?? "—"}
              </Typography>
              {/* <Typography
              sx={{
                fontSize: "0.50rem",
                color: "#C4C9D4",
                lineHeight: 1,
                mt: 0.25,
              }}
            >
              Added: {fmtDateTime(opt.dtAddedToCart)}
            </Typography> */}
              <Typography
                sx={{
                  fontSize: "0.54rem",
                  color: "#C4C9D4",
                  lineHeight: 1,
                  mt: 0.25,
                }}
              >
                Item Delivery:{" "}
                {fmtDateTime(
                  p?.transaction_item?.transaction?.dtDelivery ??
                    "No Delivery Date Attached.",
                )}
              </Typography>
            </Box>

            <Box
              sx={{
                width: 72,
                flexShrink: 0,
                textAlign: "right",
                alignSelf: "center",
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
                {fmtPHP(p?.dUnitPrice)}
              </Typography>
            </Box>

            {/* Quantity */}
            <Box
              sx={{
                width: 44,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                ml: 4,
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
                  fontSize: "0.52rem",
                  color: "#9CA3AF",
                  lineHeight: 1,
                  mt: 0.2,
                  textTransform: "uppercase",
                }}
              >
                {p?.strUOM}
              </Typography>
            </Box>

            {/* Total */}
            <Box
              sx={{
                width: 80,
                flexShrink: 0,
                textAlign: "right",
                alignSelf: "center",
                ml: 2,
                mr: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  color: "#D85A30",
                  lineHeight: 1.2,
                }}
              >
                {fmtPHP(lineTotal)}
              </Typography>
            </Box>
            {poStatus === openCartKey && (
              <Box
                sx={{
                  width: 28,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ml: 1,
                }}
              >
                {removingOptionId === p?.nPurchaseOptionId ? (
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
                )}
              </Box>
            )}
          </Box>
        );
      })}

      {/* Total Row */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)",
        }}
      >
        <IconBox
          bg="rgba(255,255,255,0.08)"
          border="0.5px solid rgba(255,255,255,0.12)"
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#90caf9" }} />
        </IconBox>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.2,
            }}
          >
            Order Total
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.2,
            }}
          >
            {options.length} item{options.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ width: 44, flexShrink: 0 }} />
        <Box sx={{ width: 80, flexShrink: 0, textAlign: "right", pl: 1 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#FAC775",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {fmtPHP(total)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const LoadingSkeleton = () => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
    {/* Stepper skeleton */}
    <Box
      sx={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)",
        borderBottom: "0.5px solid #e2e8f0",
        px: 2,
        pt: 1.25,
        pb: 1.75,
      }}
    >
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Skeleton variant="circular" width={22} height={22} />
            <Skeleton variant="text" width="70%" height={9} />
            <Skeleton variant="text" width="50%" height={8} />
          </Box>
        ))}
      </Box>
    </Box>

    {/* HEADER WRAPPER */}
    <Box
      sx={{
        px: 2,
        pt: 2,
        pb: 1.5,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(96,165,250,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* GROUP CONTAINER */}
      <Box
        sx={{
          background:
            "linear-gradient(160deg, #1a2f4e 0%, #142540 60%, #0f1e33 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          p: 1.5,
          position: "relative",
          zIndex: 1,
          boxShadow: `
            0 8px 24px rgba(0,0,0,0.18),
            inset 0 1px 0 rgba(255,255,255,0.04)
          `,
        }}
      >
        {/* COMPANY + SUPPLIER */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 1,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {[0, 1].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                px: 1,
                py: 0.85,
                borderRadius: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  mb: 0.5,
                }}
              >
                <Skeleton
                  variant="circular"
                  width={10}
                  height={10}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                />

                <Skeleton
                  variant="text"
                  width={45}
                  height={10}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                />
              </Box>

              <Skeleton
                variant="text"
                width="80%"
                height={12}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />

              <Skeleton
                variant="text"
                width="60%"
                height={10}
                sx={{ bgcolor: "rgba(255,255,255,0.07)" }}
              />

              <Skeleton
                variant="text"
                width="45%"
                height={10}
                sx={{ bgcolor: "rgba(255,255,255,0.07)" }}
              />
            </Box>
          ))}
        </Box>
        {/* PO ROW */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Skeleton
            variant="rounded"
            width={28}
            height={28}
            sx={{
              borderRadius: "7px",
              flexShrink: 0,
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Skeleton
              variant="text"
              width="55%"
              height={14}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />

            {/* AO + count row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mt: 0.5,
              }}
            >
              <Skeleton
                variant="rounded"
                width={70}
                height={18}
                sx={{
                  borderRadius: "50px",
                  bgcolor: "rgba(255,255,255,0.08)",
                }}
              />

              <Skeleton
                variant="text"
                width={35}
                height={10}
                sx={{ bgcolor: "rgba(255,255,255,0.07)" }}
              />
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 0.625 }}>
            <Skeleton
              variant="rounded"
              width={60}
              height={24}
              sx={{
                borderRadius: "6px",
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            />

            <Skeleton
              variant="rounded"
              width={68}
              height={24}
              sx={{
                borderRadius: "6px",
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>

    {/* Divider title */}
    <Box
      sx={{
        px: 2,
        pt: 1,
        pb: 0.5,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
      }}
    >
      <Skeleton variant="text" width={35} height={10} />

      <Box
        sx={{
          flex: 1,
          height: "0.5px",
          background: "#E5E7EB",
        }}
      />
    </Box>

    {/* Items list */}
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        borderRadius: "10px",
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            px: 1.5,
            py: 0.875,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: i < 2 ? "0.5px solid #F3F4F6" : "none",
          }}
        >
          <Skeleton
            variant="rounded"
            width={34}
            height={34}
            sx={{
              borderRadius: "8px",
              flexShrink: 0,
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 0.3,
              }}
            >
              <Skeleton
                variant="rounded"
                width={30}
                height={11}
                sx={{ borderRadius: "3px" }}
              />

              <Skeleton variant="text" width={`${50 + i * 12}%`} height={13} />
            </Box>

            <Skeleton variant="text" width="45%" height={10} />
            <Skeleton variant="text" width="30%" height={9} />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 44,
            }}
          >
            <Skeleton variant="text" width={20} height={13} />
            <Skeleton variant="text" width={24} height={10} />
          </Box>

          <Box sx={{ width: 80, textAlign: "right" }}>
            <Skeleton
              variant="text"
              width="80%"
              height={13}
              sx={{ ml: "auto" }}
            />

            <Skeleton
              variant="text"
              width="55%"
              height={10}
              sx={{ ml: "auto" }}
            />
          </Box>
        </Box>
      ))}

      {/* Footer total */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)",
        }}
      >
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{
            borderRadius: "8px",
            flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />

        <Box sx={{ flex: 1 }}>
          <Skeleton
            variant="text"
            width="40%"
            height={12}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />

          <Skeleton
            variant="text"
            width="25%"
            height={10}
            sx={{ bgcolor: "rgba(255,255,255,0.07)" }}
          />
        </Box>

        <Box sx={{ width: 44, flexShrink: 0 }} />

        <Box sx={{ width: 80, textAlign: "right" }}>
          <Skeleton
            variant="text"
            width="85%"
            height={14}
            sx={{
              ml: "auto",
              bgcolor: "rgba(255,255,255,0.1)",
            }}
          />
        </Box>
      </Box>
    </Box>
  </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PurchaseCartUpdateStatusModal({
  open,
  onClose,
  currentStatus,
  openCartKey,
  closeCartKey,
  cancelCartKey,
  cancelPoKey,
  onUpdateStatus,
  onProceedToPayment,
  shippingMethod,
  paymentTerms,
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  currentUserId,
  removedFromCartKey, // ← ADD
  po,
}) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    strShippingDetails: "",
    cPaymentTerms: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [optionHistories, setOptionHistories] = useState({});
  const [historiesLoading, setHistoriesLoading] = useState(true);
  // Add this state near the other useState declarations
  const [isRemoving, setIsRemoving] = useState(false);
  useEffect(() => {
    if (open) {
      setConfirmAction(null);
      setLoading(false);
      setShowPaymentForm(false);
      setShowReview(false);
      setPaymentForm({ strShippingDetails: "", cPaymentTerms: "" });
      setPaymentLoading(false);
      setPaymentErrors({});
      setOptionHistories({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ids = (po?.purchase_order_options || [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);

    // ← also guard against empty purchaseOrderKey
    if (!ids.length || !purchaseOrderKey) {
      setHistoriesLoading(false);
      return;
    }

    setHistoriesLoading(true);
    api
      .post("purchase-item-histories/latest", { nPurchaseOptionId: ids })
      .then((res) => {
        const map = {};
        (res?.histories || []).forEach((h) => {
          map[Number(h.nPurchaseOptionId)] = h;
        });
        setOptionHistories(map);
      })
      .catch((err) => console.error("fetchOptionHistories error:", err))
      .finally(() => setHistoriesLoading(false));
  }, [open, po, purchaseOrderKey]); // ← add purchaseOrderKey here
  if (!open) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const toSlot = (key) =>
    key === openCartKey
      ? "open"
      : key === closeCartKey
        ? "close"
        : key === cancelCartKey
          ? "cancel"
          : "open";
  const options = po?.purchase_order_options || [];
  const firstOption = options[0];
  const assignedAOName = (() => {
    const u = firstOption?.purchase_option?.transaction_item?.transaction?.user;
    return u ? `${u.strNickName}`.trim() : "—";
  })();
  const total = options.reduce(
    (sum, o) =>
      sum +
      (o.purchase_option?.nQuantity || 0) *
        (o.purchase_option?.dUnitPrice || 0),
    0,
  );
  const allOptionsAtPO =
    !historiesLoading &&
    purchaseOrderKey &&
    options.length > 0 &&
    options.every(
      (opt) =>
        String(
          optionHistories[Number(opt.purchase_option?.nPurchaseOptionId)]
            ?.nStatus,
        ) === String(purchaseOrderKey),
    );
  const statusUI = STATUS_STYLES[toSlot(currentStatus)];
  const conf = confirmAction ? CONFIRM_STYLES[toSlot(confirmAction)] : null;

  const ACTION_BUTTONS = {
    [openCartKey]: [
      {
        key: closeCartKey,
        label: "Close",
        icon: <LockOutlined sx={{ fontSize: "0.65rem", color: "#4ade80" }} />,
        textColor: "#4ade80",
        bg: "rgba(34,197,94,0.15)",
        border: "rgba(34,197,94,0.3)",
        hoverBg: "rgba(34,197,94,0.25)",
        hoverBorder: "rgba(34,197,94,0.5)",
      },
      {
        key: cancelCartKey,
        label: "Cancel",
        icon: <CancelOutlined sx={{ fontSize: "0.65rem", color: "#f87171" }} />,
        textColor: "#f87171",
        bg: "rgba(239,68,68,0.15)",
        border: "rgba(239,68,68,0.3)",
        hoverBg: "rgba(239,68,68,0.25)",
        hoverBorder: "rgba(239,68,68,0.5)",
      },
    ],
    [closeCartKey]: [
      {
        key: openCartKey,
        label: "Open",
        icon: (
          <ShoppingCartOutlined
            sx={{ fontSize: "0.65rem", color: "#60a5fa" }}
          />
        ),
        textColor: "#60a5fa",
        bg: "rgba(96,165,250,0.15)",
        border: "rgba(96,165,250,0.3)",
        hoverBg: "rgba(96,165,250,0.25)",
        hoverBorder: "rgba(96,165,250,0.5)",
      },
      {
        key: cancelCartKey,
        label: "Cancel",
        icon: <CancelOutlined sx={{ fontSize: "0.65rem", color: "#f87171" }} />,
        textColor: "#f87171",
        bg: "rgba(239,68,68,0.15)",
        border: "rgba(239,68,68,0.3)",
        hoverBg: "rgba(239,68,68,0.25)",
        hoverBorder: "rgba(239,68,68,0.5)",
      },
    ],
    [cancelCartKey]: [{}],
  };
  const actionButtons = ACTION_BUTTONS[currentStatus] || [];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      await onUpdateStatus?.(confirmAction);
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const validatePayment = () => {
    const errors = {};
    if (!paymentForm.strShippingDetails)
      errors.strShippingDetails = "Shipping details is required.";
    if (!paymentForm.cPaymentTerms)
      errors.cPaymentTerms = "Payment terms is required.";
    return errors;
  };

  const handleProceedToPayment = async () => {
    const errors = validatePayment();
    if (Object.keys(errors).length) {
      setPaymentErrors(errors);
      return;
    }
    setPaymentLoading(true);
    try {
      await onProceedToPayment?.(paymentForm);
      onClose();
    } catch {
      setPaymentErrors({ general: "Failed to proceed to payment." });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleFooterCancel = () =>
    showReview
      ? setShowReview(false)
      : showPaymentForm
        ? setShowPaymentForm(false)
        : onClose();

  const saveLabel = allOptionsAtPO
    ? "Print PO" // ← was "Create Voucher"
    : showReview
      ? "Confirm & Submit"
      : showPaymentForm
        ? "Next"
        : "Proceed to PO Details";

  const onSave = allOptionsAtPO
    ? () => {
        // ← was () => {}
        sessionStorage.setItem(
          "printPO_data",
          JSON.stringify({ po, options, assignedAOName, firstOption, total }),
        );
        window.open("/print-po", "_blank");
      }
    : showReview
      ? handleProceedToPayment
      : showPaymentForm
        ? () => {
            const e = validatePayment();
            if (Object.keys(e).length) {
              setPaymentErrors(e);
              return;
            }
            setPaymentErrors({});
            setShowReview(true);
          }
        : () => setShowPaymentForm(true);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <ModalContainer
        open={open}
        handleClose={onClose}
        title="Purchase Order Cart"
        subTitle={
          po?.strPurchaseOrderNo
            ? `/ ${po.strPurchaseOrderNo}${showReview ? " / Review" : showPaymentForm ? " / PO Details" : ""}`
            : ""
        }
        contentPadding={0}
        hideActions
        showSave={
          !confirmAction && (allOptionsAtPO || currentStatus === closeCartKey)
        }
        saveLabel={saveLabel}
        onSave={onSave}
        cancelLabel={showReview || showPaymentForm ? "Back" : "Cancel"}
        onCancel={handleFooterCancel}
        disabled={historiesLoading || paymentLoading || loading || isRemoving}
      >
        {historiesLoading ? (
          <LoadingSkeleton />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* ── Confirmation View ─────────────────────────────────────────── */}
            {confirmAction && conf ? (
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
                    {po?.strPurchaseOrderNo ?? "—"}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", gap: 1, width: "100%", maxWidth: 260 }}
                >
                  <Box
                    onClick={loading ? undefined : () => setConfirmAction(null)}
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
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      No, Go Back
                    </Typography>
                  </Box>
                  <Box
                    onClick={loading ? undefined : handleConfirm}
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
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {loading ? "Updating..." : conf.confirmLabel}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : /* ── Review View ──────────────────────────────────────────────── */
            showReview ? (
              <>
                <Box
                  sx={{
                    mx: 1.5,
                    mt: 1.5,

                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    px: 1.25,
                    py: 1,
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "0.5px solid #FCD34D",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.9rem", lineHeight: 1, flexShrink: 0 }}
                  >
                    ⚠️
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.67rem",
                        fontWeight: 700,
                        color: "#92400E",
                        lineHeight: 1.2,
                        mb: 0.25,
                      }}
                    >
                      Please review all details
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        color: "#B45309",
                        lineHeight: 1.4,
                      }}
                    >
                      Make sure everything is correct before confirming. This
                      action will proceed the cart to payment.
                    </Typography>
                  </Box>
                </Box>
                <DarkHeader
                  po={po}
                  options={options}
                  assignedAOName={assignedAOName}
                  firstOption={firstOption}
                  allOptionsAtPO={allOptionsAtPO}
                  cancelCartKey={cancelCartKey}
                  total={total} // ← ADD (do this for all 3 DarkHeader usages)
                />
                <ShippingPaymentRow
                  shippingLabel={
                    shippingMethod?.[paymentForm.strShippingDetails] ??
                    paymentForm.strShippingDetails
                  }
                  paymentLabel={
                    paymentTerms?.[paymentForm.cPaymentTerms] ??
                    paymentForm.cPaymentTerms
                  }
                />
                {options.length > 0 && (
                  <>
                    <SectionLabel>Items</SectionLabel>
                    <LineItems
                      options={options}
                      total={total}
                      poStatus="" // ← hides the button in review/payment views
                    />
                  </>
                )}
                {paymentErrors.general && (
                  <Typography
                    sx={{
                      fontSize: "0.65rem",
                      color: "#dc2626",
                      textAlign: "center",
                      mb: 1.5,
                    }}
                  >
                    {paymentErrors.general}
                  </Typography>
                )}
              </>
            ) : /* ── Payment Form View ────────────────────────────────────────── */
            showPaymentForm ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  background:
                    "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  px: 2.5,
                  py: 3,
                  gap: 2.5,
                  animation: "fadeSlideIn 0.18s ease",
                  "@keyframes fadeSlideIn": {
                    from: { opacity: 0, transform: "scale(0.97)" },
                    to: { opacity: 1, transform: "scale(1)" },
                  },
                }}
              >
                {/* Payment Terms — unchanged chip buttons */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ReceiptLongOutlined
                      sx={{ fontSize: "0.75rem", color: "#16a34a" }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#374151",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      Payment Terms
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    {Object.entries(paymentTerms || {}).map(([key, lbl]) => {
                      const selected = paymentForm.cPaymentTerms === key;
                      return (
                        <Box
                          key={key}
                          onClick={() =>
                            setPaymentForm((p) => ({
                              ...p,
                              cPaymentTerms: key,
                            }))
                          }
                          sx={{
                            flex: 1,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "9px",
                            border: selected
                              ? "1.5px solid #16a34a"
                              : "0.5px solid #D1D5DB",
                            background: selected
                              ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                              : "#fff",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            boxShadow: selected
                              ? "0 2px 8px #16a34a22"
                              : "none",
                            "&:hover": {
                              borderColor: "#16a34a",
                              background: selected ? undefined : "#f0fdf4",
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: selected ? 700 : 500,
                              color: selected ? "#15803d" : "#6B7280",
                            }}
                          >
                            {lbl}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  {paymentErrors.cPaymentTerms && (
                    <Typography
                      sx={{ fontSize: "0.6rem", color: "#dc2626", mt: -0.25 }}
                    >
                      {paymentErrors.cPaymentTerms}
                    </Typography>
                  )}
                </Box>
                {/* Shipping Method */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <LocalShippingOutlined
                      sx={{ fontSize: "0.75rem", color: "#16a34a" }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#374151",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      Shipping
                    </Typography>
                  </Box>
                  <FormGrid
                    fields={[
                      {
                        name: "strShippingDetails",
                        label: "",
                        type: "textarea",
                        xs: 12,
                        multiline: true,
                        minRows: 3,
                        sx: {
                          "& textarea": {
                            resize: "vertical",
                            userSelect: "text",
                            pointerEvents: "auto",
                            backgroundColor: "#fafafa",
                            borderRadius: 2,
                            fontSize: "0.7rem",
                          },
                        },
                      },
                    ]}
                    formData={{
                      strShippingDetails: paymentForm.strShippingDetails,
                    }}
                    handleChange={(e) =>
                      setPaymentForm((p) => ({
                        ...p,
                        strShippingDetails: e.target.value,
                      }))
                    }
                    errors={{
                      strShippingDetails: paymentErrors.strShippingDetails,
                    }}
                  />
                </Box>
              </Box>
            ) : (
              /* ── Default (Main) View ──────────────────────────────────────── */
              <>
                {/* ── Cart Progress Stepper (header) ── */}
                <CartProgressStepper
                  optionHistories={optionHistories}
                  options={options}
                  addToCartKey={addToCartKey}
                  purchaseOrderKey={purchaseOrderKey}
                  paidKey={paidKey}
                  receivedKey={receivedKey}
                  deliveredKey={deliveredKey}
                  cancelPoKey={cancelPoKey}
                  cancelCartKey={cancelCartKey}
                  historiesLoading={historiesLoading}
                />

                <DarkHeader
                  po={po}
                  options={options}
                  assignedAOName={assignedAOName}
                  firstOption={firstOption}
                  actionButtons={actionButtons}
                  allOptionsAtPO={allOptionsAtPO}
                  handleUpdate={(key) => setConfirmAction(key)}
                  cancelCartKey={cancelCartKey}
                  total={total} // ← ADD (do this for all 3 DarkHeader usages)
                />
                {(currentStatus === closeCartKey || allOptionsAtPO) &&
                  (po?.strShippingDetails || po?.cPaymentTerms) && (
                    <ShippingPaymentRow
                      shippingLabel={
                        po?.strShippingDetails
                          ? (shippingMethod?.[po.strShippingDetails] ??
                            po.strShippingDetails)
                          : undefined
                      }
                      paymentLabel={
                        po?.cPaymentTerms
                          ? (paymentTerms?.[po.cPaymentTerms] ??
                            po.cPaymentTerms)
                          : undefined
                      }
                    />
                  )}

                {options.length > 0 && (
                  <>
                    <SectionLabel>Offers</SectionLabel>

                    <LineItems
                      options={options}
                      total={total}
                      openCartKey={openCartKey}
                      removedFromCartKey={removedFromCartKey} // ← ADD
                      currentUserId={currentUserId} // ← ADD
                      poStatus={currentStatus} // ← ADD
                      onRemoved={() => {
                        // just let the parent's Echo/refetch handle the UI update
                        window.dispatchEvent(
                          new CustomEvent("cart_data_updated"),
                        );
                      }}
                    />
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </ModalContainer>
    </>
  );
}
