import React, { useState } from "react";
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
import BaseButton from "../../../../../components/common/BaseButton";
import api from "../../../../../utils/api/api";
import PurchaseItemInfoModal from "../../modal/transaction-purchase/PurchaseItemInfoModal";

/* ─── Constants ───────────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const INLINE_BTN_SX = {
  fontSize: "0.6rem",
  background: "#fff",
  border: "1px solid #cfd8dc",
  cursor: "pointer",
  color: "#1976d2",
  fontWeight: 500,
  borderRadius: "6px",
  padding: "1px 8px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

/* ─── Sub-components ──────────────────────────────────────────────── */
function Spinner({ color }) {
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
          border: "2px solid #e2e8f0",
          borderTopColor: color,
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
    </Box>
  );
}

function SuccessTick() {
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
          background: "#15803d",
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

function StatusStamp({ children, color, bg, border }) {
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
          color,
          backgroundColor: bg,
          border: `2px solid ${color}`,
          boxShadow: `inset 0 0 0 1px ${border}`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function AddOnDivider({ hasNoRegularOptions }) {
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
          backgroundColor: "#2272c3",
          borderTop: "1px solid #c8e6c9",
          borderBottom: "1px solid #c8e6c9",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#DDE3EE",
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

  const canRemove =
    isInCart && String(currentCartStatus) === String(openCartKey);

  const handleAddClick = async () => {
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
        icon={<Visibility sx={{ fontSize: "0.9rem", color: "#7c3aed" }} />}
        tooltip={progressLabel}
        onClick={onViewInfo}
        size="small"
      />
    );

  if (canRemove)
    return (
      <>
        {removePhase === "loading" ? (
          <Spinner color="#b91c1c" />
        ) : (
          <BaseButton
            icon={
              <RemoveShoppingCart
                sx={{ fontSize: "0.9rem", color: "#b91c1c" }}
              />
            }
            tooltip="Remove from cart"
            onClick={handleRemoveClick}
            size="small"
          />
        )}
        <BaseButton
          icon={<Visibility sx={{ fontSize: "0.9rem", color: "#1976d2" }} />}
          tooltip="Option Details"
          onClick={onViewInfo}
          size="small"
        />
      </>
    );

  if (isInCart)
    return (
      <BaseButton
        icon={<Visibility sx={{ fontSize: "0.9rem", color: "#1976d2" }} />}
        tooltip="Option Details"
        onClick={onViewInfo}
        size="small"
      />
    );

  if (cartPhase === "loading")
    return (
      <>
        <BaseButton
          icon={<Edit sx={{ fontSize: "0.9rem" }} />}
          tooltip="Edit"
          onClick={() => onEditOption(option)}
          size="small"
        />
        <Spinner color="#15803d" />
      </>
    );

  if (cartPhase === "success")
    return (
      <>
        <BaseButton
          icon={<Edit sx={{ fontSize: "0.9rem" }} />}
          tooltip="Edit"
          onClick={() => onEditOption(option)}
          size="small"
        />
        <SuccessTick />
      </>
    );

  return (
    <>
      <BaseButton
        icon={<Edit sx={{ fontSize: "0.9rem" }} />}
        tooltip="Edit"
        onClick={() => onEditOption(option)}
        size="small"
      />
      <BaseButton
        icon={
          <AddShoppingCart
            sx={{
              fontSize: "0.9rem",
              color: !isIncluded ? "text.disabled" : "#15803d",
            }}
          />
        }
        tooltip={
          !isIncluded ? "Check the option to add to cart" : "Add to cart"
        }
        disabled={!isIncluded}
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
}) {
  if (isCancelled)
    return (
      <StatusStamp color="#b91c1c" bg="#fff0f0" border="#fca5a5">
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
          border: "2px solid #0369a1",
          outline: "1px solid #0369a1",
          outlineOffset: "2px",
          boxShadow: "0 0 0 1px #7dd3fc",
          backgroundColor: "#f0f9ff",
        }}
      >
        <ShoppingCart sx={{ fontSize: "0.9rem", color: "#0369a1" }} />
      </Box>
    );

  if (isProgressed) {
    const label = latestHistory
      ? ({
          [String(purchaseOrderKey)]: "P.O.",
          [String(paidKey)]: "PAID",
          [String(receivedKey)]: "RCV'D",
          [String(deliveredKey)]: "DLVRD",
        }[String(latestHistory.nStatus)] ?? "DONE")
      : "DONE";
    return (
      <StatusStamp color="#7c3aed" bg="#faf5ff" border="#c4b5fd">
        {label}
      </StatusStamp>
    );
  }

  const isIncluded = Number(option.bPurchaseIncluded) === 1;
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
        disabled={
          !checkboxOptionsEnabled ||
          (isFull &&
            !option.bPurchaseIncluded &&
            Number(option.bAddOn) !== 1) ||
          (!!latestHistory &&
            String(latestHistory.nStatus) !== String(cancelPoKey)) ||
          (Number(option.bAddOn) === 1 && isProgressed)
        }
        onChange={(e) => onToggleInclude(itemId, option.id, e.target.checked)}
        sx={{
          p: 0,
          m: 0,
          width: 20,
          height: 20,
          opacity: 1,
          pointerEvents:
            isFull && !option.bPurchaseIncluded && Number(option.bAddOn) !== 1
              ? "none"
              : "auto",
          color:
            Number(option.bAddOn) === 1
              ? "#2E7D32"
              : optionErrors[option.id]
                ? "error.main"
                : isFull &&
                    !option.bPurchaseIncluded &&
                    Number(option.bAddOn) !== 1
                  ? "text.disabled"
                  : "text.secondary",
          "&.Mui-checked": {
            color: Number(option.bAddOn) === 1 ? "#2E7D32" : undefined,
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
  readOnly,
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
}) => {
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const isIncluded = Number(option.bPurchaseIncluded) === 1;
  const isCancelled =
    latestHistory && String(latestHistory.cStatus) === String(cancelCartKey);
  const includedQty = item.purchaseOptions
    .filter((o) => o.bPurchaseIncluded && Number(o.bAddOn) !== 1)
    .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
  const isFull = includedQty >= Number(item.qty || 0);

  const handleAddToCart = () =>
    api
      .post("purchase-order/add-to-cart", {
        nPurchaseOptionId: option.nPurchaseOptionId,
        nUserId: currentUserId,
        nStatus: addToCartKey,
        isManagement,
      })
      .then(async (res) => {
        if (res?.purchaseOrder) {
          await onAddedToCart?.();
          window.dispatchEvent(new CustomEvent("cart_data_updated"));
        } else throw new Error("No purchase order returned");
      });

  const handleRemoveFromCart = async () => {
    try {
      const res = await api.post("purchase-order/remove-from-cart", {
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
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          transition: "background 0.2s",
          backgroundColor: "rgba(255,255,255,0.7)",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.85)" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Supplier + specs toggle */}
          <Box
            sx={{
              flex: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StatusIcon {...statusIconProps} />
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
                cursor: "pointer",
                mr: { xs: 0, lg: 4 },
              }}
              onClick={() => onToggleOptionSpecs(option.id)}
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
                color: optionErrors[option.id] ? "red" : "text.primary",
              }}
            >
              {option.nQuantity}
              <br />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: optionErrors[option.id] ? "red" : "#666",
                }}
              >
                {option.strUOM}
              </span>
            </Typography>
          </Box>

          {/* Unit Price */}
          <Box sx={{ flex: 1.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: "0.7rem" }}>
              ₱ {fmt(option.dUnitPrice)}
            </Typography>
          </Box>

          {/* Total */}
          <Box sx={{ flex: 1.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: "0.7rem" }}>
              ₱ {fmt(option.nQuantity * option.dUnitPrice)}
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
                    <Visibility sx={{ fontSize: "0.9rem", color: "#b91c1c" }} />
                  }
                  tooltip="Cancelled"
                  onClick={() => setInfoModalOpen(true)}
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
            borderBottom: "2px solid rgba(59,130,246,0.25)",
            background: "#f9f9f9",
            overflow: "hidden",
            borderRadius: 0,
            position: "relative",
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
                stroke="#DDE3EE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="6"
                y1="16"
                x2="25"
                y2="16"
                stroke="#DDE3EE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Box>

          <Box
            sx={{
              px: 2,
              py: 0.5,
              backgroundColor: "#3b82f6",
              fontWeight: 400,
              color: "#DDE3EE",
              fontSize: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              pl: 12,
              cursor: "pointer",
            }}
            onClick={() => onToggleOptionSpecs(option.id)}
          >
            <span>Specifications:</span>
            <Box sx={{ display: "flex", gap: 1 }}>
              {!statusChangedAlert && !readOnly && (
                <button
                  style={INLINE_BTN_SX}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompareClick(item, option);
                  }}
                >
                  Compare <CompareArrows fontSize="small" />
                </button>
              )}
              <button
                style={INLINE_BTN_SX}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOptionSpecs(option.id);
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
              backgroundColor: "#f4faff",
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
      />
    </>
  );
};

export default ForPurchaseOptionRow;
