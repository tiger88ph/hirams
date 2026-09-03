import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TransactionAPI from "../../../../api/endpoints/transaction.api.js";
import SupplierAPI from "../../../../api/endpoints/supplier.api.js";
import PurchaseOptionAPI from "../../../../api/endpoints/purchase-option.api.js";
import TransactionItemAPI from "../../../../api/endpoints/transaction-item.api.js";
import PurchaseItemHistoriesAPI from "../../../../api/endpoints/purchase-item-histories.api.js";
import PricingAPI from "../../../../api/endpoints/pricing.api.js";
import UserAPI from "../../../../api/endpoints/user.api.js";

import { getDueDateColor } from "../../../../utils/helpers/dueDateColor";
import { fmtPHP, fmtDate } from "../../../../utils/formatters/formatter.js";
const mapSuppliers = (suppliers) =>
  suppliers.map((s) => ({
    label: s.strSupplierNickName || s.strSupplierName,
    value: s.nSupplierId,
    bEWT: s.bEWT,
    bVAT: s.bVAT,
    nickName: s.strSupplierNickName,
  }));

const getDueDateVariant = (dateStr) => {
  const color = getDueDateColor(dateStr);
  if (color === "red") return "danger";
  if (color === "orange") return "warn";
  return "default";
};
const getOptionStep = (nStatus, option, keys) => {
  const { addToCartKey, purchaseOrderKey, paidKey, receivedKey, deliveredKey } =
    keys;
  const ordered = Number(option?.nQuantity || 0);

  if (ordered > 0) {
    const delivered = Math.min(Number(option?.nDeliveredQty || 0), ordered);
    const received = Math.min(Number(option?.nInventoryQty || 0), ordered);
    if (delivered >= ordered) return 5;
    if (delivered > 0) return 4 + delivered / ordered;
    if (received >= ordered) return 4;
    if (received > 0) return 3 + received / ordered;
  }

  if (!nStatus) return 0;
  const s = String(nStatus);
  const order = [
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
  ];
  const idx = order.findIndex((k) => s === String(k));
  return idx >= 0 ? idx + 1 : 0;
};

