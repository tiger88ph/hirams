import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../../components/common/PageLayout";
import api from "../../../utils/api/api";
import { Box, Typography, Alert } from "@mui/material";
import {
  ArrowBack,
  Replay,
  PrintOutlined, // ← ADD
} from "@mui/icons-material";
import BaseButton from "../../../components/common/BaseButton";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TransactionDetails from "../../../components/common/TransactionDetails";
import NewOptionModal from "./modal/transaction-canvas/NewOptionModal";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import TransactionActionModal from "../modal/TransactionActionModal";
import GetSuggestionsModal from "./modal/transaction-canvas/GetSuggestionsModal";
import echo from "../../../utils/echo";
import PurchaseItemsTable from "./components/transaction-purchase/PurchaseItemsTable";
import { PurchasePageSkeleton } from "../../../components/helper/Skeleton";
import UpdateDeliveryInfoModal from "./modal/transaction-pricing/UpdateDeliveryInfoModal";
import { fmtDate, fmtDateTime } from "../../../utils/helpers/timeZone";
// import AlertDialog from "../../../components/common/AlertDialog";
import PrintDeliveryReceiptModal from "./modal/transaction-purchase/PrintDeliveryReceiptModal";
/* ─── Helpers ────────────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const { getDueDateColor } = require("../../../utils/helpers/dueDateColor");
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

/* ─── StatusChangedBanner ────────────────────────────────────────── */
function StatusChangedBanner({ countdown }) {
  if (!countdown) return null;
  return (
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
          {countdown}
        </Typography>
      </Box>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
function TransactionForPurchase() {
  // ── Route state ──────────────────────────────────────────────────────────
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
  } = state || {};

  // ── Hooks ────────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const errorTimeoutsRef = useRef({});
  const scrollRef = useRef(null);
  const fetchLatestRef = useRef(null);
  const localUpdateRef = useRef(false);
  const localActionRef = useRef(false);
  const countdownRef = useRef(null);
  const fetchItemsRef = useRef(null);
  // ── State ────────────────────────────────────────────────────────────────
  const [actionModal, setActionModal] = useState(null);
  const [activeTab, setActiveTab] = useState("canvas");
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
  // ── Derived values ───────────────────────────────────────────────────────
  const statusCode = selectedStatusCode;
  const assignedAOName = (() => {
    const u = transaction?.user;
    if (!u) return "—";
    const first = u.strFName ?? "";
    const middle = u.strMName ? u.strMName.charAt(0).toUpperCase() + "." : "";
    const last = u.strLName ?? "";
    return [first, middle, last].filter(Boolean).join(" ").trim() || "—";
  })();
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
    forPurchaseKey.includes(statusCode);

  const checkboxOptionsEnabled =
    !isProcurement &&
    !statusChangedAlert &&
    (forCanvasKey.includes(statusCode) || forPurchaseKey.includes(statusCode));
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

  const abcValue = `₱ ${fmt(transactionHasABC ? transaction.dTotalABC : totalItemsABC)}`;

  const abcSub =
    (itemsManagementKey.includes(statusCode) ||
      itemsVerificationKey.includes(statusCode) ||
      forCanvasKey.includes(statusCode) ||
      canvasVerificationKey.includes(statusCode)) &&
    transactionHasABC &&
    totalItemsABC > 0
      ? `Items ₱${fmt(totalItemsABC)}`
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
          (!isPurchaseIncluded && Number(o.bIncluded) === 1);

        if (isPurchaseIncluded) {
          const qty = Number(o.nQuantity || 0);
          const step = getOptionStep(optStatus, o, keys);
          numerator += qty * step;
          denominator += qty * 5;
        }

        if (isIncluded) {
          const isPaidOrDone =
            optStatus != null &&
            [paidKey, receivedKey, deliveredKey]
              .map(String)
              .includes(String(optStatus));
          if (!isPaidOrDone)
            unpaidTotal += Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0);
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

  // ── ABC validation ───────────────────────────────────────────────────────
  const abcValidation = useMemo(() => {
    if (itemsManagementKey.includes(statusCode)) {
      if (transactionHasABC && totalItemsABC > 0) {
        if (totalItemsABC > Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmt(totalItemsABC)}) exceeds Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
        if (totalItemsABC < Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmt(totalItemsABC)}) must equal Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
      }
      if (!transactionHasABC) {
        const missing = items.filter((i) => !i.abc || Number(i.abc) === 0);
        if (missing.length)
          return `All items must have an ABC value. Missing: ${missing.map((i) => `"${i.name}"`).join(", ")}`;
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
      if (anyItemHasABC && overItems.length)
        return `The following item(s) have canvas totals exceeding their ABC: ${overItems.map((i) => `"${i.name}"`).join(", ")}. Please adjust the included purchase options.`;
      if (totalItemsABC > Number(transaction.dTotalABC))
        return `Items ABC total (₱${fmt(totalItemsABC)}) must not exceed Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
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

  // ── Callbacks ────────────────────────────────────────────────────────────
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

  // ── Data fetchers ────────────────────────────────────────────────────────
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
      const res = await api.get("suppliers/all");
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
        const res = await api.post("purchase-item-histories/latest", {
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
      const res = await api.get(
        `purchase-item-histories/option/${nPurchaseOptionId}/all`,
      );
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
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );
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
          api
            .post("purchase-item-histories/latest", { nPurchaseOptionId: ids })
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

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    if (procNonCanvasStatus) {
      setItemsLoading(false);
      return;
    }
    Promise.all([fetchSuppliers(), fetchItems()]);
  }, [transaction]);

  useEffect(() => {
    fetchLatestRef.current = fetchLatestPurchaseItemHistories;
  }, [fetchLatestPurchaseItemHistories]);

  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    const po = echo.channel("purchase-orders");
    const opt = echo.channel("purchase-order-options");
    po.listen(".purchase-order.updated", () => fetchItemsRef.current());
    opt.listen(".purchase-order-option.updated", () => fetchItemsRef.current());
    return () => {
      echo.leaveChannel("purchase-orders");
      echo.leaveChannel("purchase-order-options");
    };
  }, [transaction?.nTransactionId]);

  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    const ch = echo.channel(`transaction.${transaction.nTransactionId}.items`);
    ch.listen(".item.updated", (e) => {
      if (e.action === "deleted") {
        setItems((p) => p.filter((i) => i.id !== e.itemId));
        return;
      }
      fetchItems({ restoreScroll: true });
    });
    ch.listen(".option.updated", (e) => {
      if (localUpdateRef.current) return;
      if (e.action === "deleted") {
        setItems((p) =>
          p.map((item) =>
            item.id === e.itemId
              ? {
                  ...item,
                  purchaseOptions: item.purchaseOptions.filter(
                    (o) => o.id !== e.optionId,
                  ),
                }
              : item,
          ),
        );
        return;
      }
      fetchItems({ restoreScroll: true });
    });
    const sup = echo.channel("suppliers");
    sup.listen(".supplier.updated", () => fetchSuppliers(true));
    const txn = echo.channel("transactions");
    txn.listen(".transaction.updated", (e) => {
      if (String(e.transactionId) !== String(transaction.nTransactionId))
        return;
      if (localActionRef.current) return;
      const statusChangingActions = [
        "status_changed",
        "assigned",
        "reverted",
        "verified",
        "finalized",
      ];
      if (!statusChangingActions.includes(e.action)) return;
      const newStatus = e.transaction?.latest_history?.nStatus;
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
    fetchItemsRef.current = () => fetchItems({ restoreScroll: true });
  });

  // Add this new useEffect alongside your other effects
  useEffect(() => {
    if (!transaction?.nTransactionId) return;
    const handler = () => fetchItemsRef.current();
    window.addEventListener("cart_data_updated", handler);
    window.addEventListener("inventory_data_updated", handler);
    return () => {
      window.removeEventListener("cart_data_updated", handler);
      window.removeEventListener("inventory_data_updated", handler);
    };
  }, [transaction?.nTransactionId]);
  // ── Handlers ─────────────────────────────────────────────────────────────
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
      await api.put(`purchase-options/${optionId}`, {
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
          // ── sum of all deliveredRows across all delivered options ──
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
  // ── Early exit ───────────────────────────────────────────────────────────
  if (!transaction) return null;

  // ── Shared props for TransactionDetails ─────────────────────────────────
  const txnDetailsProps = {
    details: transaction,
    statusTransaction,
    itemType,
    procMode,
    procSourceLabel,
  };
  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <PageLayout
      title="Transaction"
      subtitle={`/ ${currentStatusLabel || ""} / ${transactionCode || ""}`}
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
            {[
              ["info", "Information"],
              ["canvas", "For Purchase"],
            ].map(([tab, label], i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "3px 10px",
                  background: activeTab === tab ? "#1565c0" : "#fff",
                  color: activeTab === tab ? "#fff" : "#64748b",
                  border: "none",
                  borderRight: i === 0 ? "1px solid #cbd5e1" : "none",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null
      }
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => navigate(-1)}
            actionColor="back"
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* {showRevert && (
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
            )} */}
            {forPurchaseKey.includes(statusCode) && (
              <>
                <BaseButton
                  label="Delivery Info"
                  icon={<LocalShippingOutlinedIcon />}
                  onClick={() => setDeliveryModalOpen(true)}
                  actionColor="info"
                  disabled={statusChangedAlert}
                />
                <BaseButton
                  label="Print Delivery Receipt"
                  icon={<PrintOutlined />}
                  onClick={() => setConfirmDrPrint(true)}
                  actionColor="default"
                  disabled={statusChangedAlert || deliveredOptions.length === 0}
                  tooltip={
                    deliveredOptions.length === 0
                      ? "No delivered items yet"
                      : ""
                  }
                />
              </>
            )}
          </Box>
        </Box>
      }
    >
      <Box>
        <StatusChangedBanner countdown={countdown} />

        {limitedContent && <TransactionDetails {...txnDetailsProps} />}

        {!limitedContent && (
          <>
            {activeTab === "info" && (
              <TransactionDetails {...txnDetailsProps} />
            )}
            {activeTab === "canvas" && (
              <>
                {!itemsLoading && abcValidation && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {abcValidation}
                  </Alert>
                )}
                {itemsLoading ? (
                  <PurchasePageSkeleton /> // ← now comes from the helper
                ) : (
                  <PurchaseItemsTable
                    // items & ui state
                    items={items}
                    itemsLoading={itemsLoading}
                    expandedRows={expandedRows}
                    expandedOptions={expandedOptions}
                    optionErrors={optionErrors}
                    // permissions
                    crudItemsEnabled={crudItemsEnabled}
                    showAddButton={crudItemsEnabled}
                    showPurchaseOptions={showPurchaseOptions}
                    checkboxOptionsEnabled={checkboxOptionsEnabled}
                    anyItemHasABC={anyItemHasABC}
                    statusChangedAlert={statusChangedAlert}
                    isManagement={isManagement}
                    isAccountOfficer={isAccountOfficer}
                    // suppliers & metadata
                    suppliers={suppliers}
                    cItemType={cItemType}
                    currentStatusLabel={currentStatusLabel}
                    transaction={transaction}
                    transactionCode={transactionCode}
                    currentUserId={currentUserId}
                    // abc / totals
                    abcValue={abcValue}
                    abcSub={abcSub}
                    abcValidation={abcValidation}
                    totalCanvas={totalCanvas}
                    totalABC={totalABC}
                    totalPurchaseProgress={totalPurchaseProgress}
                    totalPurchaseBalance={totalPurchaseBalance}
                    // purchase status keys
                    cancelPoKey={cancelPoKey}
                    removedFromCartKey={removedFromCartKey}
                    addToCartKey={addToCartKey}
                    purchaseOrderKey={purchaseOrderKey}
                    paidKey={paidKey}
                    receivedKey={receivedKey}
                    deliveredKey={deliveredKey}
                    openCartKey={openCartKey}
                    closeCartKey={closeCartKey}
                    cancelCartKey={cancelCartKey}
                    closePoKey={closePoKey}
                    forCanvasKey={forCanvasKey}
                    // option histories
                    optionStatuses={optionStatuses}
                    latestHistories={latestHistories}
                    optionAllHistories={optionAllHistories}
                    optionCartStatuses={optionCartStatuses}
                    // callbacks
                    getEffectiveABC={getEffectiveABC}
                    handleCollapseAllToggle={handleCollapseAllToggle}
                    toggleSpecsRow={toggleSpecsRow}
                    toggleOptionsRow={toggleOptionsRow}
                    toggleOptionSpecs={toggleOptionSpecs}
                    handleToggleInclude={handleToggleInclude}
                    setEditingItem={setEditingItem}
                    setAddingNewItem={setAddingNewItem}
                    setEntityToDelete={setEntityToDelete}
                    setSuggestionsItem={setSuggestionsItem}
                    setIsSuggestionsModalOpen={setIsSuggestionsModalOpen}
                    setEditingOption={setEditingOption}
                    setOptionModalItemId={setOptionModalItemId}
                    setOptionModalItem={setOptionModalItem}
                    setExpandedRows={setExpandedRows}
                    onRefreshOptionData={fetchLatestPurchaseItemHistories}
                    onFetchAllOptionHistory={fetchAllOptionHistory}
                    // helpers
                    fmtDateTime={fmtDateTime}
                    getDueDateVariant={getDueDateVariant}
                  />
                )}
              </>
            )}
          </>
        )}
      </Box>

      <DeleteVerificationModal
        open={entityToDelete !== null}
        entityToDelete={entityToDelete}
        onClose={() => setEntityToDelete(null)}
        onSuccess={() => fetchItems({ restoreScroll: true })}
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
        isForPurchase={true}
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
      <UpdateDeliveryInfoModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        transaction={transaction}
        isProcurement={isProcurement}
        isManagement={isManagement}
        onSuccess={() => setDeliveryModalOpen(false)}
      />
      <PrintDeliveryReceiptModal
        open={confirmDrPrint}
        onClose={() => setConfirmDrPrint(false)}
        transaction={transaction}
        deliveredOptions={deliveredOptions}
        assignedAOName={assignedAOName}
        transactionCode={transactionCode}
      />
    </PageLayout>
  );
}

export default TransactionForPurchase;
