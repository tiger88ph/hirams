import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Tooltip } from "@mui/material";
import {
  LocalShippingOutlined,
  ReceiptLongOutlined,
  StoreOutlined,
  AccountCircleOutlined,
  ReceiptOutlined,
} from "@mui/icons-material";

import PageLayout from "../../../../../../layouts/page/content-page/index.jsx";
import BaseButton from "../../../../../../components/form/BaseButton.jsx";
import { CartUpdateSkeleton } from "../../components/Skeleton.jsx";
import CartProgressStepper from "../../components/CartProgressStepper.jsx";
import LineItems from "../../components/LineItems.jsx";
import PurchaseCartUpdateModal from "../../modal/PurchaseCartUpdateModal.jsx";
import PODetailsUpdateModal from "../../modal/PODetailsUpdateModal.jsx";
import ManagePOVoucherModal from "../../modal/ManagePOVoucherModal.jsx";
import getThemeColors from "../../../../../../utils/style/getThemeColors.js";
import ContentHeaderStructure from "../../../../../../components/structure/ContentHeaderStructure.jsx";
import CardStructure from "../../../../../../components/structure/CardStructure.jsx";
import useKeysLabels from "../../../../../../hooks/useKeysLabels.js";
import icons from "../../../../../../utils/style/iconFormatStyles.jsx";
import ReceivePanel from "../../components/ReceivePanel.jsx";

const useColors = (c) => ({
  border: c.slate.border,
  borderFaint: c.slate.divider,
  bgCard: c.slate.outerBg,
  bgHeader: c.slate.itemHeaderBg,
  bgSubCard: c.slate.innerBg,
  bgOrangeBadge: c.badge.orangeBg,
  bgAmberBadge: c.badge.amberBg,
  textMuted: c.gray.textSecondary,
  textMutedAlt: c.gray.textDisabled,
  textBody: c.gray.textPrimary,
  textBodySoft: c.gray.textHeading,
  textOrange: c.orange.text,
  textOrangeDark: c.amber.text,
  textAmber: c.amber.text,
  borderOrange: c.orange.border,
  borderAmber: c.amber.border,
  buttonBg: c.slate.btnBg,
  buttonHover: c.slate.btnHoverBg,
  danger: c.red.text,
});

// ─────────────────────────────────────────────────────────────────
// VARIANT COLORS — accent border + icon color per InfoCard variant
// ─────────────────────────────────────────────────────────────────
const VARIANT_COLORS = (c) => ({
  default: { border: c.slate.border, icon: c.gray.textSecondary },
  info: { border: c.blue.border, icon: c.blue.text },
  success: { border: c.green.border, icon: c.green.text },
  warn: { border: c.amber.border, icon: c.amber.text },
});