/* ─── HOOK ────────────────────────────────────────────────────────── */
export default function usePurchase() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    transactionCode,
    transaction,
    selectedStatusCode,
    itemsManagementKey = "",
    itemsVerificationKey = "",
    forCanvasKey = "",
    canvasFinalizeKey = "",
    canvasVerificationKey = "",
    forAssignmentKey = "",
    procMode,
    itemType,
    statusTransaction,
    userTypes,
    isAOTL,
    isManagement,
    isAccountOfficer,
    canvasVerificationLabel,
    forCanvasLabel,
    finalizeKeyLabel,
    ao_status,
    draftKey = "",
    finalizeKey,
    transacstatus,
    itemsFinalizeKey,
    currentStatusLabel,
    isProcurement,
    isProcurementTL,
    proc_status,
    forCollectionKey = "",
    priceSettingKey = "",
    finalizeVerificationKey = "",
    priceFinalizeVerificationKey = "",
    currentUserId,
    priceApprovedKey = "",
    procPriceApprovedKey = "",
    forPurchaseKey = "",
    archiveStatus = {},
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
    closePoKey,
    crTypeKey,
    forPricingKey = "",
    priceVerificationKey = "",
    priceApprovalKey = "",
    procSource,
  } = state || {};

  const errorTimeoutsRef = useRef({});
  const scrollRef = useRef(null);
  const fetchLatestRef = useRef(null);
  const localUpdateRef = useRef(false);
  const localActionRef = useRef(false);
  const countdownRef = useRef(null);
  const fetchItemsRef = useRef(null);

  const [actionModal, setActionModal] = useState(null);
  const [activeTab, setActiveTab] = useState("purchase"); // was "canvas"
  const [statusChangedAlert, setStatusChangedAlert] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cItemType, setCItemType] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [suggestionsItem, setSuggestionsItem] = useState(null);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [optionModalItemId, setOptionModalItemId] = useState(null);
  const [optionModalItem, setOptionModalItem] = useState(null);
  const [optionErrors, setOptionErrors] = useState({});
  const [optionStatuses, setOptionStatuses] = useState({});
  const [latestHistories, setLatestHistories] = useState({});
  const [optionAllHistories, setOptionAllHistories] = useState({});
  const [optionCartStatuses, setOptionCartStatuses] = useState({});
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [isCompareActive, setIsCompareActive] = useState(false);
  const [confirmDrPrint, setConfirmDrPrint] = useState(false);
  const [confirmSiPrint, setConfirmSiPrint] = useState(false);
  const [totalCollectibleValue, setTotalCollectibleValue] = useState(0);
  const [directCostModalOpen, setDirectCostModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [assignMode, setAssignMode] = useState(null);
  const [accountOfficers, setAccountOfficers] = useState([]);
  /* ─── Derived Values ────────────────────────────────────────────────── */
  const statusCode = selectedStatusCode;
  const forCollection = forCollectionKey.includes(statusCode);

  const assignedAOName = (() => {
    const u = transaction?.user;
    if (!u) return "—";
    return (
      [
        u.strFName ?? "",
        u.strMName ? `${u.strMName.charAt(0).toUpperCase()}.` : "",
        u.strLName ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || "—"
    );
  })();

  const assignedAONo = transaction?.user?.strPhoneNo?.trim() || "—";

  const procNonCanvasStatus =
    (isProcurement || isManagement) &&
    (draftKey.includes(statusCode) ||
      finalizeKey?.includes(statusCode) ||
      finalizeVerificationKey?.includes(statusCode) ||
      priceApprovedKey?.includes(statusCode) ||
      procPriceApprovedKey?.includes(statusCode));

  const limitedContent =
    (!isProcurement && !Number(transaction?.nAssignedAO) > 0) ||
    procNonCanvasStatus;

  const isCanvasStatus =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);

  const showRevert = !isProcurement && forPurchaseKey.includes(statusCode);
  const crudItemsEnabled =
    !isProcurement && itemsManagementKey.includes(statusCode);

  const showPurchaseOptions =
    forCanvasKey.includes(statusCode) ||
    canvasFinalizeKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode) ||
    forPurchaseKey.includes(statusCode) ||
    forCollectionKey.includes(statusCode);
  const checkboxOptionsEnabled =
    !statusChangedAlert &&
    (forCanvasKey.includes(statusCode) || forPurchaseKey.includes(statusCode));
  const hasAssignedAO = Number(transaction?.nAssignedAO) > 0;
  const isAssignedToMe =
    isManagement ||
    (currentUserId && transaction?.nAssignedAO
      ? String(currentUserId) === String(transaction.nAssignedAO)
      : false);
  const showReassignAO = isAOTL;
  const transactionHasABC =
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;
  const totalItemsABC = items.reduce((sum, i) => sum + Number(i.abc || 0), 0);
  const anyItemHasABC =
    items.some((i) => Number(i.abc || 0) > 0) || items.length === 0;
  const totalABC = transactionHasABC
    ? Number(transaction.dTotalABC)
    : totalItemsABC;
  const procSourceLabel = procSource?.[transaction?.cProcSource] || null;

  const totalCanvas = items.reduce(
    (sum, item) =>
      sum +
      item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce(
          (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
          0,
        ),
    0,
  );

  const abcValue = `₱ ${fmtPHP(transactionHasABC ? transaction.dTotalABC : totalItemsABC)}`;
  const abcSub =
    (itemsManagementKey.includes(statusCode) ||
      itemsVerificationKey.includes(statusCode) ||
      forCanvasKey.includes(statusCode) ||
      canvasVerificationKey.includes(statusCode)) &&
    transactionHasABC &&
    totalItemsABC > 0
      ? `Items ₱${fmtPHP(totalItemsABC)}`
      : null;

  const statusChangedTooltip = statusChangedAlert
    ? "This transaction has been moved to a different status by another user. All actions are disabled."
    : "";

  const isTransactionOwner =
    currentUserId && transaction?.created_by_id
      ? String(currentUserId) === String(transaction.created_by_id)
      : false;

  const { totalPurchaseProgress, totalPurchaseBalance } = useMemo(() => {
    if (!items.length || !addToCartKey)
      return { totalPurchaseProgress: 0, totalPurchaseBalance: 0 };
    const keys = {
      addToCartKey,
      purchaseOrderKey,
      paidKey,
      receivedKey,
      deliveredKey,
    };
    let numerator = 0,
      denominator = 0,
      unpaidTotal = 0;

    items.forEach((item) => {
      (item.purchaseOptions || []).forEach((o) => {
        const optStatus = optionStatuses[Number(o.nPurchaseOptionId)];
        const isPurchaseIncluded = Number(o.bPurchaseIncluded) === 1;
        const isIncluded =
          isPurchaseIncluded ||
          (o.bPurchaseIncluded == null && Number(o.bIncluded) === 1);

        if (isPurchaseIncluded) {
          const qty = Number(o.nQuantity || 0);
          const step = getOptionStep(optStatus, o, keys);
          numerator += qty * step;
          denominator += qty * 5;
        }
        if (isIncluded) {
          const ordered = Number(o.nQuantity || 0);
          const deliveredQty = Number(o.nDeliveredQty || 0);
          const isPaidOrDone =
            (optStatus != null &&
              [paidKey, receivedKey, deliveredKey]
                .map(String)
                .includes(String(optStatus))) ||
            (ordered > 0 && deliveredQty >= ordered);
          if (!isPaidOrDone) unpaidTotal += ordered * Number(o.dUnitPrice || 0);
        }
      });
    });
    return {
      totalPurchaseProgress:
        denominator > 0
          ? Math.round((numerator / denominator) * 10000) / 100
          : 0,
      totalPurchaseBalance: unpaidTotal,
    };
  }, [
    items,
    optionStatuses,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
  ]);

  const abcValidation = useMemo(() => {
    if (itemsManagementKey.includes(statusCode)) {
      if (transactionHasABC && totalItemsABC > 0) {
        if (totalItemsABC > Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmtPHP(totalItemsABC)}) exceeds Transaction ABC (₱${fmtPHP(transaction.dTotalABC)})`;
        if (totalItemsABC < Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmtPHP(totalItemsABC)}) must equal Transaction ABC (₱${fmtPHP(transaction.dTotalABC)})`;
      }
      if (!transactionHasABC) {
        const missing = items.filter((i) => !i.abc || Number(i.abc) === 0);
        if (missing.length)
          return `All items must have an ABC value. Missing: ${missing.map((i) => `"${i.name}"`).join(", ")}`;
      }
    }
    if (isCanvasStatus && transactionHasABC) {
      if (totalCanvas > Number(transaction.dTotalABC || 0))
        return `Total Canvas (₱${fmtPHP(totalCanvas)}) exceeds Transaction ABC (₱${fmtPHP(transaction.dTotalABC)}). Please adjust the included purchase options.`;
      const overItems = items.filter((item) => {
        const tot = item.purchaseOptions
          .filter((o) => o.bIncluded)
          .reduce(
            (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
            0,
          );
        return tot > Number(item.abc || 0);
      });
      if (anyItemHasABC && overItems.length)
        return `The following item(s) have canvas totals exceeding their ABC: ${overItems.map((i) => `"${i.name}"`).join(", ")}. Please adjust the included purchase options.`;
      if (totalItemsABC > Number(transaction.dTotalABC))
        return `Items ABC total (₱${fmtPHP(totalItemsABC)}) must not exceed Transaction ABC (₱${fmtPHP(transaction.dTotalABC)})`;
    }
    return null;
  }, [
    items,
    statusCode,
    transactionHasABC,
    totalItemsABC,
    totalCanvas,
    anyItemHasABC,
    isCanvasStatus,
  ]);

  /* ─── Callbacks ─────────────────────────────────────────────────────── */
  const getEffectiveABC = useCallback(
    (item) => {
      const itemABC = Number(item.abc || 0);
      if (transactionHasABC && itemABC === 0) {
        const tQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
        return tQty > 0
          ? (Number(item.qty || 0) / tQty) * Number(transaction.dTotalABC || 0)
          : 0;
      }
      return itemABC;
    },
    [items, transactionHasABC, transaction],
  );

  const applyHistories = (histories, setter) => {
    const statuses = {},
      histories_ = {},
      cartStatuses = {};
    histories.forEach((h) => {
      const id = Number(h.nPurchaseOptionId);
      statuses[id] = h?.nStatus ?? null;
      histories_[id] = h ?? null;
      cartStatuses[id] = h?.cStatus ?? null;
    });
    setter({ statuses, histories: histories_, cartStatuses });
  };

  const fetchSuppliers = async (force = false) => {
    const cached = sessionStorage.getItem("suppliers_cache");
    if (cached && !force) return setSuppliers(JSON.parse(cached));
    try {
      const res = await SupplierAPI.getAll();
      const opts = mapSuppliers(res.suppliers);
      sessionStorage.setItem("suppliers_cache", JSON.stringify(opts));
      setSuppliers(opts);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchLatestPurchaseItemHistories = useCallback(
    async (loadedItems = items, targetOptionId = null) => {
      if (!addToCartKey) return;
      const allOptions = loadedItems.flatMap((i) => i.purchaseOptions || []);
      if (!allOptions.length) return;
      const nPurchaseOptionId = targetOptionId
        ? [targetOptionId]
        : allOptions.map((o) => o.nPurchaseOptionId);
      try {
        const res = await PurchaseItemHistoriesAPI.getLatest({
          nPurchaseOptionId,
        });
        if (!res?.histories) return;
        applyHistories(
          res.histories,
          ({ statuses, histories, cartStatuses }) => {
            if (targetOptionId) {
              setOptionStatuses((p) => ({ ...p, ...statuses }));
              setLatestHistories((p) => ({ ...p, ...histories }));
              setOptionCartStatuses((p) => ({ ...p, ...cartStatuses }));
            } else {
              setOptionStatuses(statuses);
              setLatestHistories(histories);
              setOptionCartStatuses(cartStatuses);
            }
          },
        );
      } catch (err) {
        console.error("fetchLatestPurchaseItemHistories error:", err);
      }
    },
    [items, addToCartKey],
  );

  const fetchAllOptionHistory = useCallback(async (nPurchaseOptionId) => {
    if (!nPurchaseOptionId) return;
    try {
      const res =
        await PurchaseItemHistoriesAPI.getAllForOption(nPurchaseOptionId);
      if (res?.histories)
        setOptionAllHistories((prev) => ({
          ...prev,
          [nPurchaseOptionId]: res.histories,
        }));
    } catch (err) {
      console.error("fetchAllOptionHistory error:", err);
    }
  }, []);

  const fetchItems = async ({ restoreScroll = false } = {}) => {
    if (!transaction?.nTransactionId) return;
    const savedScroll =
      restoreScroll && scrollRef.current ? scrollRef.current.scrollTop : 0;
    try {
      const res = await TransactionAPI.getItems(transaction.nTransactionId);
      setCItemType(
        res.cItemType && typeof res.cItemType === "object"
          ? Object.keys(res.cItemType)[0]
          : res.cItemType,
      );
      const loadedItems = (res.items || []).map((item) => ({
        ...item,
        purchaseOptions: item.purchaseOptions || [],
        optionsLoaded: true,
        optionsLoading: false,
      }));
      setItems(loadedItems);
      if (addToCartKey) {
        const ids = loadedItems
          .flatMap((i) => i.purchaseOptions || [])
          .map((o) => o.nPurchaseOptionId);
        if (ids.length) {
          PurchaseItemHistoriesAPI.getLatest({ nPurchaseOptionId: ids })
            .then((res2) => {
              if (!res2?.histories) return;
              applyHistories(
                res2.histories,
                ({ statuses, histories, cartStatuses }) => {
                  setOptionStatuses(statuses);
                  setLatestHistories(histories);
                  setOptionCartStatuses(cartStatuses);
                },
              );
            })
            .catch((err) => console.error("fetchOptionData error:", err));
        }
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setItemsLoading(false);
      if (restoreScroll && savedScroll > 0)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = savedScroll;
          }),
        );
    }
  };

  const setOptionErrorWithAutoHide = (optionId, message, duration = 3000) => {
    if (errorTimeoutsRef.current[optionId])
      clearTimeout(errorTimeoutsRef.current[optionId]);
    setOptionErrors((prev) => ({ ...prev, [optionId]: message }));
    errorTimeoutsRef.current[optionId] = setTimeout(() => {
      setOptionErrors((prev) => {
        const c = { ...prev };
        delete c[optionId];
        return c;
      });
      delete errorTimeoutsRef.current[optionId];
    }, duration);
  };

  const toggleSpecsRow = (id) =>
    setExpandedRows((p) => ({
      ...p,
      [id]: { specs: !p[id]?.specs, options: p[id]?.options || false },
    }));
  const toggleOptionsRow = (id) =>
    setExpandedRows((p) => ({
      ...p,
      [id]: { specs: p[id]?.specs || false, options: !p[id]?.options },
    }));
  const toggleOptionSpecs = (optionId) =>
    setExpandedOptions((p) => ({ ...p, [optionId]: !p[optionId] }));

  const handleCollapseAllToggle = () => {
    const anyOpen = Object.values(expandedRows).some(
      (r) => r?.specs || r?.options,
    );
    setExpandedRows(
      anyOpen
        ? {}
        : items.reduce((acc, item) => {
            acc[item.id] = { specs: true, options: showPurchaseOptions };
            return acc;
          }, {}),
    );
  };

  const handleToggleInclude = async (itemId, optionId, value) => {
    const item = items.find((i) => i.id === itemId);
    const option = item?.purchaseOptions.find((o) => o.id === optionId);
    if (!item || !option) return;

    if (value && Number(option.bAddOn) !== 1) {
      const currentIncludedQty = item.purchaseOptions
        .filter(
          (o) =>
            o.id !== optionId && o.bPurchaseIncluded && Number(o.bAddOn) !== 1,
        )
        .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
      const newTotal = currentIncludedQty + Number(option.nQuantity || 0);
      if (newTotal > Number(item.qty || 0)) {
        setOptionErrorWithAutoHide(
          optionId,
          `${newTotal} / ${item.qty} ${item.uom} — exceeds item qty`,
        );
        return;
      }
    }

    localUpdateRef.current = true;
    const patch = (val) =>
      setItems((p) =>
        p.map((i) =>
          i.id === itemId
            ? {
                ...i,
                purchaseOptions: i.purchaseOptions.map((o) =>
                  o.id === optionId ? { ...o, bPurchaseIncluded: val } : o,
                ),
              }
            : i,
        ),
      );
    patch(value);
    try {
      await PurchaseOptionAPI.updateOption(optionId, {
        bPurchaseIncluded: value ? 1 : 0,
      });
    } catch {
      setOptionErrorWithAutoHide(optionId, "Failed to update.");
      patch(!value);
    } finally {
      setTimeout(() => {
        localUpdateRef.current = false;
      }, 500);
    }
  };

  const handleAfterAction = (newStatusCode) => {
    localActionRef.current = true;
    setActionModal(null);
    if (newStatusCode) {
      sessionStorage.setItem(
        isManagement
          ? "selectedStatusCode"
          : isProcurement
            ? "selectedProcStatusCode"
            : "selectedAOStatusCode",
        newStatusCode,
      );
    }
    navigate(-1);
  };

  const handleCompareClick = (item, selectedOption) => {
    setCompareData({
      itemId: item.id,
      itemName: item.name,
      quantity: item.qty,
      specs: item.specs,
      uom: item.uom,
      abc: item.abc,
      purchaseOptions: [
        {
          nPurchaseOptionId: selectedOption.id,
          supplierId: selectedOption.nSupplierId,
          supplierName:
            selectedOption.supplierName || selectedOption.strSupplierName,
          supplierNickName:
            selectedOption.supplierNickName ||
            selectedOption.strSupplierNickName,
          quantity: selectedOption.nQuantity,
          uom: selectedOption.strUOM,
          brand: selectedOption.strBrand,
          model: selectedOption.strModel,
          unitPrice: selectedOption.dUnitPrice,
          specs: selectedOption.strSpecs,
          ewt: selectedOption.dEWT,
          included: !!selectedOption.bPurchaseIncluded,
        },
      ],
    });
    setIsCompareActive(true);
  };

  const handleBackFromCompare = () => {
    const itemId = compareData?.itemId;
    setIsCompareActive(false);
    setCompareData(null);
    setExpandedRows((prev) => ({
      ...prev,
      [itemId]: { specs: prev[itemId]?.specs || false, options: true },
    }));
  };

  const updateSpecs = async (id, specs, type = "option") => {
    if (type === "item") {
      await TransactionItemAPI.updateSpecs(id, { specs: specs ?? "" });
    } else {
      await PurchaseOptionAPI.updateSpecs(id, { specs: specs ?? "" });
    }
  };

  const deliveredOptions = useMemo(() => {
    const seenItemIds = new Set();
    const result = [];
    items.forEach((item) => {
      const deliveredOpts = (item.purchaseOptions || []).filter((o) => {
        const isFullyDelivered =
          String(optionStatuses[Number(o.nPurchaseOptionId)]) ===
          String(deliveredKey);
        const hasPartialDelivery =
          Number(o.nDeliveredQty || 0) > 0 && o.deliveredRows?.length > 0;
        return isFullyDelivered || hasPartialDelivery;
      });
      if (deliveredOpts.length > 0 && !seenItemIds.has(item.id)) {
        seenItemIds.add(item.id);
        result.push({
          itemName: item.name,
          itemQty: deliveredOpts.reduce(
            (sum, o) =>
              sum +
              (o.deliveredRows || []).reduce(
                (s, r) => s + Number(r.nQuantity || 0),
                0,
              ),
            0,
          ),
          itemUOM: item.uom,
          itemSpecs: item.specs ?? "",
          options: deliveredOpts.map((o) => ({
            nPurchaseOptionId: o.nPurchaseOptionId,
            nPurchaseOrderId: o.nPurchaseOrderId ?? null,
            supplierName: o.supplierNickName || o.supplierName || "—",
            orderedQty: Number(o.nQuantity || 0),
            uom: o.strUOM || item.uom || "",
            receivedQty: Number(o.nInventoryQty || 0),
            deliveredQty: Number(o.nDeliveredQty || 0),
            deliveredRows: o.deliveredRows || [],
          })),
        });
      }
    });
    return result;
  }, [items, optionStatuses, deliveredKey]);

  const salesInvoiceItems = useMemo(() => {
    return items
      .map((item) => {
        const includedOpts = (item.purchaseOptions || []).filter(
          (o) =>
            Number(o.bPurchaseIncluded) === 1 ||
            (o.bPurchaseIncluded == null && Number(o.bIncluded) === 1),
        );
        if (!includedOpts.length) return null;
        const itemQty = includedOpts.reduce(
          (s, o) => s + Number(o.nQuantity || 0),
          0,
        );
        const totalPrice = includedOpts.reduce(
          (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
          0,
        );
        const unitPrice = itemQty > 0 ? totalPrice / itemQty : 0;
        return {
          itemName: item.name,
          itemQty,
          itemUOM: item.uom,
          itemSpecs: item.specs ?? "",
          unitPrice,
          totalPrice,
        };
      })
      .filter(Boolean);
  }, [items]);

  /* ─── Effects ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    if (procNonCanvasStatus) {
      setItemsLoading(false);
      return;
    }
    Promise.all([fetchSuppliers(), fetchItems()]);
  }, [transaction, procNonCanvasStatus]);

  useEffect(() => {
    fetchLatestRef.current = fetchLatestPurchaseItemHistories;
  }, [fetchLatestPurchaseItemHistories]);

  /* ✅ PURCHASE ORDER / PURCHASE ORDER OPTION UPDATES — from global RealtimeProvider */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;

    const handlePurchaseOrderChange = (e) => {
      if (
        e.detail?.transactionId &&
        String(e.detail.transactionId) !== String(transaction.nTransactionId)
      ) {
        return;
      }
      fetchItemsRef.current?.();
    };

    window.addEventListener(
      "purchase_order_data_updated",
      handlePurchaseOrderChange,
    );
    window.addEventListener(
      "purchase_order_option_data_updated",
      handlePurchaseOrderChange,
    );

    return () => {
      window.removeEventListener(
        "purchase_order_data_updated",
        handlePurchaseOrderChange,
      );
      window.removeEventListener(
        "purchase_order_option_data_updated",
        handlePurchaseOrderChange,
      );
    };
  }, [transaction?.nTransactionId]);
  useEffect(() => {
    const cached = sessionStorage.getItem("ao_cache");
    if (cached) {
      setAccountOfficers(JSON.parse(cached));
      return;
    }
    UserAPI.getActiveAccountOfficers()
      .then((res) => {
        const list = res.accountOfficers || [];
        sessionStorage.setItem("ao_cache", JSON.stringify(list));
        setAccountOfficers(list);
      })
      .catch((err) => console.error("Error fetching AOs:", err));
  }, []);
  /* ✅ GLOBAL ITEM / OPTION EVENT LISTENERS — same pattern as useCanvas ✅ */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;

    const handleItemUpdated = (e) => {
      if (
        e.detail?.transactionId &&
        String(e.detail.transactionId) !== String(transaction.nTransactionId)
      ) {
        return;
      }
      fetchItems({ restoreScroll: true });
    };

    const handleItemDeleted = (e) => {
      if (
        e.detail?.transactionId &&
        String(e.detail.transactionId) !== String(transaction.nTransactionId)
      ) {
        return;
      }
      if (e.detail?.transactionItemId) {
        setItems((prev) =>
          prev.filter(
            (i) => String(i.id) !== String(e.detail.transactionItemId),
          ),
        );
      }
    };

    window.addEventListener("transaction_item_data_updated", handleItemUpdated);
    window.addEventListener("transaction_item_data_deleted", handleItemDeleted);

    return () => {
      window.removeEventListener(
        "transaction_item_data_updated",
        handleItemUpdated,
      );
      window.removeEventListener(
        "transaction_item_data_deleted",
        handleItemDeleted,
      );
    };
  }, [transaction?.nTransactionId]);

  /* ✅ PURCHASE OPTION INCLUDE/EXCLUDE UPDATES — from global RealtimeProvider */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;

    const handleOptionChange = (e) => {
      if (localUpdateRef.current) return;
      const eventTxId = String(e.detail?.transactionId);
      const currentTxId = String(transaction.nTransactionId);
      if (eventTxId !== currentTxId) return;
      fetchItems({ restoreScroll: true });
    };

    window.addEventListener("purchase_option_data_updated", handleOptionChange);
    return () =>
      window.removeEventListener(
        "purchase_option_data_updated",
        handleOptionChange,
      );
  }, [transaction?.nTransactionId]);

  /* ✅ SUPPLIER UPDATES — from global RealtimeProvider */
  useEffect(() => {
    const handleSupplierUpdate = () => fetchSuppliers(true);
    window.addEventListener("supplier_data_updated", handleSupplierUpdate);
    return () =>
      window.removeEventListener("supplier_data_updated", handleSupplierUpdate);
  }, []);

  /* ✅ TRANSACTION STATUS CHANGES — from global RealtimeProvider */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;

    const handleTxnUpdated = (e) => {
      if (localActionRef.current) return;
      if (
        String(e.detail?.transactionId) !== String(transaction.nTransactionId)
      ) {
        return;
      }

      const action = e.detail?.action;
      const statusChangingActions = [
        "status_changed",
        "assigned",
        "reverted",
        "verified",
        "finalized",
      ];
      if (!statusChangingActions.includes(action)) return;

      const newStatus = e.detail?.transaction?.latest_history?.nStatus;
      if (newStatus && String(newStatus) === String(statusCode)) return;

      setStatusChangedAlert(true);
    };

    window.addEventListener("txn_data_updated", handleTxnUpdated);
    return () =>
      window.removeEventListener("txn_data_updated", handleTxnUpdated);
  }, [transaction?.nTransactionId, statusCode]);

  useEffect(() => {
    if (!statusChangedAlert) return;
    setCountdown(5);
    let current = 5;
    countdownRef.current = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 0) {
        clearInterval(countdownRef.current);
        navigate(-1);
      }
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [statusChangedAlert, navigate]);

  useEffect(() => {
    fetchItemsRef.current = () => fetchItems({ restoreScroll: true });
  }, []);

  useEffect(() => {
    if (!transaction?.nTransactionId || !forCollection) return;
    let active = true;
    PricingAPI.getPricingSets(transaction.nTransactionId)
      .then((res) => {
        if (!active) return;
        const chosen = (res.data ?? []).find((s) => s.bChosen === 1);
        setTotalCollectibleValue(chosen?.totalSellingPrice ?? 0);
      })
      .catch((err) => {
        console.error("Failed to fetch chosen pricing set total:", err);
        if (active) setTotalCollectibleValue(0);
      });
    return () => {
      active = false;
    };
  }, [transaction?.nTransactionId, forCollection]);
  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    const handler = () => fetchItemsRef.current?.();
    window.addEventListener("cart_data_updated", handler);
    window.addEventListener("inventory_data_updated", handler);
    return () => {
      window.removeEventListener("cart_data_updated", handler);
      window.removeEventListener("inventory_data_updated", handler);
    };
  }, [transaction?.nTransactionId]);
  return {
    transaction,
    transactionCode,
    statusCode,
    currentStatusLabel,
    isManagement,
    isProcurement,
    isProcurementTL,

    isAccountOfficer,
    isAOTL,
    limitedContent,
    isCanvasStatus,
    showRevert,
    crudItemsEnabled,
    showPurchaseOptions,
    checkboxOptionsEnabled,
    forCollection,
    transactionHasABC,
    totalItemsABC,
    totalABC,
    totalCanvas,
    abcValue,
    abcSub,
    abcValidation,
    procSourceLabel,
    statusChangedAlert,
    statusChangedTooltip,
    isTransactionOwner,
    totalPurchaseProgress,
    totalPurchaseBalance,
    totalCollectibleValue,
    assignedAOName,
    assignedAONo,

    items,
    itemsLoading,
    suppliers,
    cItemType,
    expandedRows,
    expandedOptions,
    addingNewItem,
    editingItem,
    entityToDelete,
    suggestionsItem,
    isSuggestionsModalOpen,
    editingOption,
    optionModalItemId,
    optionModalItem,
    optionErrors,
    optionStatuses,
    latestHistories,
    optionAllHistories,
    optionCartStatuses,
    deliveryModalOpen,
    compareData,
    isCompareActive,
    confirmDrPrint,
    confirmSiPrint,
    directCostModalOpen,
    completeModalOpen,
    completeConfirmOpen,
    actionModal,
    activeTab,
    countdown,
    scrollRef,

    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    removedFromCartKey,
    openCartKey,
    closeCartKey,
    cancelCartKey,
    closePoKey,
    cancelPoKey,
    forPurchaseKey,
    forCanvasKey,
    canvasVerificationKey,
    forCollectionKey,
    archiveStatus,
    currentUserId,
    statusTransaction,
    itemType,
    procMode,
    canvasVerificationLabel,
    forCanvasLabel,
    finalizeKeyLabel,

    fmtPHP,
    fmtDate,
    getDueDateVariant,
    getEffectiveABC,
    fetchItems,
    fetchLatestPurchaseItemHistories,
    fetchAllOptionHistory,
    toggleSpecsRow,
    toggleOptionsRow,
    toggleOptionSpecs,
    handleCollapseAllToggle,
    handleToggleInclude,
    handleAfterAction,
    handleCompareClick,
    handleBackFromCompare,
    updateSpecs,
    setActionModal,
    setActiveTab,
    setEntityToDelete,
    setSuggestionsItem,
    setIsSuggestionsModalOpen,
    setEditingItem,
    setAddingNewItem,
    setEditingOption,
    setOptionModalItemId,
    setOptionModalItem,
    setDeliveryModalOpen,
    setConfirmDrPrint,
    setConfirmSiPrint,
    setDirectCostModalOpen,
    setCompleteConfirmOpen,
    setCompleteModalOpen,
    setExpandedRows,
    deliveredOptions,
    salesInvoiceItems,

    assignedAOName,
    assignedAONo,
    ao_status,
    forPricingKey,
    priceVerificationKey,
    priceApprovalKey,
    priceSettingKey,
    priceFinalizeVerificationKey,
    procSource,
    assignMode,
    setAssignMode,
    accountOfficers,
    hasAssignedAO,
    isAssignedToMe,
    showReassignAO,
    proc_status,
  };
}
