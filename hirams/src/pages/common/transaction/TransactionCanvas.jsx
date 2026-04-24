import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../../components/common/PageLayout";
import api from "../../../utils/api/api";
import { Box, Typography, Alert } from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  AutoAwesome,
  ArrowBack,
  Replay,
  CheckCircle,
  DoneAll,
  AssignmentInd,
  Business,
  Inventory2Outlined,
  FileDownload,
  MonetizationOnOutlined,
  ReceiptLongOutlined,
  EventOutlined,
  CalendarTodayOutlined,
  ListAlt,
  ReceiptLong,
  EmojiEvents,
  Unarchive,
} from "@mui/icons-material";
import BaseButton from "../../../components/common/BaseButton";
import InfoDialog from "../../../components/common/InfoDialog";
import TransactionDetails from "../../../components/common/TransactionDetails";
import AssignAOModal from "./modal/transaction-canvas/AssignAOModal";
import NewItemModal from "./modal/transaction-canvas/NewItemModal";
import NewOptionModal from "./modal/transaction-canvas/NewOptionModal";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import TransactionActionModal from "../modal/TransactionActionModal";
import ExportCanvasModal from "./modal/transaction-canvas/ExportCanvasModal";
import CostBreakdownModal from "./modal/transaction-pricing/CostBreakdownModal";
import GetSuggestionsModal from "./modal/transaction-canvas/GetSuggestionsModal";
import AlertDialog from "../../../components/common/AlertDialog";
import { getDueDateColor } from "../../../utils/helpers/dueDateColor";
import StatusModal from "../modal/StatusModal";
import ArchiveModal from "../modal/ArchiveModal";
// ← NEW: separated table component
import TransactionItemsTable from "./components/TransactionItemsTable";

import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import echo from "../../../utils/echo";

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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

