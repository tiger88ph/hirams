import React, { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Paper, Typography, Checkbox } from "@mui/material";
import {
  Edit,
  Delete,
  ExpandLess,
  CompareArrows,
  AddShoppingCart,
  RemoveShoppingCart,
  Visibility,
  ShoppingCart,
} from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BaseButton from "../../../../../components/form/BaseButton";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import PurchaseItemInfoModal from "../../purchase/modal/PurchaseItemInfoModal";
import getThemeColors from "../../../../../utils/style/getThemeColors";
import { fmtPHP } from "../../../../../utils/formatters/formatter.js";
import MiniBaseButton from "../../../../../components/form/MiniBaseButton";

// ── PROMPT 1 — inline color map, only tokens this component uses ──
const useColors = (c) => ({
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  errorText: c.red.text,
  errorTooltipBg: c.slate.mutedBg,
  rowBg: c.slate.outerBg,
  rowHoverBg: c.slate.hover,
  rowBorder: c.slate.border,
  rowDisabledBg: c.slate.mutedBg,
  specsBodyBg: c.slate.outerBg,
  specsBorder: c.slate.mutedBorder,
  connectorLine: c.slate.divider,
  actionBtnBg: c.slate.outerBg,
  actionBtnBorder: c.slate.border,
  actionBtnText: c.blue.text,
  addOnGreen: c.green.text,
  // purchase-mode additions
  voidColor: c.red.text,
  voidBg: c.red.bg,
  voidBorder: c.red.border,
  cartColor: c.cyan.text,
  cartBg: c.cyan.bg,
  cartBorder: c.cyan.border,
  progressColor: c.violet.text,
  progressBg: c.violet.bg,
  progressBorder: c.violet.border,
  successColor: c.green.text,
  viewColor: c.blue.text,
  spinnerTrack: c.slate.mutedBorder,
  // banners — theme-derived
  addOnHeaderBg: c.green.active,
  addOnHeaderBorder: c.green.border,
  addOnHeaderText: c.gray.textPrimary,
  // specs — plain grayish, not colored
  specsHeaderBg: c.slate.mutedBg,
  specsHeaderBorder: c.slate.mutedBorder,
  specsHeaderText: c.gray.textPrimary,
  specsContentBg: c.slate.outerBg,
  specsContentText: c.gray.textSecondary,
});

// bannerColors() is removed entirely — no more hardcoded hex block.
const STAMP_BASE_SX = {
  fontSize: "0.45rem",
  fontWeight: 900,
  borderRadius: "4px",
  px: 0.4,
  py: 0.2,
  lineHeight: 1.3,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  transform: "rotate(-15deg)",
  whiteSpace: "nowrap",
  userSelect: "none",
};

const inlineBtnSx = (colors) => ({
  fontSize: "0.6rem",
  background: colors.actionBtnBg,
  border: `1px solid ${colors.actionBtnBorder}`,
  cursor: "pointer",
  color: colors.actionBtnText,
  fontWeight: 500,
  borderRadius: "6px",
  padding: "1px 8px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

/* ─── Purchase-mode sub-widgets ────────────────────────────────── */
function Spinner({ color, colors }) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: 16,
          height: 16,
          border: `2px solid ${colors.spinnerTrack}`,
          borderTopColor: color,
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
    </Box>
  );
}

function SuccessTick({ colors }) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeInScale 0.2s ease",
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: colors.successColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 9,
            height: 5,
            borderLeft: "2px solid #fff",
            borderBottom: "2px solid #fff",
            transform: "rotate(-45deg) translate(1px, -1px)",
          }}
        />
      </Box>
    </Box>
  );
}

function StatusStamp({ children, color, bg, border, pct }) {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          ...STAMP_BASE_SX,
          color: pct != null ? "#fff" : color,
          backgroundColor: pct != null ? color : bg,
          border: `2px solid ${color}`,
          boxShadow: `inset 0 0 0 1px ${border}`,
          ...(pct != null && {
            fontSize: "0.38rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            transform: "none",
          }),
        }}
      >
        {pct != null ? `${pct}%` : children}
      </Box>
    </Box>
  );
}