export const IconBox = ({
  size = 34,
  bg,
  border,
  radius = "8px",
  mr = 1,
  children,
  sx = {},
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg || c.bgSubCard,
        border: border || `0.5px solid ${c.borderFaint}`,
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
};

// ─────────────────────────────────────────────────────────────────
// InfoCard — styled sub-card used inside the PO header
// (mirrors the StatCard visual language from TransactionItemsTable:
//  colored left accent border, uppercase label, oversized faint icon
//  watermark bleeding off the bottom-right corner)
// ─────────────────────────────────────────────────────────────────
export const InfoCard = ({
  icon,
  label,
  variant = "default",
  flex = 1,
  minWidth,
  children,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  const v = React.useMemo(
    () => VARIANT_COLORS(base)[variant] ?? VARIANT_COLORS(base).default,
    [base, variant],
  );

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        flex,
        minWidth,
        px: 1,
        py: 0.75,
        borderRadius: "8px",
        background: c.bgSubCard,
        border: `0.5px solid ${v.border}`,
        borderLeft: `3px solid ${v.border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}>
        {React.cloneElement(icon, {
          sx: { fontSize: { xs: "0.55rem", sm: "0.6rem" }, color: v.icon },
        })}
        <Typography
          sx={{
            fontSize: { xs: "0.55rem", sm: "0.6rem" },
            fontWeight: 700,
            color: v.icon,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </Typography>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>

      <Box
        sx={{
          position: "absolute",
          right: -6,
          bottom: -6,
          width: 44,
          height: 44,
          opacity: isDark ? 0.1 : 0.07,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 64, color: v.icon } })}
      </Box>
    </Box>
  );
};
export default function ItemPurchasingUpdateView({
  po,
  initialOptionId,
  isLoadingPage,
  poVoucherStatus,
  cartKey,
  forApprovalKey,
  forPaymentKey,
  pendingReceiptKey,
  forDeliveryKey,
  deliveredKey,
  cancelledPOKey,
  removedFromCartKey,
  voucherActiveKey,
  voucherClosedKey,
  voucherPaidKey,
  voucherSupplierTypeKey,
  currentUserId,
  shippingMethod,
  paymentTerms,
  options,
  liveOptions,
  total,
  allOptionsAtPO,
  allOptionsAtPayment,
  allOptionsAtDelivered,
  anyOptionArrived,
  assignedAONickName,

  confirmAction,
  setConfirmAction,
  actionLoading,
  showPaymentForm,
  setShowPaymentForm,
  showManageVoucher,
  setShowManageVoucher,
  paymentForm,
  setPaymentForm,
  paymentLoading,
  paymentErrors,
  isArrivedView,
  setIsArrivedView,
  arrivedFooterActions,
  setArrivedFooterActions,
  setLineItemSaving,
  handleBack,
  handleConfirm,
  handleProceedToPODetails,
  openPaymentForm,
  onPatchOption,
  fetchTransactionForPurchase,
  isManagement,
  isAccountOfficer,
  isAOTL,
  isProcurement,
  isFinanceOfficer,
  itemType,
  procMode,
  procSource,
  statusTransaction,
  archiveStatus,
  forCanvasKey,
  canvasFinalizeKey,
  canvasVerificationKey,
  itemsManagementKey,
  forCollectionKey,
  forPurchaseKey,
  ao_status,
  transacstatus,
  forPricingKey,
  priceVerificationKey,
  priceApprovalKey,
  priceSettingKey,
  priceFinalizeVerificationKey,
  itemPurchasingStatus,
  selectedStatusCode,
  handlePreviewPO,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  const [showReceiveItems, setShowReceiveItems] = React.useState(false);
  const currentStatus = po?.nStatus;
  const isPendingReceiptStatus =
    String(currentStatus) === String(pendingReceiptKey);
  const navigate = useNavigate();
  const firstOption = options[0];

  const companyInfo =
    firstOption?.purchase_option?.transaction_item?.transaction?.company;
  const supplierInfo = firstOption?.purchase_option?.supplier;
  const supplierId = supplierInfo?.nSupplierId ?? null;
  const transactionObj =
    firstOption?.purchase_option?.transaction_item?.transaction;
  const [historyView, setHistoryView] = React.useState(null); // { tone, onBack } | null
  const [receivePanelState, setReceivePanelState] = React.useState({
    onConfirm: null,
    canConfirm: false,
    saving: false,
  });

  const handleViewForPurchase = async () => {
    if (!transactionObj?.nTransactionId) {
      console.warn("No transaction found on this PO to view for purchase");
      return;
    }
    const fullTransaction = await fetchTransactionForPurchase(
      transactionObj.nTransactionId,
    );
    const finalTransaction = fullTransaction || {
      ...transactionObj,
      clientName:
        transactionObj.client?.strClientNickName ||
        transactionObj.client?.strClientName ||
        "",
      companyName:
        transactionObj.company?.strCompanyNickName ||
        transactionObj.company?.strCompanyName ||
        "",
      transactionId: transactionObj.strCode,
    };
    const statusCode = String(
      finalTransaction.current_status ??
        finalTransaction.latest_history?.nStatus ??
        forPurchaseKey ??
        "",
    );
    const statusLabelMap = isManagement ? transacstatus : ao_status;
    const currentStatusLabel = statusLabelMap?.[statusCode] ?? "";
    navigate("/transaction-for-purchase", {
      state: {
        transaction: finalTransaction,
        transactionCode: finalTransaction.transactionId,
        selectedStatusCode: statusCode,
        currentStatusLabel,
        forPurchaseKey,
        currentUserId,
        cancelledPOKey,
        cartKey,
        forApprovalKey,
        forPaymentKey,
        pendingReceiptKey,
        forDeliveryKey,
        deliveredKey,
        removedFromCartKey,
        isManagement,
        isAccountOfficer,
        isAOTL,
        isProcurement,
        itemType,
        procMode,
        procSource,
        statusTransaction,
        archiveStatus,
        forCanvasKey,
        canvasFinalizeKey,
        canvasVerificationKey,
        itemsManagementKey,
        forCollectionKey,
        ao_status,
        forPricingKey,
        priceVerificationKey,
        priceApprovalKey,
        priceSettingKey,
        priceFinalizeVerificationKey,
      },
    });
  };

  const toConfirmSlot = (key) => {
    if (key === "undo_approval") return "undo_approval";
    if (key === cartKey) return "open";
    if (key === forApprovalKey) return "close";
    if (key === forPaymentKey) return "approve";
    if (key === cancelledPOKey) return "cancel";
    return key;
  };
  const confirmSlot = confirmAction ? toConfirmSlot(confirmAction) : null;

  const showPODetails =
    !isArrivedView &&
    !(
      poVoucherStatus &&
      (String(poVoucherStatus) === String(voucherActiveKey) ||
        String(poVoucherStatus) === String(voucherClosedKey))
    );
  const footerLActions =
    (showReceiveItems || isPendingReceiptStatus) &&
    receivePanelState.jevOpen ? (
      <BaseButton
        label="Back"
        icon={icons.back}
        onClick={receivePanelState.onJevBack}
        actionColor="cancel"
      />
    ) : historyView || showReceiveItems ? (
      <BaseButton
        label="Back"
        icon={icons.back}
        onClick={
          historyView ? historyView.onBack : () => setShowReceiveItems(false)
        }
        actionColor="cancel"
      />
    ) : (
      <BaseButton
        label={"Back"}
        icon={icons.back}
        onClick={
          isArrivedView && arrivedFooterActions
            ? arrivedFooterActions.onBack
            : handleBack
        }
        actionColor="cancel"
        disabled={isLoadingPage || paymentLoading}
      />
    );
  const footerRActions = historyView ? null : (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {showReceiveItems || isPendingReceiptStatus ? (
        <>
         {!receivePanelState.jevAction && (
          <BaseButton
            label="Cancel"
            icon={icons.cancel}
            onClick={() => setConfirmAction(cancelledPOKey)}
            actionColor="delete"
            disabled={isLoadingPage || actionLoading}
          />
             )}
          {!isFinanceOfficer && !receivePanelState.jevAction && (
            <BaseButton
              label="View For Purchase"
              icon={icons.view}
              onClick={handleViewForPurchase}
              actionColor="default"
              disabled={isLoadingPage || actionLoading}
            />
          )}
          {receivePanelState.label && (
            <BaseButton
              label={receivePanelState.label}
              icon={icons.approve}
              onClick={receivePanelState.onConfirm}
              actionColor="approve"
              disabled={
                !receivePanelState.canConfirm || receivePanelState.saving
              }
            />
          )}
          {receivePanelState.jevAction && (
            <Tooltip arrow title={receivePanelState.jevAction.tooltip}>
              <span>
                <BaseButton
                  label={receivePanelState.jevAction.label}
                  icon={
                    receivePanelState.jevAction.kind === "finalize"
                      ? icons.finalize
                      : icons.revert
                  }
                  onClick={receivePanelState.jevAction.onClick}
                  actionColor={
                    receivePanelState.jevAction.kind === "finalize"
                      ? "approve"
                      : "delete"
                  }
                  disabled={receivePanelState.jevAction.disabled}
                />
              </span>
            </Tooltip>
          )}
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <BaseButton
            label="Cancel"
            icon={icons.cancel}
            onClick={() => setConfirmAction(cancelledPOKey)}
            actionColor="delete"
            disabled={isLoadingPage || actionLoading}
          />
          {selectedStatusCode === forApprovalKey ? (
            <>
              {!isFinanceOfficer && (
                <BaseButton
                  label="Reopen"
                  icon={icons.open}
                  onClick={() => setConfirmAction(cartKey)}
                  actionColor="default"
                  disabled={isLoadingPage || actionLoading}
                />
              )}
              {(isFinanceOfficer || isManagement) && (
                <BaseButton
                  label="Approve"
                  icon={icons.approve}
                  onClick={() => setConfirmAction(forPaymentKey)}
                  actionColor="approve"
                  disabled={isLoadingPage || actionLoading}
                />
              )}
            </>
          ) : selectedStatusCode === forPaymentKey ? (
            <>
              {!poVoucherStatus && (
                <BaseButton
                  label="Undo Approval"
                  icon={icons.open}
                  onClick={() => setConfirmAction("undo_approval")}
                  actionColor="cancel"
                  disabled={isLoadingPage || actionLoading}
                />
              )}
              <BaseButton
                label="Manage Voucher"
                icon={icons.manage}
                onClick={() => setShowManageVoucher(true)}
                actionColor="approve"
                disabled={isLoadingPage || actionLoading}
              />
            </>
          ) : null}

          {showPODetails && (
            <>
              {po?.strShippingDetails || po?.cPaymentTerms ? (
                <>
                  {selectedStatusCode === cartKey && (
                    <>
                      <BaseButton
                        label="Edit PO Details"
                        icon={icons.edit}
                        onClick={openPaymentForm}
                        actionColor="default"
                        disabled={isLoadingPage || paymentLoading}
                      />
                      <BaseButton
                        label="Close"
                        icon={icons.close}
                        onClick={() => setConfirmAction(forApprovalKey)}
                        actionColor="approve"
                        disabled={isLoadingPage || actionLoading}
                      />{" "}
                    </>
                  )}
                </>
              ) : (
                <>
                  <BaseButton
                    label="Proceed to PO Details"
                    icon={icons.submit}
                    onClick={openPaymentForm}
                    actionColor="approve"
                    disabled={isLoadingPage || paymentLoading}
                  />
                </>
              )}
            </>
          )}
          {!isFinanceOfficer && (
            <BaseButton
              label="View For Purchase"
              icon={icons.view}
              onClick={handleViewForPurchase}
              actionColor="default"
              disabled={isLoadingPage || actionLoading}
            />
          )}
        </Box>
      )}
    </Box>
  );
  const showShippingPaymentRow =
    !isArrivedView &&
    !anyOptionArrived &&
    (currentStatus === forApprovalKey || allOptionsAtPO) &&
    (po?.strShippingDetails || po?.cPaymentTerms);
  const PurchaseOrderHeader = (
    <ContentHeaderStructure
      p={1.5}
      mb={1}
      textAlign="left"
      fontSize="inherit"
      lineHeight="inherit"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 0.75, sm: 1 },
          alignItems: "stretch",
        }}
      >
        {/* Company Card */}
        <CardStructure icon="bank" label="Company" variant="info">
          <Typography
            sx={{
              fontSize: { xs: "0.6rem", sm: "0.65rem" },
              fontWeight: 700,
              color: c.textBody,
              mb: 0.2,
            }}
          >
            {companyInfo?.strCompanyName ?? "—"}
          </Typography>
          {companyInfo?.strAddress && (
            <Typography
              sx={{
                fontSize: { xs: "0.5rem", sm: "0.55rem" },
                color: c.textMuted,
              }}
            >
              {companyInfo.strAddress}
            </Typography>
          )}
          {companyInfo?.strTIN && (
            <Typography
              sx={{
                fontSize: { xs: "0.5rem", sm: "0.55rem" },
                color: c.textMutedAlt,
                mt: 0.2,
              }}
            >
              TIN: {companyInfo.strTIN}
            </Typography>
          )}
        </CardStructure>

        {/* Supplier Card */}
        <CardStructure icon="phone" label="Supplier" variant="warn">
          <Typography
            sx={{
              fontSize: { xs: "0.6rem", sm: "0.65rem" },
              fontWeight: 700,
              color: c.textBody,
              mb: 0.2,
            }}
          >
            {supplierInfo?.strSupplierName ?? "—"}
          </Typography>
          {supplierInfo?.strAddress && (
            <Typography
              sx={{
                fontSize: { xs: "0.5rem", sm: "0.55rem" },
                color: c.textMuted,
              }}
            >
              {supplierInfo.strAddress}
            </Typography>
          )}
          {supplierInfo?.strTIN && (
            <Typography
              sx={{
                fontSize: { xs: "0.5rem", sm: "0.55rem" },
                color: c.textMutedAlt,
                mt: 0.2,
              }}
            >
              TIN: {supplierInfo.strTIN}
            </Typography>
          )}
        </CardStructure>

        {/* PO Number + Print Button */}
        {(allOptionsAtPO || allOptionsAtPayment) && (
          <CardStructure
            icon="check"
            label="Purchase Order"
            variant="success"
            flex="0 0 auto"
            minWidth={{ xs: "100%", sm: "140px" }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: { xs: "0.65rem", sm: "0.72rem" },
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: c.textBodySoft,
                  lineHeight: 1.2,
                  letterSpacing: "0.3px",
                }}
              >
                {po?.strPurchaseOrderNo ?? "—"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccountCircleOutlined
                  sx={{
                    fontSize: { xs: "0.6rem", sm: "0.7rem" },
                    color: c.textMuted,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: "0.55rem", sm: "0.6rem" },
                    color: c.textBodySoft,
                    fontWeight: 500,
                  }}
                >
                  {assignedAONickName}
                </Typography>
              </Box>
              <Box
                component="button"
                onClick={handlePreviewPO}
                disabled={isLoadingPage || actionLoading}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  px: 1,
                  py: 0.4,
                  borderRadius: "6px",
                  border: `1px solid ${c.border}`,
                  background: c.buttonBg,
                  color: c.textBodySoft,
                  fontSize: { xs: "0.65rem", sm: "0.7rem" },
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
                  "&:hover:not(:disabled)": { background: c.buttonHover },
                }}
              >
                <ReceiptLongOutlined
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                />
                Preview
              </Box>
            </Box>
          </CardStructure>
        )}
      </Box>

      {/* Shipping + Payment Row */}
      {showShippingPaymentRow && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.75, sm: 1 },
            alignItems: "flex-start",
          }}
        >
          {po?.strShippingDetails && (
            <CardStructure
              icon="bank"
              label="Shipping Details"
              variant="default"
            >
              <Box
                sx={{
                  maxHeight: "20px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 0.25,
                  "&::-webkit-scrollbar": { width: "3px" },
                  "&::-webkit-scrollbar-thumb": {
                    background: c.border,
                    borderRadius: "3px",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "0.55rem", sm: "0.6rem" },
                    fontWeight: 500,
                    color: c.textBody,
                    lineHeight: 1.3,
                  }}
                  dangerouslySetInnerHTML={{ __html: po.strShippingDetails }}
                />
              </Box>
            </CardStructure>
          )}
          {po?.cPaymentTerms && (
            <CardStructure icon="tin" label="Payment Terms" variant="default">
              <Box
                sx={{
                  maxHeight: "20px",
                  minHeight: "20px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 0.25,
                  "&::-webkit-scrollbar": { width: "3px" },
                  "&::-webkit-scrollbar-thumb": {
                    background: c.border,
                    borderRadius: "3px",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "0.55rem", sm: "0.6rem" },
                    fontWeight: 500,
                    color: c.textBody,
                    lineHeight: 1.3,
                  }}
                >
                  {paymentTerms?.[po.cPaymentTerms] ?? po.cPaymentTerms}
                </Typography>
              </Box>
            </CardStructure>
          )}
        </Box>
      )}
    </ContentHeaderStructure>
  );

  return (
    <PageLayout
      title="Item Purchasing"
      subtitle={
        po?.strPurchaseOrderNo
          ? `${itemPurchasingStatus[selectedStatusCode]} / ${po.strPurchaseOrderNo}`
          : ""
      }
      footerLActions={footerLActions}
      footerRActions={footerRActions}
      loading={isLoadingPage || paymentLoading}
    >
      {isLoadingPage && !paymentLoading ? (
        <CartUpdateSkeleton />
      ) : !po ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.85rem", color: c.textBodySoft }}>
            Purchase order not found.
          </Typography>
          <BaseButton
            label="Back to Cart"
            onClick={handleBack}
            actionColor="default"
          />
        </Box>
      ) : (
        <>
          <CartProgressStepper
            options={liveOptions}
            cartKey={cartKey}
            forApprovalKey={forApprovalKey}
            forPaymentKey={forPaymentKey}
            pendingReceiptKey={pendingReceiptKey}
            forDeliveryKey={forDeliveryKey}
            deliveredKey={deliveredKey}
            cancelledPOKey={cancelledPOKey}
            poStatus={currentStatus}
          />
          {PurchaseOrderHeader}
          {options.length > 0 && (
            <>
              {showReceiveItems || isPendingReceiptStatus ? (
                <ReceivePanel
                  options={liveOptions}
                  patchOption={onPatchOption}
                  nPurchaseOrderId={po?.nPurchaseOrderId}
                  currentUserId={currentUserId}
                  forDeliveryKey={forDeliveryKey}
                  deliveredKey={deliveredKey}
                  pendingReceiptKey={pendingReceiptKey}
                  onDone={() => setShowReceiveItems(false)}
                  onStateChange={setReceivePanelState}
                />
              ) : (
                <>
                  <Box
                    sx={{
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
                        color: c.textMutedAlt,
                      }}
                    >
                      Purchase Items
                    </Typography>
                    <Box
                      sx={{ flex: 1, height: "0.5px", background: c.border }}
                    />
                  </Box>
                  <LineItems
                    onHistoryViewChange={setHistoryView}
                    options={liveOptions}
                    nPurchaseOrderId={po?.nPurchaseOrderId}
                    poNumber={po?.strPurchaseOrderNo}
                    initialArrivedOptionId={initialOptionId}
                    onPatchOption={onPatchOption}
                    total={total}
                    cartKey={cartKey}
                    forApprovalKey={forApprovalKey}
                    forPaymentKey={forPaymentKey}
                    pendingReceiptKey={pendingReceiptKey}
                    forDeliveryKey={forDeliveryKey}
                    deliveredKey={deliveredKey}
                    removedFromCartKey={removedFromCartKey}
                    currentUserId={currentUserId}
                    poStatus={currentStatus}
                    onArrivedViewChange={setIsArrivedView}
                    onFooterActionsChange={setArrivedFooterActions}
                    onRemoved={() => {
                      window.dispatchEvent(
                        new CustomEvent("cart_data_updated"),
                      );
                    }}
                    onSavingChange={setLineItemSaving}
                    anyOptionArrived={anyOptionArrived}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
      <PurchaseCartUpdateModal
        open={!!confirmAction}
        action={confirmSlot}
        purchaseOrderNumber={po?.strPurchaseOrderNo}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onClose={() => setConfirmAction(null)}
      />
      <PODetailsUpdateModal
        open={showPaymentForm}
        poNumber={po?.strPurchaseOrderNo}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        paymentErrors={paymentErrors}
        paymentTerms={paymentTerms}
        loading={paymentLoading}
        onSubmit={handleProceedToPODetails}
        onClose={() => setShowPaymentForm(false)}
      />
      <ManagePOVoucherModal
        open={showManageVoucher}
        onClose={() => setShowManageVoucher(false)}
        po={po}
        supplierId={supplierId}
        voucherActiveKey={voucherActiveKey}
        isEditable={isFinanceOfficer || isManagement}
        voucherSupplierTypeKey={voucherSupplierTypeKey}
        onSuccess={async () => {
          window.dispatchEvent(new CustomEvent("purchase_order_data_updated"));
        }}
      />
    </PageLayout>
  );
}
