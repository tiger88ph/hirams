import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import {
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  StoreOutlined,
  Inventory2Outlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccountCircleOutlined,
  AccessTimeOutlined,
  CancelOutlined,
  Visibility,
  UnfoldLess,
  UnfoldMore,
  ShoppingCart,
  RemoveShoppingCart, // ← ADD
} from "@mui/icons-material";
import echo from "../../../utils/echo"; // ← ADD this import at the top
import CustomSearchField from "../../../components/common/SearchField";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";
import useMapping from "../../../utils/mappings/useMapping";
import api from "../../../utils/api/api";
import PurchaseCartUpdateStatusModal from "./modal/transaction-purchase/PurchaseCartUpdateStatusModal";
import SyncMenu from "./../../../components/common/SyncMenu";
import { PurchaseCartSkeleton } from "../../../components/helper/Skeleton";
import { getUserRoles } from "../../../utils/helpers/roleHelper.js";
// ADD import at the top
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";
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

// ── POCard ────────────────────────────────────────────────────────────────────

function POCard({
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
  onCreateVoucherClick,
  onUpdateClick,
  collapsed,
  onRemoved,
  openCartKey,
  closeCartKey, // ← ADD
  isEligible,
  isSelected,
  onToggleSelect,
  voucherStatus,
  voucherActiveKey,
  voucherClosedKey,
  selectError, // ← ADD
}) {
  const [open, setOpen] = useState(true);
  const [removingOptionId, setRemovingOptionId] = useState(null);

  useEffect(() => {
    setOpen(!collapsed);
  }, [collapsed]);

  const options = po.purchase_order_options || [];

  // ── Stamp config ──
  const stampConfig = (() => {
    const statuses = options.map((o) => {
      const id = Number(o.purchase_option?.nPurchaseOptionId);
      return String(optionHistories[id]?.nStatus ?? "");
    });
    const allMatch = (key) =>
      statuses.length > 0 && statuses.every((s) => s === String(key));
    const anyMatch = (key) => statuses.some((s) => s === String(key));

    if (anyMatch(cancelCartKey) || anyMatch(cancelPoKey))
      return {
        label: "VOID",
        color: "#fca5a5",
        bg: "rgba(239,68,68,0.15)",
        border: "#fca5a5",
        inner: "rgba(239,68,68,0.3)",
      };
    if (allMatch(deliveredKey))
      return {
        label: "DLVRD",
        color: "#86efac",
        bg: "rgba(21,128,61,0.15)",
        border: "#86efac",
        inner: "rgba(21,128,61,0.3)",
      };
    if (allMatch(receivedKey))
      return {
        label: "RCV'D",
        color: "#7dd3fc",
        bg: "rgba(3,105,161,0.15)",
        border: "#7dd3fc",
        inner: "rgba(3,105,161,0.3)",
      };
    if (allMatch(paidKey))
      return {
        label: "PAID",
        color: "#5eead4",
        bg: "rgba(15,118,110,0.15)",
        border: "#5eead4",
        inner: "rgba(15,118,110,0.3)",
      };
    if (allMatch(purchaseOrderKey))
      return {
        label: "P.O.",
        color: "#c4b5fd",
        bg: "rgba(124,58,237,0.15)",
        border: "#c4b5fd",
        inner: "rgba(124,58,237,0.3)",
      };
    if (allMatch(addToCartKey))
      return {
        label: "CART",
        color: "#93c5fd",
        bg: "rgba(29,78,216,0.15)",
        border: "#93c5fd",
        inner: "rgba(29,78,216,0.3)",
      };
    return null;
  })();

  const total = options.reduce((sum, o) => {
    const qty = o.purchase_option?.nQuantity || 0;
    const price = o.purchase_option?.dUnitPrice || 0;
    return sum + qty * price;
  }, 0);

  const statusLabel = cartStatus?.[po.cStatus] ?? po.cStatus;
  const firstOption = options[0];
  const primarySupplier =
    firstOption?.purchase_option?.supplier?.strSupplierNickName ?? "—";
  const companyName =
    firstOption?.purchase_option?.transaction_item?.transaction?.company
      ?.strCompanyNickName ?? "—";
  const aoUser =
    firstOption?.purchase_option?.transaction_item?.transaction?.user;
  const assignedAOName = aoUser ? `${aoUser.strNickName}`.trim() : "—";

  const handleRemoveOption = async (nPurchaseOptionId) => {
    setRemovingOptionId(nPurchaseOptionId);
    try {
      await api.post("purchase-order/remove-from-cart", {
        nPurchaseOptionId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement: true,
      });
      await onRemoved?.(); // ← wait for refetch
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
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.875,
          background: "linear-gradient(135deg, #1e3a5f 0%, #1a3254 100%)",
          borderBottom: open ? "0.5px solid #2d4f7c" : "none",
        }}
      >
        {isEligible &&
          (!voucherStatus ||
            (String(voucherStatus) !== String(voucherActiveKey) &&
              String(voucherStatus) !== String(voucherClosedKey))) && (
            <Box
              sx={{ position: "relative", flexShrink: 0, mr: 0.7 }} // ← wrap with relative
            >
              <Box
                onClick={() => onToggleSelect(po.nPurchaseOrderId)}
                sx={{
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                  borderRadius: "4px",
                  cursor: "pointer",
                  border: selectError
                    ? "2px solid #ef4444" // ← red on error
                    : isSelected
                      ? "2px solid #86efac"
                      : "2px solid rgba(134,239,172,0.3)",
                  background: isSelected ? "#16a34a" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  animation: selectError ? "errorShake 0.3s ease" : "none", // ← shake
                }}
              >
                {isSelected && (
                  <Box
                    component="span"
                    sx={{
                      color: "#fff",
                      fontSize: "0.65rem",
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
                    left: "calc(100% + 8px)", // ← RIGHT side now
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
                      // ← ::before not ::after
                      content: '""',
                      position: "absolute",
                      right: "100%", // ← arrow points LEFT
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

        {/* Voucher stamp — shown when this PO already has an Active or Closed voucher */}
        {voucherStatus &&
        (String(voucherStatus) === String(voucherActiveKey) ||
          String(voucherStatus) === String(voucherClosedKey)) &&
        options.every((o) => {
          const id = Number(o.purchase_option?.nPurchaseOptionId);
          return String(optionHistories[id]?.nStatus ?? "") !== String(paidKey);
        }) ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              mr: 0.7,
              gap: 0.15,
            }}
          >
            <ReceiptLongOutlined
              sx={{
                fontSize: "0.85rem",
                color:
                  String(voucherStatus) === String(voucherClosedKey)
                    ? "#86efac"
                    : "#93c5fd",
              }}
            />
            <Box
              sx={{
                fontSize: "0.38rem",
                fontWeight: 800,
                color:
                  String(voucherStatus) === String(voucherClosedKey)
                    ? "#86efac"
                    : "#93c5fd",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {String(voucherStatus) === String(voucherClosedKey)
                ? "CLOSED"
                : "VOUCHER"}
            </Box>
          </Box>
        ) : null}
        {stampConfig ? (
          stampConfig.label === "CART" ? (
            // ── CART STAMP ─────────────────────────────
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
                backgroundColor: "transparent",
              }}
            >
              <ShoppingCart
                sx={{
                  fontSize: "0.9rem",
                  color: "#7dd3fc",
                }}
              />
            </Box>
          ) : (
            // ── DEFAULT STAMP ─────────────────────────
            <Box
              sx={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: "50%",
                border: `2px solid ${stampConfig.border}`,
                outline: `1px solid ${stampConfig.border}`,
                outlineOffset: "2px",
                boxShadow: `0 0 0 1px ${stampConfig.inner}`,
                backgroundColor: stampConfig.bg,
              }}
            >
              <Box
                sx={{
                  fontSize: "0.45rem",
                  fontWeight: 900,
                  color: stampConfig.color,
                  backgroundColor: stampConfig.bg,
                  border: `2px solid ${stampConfig.border}`,
                  borderRadius: "4px",
                  px: 0.4,
                  py: 0.2,
                  lineHeight: 1.3,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  transform: "rotate(-15deg)",
                  boxShadow: `inset 0 0 0 1px ${stampConfig.inner}`,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                {stampConfig.label}
              </Box>
            </Box>
          )
        ) : (
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,0.1)" }}
          />
        )}
        {/* PO number + meta */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.35 }}
          >
            <StoreOutlined sx={{ fontSize: "0.9rem", color: "#90caf9" }} />

            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              {primarySupplier} {" | "} {companyName}
            </Typography>

            {/* Item count
            {open && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 14,
                  height: 14,
                  px: 0.5,
                  borderRadius: "50px",
                  background: "rgba(255,255,255,0.15)",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.52rem",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {options.length}
                </Typography>
              </Box>
            )} */}
          </Box>

          {/* Bottom row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {/* Company badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.3,
                px: 0.6,
                py: 0.15,
                borderRadius: "50px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            >
              <ReceiptLongOutlined
                sx={{ fontSize: "0.8rem", color: "#90caf9", flexShrink: 0 }}
              />
              <Typography
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: "#90caf9",
                  lineHeight: 1,
                }}
              >
                {po.strPurchaseOrderNo}
              </Typography>
            </Box>

            {/* Supplier badge
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.3,
                px: 0.6,
                py: 0.15,
                borderRadius: "50px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            >
              <LocalShippingOutlined
                sx={{ fontSize: "0.65rem", color: "#90caf9" }}
              />
              <Typography
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: "#90caf9",
                  lineHeight: 1,
                }}
              >
                {primarySupplier}
              </Typography>
            </Box> */}

            {/* AO badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.3,
                px: 0.6,
                py: 0.15,
                borderRadius: "50px",
                background: "rgba(144,202,249,0.12)",
                border: "0.5px solid rgba(144,202,249,0.25)",
                flexShrink: 0,
              }}
            >
              <AccountCircleOutlined
                sx={{ fontSize: "0.65rem", color: "#90caf9" }}
              />
              <Typography
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: "#90caf9",
                  lineHeight: 1,
                }}
              >
                {assignedAOName}
              </Typography>
            </Box>
          </Box>
        </Box>
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

        <Box sx={{ position: "relative", flexShrink: 0 }}>
          {!open && (
            <Box
              sx={{
                position: "absolute",
                top: -3,
                right: -3,
                minWidth: 14,
                height: 14,
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
                  fontSize: "0.45rem",
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
              width: 22,
              height: 22,
              borderRadius: "50px",
              border: "0.5px solid rgba(144,202,249,0.3)",
              color: "#90caf9",
              "&:hover": { background: "rgba(255,255,255,0.1)" },
              p: 0,
            }}
          >
            {open ? (
              <KeyboardArrowUp sx={{ fontSize: "0.9rem" }} />
            ) : (
              <KeyboardArrowDown sx={{ fontSize: "0.9rem" }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* ── Expanded body ── */}
      {open && (
        <>
          {/* Line items */}
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
              const addedAt = fmtDateTime(opt.dtAddedToCart);
              const deliveryDate = fmtDateTime(
                p?.transaction_item?.transaction?.dtDelivery ?? "—",
              );

              return (
                <Box
                  key={opt.nPurchaseOrder_OptionId}
                  sx={{
                    px: 1.5,
                    py: 0.875,
                    display: "flex",
                    alignItems: "stretch",
                    borderBottom:
                      idx < options.length - 1 ? "0.5px solid #F3F4F6" : "none",
                    "&:hover": { background: "#F9FAFB" },
                    transition: "background 0.15s",
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

                  {/* Item icon */}
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

                  {/* Item details */}
                  <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
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
                    {/* <Typography
                      sx={{
                        fontSize: "0.50rem",
                        color: "#C4C9D4",
                        lineHeight: 1,
                        mt: 0.2,
                      }}
                    >
                      Added: {addedAt}
                    </Typography> */}
                  </Box>

                  {/* Unit Price */}
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

                  {/* Quantity */}
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

                  {/* Total */}
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

                  {po.cStatus === openCartKey && (
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
                          onClick={() =>
                            handleRemoveOption(p?.nPurchaseOptionId)
                          }
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
          </Box>

          {/* Footer total */}
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
                {/* Show "Cancelled" badge only — no Update Cart button */}
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
                  /* Show View button (and Create Voucher if close/PO status) */
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <button
                      style={{
                        fontSize: "0.6rem",
                        background:
                          "linear-gradient(135deg, #1e3a5f 0%, #1a3254 100%)",
                        border: "0.5px solid rgba(144,202,249,0.3)",
                        cursor: "pointer",
                        color: "#90caf9",
                        fontWeight: 500,
                        borderRadius: "50px",
                        padding: "2px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                      onClick={() => onUpdateClick({ po, statusLabel })}
                    >
                      View <Visibility style={{ fontSize: "0.7rem" }} />
                    </button>
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

// ── TransactionPurchaseOrder ──────────────────────────────────────────────────
function TransactionPurchaseCart() {
  const [itemsLoading, setItemsLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [selectError, setSelectError] = useState(""); // ← ADD
  const selectErrorTimeoutRef = useRef(null); // ← ADD

  const [allOptionHistories, setAllOptionHistories] = useState({});
  const [selectedPOIds, setSelectedPOIds] = useState(new Set());
  const [vouchersByPO, setVouchersByPO] = useState({}); // ← ADD
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const currentUserId = user?.nUserId;
  const {
    forPurchaseStatus,
    cartStatus,
    shippingMethod,
    paymentTerms,
    voucherStatus,
    voucherType,
    userTypes,
    loading: mappingLoading,
  } = useMapping();
    const {
      isGeneralManager,
      isAccountOfficer,
    } = getUserRoles(userTypes);
  
  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem("selectedCartStatusCode") || "",
  );

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (code) setSelectedStatusCode(code);
    };
    window.addEventListener("cart_status_changed", handler);
    return () => window.removeEventListener("cart_status_changed", handler);
  }, []);

  const fpKeys = Object.keys(forPurchaseStatus || {});
  const csKeys = Object.keys(cartStatus || {});
  const vsKeys = Object.keys(voucherStatus || {});
  const vtKeys = Object.keys(voucherType || {});

  const cancelPoKey = fpKeys[0] ?? "";
  const addToCartKey = fpKeys[1] ?? "";
  const purchaseOrderKey = fpKeys[2] ?? "";
  const removedFromCartKey = fpKeys[6] ?? "";

  const paidKey = fpKeys[3] ?? "";
  const receivedKey = fpKeys[4] ?? "";
  const deliveredKey = fpKeys[5] ?? "";

  const openCartKey = csKeys[0] ?? "";
  const closeCartKey = csKeys[1] ?? "";
  const cancelCartKey = csKeys[2] ?? "";

  const voucherActiveKey = vsKeys[0] ?? "";
  const voucherClosedKey = vsKeys[1] ?? "";

  const voucherCancelledKey = vsKeys[2] ?? "";
  const voucherSupplierTypeKey = vtKeys[0] ?? "";
  const voucherAssigneeTypeKey = vtKeys[1] ?? "";
  const fetchAllOptionHistories = useCallback(async (orders) => {
    const ids = (orders || [])
      .flatMap((po) => po.purchase_order_options || [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);

    if (!ids.length) return;

    try {
      const res = await api.post("purchase-item-histories/latest", {
        nPurchaseOptionId: ids,
      });

      const map = {};

      (res?.histories || []).forEach((h) => {
        map[Number(h.nPurchaseOptionId)] = h;
      });

      setAllOptionHistories(map);
    } catch (err) {
      console.error("fetchAllOptionHistories error:", err);
    }
  }, []);

  const fetchAllPurchaseOrders = useCallback(async () => {
    setItemsLoading(true);

    try {
      const res = await api.get("purchase-orders/get-all-purchase-orders");

      const orders = res.purchaseOrders || [];
      setPurchaseOrders(orders);

      // fetch histories
      fetchAllOptionHistories(orders);

      // fetch vouchers to map PO → voucher status
      try {
        const vRes = await api.get("vouchers");
        const vouchers = Array.isArray(vRes) ? vRes : (vRes.data ?? []);
        const map = {};
        vouchers.forEach((v) => {
          (v.voucher_suppliers ?? []).forEach((vs) => {
            const poId = vs.nPurchaseOrderId;
            if (!map[poId]) map[poId] = v.cStatus;
          });
        });
        setVouchersByPO(map);
      } catch (err) {
        console.error("Failed to fetch vouchers:", err);
      }
    } catch (err) {
      console.error("Failed to fetch purchase orders:", err);
    } finally {
      setItemsLoading(false);
    }
  }, [fetchAllOptionHistories]);
  // ← useEffect goes HERE
  useEffect(() => {
    if (!mappingLoading) fetchAllPurchaseOrders();
  }, [mappingLoading, fetchAllPurchaseOrders]);
  const filteredPurchaseOrders = useMemo(() => {
    let result = selectedStatusCode
      ? purchaseOrders.filter(
          (po) => String(po.cStatus) === String(selectedStatusCode),
        )
      : purchaseOrders;

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((po) => {
        const opts = po.purchase_order_options || [];
        const first = opts[0]?.purchase_option;
        return (
          po.strPurchaseOrderNo?.toLowerCase().includes(q) ||
          first?.transaction_item?.transaction?.company?.strCompanyNickName
            ?.toLowerCase()
            .includes(q) ||
          first?.supplier?.strSupplierNickName?.toLowerCase().includes(q) ||
          first?.transaction_item?.transaction?.user?.strNickName
            ?.toLowerCase()
            .includes(q) ||
          opts.some((o) =>
            o.purchase_option?.transaction_item?.strName
              ?.toLowerCase()
              .includes(q),
          )
        );
      });
    }

    const statusOrder = {
      [addToCartKey]: 0,
      [purchaseOrderKey]: 1,
      [paidKey]: 2,
      [receivedKey]: 3,
      [deliveredKey]: 4,
    };

    return result.slice().sort((a, b) => {
      const aId = Number(
        a.purchase_order_options?.[0]?.purchase_option?.nPurchaseOptionId,
      );
      const bId = Number(
        b.purchase_order_options?.[0]?.purchase_option?.nPurchaseOptionId,
      );
      const aStatus = String(allOptionHistories[aId]?.nStatus ?? "");
      const bStatus = String(allOptionHistories[bId]?.nStatus ?? "");
      const aOrder = statusOrder[aStatus] ?? 999;
      const bOrder = statusOrder[bStatus] ?? 999;
      return aOrder - bOrder;
    });
  }, [
    purchaseOrders,
    selectedStatusCode,
    search,
    allOptionHistories,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
  ]);
  const fetchRef = useRef(fetchAllPurchaseOrders);
  useEffect(() => {
    fetchRef.current = fetchAllPurchaseOrders;
  }, [fetchAllPurchaseOrders]);
  useEffect(() => {
    if (mappingLoading) return;

    // In the Echo useEffect, replace fetchRef.current() calls with:
    const poChannel = echo.channel("purchase-orders");
    poChannel.listen(".purchase-order.updated", (event) => {
      if (event.action === "status_updated" && event.newStatus) {
        // Optimistic patch for instant UI response
        setPurchaseOrders((prev) =>
          prev.map((po) =>
            po.nPurchaseOrderId === event.purchaseOrderId
              ? { ...po, cStatus: event.newStatus }
              : po,
          ),
        );
        // Still refetch to keep vouchersByPO and allOptionHistories in sync
        fetchRef.current();
        return;
      }
      if (event.action === "deleted") {
        setPurchaseOrders((prev) =>
          prev.filter((po) => po.nPurchaseOrderId !== event.purchaseOrderId),
        );
        return;
      }
      fetchRef.current();
    });

    const optChannel = echo.channel("purchase-order-options");
    optChannel.listen(".purchase-order-option.updated", () => {
      fetchRef.current();
    });

    return () => {
      echo.leaveChannel("purchase-orders");
      echo.leaveChannel("purchase-order-options");
    };
  }, [mappingLoading]);
  const handleUpdateClick = ({ po }) => {
    setSelectedPOId(po.nPurchaseOrderId); // ← store ID, not the object
    setUpdateModalOpen(true);
  };
  // ADD BACK after handleUpdateClick
  const handleCreateVoucherClick = ({ po }) => {
    console.log("Create voucher for PO:", po);
  };
  // Derive selectedPO live from purchaseOrders so it always reflects latest data
  const selectedPO = useMemo(
    () =>
      purchaseOrders.find((po) => po.nPurchaseOrderId === selectedPOId) ?? null,
    [purchaseOrders, selectedPOId],
  );
  useEffect(() => {
    if (!updateModalOpen) return;
    if (!selectedPO || selectedPO.purchase_order_options?.length === 0) {
      setUpdateModalOpen(false);
    }
  }, [selectedPO, updateModalOpen]);

  const getPoSupplierId = (po) =>
    po.purchase_order_options?.[0]?.purchase_option?.supplier?.nSupplierId ??
    null;

  const toggleSelectPO = (id) => {
    setSelectedPOIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }

      const incomingPO = filteredPurchaseOrders.find(
        (po) => po.nPurchaseOrderId === id,
      );
      const incomingSupplierId = getPoSupplierId(incomingPO);

      if (prev.size > 0) {
        const existingId = [...prev][0];
        const existingPO = filteredPurchaseOrders.find(
          (po) => po.nPurchaseOrderId === existingId,
        );
        const existingSupplierId = getPoSupplierId(existingPO);

        if (incomingSupplierId !== existingSupplierId) {
          // ← REPLACE alert() with this
          if (selectErrorTimeoutRef.current)
            clearTimeout(selectErrorTimeoutRef.current);
          setSelectError(id);
          selectErrorTimeoutRef.current = setTimeout(() => {
            setSelectError("");
          }, 3000);
          return prev;
        }
      }

      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };
  const voucherEligibleIds = useMemo(() => {
    return new Set(
      filteredPurchaseOrders
        .filter((po) => {
          if (po.cStatus !== closeCartKey) return false;

          // ← ADD: exclude POs that already have an active or closed voucher
          const existingVoucherStatus = vouchersByPO[po.nPurchaseOrderId];
          if (
            existingVoucherStatus &&
            (String(existingVoucherStatus) === String(voucherActiveKey) ||
              String(existingVoucherStatus) === String(voucherClosedKey))
          ) {
            return false;
          }

          const opts = po.purchase_order_options || [];
          return (
            opts.length > 0 &&
            opts.every((o) => {
              const id = Number(o.purchase_option?.nPurchaseOptionId);
              return (
                String(allOptionHistories[id]?.nStatus ?? "") ===
                String(purchaseOrderKey)
              );
            })
          );
        })
        .map((po) => po.nPurchaseOrderId),
    );
  }, [
    filteredPurchaseOrders,
    closeCartKey,
    allOptionHistories,
    purchaseOrderKey,
    vouchersByPO, // ← ADD
    voucherActiveKey, // ← ADD
    voucherClosedKey, // ← ADD
  ]);
  const firstEligibleSupplierId = useMemo(() => {
    const firstId = [...voucherEligibleIds][0];
    if (!firstId) return null;
    const po = filteredPurchaseOrders.find(
      (p) => p.nPurchaseOrderId === firstId,
    );
    return getPoSupplierId(po);
  }, [voucherEligibleIds, filteredPurchaseOrders]);

  // Filter eligible IDs to same supplier only for Select All
  const sameSupplierEligibleIds = useMemo(() => {
    return new Set(
      [...voucherEligibleIds].filter((id) => {
        const po = filteredPurchaseOrders.find(
          (p) => p.nPurchaseOrderId === id,
        );
        return getPoSupplierId(po) === firstEligibleSupplierId;
      }),
    );
  }, [voucherEligibleIds, filteredPurchaseOrders, firstEligibleSupplierId]);

  const allEligibleSelected =
    sameSupplierEligibleIds.size > 0 &&
    [...sameSupplierEligibleIds].every((id) => selectedPOIds.has(id));
  return (
    <PageLayout
      title="Purchase Cart"
      subtitle={
        selectedStatusCode && cartStatus?.[selectedStatusCode]
          ? `/ ${cartStatus[selectedStatusCode]}`
          : ""
      }
      footer={
        voucherEligibleIds.size > 0 ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <BaseButton
              label="Create Voucher"
              icon={<ReceiptLongOutlined />}
              actionColor="approve"
              disabled={selectedPOIds.size === 0}
              // REPLACE the Create Voucher button onClick
              onClick={async () => {
                const selectedPOs = filteredPurchaseOrders.filter((po) =>
                  selectedPOIds.has(po.nPurchaseOrderId),
                );
                const supplierId = getPoSupplierId(selectedPOs[0]);

                try {
                  await withSpinner("Voucher", async () => {
                    await api.post("vouchers", {
                      cType: voucherSupplierTypeKey,
                      nTypeId: supplierId,
                      cStatus: voucherActiveKey,
                      nPurchaseOrderIds: selectedPOs.map(
                        (po) => po.nPurchaseOrderId,
                      ),
                    });
                  });
                  setSelectedPOIds(new Set());

                  await showSwal(
                    "SUCCESS",
                    {},
                    { entity: "Voucher", action: "created" },
                  );
                  await fetchAllPurchaseOrders();
                } catch (err) {
                  console.error("Failed to create voucher:", err);
                  await showSwal("ERROR", {}, { entity: "Voucher" });
                }
              }}
            />
          </Box>
        ) : (
          false
        )
      }
    >
      <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes optionErrorFade {
    from { opacity: 0; transform: translateY(-50%) scale(0.95); }
    to   { opacity: 1; transform: translateY(-50%) scale(1); }
  }
  @keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    25%       { transform: translateX(-3px); }
    75%       { transform: translateX(3px); }
  }
`}</style>
      {/* ── Toolbar ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <CustomSearchField
            label="Search PO / Supplier / Item"
            value={search}
            onChange={setSearch}
          />
        </Box>
        <SyncMenu onSync={fetchAllPurchaseOrders} />
        {voucherEligibleIds.size > 0 && (
          <button
            onClick={() =>
              allEligibleSelected
                ? setSelectedPOIds(new Set())
                : setSelectedPOIds(new Set(sameSupplierEligibleIds))
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "0.5px solid #E5E7EB",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#374151",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {allEligibleSelected ? "Unselect All" : "Select All"}
          </button>
        )}
        <button
          onClick={() => setAllCollapsed((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "0.5px solid #E5E7EB",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "#374151",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {allCollapsed ? (
            <>
              <UnfoldMore style={{ fontSize: "0.9rem" }} /> Expand All
            </>
          ) : (
            <>
              <UnfoldLess style={{ fontSize: "0.9rem" }} /> Collapse All
            </>
          )}
        </button>
      </Box>
      {itemsLoading ? (
        <PurchaseCartSkeleton />
      ) : filteredPurchaseOrders.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "60vh",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: "#F3F4F6",
              border: "0.5px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCartOutlined
              sx={{ fontSize: "1.5rem", color: "#D1D5DB" }}
            />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#374151",
                lineHeight: 1.4,
              }}
            >
              No purchase orders found
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                mt: 0.4,
                lineHeight: 1.4,
              }}
            >
              {selectedStatusCode
                ? `No orders match the selected status filter.`
                : "Items added to cart will appear here."}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 0.5,
            width: "100%",
            alignItems: "flex-start",
          }}
        >
          {/* Left column */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              width: { xs: "100%", md: "auto" },
              minWidth: 0,
            }}
          >
            {filteredPurchaseOrders
              .filter((_, i) => i % 2 === 0)
              .map((po) => (
                // In both left and right column POCard renders:
                <POCard
                  key={po.nPurchaseOrderId}
                  po={po}
                  cartStatus={cartStatus}
                  addToCartKey={addToCartKey}
                  cancelCartKey={cancelCartKey}
                  cancelPoKey={cancelPoKey}
                  purchaseOrderKey={purchaseOrderKey}
                  paidKey={paidKey}
                  receivedKey={receivedKey}
                  deliveredKey={deliveredKey}
                  removedFromCartKey={removedFromCartKey}
                  currentUserId={currentUserId}
                  openCartKey={openCartKey}
                  closeCartKey={closeCartKey} // ← ADD
                  onCreateVoucherClick={handleCreateVoucherClick} // ← ADD BACK
                  onUpdateClick={handleUpdateClick} // ← ADD BACK
                  collapsed={allCollapsed}
                  onRemoved={fetchAllPurchaseOrders}
                  optionHistories={allOptionHistories}
                  isEligible={voucherEligibleIds.has(po.nPurchaseOrderId)}
                  isSelected={selectedPOIds.has(po.nPurchaseOrderId)}
                  onToggleSelect={toggleSelectPO}
                  voucherStatus={vouchersByPO[po.nPurchaseOrderId] ?? null}
                  voucherActiveKey={voucherActiveKey}
                  voucherClosedKey={voucherClosedKey}
                  selectError={selectError === po.nPurchaseOrderId} // ← ADD
                />
              ))}
          </Box>

          {/* Right column */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              width: { xs: "100%", md: "auto" },
              minWidth: 0,
            }}
          >
            {filteredPurchaseOrders
              .filter((_, i) => i % 2 !== 0)
              .map((po) => (
                <POCard
                  key={po.nPurchaseOrderId}
                  po={po}
                  cartStatus={cartStatus}
                  addToCartKey={addToCartKey}
                  cancelCartKey={cancelCartKey}
                  cancelPoKey={cancelPoKey}
                  purchaseOrderKey={purchaseOrderKey}
                  paidKey={paidKey}
                  receivedKey={receivedKey}
                  deliveredKey={deliveredKey}
                  removedFromCartKey={removedFromCartKey}
                  currentUserId={currentUserId}
                  openCartKey={openCartKey}
                  closeCartKey={closeCartKey} // ← ADD
                  onCreateVoucherClick={handleCreateVoucherClick} // ← ADD BACK
                  onUpdateClick={handleUpdateClick} // ← ADD BACK
                  collapsed={allCollapsed}
                  onRemoved={fetchAllPurchaseOrders}
                  optionHistories={allOptionHistories}
                  isEligible={voucherEligibleIds.has(po.nPurchaseOrderId)}
                  isSelected={selectedPOIds.has(po.nPurchaseOrderId)}
                  onToggleSelect={toggleSelectPO}
                  voucherStatus={vouchersByPO[po.nPurchaseOrderId] ?? null}
                  voucherActiveKey={voucherActiveKey}
                  voucherClosedKey={voucherClosedKey}
                  selectError={selectError === po.nPurchaseOrderId}
                />
              ))}
          </Box>
        </Box>
      )}

      <PurchaseCartUpdateStatusModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        currentStatus={selectedPO?.cStatus}
        po={selectedPO}
        openCartKey={openCartKey}
        closeCartKey={closeCartKey}
        cancelCartKey={cancelCartKey}
        onUpdateStatus={async (newStatusKey) => {
          await api.patch("purchase-orders/update-cart-status", {
            nPurchaseOrderId: selectedPO?.nPurchaseOrderId,
            cStatus: newStatusKey,
            nUserId: currentUserId,
          });
          setUpdateModalOpen(false);
          fetchAllPurchaseOrders();
          window.dispatchEvent(
            new CustomEvent("cart_status_updated", {
              detail: {
                purchaseOrderId: selectedPO?.nPurchaseOrderId,
                newStatus: newStatusKey,
              },
            }),
          );
        }}
        onProceedToPayment={async ({ strShippingDetails, cPaymentTerms }) => {
          await api.patch("purchase-orders/proceed-to-payment", {
            nPurchaseOrderId: selectedPO?.nPurchaseOrderId,
            strShippingDetails,
            cPaymentTerms,
            nUserId: currentUserId,
            nStatus: purchaseOrderKey,
          });
          fetchAllPurchaseOrders();

          // ← ADD: status moves to purchaseOrderKey
          window.dispatchEvent(
            new CustomEvent("cart_status_updated", {
              detail: {
                purchaseOrderId: selectedPO?.nPurchaseOrderId,
                newStatus: purchaseOrderKey,
              },
            }),
          );
        }}
        shippingMethod={shippingMethod}
        paymentTerms={paymentTerms}
        addToCartKey={addToCartKey}
        purchaseOrderKey={purchaseOrderKey}
        paidKey={paidKey}
        receivedKey={receivedKey}
        deliveredKey={deliveredKey}
        currentUserId={currentUserId}
        cancelPoKey={cancelPoKey}
        removedFromCartKey={removedFromCartKey}
        poVoucherStatus={vouchersByPO[selectedPO?.nPurchaseOrderId] ?? null}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
        isAccountOfficer={isAccountOfficer}
        isGeneralManager={isGeneralManager}
        userTypes={userTypes}
      />
    </PageLayout>
  );
}

export default TransactionPurchaseCart;
