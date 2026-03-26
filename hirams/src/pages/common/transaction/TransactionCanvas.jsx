import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../../components/common/PageLayout";
import api from "../../../utils/api/api";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Edit,
  Delete,
  ExpandLess,
  ExpandMore,
  Add,
  AutoAwesome,
  ArrowBack,
  Replay,
  CheckCircle,
  DoneAll,
  AssignmentInd,
  Business,
  Inventory2Outlined,
  FileDownload, // ← add this
  MonetizationOnOutlined,
  ReceiptLongOutlined,
  EventOutlined,
  CalendarTodayOutlined,
  ListAlt,
} from "@mui/icons-material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BaseButton from "../../../components/common/BaseButton";
import DataTable from "../../../components/common/DataTable";
import InfoDialog from "../../../components/common/InfoDialog";
import DotSpinner from "../../../components/common/DotSpinner";
import PurchaseOptionRow from "./components/PurchaseOptionsRow";
import TransactionDetails from "../../../components/common/TransactionDetails";
import AssignAOModal from "./modal/transaction-canvas/AssignAOModal";
import NewItemModal from "./modal/transaction-canvas/NewItemModal";
import NewOptionModal from "./modal/transaction-canvas/NewOptionModal";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import TransactionActionModal from "../modal/TransactionActionModal";
import ExportCanvasModal from "./modal/transaction-canvas/ExportCanvasModal";
import GetSuggestionsModal from "./modal/transaction-canvas/GetSuggestionsModal";
import CompareView from "./components/CompareView";
import uiMessages from "../../../utils/helpers/uiMessages";
import AlertDialog from "../../../components/common/AlertDialog";
import { getDueDateColor } from "../../../utils/helpers/dueDateColor";

