import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import { resolveProfileImage } from "../../../../../utils/helpers/profileImage";
import {
  Box,
  Typography,
  Skeleton,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  StoreOutlined,
  ExpandMore,
  ExpandLess,
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  PaidOutlined,
  LocalShippingOutlined,
  MoveToInboxOutlined,
} from "@mui/icons-material";
import api from "../../../../../utils/api/api.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
};

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "addToCart",
    label: "Added to Cart",
    sublabel: "Queued",
    icon: <ShoppingCartOutlined sx={{ fontSize: "0.8rem" }} />,
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#93c5fd",
  },
  {
    key: "purchaseOrder",
    label: "Purchase Order",
    sublabel: "P.O. Issued",
    icon: <ReceiptLongOutlined sx={{ fontSize: "0.8rem" }} />,
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
  {
    key: "paid",
    label: "Paid",
    sublabel: "Payment Done",
    icon: <PaidOutlined sx={{ fontSize: "0.8rem" }} />,
    color: "#0f766e",
    bg: "#ccfbf1",
    border: "#5eead4",
  },
  {
    key: "received",
    label: "Received",
    sublabel: "From Supplier",
    icon: <MoveToInboxOutlined sx={{ fontSize: "0.8rem" }} />,
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#7dd3fc",
  },
  {
    key: "delivered",
    label: "Delivered",
    sublabel: "To Client",
    icon: <LocalShippingOutlined sx={{ fontSize: "0.8rem" }} />,
    color: "#15803d",
    bg: "#dcfce7",
    border: "#86efac",
  },
];

const stepIndexByKey = (statusKey, keys) => {
  if (!statusKey) return -1;
  const s = String(statusKey);
  if (s === String(keys.addToCartKey)) return 0;
  if (s === String(keys.purchaseOrderKey)) return 1;
  if (s === String(keys.paidKey)) return 2;
  if (s === String(keys.receivedKey)) return 3;
  if (s === String(keys.deliveredKey)) return 4;
  return -1;
};

// ── Keyframe injection (once) ─────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes pip-pulse   { 0%,100%{box-shadow:0 0 0 3px var(--pip-bg)} 50%{box-shadow:0 0 0 5px var(--pip-bg)} }
  @keyframes pip-pop     { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes pip-fadein  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pip-line    { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1);transform-origin:left} }
