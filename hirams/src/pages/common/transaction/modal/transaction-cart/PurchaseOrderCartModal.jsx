// PurchaseCartUpdateStatusModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import { Box, Typography } from "@mui/material";
import {
  ShoppingCartOutlined,
  LockOutlined,
  CancelOutlined,
  ReceiptLongOutlined,
  StoreOutlined,
  LocalShippingOutlined,
  AccountCircleOutlined,
  PrintOutlined,
} from "@mui/icons-material";

import api from "../../../../../utils/api/api.js";
import MiniBaseButton from "../../../../../components/common/MiniBaseButton.jsx";
import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog.jsx";
import { PurchaseCartModalSkeleton } from "../../../../../components/helper/Skeleton.jsx";
import { printRoute } from "../../../../../utils/helpers/printRoute.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";

import CartProgressStepper from "../../components/transaction-cart/CartProgressStepper.jsx";
import LineItems from "../../components/transaction-cart/LineItems.jsx";
import PaymentTermsForm from "../../components/transaction-cart/PaymentTermsForm.jsx";

// ── Formatters (exported — LineItems.jsx imports these) ───────────────────────
export const fmtDateTime = (val) => {
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
export const fmtPHP = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ── Shared Sub-components (exported — LineItems.jsx imports IconBox) ──────────
export const IconBox = ({
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

// ── Confirmation dialog styles ─────────────────────────────────────────────────
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
  print_po: {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <PrintOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Print this Purchase Order?",
    desc: "This will open the print view for this purchase order.",
    confirmLabel: "Yes, Print PO",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  },
};

// ── DarkHeader ──────────────────────────────────────────────────────────────────
const DarkHeader = ({
  po,
  options,
  assignedAONickName,
  firstOption,
  actionButtons,
  allOptionsAtPO,
  allOptionsAtDelivered,
  handleUpdate,
  cancelCartKey,
  total,
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mt: 0.4,
              flexWrap: "nowrap",
            }}
          >
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
                {assignedAONickName}
              </Typography>
            </Box>

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

        {handleUpdate && (
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            {allOptionsAtPO ? (
              <>
                <MiniBaseButton.Green
                  onClick={() => handleUpdate("print_po")}
                  icon={<PrintOutlined />}
                  label="Print PO"
                />
                <MiniBaseButton.Red
                  onClick={() => handleUpdate(cancelCartKey)}
                  icon={<CancelOutlined />}
                  label="Cancel"
                />
              </>
            ) : allOptionsAtDelivered ? (
              <>
                {/* <MiniBaseButton.Green
                  onClick={console.log("print delivery receipt clicked!")}
                  icon={<PrintOutlined />}
                  label="Print Delivery Receipt"
                />
                <MiniBaseButton.Red
                  onClick={() => handleUpdate(cancelCartKey)}
                  icon={<CancelOutlined />}
                  label="Cancel"
                /> */}
              </>
            ) : (
              actionButtons.map(({ key, label, icon, border }) => {
                const variant =
                  border?.includes("34,197") || border?.includes("134,239")
                    ? "green"
                    : border?.includes("96,165") || border?.includes("147,197")
                      ? "blue"
                      : border?.includes("239,68")
                        ? "red"
                        : "blue";
                return (
                  <MiniBaseButton
                    key={key}
                    variant={variant}
                    onClick={() => handleUpdate(key)}
                    icon={icon}
                    label={label}
                  />
                );
              })
            )}
          </Box>
        )}
      </Box>
    </Box>
  </Box>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function PurchaseOrderCartModal({
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
  removedFromCartKey,
  po,
  poVoucherStatus,
  voucherActiveKey,
  voucherClosedKey,
  isGeneralManager,
  isAccountOfficer,
  userTypes,
  // ── FIX 1: histories the parent already fetched for the whole list ──
  optionHistories: optionHistoriesProp,
  // ── FIX 3: AO/GM name directory fetched once at the parent level ──
  aoGmDirectory,
}) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    strShippingDetails: "",
    cPaymentTerms: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [optionHistories, setOptionHistories] = useState({});
  const [historiesLoading, setHistoriesLoading] = useState(true);
  const [isArrivedView, setIsArrivedView] = useState(false);
  const [liveOptions, setLiveOptions] = useState([]);

  useEffect(() => {
    setLiveOptions(po?.purchase_order_options || []);
  }, [po]);
  const options = po?.purchase_order_options || [];
  const firstOption = options[0];
  const [lineItemSaving, setLineItemSaving] = useState(false);
  const assignedAONickName = (() => {
    const u = firstOption?.purchase_option?.transaction_item?.transaction?.user;
    if (!u) return "—";
    return u.strNickName?.trim() || "—";
  })();

  const assignedAOUserId =
    firstOption?.purchase_option?.transaction_item?.transaction?.user?.nUserId;

  const assignedAOName = (() => {
    const u = firstOption?.purchase_option?.transaction_item?.transaction?.user;
    if (!u) return "—";
    const first = u.strFName ?? "";
    const middle = u.strMName ? u.strMName.charAt(0).toUpperCase() + "." : "";
    const last = u.strLName ?? "";
    return [first, middle, last].filter(Boolean).join(" ").trim();
  })();

  // ── FIX 3 (cont'd): derive "other AO" specific to THIS po's assigned AO,
  // from the directory's already-fetched user list, with no network call ──
  const checkByOtherAOName = useMemo(() => {
    const users = aoGmDirectory?._users;
    const accountOfficerKey = aoGmDirectory?._accountOfficerKey;
    if (!users || !accountOfficerKey) {
      return aoGmDirectory?.checkByOtherAOName ?? "—";
    }
    const ao = users.find(
      (u) =>
        accountOfficerKey.includes(String(u.cUserType)) &&
        Number(u.nUserId) !== Number(assignedAOUserId),
    );
    if (!ao) return aoGmDirectory?.checkByOtherAOName ?? "—";
    const first = ao.strFName ?? "";
    const middle = ao.strMName ? ao.strMName.charAt(0).toUpperCase() + "." : "";
    const last = ao.strLName ?? "";
    return [first, middle, last].filter(Boolean).join(" ").trim() || "—";
  }, [aoGmDirectory, assignedAOUserId]);

  const generalManagerName = aoGmDirectory?.generalManagerName ?? "—";

  useEffect(() => {
    if (open) {
      setConfirmAction(null);
      setLoading(false);
      setShowPaymentForm(false);
      setPaymentForm({ strShippingDetails: "", cPaymentTerms: "" });
      setPaymentLoading(false);
      setPaymentErrors({});
      setEditMode(false);
      setIsArrivedView(false);
    }
  }, [open]);

  // ── FIX 1 (cont'd): only hit the network if the parent's cache doesn't
  // already cover every option id this PO needs. Normally this resolves
  // instantly from optionHistoriesProp with zero extra requests. ──
  useEffect(() => {
    if (!open) return;
    const ids = (po?.purchase_order_options || [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);

    if (!ids.length) {
      setOptionHistories({});
      setHistoriesLoading(false);
      return;
    }

    const hasAllFromParent = ids.every((id) =>
      Object.prototype.hasOwnProperty.call(
        optionHistoriesProp || {},
        Number(id),
      ),
    );

    if (hasAllFromParent) {
      setOptionHistories(optionHistoriesProp);
      setHistoriesLoading(false);
      return;
    }

    if (!purchaseOrderKey) {
      setHistoriesLoading(false);
      return;
    }

    let cancelled = false;
    setHistoriesLoading(true);
    api
      .post("purchase-item-histories/latest", { nPurchaseOptionId: ids })
      .then((res) => {
        if (cancelled) return;
        const map = {};
        (res?.histories || []).forEach((h) => {
          map[Number(h.nPurchaseOptionId)] = h;
        });
        setOptionHistories(map);
      })
      .catch((err) => console.error("fetchOptionHistories error:", err))
      .finally(() => {
        if (!cancelled) setHistoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, po, purchaseOrderKey, optionHistoriesProp]);

  // ── FIX 4: a single combined loading flag — gates the skeleton on BOTH
  // "histories not ready" AND "po itself not ready yet", which is what was
  // causing the skeleton -> blank -> skeleton double-flash before. ──
  const isLoadingModal = historiesLoading || !po;

  if (!open) return null;

  const toSlot = (key) =>
    key === openCartKey
      ? "open"
      : key === closeCartKey
        ? "close"
        : key === cancelCartKey
          ? "cancel"
          : key === "print_po"
            ? "print_po"
            : "open";

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
  const allOptionsAtDelivered = options.every(
    (opt) =>
      String(
        optionHistories[Number(opt.purchase_option?.nPurchaseOptionId)]
          ?.nStatus,
      ) === String(deliveredKey),
  );

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

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      if (confirmAction === "print_po") {
        sessionStorage.setItem(
          "printPO_data",
          JSON.stringify({
            po,
            options,
            assignedAOName,
            firstOption,
            total,
            checkByOtherAOName,
            generalManagerName,
          }),
        );
        printRoute("/print-po");
        setConfirmAction(null);
        return;
      }
      await onUpdateStatus?.(confirmAction);
      await showSwal(
        "SUCCESS",
        {},
        { entity: "Purchase Order", action: "updated" },
      );
    } catch (err) {
      console.error("Failed to update cart status:", err);
      await showSwal("ERROR", {}, { entity: "Purchase Order" });
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
    onClose();
    setPaymentLoading(true);
    try {
      await withSpinner("Purchase Order", async () => {
        await onProceedToPayment?.(paymentForm);
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: "Purchase Order", action: "submitted" },
      );
    } catch {
      await showSwal("ERROR", {}, { entity: "Purchase Order" });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <ModalContainer
        open={open}
        handleClose={onClose}
        title="Purchase Order Cart"
        subTitle={
          po?.strPurchaseOrderNo
            ? `/ ${po.strPurchaseOrderNo}${showPaymentForm ? " / PO Details" : ""}`
            : ""
        }
        contentPadding={0}
        hideActions
        showSave={
          !confirmAction &&
          currentStatus === closeCartKey &&
          !(
            poVoucherStatus &&
            (String(poVoucherStatus) === String(voucherActiveKey) ||
              String(poVoucherStatus) === String(voucherClosedKey))
          )
        }
        saveLabel={
          showPaymentForm
            ? "Submit"
            : po?.strShippingDetails || po?.cPaymentTerms
              ? "Edit PO Details"
              : "Proceed to PO Details"
        }
        onSave={
          showPaymentForm
            ? handleProceedToPayment
            : () => {
                setPaymentForm({
                  strShippingDetails: po?.strShippingDetails ?? "",
                  cPaymentTerms: po?.cPaymentTerms ?? "",
                });
                setShowPaymentForm(true);
              }
        }
        cancelLabel={showPaymentForm ? "Back" : "Close"}
        onCancel={showPaymentForm ? () => setShowPaymentForm(false) : onClose}
        disabled={isLoadingModal || paymentLoading || loading}
      >
        {isLoadingModal ? (
          <PurchaseCartModalSkeleton />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {confirmAction && conf ? (
              <ConfirmationDialog
                style={conf}
                voucherNumber={po?.strPurchaseOrderNo}
                loading={loading}
                onConfirm={handleConfirm}
                onBack={() => setConfirmAction(null)}
              />
            ) : showPaymentForm ? (
              <PaymentTermsForm
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                paymentErrors={paymentErrors}
                paymentTerms={paymentTerms}
              />
            ) : (
              <>
                <CartProgressStepper
                  optionHistories={optionHistories}
                  options={liveOptions}
                  addToCartKey={addToCartKey}
                  purchaseOrderKey={purchaseOrderKey}
                  paidKey={paidKey}
                  receivedKey={receivedKey}
                  deliveredKey={deliveredKey}
                  cancelPoKey={cancelPoKey}
                  cancelCartKey={cancelCartKey}
                  historiesLoading={historiesLoading}
                />

                {!isArrivedView && (
                  <DarkHeader
                    po={po}
                    options={options}
                    assignedAONickName={assignedAONickName}
                    firstOption={firstOption}
                    actionButtons={actionButtons}
                    allOptionsAtPO={allOptionsAtPO}
                    handleUpdate={(key) => setConfirmAction(key)}
                    cancelCartKey={cancelCartKey}
                    total={total}
                    allOptionsAtDelivered={allOptionsAtDelivered}
                  />
                )}

                {!isArrivedView &&
                  (currentStatus === closeCartKey || allOptionsAtPO) &&
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
                      options={liveOptions} // ← same
                      onPatchOption={(nPurchaseOptionId, patch) => {
                        setLiveOptions((prev) =>
                          prev.map((opt) =>
                            opt.purchase_option?.nPurchaseOptionId !==
                            nPurchaseOptionId
                              ? opt
                              : {
                                  ...opt,
                                  purchase_option: {
                                    ...opt.purchase_option,
                                    ...patch,
                                  },
                                },
                          ),
                        );
                      }}
                      total={total}
                      openCartKey={openCartKey}
                      paidKey={paidKey}
                      receivedKey={receivedKey}
                      deliveredKey={deliveredKey}
                      removedFromCartKey={removedFromCartKey}
                      currentUserId={currentUserId}
                      poStatus={currentStatus}
                      optionHistories={optionHistories}
                      onArrivedViewChange={setIsArrivedView}
                      onRemoved={() => {
                        window.dispatchEvent(
                          new CustomEvent("cart_data_updated"),
                        );
                      }}
                      // ─────────────────────────────────────────────────────────────────────────────
                      // DROP-IN REPLACEMENT for the onMarkReceived prop passed to <LineItems />
                      // inside PurchaseOrderCartModal.jsx
                      //
                      // Behaviour contract
                      // ──────────────────
                      //  RECEIVED (positive rows)
                      //   • Add  (nInventoryId is null, qty > 0)  → INSERT one row with the full qty
                      //   • Edit → increase (e.g. 10 → 15)        → INSERT one row with the delta (+5)
                      //   • Edit → decrease (e.g. 10 → 5)         → DELETE rows newest-first until
                      //                                              sum == target (or INSERT a tiny
                      //                                              correction row if needed)
                      //   • Edit → zero     (qty === 0)            → DELETE all positive rows for this option
                      //
                      //  DELIVERED (negative rows, stored as negative integers)
                      //   Same shape — just uses nDeliveredInventoryId and negative quantities.
                      //
                      //  Serial numbers
                      //   Synced against whatever inventory row is the "primary" one we just
                      //   created/kept — same as before.
                      // ─────────────────────────────────────────────────────────────────────────────

                      onMarkReceived={async (
                        nPurchaseOptionId,
                        receivedQty, // "" = skip received side
                        deliveredQty, // "" = skip delivered side
                        nInventoryId, // current primary positive-row id (may be null)
                        nDeliveredInventoryId, // current primary negative-row id (may be null)
                        receivedSerials = [],
                        deliveredSerials = [],
                      ) => {
                        try {
                          // ── helpers ──────────────────────────────────────────────────────────
                          /**
                           * Fetch all positive (or negative) inventory rows for this option,
                           * ordered newest-first.
                           */
                          const fetchRows = async (
                            sign /* 'positive' | 'negative' */,
                          ) => {
                            const res = await api.get(
                              `inventory?nPurchaseOptionId=${nPurchaseOptionId}`,
                            );
                            const all = res?.inventories || [];
                            return sign === "positive"
                              ? all
                                  .filter((r) => r.nQuantity > 0)
                                  .sort(
                                    (a, b) =>
                                      new Date(b.dtLog) - new Date(a.dtLog),
                                  )
                              : all
                                  .filter((r) => r.nQuantity < 0)
                                  .sort(
                                    (a, b) =>
                                      new Date(b.dtLog) - new Date(a.dtLog),
                                  );
                          };

                          /**
                           * Trim rows (newest-first) until their absolute sum == target.
                           * Deletes whole rows when possible; updates the last one if a partial
                           * trim is needed. Returns the surviving primary row id (or null).
                           */
                          const trimToTarget = async (rows, targetAbs) => {
                            let remaining = targetAbs;
                            let primaryId = null;

                            for (const row of rows) {
                              const abs = Math.abs(row.nQuantity);
                              if (remaining <= 0) {
                                // delete everything beyond what we need
                                await api.delete(
                                  `inventory/${row.nInventoryId}`,
                                );
                              } else if (abs <= remaining) {
                                // keep this row intact
                                remaining -= abs;
                                primaryId = primaryId ?? row.nInventoryId;
                              } else {
                                // partial: shrink this row
                                const newQty =
                                  row.nQuantity > 0 ? remaining : -remaining;
                                await api.put(`inventory/${row.nInventoryId}`, {
                                  nQuantity: newQty,
                                });
                                primaryId = primaryId ?? row.nInventoryId;
                                remaining = 0;
                              }
                            }
                            return primaryId;
                          };

                          // ── RECEIVED side ────────────────────────────────────────────────────
                          let finalInventoryId = nInventoryId;

                          if (receivedQty !== "") {
                            const newQty = Number(receivedQty);
                            const rows = await fetchRows("positive");
                            const sumNow = rows.reduce(
                              (s, r) => s + r.nQuantity,
                              0,
                            );

                            if (newQty === 0) {
                              // Delete every positive row
                              for (const r of rows)
                                await api.delete(`inventory/${r.nInventoryId}`);
                              finalInventoryId = null;
                            } else if (sumNow === 0 || rows.length === 0) {
                              // First entry — insert one row with the full qty
                              const res = await api.post("inventory", {
                                nPurchaseOptionId,
                                nQuantity: newQty,
                              });
                              finalInventoryId =
                                res.inventory?.nInventoryId ?? null;
                            } else if (newQty > sumNow) {
                              // Increasing — insert a delta row
                              const delta = newQty - sumNow;
                              const res = await api.post("inventory", {
                                nPurchaseOptionId,
                                nQuantity: delta,
                              });
                              // Keep the original primary id for SN syncing (first/oldest row)
                              finalInventoryId =
                                rows[rows.length - 1]?.nInventoryId ??
                                res.inventory?.nInventoryId ??
                                null;
                            } else if (newQty < sumNow) {
                              // Decreasing — trim newest rows until sum == newQty
                              finalInventoryId = await trimToTarget(
                                rows,
                                newQty,
                              );
                            }
                            // newQty === sumNow → nothing to change
                          }

                          // ── Received SN sync ─────────────────────────────────────────────────
                          if (finalInventoryId) {
                            const existingRes = await api.get(
                              `serial-numbers?nInventoryId=${finalInventoryId}`,
                            );
                            const existing = existingRes.serial_numbers || [];
                            const existingVals = existing.map(
                              (s) => s.strSerialNumber,
                            );

                            for (const s of existing) {
                              if (
                                !receivedSerials.includes(s.strSerialNumber)
                              ) {
                                await api.delete(`serial-numbers/${s.nSNId}`);
                              }
                            }
                            for (const sn of receivedSerials) {
                              if (!existingVals.includes(sn)) {
                                await api.post("serial-numbers", {
                                  nInventoryId: finalInventoryId,
                                  strSerialNumber: sn,
                                });
                              }
                            }
                          }

                          // ── DELIVERED side ───────────────────────────────────────────────────
                          let finalDeliveredInventoryId = nDeliveredInventoryId;

                          if (deliveredQty !== "") {
                            const newQty = Number(deliveredQty);
                            const rows = await fetchRows("negative");
                            const sumNow = rows.reduce(
                              (s, r) => s + Math.abs(r.nQuantity),
                              0,
                            );

                            if (newQty === 0) {
                              for (const r of rows)
                                await api.delete(`inventory/${r.nInventoryId}`);
                              finalDeliveredInventoryId = null;
                            } else if (sumNow === 0 || rows.length === 0) {
                              const res = await api.post("inventory", {
                                nPurchaseOptionId,
                                nQuantity: -newQty,
                              });
                              finalDeliveredInventoryId =
                                res.inventory?.nInventoryId ?? null;
                            } else if (newQty > sumNow) {
                              const delta = newQty - sumNow;
                              const res = await api.post("inventory", {
                                nPurchaseOptionId,
                                nQuantity: -delta,
                              });
                              finalDeliveredInventoryId =
                                rows[rows.length - 1]?.nInventoryId ??
                                res.inventory?.nInventoryId ??
                                null;
                            } else if (newQty < sumNow) {
                              finalDeliveredInventoryId = await trimToTarget(
                                rows,
                                newQty,
                              );
                            }
                          }

                          // ── Delivered SN sync ────────────────────────────────────────────────
                          if (finalDeliveredInventoryId) {
                            const existingRes = await api.get(
                              `serial-numbers?nInventoryId=${finalDeliveredInventoryId}`,
                            );
                            const existing = existingRes.serial_numbers || [];
                            const existingVals = existing.map(
                              (s) => s.strSerialNumber,
                            );

                            for (const s of existing) {
                              if (
                                !deliveredSerials.includes(s.strSerialNumber)
                              ) {
                                await api.delete(`serial-numbers/${s.nSNId}`);
                              }
                            }
                            for (const sn of deliveredSerials) {
                              if (!existingVals.includes(sn)) {
                                await api.post("serial-numbers", {
                                  nInventoryId: finalDeliveredInventoryId,
                                  strSerialNumber: sn,
                                });
                              }
                            }
                          }

                          // ✅ CORRECT — dispatch AFTER all writes are done
                          await api.post("purchase-order/sync-status", {
                            nPurchaseOrderId: po?.nPurchaseOrderId,
                            nPurchaseOptionId: nPurchaseOptionId,
                            nUserId: currentUserId,
                            nReceivedStatus: receivedKey,
                            nDeliveredStatus: deliveredKey,
                            nPaidStatus: paidKey,
                          });

                          window.dispatchEvent(
                            new CustomEvent("cart_data_updated"),
                          ); // ← moved here
                          window.dispatchEvent(
                            new CustomEvent("inventory_data_updated"),
                          ); // ← moved here
                        } catch (err) {
                          console.error(
                            "Failed to insert/update inventory:",
                            err,
                          );
                        }
                      }}
                      onSavingChange={setLineItemSaving}
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
