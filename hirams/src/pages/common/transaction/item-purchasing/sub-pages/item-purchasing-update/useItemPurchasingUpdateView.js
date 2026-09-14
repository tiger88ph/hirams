import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PurchaseCartAPI from "../../../../../../api/endpoints/purchase-cart.api.js";
import PurchaseOrderAPI from "../../../../../../api/endpoints/purchase-order.api.js";

import TransactionAPI from "../../../../../../api/endpoints/transaction.api.js";
import VoucherAPI from "../../../../../../api/endpoints/voucher.api.js";
import UserAPI from "../../../../../../api/endpoints/user.api.js";
import useKeysLabels from "../../../../../../hooks/useKeysLabels.js";
import { buildRoleGroups } from "../../../../../../utils/helpers/roleHelper.js";
import { getItem } from "../../../../../../utils/storage/localStorage.js";
import {
  showSwal,
  withSpinner,
} from "../../../../../../utils/helpers/swal.jsx";
import { printRoute } from "../../../../../../utils/helpers/printRoute.js";

export default function useItemPurchasingUpdateView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poId = searchParams.get("id");
  const initialOptionId = searchParams.get("optionId")
    ? Number(searchParams.get("optionId"))
    : null;
  // ── User / mapping ───────────────────────────────────────────────────
  const user = useMemo(() => getItem("user", {}), []);
  const currentUserId = user?.nUserId;

  const {
    // Mappings
    itemPurchasingStatus,
    shippingMethod,
    paymentTerms,
    userTypes,
    ao_status,
    transacstatus,
    archiveStatus,
    statusTransaction,
    itemType,
    procMode,
    procSource,
    loading: mappingLoading,
    // Keys — ✅ Direct named keys, NO indexes
    draftKey,
    finalizeKey,
    transactionVerificationKey,
    forAssignmentKey,
    itemsManagementKey,
    itemsVerificationKey,
    itemsFinalizeKey,
    forCanvasKey,
    canvasVerificationKey,
    canvasFinalizeKey,
    forPricingKey,
    priceSettingKey,
    priceFinalizeVerificationKey,
    priceVerificationKey,
    finalizeVerificationKey,
    priceApprovalKey,
    priceFinalizeKey,
    priceApprovedKey,
    forPurchaseKey,
    forCollectionKey,

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
    voucherAssigneeTypeKey,
    cashKey,
    creditCardKey,
    chequeKey,
    otherPaymentTermKey,
    cashLabel,
    creditCardLabel,
    chequeLabel,
    otherPaymentTermLabel,

    isGeneralManager,
    isAccountOfficer,
    isFinanceOfficer,
    isManagement,
    isProcurement,
    isAOTL,
  } = useKeysLabels();

  // ── PO data ───────────────────────────────────────────────────────────
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [poVoucherStatus, setPoVoucherStatus] = useState(null);
  const selectedStatusCode = po?.nStatus != null ? String(po.nStatus) : "";
  const fetchPO = useCallback(async () => {
    if (!poId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let found = null;
      if (typeof PurchaseOrderAPI.getPurchaseOrder === "function") {
        const res = await PurchaseOrderAPI.getPurchaseOrder(poId);
        found = res?.data || res;
      } else {
        const res = await PurchaseCartAPI.getAllPurchaseOrders();
        const list = res?.purchaseOrders || [];
        found = list.find((p) => String(p.nPurchaseOrderId) === String(poId));
      }
      setPo(found || null);
    } catch (err) {
      console.error("Failed to fetch purchase order:", err);
      setPo(null);
    } finally {
      setLoading(false);
    }
  }, [poId]);
  const fetchTransactionForPurchase = useCallback(
    async (nTransactionId) => {
      try {
        let list = [];
        if (isManagement)
          list = (await TransactionAPI.getAll()).transactions || [];
        else if (isProcurement)
          list =
            (await TransactionAPI.getProcurement(`nUserId=${currentUserId}`))
              .transactions || [];
        else
          list =
            (
              await TransactionAPI.getAccountOfficer(
                `nUserId=${currentUserId}&isAOTL=${isAOTL ? 1 : 0}&fetchAll=${isAOTL ? 1 : 0}`,
              )
            ).transactions || [];

        const found = list.find(
          (t) => String(t.nTransactionId) === String(nTransactionId),
        );
        if (!found) return null;

        return {
          ...found,
          transactionId: found.strCode || "--",
          transactionName: found.strTitle || "--",
          companyName: found.company?.strCompanyNickName || "",
          clientName: found.client?.strClientNickName || "",
        };
      } catch (err) {
        console.error("Failed to fetch transaction for purchase view:", err);
        return null;
      }
    },
    [isManagement, isProcurement, isAOTL, currentUserId],
  );
  const fetchVoucherStatus = useCallback(async () => {
    if (!poId) return;
    try {
      const res = await VoucherAPI.getVouchers();
      const vouchers = Array.isArray(res) ? res : (res?.data ?? []);
      let status = null;
      vouchers.forEach((v) => {
        (v.voucher_suppliers ?? []).forEach((vs) => {
          if (String(vs.nPurchaseOrderId) === String(poId)) status = v.cStatus;
        });
      });
      setPoVoucherStatus(status);
    } catch (err) {
      console.error("Failed to fetch voucher status:", err);
    }
  }, [poId]);

  useEffect(() => {
    fetchPO();
    fetchVoucherStatus();
  }, [fetchPO, fetchVoucherStatus]);

  const notifyUpdated = useCallback((detail) => {
    window.dispatchEvent(
      new CustomEvent("purchase_order_data_updated", { detail }),
    );
  }, []);

  const handleBack = useCallback(
    () => navigate("/item-purchasing"),
    [navigate],
  );

  // ── Local UI state ───────────────────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showManageVoucher, setShowManageVoucher] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    strShippingDetails: "",
    cPaymentTerms: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isArrivedView, setIsArrivedView] = useState(false);
  const [arrivedFooterActions, setArrivedFooterActions] = useState(null);
  const [liveOptions, setLiveOptions] = useState([]);

  const [lineItemSaving, setLineItemSaving] = useState(false);

  // Reset local UI state whenever we switch to a different PO
  useEffect(() => {
    setConfirmAction(null);
    setActionLoading(false);
    setShowPaymentForm(false);
    setPaymentForm({ strShippingDetails: "", cPaymentTerms: "" });
    setPaymentLoading(false);
    setPaymentErrors({});
    setIsArrivedView(false);
    setArrivedFooterActions(null);
  }, [poId]);

  useEffect(() => {
    setLiveOptions(po?.purchase_order_options || []);
  }, [po]);
  useEffect(() => {
    if (po?.nStatus != null) {
      window.dispatchEvent(
        new CustomEvent("viewing_po_status", {
          detail: { code: String(po.nStatus) },
        }),
      );
    }
  }, [po?.nStatus]);
  const options = po?.purchase_order_options || [];
  const firstOption = options[0];

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

  // ── AO / GM directory ────────────────────────────────────────────────
  const [aoGmDirectory, setAoGmDirectory] = useState({
    checkByOtherAOName: "—",
    generalManagerName: "—",
  });
  const aoGmFetchedRef = useRef(false);

  useEffect(() => {
    if (
      mappingLoading ||
      !userTypes ||
      Object.keys(userTypes).length === 0 ||
      aoGmFetchedRef.current
    )
      return;
    aoGmFetchedRef.current = true;
    UserAPI.getAllUsers()
      .then((res) => {
        const users = res.users ?? [];
        const { accountOfficerKey, generalManagerKey } =
          buildRoleGroups(userTypes);
        const buildName = (u) =>
          [
            u?.strFName,
            u?.strMName ? u.strMName[0].toUpperCase() + "." : "",
            u?.strLName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
        const gm = users.find((u) =>
          generalManagerKey.includes(String(u.cUserType)),
        );
        setAoGmDirectory({
          _users: users,
          _accountOfficerKey: accountOfficerKey,
          checkByOtherAOName: "—",
          generalManagerName: gm ? buildName(gm) || "—" : "—",
        });
      })
      .catch((err) =>
        console.error("Failed to fetch users for PO names:", err),
      );
  }, [mappingLoading, userTypes]);

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
  const isLoadingPage = loading || mappingLoading || !po;

  const total = options.reduce(
    (sum, o) =>
      sum +
      (o.purchase_option?.nQuantity || 0) *
        (o.purchase_option?.dUnitPrice || 0),
    0,
  );
  const allOptionsAtPO = !!po && String(po.nStatus) === String(forApprovalKey);
  const allOptionsAtPayment = !!po && String(po.nStatus) === String(forPaymentKey);
  const allOptionsAtDelivered =
    !!po && String(po.nStatus) === String(deliveredKey);

  const anyOptionArrived =
    !!po &&
    [forPaymentKey, pendingReceiptKey, forDeliveryKey, deliveredKey]
      .map(String)
      .includes(String(po.nStatus));

  // ── Line-item patch (optimistic local update) ───────────────────────
  const onPatchOption = useCallback((nPurchaseItemId, patch) => {
    setLiveOptions((prev) =>
      prev.map((opt) =>
        opt.purchase_option?.nPurchaseItemId !== nPurchaseItemId
          ? opt
          : {
              ...opt,
              purchase_option: { ...opt.purchase_option, ...patch },
            },
      ),
    );
  }, []);

  // ── Status change / print confirm ────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmAction || !po) return;

    // ✅ 1. CLOSE MODAL FIRST — immediately
    const action = confirmAction;
    setConfirmAction(null);

    try {
      if (action === "print_po") {
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
        return;
      }

      await withSpinner("Purchase Order", async () => {
        await PurchaseOrderAPI.updateCartStatus({
          nPurchaseOrderId: po?.nPurchaseOrderId,
          nStatus: action,
          nUserId: currentUserId,
        });
      });

      // ✅ 3. Notify refresh
      notifyUpdated({
        purchaseOrderId: po?.nPurchaseOrderId,
        newStatus: action,
      });
      window.dispatchEvent(
        new CustomEvent("cart_status_updated", {
          detail: {
            purchaseOrderId: po?.nPurchaseOrderId,
            newStatus: action,
          },
        }),
      );

      // ✅ 4. Success message
      await showSwal(
        "SUCCESS",
        {},
        { entity: "Purchase Order", action: "updated" },
      );
      navigate("/item-purchasing");
    } catch (err) {
      console.error("Failed to update cart status:", err);
      await showSwal("ERROR", {}, { entity: "Purchase Order" });
    }
  };
  const handlePreviewPO = () => {
    navigate("/preview-po", {
      state: {
        po,
        options: liveOptions ?? options,
        assignedAOName,
        firstOption,
        total,
        checkByOtherAOName,
        generalManagerName,
       
        cashKey,
        creditCardKey,
        chequeKey,
        otherPaymentTermKey,
        cashLabel,
        creditCardLabel,
        chequeLabel,
        otherPaymentTermLabel,
      },
    });
  };
  // ── PO details (shipping / payment terms) submit ────────────────────
  const validatePayment = () => {
    const errors = {};
    if (!paymentForm.strShippingDetails)
      errors.strShippingDetails = "Shipping details is required.";
    if (!paymentForm.cPaymentTerms)
      errors.cPaymentTerms = "Payment terms is required.";
    return errors;
  };
  const handleProceedToPODetails = async () => {
    const errors = validatePayment();
    if (Object.keys(errors).length) {
      setPaymentErrors(errors);
      return;
    }

    setShowPaymentForm(false);
    setPaymentErrors({});

    try {
      await withSpinner("Purchase Order", async () => {
        await PurchaseOrderAPI.proceedToPODetails({
          nPurchaseOrderId: po?.nPurchaseOrderId,
          strShippingDetails: paymentForm.strShippingDetails,
          cPaymentTerms: paymentForm.cPaymentTerms,
        });
      });

      // Just notify a generic update — no status change happened.
      window.dispatchEvent(
        new CustomEvent("purchase_order_data_updated", {
          detail: { purchaseOrderId: po?.nPurchaseOrderId },
        }),
      );

      await showSwal(
        "SUCCESS",
        {},
        { entity: "Purchase Order", action: "submitted" },
      );
      await fetchPO();
    } catch (err) {
      console.error("Failed to submit PO details:", err);
      await showSwal("ERROR", {}, { entity: "Purchase Order" });
    }
  };
  const openPaymentForm = () => {
    setPaymentForm({
      strShippingDetails: po?.strShippingDetails ?? "",
      cPaymentTerms: po?.cPaymentTerms ?? "",
    });
    setShowPaymentForm(true);
  };

  return {
    // data
    po,
    poId,
    initialOptionId,
    isLoadingPage,
    poVoucherStatus,
    // keys / roles
    cartKey: cartKey ?? "",
    forApprovalKey: forApprovalKey ?? "",
    forPaymentKey: forPaymentKey ?? "",
    pendingReceiptKey: pendingReceiptKey ?? "",
    forDeliveryKey: forDeliveryKey ?? "",
    deliveredKey: deliveredKey ?? "",
    cancelledPOKey: cancelledPOKey ?? "",
    removedFromCartKey,
    voucherActiveKey: voucherActiveKey ?? "",
    voucherClosedKey: voucherClosedKey ?? "",
    voucherPaidKey: voucherPaidKey ?? "",
    voucherSupplierTypeKey,
    currentUserId,
    isAccountOfficer,
    isGeneralManager,
    userTypes,
    shippingMethod,
    paymentTerms,
    // derived
    options,
    liveOptions,
    firstOption,
    total,
    allOptionsAtPO,
    allOptionsAtPayment,
    allOptionsAtDelivered,
    anyOptionArrived,
    assignedAONickName,
    assignedAOName,
    checkByOtherAOName,
    generalManagerName,
    aoGmDirectory,
    // ui state
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
    lineItemSaving,
    setLineItemSaving,
    // handlers
    handleBack,
    handleConfirm,
    handleProceedToPODetails,
    openPaymentForm,
    // onMarkReceived,
    onPatchOption,
    fetchPO,
    fetchTransactionForPurchase,
    // extra data for View For Purchase navigation
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
    forPurchaseKey,
    ao_status,
    forPricingKey,
    priceVerificationKey,
    priceApprovalKey,
    priceSettingKey,
    priceFinalizeVerificationKey,
    transacstatus,
    itemPurchasingStatus,
    selectedStatusCode,
    handlePreviewPO,
    isFinanceOfficer,
  };
}