`;
if (typeof document !== "undefined" && !document.getElementById("pip-kf")) {
  const s = document.createElement("style");
  s.id = "pip-kf";
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

// ── HorizontalProgressTracker ─────────────────────────────────────────────────
function HorizontalProgressTracker({
  history,
  statusKeys,
  loading,
  allHistories,
}) {
  const currentIndex = history
    ? stepIndexByKey(history.nStatus, statusKeys)
    : -1;

  const isCancelled =
    history &&
    (String(history.nStatus) === String(statusKeys.cancelCartKey) ||
      String(history.nStatus) === String(statusKeys.cancelPoKey));

  const cancelledIndexes = new Set(
    (allHistories || [])
      .filter(
        (h) =>
          String(h.nStatus) === String(statusKeys.cancelCartKey) ||
          String(h.nStatus) === String(statusKeys.cancelPoKey),
      )
      .map((h) =>
        String(h.nStatus) === String(statusKeys.cancelCartKey)
          ? stepIndexByKey(statusKeys.addToCartKey, statusKeys)
          : stepIndexByKey(statusKeys.purchaseOrderKey, statusKeys),
      ),
  );

  if (loading) {
    return (
      <Box sx={{ px: 2, py: 1.5, borderTop: "0.5px solid #f0f4f8" }}>
        <Skeleton width={90} height={10} sx={{ mb: 1.5 }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          {STEPS.map((_, i) => (
            <Skeleton key={i} variant="circular" width={26} height={26} />
          ))}
        </Box>
      </Box>
    );
  }

  if (currentIndex === -1 && !isCancelled && cancelledIndexes.size === 0)
    return null;

  const displayIndex = isCancelled
    ? String(history.nStatus) === String(statusKeys.cancelCartKey)
      ? stepIndexByKey(statusKeys.addToCartKey, statusKeys)
      : stepIndexByKey(statusKeys.purchaseOrderKey, statusKeys)
    : currentIndex;

  return (
    <Box
      sx={{
        borderTop: "0.5px solid #f0f4f8",
        background: "linear-gradient(135deg,#fafbff 0%,#f8fafc 100%)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Purchase Progress
        </Typography>
        {!isCancelled && displayIndex >= 0 && (
          <Typography
            sx={{
              fontSize: "0.55rem",
              color: "text.disabled",
              fontStyle: "italic",
            }}
          >
            Step {displayIndex + 1} of 5
          </Typography>
        )}
      </Box>

      {/* Steps */}
      <Box
        sx={{ px: 1.5, pb: 2.25, display: "flex", alignItems: "flex-start" }}
      >
        {STEPS.map((step, i) => {
          const isDone = i < displayIndex;
          const isCurrent = i === displayIndex;
          const isPending = i > displayIndex;
          const isLast = i === STEPS.length - 1;
          const isCancelled = cancelledIndexes.has(i);
          const delay = `${i * 80}ms`;

          return (
            <Box
              key={step.key}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                animation: `pip-fadein 0.35s ease both`,
                animationDelay: delay,
              }}
            >
              {/* Connector line */}
              {!isLast && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 13,
                    left: "50%",
                    width: "100%",
                    height: 2,
                    borderRadius: "2px",
                    zIndex: 0,
                    background: isDone
                      ? `linear-gradient(to right, ${step.color}88, ${STEPS[i + 1].color}44)`
                      : "#e2e8f0",
                    ...(isDone && {
                      animation: "pip-line 0.4s ease both",
                      animationDelay: delay,
                    }),
                  }}
                />
              )}

              {/* Circle */}
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                  mb: 0.5,
                  animation:
                    isDone || isCurrent ? `pip-pop 0.35s ease both` : "none",
                  animationDelay: delay,
                  ...(isDone && {
                    background: step.bg,
                    border: `2px solid ${step.border}`,
                    color: step.color,
                  }),
                  ...(isCurrent && {
                    "--pip-bg": step.bg,
                    background: isCancelled ? "#fee2e2" : step.color,
                    border: `2px solid ${isCancelled ? "#fca5a5" : step.color}`,
                    color: "#fff",
                    animation: `pip-pop 0.35s ease both, pip-pulse 2s ease-in-out ${delay} infinite`,
                    animationDelay: delay,
                  }),
                  ...(isPending && {
                    background: "#f1f5f9",
                    border: "2px solid #e2e8f0",
                    color: "#cbd5e1",
                  }),
                }}
              >
                {isDone || isCurrent ? (
                  step.icon
                ) : (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#cbd5e1",
                    }}
                  />
                )}
              </Box>

              {/* Label */}
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                  color:
                    isCancelled && isCurrent
                      ? "#b91c1c"
                      : isCurrent
                        ? step.color
                        : isDone
                          ? "text.primary"
                          : "text.disabled",
                  textAlign: "center",
                  lineHeight: 1.3,
                  px: 0.25,
                  animation: `pip-fadein 0.3s ease both`,
                  animationDelay: `${i * 80 + 60}ms`,
                }}
              >
                {step.label}
              </Typography>

              {/* Sublabel / date */}
              <Typography
                sx={{
                  fontSize: "0.52rem",
                  color: isPending ? "#e2e8f0" : "text.disabled",
                  textAlign: "center",
                  lineHeight: 1.2,
                  mt: 0.15,
                  px: 0.25,
                }}
              >
                {isCurrent && history?.dtOccur
                  ? fmtDate(history.dtOccur)
                  : step.sublabel}
              </Typography>

              {/* Cancelled badge */}
              {isCancelled && (
                <Box
                  sx={{
                    mt: 0.4,
                    px: 0.5,
                    py: 0.15,
                    borderRadius: "3px",
                    background: "#fff0f0",
                    border: "0.5px solid #fca5a5",
                    animation: "pip-pop 0.3s ease both",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.45rem",
                      fontWeight: 700,
                      color: "#b91c1c",
                      lineHeight: 1,
                    }}
                  >
                    Cancelled
                  </Typography>
                </Box>
              )}

              {i === 0 &&
                !isCancelled &&
                isCurrent &&
                String(history?.nStatus) === String(statusKeys.addToCartKey) &&
                history?.cStatus &&
                (() => {
                  const cs = String(history.cStatus);
                  const isOpen = cs === String(statusKeys.openCartKey);
                  const isClosed = cs === String(statusKeys.closeCartKey);
                  const isCancCart = cs === String(statusKeys.cancelCartKey);
                  if (!isOpen && !isClosed && !isCancCart) return null;
                  const badge = isOpen
                    ? {
                        bg: "#eff6ff",
                        border: "#93c5fd",
                        color: "#1d4ed8",
                        label: "Open",
                      }
                    : isClosed
                      ? {
                          bg: "#f0fdf4",
                          border: "#86efac",
                          color: "#15803d",
                          label: "Closed",
                        }
                      : {
                          bg: "#fff0f0",
                          border: "#fca5a5",
                          color: "#b91c1c",
                          label: "Cancelled",
                        };
                  return (
                    <Box
                      sx={{
                        mt: 0.4,
                        px: 0.5,
                        py: 0.15,
                        borderRadius: "3px",
                        background: badge.bg,
                        border: `0.5px solid ${badge.border}`,
                        animation: "pip-pop 0.3s ease both",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.45rem",
                          fontWeight: 700,
                          color: badge.color,
                          lineHeight: 1,
                        }}
                      >
                        Cart: {badge.label}
                      </Typography>
                    </Box>
                  );
                })()}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── OptionCard ────────────────────────────────────────────────────────────────
function OptionCard({ option, statusKeys, initialHistory, allHistories }) {
  const [history, setHistory] = useState(initialHistory ?? null);
  const [historyLoading, setHistoryLoading] = useState(
    initialHistory === undefined,
  );
  const [specsOpen, setSpecsOpen] = useState(false);

  const qty = Number(option.nQuantity ?? 0);
  const unitPrice = Number(option.dUnitPrice ?? 0);
  const total = qty * unitPrice;
  const uom = option.strUOM || option.strUnit || "";
  const isIncluded = Number(option.bPurchaseIncluded) === 1;
  const isAddOn = Number(option.bAddOn) === 1;
  const hasSpecs = !!(
    option.strSpecs?.trim() && option.strSpecs.trim() !== "<p></p>"
  );

  useEffect(() => {
    if (initialHistory !== undefined) return;
    let cancelled = false;
    setHistoryLoading(true);
    api
      .get(
        `purchase-item-histories/latest-purchase-history/${option.nPurchaseOptionId}`,
      )
      .then((res) => {
        if (!cancelled) setHistory(res?.success && res?.data ? res.data : null);
      })
      .catch(() => {
        if (!cancelled) setHistory(null);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [option.nPurchaseOptionId, initialHistory]);

  return (
    <Box
      sx={{
        overflow: "hidden",
        background: isIncluded ? "#fafeff" : "#ffffff",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
      }}
    >
      {/* Main row */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "6px",
            background: isAddOn ? "#f0fdf4" : "#f3f4f6",
            border: "0.5px solid",
            borderColor: isAddOn ? "#bbf7d0" : "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1rem",
          }}
        >
          {isAddOn ? "➕" : "📦"}
        </Box>

        {/* Name / supplier */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "text.primary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {option.strBrand || option.strModel
                ? [option.strBrand, option.strModel].filter(Boolean).join(" · ")
                : "No brand/model"}
            </Typography>
            {isAddOn && (
              <Box
                sx={{
                  fontSize: "0.52rem",
                  px: 0.5,
                  py: 0.1,
                  borderRadius: "4px",
                  background: "#e8f5e9",
                  border: "0.5px solid #c8e6c9",
                  color: "#2E7D32",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Add-on
              </Box>
            )}
          </Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.25 }}
          >
            <StoreOutlined
              sx={{ fontSize: "0.62rem", color: "text.disabled" }}
            />
            <Typography sx={{ fontSize: "0.6rem", color: "text.secondary" }}>
              {option.supplierNickName ||
                option.strSupplierNickName ||
                option.supplierName ||
                "—"}
            </Typography>
          </Box>
        </Box>

        {/* Qty */}
        <Box sx={{ textAlign: "center", flexShrink: 0, minWidth: 36 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            {qty}
          </Typography>
          {uom && (
            <Typography
              sx={{
                fontSize: "0.52rem",
                color: "text.disabled",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.2,
              }}
            >
              {uom}
            </Typography>
          )}
        </Box>

        {/* Price */}
        <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#D85A30" }}
          >
            ₱ {fmt(total)}
          </Typography>
          <Typography sx={{ fontSize: "0.57rem", color: "text.secondary" }}>
            ₱{fmt(unitPrice)} / unit
          </Typography>
        </Box>

        {/* Specs toggle */}
        {hasSpecs && (
          <Tooltip
            title={specsOpen ? "Hide specs" : "View specs"}
            placement="top"
          >
            <IconButton
              size="small"
              onClick={() => setSpecsOpen((v) => !v)}
              sx={{
                width: 24,
                height: 24,
                border: "0.5px solid",
                borderColor: specsOpen ? "#93c5fd" : "divider",
                borderRadius: "5px",
                color: specsOpen ? "#1d4ed8" : "text.disabled",
                background: specsOpen ? "#eff6ff" : "transparent",
                flexShrink: 0,
                "&:hover": {
                  background: "#eff6ff",
                  borderColor: "#93c5fd",
                  color: "#1d4ed8",
                },
              }}
            >
              {specsOpen ? (
                <ExpandLess sx={{ fontSize: "0.8rem" }} />
              ) : (
                <ExpandMore sx={{ fontSize: "0.8rem" }} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Specs panel */}
      <Collapse in={specsOpen}>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "0.5px solid #e0f2fe",
            background: "#f4faff",
            fontSize: "0.77rem",
            color: "text.secondary",
            maxHeight: 180,
            overflowY: "auto",
            "& *": { backgroundColor: "transparent !important" },
            "& ul": { paddingLeft: 2, margin: 0, listStyleType: "disc" },
            "& ol": { paddingLeft: 2, margin: 0, listStyleType: "decimal" },
            "& li": { marginBottom: "2px" },
            wordBreak: "break-word",
            lineHeight: 1.65,
          }}
          dangerouslySetInnerHTML={{
            __html: option.strSpecs || "No specifications available.",
          }}
        />
      </Collapse>

      {/* Progress tracker */}
      <HorizontalProgressTracker
        history={history}
        statusKeys={statusKeys}
        loading={historyLoading}
        allHistories={allHistories}
      />
    </Box>
  );
}

// ── PurchaseItemInfoModal ─────────────────────────────────────────────────────
export default function PurchaseItemInfoModal({
  open,
  onClose,
  item,
  option,
  addToCartKey,
  cancelPoKey,
  cancelCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  openCartKey, // ← ADD
  closeCartKey, // ← ADD
  knownHistories = {},
  allHistories = null,
  onFetchAllHistory,
}) {
  useEffect(() => {
    if (open && option?.nPurchaseOptionId && !allHistories)
      onFetchAllHistory?.();
  }, [open, option?.nPurchaseOptionId]);

  if (!open || !item || !option) return null;

  const statusKeys = {
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    cancelPoKey,
    cancelCartKey,
    openCartKey,
    closeCartKey,
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Option Details"
      subTitle={
        item.nItemNumber ? `/ ${option.strBrand} - ${option.strModel}` : ""
      }
      contentPadding={0}
      hideActions
      showSave={false}
    >
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}
      >
        <OptionCard
          option={option}
          statusKeys={statusKeys}
          initialHistory={knownHistories[option.nPurchaseOptionId]}
          allHistories={allHistories}
        />
      </Box>
    </ModalContainer>
  );
}
