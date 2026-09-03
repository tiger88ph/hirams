import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PurchaseCartAPI from "../../../../../../api/endpoints/purchase-cart.api.js";
import PurchaseOrderAPI from "../../../../../../api/endpoints/purchase-order.api.js";
import PurchaseItemHistoriesAPI from "../../../../../../api/endpoints/purchase-item-histories.api.js";
import DirectCostAPI from "../../../../../../api/endpoints/direct-cost.api.js";
import DirectCostOptionAPI from "../../../../../../api/endpoints/direct-cost-option.api.js";
import TransactionAPI from "../../../../../../api/endpoints/transaction.api.js";
import VoucherAPI from "../../../../../../api/endpoints/voucher.api.js";
import UserAPI from "../../../../../../api/endpoints/user.api.js";
import useKeysLabels from "../../../../../../hooks/useKeysLabels.js";
import {
  getUserRoles,
  buildRoleGroups,
} from "../../../../../../utils/helpers/roleHelper.js";
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

    cancelPoKey,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    removedFromCartKey,
    openCartKey,
    closeCartKey,
    cancelCartKey,
    voucherActiveKey,
    voucherClosedKey,
    voucherPaidKey,
    voucherSupplierTypeKey,
    voucherAssigneeTypeKey,
  } = useKeysLabels();

  const {
    isGeneralManager,
    isAccountOfficer,
    isManagement,
    isProcurement,
    isAOTL,
  } = getUserRoles(userTypes);

  const [selectedStatusCode, setSelectedStatusCode] = useState(() =>
    getItem("selectedCartStatusCode", ""),
  );
  // ── PO data ───────────────────────────────────────────────────────────
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [poVoucherStatus, setPoVoucherStatus] = useState(null);

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
  const [optionHistories, setOptionHistories] = useState({});
  const [historiesLoading, setHistoriesLoading] = useState(true);
  const [isArrivedView, setIsArrivedView] = useState(false);
  const [arrivedFooterActions, setArrivedFooterActions] = useState(null);
  const [liveOptions, setLiveOptions] = useState([]);
  const [freightAmount, setFreightAmount] = useState(0);
  const [ewtAmount, setEwtAmount] = useState(0);
  const [directCostLoading, setDirectCostLoading] = useState(false);
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

  // ── Option histories ─────────────────────────────────────────────────
  useEffect(() => {
    const ids = (po?.purchase_order_options || [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);

    if (!ids.length) {
      setOptionHistories({});
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
  }, [po]);

  // ── Freight / EWT ────────────────────────────────────────────────────
  const nTransactionId =
    firstOption?.purchase_option?.transaction_item?.transaction?.nTransactionId;

  useEffect(() => {
    if (!nTransactionId) return;
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
          const name = getOptionName(cost.nDirectCostOptionID);
          const amount = Number(cost.dAmount || 0);
          if (name.includes("ewt")) {
            ewt += amount;
            ewtRecordFound = true;
          } else if (name.includes("freight")) {
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
  }, [nTransactionId]);

  const isLoadingPage = loading || mappingLoading || historiesLoading || !po;

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

  const anyOptionArrived = options.some((opt) => {
    const status =
      optionHistories[Number(opt.purchase_option?.nPurchaseOptionId)]?.nStatus;
    return (
      String(status) === String(paidKey) ||
      String(status) === String(receivedKey) ||
      String(status) === String(deliveredKey)
    );
  });

  // ── Line-item patch (optimistic local update) ───────────────────────
  const onPatchOption = useCallback((nPurchaseOptionId, patch) => {
    setLiveOptions((prev) =>
      prev.map((opt) =>
        opt.purchase_option?.nPurchaseOptionId !== nPurchaseOptionId
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
            freightAmount,
            ewtAmount,
          }),
        );
        printRoute("/print-po");
        return;
      }

      // ✅ 2. Spinner runs via Swal
      await withSpinner("Purchase Order", async () => {
        await PurchaseOrderAPI.updateCartStatus({
          nPurchaseOrderId: po?.nPurchaseOrderId,
          cStatus: action,
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
      navigate("/cart");
    } catch (err) {
      console.error("Failed to update cart status:", err);
      await showSwal("ERROR", {}, { entity: "Purchase Order" });
    }
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
    openCartKey: openCartKey ?? "",
    closeCartKey: closeCartKey ?? "",
    cancelCartKey: cancelCartKey ?? "",
    cancelPoKey: cancelPoKey ?? "",
    addToCartKey: addToCartKey ?? "",
    purchaseOrderKey: purchaseOrderKey ?? "",
    paidKey: paidKey ?? "",
    receivedKey: receivedKey ?? "",
    deliveredKey: deliveredKey ?? "",
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
    allOptionsAtDelivered,
    anyOptionArrived,
    assignedAONickName,
    assignedAOName,
    checkByOtherAOName,
    generalManagerName,
    optionHistories,
    historiesLoading,
    freightAmount,
    ewtAmount,
    directCostLoading,
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
  };
}