/* ─── Cart action buttons (purchase mode) ─────────────────────── */
function CartActionButtons({
  latestHistory,
  isProgressed,
  isInCart,
  option,
  isIncluded,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  onRemoveFromCart,
  onEditOption,
  onAddToCart,
  onViewInfo,
  openCartKey,
  currentCartStatus,
  isAssignedToMe,
  readOnly,
  colors,
}) {
  const [cartPhase, setCartPhase] = useState("idle");
  const [removePhase, setRemovePhase] = useState("idle");

  const progressLabel = latestHistory
    ? ({
        [String(purchaseOrderKey)]: "Purchase Order",
        [String(paidKey)]: "Paid",
        [String(receivedKey)]: "Received",
        [String(deliveredKey)]: "Delivered",
      }[String(latestHistory.nStatus)] ?? "")
    : "";

  const isDisabled = readOnly || isAssignedToMe;
  const canRemove =
    isInCart &&
    String(currentCartStatus) === String(openCartKey) &&
    !isDisabled;

  const handleAddClick = async () => {
    if (isDisabled) return;
    setCartPhase("loading");
    try {
      await onAddToCart();
      setCartPhase("success");
      setTimeout(() => setCartPhase("idle"), 1000);
    } catch {
      setCartPhase("idle");
    }
  };

  const handleRemoveClick = async () => {
    if (isDisabled) return;
    setRemovePhase("loading");
    try {
      await onRemoveFromCart();
    } finally {
      setRemovePhase("idle");
    }
  };

  if (isProgressed)
    return (
      <BaseButton
        icon={
          <Visibility
            sx={{ fontSize: "0.9rem", color: colors.progressColor }}
          />
        }
        tooltip={progressLabel}
        onClick={onViewInfo}
        size="small"
      />
    );

  if (canRemove)
    return (
      <>
        {removePhase === "loading" ? (
          <Spinner color={colors.voidColor} colors={colors} />
        ) : (
          <BaseButton
            icon={
              <RemoveShoppingCart
                sx={{ fontSize: "0.9rem", color: colors.voidColor }}
              />
            }
            tooltip={isDisabled ? "Not allowed" : "Remove from cart"}
            onClick={handleRemoveClick}
            disabled={isDisabled}
            size="small"
          />
        )}
        <BaseButton
          icon={
            <Visibility sx={{ fontSize: "0.9rem", color: colors.viewColor }} />
          }
          tooltip="Option Details"
          onClick={onViewInfo}
          disabled={isDisabled}
          size="small"
        />
      </>
    );

  if (isInCart)
    return (
      <BaseButton
        icon={
          <Visibility sx={{ fontSize: "0.9rem", color: colors.viewColor }} />
        }
        tooltip="Option Details"
        onClick={onViewInfo}
        disabled={isDisabled}
        size="small"
      />
    );

  if (cartPhase === "loading")
    return (
      <>
        <BaseButton
          icon={<Edit sx={{ fontSize: "0.9rem" }} />}
          tooltip={isDisabled ? "Not allowed" : "Edit"}
          onClick={() => !isDisabled && onEditOption(option)}
          disabled={isDisabled}
          size="small"
        />
        <Spinner color={colors.successColor} colors={colors} />
      </>
    );

  if (cartPhase === "success")
    return (
      <>
        <BaseButton
          icon={<Edit sx={{ fontSize: "0.9rem" }} />}
          tooltip={isDisabled ? "Not allowed" : "Edit"}
          onClick={() => !isDisabled && onEditOption(option)}
          disabled={isDisabled}
          size="small"
        />
        <SuccessTick colors={colors} />
      </>
    );

  return (
    <>
      <BaseButton
        icon={<Edit sx={{ fontSize: "0.9rem" }} />}
        tooltip={isDisabled ? "Not allowed" : "Edit"}
        onClick={() => !isDisabled && onEditOption(option)}
        disabled={isDisabled}
        size="small"
      />
      <BaseButton
        icon={
          <AddShoppingCart
            sx={{
              fontSize: "0.9rem",
              color:
                !isIncluded || isDisabled
                  ? colors.textDisabled
                  : colors.successColor,
            }}
          />
        }
        tooltip={
          isDisabled
            ? "Not allowed"
            : !isIncluded
              ? "Check the option to add to cart"
              : "Add to cart"
        }
        disabled={!isIncluded || isDisabled}
        onClick={handleAddClick}
        size="small"
      />
    </>
  );
}