/* ─── Shared inline button style ─────────────────────────────────── */
const inlineBtnSx = (bg = "#fff") => ({
  fontSize: "0.7rem",
  backgroundColor: bg,
  border: "1px solid #cfd8dc",
  cursor: "pointer",
  color: "#1976d2",
  fontWeight: 500,
  borderRadius: "6px",
  padding: "1px 6px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
function TransactionCanvas() {
  const { state } = useLocation();
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
    procSource,
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
    proc_status,
    priceSettingKey = "",
    finalizeVerificationKey = "",
    priceFinalizeVerificationKey = "",
    currentUserId,
    priceApprovedKey = "",
    procPriceApprovedKey = "",
    archiveStatus = {},
  } = state || {};

  const navigate = useNavigate();
  const errorTimeoutsRef = useRef({});
  const scrollRef = useRef(null);

  /* ── State ── */
  const [actionModal, setActionModal] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});
  const [isCompareActive, setIsCompareActive] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [cItemType, setCItemType] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [optionModalItemId, setOptionModalItemId] = useState(null);
  const [optionModalItem, setOptionModalItem] = useState(null);
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [assignMode, setAssignMode] = useState(null);
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [optionErrors, setOptionErrors] = useState({});
  const [suggestionsItem, setSuggestionsItem] = useState(null);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isExportCanvasOpen, setIsExportCanvasOpen] = useState(false);
  const [isCostBreakdownOpen, setIsCostBreakdownOpen] = useState(false);
  const [pricingSet, setPricingSet] = useState(null);
  const [pricingItems, setPricingItems] = useState([]);
  const [unitSellingPrices, setUnitSellingPrices] = useState({});
  const [statusChangedAlert, setStatusChangedAlert] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const localUpdateRef = useRef(false);
  const localActionRef = useRef(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");
  const statusCode = selectedStatusCode;
  const statusChangedTooltip = statusChangedAlert
    ? "This transaction has been moved to a different status by another user. All actions are disabled."
    : "";
  const isTransactionOwner =
    currentUserId && transaction?.created_by_id
      ? String(currentUserId) === String(transaction.created_by_id)
      : false;
  const isArchiveView = state?.isArchiveView ?? false;

  /* ── Visibility flags ── */
  const procNonCanvasStatus =
    isArchiveView ||
    ((isProcurement || isManagement) &&
      (draftKey.includes(statusCode) ||
        finalizeKey?.includes(statusCode) ||
        finalizeVerificationKey?.includes(statusCode) ||
        priceApprovedKey?.includes(statusCode) ||
        procPriceApprovedKey?.includes(statusCode)));

  const showCostBreakdown =
    priceApprovedKey?.includes(statusCode) ||
    procPriceApprovedKey?.includes(statusCode);

  const hasAssignedAO = Number(transaction?.nAssignedAO) > 0;
  const limitedContent =
    (!isProcurement && !hasAssignedAO) || procNonCanvasStatus;
  const showForAssignment =
    forAssignmentKey.includes(statusCode) && (isAOTL || isManagement);
  const showPurchaseOptions =
    forCanvasKey.includes(statusCode) ||
    canvasFinalizeKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const crudItemsEnabled = itemsManagementKey.includes(statusCode);
  const showAddButton = crudItemsEnabled;
  const checkboxOptionsEnabled =
    !statusChangedAlert && forCanvasKey.includes(statusCode);
  const isCanvasStatus =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const isItemsManagementStatus =
    itemsManagementKey.includes(selectedStatusCode);

  const showVerify =
    !isCompareActive &&
    (itemsVerificationKey?.includes(statusCode) ||
      canvasVerificationKey?.includes(statusCode) ||
      (finalizeKey?.includes(statusCode) && isManagement) ||
      (isProcurement &&
        (finalizeVerificationKey?.includes(statusCode) ||
          priceFinalizeVerificationKey?.includes(statusCode))));

  const showFinalize =
    (isProcurement &&
      (itemsManagementKey.includes(statusCode) ||
        draftKey.includes(statusCode))) ||
    (isManagement &&
      (draftKey.includes(statusCode) || priceSettingKey.includes(statusCode)) &&
      isTransactionOwner) ||
    (isAccountOfficer &&
      (forCanvasKey.includes(statusCode) ||
        itemsManagementKey.includes(statusCode)) &&
      !isCompareActive);

  const showForceFinalize =
    isManagement &&
    (itemsManagementKey.includes(statusCode) ||
      ((draftKey.includes(statusCode) ||
        priceSettingKey.includes(statusCode)) &&
        !isTransactionOwner) ||
      (forCanvasKey.includes(statusCode) && !isCompareActive));

  const showRevert =
    !isCompareActive &&
    ((isProcurement &&
      !draftKey.includes(statusCode) &&
      !priceSettingKey.includes(statusCode)) ||
      (isManagement &&
        !forAssignmentKey.includes(statusCode) &&
        !draftKey.includes(statusCode)) ||
      (isAccountOfficer &&
        !forAssignmentKey.includes(statusCode) &&
        !itemsManagementKey.includes(statusCode)) ||
      (forAssignmentKey.includes(statusCode) &&
        !hasAssignedAO &&
        isManagement));

  /* ── Computed values ── */
  const transactionHasABC =
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;
  const totalItemsABC = items.reduce((sum, i) => sum + Number(i.abc || 0), 0);
  const anyItemHasABC =
    items.some((i) => Number(i.abc || 0) > 0) || items.length === 0;
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

  const totalIncludedQty = items.reduce(
    (sum, item) =>
      sum +
      item.purchaseOptions
        .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
        .reduce((s, o) => s + Number(o.nQuantity || 0), 0),
    0,
  );

  const totalItemQty = items.reduce((sum, i) => sum + Number(i.qty || 0), 0);

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

  const abcValidation = (() => {
    if (itemsManagementKey.includes(statusCode)) {
      if (transactionHasABC && totalItemsABC > 0) {
        if (totalItemsABC > Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmt(totalItemsABC)}) exceeds Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
        if (totalItemsABC < Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmt(totalItemsABC)}) must equal Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
      }
      if (!transactionHasABC) {
        const missingABC = items.filter((i) => !i.abc || Number(i.abc) === 0);
        if (missingABC.length > 0)
          return `All items must have an ABC value. Missing: ${missingABC.map((i) => `"${i.name}"`).join(", ")}`;
      }
    }
    if (isCanvasStatus && transactionHasABC) {
      if (totalCanvas > Number(transaction.dTotalABC || 0))
        return `Total Canvas (₱${fmt(totalCanvas)}) exceeds Transaction ABC (₱${fmt(transaction.dTotalABC)}). Please adjust the included purchase options.`;
      const overItems = items.filter((item) => {
        const tot = item.purchaseOptions
          .filter((o) => o.bIncluded)
          .reduce(
            (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
            0,
          );
        return tot > Number(item.abc || 0);
      });
      if (anyItemHasABC && overItems.length > 0)
        return `The following item(s) have canvas totals exceeding their ABC: ${overItems.map((i) => `"${i.name}"`).join(", ")}. Please adjust the included purchase options.`;
      if (totalItemsABC > Number(transaction.dTotalABC))
        return `Items ABC total (₱${fmt(totalItemsABC)}) must not exceed Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
      return null;
    }
    return null;
  })();

  const shouldDisableFinalize = (() => {
    if (!isItemsManagementStatus)
      return (
        itemsLoading ||
        (totalIncludedQty !== totalItemQty && !showAddButton) ||
        Boolean(abcValidation)
      );
    if (isProcurement && draftKey.includes(statusCode)) return itemsLoading;
    if (items.length === 0 || itemsLoading) return true;
    if (Boolean(abcValidation)) return true;
    if (transactionHasABC && totalItemsABC > 0)
      return totalItemsABC !== Number(transaction.dTotalABC);
    if (!transactionHasABC)
      return items.some((i) => !i.abc || Number(i.abc) === 0);
    return false;
  })();

  const finalizeBlockReason = (() => {
    if (items.length === 0)
      return "At least one item is required before finalizing";
    if (
      transactionHasABC &&
      totalItemsABC > 0 &&
      totalItemsABC !== Number(transaction.dTotalABC)
    )
      return `Items ABC total (₱${fmt(totalItemsABC)}) must equal Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
    if (!transactionHasABC && items.some((i) => !i.abc || Number(i.abc) === 0))
      return "All items must have an ABC value before finalizing";
    if (abcValidation) return abcValidation;
    if (totalIncludedQty !== totalItemQty && !showAddButton)
      return "All item quantities must be fulfilled before finalizing";
    return "";
  })();

  /* ── Data fetchers ── */
  const fetchSuppliers = async (force = false) => {
    const cached = sessionStorage.getItem("suppliers_cache");
    if (cached && !force) return setSuppliers(JSON.parse(cached));
    try {
      const res = await api.get("suppliers/all");
      const opts = mapSuppliers(res.suppliers);
      sessionStorage.setItem("suppliers_cache", JSON.stringify(opts));
      setSuppliers(opts);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchItems = async ({ restoreScroll = false } = {}) => {
    if (!transaction?.nTransactionId) return;
    const savedScroll =
      restoreScroll && scrollRef.current ? scrollRef.current.scrollTop : 0;
    try {
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );
      const itemTypeKey =
        res.cItemType && typeof res.cItemType === "object"
          ? Object.keys(res.cItemType)[0]
          : res.cItemType;
      setCItemType(itemTypeKey);
      setItems(
        (res.items || []).map((item) => ({
          ...item,
          purchaseOptions: item.purchaseOptions || [],
          optionsLoaded: true,
          optionsLoading: false,
        })),
      );
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setItemsLoading(false);
      if (restoreScroll && savedScroll > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = savedScroll;
            }
          });
        });
      }
    }
  };

  const fetchAOs = useCallback(async () => {
    try {
      const res = await api.get("users/active-account-officers");
      const list = res.accountOfficers || [];
      sessionStorage.setItem("ao_cache", JSON.stringify(list));
      setAccountOfficers(list);
    } catch (err) {
      console.error("Error fetching AOs:", err);
    }
  }, []);

  const fetchPricingData = useCallback(async () => {
    if (!transaction?.nTransactionId) return;
    try {
      const setRes = await api.get(
        `pricing-sets?nTransactionId=${transaction.nTransactionId}`,
      );
      const sets = setRes.data ?? [];
      const chosenSet = sets.find((s) => s.bChosen === 1 || s.bChosen === true);
      if (!chosenSet) return;
      const activeSet = {
        id: chosenSet.nPricingSetId,
        name: chosenSet.strName,
      };
      setPricingSet(activeSet);
      const itemsRes = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );
      const shapedItems = (itemsRes.items || []).map((item) => ({
        ...item,
        purchaseOptions: (item.purchaseOptions || [])
          .filter((o) => o.bIncluded === 1 || o.bIncluded === true)
          .map((o) => ({
            id: o.id,
            nPurchaseOptionId: o.nPurchaseOptionId,
            nSupplierId: o.nSupplierId,
            supplierName: o.supplierName || o.strSupplierName,
            supplierNickName: o.supplierNickName || o.strSupplierNickName,
            nQuantity: o.nQuantity,
            strUOM: o.strUOM,
            strBrand: o.strBrand,
            strModel: o.strModel,
            dUnitPrice: o.dUnitPrice,
            strSpecs: o.strSpecs,
            dEWT: o.dEWT,
            bIncluded: o.bIncluded,
            bAddOn: o.bAddOn,
            dSuggestivePrice: o.dSuggestivePrice,
          })),
        optionsLoaded: true,
        optionsLoading: false,
      }));
      const priceRes = await api.get(
        `item-pricings?pricing_set_id=${activeSet.id}`,
      );
      const pricesMap = {};
      (priceRes.itemPricings || []).forEach((p) => {
        if (p.dUnitSellingPrice !== null && p.dUnitSellingPrice !== 0)
          pricesMap[p.nTransactionItemId] = p.dUnitSellingPrice;
      });
      setPricingItems(shapedItems);
      setUnitSellingPrices(pricesMap);
    } catch (err) {
      console.error("fetchPricingData error:", err);
    }
  }, [transaction]);

  /* ── Effects ── */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    if (procNonCanvasStatus) {
      setItemsLoading(false);
      return;
    }
    Promise.all([fetchSuppliers(), fetchItems()]);
  }, [transaction]);

  useEffect(() => {
    if (!userTypes) return;
    const cached = sessionStorage.getItem("ao_cache");
    if (cached) setAccountOfficers(JSON.parse(cached));
    else fetchAOs();
  }, [userTypes, fetchAOs]);

  useEffect(() => {
    if (showCostBreakdown) fetchPricingData();
  }, [showCostBreakdown, fetchPricingData]);

  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    const channel = echo.channel(
      `transaction.${transaction.nTransactionId}.items`,
    );
    channel.listen(".item.updated", (event) => {
      if (event.action === "deleted") {
        setItems((prev) => prev.filter((i) => i.id !== event.itemId));
        return;
      }
      fetchItems({ restoreScroll: true });
    });
    channel.listen(".option.updated", (event) => {
      if (localUpdateRef.current) return;
      if (event.action === "deleted") {
        setItems((prev) =>
          prev.map((item) =>
            item.id === event.itemId
              ? {
                  ...item,
                  purchaseOptions: item.purchaseOptions.filter(
                    (o) => o.id !== event.optionId,
                  ),
                }
              : item,
          ),
        );
        return;
      }
      fetchItems({ restoreScroll: true });
    });
    const suppliersChannel = echo.channel("suppliers");
    suppliersChannel.listen(".supplier.updated", () => fetchSuppliers(true));
    const txnChannel = echo.channel("transactions");
    txnChannel.listen(".transaction.updated", (event) => {
      if (String(event.transactionId) !== String(transaction.nTransactionId))
        return;
      if (localActionRef.current) return;
      const statusChangingActions = [
        "status_changed",
        "assigned",
        "reverted",
        "verified",
        "finalized",
      ];
      if (!statusChangingActions.includes(event.action)) return;
      const newStatus = event.transaction?.latest_history?.nStatus;
      if (newStatus && String(newStatus) === String(statusCode)) return;
      setStatusChangedAlert(true);
    });
    return () => {
      echo.leaveChannel(`transaction.${transaction.nTransactionId}.items`);
      echo.leaveChannel("suppliers");
      echo.leaveChannel("transactions");
    };
  }, [transaction, procNonCanvasStatus]);

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
  }, [statusChangedAlert]);

  useEffect(() => {
    const channel = echo.channel("users");
    channel.listen(".user.updated", (event) => {
      sessionStorage.removeItem("ao_cache");
      if (event.action === "deleted") {
        setAccountOfficers((prev) =>
          prev.filter((ao) => ao.value !== event.userId),
        );
        return;
      }
      fetchAOs();
    });
    return () => {
      echo.leaveChannel("users");
    };
  }, [fetchAOs]);

  /* ── Handlers ── */
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
    setExpandedRows((prev) => ({
      ...prev,
      [id]: { specs: !prev[id]?.specs, options: prev[id]?.options || false },
    }));

  const toggleOptionsRow = (id) =>
    setExpandedRows((prev) => ({
      ...prev,
      [id]: { specs: prev[id]?.specs || false, options: !prev[id]?.options },
    }));

  const toggleOptionSpecs = (optionId) =>
    setExpandedOptions((prev) => ({ ...prev, [optionId]: !prev[optionId] }));

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
          (o) => o.id !== optionId && o.bIncluded && Number(o.bAddOn) !== 1,
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
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              purchaseOptions: i.purchaseOptions.map((o) =>
                o.id === optionId ? { ...o, bIncluded: value } : o,
              ),
            }
          : i,
      ),
    );
    try {
      await api.put(`purchase-options/${optionId}`, {
        bIncluded: value ? 1 : 0,
      });
    } catch {
      setOptionErrorWithAutoHide(optionId, "Failed to update.");
    } finally {
      setTimeout(() => {
        localUpdateRef.current = false;
      }, 500);
    }
  };

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      if (!over || active.id === over.id) return;
      const reordered = arrayMove(
        items,
        items.findIndex((i) => i.id === active.id),
        items.findIndex((i) => i.id === over.id),
      ).map((item, index) => ({ ...item, nItemNumber: index + 1 }));
      setItems(reordered);
      try {
        await api.put("transactions/items/update-order", {
          items: reordered.map((i) => ({
            id: i.id,
            nItemNumber: i.nItemNumber,
          })),
        });
      } catch (err) {
        console.error("Failed to update order:", err);
      }
    },
    [items],
  );

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
          included: !!selectedOption.bIncluded,
        },
      ],
    });
    setIsCompareActive(true);
  };

  const handleBackFromCompare = async () => {
    const itemId = compareData?.itemId;
    setIsCompareActive(false);
    setCompareData(null);
    setActiveTab("canvas");
    setExpandedRows((prev) => ({
      ...prev,
      [itemId]: { specs: prev[itemId]?.specs || false, options: true },
    }));
  };

  const updateSpecs = async (id, specs, type = "option") => {
    const endpoint =
      type === "item"
        ? `transaction-item/${id}/update-specs`
        : `purchase-options/${id}/update-specs`;
    try {
      await api.put(
        endpoint,
        { specs: specs ?? "" },
        { headers: { "Content-Type": "application/json" } },
      );
    } catch {}
  };

  const handleAfterAction = (newStatusCode) => {
    localActionRef.current = true;
    setActionModal(null);
    if (newStatusCode)
      sessionStorage.setItem(
        isManagement
          ? "selectedStatusCode"
          : isProcurement
            ? "selectedProcStatusCode"
            : "selectedAOStatusCode",
        newStatusCode,
      );
    navigate(-1);
  };

  if (!transaction) return null;

  /* ── Derived for stat cards ── */
  const totalABC = transactionHasABC
    ? Number(transaction.dTotalABC)
    : items.reduce((s, i) => s + Number(i.abc || 0), 0);
  const abcValue = transactionHasABC
    ? `₱ ${fmt(transaction.dTotalABC)}`
    : `₱ ${fmt(totalItemsABC)}`;
  const abcSub =
    (itemsManagementKey.includes(statusCode) ||
      itemsVerificationKey.includes(statusCode) ||
      forCanvasKey.includes(statusCode) ||
      canvasVerificationKey.includes(statusCode)) &&
    transactionHasABC &&
    totalItemsABC > 0
      ? `Items ₱${fmt(totalItemsABC)}`
      : null;

  /* ── Status-changed banner (shared) ── */
  const StatusChangedBanner = () =>
    statusChangedAlert ? (
      <Box
        sx={{
          mb: 1.5,
          px: 1.5,
          py: 0.75,
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.35)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Replay sx={{ fontSize: "0.9rem", color: "#B45309" }} />
          <Typography
            sx={{ fontSize: "0.65rem", color: "#92400E", fontWeight: 600 }}
          >
            Status update detected — this transaction has been moved to a
            different status. All actions are disabled. Redirecting you back
            shortly.
          </Typography>
        </Box>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid #B45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#B45309",
                lineHeight: 1,
              }}
            >
              {countdown ?? 5}
            </Typography>
          </Box>
        </Box>
      </Box>
    ) : null;

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <PageLayout
      title={isArchiveView ? "Transaction Archived" : "Transaction"}
      subtitle={
        !isArchiveView
          ? `/ ${currentStatusLabel || ""} / ${transactionCode || ""}`
          : `/ ${transactionCode || ""}`
      }
      loading={itemsLoading}
      scrollRef={scrollRef}
      headerRight={
        !limitedContent ? (
          <div
            style={{
              display: "flex",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              overflow: "hidden",
              fontSize: "0.65rem",
              fontWeight: 600,
            }}
          >
            <button
              onClick={() => setActiveTab("info")}
              style={{
                padding: "3px 10px",
                background: activeTab === "info" ? "#1565c0" : "#fff",
                color: activeTab === "info" ? "#fff" : "#64748b",
                border: "none",
                borderRight: "1px solid #cbd5e1",
                cursor: "pointer",
              }}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab("canvas")}
              style={{
                padding: "3px 10px",
                background: activeTab === "canvas" ? "#1565c0" : "#fff",
                color: activeTab === "canvas" ? "#fff" : "#64748b",
                border: "none",
                cursor: "pointer",
              }}
            >
              Canvas
            </button>
          </div>
        ) : null
      }
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <BaseButton
              label="Back"
              icon={<ArrowBack />}
              onClick={
                isCompareActive ? handleBackFromCompare : () => navigate(-1)
              }
              actionColor="back"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {showRevert && (
              <BaseButton
                label="Revert"
                icon={<Replay />}
                onClick={() => setActionModal("reverted")}
                disabled={itemsLoading || statusChangedAlert}
                actionColor="revert"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : ""
                }
              />
            )}
            {showCostBreakdown && (
              <BaseButton
                label="Cost Breakdown"
                icon={<ReceiptLong />}
                onClick={() => setIsCostBreakdownOpen(true)}
                disabled={itemsLoading || statusChangedAlert}
                actionColor="breakdown"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : ""
                }
              />
            )}
            {showCostBreakdown && (isManagement || isProcurement) && (
              <BaseButton
                label="Update Status"
                icon={<EmojiEvents />}
                onClick={() => setIsStatusModalOpen(true)}
                disabled={itemsLoading || statusChangedAlert}
                actionColor="approve"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : "Mark transaction as Won or Lost"
                }
              />
            )}
            {forCanvasKey.includes(statusCode) && !isCompareActive && (
              <BaseButton
                label="Export"
                icon={<FileDownload />}
                onClick={() => setIsExportCanvasOpen(true)}
                disabled={
                  statusChangedAlert ||
                  itemsLoading ||
                  totalIncludedQty !== totalItemQty
                }
                actionColor="save"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : totalIncludedQty !== totalItemQty
                        ? "All item quantities must be fulfilled before exporting"
                        : ""
                }
              />
            )}
            {showVerify && (
              <BaseButton
                label="Verify"
                icon={<CheckCircle />}
                onClick={() => setActionModal("verified")}
                disabled={itemsLoading || statusChangedAlert}
                actionColor="verify"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : ""
                }
              />
            )}
            {showFinalize && (
              <BaseButton
                label="Finalize"
                icon={<DoneAll />}
                onClick={() => setActionModal("finalized")}
                disabled={shouldDisableFinalize || statusChangedAlert}
                actionColor="finalize"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : finalizeBlockReason
                }
              />
            )}
            {showForceFinalize && (
              <BaseButton
                label="Force Finalize"
                icon={<DoneAll />}
                onClick={() => setActionModal("force_finalized")}
                disabled={shouldDisableFinalize || statusChangedAlert}
                actionColor="finalize"
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : finalizeBlockReason
                }
              />
            )}
            {showForAssignment && (
              <BaseButton
                label={hasAssignedAO ? "Reassign AO" : "Assign AO"}
                icon={<AssignmentInd />}
                onClick={() =>
                  setAssignMode(hasAssignedAO ? "reassign" : "assign")
                }
                disabled={itemsLoading || statusChangedAlert}
                actionColor={hasAssignedAO ? "reassign" : "assign"}
                tooltip={
                  statusChangedAlert
                    ? statusChangedTooltip
                    : itemsLoading
                      ? "Loading items, please wait..."
                      : ""
                }
              />
            )}
            {isArchiveView && (
              <BaseButton
                label="Unarchive"
                icon={<Unarchive />}
                onClick={() => setIsArchiveModalOpen(true)}
                actionColor="revert"
              />
            )}
          </Box>
        </Box>
      }
    >
      <Box>
        <StatusChangedBanner />

        {/* ══ LIMITED CONTENT — always shown as-is (no tabs) ══ */}
        {limitedContent && (
          <TransactionDetails
            details={transaction}
            statusTransaction={statusTransaction}
            itemType={itemType}
            procMode={procMode}
            procSourceLabel={procSourceLabel}
          />
        )}
        {/* ══ FULL VIEW WITH TABS ══ */}
        {!limitedContent && (
          <>
            {/* Info tab */}
            {activeTab === "info" && (
              <TransactionDetails
                details={transaction}
                statusTransaction={statusTransaction}
                itemType={itemType}
                procMode={procMode}
                procSourceLabel={procSourceLabel}
              />
            )}

            {/* Canvas tab */}
            {activeTab === "canvas" && (
              <>
                {!isCompareActive && abcValidation && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {abcValidation}
                  </Alert>
                )}
                <TransactionItemsTable
                  items={items}
                  itemsLoading={itemsLoading}
                  expandedRows={expandedRows}
                  expandedOptions={expandedOptions}
                  optionErrors={optionErrors}
                  compareData={compareData}
                  isCompareActive={isCompareActive}
                  crudItemsEnabled={crudItemsEnabled}
                  showAddButton={showAddButton}
                  showPurchaseOptions={showPurchaseOptions}
                  checkboxOptionsEnabled={checkboxOptionsEnabled}
                  anyItemHasABC={anyItemHasABC}
                  statusChangedAlert={statusChangedAlert}
                  isManagement={isManagement}
                  isAccountOfficer={isAccountOfficer}
                  suppliers={suppliers}
                  cItemType={cItemType}
                  currentStatusLabel={currentStatusLabel}
                  transaction={transaction}
                  getEffectiveABC={getEffectiveABC}
                  handleDragEnd={handleDragEnd}
                  handleCollapseAllToggle={handleCollapseAllToggle}
                  toggleSpecsRow={toggleSpecsRow}
                  toggleOptionsRow={toggleOptionsRow}
                  toggleOptionSpecs={toggleOptionSpecs}
                  handleToggleInclude={handleToggleInclude}
                  handleCompareClick={handleCompareClick}
                  setEditingItem={setEditingItem}
                  setAddingNewItem={setAddingNewItem}
                  setEntityToDelete={setEntityToDelete}
                  setSuggestionsItem={setSuggestionsItem}
                  setIsSuggestionsModalOpen={setIsSuggestionsModalOpen}
                  setEditingOption={setEditingOption}
                  setOptionModalItemId={setOptionModalItemId}
                  setOptionModalItem={setOptionModalItem}
                  setExpandedRows={setExpandedRows}
                  forCanvasKey={forCanvasKey}
                  abcValue={abcValue}
                  abcSub={abcSub}
                  abcValidation={abcValidation}
                  totalCanvas={totalCanvas}
                  totalABC={totalABC}
                  fmtDate={fmtDate}
                  fmtTime={fmtTime}
                  getDueDateVariant={getDueDateVariant}
                  onSpecsChange={(newSpecs) => {
                    setCompareData((prev) => ({ ...prev, specs: newSpecs }));
                    updateSpecs(compareData.itemId, newSpecs, "item");
                  }}
                  onOptionSpecsChange={(optionId, newSpecs) => {
                    setCompareData((prev) => ({
                      ...prev,
                      purchaseOptions: prev.purchaseOptions.map((po) =>
                        po.nPurchaseOptionId === optionId
                          ? { ...po, specs: newSpecs }
                          : po,
                      ),
                    }));
                    updateSpecs(optionId, newSpecs);
                  }}
                />
              </>
            )}
          </>
        )}
      </Box>

      {/* ══ Modals ══ */}
      <DeleteVerificationModal
        open={entityToDelete !== null}
        entityToDelete={entityToDelete}
        onClose={() => setEntityToDelete(null)}
        onSuccess={() => fetchItems({ restoreScroll: true })}
      />
      <NewItemModal
        open={addingNewItem}
        onClose={() => {
          setAddingNewItem(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        onSuccess={() => fetchItems({ restoreScroll: true })}
        transactionId={transaction?.nTransactionId}
        transactionHasABC={transactionHasABC}
        transactionABC={transaction?.dTotalABC}
        totalItemsABC={totalItemsABC}
        clientId={transaction?.client?.nClientId ?? transaction?.nClientId}
      />
      <NewOptionModal
        open={optionModalItemId !== null}
        onClose={() => {
          setOptionModalItemId(null);
          setEditingOption(null);
          setOptionModalItem(null);
        }}
        editingOption={editingOption}
        itemId={optionModalItemId}
        sourceItem={optionModalItem}
        onSuccess={() => fetchItems({ restoreScroll: true })}
        suppliers={suppliers}
        cItemType={cItemType}
      />
      <ExportCanvasModal
        open={isExportCanvasOpen}
        onClose={() => setIsExportCanvasOpen(false)}
        items={items}
        transaction={transaction}
        clientName={transaction?.clientName}
      />
      <TransactionActionModal
        open={Boolean(actionModal)}
        actionType={actionModal}
        transaction={transaction}
        canvasVerificationLabel={canvasVerificationLabel}
        forCanvasLabel={forCanvasLabel}
        finalizeKeyLabel={finalizeKeyLabel}
        onClose={() => setActionModal(null)}
        aostatus={isManagement ? "" : isProcurement ? proc_status : ao_status}
        transacstatus={isManagement ? transacstatus : ""}
        onVerified={handleAfterAction}
        onReverted={handleAfterAction}
        onFinalized={handleAfterAction}
        role={isManagement ? "M" : isProcurement ? "P" : "A"}
      />
      <AssignAOModal
        open={!!assignMode}
        mode={assignMode}
        transaction={transaction}
        accountOfficers={accountOfficers}
        onClose={() => setAssignMode(null)}
        onSuccess={() => navigate(-1)}
      />
      <GetSuggestionsModal
        open={isSuggestionsModalOpen}
        onClose={() => {
          setIsSuggestionsModalOpen(false);
          setSuggestionsItem(null);
        }}
        item={suggestionsItem}
        itemId={suggestionsItem?.id}
        suppliers={suppliers}
        cItemType={cItemType}
        onSuccess={() => fetchItems({ restoreScroll: true })}
      />
      <CostBreakdownModal
        open={isCostBreakdownOpen}
        onClose={() => setIsCostBreakdownOpen(false)}
        transaction={transaction}
        selectedSet={pricingSet}
        items={pricingItems}
        unitSellingPrices={unitSellingPrices}
        clientName={transaction?.clientName}
      />
      <StatusModal
        open={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        transaction={transaction}
        transacstatus={transacstatus}
        archiveStatus={state?.archiveStatus ?? {}}
        onSuccess={(newStatusCode) => {
          setIsStatusModalOpen(false);
          handleAfterAction(newStatusCode);
        }}
      />
      <ArchiveModal
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        transaction={transaction}
        transactionId={transaction?.nTransactionId}
        transactionCode={transactionCode}
        mode="unarchive"
        archiveStatus={archiveStatus}
        onSuccess={() => {
          setIsArchiveModalOpen(false);
          navigate(-1);
        }}
      />
    </PageLayout>
  );
}

export default TransactionCanvas;
