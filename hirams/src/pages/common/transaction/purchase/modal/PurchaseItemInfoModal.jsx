import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
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
import PurchaseItemHistoriesAPI from "../../../../../api/endpoints/purchase-item-histories.api.js";
import { fmtDate, fmtPHP } from "../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  borderLight: c.slate.borderLight,
  borderRow: c.slate.borderRow,
  mutedBorder: c.slate.mutedBorder,
  innerBg: c.slate.innerBg,
  outerBg: c.slate.outerBg,
  btnBg: c.slate.btnBg,
  mutedBg: c.slate.mutedBg,
  hover: c.slate.hover,
  scrollbarThumb: c.slate.scrollbarThumb,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  blue: c.blue,
  violet: c.violet,
  teal: c.teal,
  cyan: c.cyan,
  green: c.green,
  red: c.red,
  orange: c.orange,
});

const STEPS = [
  {
    key: "addToCart",
    label: "Added to Cart",
    sublabel: "Queued",
    icon: <ShoppingCartOutlined sx={{ fontSize: "0.8rem" }} />,
    accent: "blue",
  },
  {
    key: "purchaseOrder",
    label: "Purchase Order",
    sublabel: "P.O. Issued",
    icon: <ReceiptLongOutlined sx={{ fontSize: "0.8rem" }} />,
    accent: "violet",
  },
  {
    key: "paid",
    label: "Paid",
    sublabel: "Payment Done",
    icon: <PaidOutlined sx={{ fontSize: "0.8rem" }} />,
    accent: "teal",
  },
  {
    key: "received",
    label: "Received",
    sublabel: "From Supplier",
    icon: <MoveToInboxOutlined sx={{ fontSize: "0.8rem" }} />,
    accent: "cyan",
  },
  {
    key: "delivered",
    label: "Delivered",
    sublabel: "To Client",
    icon: <LocalShippingOutlined sx={{ fontSize: "0.8rem" }} />,
    accent: "green",
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

function HorizontalProgressTracker({
  history,
  statusKeys,
  loading,
  allHistories,
  option,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

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

  const ordered = Number(option?.nQuantity || 0);
  const received = Math.min(Number(option?.nInventoryQty || 0), ordered);
  const delivered = Math.min(Number(option?.nDeliveredQty || 0), ordered);
  const receivedPct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
  const deliveredPct =
    ordered > 0 ? Math.round((delivered / ordered) * 100) : 0;
  const isReceivedPartial = received > 0 && received < ordered;
  const isDeliveredPartial = delivered > 0 && delivered < ordered;

  if (loading) {
    return (
      <Box sx={{ px: 2, py: 1.5, borderTop: `0.5px solid ${c.borderRow}` }}>
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
        borderTop: `0.5px solid ${c.borderRow}`,
        background: isDark
          ? "linear-gradient(135deg,#1e293b 0%,#1e293b 100%)"
          : "linear-gradient(135deg,#fafbff 0%,#f8fafc 100%)",
      }}
    >
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
            color: c.textSecondary,
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
              color: c.textDisabled,
              fontStyle: "italic",
            }}
          >
            Step {displayIndex + 1} of 5
          </Typography>
        )}
      </Box>
      <Box
        sx={{ px: 1.5, pb: 2.25, display: "flex", alignItems: "flex-start" }}
      >
        {STEPS.map((step, i) => {
          const accent = c[step.accent];
          const isDone = i < displayIndex;
          const isCurrent = i === displayIndex;
          const isPending = i > displayIndex;
          const isLast = i === STEPS.length - 1;
          const isCancelledStep = cancelledIndexes.has(i);
          const delay = `${i * 80}ms`;
          const isPartialActive =
            (i === 3 && isReceivedPartial) || (i === 4 && isDeliveredPartial);
          const effectiveIsCurrent = isCurrent || isPartialActive;

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
                      ? `linear-gradient(to right, ${accent.border}, ${c.borderLight})`
                      : c.borderLight,
                    ...(isDone && {
                      animation: "pip-line 0.4s ease both",
                      animationDelay: delay,
                    }),
                  }}
                />
              )}
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
                    isDone || effectiveIsCurrent
                      ? `pip-pop 0.35s ease both`
                      : "none",
                  animationDelay: delay,
                  ...(isDone && {
                    background: accent.bgSoft,
                    border: `2px solid ${accent.border}`,
                    color: accent.text,
                  }),
                  ...(effectiveIsCurrent && {
                    "--pip-bg": accent.bgSoft,
                    background: isCancelledStep ? c.red.bg : accent.text,
                    border: `2px solid ${isCancelledStep ? c.red.borderStrong : accent.text}`,
                    color: "#fff",
                    animation: `pip-pop 0.35s ease both, pip-pulse 2s ease-in-out ${delay} infinite`,
                    animationDelay: delay,
                  }),
                  ...(isPending &&
                    !effectiveIsCurrent && {
                      background: c.btnBg,
                      border: `2px solid ${c.mutedBorder}`,
                      color: c.scrollbarThumb,
                    }),
                }}
              >
                {isPartialActive ? (
                  <Typography
                    sx={{
                      fontSize: "0.58rem",
                      fontWeight: 600,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {i === 3 ? receivedPct : deliveredPct}%
                  </Typography>
                ) : isDone || effectiveIsCurrent ? (
                  step.icon
                ) : (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: c.scrollbarThumb,
                    }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  fontWeight: effectiveIsCurrent ? 700 : isDone ? 600 : 400,
                  color:
                    isCancelledStep && effectiveIsCurrent
                      ? c.red.textDark
                      : effectiveIsCurrent
                        ? accent.text
                        : isDone
                          ? c.textPrimary
                          : c.textDisabled,
                  textAlign: "center",
                  lineHeight: 1.3,
                  px: 0.25,
                  animation: `pip-fadein 0.3s ease both`,
                  animationDelay: `${i * 80 + 60}ms`,
                }}
              >
                {step.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.52rem",
                  color:
                    isPending && !effectiveIsCurrent
                      ? c.borderLight
                      : c.textDisabled,
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

              {isCancelledStep && (
                <Box
                  sx={{
                    mt: 0.4,
                    px: 0.5,
                    py: 0.15,
                    borderRadius: "3px",
                    background: c.red.bgSoft,
                    border: `0.5px solid ${c.red.border}`,
                    animation: "pip-pop 0.3s ease both",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.45rem",
                      fontWeight: 700,
                      color: c.red.textDark,
                      lineHeight: 1,
                    }}
                  >
                    Cancelled
                  </Typography>
                </Box>
              )}

              {i === 0 &&
                !isCancelledStep &&
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
                        bg: c.blue.bgSoft,
                        border: c.blue.border,
                        color: c.blue.text,
                        label: "Open",
                      }
                    : isClosed
                      ? {
                          bg: c.green.bgSoft,
                          border: c.green.border,
                          color: c.green.text,
                          label: "Closed",
                        }
                      : {
                          bg: c.red.bgSoft,
                          border: c.red.border,
                          color: c.red.textDark,
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

function OptionCard({ option, statusKeys, initialHistory, allHistories }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

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
    PurchaseItemHistoriesAPI.getLatestForOption(option.nPurchaseOptionId)
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
        background: isDark
          ? isIncluded
            ? c.cyan.bgSoft
            : c.innerBg
          : isIncluded
            ? c.cyan.bgSoft
            : c.outerBg,
        transition: "box-shadow 0.15s",
        "&:hover": {
          boxShadow: isDark
            ? "0 1px 6px rgba(0,0,0,0.35)"
            : "0 1px 6px rgba(0,0,0,0.06)",
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "6px",
            background: isAddOn ? c.green.bg : c.mutedBg,
            border: "0.5px solid",
            borderColor: isAddOn ? c.green.border : c.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1rem",
          }}
        >
          {isAddOn ? "➕" : "📦"}
        </Box>

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
                color: c.textPrimary,
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
                  background: c.green.bgSoft,
                  border: "0.5px solid",
                  borderColor: c.green.border,
                  color: c.green.text,
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
              sx={{ fontSize: "0.62rem", color: c.textDisabled }}
            />
            <Typography sx={{ fontSize: "0.6rem", color: c.textSecondary }}>
              {option.supplierNickName ||
                option.strSupplierNickName ||
                option.supplierName ||
                "—"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", flexShrink: 0, minWidth: 36 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: c.textPrimary,
              lineHeight: 1.2,
            }}
          >
            {qty}
          </Typography>
          {uom && (
            <Typography
              sx={{
                fontSize: "0.52rem",
                color: c.textDisabled,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.2,
              }}
            >
              {uom}
            </Typography>
          )}
        </Box>

        <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, color: c.orange.text }}
          >
            ₱ {fmtPHP(total)}
          </Typography>
          <Typography sx={{ fontSize: "0.57rem", color: c.textSecondary }}>
            ₱{fmtPHP(unitPrice)} / unit
          </Typography>
        </Box>

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
                borderColor: specsOpen ? c.blue.borderStrong : c.border,
                borderRadius: "5px",
                color: specsOpen ? c.blue.text : c.textDisabled,
                background: specsOpen ? c.blue.bg : "transparent",
                flexShrink: 0,
                "&:hover": {
                  background: c.blue.bg,
                  borderColor: c.blue.borderStrong,
                  color: c.blue.text,
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

      <Collapse in={specsOpen}>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "0.5px solid",
            borderColor: c.cyan.border,
            background: c.cyan.bgSoft,
            fontSize: "0.77rem",
            color: c.textSecondary,
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

      <HorizontalProgressTracker
        history={history}
        statusKeys={statusKeys}
        loading={historyLoading}
        allHistories={allHistories}
        option={option}
      />
    </Box>
  );
}

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
  openCartKey,
  closeCartKey,
  knownHistories = {},
  allHistories = null,
  onFetchAllHistory,
  purchaseOrder,
  readOnly,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  useEffect(() => {
    if (open && option?.nPurchaseOptionId && !allHistories)
      onFetchAllHistory?.();
  }, [open, option?.nPurchaseOptionId, allHistories, onFetchAllHistory]);

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

  const handleViewCart = () => {
    const poId =
      option?.nPurchaseOrderId ||
      purchaseOrder?.nPurchaseOrderId ||
      item?.nPurchaseOrderId;
    if (poId) {
      const optionId = option?.nPurchaseOptionId;
      const status = knownHistories?.[optionId]?.nStatus;
      const isArrived =
        String(status) === String(paidKey) ||
        String(status) === String(receivedKey) ||
        String(status) === String(deliveredKey);
      navigate(
        `/purchase-cart-update?id=${poId}${isArrived ? `&optionId=${optionId}` : ""}`,
      );
    } else {
      console.warn("PurchaseItemInfoModal: No PO ID available to navigate");
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Option Details"
      subTitle={
        item.nItemNumber ? `${option.strBrand} - ${option.strModel}` : ""
      }
      contentPadding={0}
      showSave={readOnly ? false : true}
      saveLabel="View Cart"
      onSave={handleViewCart}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
          bgcolor: c.outerBg,
        }}
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
