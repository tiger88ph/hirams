import React from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import {
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  FileDownloadOutlined,
  LocalShippingOutlined,
  Inventory2Outlined,
  CancelOutlined,
} from "@mui/icons-material";

export const CART_STEPS = [
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

export function getCartStepIndex(
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

export default function CartProgressStepper({
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
  // ── Per-item step indices ─────────────────────────────────────────────────
  const { stepIndices, isCancelled } = React.useMemo(() => {
    if (!options.length) return { stepIndices: [], isCancelled: false };

    const indices = [];
    let cancelled = false;

    for (const opt of options) {
      const id = Number(opt.purchase_option?.nPurchaseOptionId);
      const h = optionHistories[id];
      const statusVal = h?.nStatus;

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

      indices.push(idx === -1 ? 0 : idx);
    }

    return { stepIndices: indices, isCancelled: cancelled };
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

  // Replace your overallPct useMemo with this:
  const { receivedPct, deliveredPct, hasAnyPartial } = React.useMemo(() => {
    let totalOrdered = 0;
    let totalReceived = 0;
    let totalDelivered = 0;
    let anyPartial = false;

    for (const opt of options) {
      const p = opt.purchase_option;
      const ordered = p?.nQuantity || 0;
      const received = Math.min(p?.nInventoryQty || 0, ordered);
      const delivered = Math.min(p?.nDeliveredQty || 0, ordered);

      if (ordered === 0) continue;

      totalOrdered += ordered;
      totalReceived += received;
      totalDelivered += delivered;

      if (
        (received > 0 && received < ordered) ||
        (delivered > 0 && delivered < ordered)
      )
        anyPartial = true;
    }

    const rPct =
      totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    const dPct =
      totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;

    return { receivedPct: rPct, deliveredPct: dPct, hasAnyPartial: anyPartial };
  }, [options]);
  // ── Loading skeleton ──────────────────────────────────────────────────────
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
      <Box sx={{ display: "flex", alignItems: "flex-start", pt: 2 }}>
        {CART_STEPS.map((step, i) => {
          const isLast = i === CART_STEPS.length - 1;
          const totalItems = stepIndices.length;
          const itemsAtThisStep = stepIndices.filter((idx) => idx === i).length;
          const itemsPastThisStep = stepIndices.filter((idx) => idx > i).length;

          // ── Partial qty logic — only for received (3) and delivered (4) ──
          let isPartialActive = false;

          if (i === 3) {
            const anyReceived = options.some(
              (o) => (o.purchase_option?.nInventoryQty || 0) > 0,
            );
            const allFullyReceived = options.every(
              (o) =>
                (o.purchase_option?.nInventoryQty || 0) >=
                (o.purchase_option?.nQuantity || 0),
            );
            if (anyReceived && !allFullyReceived) isPartialActive = true;
          }

          if (i === 4) {
            const anyDelivered = options.some(
              (o) => (o.purchase_option?.nDeliveredQty || 0) > 0,
            );
            const allFullyDelivered = options.every(
              (o) =>
                (o.purchase_option?.nDeliveredQty || 0) >=
                (o.purchase_option?.nQuantity || 0),
            );
            if (anyDelivered && !allFullyDelivered) isPartialActive = true;
          }

          const isDone =
            !isPartialActive &&
            !isCancelled &&
            itemsPastThisStep === totalItems &&
            totalItems > 0;

          const isCurrent =
            isPartialActive || (!isDone && !isCancelled && itemsAtThisStep > 0);

          const isPending = isCancelled || (!isDone && !isCurrent);

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

              {/* Circle pip */}
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
                ) : // Inside the pip content where you render the percentage:
                isPartialActive ? (
                  <Typography
                    sx={{
                      fontSize: "0.50rem",
                      fontWeight: 600,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {i === 3 ? receivedPct : deliveredPct}% {/* 👈 key fix */}
                  </Typography>
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