const getDueDateVariant = (dateStr) => {
  const color = getDueDateColor(dateStr);
  if (color === "red") return "danger";
  if (color === "orange") return "warn";
  return "default";
};
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
/* ─── Drag-and-drop row wrapper ─────────────────────────────────── */
const SortableWrapper = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: disabled ? "default" : "grab",
      }}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
    >
      {children}
    </div>
  );
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
const STAT_STYLES = {
  default: {
    border: "rgba(3,105,161,0.15)",
    label: "#0369a1",
    value: "#0c4a6e",
    sub: "#0369a1",
  },
  warn: {
    border: "rgba(251,191,36,0.4)",
    label: "#b45309",
    value: "#92400e",
    sub: "#b45309",
  },
  danger: {
    border: "rgba(239,68,68,0.4)",
    label: "#dc2626",
    value: "#991b1b",
    sub: "#dc2626",
  },
  info: {
    border: "rgba(20,184,166,0.3)",
    label: "#0f766e",
    value: "#0f766e",
    sub: "#0f766e",
  },
};
const StatCard = ({ icon, label, value, sub, variant = "default" }) => {
  const s = STAT_STYLES[variant] ?? STAT_STYLES.default;
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "rgba(255,255,255,0.55)",
        border: `0.5px solid ${s.border}`,
        borderRadius: "7px",
        px: 1.25,
        py: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      {/* Label row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        {React.cloneElement(icon, { sx: { fontSize: 12, color: s.label } })}
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 500,
            color: s.label,
            letterSpacing: "0.03em",
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Value */}
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: s.value,
          lineHeight: 1.2,
          textAlign: "left",
          ml: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        {value || "—"}
      </Typography>

      {/* Sub */}
      {sub && (
        <Typography
          sx={{
            fontSize: "0.65rem",
            color: s.sub,
            opacity: 0.85,
            lineHeight: 1,
            textAlign: "left",
            ml: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          {sub}
        </Typography>
      )}

      {/* Watermark */}
      <Box
        sx={{
          position: "absolute",
          right: -6,
          bottom: -6,
          width: 54,
          height: 54,
          opacity: 0.09,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 84, color: s.label } })}
      </Box>
    </Box>
  );
};
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
  } = state || {};

  const navigate = useNavigate();
  const errorTimeoutsRef = useRef({});
  const scrollRef = useRef(null); // ← ADD
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
  const [statusChangedAlert, setStatusChangedAlert] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const localUpdateRef = useRef(false);
  const localActionRef = useRef(false);
  const statusCode = selectedStatusCode;
  const statusChangedTooltip = statusChangedAlert
    ? "This transaction has been moved to a different status by another user. All actions are disabled."
    : "";
  const isTransactionOwner =
    currentUserId && transaction?.created_by_id
      ? String(currentUserId) === String(transaction.created_by_id)
      : false;
  const procNonCanvasStatus =
    (isProcurement || isManagement) &&
    (draftKey.includes(statusCode) ||
      finalizeKey?.includes(statusCode) ||
      finalizeVerificationKey?.includes(statusCode));
  /* ── Visibility flags ── */
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
  const coloredItemRowEnabled = showPurchaseOptions;
  const isCanvasStatus =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const isItemsManagementStatus =
    itemsManagementKey.includes(selectedStatusCode);

  // AFTER
  const showVerify =
    !isCompareActive &&
    (itemsVerificationKey?.includes(statusCode) ||
      canvasVerificationKey?.includes(statusCode) ||
      (finalizeKey?.includes(statusCode) && isManagement) ||
      (isProcurement &&
        (finalizeVerificationKey?.includes(statusCode) ||
          priceFinalizeVerificationKey?.includes(statusCode))));
  // AFTER
  const showFinalize =
    (isProcurement &&
      (itemsManagementKey.includes(statusCode) ||
        draftKey.includes(statusCode))) ||
    // Management Finalize: draft or priceSetting, only if they CREATED the transaction
    (isManagement &&
      (draftKey.includes(statusCode) || priceSettingKey.includes(statusCode)) &&
      isTransactionOwner) ||
    (isAccountOfficer && forCanvasKey.includes(statusCode) && !isCompareActive);
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
      // forAssignment status: only show revert if NO AO assigned yet
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
      // Scenario 1: Has transaction ABC, items have ABC per item → sum must equal transaction ABC
      if (transactionHasABC && totalItemsABC > 0) {
        if (totalItemsABC > Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmt(totalItemsABC)}) exceeds Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
        if (totalItemsABC < Number(transaction.dTotalABC))
          return `Items ABC total (₱${fmt(totalItemsABC)}) must equal Transaction ABC (₱${fmt(transaction.dTotalABC)})`;
      }

      // Scenario 2: No transaction ABC → every item must have ABC
      if (!transactionHasABC) {
        const missingABC = items.filter((i) => !i.abc || Number(i.abc) === 0);
        if (missingABC.length > 0)
          return `All items must have an ABC value. Missing: ${missingABC.map((i) => `"${i.name}"`).join(", ")}`;
      }

      // Scenario 3: Has transaction ABC, no items have ABC → valid, no restriction
      // (totalItemsABC === 0 && transactionHasABC) → allow finalize freely
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

    // Items management status
    if (items.length === 0 || itemsLoading) return true;
    if (Boolean(abcValidation)) return true;

    // Scenario 1: Has txn ABC + items have ABC → total must equal txn ABC
    if (transactionHasABC && totalItemsABC > 0)
      return totalItemsABC !== Number(transaction.dTotalABC);

    // Scenario 2: No txn ABC → all items must have ABC
    if (!transactionHasABC)
      return items.some((i) => !i.abc || Number(i.abc) === 0);

    // Scenario 3: Has txn ABC + no item ABC → allow finalize freely
    return false;
  })();
  // shared helper — derive the finalize block reason
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
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

    // Save scroll BEFORE setItemsLoading (overflow still intact at this point)
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
        // Double rAF: wait for React commit + browser paint
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
    // Use cache on first paint; fetchAOs busts it on every explicit call
    const cached = sessionStorage.getItem("ao_cache");
    if (cached) {
      setAccountOfficers(JSON.parse(cached));
    } else {
      fetchAOs();
    }
  }, [userTypes, fetchAOs]);
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
    suppliersChannel.listen(".supplier.updated", () => {
      fetchSuppliers(true);
    });

    // ── Status change detection ──────────────────────────────
    const txnChannel = echo.channel("transactions");
    txnChannel.listen(".transaction.updated", (event) => {
      if (event.transactionId !== transaction.nTransactionId) return;
      if (localActionRef.current) return; // we triggered this, ignore it

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
      if (event.action === "status_changed") {
        fetchAOs();
        return;
      }
      fetchAOs();
    });

    return () => {
      echo.leaveChannel("users");
    };
  }, [fetchAOs]);
  /* ── Merged specs updater ── */
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
  const toggleOptionsRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: { specs: prev[id]?.specs || false, options: !prev[id]?.options },
    }));
  };
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

    // Block check if adding this option's qty would exceed item qty
    // Add-ons are exempt — they're supplementary and not counted against item qty
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

    localUpdateRef.current = true; // mark local update

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
    setExpandedRows((prev) => ({
      ...prev,
      [itemId]: { specs: prev[itemId]?.specs || false, options: true },
    }));
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

  const descXs = showPurchaseOptions
    ? anyItemHasABC
      ? 3
      : 7
    : anyItemHasABC
      ? 5
      : 8;
  const qtyXs =
    crudItemsEnabled && !showPurchaseOptions ? 3 : showPurchaseOptions ? 2 : 4;

  const canvasColumns = [
    {
      key: "desc",
      label: "Description",
      xs: descXs,
      headerAlign: "center",
      cellSxExtra: { pl: 1.5 },
      render: (item) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            minWidth: 0,
          }}
        >
          <Inventory2OutlinedIcon
            sx={{ fontSize: "1rem", color: "text.secondary", flexShrink: 0 }}
          />
          <Typography
            fontWeight={500}
            sx={{
              fontSize: ".75rem",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ml: 1,
              flexGrow: 1,
            }}
          >
            <Box component="span" sx={{ fontWeight: 600 }}>
              {item.nItemNumber}.
            </Box>{" "}
            {item.name || "—"}
          </Typography>
          <Tooltip title="Specs" arrow>
            <IconButton
              size="small"
              sx={{ flexShrink: 0, mr: 3 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleSpecsRow(item.id);
              }}
            >
              <ArrowDropDownIcon
                sx={{
                  transform: expandedRows[item.id]?.specs
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  fontSize: "1.2rem",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      key: "qty",
      label: "Quantity",
      xs: qtyXs,
      align: "center",
      render: (item) => {
        const includedQty = item.purchaseOptions
          .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
          .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
        const isFilled =
          showPurchaseOptions &&
          Number(includedQty) === Number(item.qty || 0) &&
          Number(item.qty) > 0;
        return (
          <Typography
            sx={{
              fontSize: ".7rem",
              lineHeight: 1.3,
              textAlign: "center",
              width: "100%",
              color: isFilled ? "#15803d" : "inherit",
              fontWeight: isFilled ? 700 : 400,
            }}
          >
            {showPurchaseOptions && `${includedQty} / `}
            {item.qty}
            <br />
            <span
              style={{
                fontSize: "0.65rem",
                color: isFilled ? "#15803d" : "#94A3B8",
              }}
            >
              {item.uom}
            </span>
          </Typography>
        );
      },
    },
    ...(showPurchaseOptions
      ? [
          {
            key: "canvas",
            label: "Canvas",
            xs: 2,
            align: "right",
            render: (item) => {
              const tot = item.purchaseOptions
                .filter((o) => o.bIncluded)
                .reduce(
                  (s, o) =>
                    s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
                  0,
                );
              return (
                <Typography sx={{ fontSize: ".7rem", lineHeight: 1.2 }}>
                  ₱ {fmt(tot)}
                </Typography>
              );
            },
          },
        ]
      : []),
    ...(anyItemHasABC
      ? [
          {
            key: "abc",
            label: "ABC",
            xs: showPurchaseOptions ? 2 : 3,
            align: "right",
            render: (item) => {
              const tot = item.purchaseOptions
                .filter((o) => o.bIncluded)
                .reduce(
                  (s, o) =>
                    s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
                  0,
                );
              const effectiveABC = getEffectiveABC(item);
              const isOver = tot > effectiveABC && effectiveABC > 0;
              return (
                <Typography
                  sx={{
                    fontSize: ".7rem",
                    lineHeight: 1.2,
                    color: isOver ? "#dc2626" : "inherit",
                    fontWeight: isOver ? 700 : 400,
                  }}
                >
                  ₱ {fmt(item.abc)}
                </Typography>
              );
            },
          },
        ]
      : []),
    ...(showPurchaseOptions && anyItemHasABC
      ? [
          {
            key: "balance",
            label: "Balance",
            xs: 2,
            align: "right",
            render: (item) => {
              const tot = item.purchaseOptions
                .filter((o) => o.bIncluded)
                .reduce(
                  (s, o) =>
                    s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
                  0,
                );
              const balance = getEffectiveABC(item) - tot;
              const isNegative = balance < 0;
              return (
                <Typography
                  sx={{
                    fontSize: ".7rem",
                    lineHeight: 1.2,
                    color: isNegative ? "#dc2626" : "inherit",
                    fontWeight: isNegative ? 700 : 400,
                  }}
                >
                  ₱ {fmt(balance)}
                </Typography>
              );
            },
          },
        ]
      : []),
    ...(crudItemsEnabled || showPurchaseOptions
      ? [
          {
            key: "action",
            label: "Action",
            xs: 1,
            align: "center",
            hideBorder: true,
            render: (item) => (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                {isManagement && (
                  <>
                    <BaseButton
                      icon={<Edit sx={{ fontSize: "0.9rem" }} />}
                      tooltip="Edit"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                        setAddingNewItem(true);
                      }}
                      disabled={statusChangedAlert}
                    />
                    {crudItemsEnabled && (
                    <BaseButton
                      icon={<Delete sx={{ fontSize: "0.9rem" }} />}
                      tooltip="Delete"
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntityToDelete({ type: "item", data: item });
                      }}
                      disabled={statusChangedAlert}
                    />
                         )}
                  </>
                )}
                {showPurchaseOptions && (
                  <IconButton
                    size="small"
                    sx={{ position: "relative" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOptionsRow(item.id);
                    }}
                  >
                    <ArrowDropDownIcon
                      sx={{
                        transform: expandedRows[item.id]?.options
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s",
                        fontSize: "1.4rem",
                      }}
                    />
                    {item.purchaseOptions.length > 0 &&
                      !expandedRows[item.id]?.options && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: "1px",
                            right: "-3px",
                            backgroundColor: "#d9ecff",
                            color: "#1976d2",
                            width: "14px",
                            height: "14px",
                            fontSize: "0.50rem",
                            borderRadius: "50%",
                            border: "1px solid #90caf9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 2,
                            fontWeight: 600,
                          }}
                        >
                          {item.purchaseOptions.length}
                        </Box>
                      )}
                  </IconButton>
                )}
              </Box>
            ),
          },
        ]
      : []),
  ];
  const getRowSx = (item) => {
    return {
      borderLeft: "4px solid #1565c0",
      "&:hover": { background: "#FAFBFF" },
    };
  };
  const wrapRow = (item, rowIndex, paperNode, isLastRow) => {
    const isSpecsOpen = !!expandedRows[item.id]?.specs;
    const isOptionsOpen = !!expandedRows[item.id]?.options;
    const isExpanded = isSpecsOpen || isOptionsOpen;
    const prevItem = rowIndex > 0 ? items[rowIndex - 1] : null;
    const prevExpanded = prevItem
      ? !!(
          expandedRows[prevItem.id]?.specs || expandedRows[prevItem.id]?.options
        )
      : false;

    return (
      <SortableWrapper id={item.id} disabled={!crudItemsEnabled || isSpecsOpen}>
        <Box
          sx={{
            ...(prevExpanded && {
              mt: 0.5,
              "& > .MuiPaper-root": {
                borderTop: "2px solid #94A3B8 !important",
              },
            }),
            ...(isLastRow && !isExpanded
              ? {
                  "& > .MuiPaper-root": {
                    borderBottomLeftRadius: "10px !important",
                    borderBottomRightRadius: "10px !important",
                  },
                }
              : isLastRow && isExpanded
                ? {
                    "& > .MuiPaper-root": {
                      borderBottomLeftRadius: "0px !important",
                      borderBottomRightRadius: "0px !important",
                    },
                  }
                : undefined),
          }}
        >
          {paperNode}
        </Box>

        {/* ── Specs panel ── */}
        {isSpecsOpen && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #DDE3EE",
              borderTop: "none",
              borderLeft: "4px solid #1e88e5",
              background: "#f3f8ff",
              overflow: "hidden",
              borderRadius: 0,
              ...(isLastRow &&
                !isOptionsOpen && {
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "10px",
                }),
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: "#e1efff",
                borderBottom: "1px solid #c7dcf5",
                color: "#1e88e5",
                fontWeight: 400,
                fontSize: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => toggleSpecsRow(item.id)}
            >
              <span>Specifications:</span>
              <button
                style={{
                  ...inlineBtnSx("#f7fbff"),
                  fontSize: "0.6rem",
                  padding: "1px 8px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSpecsRow(item.id);
                }}
              >
                Hide <ExpandLess fontSize="small" />
              </button>
            </Box>
            <Box
              sx={{
                px: 2,
                py: 1,
                maxHeight: 150,
                overflowY: "auto",
                backgroundColor: "#ADD8E65A",
                color: "text.secondary",
                fontSize: "0.8rem",
                "& *": { backgroundColor: "transparent !important" },
                "& ul": { paddingLeft: 2, margin: 0, listStyleType: "disc" },
                "& ol": { paddingLeft: 2, margin: 0, listStyleType: "decimal" },
                "& li": { marginBottom: 0.25 },
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{
                __html: item.specs || "No data available.",
              }}
            />
          </Paper>
        )}

        {/* ── Purchase Options panel ── */}
        {isOptionsOpen && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #DDE3EE",
              borderTop: "none",
              borderLeft: "4px solid #90caf9",
              background: "#fafbfd",
              overflow: "hidden",
              borderRadius: 0,
              ...(isLastRow && {
                borderBottomLeftRadius: "10px",
                borderBottomRightRadius: "10px",
              }),
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: "#eef4fb",
                borderBottom: "1px solid #d6e2f0",
                color: "#1565c0",
                fontSize: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => toggleOptionsRow(item.id)}
            >
              <span>Purchase Options</span>
              <Box sx={{ display: "flex", gap: 1 }}>
                {checkboxOptionsEnabled &&
                  !statusChangedAlert &&
                  (() => {
                    const includedQty = item.purchaseOptions
                      .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
                      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
                    const remainingQty = Number(item.qty || 0) - includedQty;
                    const isFilled = remainingQty <= 0;
                    return (
                      <>
                        <button
                          style={inlineBtnSx()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSuggestionsItem(item);
                            setIsSuggestionsModalOpen(true);
                          }}
                        >
                          <AutoAwesome fontSize="small" /> Get Suggestions
                        </button>
                        <button
                          style={inlineBtnSx()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOption(null);
                            setOptionModalItemId(item.id);
                            setOptionModalItem({ ...item, remainingQty });
                          }}
                        >
                          <Add fontSize="small" /> Option
                        </button>
                      </>
                    )
                  })()}
                <button
                  style={inlineBtnSx("#f7fbff")}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOptionsRow(item.id);
                  }}
                >
                  Hide <ExpandLess fontSize="small" />
                </button>
              </Box>
            </Box>
            <Box
              sx={{
                px: 1.2,
                py: 0.7,
                display: "flex",
                background: "#f3f3f3",
                fontSize: "0.72rem",
                borderBottom: "1px solid #ddd",
                fontWeight: 600,
                color: "#555",
              }}
            >
              {[
                "Supplier",
                "Brand | Model",
                "Quantity",
                "Unit Price",
                "EWT",
                "Total",
              ].map((h, i) => (
                <Box
                  key={h}
                  sx={{
                    flex: [2.5, 2, 1, 1.5, 1.5, 1.5][i],
                    textAlign: "center",
                  }}
                >
                  {h}
                </Box>
              ))}
              {checkboxOptionsEnabled && (
                <Box sx={{ flex: 1, textAlign: "center" }}>Action</Box>
              )}
            </Box>

            {item.optionsLoading ? (
              <Box
                sx={{
                  py: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <DotSpinner size={6} />
              </Box>
            ) : item.purchaseOptions.length === 0 ? (
              <Box
                sx={{
                  py: 1,
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                No options available.
              </Box>
            ) : (
              item.purchaseOptions.map((option, index) => {
                const hasNoRegularOptions = item.purchaseOptions.every(
                  (o) => Number(o.bAddOn) === 1,
                );
                const isFirstAddOn =
                  Number(option.bAddOn) === 1 &&
                  (index === 0 ||
                    Number(item.purchaseOptions[index - 1].bAddOn) !== 1);
                const displayIndex =
                  Number(option.bAddOn) === 1
                    ? item.purchaseOptions
                        .slice(0, index)
                        .filter((o) => Number(o.bAddOn) === 1).length + 1
                    : item.purchaseOptions
                        .slice(0, index)
                        .filter((o) => Number(o.bAddOn) !== 1).length + 1;
                return (
                  <PurchaseOptionRow
                    key={option.id}
                    option={option}
                    index={index}
                    displayIndex={displayIndex}
                    isLastOption={index === item.purchaseOptions.length - 1}
                    itemId={item.id}
                    item={item}
                    checkboxOptionsEnabled={checkboxOptionsEnabled}
                    expandedOptions={expandedOptions}
                    optionErrors={optionErrors}
                    onToggleInclude={handleToggleInclude}
                    onToggleOptionSpecs={toggleOptionSpecs}
                    onEditOption={(opt) => {
                      setEditingOption(opt);
                      setOptionModalItemId(opt.nTransactionItemId);
                    }}
                    onDeleteOption={(_id, opt) =>
                      setEntityToDelete({ type: "option", data: opt })
                    }
                    onCompareClick={handleCompareClick}
                    isManagement={isManagement}
                    isFirstAddOn={isFirstAddOn}
                    hasNoRegularOptions={hasNoRegularOptions}
                    statusChangedAlert={statusChangedAlert}
                  />
                );
              })
            )}
          </Paper>
        )}
      </SortableWrapper>
    );
  };
  /* ── Derived for info card ── */
  const isAnythingExpanded = Object.values(expandedRows).some(
    (r) => r?.specs || r?.options,
  );
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

  return (
    <PageLayout
      title="Transaction"
      subtitle={`/ ${currentStatusLabel || ""} / ${transactionCode}`}
      loading={itemsLoading}
      scrollRef={scrollRef}
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
          </Box>
        </Box>
      }
    >
      <Box>
        {limitedContent && (
          <>
            {statusChangedAlert && (
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
                    sx={{
                      fontSize: "0.65rem",
                      color: "#92400E",
                      fontWeight: 600,
                    }}
                  >
                    Status update detected — this transaction has been moved to
                    a different status. All actions are disabled. Redirecting
                    you back shortly.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                  }}
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
            )}

            <TransactionDetails
              details={transaction}
              statusTransaction={statusTransaction}
              itemType={itemType}
              procMode={procMode}
              procSourceLabel={procSourceLabel}
            />
          </>
        )}
        {/* ── Full view ── */}
        {!limitedContent && (
          <>
            {!isCompareActive && (
              <InfoDialog p={1.5} mb={1}>
                <Box sx={{ overflowX: "auto" }}>
                  <Box sx={{ minWidth: "520px" }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        mb: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          background: "#0369a1",
                          borderRadius: "7px",
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Business sx={{ color: "white", fontSize: "1rem" }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.2,
                          }}
                        >
                          <Box
                            sx={{
                              fontSize: "0.65rem",
                              background: "#bae6fd",
                              color: "#0c4a6e",
                              border: "0.5px solid #7dd3fc",
                              borderRadius: "5px",
                              px: 1,
                              py: 0.3,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            #{" "}
                            {transaction.strCode ||
                              transaction.transactionId ||
                              "—"}
                          </Box>
                        </Box>
                        <Typography
                          sx={{
                            textAlign: "left",
                            fontSize: "0.7rem",
                            fontStyle: "italic",
                            color: "#0369a1",
                            lineHeight: 1.25,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              fontStyle: "normal",
                              color: "#0c4a6e",
                            }}
                          >
                            {transaction.clientName || "—"}
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              mx: 0.5,
                              color: "#7dd3fc",
                              fontStyle: "normal",
                            }}
                          >
                            :
                          </Box>
                          {transaction.strTitle ||
                            transaction.transactionName ||
                            "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Stat cards */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: showPurchaseOptions
                          ? "repeat(4, minmax(0,1fr))"
                          : "repeat(3, minmax(0,1fr))",
                        gap: "8px",
                      }}
                    >
                      <StatCard
                        icon={<MonetizationOnOutlined />}
                        label={
                          transactionHasABC
                            ? "Transaction ABC"
                            : "Total ABC (per item)"
                        }
                        value={abcValue}
                        sub={abcSub}
                        variant={abcValidation ? "danger" : "info"}
                      />
                      {showPurchaseOptions && (
                        <StatCard
                          icon={<ReceiptLongOutlined />}
                          label="Total Canvas"
                          value={`₱ ${fmt(totalCanvas)}`}
                          sub={
                            transactionHasABC ||
                            items.some((i) => Number(i.abc) > 0)
                              ? `Balance: ₱ ${fmt(totalABC - totalCanvas)}`
                              : null
                          }
                          variant={abcValidation ? "danger" : "info"}
                        />
                      )}
                      <StatCard
                        icon={<EventOutlined />}
                        label="AO Due Date"
                        value={
                          transaction.dtAODueDate
                            ? fmtDate(transaction.dtAODueDate)
                            : "—"
                        }
                        sub={
                          transaction.dtAODueDate
                            ? fmtTime(transaction.dtAODueDate)
                            : null
                        }
                        variant={getDueDateVariant(transaction.dtAODueDate)}
                      />
                      <StatCard
                        icon={<CalendarTodayOutlined />}
                        label="Document Submission"
                        value={
                          transaction.dtDocSubmission
                            ? fmtDate(transaction.dtDocSubmission)
                            : "No Date Attached."
                        }
                        sub={
                          transaction.dtDocSubmission
                            ? fmtTime(transaction.dtDocSubmission)
                            : "No Time Attached."
                        }
                        variant={getDueDateVariant(transaction.dtDocSubmission)}
                      />
                    </Box>
                  </Box>
                </Box>
              </InfoDialog>
            )}
            {statusChangedAlert && (
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
                    sx={{
                      fontSize: "0.65rem",
                      color: "#92400E",
                      fontWeight: 600,
                    }}
                  >
                    Status update detected — this transaction has been moved to
                    a different status. All actions are disabled. Redirecting
                    you back shortly.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                  }}
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
            )}
            {/* ── Validation alert (single) ── */}
            {!isCompareActive && abcValidation && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {abcValidation}
              </Alert>
            )}
            {/* ── Toolbar ── */}
            {!isCompareActive && (
              <Box
                sx={{
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <ListAlt sx={{ fontSize: "1rem" }} />
                  Transaction Items
                  {showPurchaseOptions && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.65rem",
                        background: "#bae6fd",
                        color: "#0c4a6e",
                        border: "0.5px solid #7dd3fc",
                        borderRadius: "5px",
                        px: 1,
                        py: 0.1,
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      PROGRESS:{" "}
                      {
                        items.filter((item) => {
                          const includedQty = item.purchaseOptions
                            .filter(
                              (o) => o.bIncluded && Number(o.bAddOn) !== 1,
                            )
                            .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
                          return (
                            Number(includedQty) === Number(item.qty || 0) &&
                            Number(item.qty) > 0
                          );
                        }).length
                      }
                      /{items.length}
                    </Box>
                  )}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {showAddButton && !statusChangedAlert && (
                    <>
                      <button
                        style={inlineBtnSx()}
                        onClick={() => {
                          setEditingItem(null);
                          setAddingNewItem(true);
                        }}
                      >
                        <Add fontSize="small" />
                        <Box
                          component="span"
                          sx={{ display: { xs: "none", sm: "inline" } }}
                        >
                          Item
                        </Box>
                      </button>
                      <button
                        style={inlineBtnSx()}
                        onClick={() =>
                          navigate("/add-bulk-item", {
                            state: { currentStatusLabel, transaction },
                          })
                        }
                      >
                        <Inventory2Outlined fontSize="small" />
                        <Box
                          component="span"
                          sx={{ display: { xs: "none", sm: "inline" } }}
                        >
                          Add Bulk Item
                        </Box>
                      </button>
                    </>
                  )}
                  <button
                    style={inlineBtnSx("#f7fbff")}
                    onClick={handleCollapseAllToggle}
                  >
                    {isAnythingExpanded ? (
                      <ExpandLess fontSize="small" />
                    ) : (
                      <ExpandMore fontSize="small" />
                    )}
                    <Box
                      component="span"
                      sx={{ display: { xs: "none", sm: "inline" } }}
                    >
                      {isAnythingExpanded ? "Hide all" : "Expand all"}
                    </Box>
                  </button>
                </Box>
              </Box>
            )}
            {!isCompareActive && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={() => setExpandedRows({})}
                onDragEnd={crudItemsEnabled ? handleDragEnd : undefined}
              >
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DataTable
                    minWidth="650px"
                    rows={items}
                    rowKey={(row) => row.id}
                    rowSx={getRowSx}
                    columns={canvasColumns}
                    wrapRow={wrapRow}
                    emptyText="No items available."
                  />
                </SortableContext>
              </DndContext>
            )}
            {isCompareActive && compareData && (
              <CompareView
                compareData={compareData}
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
    </PageLayout>
  );
}

export default TransactionCanvas;
