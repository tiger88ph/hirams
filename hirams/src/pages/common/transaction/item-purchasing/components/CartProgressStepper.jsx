import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Skeleton } from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import { CART_STEPS_STYLES } from "../../../../../utils/style/cartStepsStyles";
import getThemeColors from "../../../../../utils/style/getThemeColors";

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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

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

  const { receivedPct, deliveredPct } = React.useMemo(() => {
    let totalOrdered = 0,
      totalReceived = 0,
      totalDelivered = 0;
    for (const opt of options) {
      const p = opt.purchase_option;
      const ordered = p?.nQuantity || 0;
      if (ordered === 0) continue;
      totalOrdered += ordered;
      totalReceived += Math.min(p?.nInventoryQty || 0, ordered);
      totalDelivered += Math.min(p?.nDeliveredQty || 0, ordered);
    }
    return {
      receivedPct:
        totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0,
      deliveredPct:
        totalOrdered > 0
          ? Math.round((totalDelivered / totalOrdered) * 100)
          : 0,
    };
  }, [options]);

  if (historiesLoading) {
    return (
      <Box
        sx={{
          background: c.bgCard,
          borderBottom: `0.5px solid ${c.border}`,
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
          {CART_STEPS_STYLES.map((_, i) => (
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
    <Box sx={{ pt: 0.5, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", pt: 0.5 }}>
        {CART_STEPS_STYLES.map((step, i) => {
          const isLast = i === CART_STEPS_STYLES.length - 1;
          const totalItems = stepIndices.length;
          const itemsAtThisStep = stepIndices.filter((idx) => idx === i).length;
          const itemsPastThisStep = stepIndices.filter((idx) => idx > i).length;

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
                      ? `linear-gradient(to right, ${step.color}99, ${CART_STEPS_STYLES[i + 1].color}55)`
                      : c.lineBg,
                  }}
                />
              )}

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
                    "--pip-bg": glowBase,
                    "--pip-bg-pulse": glowPulse,
                    background: step.activeBg,
                    border: `2px solid ${step.activeBg}`,
                    color: "#fff",
                    boxShadow: `0 0 0 3px ${glowBase}`,
                    animation: `cart-pip-pop 0.35s ease both, cart-pip-pulse 2.5s ease-in-out ${delay} infinite`,
                    animationDelay: delay,
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
                ) : isPartialActive ? (
                  <Typography
                    sx={{
                      fontSize: "0.50rem",
                      fontWeight: 600,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {i === 3 ? receivedPct : deliveredPct}%
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
                  fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                  color:
                    isCancelled && i === 0
                      ? c.cancelledText
                      : isCurrent
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
                {isCancelled && i === 0 ? "Cancelled" : step.sublabel}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
