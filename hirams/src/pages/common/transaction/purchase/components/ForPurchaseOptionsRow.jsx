import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Paper, Typography, Checkbox } from "@mui/material";
import {
  Edit,
  ExpandLess,
  CompareArrows,
  AddShoppingCart,
  RemoveShoppingCart,
  Visibility,
  ShoppingCart,
} from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BaseButton from "../../../../../components/form/BaseButton.jsx";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import PurchaseItemInfoModal from "../../purchase/modal/PurchaseItemInfoModal";
import { fmtPHP } from "../../../../../utils/formatters/formatter.js";
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

/* ─── Shared theme-aware palette ──────────────────────────────────── */
// Mirrors the `colors` object used in PurchaseOptionRow, extended with the
// extra cart-status tokens this row needs (void, in-cart, progressed
// badges, spinner track, success tick, disabled state).
const getColors = (isDark) => ({
  // Add-on header
  addOnHeaderBg: isDark ? "#1e5a9c" : "#2272c3",
  addOnHeaderBorder: isDark ? "rgba(76,175,80,0.3)" : "#c8e6c9",
  addOnHeaderText: isDark ? "#e3eaf6" : "#DDE3EE",

  // Row backgrounds
  rowBg: isDark ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.7)",
  rowHoverBg: isDark ? "rgba(30,41,59,0.85)" : "rgba(255,255,255,0.85)",
  rowBorder: isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.08)",

  // Disabled row (readOnly / not assigned to me)
  rowDisabledBg: isDark ? "rgba(30,41,59,0.35)" : "rgba(245,245,245,0.9)",
  rowDisabledHoverBg: isDark ? "rgba(30,41,59,0.35)" : "rgba(245,245,245,0.9)",

  // Specs panel
  specsHeaderBg: isDark ? "#1d4ed8" : "#3b82f6",
  specsHeaderText: isDark ? "#e3eaf6" : "#DDE3EE",
  specsBodyBg: isDark ? "rgba(30,64,175,0.12)" : "#f4faff",
  specsBorder: isDark ? "rgba(96,165,250,0.2)" : "rgba(59,130,246,0.25)",
  specsPanelBg: isDark ? "rgba(30,41,59,0.5)" : "#f9f9f9",

  // Connector line
  connectorLine: isDark ? "#475569" : "#DDE3EE",

  // Buttons
  actionBtnBg: isDark ? "#1e293b" : "#fff",
  actionBtnBorder: isDark ? "rgba(148,163,184,0.4)" : "#cfd8dc",
  actionBtnText: isDark ? "#93c5fd" : "#1976d2",

  // Add-on accent color
  addOnGreen: isDark ? "#4ade80" : "#2E7D32",

  // Error tooltip
  errorTooltipBg: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.94)",

  // Status: void / cancelled (red)
  voidColor: isDark ? "#f87171" : "#b91c1c",
  voidBg: isDark ? "rgba(248,113,113,0.12)" : "#fff0f0",
  voidBorder: isDark ? "rgba(248,113,113,0.4)" : "#fca5a5",

  // Status: in cart (blue)
  cartColor: isDark ? "#38bdf8" : "#0369a1",
  cartBg: isDark ? "rgba(56,189,248,0.12)" : "#f0f9ff",
  cartBorder: isDark ? "rgba(56,189,248,0.4)" : "#7dd3fc",

  // Status: progressed badges (purple)
  progressColor: isDark ? "#a78bfa" : "#7c3aed",
  progressBg: isDark ? "rgba(167,139,250,0.12)" : "#faf5ff",
  progressBorder: isDark ? "rgba(167,139,250,0.4)" : "#c4b5fd",

  // Success / add-to-cart green
  successColor: isDark ? "#4ade80" : "#15803d",

  // View / edit accents
  viewColor: isDark ? "#93c5fd" : "#1976d2",

  // Spinner track
  spinnerTrack: isDark ? "rgba(148,163,184,0.25)" : "#e2e8f0",
});

