import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import {
  CancelOutlined,
  ShoppingCartOutlined,
  HourglassEmptyOutlined,
  PaidOutlined,
  MoveToInboxOutlined,
  LocalShippingOutlined,
  CheckCircleOutlined,
} from "@mui/icons-material";
import getThemeColors from "../../../../../utils/style/getThemeColors";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";

const useColors = (c) => ({
  border: c.slate.border,
  bgCard: c.slate.outerBg,
  pipPendingBg: c.slate.mutedBg,
  pipPendingBorder: c.slate.mutedBorder,
  pipPendingDot: c.slate.outerBg,
  cancelledBg: c.red.bg,
  cancelledBorder: c.red.border,
  cancelledIcon: c.red.text,
  cancelledText: c.red.text,
  textDone: c.gray.textPrimary,
  textMuted: c.gray.textMuted,
  textSublabel: c.gray.textSecondary,
  lineBg: c.slate.mutedBg,
  glowOpacity: (isDark) => (isDark ? "0.5" : "0.65"),
  glowOpacityPulse: (isDark) => (isDark ? "0.35" : "0.55"),
});

const STEPPER_KEYFRAMES = `
  @keyframes cart-pip-pulse   { 
  0%,100%{box-shadow:0 0 0 3px var(--pip-bg) } 
  50%{box-shadow:0 0 0 5px var(--pip-bg-pulse)} 
  }
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

const STEPS = (c) => [
  {
    key: "cart",
    label: "In Cart",
    sublabel: "Queued",
    icon: <ShoppingCartOutlined sx={{ fontSize: "0.75rem" }} />,
    color: c.blue.text,
    bg: c.blue.bgSoft ?? c.blue.bg,
    border: c.blue.border,
    activeBg: c.blue.text,
  },
  {
    key: "forApproval",
    label: "For Approval",
    sublabel: "Awaiting Approval",
    icon: <HourglassEmptyOutlined sx={{ fontSize: "0.75rem" }} />,
    color: c.violet.text,
    bg: c.violet.bgSoft ?? c.violet.bg,
    border: c.violet.border,
    activeBg: c.violet.text,
  },
  {
    key: "forPayment",
    label: "For Payment",
    sublabel: "Awaiting Payment",
    icon: <PaidOutlined sx={{ fontSize: "0.75rem" }} />,
    color: c.teal.text,
    bg: c.teal.bgSoft ?? c.teal.bg,
    border: c.teal.border,
    activeBg: c.teal.text,
  },
  {
    key: "pendingReceipt",
    label: "Pending Receipt",
    sublabel: "From Supplier",
    icon: <MoveToInboxOutlined sx={{ fontSize: "0.75rem" }} />,
    color: c.cyan.text,
    bg: c.cyan.bgSoft ?? c.cyan.bg,
    border: c.cyan.border,
    activeBg: c.cyan.text,
  },
  {
    key: "forDelivery",
    label: "For Delivery",
    sublabel: "To Client",
    icon: <LocalShippingOutlined sx={{ fontSize: "0.75rem" }} />,
    color: c.orange.text,
    bg: c.orange.bgSoft ?? c.orange.bg,
    border: c.orange.border,
    activeBg: c.orange.text,
  },
  {
    key: "delivered",
    label: "Delivered",
    sublabel: "Completed",
    icon: <CheckCircleOutlined sx={{ fontSize: "0.75rem" }} />,
    color: c.green.text,
    bg: c.green.bgSoft ?? c.green.bg,
    border: c.green.border,
    activeBg: c.green.text,
  },
];

export function getCartStepIndex(
  statusVal,
  {
    cartKey,
    forApprovalKey,
    forPaymentKey,
    pendingReceiptKey,
    forDeliveryKey,
    deliveredKey,
  },
) {
  if (!statusVal) return -1;
  const s = String(statusVal);
  if (s === String(cartKey)) return 0;
  if (s === String(forApprovalKey)) return 1;
  if (s === String(forPaymentKey)) return 2;
  if (s === String(pendingReceiptKey)) return 3;
  if (s === String(forDeliveryKey)) return 4;
  if (s === String(deliveredKey)) return 5;
  return -1;
}

// ── Approved (cStatus "A") received / delivered progress across all items.
// Same rules as CartCardPanel so both always show the same numbers.
function useArrivalProgress(options) {
  const [rowsByItem, setRowsByItem] = React.useState({});

  const ids = (options || [])
    .map((o) => o.purchase_option?.nPurchaseItemId)
    .filter((id) => id != null);
  const idsKey = ids.join(",");
  const hasMovement = (options || []).some(
    (o) =>
      (o.purchase_option?.nInventoryQty || 0) > 0 ||
      (o.purchase_option?.nDeliveredQty || 0) > 0,
  );

  React.useEffect(() => {
    if (!idsKey || !hasMovement) {
      setRowsByItem({});
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const res = await InventoryAPI.getHistoryBulk(idsKey.split(",").map(Number));
        if (active) setRowsByItem(res?.rows || {});
      } catch (err) {
        console.error("Stepper progress load failed:", err);
        if (active) setRowsByItem({});
      }
    };
    load();
    window.addEventListener("inventory_data_updated", load);
    return () => {
      active = false;
      window.removeEventListener("inventory_data_updated", load);
    };
  }, [idsKey, hasMovement]);

  return React.useMemo(() => {
    const approvedSum = (rows, sign) =>
      rows
        .filter(
          (r) =>
            Math.sign(Number(r.nQuantity)) === sign &&
            String(r.cStatus || "").trim() === "A",
        )
        .reduce((s, r) => s + Math.abs(Number(r.nQuantity) || 0), 0);

    let ordered = 0,
      received = 0,
      delivered = 0;
    (options || []).forEach((o) => {
      const p = o.purchase_option;
      const q = p?.nQuantity || 0;
      const rows = rowsByItem[p?.nPurchaseItemId] || [];
      ordered += q;
      received += Math.min(approvedSum(rows, 1), q);
      delivered += Math.min(approvedSum(rows, -1), q);
    });

    const pct = (n) => (ordered > 0 ? Math.round((n / ordered) * 100) : 0);
    return {
      ordered,
      received,
      delivered,
      receivedPct: pct(received),
      deliveredPct: pct(delivered),
    };
  }, [options, rowsByItem]);
}

export default function CartProgressStepper({
  options,
  poStatus,
  cartKey,
  forApprovalKey,
  forPaymentKey,
  pendingReceiptKey,
  forDeliveryKey,
  deliveredKey,
  cancelledPOKey,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  const steps = React.useMemo(() => STEPS(base), [base]);
  const progress = useArrivalProgress(options);

  const { currentStepIndex, isCancelled } = React.useMemo(() => {
    const status = String(poStatus ?? "");
    if (status === String(cancelledPOKey))
      return { currentStepIndex: -1, isCancelled: true };
    const idx = getCartStepIndex(poStatus, {
      cartKey,
      forApprovalKey,
      forPaymentKey,
      pendingReceiptKey,
      forDeliveryKey,
      deliveredKey,
    });
    return { currentStepIndex: idx, isCancelled: false };
  }, [
    poStatus,
    cartKey,
    forApprovalKey,
    forPaymentKey,
    pendingReceiptKey,
    forDeliveryKey,
    deliveredKey,
    cancelledPOKey,
  ]);

  // Partial progress only applies to "For Delivery" (= received) and
  // "Delivered" steps, and only while strictly between 0% and 100%.
  const partialFor = (i) => {
    if (isCancelled) return null;
    if (i === 4 && progress.receivedPct > 0 && progress.receivedPct < 100)
      return {
        pct: progress.receivedPct,
        sub: `${progress.received}/${progress.ordered} rcvd`,
      };
    if (i === 5 && progress.deliveredPct > 0 && progress.deliveredPct < 100)
      return {
        pct: progress.deliveredPct,
        sub: `${progress.delivered}/${progress.ordered} dlvd`,
      };
    return null;
  };

  return (
    <Box sx={{ pt: 0.5, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", pt: 0.5 }}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;

          const isDone = !isCancelled && currentStepIndex > i;
          const isCurrent = !isDone && !isCancelled && currentStepIndex === i;
          const partial = !isDone && !isCurrent ? partialFor(i) : null;
          const isPartial = !!partial;
          const isPending =
            isCancelled || (!isDone && !isCurrent && !isPartial);
          const delay = `${i * 70}ms`;

          const glowBase = `${step.color}${c.glowOpacity(isDark).replace("0.", "")}`;
          const glowPulse = `${step.color}${c.glowOpacityPulse(isDark).replace("0.", "")}`;

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
                      ? `linear-gradient(to right, ${step.color}99, ${steps[i + 1].color}55)`
                      : c.lineBg,
                  }}
                />
              )}

              <Box
                sx={{
                  position: "relative",
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
                    isDone || isCurrent || isPartial
                      ? "cart-pip-pop 0.35s ease both"
                      : "none",
                  animationDelay: delay,
                  ...(isDone && {
                    background: step.bg,
                    border: `2px solid ${step.border}`,
                    color: step.color,
                  }),
                  ...(isCurrent && {
                    "--pip-bg": glowBase,
                    "--pip-bg-pulse": glowPulse,
                    background: step.activeBg,
                    border: `2px solid ${step.activeBg}`,
                    color: "#fff",
                    boxShadow: `0 0 0 3px ${glowBase}`,
                    animation: `cart-pip-pop 0.35s ease both, cart-pip-pulse 2.5s ease-in-out ${delay} infinite`,
                    animationDelay: delay,
                  }),
                  // Partial: progress ring (conic fill) with an inner disc,
                  // percentage text sits on top of the disc
                  ...(isPartial && {
                    background: `conic-gradient(${step.color} ${partial.pct * 3.6}deg, ${c.pipPendingBg} 0deg)`,
                    border: `2px solid ${step.border}`,
                    color: step.color,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: "2px",
                      borderRadius: "50%",
                      background: c.bgCard,
                    },
                  }),
                  ...(isPending &&
                    !isCancelled && {
                      background: c.pipPendingBg,
                      border: `2px solid ${c.pipPendingBorder}`,
                      color: c.pipPendingDot,
                    }),
                  ...(isCancelled &&
                    i === 0 && {
                      background: c.cancelledBg,
                      border: `2px solid ${c.cancelledBorder}`,
                      color: c.cancelledIcon,
                    }),
                  ...(isCancelled &&
                    i > 0 && {
                      background: c.pipPendingBg,
                      border: `2px solid ${c.pipPendingBorder}`,
                      color: c.pipPendingDot,
                    }),
                }}
              >
                {isCancelled && i === 0 ? (
                  <CancelOutlined sx={{ fontSize: "0.78rem" }} />
                ) : isPartial ? (
                  <Typography
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      fontSize: "0.38rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      color: step.color,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {partial.pct}%
                  </Typography>
                ) : isDone || isCurrent ? (
                  step.icon
                ) : (
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: c.pipPendingDot,
                    }}
                  />
                )}
              </Box>

              <Typography
                sx={{
                  fontSize: "0.56rem",
                  fontWeight: isCurrent || isPartial ? 700 : isDone ? 600 : 400,
                  color:
                    isCancelled && i === 0
                      ? c.cancelledText
                      : isCurrent || isPartial
                        ? step.color
                        : isDone
                          ? c.textDone
                          : c.textMuted,
                  textAlign: "center",
                  lineHeight: 1.3,
                  px: 0.25,
                }}
              >
                {step.label}
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.5rem",
                  color: isPending && !isCancelled ? c.border : c.textSublabel,
                  textAlign: "center",
                  lineHeight: 1.2,
                  mt: 0.15,
                  px: 0.25,
                }}
              >
                {isCancelled && i === 0
                  ? "Cancelled"
                  : isPartial
                    ? partial.sub
                    : step.sublabel}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}