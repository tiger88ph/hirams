// PurchaseCartUpdateStatusModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import ModalContainer from "../../layouts/modal/ModalContainer.jsx";
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
  ArrowBackOutlined, // ← add
  CheckCircleOutlined, // ← add
} from "@mui/icons-material";

import BaseButton from "../../components/common/BaseButton.jsx"; // ← add
import PurchaseItemHistoriesAPI from "../../api/endpoints/purchase-item-histories.api.js";
import DirectCostAPI from "../../api/endpoints/direct-cost.api.js";
import DirectCostOptionAPI from "../../api/endpoints/direct-cost-option.api.js";
import InventoryAPI from "../../api/endpoints/inventory.api.js";
import SerialNumberAPI from "../../api/endpoints/serial-number.api.js";
import PurchaseOrderAPI from "../../api/endpoints/purchase-order.api.js";
import MiniBaseButton from "../../components/common/MiniBaseButton.jsx";
import ConfirmationDialog from "../../components/common/ConfirmationDialog.jsx";
import { PurchaseCartModalSkeleton } from "../../components/helper/Skeleton.jsx";
import { printRoute } from "../../utils/helpers/printRoute.js";
import { showSwal, withSpinner } from "../../utils/helpers/swal.jsx";
import DarkHeader from "../components/DarkHeader.jsx";
import CartProgressStepper from "../common/transaction/purchase-cart/components/CartProgressStepper.jsx";
import LineItems from "../common/transaction/purchase-cart/components/LineItems.jsx";
import PaymentTermsForm from "../components/PaymentTermsForm.jsx";
import { CART_CONFIRM_STYLES } from "../../utils/style/sharedConfirmStyles.jsx";
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
  optionHistories: optionHistoriesProp,
  aoGmDirectory,
  rpTypeKey,
  diTypeKey,
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
  const [arrivedFooterActions, setArrivedFooterActions] = useState(null); // ← add
  const [liveOptions, setLiveOptions] = useState([]);
  const [freightAmount, setFreightAmount] = useState(0);
  const [ewtAmount, setEwtAmount] = useState(0);
  const [directCostLoading, setDirectCostLoading] = useState(false);

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
      setArrivedFooterActions(null); // ← add
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
    PurchaseItemHistoriesAPI.getLatest({ nPurchaseOptionId: ids })
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
  const nTransactionId =
    firstOption?.purchase_option?.transaction_item?.transaction?.nTransactionId;

  useEffect(() => {
    if (!open || !nTransactionId) return;
    let active = true;
    setDirectCostLoading(true);

    const getCachedOptions = async () => {
      const cached = sessionStorage.getItem("direct_cost_options_cache");
      if (cached) return JSON.parse(cached);
      const res = await DirectCostOptionAPI.getDirectCostOptions();
      const opts = res.data || res || [];
      sessionStorage.setItem("direct_cost_options_cache", JSON.stringify(opts));
      return opts;
    };

    const fetchFreightAndEwt = async () => {
      try {
        const [options, costsRes] = await Promise.all([
          getCachedOptions(),
          DirectCostAPI.getDirectCosts({
            nTransactionID: nTransactionId,
            withEWT: 1,
          }),
        ]);
        if (!active) return;

        const getOptionName = (optionId) => {
          const found = options.find(
            (o) => (o.nDirectCostOptionID || o.id) === optionId,
          );
          return (found?.strName || found?.name || "").toLowerCase();
        };

        const directCosts =
          costsRes.directCosts || costsRes.data || costsRes || [];
        const totalEWT = Number(costsRes.totalEWT) || 0;

        let ewt = 0;
        let ewtRecordFound = false;
        let freight = 0;

        directCosts.forEach((cost) => {
          const name = getOptionName(cost.nDirectCostOptionID); // e.g. "freight-in"
          const amount = Number(cost.dAmount || 0);
          if (name.includes("ewt")) {
            ewt += amount;
            ewtRecordFound = true;
          } else if (name.includes("freight")) {
            // "freight-in".includes("freight") → true
            freight += amount;
          }
        });

        setEwtAmount(ewtRecordFound && ewt > 0 ? ewt : totalEWT);
        setFreightAmount(freight);
      } catch (err) {
        console.error("Error fetching Freight/EWT:", err);
      } finally {
        if (active) setDirectCostLoading(false);
      }
    };

    fetchFreightAndEwt();
    return () => {
      active = false;
    };
  }, [open, nTransactionId]);
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
  // Hide the shipping/payment summary once any item has progressed past
  // the "close cart" stage into paid / received / delivered.
  const anyOptionArrived = options.some((opt) => {
    const status =
      optionHistories[Number(opt.purchase_option?.nPurchaseOptionId)]?.nStatus;
    return (
      String(status) === String(paidKey) ||
      String(status) === String(receivedKey) ||
      String(status) === String(deliveredKey)
    );
  });

  const conf = confirmAction
    ? CART_CONFIRM_STYLES[toSlot(confirmAction)]
    : null;
  const ACTION_BUTTONS = {
    [openCartKey]: [
      {
        key: closeCartKey,
        label: "Close",
        icon: <LockOutlined sx={{ fontSize: "0.65rem", color: "#15803d" }} />,
        textColor: "#15803d",
        bg: "#e6f7ed", // soft mint tint on white
        border: "#86efac",
        hoverBg: "#dcfce7",
        hoverBorder: "#4ade80",
      },
      {
        key: cancelCartKey,
        label: "Cancel",
        icon: <CancelOutlined sx={{ fontSize: "0.65rem", color: "#dc2626" }} />,
        textColor: "#dc2626",
        bg: "#fef2f2", // soft pink tint on white
        border: "#fecaca",
        hoverBg: "#fee2e2",
        hoverBorder: "#fca5a5",
      },
    ],
    [closeCartKey]: [
      {
        key: cancelCartKey,
        label: "Cancel",
        icon: <CancelOutlined sx={{ fontSize: "0.65rem", color: "#dc2626" }} />,
        textColor: "#dc2626",
        bg: "#fef2f2",
        border: "#fecaca",
        hoverBg: "#fee2e2",
        hoverBorder: "#fca5a5",
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
            freightAmount, // ← add
            ewtAmount, // ← add
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
        title="Purchase Order Cart-V2"
        subTitle={
          po?.strPurchaseOrderNo
            ? `/ ${po.strPurchaseOrderNo}${showPaymentForm ? "/ PO Details" : ""}`
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
        cancelLabel={
          isArrivedView && arrivedFooterActions
            ? arrivedFooterActions.backLabel || "Back"
            : showPaymentForm
              ? "Back"
              : "Close"
        }
        onCancel={
          isArrivedView && arrivedFooterActions
            ? arrivedFooterActions.onBack
            : showPaymentForm
              ? () => setShowPaymentForm(false)
              : onClose
        }
        disabled={isLoadingModal || paymentLoading || loading}
        extraActions={
          isArrivedView && arrivedFooterActions?.primary ? (
            <BaseButton
              label={arrivedFooterActions.primary.label}
              actionColor="confirm"
              disabled={arrivedFooterActions.primary.disabled}
              onClick={arrivedFooterActions.primary.onClick}
            />
          ) : null
        }
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
                {!isArrivedView && (
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

                    <DarkHeader
                      po={po}
                      options={options}
                      assignedAONickName={assignedAONickName}
                      firstOption={firstOption}
                      actionButtons={actionButtons}
                      allOptionsAtPO={allOptionsAtPO}
                      allOptionsAtDelivered={allOptionsAtDelivered}
                      handleUpdate={(key) => setConfirmAction(key)}
                      cancelCartKey={cancelCartKey}
                    />
                  </>
                )}

                {!isArrivedView &&
                  !anyOptionArrived &&
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
                    <Box
                      sx={{
                        px: 2,
                        pt: 1,
                        pb: 1.5,
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
                          flexShrink: 0,
                        }}
                      >
                        {!isArrivedView ? "Offers" : "Offered Item"}
                      </Typography>
                      <Box
                        sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }}
                      />
                      {!anyOptionArrived && (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.3,
                                px: 0.75,
                                py: 0.25,
                                borderRadius: "50px",
                                background: "#FFF7ED",
                                border: "0.5px solid #FDBA74",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.55rem",
                                  fontWeight: 700,
                                  color: "#C2410C",
                                }}
                              >
                                Freight:
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.58rem",
                                  fontWeight: 700,
                                  color: "#9A3412",
                                }}
                              >
                                {directCostLoading
                                  ? "…"
                                  : fmtPHP(freightAmount)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.3,
                                px: 0.75,
                                py: 0.25,
                                borderRadius: "50px",
                                background: "#FEF3C7",
                                border: "0.5px solid #FCD34D",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.55rem",
                                  fontWeight: 700,
                                  color: "#92400E",
                                }}
                              >
                                EWT:
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.58rem",
                                  fontWeight: 700,
                                  color: "#78350F",
                                }}
                              >
                                {directCostLoading ? "…" : fmtPHP(ewtAmount)}
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>

                    <LineItems
                      options={liveOptions} // ← same
                      nPurchaseOrderId={po?.nPurchaseOrderId}
                      poNumber={po?.strPurchaseOrderNo}
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
                      closeCartKey={closeCartKey}
                      paidKey={paidKey}
                      receivedKey={receivedKey}
                      deliveredKey={deliveredKey}
                      removedFromCartKey={removedFromCartKey}
                      currentUserId={currentUserId}
                      poStatus={currentStatus}
                      optionHistories={optionHistories}
                      onArrivedViewChange={setIsArrivedView}
                      onFooterActionsChange={setArrivedFooterActions}
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
                        receivedQty, // "" = skip; amount to INSERT (not a total)
                        deliveredQty, // "" = skip; amount to INSERT (not a total)
                        _nInventoryId, // unused now — insert-only, no target row to reconcile
                        _nDeliveredInventoryId, // unused now — insert-only
                        receivedSerials = [],
                        deliveredSerials = [],
                        receivedReceiptNo = "",
                        deliveredReceiptNo = "",
                      ) => {
                        try {
                          // ── RECEIVED side — always INSERT a fresh row for the entered qty ──
                          if (receivedQty !== "" && Number(receivedQty) > 0) {
                            const res = await InventoryAPI.createInventory({
                              nPurchaseOptionId,
                              nQuantity: Number(receivedQty),
                              strReceiptNumber: receivedReceiptNo || null,
                              cStatus: "P",
                            });
                            const newInventoryId =
                              res.inventory?.nInventoryId ?? null;
                            if (newInventoryId) {
                              for (const sn of receivedSerials) {
                                await SerialNumberAPI.createSerialNumber({
                                  nInventoryId: newInventoryId,
                                  strSerialNumber: sn,
                                });
                              }
                            }
                          }
                          // ── DELIVERED side — always INSERT a fresh (negative) row ──────────
                          if (deliveredQty !== "" && Number(deliveredQty) > 0) {
                            const res = await InventoryAPI.createInventory({
                              nPurchaseOptionId,
                              nQuantity: -Number(deliveredQty),
                              strReceiptNumber: deliveredReceiptNo,
                              cStatus: "P",
                            });
                            const newDeliveredInventoryId =
                              res.inventory?.nInventoryId ?? null;
                            if (newDeliveredInventoryId) {
                              for (const sn of deliveredSerials) {
                                await SerialNumberAPI.createSerialNumber({
                                  nInventoryId: newDeliveredInventoryId,
                                  strSerialNumber: sn,
                                });
                              }
                            }
                          }
                          await PurchaseOrderAPI.syncStatus({
                            nPurchaseOrderId: po?.nPurchaseOrderId,
                            nPurchaseOptionId: nPurchaseOptionId,
                            nUserId: currentUserId,
                            nReceivedStatus: receivedKey,
                            nDeliveredStatus: deliveredKey,
                            nPaidStatus: paidKey,
                          });
                          // ── Refresh THIS option's status locally so the
                          // CartProgressStepper (which reads optionHistories,
                          // not liveOptions) advances immediately instead of
                          // waiting on an external refetch that this modal
                          // never listens for. ──
                          try {
                            const histRes =
                              await PurchaseItemHistoriesAPI.getLatest({
                                nPurchaseOptionId: [nPurchaseOptionId],
                              });
                            const updated = histRes?.histories?.[0];
                            if (updated) {
                              setOptionHistories((prev) => ({
                                ...prev,
                                [Number(nPurchaseOptionId)]: updated,
                              }));
                            }
                          } catch (histErr) {
                            console.error(
                              "Failed to refresh option history:",
                              histErr,
                            );
                          }
                          window.dispatchEvent(
                            new CustomEvent("cart_data_updated"),
                          );
                          window.dispatchEvent(
                            new CustomEvent("inventory_data_updated"),
                          );
                        } catch (err) {
                          console.error("Failed to insert inventory:", err);
                        }
                      }}
                      onSavingChange={setLineItemSaving}
                      purchaseOrderKey={purchaseOrderKey}
                      rpTypeKey={rpTypeKey}
                      diTypeKey={diTypeKey}
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