/* ─── Sub-components ──────────────────────────────────────────────── */
function Spinner({ color }) {
  const theme = useTheme();
  const colors = getColors(theme.palette.mode === "dark");
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

function SuccessTick() {
  const theme = useTheme();
  const colors = getColors(theme.palette.mode === "dark");
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

function AddOnDivider({ hasNoRegularOptions }) {
  const theme = useTheme();
  const colors = getColors(theme.palette.mode === "dark");
  return (
    <>
      {hasNoRegularOptions && (
        <Box
          sx={{
            py: 1,
            mt: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            color: "text.secondary",
            fontStyle: "italic",
          }}
        >
          No options available.
        </Box>
      )}
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
    </>
  );
}

/* ─── CartActionButtons ───────────────────────────────────────────── */
function CartActionButtons({
  latestHistory,
  isProgressed,
  isInCart,
  option,
  isIncluded,
  addToCartKey,
  cancelPoKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  onRemoveFromCart,
  onEditOption,
  onAddToCart,
  onViewInfo,
  openCartKey,
  currentCartStatus,
  isAssignedToMe,
  readOnly,
  isProcurement,
  isProcurementTL,
}) {
  const theme = useTheme();
  const colors = getColors(theme.palette.mode === "dark");
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
          <Spinner color={colors.voidColor} />
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
        <Spinner color={colors.successColor} />
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
        <SuccessTick />
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
                  ? "text.disabled"
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

/* ─── StatusIcon ──────────────────────────────────────────────────── */
function StatusIcon({
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
}) {
  const theme = useTheme();
  const colors = getColors(theme.palette.mode === "dark");

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

    if (isFullyDelivered || String(nStatus) === String(deliveredKey)) {
      badges.push({ pct: null, label: "DLVRD" });
    } else if (isDeliveredPartial) {
      badges.push({
        pct: `${Math.round((delivered / ordered) * 100)}%`,
        label: "DLVRD",
      });
    }

    if (isFullyReceived || String(nStatus) === String(receivedKey)) {
      // fully received — no badge needed
    } else if (isReceivedPartial) {
      badges.push({
        pct: `${Math.round((received / ordered) * 100)}%`,
        label: "RCV'D",
      });
    }

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
          opacity: 1,
          pointerEvents: isCheckboxDisabled ? "none" : "auto",
          color:
            Number(option.bAddOn) === 1
              ? colors.addOnGreen
              : optionErrors[option.id]
                ? "error.main"
                : isFull &&
                    !option.bPurchaseIncluded &&
                    Number(option.bAddOn) !== 1
                  ? "text.disabled"
                  : "text.secondary",
          "&.Mui-checked": {
            color: Number(option.bAddOn) === 1 ? colors.addOnGreen : undefined,
          },
          transition: "color 0.2s ease, opacity 0.2s ease",
        }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const ForPurchaseOptionRow = ({
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
  isProgressed,
  isInCart,
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
  const colors = getColors(isDark);

  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const isIncluded = Number(option.bPurchaseIncluded) === 1;
  const isCancelled =
    latestHistory && String(latestHistory.cStatus) === String(cancelCartKey);
  const includedQty = item.purchaseOptions
    .filter((o) => o.bPurchaseIncluded && Number(o.bAddOn) !== 1)
    .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
  const isFull = includedQty >= Number(item.qty || 0);

  const isDisabled = readOnly || !isAssignedToMe;

  const inlineBtnSx = {
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
  };

  const handleAddToCart = () => {
    if (isDisabled) return;
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
    if (isDisabled) return;
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

  const statusIconProps = {
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
  };

  return (
    <>
      {isFirstAddOn && Number(option.bAddOn) === 1 && (
        <AddOnDivider hasNoRegularOptions={hasNoRegularOptions} />
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
          backgroundColor: isDisabled ? colors.rowDisabledBg : colors.rowBg,
          "&:hover": {
            backgroundColor: isDisabled
              ? colors.rowDisabledHoverBg
              : colors.rowHoverBg,
          },
          opacity: isDisabled ? 0.8 : 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Supplier + specs toggle */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "left",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1.4 }}
            >
              <StatusIcon {...statusIconProps} />
              <Typography
                sx={{ fontSize: "0.75rem", fontWeight: 500, ml: 0.6 }}
              >
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
                cursor: isDisabled ? "default" : "pointer",
                mr: { xs: 0, lg: 4 },
                color: isDisabled ? "text.disabled" : "text.secondary",
              }}
              onClick={() => !isDisabled && onToggleOptionSpecs(option.id)}
            />
          </Box>

          {/* Brand | Model */}
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

          {/* Quantity */}
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: optionErrors[option.id] ? "error.main" : "text.primary",
              }}
            >
              {option.nQuantity}
              <br />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: optionErrors[option.id]
                    ? theme.palette.error.main
                    : theme.palette.text.secondary,
                }}
              >
                {option.strUOM}
              </span>
            </Typography>
          </Box>

          {/* Unit Price */}
          <Box sx={{ flex: 2, textAlign: "right" }}>
            <Typography sx={{ fontSize: "0.7rem" }}>
              ₱ {fmtPHP(option.dUnitPrice)}
            </Typography>
          </Box>

          {/* Total */}
          <Box sx={{ flex: 2, textAlign: "right" }}>
            <Typography sx={{ fontSize: "0.7rem" }}>
              ₱ {fmtPHP(option.nQuantity * option.dUnitPrice)}
            </Typography>
          </Box>

          {/* Actions */}
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
              {isCancelled ? (
                <BaseButton
                  icon={
                    <Visibility
                      sx={{ fontSize: "0.9rem", color: colors.voidColor }}
                    />
                  }
                  tooltip="Cancelled"
                  onClick={() => setInfoModalOpen(true)}
                  disabled={isDisabled}
                  size="small"
                />
              ) : (
                <CartActionButtons
                  latestHistory={latestHistory}
                  option={option}
                  isIncluded={isIncluded}
                  isFull={isFull}
                  addToCartKey={addToCartKey}
                  cancelPoKey={cancelPoKey}
                  purchaseOrderKey={purchaseOrderKey}
                  paidKey={paidKey}
                  receivedKey={receivedKey}
                  deliveredKey={deliveredKey}
                  removedFromCartKey={removedFromCartKey}
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
                  isProcurement={isProcurement}
                  isProcurementTL={isProcurementTL}
                />
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Specs expansion */}
      {expandedOptions[option.id] && (
        <Paper
          elevation={1}
          sx={{
            mt: 0,
            borderBottom: `2px solid ${colors.specsBorder}`,
            background: colors.specsPanelBg,
            overflow: "hidden",
            borderRadius: 0,
            position: "relative",
            opacity: isDisabled ? 0.8 : 1,
          }}
        >
          {/* connector */}
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
              fontWeight: 400,
              color: colors.specsHeaderText,
              fontSize: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              pl: 12,
              cursor: isDisabled ? "default" : "pointer",
            }}
            onClick={() => !isDisabled && onToggleOptionSpecs(option.id)}
          >
            <span>Specifications:</span>
            <Box sx={{ display: "flex", gap: 1 }}>
              {!statusChangedAlert && !readOnly && !isAssignedToMe && (
                <button
                  style={{
                    ...inlineBtnSx,
                    opacity: isDisabled ? 0.5 : 1,
                    pointerEvents: isDisabled ? "none" : "auto",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDisabled) onCompareClick(item, option);
                  }}
                >
                  Compare <CompareArrows fontSize="small" />
                </button>
              )}
              <button
                style={{
                  ...inlineBtnSx,
                  opacity: isDisabled ? 0.5 : 1,
                  pointerEvents: isDisabled ? "none" : "auto",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) onToggleOptionSpecs(option.id);
                }}
              >
                Hide <ExpandLess fontSize="small" />
              </button>
            </Box>
          </Box>

          <Box
            sx={{
              px: 2,
              py: 1,
              pl: 15,
              maxHeight: 150,
              overflowY: "auto",
              backgroundColor: colors.specsBodyBg,
              color: "text.secondary",
              fontSize: "0.8rem",
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
    </>
  );
};

export default ForPurchaseOptionRow;