/* ─── Status icon: void stamp / cart badge / progress stamps / checkbox (purchase mode) ── */
function PurchaseStatusIcon({
  isCancelled,
  isInCart,
  isProgressed,
  latestHistory,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  option,
  checkboxOptionsEnabled,
  isFull,
  cancelPoKey,
  optionErrors,
  onToggleInclude,
  itemId,
  isAssignedToMe,
  readOnly,
  isProcurement,
  isProcurementTL,
  colors,
}) {
  if (isCancelled)
    return (
      <StatusStamp
        color={colors.voidColor}
        bg={colors.voidBg}
        border={colors.voidBorder}
      >
        VOID
      </StatusStamp>
    );

  if (isInCart)
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderRadius: "50%",
          border: `2px solid ${colors.cartColor}`,
          outline: `1px solid ${colors.cartColor}`,
          outlineOffset: "2px",
          boxShadow: `0 0 0 1px ${colors.cartBorder}`,
          backgroundColor: colors.cartBg,
        }}
      >
        <ShoppingCart sx={{ fontSize: "0.9rem", color: colors.cartColor }} />
      </Box>
    );

  if (isProgressed) {
    const nStatus = latestHistory ? String(latestHistory.nStatus) : null;
    const ordered = Number(option?.nQuantity || 0);
    const received = Math.min(Number(option?.nInventoryQty || 0), ordered);
    const delivered = Math.min(Number(option?.nDeliveredQty || 0), ordered);
    const isReceivedPartial = received > 0 && received < ordered;
    const isDeliveredPartial = delivered > 0 && delivered < ordered;
    const isFullyReceived = ordered > 0 && received >= ordered;
    const isFullyDelivered = ordered > 0 && delivered >= ordered;
    const badges = [];

    if (isFullyDelivered || nStatus === String(deliveredKey))
      badges.push({ pct: null, label: "DLVRD" });
    else if (isDeliveredPartial)
      badges.push({
        pct: `${Math.round((delivered / ordered) * 100)}%`,
        label: "DLVRD",
      });

    if (
      !(isFullyReceived || nStatus === String(receivedKey)) &&
      isReceivedPartial
    )
      badges.push({
        pct: `${Math.round((received / ordered) * 100)}%`,
        label: "RCV'D",
      });

    if (badges.length === 0) {
      const label = nStatus
        ? ({
            [String(purchaseOrderKey)]: "P.O.",
            [String(paidKey)]: "PAID",
            [String(receivedKey)]: "RCV'D",
            [String(deliveredKey)]: "DLVRD",
          }[nStatus] ?? null)
        : null;
      if (label) badges.push({ pct: null, label });
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          flexShrink: 0,
        }}
      >
        {badges.map(({ pct, label }, i) => (
          <Box
            key={i}
            sx={{
              ...STAMP_BASE_SX,
              color: colors.progressColor,
              backgroundColor: colors.progressBg,
              border: `2px solid ${colors.progressColor}`,
              boxShadow: `inset 0 0 0 1px ${colors.progressBorder}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1.2,
            }}
          >
            {pct && (
              <span
                style={{ fontSize: "0.50rem", fontWeight: 700, lineHeight: 1 }}
              >
                {pct}
              </span>
            )}
            <span>{label}</span>
          </Box>
        ))}
      </Box>
    );
  }

  const isIncluded = Number(option.bPurchaseIncluded) === 1;
  const isCheckboxDisabled =
    isProcurement ||
    isProcurementTL ||
    readOnly ||
    isAssignedToMe ||
    !checkboxOptionsEnabled ||
    (isFull && !option.bPurchaseIncluded && Number(option.bAddOn) !== 1) ||
    (!!latestHistory &&
      String(latestHistory.nStatus) !== String(cancelPoKey)) ||
    (Number(option.bAddOn) === 1 && isProgressed);

  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Checkbox
        checked={isIncluded}
        disabled={isCheckboxDisabled}
        onChange={(e) =>
          !isCheckboxDisabled &&
          onToggleInclude(itemId, option.id, e.target.checked)
        }
        sx={{
          p: 0,
          m: 0,
          width: 20,
          height: 20,
          pointerEvents: isCheckboxDisabled ? "none" : "auto",
          color:
            Number(option.bAddOn) === 1
              ? colors.addOnGreen
              : optionErrors[option.id]
                ? colors.errorText
                : colors.textSecondary,
          "&.Mui-checked": {
            color: Number(option.bAddOn) === 1 ? colors.addOnGreen : undefined,
          },
          transition: "color 0.2s ease, opacity 0.2s ease",
        }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — mode: "canvas" (default) | "purchase"
═══════════════════════════════════════════════════════════════ */
const PurchaseOptionRow = ({
  option,
  index,
  isLastOption,
  itemId,
  checkboxOptionsEnabled,
  expandedOptions,
  optionErrors,
  onToggleInclude,
  onToggleOptionSpecs,
  onEditOption,
  onDeleteOption,
  onCompareClick,
  item,
  isManagement,
  isFirstAddOn,
  hasNoRegularOptions,
  displayIndex,
  statusChangedAlert,
  readOnly = false,
  mode = "canvas",
  // purchase-mode only:
  currentUserId,
  cancelPoKey,
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  latestHistory = null,
  onAddedToCart,
  isProgressed = false,
  isInCart = false,
  openCartKey,
  closeCartKey,
  cancelCartKey,
  allHistories = null,
  onFetchAllHistory,
  currentCartStatus = null,
  isAssignedToMe = false,
  isProcurement = false,
  isProcurementTL = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  const isPurchase = mode === "purchase";

  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const includedQty = item.purchaseOptions
    .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
    .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
  const purchasedQty = item.purchaseOptions
    .filter((o) => o.bPurchaseIncluded && Number(o.bAddOn) !== 1)
    .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
  const isFull = isPurchase
    ? purchasedQty >= Number(item.qty || 0)
    : includedQty >= Number(item.qty || 0);

  const isCancelled =
    isPurchase &&
    latestHistory &&
    String(latestHistory.cStatus) === String(cancelCartKey);
  const isIncluded = isPurchase
    ? Number(option.bPurchaseIncluded) === 1
    : !!option.bIncluded;
  const rowDisabled = isPurchase && (readOnly || !isAssignedToMe);

  const handleAddToCart = () => {
    if (readOnly) return;
    return PurchaseOrderAPI.addToCart({
      nPurchaseOptionId: option.nPurchaseOptionId,
      nUserId: currentUserId,
      nStatus: addToCartKey,
      isManagement,
    }).then(async (res) => {
      if (res?.purchaseOrder) {
        await onAddedToCart?.();
        window.dispatchEvent(new CustomEvent("cart_data_updated"));
      } else throw new Error("No purchase order returned");
    });
  };

  const handleRemoveFromCart = async () => {
    if (readOnly) return;
    try {
      const res = await PurchaseOrderAPI.removeFromCart({
        nPurchaseOptionId: option.nPurchaseOptionId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement,
      });
      if (res) {
        await onAddedToCart?.(option.nPurchaseOptionId);
        window.dispatchEvent(new CustomEvent("cart_data_updated"));
      }
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    }
  };

  return (
    <React.Fragment>
      {isFirstAddOn && Number(option.bAddOn) === 1 && hasNoRegularOptions && (
        <Box
          sx={{
            py: 1,
            mt: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            color: colors.textSecondary,
            fontStyle: "italic",
          }}
        >
          No options available.
        </Box>
      )}

      {isFirstAddOn && Number(option.bAddOn) === 1 && (
        // Add-ons banner
        <Box
          sx={{
            mt: 0,
            mb: 0,
            px: 2,
            py: 0.7,
            pl: 5,
            backgroundColor: colors.addOnHeaderBg,
            borderTop: `1px solid ${colors.addOnHeaderBorder}`,
            borderBottom: `1px solid ${colors.addOnHeaderBorder}`,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: colors.addOnHeaderText,
          }}
        >
          Add-ons
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          position: "relative",
          px: 1.2,
          py: 0.7,
          display: "flex",
          flexDirection: "column",
          borderBottom: `1px solid ${colors.rowBorder}`,
          transition: "background 0.2s",
          backgroundColor: rowDisabled ? colors.rowDisabledBg : colors.rowBg,
          "&:hover": {
            backgroundColor: rowDisabled
              ? colors.rowDisabledBg
              : colors.rowHoverBg,
          },
          opacity: rowDisabled ? 0.8 : 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* DESCRIPTION + STATUS/CHECKBOX + EXPAND ICON */}
          <Box
            sx={{
              flex: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {isPurchase ? (
                  <PurchaseStatusIcon
                    isCancelled={isCancelled}
                    isInCart={isInCart}
                    isProgressed={isProgressed}
                    latestHistory={latestHistory}
                    purchaseOrderKey={purchaseOrderKey}
                    paidKey={paidKey}
                    receivedKey={receivedKey}
                    deliveredKey={deliveredKey}
                    option={option}
                    checkboxOptionsEnabled={checkboxOptionsEnabled}
                    isFull={isFull}
                    cancelPoKey={cancelPoKey}
                    optionErrors={optionErrors}
                    onToggleInclude={onToggleInclude}
                    itemId={itemId}
                    isAssignedToMe={isAssignedToMe}
                    readOnly={readOnly}
                    isProcurement={isProcurement}
                    isProcurementTL={isProcurementTL}
                    colors={colors}
                  />
                ) : (
                  <Checkbox
                    checked={isIncluded}
                    disabled={
                      !checkboxOptionsEnabled ||
                      (isFull &&
                        !option.bIncluded &&
                        Number(option.bAddOn) !== 1)
                    }
                    onChange={(e) =>
                      onToggleInclude(itemId, option.id, e.target.checked)
                    }
                    sx={{
                      p: 0.5,
                      opacity:
                        isFull &&
                        !option.bIncluded &&
                        Number(option.bAddOn) !== 1
                          ? 0
                          : 1,
                      pointerEvents:
                        isFull &&
                        !option.bIncluded &&
                        Number(option.bAddOn) !== 1
                          ? "none"
                          : "auto",
                      color:
                        Number(option.bAddOn) === 1
                          ? colors.addOnGreen
                          : optionErrors[option.id]
                            ? colors.errorText
                            : colors.textSecondary,
                      "&.Mui-checked": {
                        color:
                          Number(option.bAddOn) === 1
                            ? colors.addOnGreen
                            : undefined,
                      },
                      transition: "color 0.2s ease, opacity 0.2s ease",
                    }}
                  />
                )}

                {optionErrors[option.id] && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: "calc(100% + 6px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      backgroundColor: colors.errorTooltipBg,
                      color: colors.errorText,
                      fontSize: "0.65rem",
                      lineHeight: 1.2,
                      px: 0.75,
                      py: 0.3,
                      borderRadius: 1,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      animation: "optionErrorFade 0.18s ease-out",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: -4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        borderWidth: 4,
                        borderStyle: "solid",
                        borderColor: `transparent ${colors.errorTooltipBg} transparent transparent`,
                      },
                      "@keyframes optionErrorFade": {
                        from: {
                          opacity: 0,
                          transform: "translateY(-50%) scale(0.95)",
                        },
                        to: {
                          opacity: 1,
                          transform: "translateY(-50%) scale(1)",
                        },
                      },
                    }}
                  >
                    {optionErrors[option.id]}
                  </Box>
                )}
              </Box>

              <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                {displayIndex}.{" "}
                {option.supplierNickName || option.strSupplierNickName}
              </Typography>
            </Box>

            <ArrowDropDownIcon
              sx={{
                fontSize: 22,
                transform: expandedOptions[option.id]
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "0.25s",
                cursor: rowDisabled ? "default" : "pointer",
                mr: { xs: 0, lg: 4 },
                color: rowDisabled ? colors.textDisabled : colors.textSecondary,
              }}
              onClick={() => !rowDisabled && onToggleOptionSpecs(option.id)}
            />
          </Box>

          <Box
            sx={{
              flex: 2,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem" }}>
              {option.strBrand} | {option.strModel}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: optionErrors[option.id]
                  ? colors.errorText
                  : colors.textPrimary,
              }}
            >
              {option.nQuantity}
              <br />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: optionErrors[option.id]
                    ? colors.errorText
                    : colors.textSecondary,
                }}
              >
                {option.strUOM}
              </span>
            </Typography>
          </Box>

          <Box sx={{ flex: isPurchase ? 2 : 1.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: "0.7rem" }}>
              ₱ {fmtPHP(option.dUnitPrice)}
            </Typography>
          </Box>

          {!isPurchase && (
            <Box sx={{ flex: 1.5, textAlign: "right" }}>
              <Typography sx={{ fontSize: "0.7rem" }}>
                ₱ {fmtPHP(option.dEWT)}
              </Typography>
            </Box>
          )}

          <Box sx={{ flex: isPurchase ? 2 : 1.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: "0.7rem", color: colors.textPrimary }}>
              ₱ {fmtPHP(option.nQuantity * option.dUnitPrice)}
            </Typography>
          </Box>

          {checkboxOptionsEnabled && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 0,
              }}
            >
              {isPurchase ? (
                isCancelled ? (
                  <BaseButton
                    icon={
                      <Visibility
                        sx={{ fontSize: "0.9rem", color: colors.voidColor }}
                      />
                    }
                    tooltip="Cancelled"
                    onClick={() => setInfoModalOpen(true)}
                    disabled={rowDisabled}
                    size="small"
                  />
                ) : (
                  <CartActionButtons
                    latestHistory={latestHistory}
                    option={option}
                    isIncluded={isIncluded}
                    purchaseOrderKey={purchaseOrderKey}
                    paidKey={paidKey}
                    receivedKey={receivedKey}
                    deliveredKey={deliveredKey}
                    onEditOption={onEditOption}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onViewInfo={() => setInfoModalOpen(true)}
                    isProgressed={isProgressed}
                    isInCart={isInCart}
                    openCartKey={openCartKey}
                    currentCartStatus={currentCartStatus}
                    isAssignedToMe={!isAssignedToMe}
                    readOnly={readOnly}
                    colors={colors}
                  />
                )
              ) : (
                <>
                  <BaseButton
                    icon={<Edit sx={{ fontSize: "0.9rem" }} />}
                    tooltip="Edit"
                    onClick={() => onEditOption(option)}
                    size="small"
                  />
                  <BaseButton
                    icon={<Delete sx={{ fontSize: "0.9rem" }} />}
                    tooltip="Delete"
                    onClick={() => onDeleteOption(itemId, option)}
                    disabled={option.bIncluded}
                    size="small"
                  />
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {expandedOptions[option.id] && (
        <Paper
          elevation={1}
          sx={{
            mt: 0,
            borderBottom: `2px solid ${colors.specsBorder}`,
            background: colors.specsBodyBg,
            overflow: "hidden",
            borderRadius: 0,
            position: "relative",
            opacity: rowDisabled ? 0.8 : 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 62,
              top: 0,
              width: 24,
              height: 32,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <svg
              width="24"
              height="32"
              style={{ overflow: "visible", display: "block" }}
            >
              <line
                x1="6"
                y1="-14"
                x2="6"
                y2="16"
                stroke={colors.connectorLine}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="6"
                y1="16"
                x2="25"
                y2="16"
                stroke={colors.connectorLine}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Box>

          <Box
            sx={{
              px: 2,
              py: 0.5,
              backgroundColor: colors.specsHeaderBg,
              borderBottom: `1px solid ${colors.specsHeaderBorder}`,
              fontWeight: 600,
              color: colors.specsHeaderText,
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              pl: 12,
              cursor: rowDisabled ? "default" : "pointer",
            }}
            onClick={() => !rowDisabled && onToggleOptionSpecs(option.id)}
          >
            <span>Specifications</span>
            <Box sx={{ display: "flex", gap: 1 }}>
              {!statusChangedAlert &&
                !readOnly &&
                (!isPurchase || !isAssignedToMe) && (
                  <MiniBaseButton
                    icon={<CompareArrows />}
                    label="Compare"
                    variant="blue"
                    disabled={rowDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!rowDisabled) onCompareClick(item, option);
                    }}
                  />
                )}
              <MiniBaseButton
                icon={<ExpandLess />}
                label="Hide"
                variant="blue"
                disabled={rowDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!rowDisabled) onToggleOptionSpecs(option.id);
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              px: 2,
              py: 1,
              pl: 15,
              maxHeight: 100,
              overflowY: "auto",
              backgroundColor: colors.specsContentBg,
              color: colors.specsContentText,
              fontSize: "0.7rem",
              "& *": { backgroundColor: "transparent !important" },
              "& ul": { paddingLeft: 2, margin: 0, listStyleType: "disc" },
              "& ol": { paddingLeft: 2, margin: 0, listStyleType: "decimal" },
              "& li": { marginBottom: 0.25 },
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{
              __html: option.strSpecs || "No specifications available.",
            }}
          />
        </Paper>
      )}

      {isPurchase && (
        <PurchaseItemInfoModal
          open={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          item={item}
          option={option}
          addToCartKey={addToCartKey}
          cancelPoKey={cancelPoKey}
          cancelCartKey={cancelCartKey}
          purchaseOrderKey={purchaseOrderKey}
          paidKey={paidKey}
          receivedKey={receivedKey}
          deliveredKey={deliveredKey}
          knownHistories={{ [option.nPurchaseOptionId]: latestHistory }}
          allHistories={allHistories}
          onFetchAllHistory={onFetchAllHistory}
          openCartKey={openCartKey}
          closeCartKey={closeCartKey}
          readOnly={readOnly || !isAssignedToMe}
        />
      )}
    </React.Fragment>
  );
};

export default PurchaseOptionRow;
