import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PurchaseCartAPI from "../../../../../api/endpoints/purchase-cart.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import PricingAPI from "../../../../../api/endpoints/pricing.api.js";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import VoucherAPI from "../../../../../api/endpoints/voucher.api.js";
import UserAPI from "../../../../../api/endpoints/user.api.js";
import useKeysLabels from "../../../../../hooks/useKeysLabels.js";
import { buildRoleGroups } from "../../../../../hooks/useRoleBuilder.js";
import { getItem, setItem } from "../../../../../utils/storage/localStorage.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import { printRoute } from "../../../../../utils/helpers/printRoute.js";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js"; // adjust name/path
import {
  getToDeliver,
  getDelivered,
} from "../../../../../utils/helpers/purchaseProgress.js";
import { splitDeliveryAcrossItems } from "../../../../../utils/helpers/deliverySplit.js";

const num = (v) => Number(v) || 0;
const bustPOCache = () => {
  setItem("cart_cache_purchaseOrders", null);
  setItem("cart_cache_vouchersByPO", null);
};
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
    // Keys
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
  // Every PO the user can see — needed to rebuild an item's transaction-wide
  // qty (the card merges one item across all of its POs).
  const [allPOs, setAllPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poVoucherStatus, setPoVoucherStatus] = useState(null);
  // ?status= carries the tab the card was opened from — a partially received
  // PO is listed under For Delivery while its own status is still Pending
  // Receipt. Falls back to the PO's real status.
  const requestedStatus = searchParams.get("status");
  const selectedStatusCode =
    po?.nStatus != null ? String(requestedStatus || po.nStatus) : "";
  const fetchPO = useCallback(async () => {
    if (!poId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let found = null;
      let list = [];
      if (typeof PurchaseOrderAPI.getPurchaseOrder === "function") {
        const res = await PurchaseOrderAPI.getPurchaseOrder(poId);
        found = res?.data || res;
        list = found ? [found] : [];
      } else {
        const res = await PurchaseCartAPI.getAllPurchaseOrders();
        list = res?.purchaseOrders || [];
        found = list.find((p) => String(p.nPurchaseOrderId) === String(poId));
      }
      setAllPOs(list);
      setPo(found || null);
    } catch (err) {
      console.error("Failed to fetch purchase order:", err);
      setPo(null);
    } finally {
      setLoading(false);
    }
  }, [poId]);

  // ── Transaction-wide item totals ───────────────────────────────────────
  // The card row in For Delivery / Delivered combines one item across every
  // PO of the transaction (5 from supplier A + 7 from supplier B = 12), but
  // the VIEW only loads this PO. Rebuild the same totals from the full list
  // so the panel row shows the matching number.
  const txnItemTotals = useMemo(() => {
    const status = String(selectedStatusCode || "");
    if (!status || !allPOs.length) return {};

    // Same membership rule as the list, so the total matches the card.
    const inActiveTab = (p) => {
      const s = String(p?.nStatus);
      const opts = p?.purchase_order_options || [];
      if (status === String(forDeliveryKey)) {
        return (
          s === String(forDeliveryKey) ||
          (s === String(pendingReceiptKey) &&
            opts.some((o) => getToDeliver(o.purchase_option) > 0))
        );
      }
      if (status === String(deliveredKey)) {
        return (
          s !== String(cancelledPOKey) &&
          opts.some((o) => getDelivered(o.purchase_option) > 0)
        );
      }
      return s === status;
    };

    const map = {};
    for (const p of allPOs) {
      if (!inActiveTab(p)) continue;
      for (const o of p.purchase_order_options || []) {
        const q = o?.purchase_option;
        const tiId = q?.transaction_item?.nTransactionItemId;
        if (tiId == null) continue;
        const t = (map[tiId] ??= { qty: 0, rcvd: 0, dlvd: 0, byPo: {} });
        const ordered = num(q?.nQuantity ?? o?.nQuantity);
        t.qty += ordered;
        t.rcvd += num(q?.nInventoryQty);
        t.dlvd += num(q?.nDeliveredQty);
        const poIdKey = String(p?.nPurchaseOrderId);
        t.byPo[poIdKey] = (t.byPo[poIdKey] ?? 0) + ordered;
      }
    }
    return map;
  }, [
    allPOs,
    selectedStatusCode,
    forDeliveryKey,
    pendingReceiptKey,
    deliveredKey,
    cancelledPOKey,
  ]);

  // ── Shared stock pool, per purchase item ──────────────────────────────
  // A row in For Delivery is combined across every PO of the transaction, so
  // the qty typed can reach past this PO's own share. On submit we need to
  // know what each supplier entry still holds to split the delivery over them.
  const deliveryPool = useMemo(() => {
    const out = [];
    for (const p of allPOs) {
      const poId = p?.nPurchaseOrderId;
      for (const o of p.purchase_order_options || []) {
        const q = o?.purchase_option;
        if (q?.nPurchaseItemId == null) continue;
        out.push({
          nPurchaseItemId: q.nPurchaseItemId,
          nTransactionItemId:
            q.nTransactionItemId ?? q.transaction_item?.nTransactionItemId,
          nPurchaseOrderId: poId,
          free: getToDeliver(q),
        });
      }
    }
    return out;
  }, [allPOs]);

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
  const [sellingPrices, setSellingPrices] = useState({});
  const [lineItemSaving, setLineItemSaving] = useState(false);
  const [receiveForms, setReceiveForms] = useState({});
  const [receiveSaving, setReceiveSaving] = useState(false);
  const [deliverForms, setDeliverForms] = useState({});
  const [deliverSaving, setDeliverSaving] = useState(false);
  // Receipt no. pre-filled on every row of the deliver form — one number per
  // card (see fetchSuggestedReceipt below).
  const [suggestedReceiptNo, setSuggestedReceiptNo] = useState("");
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
    setReceiveForms({});
    setDeliverForms({});
  }, [poId]);

  useEffect(() => {
    setLiveOptions(po?.purchase_order_options || []);
  }, [po]);
  useEffect(() => {
    const txnIds = [
      ...new Set(
        (po?.purchase_order_options || [])
          .map(
            (o) =>
              o.purchase_option?.transaction_item?.transaction?.nTransactionId,
          )
          .filter(Boolean),
      ),
    ];
    if (!txnIds.length) {
      setSellingPrices({});
      return;
    }
    let active = true;
    (async () => {
      try {
        const map = {};
        for (const txnId of txnIds) {
          const setsRes = await PricingAPI.getPricingSets(txnId);
          const chosen = (setsRes.data ?? []).find(
            (s) => s.bChosen === 1 || s.bChosen === true,
          );
          if (!chosen) continue;
          const res = await PricingAPI.getItemPricings(chosen.nPricingSetId);
          (res.itemPricings || []).forEach((p) => {
            map[p.nTransactionItemId] = Number(p.dUnitSellingPrice || 0);
          });
        }
        if (active) setSellingPrices(map);
      } catch (err) {
        console.error("Failed to fetch unit selling prices:", err);
        if (active) setSellingPrices({});
      }
    })();
    return () => {
      active = false;
    };
  }, [po]);

  // liveOptions + dUnitSellingPrice merged into each purchase_option
  const liveOptionsWithSelling = useMemo(
    () =>
      liveOptions.map((opt) => {
        const po_ = opt.purchase_option;
        if (!po_) return opt;
        const itemId =
          po_.nTransactionItemId ?? po_.transaction_item?.nTransactionItemId;
        return {
          ...opt,
          purchase_option: {
            ...po_,
            dUnitSellingPrice: sellingPrices[itemId] ?? 0,
          },
        };
      }),
    [liveOptions, sellingPrices],
  );
  useEffect(() => {
    if (selectedStatusCode) {
      // Highlight the sidebar entry for the view we actually opened
      window.dispatchEvent(
        new CustomEvent("viewing_po_status", {
          detail: { code: String(selectedStatusCode) },
        }),
      );
    }
  }, [selectedStatusCode]);
  const options = po?.purchase_order_options || [];
  const firstOption = options[0];

  // ── Deliver form: the card's next receipt number ──────────────────────
  // ONE number for the whole card (one transaction): it is reused while this
  // card already delivered with that number today, otherwise it is the latest
  // delivered receipt + 1. Rules live in InventoryController
  // ::suggestedDeliveredReceipt().
  const fetchSuggestedReceipt = useCallback(async () => {
    const tx = firstOption?.purchase_option?.transaction_item?.transaction;
    const params = {};
    if (tx?.nTransactionId != null) params.nTransactionId = tx.nTransactionId;
    else if (firstOption?.purchase_option?.nPurchaseItemId != null)
      params.nPurchaseItemId = firstOption.purchase_option.nPurchaseItemId;
    if (!Object.keys(params).length) return;

    try {
      const res = await InventoryAPI.getSuggestedDeliveredReceipt(params);
      setSuggestedReceiptNo(
        res?.strReceiptNumber ?? res?.data?.strReceiptNumber ?? "",
      );
    } catch (err) {
      console.error("Failed to fetch suggested receipt number:", err);
    }
  }, [firstOption]);

  const isDeliverForm =
    String(selectedStatusCode) === String(forDeliveryKey);

  useEffect(() => {
    if (!isDeliverForm) return;
    fetchSuggestedReceipt();
    // The number has to stay live: another user may deliver meanwhile (window
    // regains focus) and a page left open past midnight has to re-apply the
    // "one day passed → next number" rule (calendar day rolls over).
    const onFocus = () => fetchSuggestedReceipt();
    const dayRef = { current: new Date().toDateString() };
    const timer = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== dayRef.current) {
        dayRef.current = today;
        fetchSuggestedReceipt();
      }
    }, 60_000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [isDeliverForm, fetchSuggestedReceipt]);

  // Rows still showing the auto value follow it when it advances (new day, or
  // another delivery moved the sequence on). Anything typed by hand stays.
  const prevSuggestionRef = useRef("");
  useEffect(() => {
    const prev = prevSuggestionRef.current;
    prevSuggestionRef.current = suggestedReceiptNo;
    if (!suggestedReceiptNo || prev === suggestedReceiptNo) return;

    setDeliverForms((prevForms) => {
      let changed = false;
      const next = {};
      for (const [key, f] of Object.entries(prevForms)) {
        const current = String(f?.receiptNo ?? "").trim();
        // Still on the previous auto value → follow the new one. On the very
        // first load, backfill the rows that were opened before it arrived.
        const follows = current === prev || (!prev && !current);
        if (follows) {
          next[key] = { ...f, receiptNo: suggestedReceiptNo };
          changed = true;
        } else {
          next[key] = f;
        }
      }
      return changed ? next : prevForms;
    });
  }, [suggestedReceiptNo]);

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
  // The preview/print sheet takes ONE PO-level EWT, but it is stored per line
  // (purchase_option.dEWT) — total it up here. Derived from the same array the
  // preview receives so locally-edited lines stay in sync.
  const previewOptions = liveOptions?.length ? liveOptions : options;
  const ewtAmount = previewOptions.reduce(
    (sum, o) => sum + (Number(o.purchase_option?.dEWT) || 0),
    0,
  );
  const allOptionsAtPO = !!po && String(po.nStatus) === String(forApprovalKey);
  const allOptionsAtPayment =
    !!po && String(po.nStatus) === String(forPaymentKey);

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

  const handleConfirm = async () => {
    if (!confirmAction || !po) return;

    // Close modal first
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
            ewtAmount,
          }),
        );
        printRoute("/print-po");
        return;
      }

      const nStatusToSend =
        action === "undo_approval" ? forApprovalKey : action;

      // The For Delivery / Delivered card merges every PO sharing the item
      // into one card — cancelling from there has to cancel all of them, not
      // just the PO that happened to be opened.
      const cancelShared =
        String(nStatusToSend) === String(cancelledPOKey) &&
        [String(forDeliveryKey), String(deliveredKey)].includes(
          String(selectedStatusCode),
        );

      await withSpinner("Purchase Order", async () => {
        await PurchaseOrderAPI.updateCartStatus({
          nPurchaseOrderId: po?.nPurchaseOrderId,
          nStatus: nStatusToSend,
          nUserId: currentUserId,
          cancelShared,
        });
      });
      bustPOCache(); // ← add here
      // Notify refresh
      notifyUpdated({
        purchaseOrderId: po?.nPurchaseOrderId,
        newStatus: nStatusToSend,
      });
      window.dispatchEvent(
        new CustomEvent("cart_status_updated", {
          detail: {
            purchaseOrderId: po?.nPurchaseOrderId,
            newStatus: nStatusToSend,
          },
        }),
      );

      // Cancelling also cancels the PO's inventory rows — refresh every open
      // inventory / card view, not only the ones listening to websockets.
      if (String(nStatusToSend) === String(cancelledPOKey)) {
        window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      }

      // Success message
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
  const handleConfirmReceived = async () => {
    const items = Object.entries(receiveForms)
      .map(([id, f]) => ({
        nPurchaseItemId: Number(id),
        nQuantity: Number(f.qty) || 0,
        strReceiptNumber: (f.receiptNo || "").trim() || null,
        serials: f.serials || [],
      }))
      .filter((i) => i.nQuantity > 0);

    // Receipt no. is optional — only the quantity is required
    if (!items.length) {
      await showSwal("ERROR", {}, { entity: "Receipt (quantity required)" });
      return;
    }

    setReceiveSaving(true);
    try {
      await withSpinner("Receipt", async () => {
        await InventoryAPI.bulkReceiveDeliver({
          mode: "receive",
          nPurchaseOrderId: po?.nPurchaseOrderId,
          nReceivedStatus: forDeliveryKey, // 150: every item fully received
          nDeliveredStatus: deliveredKey, // 160: every item fully delivered
          nPaidStatus: pendingReceiptKey, // 140: default, stays in Pending Receipt
          items,
        });
      });
      bustPOCache();
      notifyUpdated({ purchaseOrderId: po?.nPurchaseOrderId });
      await showSwal("SUCCESS", {}, { entity: "Receipt", action: "recorded" });
      setReceiveForms({});
      await fetchPO();
    } catch (err) {
      console.error("Failed to confirm received:", err);
      await showSwal("ERROR", {}, { entity: "Receipt" });
    } finally {
      setReceiveSaving(false);
    }
  };
  const handleConfirmDelivered = async () => {
    const lines = Object.entries(deliverForms)
      .map(([id, f]) => ({
        nPurchaseItemId: Number(id),
        nQuantity: Number(f.qty) || 0,
        strReceiptNumber: (f.receiptNo || "").trim() || null,
        serials: f.serials || [],
      }))
      .filter((i) => i.nQuantity > 0);

    // Receipt no. is REQUIRED for a delivery — every row comes pre-filled with
    // the card's number, so this only trips when one was cleared by hand.
    if (!lines.length) {
      await showSwal("ERROR", {}, { entity: "Delivery (quantity required)" });
      return;
    }

    if (lines.some((i) => !i.strReceiptNumber)) {
      await showSwal(
        "ERROR",
        { text: "Every delivery line needs a receipt number." },
        { entity: "Delivery (receipt no. required)" },
      );
      return;
    }

    // One row on screen can be shared by several purchase items (5 from
    // supplier A + 5 from supplier B = 10). Expand each line over the entries
    // it is drawn from → one inventory row each, this PO's share first.
    const items = [];
    let short = 0;
    for (const line of lines) {
      const split = splitDeliveryAcrossItems(line, deliveryPool);
      if (split.short > 0) {
        short += split.short;
        continue;
      }
      items.push(...split.items);
    }

    if (short > 0) {
      await showSwal(
        "ERROR",
        {
          text: `You are ${short} unit(s) over what is still deliverable across this item's purchase orders. Lower the quantity and try again.`,
        },
        { entity: "Delivery" },
      );
      return;
    }

    setDeliverSaving(true);
    try {
      await withSpinner("Delivery", async () => {
        await InventoryAPI.bulkReceiveDeliver({
          mode: "deliver",
          nPurchaseOrderId: po?.nPurchaseOrderId,
          nReceivedStatus: forDeliveryKey, // 150
          nDeliveredStatus: deliveredKey, // 160: every item fully delivered
          nPaidStatus: pendingReceiptKey, // 140
          items,
        });
      });
      bustPOCache();
      notifyUpdated({ purchaseOrderId: po?.nPurchaseOrderId });
      await showSwal("SUCCESS", {}, { entity: "Delivery", action: "recorded" });
      setDeliverForms({});
      await fetchPO();
      // The batch just took a number — hand out the next one for the rest.
      fetchSuggestedReceipt();
    } catch (err) {
      console.error("Failed to confirm delivered:", err);
      await showSwal("ERROR", {}, { entity: "Delivery" });
    } finally {
      setDeliverSaving(false);
    }
  };
  const handlePreviewPO = () => {
    navigate("/preview-po", {
      state: {
        po,
        options: previewOptions,
        assignedAOName,
        firstOption,
        total,
        checkByOtherAOName,
        generalManagerName,

        // Not every line carries EWT, so the sheet must be told the total —
        // otherwise usePreviewPO falls back to 0 and the payable is wrong.
        ewtAmount,

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
      bustPOCache();
      // Generic update: no status change happened.
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
    txnItemTotals,
    liveOptions: liveOptionsWithSelling,
    firstOption,
    total,
    allOptionsAtPO,
    allOptionsAtPayment,
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
    receiveForms,
    setReceiveForms,
    receiveSaving,
    handleConfirmReceived,
    deliverForms,
    setDeliverForms,
    deliverSaving,
    suggestedReceiptNo,
    handleConfirmDelivered,
    handleBack,
    handleConfirm,
    handleProceedToPODetails,
    openPaymentForm,
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
