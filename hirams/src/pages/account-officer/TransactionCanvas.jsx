import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import api from "../../utils/api/api";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Paper,
  Alert,
  Checkbox,
} from "@mui/material";
import {
  Edit,
  Delete,
  ExpandLess,
  ExpandMore,
  Add,
  CompareArrows,
  ArrowBack,
  Replay,
  CheckCircle,
  DoneAll,
  AssignmentInd,
} from "@mui/icons-material";

import BaseButton from "../../components/common/BaseButton";
import PurchaseOptionRow from "./PurchaseOptionRow";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import TransactionDetails from "../../components/common/TransactionDetails";
import AssignAOModal from "../../components/ui/modals/admin/transaction/AssignAOModal";
import NewItemModal from "../../components/ui/modals/account-officer/NewItemModal";
import NewOptionModal from "../../components/ui/modals/account-officer/NewOptionModal";
import DeleteVerificationModal from "../../components/ui/modals/account-officer/DeleteVerificationModal";
import TransactionActionModal from "../../components/ui/modals/account-officer/TransactionActionModal";
import AlertBox from "../../components/common/AlertBox";
import CompareView from "./CompareView";
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
import DotSpinner from "../../components/common/DotSpinner";

const SortableWrapper = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: disabled ? "default" : "grab",
  };

  const dragAttributes = disabled ? {} : attributes;
  const dragListeners = disabled ? {} : listeners;

  return (
    <div ref={setNodeRef} style={style} {...dragAttributes} {...dragListeners}>
      {children}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
function TransactionCanvas() {
  const { state } = useLocation();
  const {
    transactionId,
    transactionCode,
    transaction,
    nUserId,
    selectedStatusCode,
    ao_status,
    itemsManagementKey,
    itemsVerificationKey,
    forCanvasKey,
    canvasFinalizeKey,
    canvasVerificationKey,
    forAssignmentKey,
    procMode,
    itemType,
    procSource,
    vaGoSeValue,
    statusTransaction,
    userTypes,
    isAOTL,
  } = state || {};

  const navigate = useNavigate();
  const errorTimeoutsRef = useRef({});

  // ==================== STATE - UI ====================
  const [actionModal, setActionModal] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});
  const [isCompareActive, setIsCompareActive] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);

  // ==================== STATE - DATA ====================
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [cItemType, setCItemType] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [optionModalItemId, setOptionModalItemId] = useState(null);
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [entityToDelete, setEntityToDelete] = useState(null);

  // ==================== STATE - MODALS ====================
  const [assignMode, setAssignMode] = useState(null);
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [optionErrors, setOptionErrors] = useState({});
  // ==================== STATE - TOAST ====================
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const statusCode = selectedStatusCode;

  // ==================== VISIBILITY FLAGS ====================
  const hasAssignedAO = Number(transaction?.nAssignedAO) > 0;
  const showForAssignment = forAssignmentKey.includes(statusCode) && isAOTL;
  const showVerify =
    (itemsVerificationKey.includes(statusCode) ||
      canvasVerificationKey.includes(statusCode)) &&
    !isCompareActive;
  const showFinalize =
    itemsManagementKey.includes(statusCode) ||
    (forCanvasKey.includes(statusCode) && !isCompareActive);
  // Determine if Revert button should be shown
  const showRevert =
    !isCompareActive &&
    !itemsManagementKey.includes(statusCode) &&
    !forAssignmentKey.includes(statusCode);
  const limitedContent = !hasAssignedAO;
  const showPurchaseOptions =
    forCanvasKey.includes(statusCode) ||
    canvasFinalizeKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const crudItemsEnabled = itemsManagementKey.includes(statusCode);
  const showAddButton = itemsManagementKey.includes(statusCode);
  const checkboxOptionsEnabled = forCanvasKey.includes(statusCode);
  const coloredItemRowEnabled =
    forCanvasKey.includes(statusCode) ||
    canvasFinalizeKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const transactionHasABC =
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;

  const totalItemsABC = items.reduce(
    (sum, item) => sum + Number(item.abc || 0),
    0,
  );
  const isManagement = false;

  const isABCValid = transactionHasABC
    ? totalItemsABC <= Number(transaction.dTotalABC)
    : items.every((item) => item.abc && Number(item.abc) > 0);
  const abcValidationMessage = transactionHasABC
    ? totalItemsABC > Number(transaction.dTotalABC)
      ? `Items ABC total (₱${totalItemsABC.toLocaleString()}) must not exceed Transaction ABC (₱${Number(transaction.dTotalABC).toLocaleString()})`
      : null
    : items.some((item) => !item.abc || Number(item.abc) === 0)
      ? "All items must have ABC values when transaction has no ABC"
      : null;
  // ==================== LABELS ====================
  const forVerificationKey = forCanvasKey || "";
  const canvasVerificationLabel = ao_status[canvasVerificationKey] || "";
  const itemsManagementLabel = ao_status[itemsManagementKey] || "";
  const forCanvasLabel = ao_status[forVerificationKey] || "";
  const procSourceLabel =
    procSource?.[transaction?.cProcSource] || transaction?.cProcSource;
  // ==================== COMPUTED VALUES ====================
  // const isAdding = addingOptionItemId !== null;
  const isItemsManagementStatus =
    itemsManagementKey.includes(selectedStatusCode);

  const totalCanvas = items.reduce((sum, item) => {
    const includedTotal = item.purchaseOptions
      .filter((opt) => opt.bIncluded)
      .reduce(
        (sub, opt) =>
          sub + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
        0,
      );
    return sum + includedTotal;
  }, 0);
  const totalIncludedQty = items.reduce((sum, item) => {
    const includedQty = item.purchaseOptions
      .filter((opt) => opt.bIncluded && Number(opt.bAddOn) !== 1)
      .reduce((sub, opt) => sub + Number(opt.nQuantity || 0), 0);
    return sum + includedQty;
  }, 0);

  const totalItemQty = items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );

  // Check if canvas exceeds ABC at transaction or item level
  const canvasABCValidation = () => {
    if (transactionHasABC) {
      // Transaction has ABC: check if total canvas exceeds transaction ABC
      return {
        isValid: totalCanvas <= Number(transaction.dTotalABC || 0),
        message:
          totalCanvas > Number(transaction.dTotalABC || 0)
            ? `Total Canvas (₱${totalCanvas.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) exceeds Transaction ABC (₱${Number(transaction.dTotalABC).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Please adjust the included purchase options.`
            : null,
      };
    } else {
      // No transaction ABC: check each item's canvas against its ABC
      const itemsOverABC = items.filter((item) => {
        const includedTotal = item.purchaseOptions
          .filter((opt) => opt.bIncluded)
          .reduce(
            (sum, opt) =>
              sum + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
            0,
          );
        return includedTotal > Number(item.abc || 0);
      });

      if (itemsOverABC.length > 0) {
        const itemNames = itemsOverABC
          .map((item) => `"${item.name}"`)
          .join(", ");
        return {
          isValid: false,
          message: `The following item(s) have canvas totals exceeding their ABC: ${itemNames}. Please adjust the included purchase options.`,
        };
      }

      return { isValid: true, message: null };
    }
  };

  const abcValidationResult = canvasABCValidation();
  const isCanvasOverABC = !abcValidationResult.isValid;

  // Update shouldDisableFinalize
  const shouldDisableFinalize = isItemsManagementStatus
    ? itemsLoading || items.length === 0 || !isABCValid
    : itemsLoading ||
      (totalIncludedQty !== totalItemQty && !showAddButton) ||
      isCanvasOverABC;
  // ==================== DRAG & DROP ====================
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // ==================== FETCH FUNCTIONS ====================
  const fetchSuppliers = async () => {
    try {
      const res = await api.get("suppliers/all");
      const options = res.suppliers.map((s) => ({
        label: s.strSupplierNickName || s.strSupplierName,
        value: s.nSupplierId,
        bEWT: s.bEWT,
        bVAT: s.bVAT,
        nickName: s.strSupplierNickName,
      }));
      setSuppliers(options);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;

    setItemsLoading(true);
    try {
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );

      // Initialize items with empty purchaseOptions
      const itemsWithOptions = (res.items || []).map((item) => ({
        ...item,
        purchaseOptions: [],
        optionsLoaded: false,
        optionsLoading: true, // will be fetching options
      }));

      setItems(itemsWithOptions);

      // Fetch purchase options for all items
      await Promise.all(
        itemsWithOptions.map(async (item) => {
          const resOptions = await api.get(
            `transaction-items/${item.id}/purchase-options`,
          );

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    purchaseOptions: resOptions.purchaseOptions || [],
                    optionsLoaded: true,
                    optionsLoading: false,
                  }
                : it,
            ),
          );
        }),
      );

      // Set item type
      const itemTypeKey =
        res.cItemType && typeof res.cItemType === "object"
          ? Object.keys(res.cItemType)[0]
          : res.cItemType;
      setCItemType(itemTypeKey);
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchPurchaseOptions = async (itemId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, optionsLoading: true } : item,
      ),
    );

    try {
      const res = await api.get(`transaction-items/${itemId}/purchase-options`);

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                purchaseOptions: res.purchaseOptions || [],
                optionsLoaded: true,
                optionsLoading: false,
              }
            : item,
        ),
      );
    } catch (err) {
      console.error("Failed to load purchase options:", err);

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, optionsLoading: false } : item,
        ),
      );
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [transaction]);
  useEffect(() => {
    const fetchAOs = async () => {
      try {
        const res = await api.get("users");
        const users = res.users || [];

        // Ensure userTypes exists
        const keys = userTypes ? Object.keys(userTypes) : [];

        // Get the first and sixth keys
        const allowedUserTypes = [keys[0], keys[5]].filter(Boolean);

        const filteredUsers = users.filter((u) =>
          allowedUserTypes.includes(u.cUserType),
        );

        const accountOfficersList = filteredUsers.map((u) => ({
          label: `${u.strFName} ${u.strLName}`,
          value: u.nUserId,
        }));
        setAccountOfficers(accountOfficersList);
      } catch (error) {
        console.error("❌ Error fetching users:", error);
      }
    };

    if (userTypes) {
      fetchAOs();
    }
  }, [userTypes]);

  // ✅ UPDATE handleShowDeleteModal:
  const handleShowDeleteModal = (item) => {
    setEntityToDelete({
      type: "item",
      data: item,
    });
  };

  // ✅ UPDATE handleShowDeleteOptionModal:
  const handleShowDeleteOptionModal = (itemId, option) => {
    setEntityToDelete({
      type: "option",
      data: option,
    });
  };

  const onEdit = (item) => {
    setEditingItem(item);
    setAddingNewItem(true);
  };

  const handleEditOption = (option) => {
    setEditingOption(option);
    setOptionModalItemId(option.nTransactionItemId);
  };

  const updateSpecs = async (nPurchaseOptionId, newSpecs) => {
    try {
      const response = await api.put(
        `purchase-options/${nPurchaseOptionId}/update-specs`,
        { specs: newSpecs ?? "" },
        { headers: { "Content-Type": "application/json" } },
      );
      return response.data;
    } catch (error) {
      return false;
    }
  };

  const updateSpecsT = async (itemId, newSpecs) => {
    try {
      const safeSpecs = newSpecs ?? "";

      const response = await api.put(
        `transaction-item/${itemId}/update-specs`,
        { specs: safeSpecs },
        { headers: { "Content-Type": "application/json" } },
      );
      return response.data;
    } catch (error) {
      return false;
    }
  };
  const toggleOptionsRow = (id) => {
    const item = items.find((i) => i.id === id);
    const isCurrentlyExpanded = expandedRows[id]?.options;

    setExpandedRows((prev) => ({
      ...prev,
      [id]: {
        specs: prev[id]?.specs || false,
        options: !prev[id]?.options,
      },
    }));

    if (
      !isCurrentlyExpanded &&
      item &&
      !item.optionsLoaded &&
      !item.optionsLoading
    ) {
      fetchPurchaseOptions(id);
    }
  };

  const toggleSpecsRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: {
        specs: !prev[id]?.specs,
        options: prev[id]?.options || false,
      },
    }));
  };

  const toggleOptionSpecs = (optionId) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleCollapseAllToggle = () => {
    const isAnythingExpanded = Object.values(expandedRows).some((row) => {
      if (!row) return false;
      if (typeof row === "string") return true;
      if (typeof row === "object") return row.specs || row.options;
      return false;
    });

    if (isAnythingExpanded) {
      setExpandedRows({});
    } else {
      const allExpanded = items.reduce((acc, item) => {
        acc[item.id] = {
          specs: true,
          options: showPurchaseOptions ? true : false,
        };
        return acc;
      }, {});
      setExpandedRows(allExpanded);
    }
  };

  const handleCompareClick = (item, selectedOption) => {
    setCompareData(null);

    const data = {
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
    };

    setCompareData(data);
    setIsCompareActive(true);
  };

  const handleBackFromCompare = async () => {
    setIsCompareActive(false);

    const itemId = compareData?.itemId;
    setCompareData(null);

    if (!itemId) return;

    // Keep the compared item's options expanded
    setExpandedRows((prev) => ({
      ...prev,
      [itemId]: {
        specs: prev[itemId]?.specs || false,
        options: true,
      },
    }));

    try {
      // 🔥 FULL resync (items + all purchase options)
      await fetchItems();
    } catch (err) {
      console.error("Failed to sync items after compare:", err);
    }
  };

  const setOptionErrorWithAutoHide = (optionId, message, duration = 3000) => {
    if (errorTimeoutsRef.current[optionId]) {
      clearTimeout(errorTimeoutsRef.current[optionId]);
    }

    setOptionErrors((prev) => ({
      ...prev,
      [optionId]: message,
    }));

    errorTimeoutsRef.current[optionId] = setTimeout(() => {
      setOptionErrors((prev) => {
        const copy = { ...prev };
        delete copy[optionId];
        return copy;
      });

      delete errorTimeoutsRef.current[optionId];
    }, duration);
  };

  const handleToggleInclude = async (itemId, optionId, value) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const option = item.purchaseOptions.find((o) => o.id === optionId);
    if (!option) return;

    const num = (v) => Number(v ?? 0);
    const itemQty = num(item.nQuantity ?? item.qty);
    const optionQty = num(option.nQuantity ?? option.quantity);
    const isAddOn = Number(option.bAddOn) === 1; // Check if this option is an add-on

    // Calculate current included quantity (excluding add-ons)
    const currentIncludedQty = item.purchaseOptions.reduce((sum, o) => {
      if (!o.bIncluded || Number(o.bAddOn) === 1) return sum;
      return sum + num(o.nQuantity ?? o.quantity);
    }, 0);

    const isFullyAllocated = currentIncludedQty === itemQty;
    const quantityStatus = `${currentIncludedQty} / ${itemQty}`;
    const fullMessage = isFullyAllocated
      ? "The quantity is currently fully allocated."
      : "";

    // Skip quantity validation for add-ons
    if (!isAddOn) {
      if (value && optionQty > itemQty) {
        setOptionErrorWithAutoHide(
          optionId,
          `Option quantity (${optionQty}) exceeds item quantity (${itemQty}). ${fullMessage} (${quantityStatus})`,
        );
        return;
      }

      const nextIncludedQty = value
        ? currentIncludedQty + optionQty
        : currentIncludedQty - optionQty;

      if (nextIncludedQty > itemQty) {
        setOptionErrorWithAutoHide(
          optionId,
          isFullyAllocated
            ? `Cannot add more options. The quantity is already fully allocated (${quantityStatus}).`
            : `Cannot include this option. Adding ${optionQty} would exceed the item limit. Current allocation: ${quantityStatus}.`,
        );
        return;
      }
    }

    // Optimistic UI update
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
    } catch (err) {
      console.error(err);
      setOptionErrorWithAutoHide(
        optionId,
        `Failed to update. Current: ${quantityStatus}`,
      );
    }
  };

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);

      const updatedItems = reordered.map((item, index) => ({
        ...item,
        nItemNumber: index + 1,
      }));

      setItems(updatedItems);

      try {
        await api.put("transactions/items/update-order", {
          items: updatedItems.map((i) => ({
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

  const handleAfterAction = (newStatusCode) => {
    setActionModal(null);

    if (newStatusCode) {
      sessionStorage.setItem("selectedAOStatusCode", newStatusCode);
    }

    navigate(-1);
  };

  const handleVerifyClick = () => setActionModal("verified");
  const handleRevertClick = () => setActionModal("reverted");
  const handleFinalizeClick = () => setActionModal("finalized");

  if (!open || !transaction) return null;

  return (
    <PageLayout
      title={`Transaction`}
      subtitle={`/ ${transactionCode}`}
      loading={itemsLoading}
      footer={
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* LEFT SIDE */}
          <Box>
            <BaseButton
              label="Back"
              icon={<ArrowBack />}
              onClick={
                isCompareActive ? handleBackFromCompare : () => navigate(-1)
              }
              disabled={itemsLoading}
              variant="outlined"
              color="primary"
            />
          </Box>

          {/* RIGHT SIDE */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {showRevert && !isCompareActive && (
              <BaseButton
                label="Revert"
                icon={<Replay />}
                onClick={handleRevertClick}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#E53935",
                  "&:hover": { bgcolor: "#D32F2F" },
                }}
              />
            )}

            {showVerify && (
              <BaseButton
                label="Verify"
                icon={<CheckCircle />}
                onClick={handleVerifyClick}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#034FA5",
                  "&:hover": { bgcolor: "#336FBF" },
                }}
              />
            )}

            {showFinalize && (
              <BaseButton
                label="Finalize"
                icon={<DoneAll />}
                onClick={handleFinalizeClick}
                disabled={shouldDisableFinalize}
                sx={{
                  bgcolor: "#43A047", // ✅ green background
                  "&:hover": { bgcolor: "#388E3C" }, // ✅ darker green on hover
                }}
              />
            )}

            {showForAssignment && hasAssignedAO && (
              <BaseButton
                label="Reassign AO"
                icon={<AssignmentInd />}
                onClick={() => setAssignMode("reassign")}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#FFA726",
                  "&:hover": { bgcolor: "#FB8C00" },
                }}
              />
            )}

            {showForAssignment && !hasAssignedAO && (
              <BaseButton
                label="Assign AO"
                icon={<AssignmentInd />}
                onClick={() => setAssignMode("assign")}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#29B6F6",
                  "&:hover": { bgcolor: "#0288D1" },
                }}
              />
            )}
          </Box>
        </Box>
      }
    >
      <Box>
        <TransactionActionModal
          open={Boolean(actionModal)}
          actionType={actionModal}
          transaction={transaction}
          canvasVerificationLabel={canvasVerificationLabel}
          forCanvasLabel={forCanvasLabel}
          onClose={() => setActionModal(null)}
          aostatus={ao_status}
          onVerified={handleAfterAction}
          onReverted={handleAfterAction}
          onFinalized={handleAfterAction}
        />
        <AssignAOModal
          open={!!assignMode}
          mode={assignMode}
          transaction={transaction}
          accountOfficers={accountOfficers}
          onClose={() => setAssignMode(null)}
          onSuccess={() => navigate(-1)}
        />
        {limitedContent && (
          <TransactionDetails
            details={transaction}
            statusTransaction={statusTransaction}
            itemType={itemType}
            procMode={procMode}
            procSourceLabel={procSourceLabel}
            showTransactionDetails={
              forAssignmentKey.includes(statusCode) ||
              itemsManagementKey.includes(statusCode) ||
              itemsVerificationKey.includes(statusCode) ||
              forCanvasKey.includes(statusCode) ||
              canvasVerificationKey.includes(statusCode)
            }
          />
        )}
        {!verifying && !reverting && !confirming && !limitedContent && (
          <>
            {/* AlertBox below the toast */}
            <Box sx={{ mt: toast.open ? 1 : 0 }}>
              {!isCompareActive && (
                <AlertBox>
                  {/* SCROLL WRAPPER */}
                  <Box
                    sx={{
                      overflowX: "auto",
                      pb: 1,
                    }}
                  >
                    {/* MIN WIDTH CONTENT */}
                    <Box sx={{ minWidth: "500px" }}>
                      <Grid
                        container
                        spacing={1}
                        sx={{
                          display: "flex",
                          alignItems: "stretch",
                          textAlign: "left",
                          fontSize: { xs: "0.75rem", sm: "0.8rem" },
                        }}
                      >
                        {/* TOP ROW */}
                        <Grid
                          item
                          xs={12}
                          sx={{ fontWeight: "bold", textAlign: "left" }}
                        >
                          {transaction.clientName || "—"} :{" "}
                          <span style={{ fontStyle: "italic" }}>
                            {transaction.strTitle ||
                              transaction.transactionName ||
                              "—"}
                          </span>
                        </Grid>
                        {/* HR LINE */}
                        <Grid item xs={12}>
                          <hr style={{ margin: "4px 0" }} />
                        </Grid>
                        {/* LEFT COLUMN */}
                        <Grid
                          item
                          xs={6}
                          sx={{
                            borderRight: "1px solid #ccc",
                            paddingRight: 1,
                            textAlign: "left",
                          }}
                        >
                          {/* CODE ROW */}
                          <Grid container>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>Code:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "right",
                                pr: 5,
                              }}
                            >
                              {transaction.strCode ||
                                transaction.transactionId ||
                                "—"}
                            </Grid>
                          </Grid>
                          <Grid container sx={{ mt: "6px" }}>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>ABC:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "right",
                                pr: 5,
                                color:
                                  transactionHasABC &&
                                  totalItemsABC > 0 &&
                                  totalItemsABC !==
                                    Number(transaction.dTotalABC)
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              {transaction.dTotalABC
                                ? `₱ ${Number(
                                    transaction.dTotalABC,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : "—"}
                              {transactionHasABC && totalItemsABC > 0 && (
                                <Box
                                  component="span"
                                  sx={{ ml: 1, fontSize: "0.7rem" }}
                                >
                                  (Items: ₱
                                  {totalItemsABC.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  )
                                </Box>
                              )}
                            </Grid>
                          </Grid>

                          {/* ABC ROW */}
                          {showPurchaseOptions && (
                            <Grid container sx={{ mt: "6px" }}>
                              <Grid item xs={5} sx={{ textAlign: "left" }}>
                                <strong>Total Canvas:</strong>
                              </Grid>
                              <Grid
                                item
                                xs={7}
                                sx={{
                                  fontStyle: "italic",
                                  textAlign: "right",
                                  pr: 5,
                                }}
                              >
                                ₱{" "}
                                {totalCanvas.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Grid>
                            </Grid>
                          )}
                        </Grid>

                        {/* RIGHT COLUMN */}
                        <Grid
                          item
                          xs={6}
                          sx={{
                            paddingLeft: 1,
                            textAlign: "left",
                          }}
                        >
                          {/* AO DUE ROW */}
                          <Grid container>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>AO Due:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "left",
                                color:
                                  transaction.dtAODueDate &&
                                  (new Date(transaction.dtAODueDate) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24) <=
                                    4
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              {transaction.dtAODueDate
                                ? new Date(
                                    transaction.dtAODueDate,
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : "—"}
                            </Grid>
                          </Grid>

                          {/* DOC SUB ROW */}
                          <Grid container sx={{ mt: "6px" }}>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>Doc Sub:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "left",
                                color:
                                  transaction.dtDocSubmission &&
                                  (new Date(transaction.dtDocSubmission) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24) <=
                                    4
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              {transaction.dtDocSubmission
                                ? new Date(
                                    transaction.dtDocSubmission,
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : "—"}
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </AlertBox>
              )}
              {!isCompareActive &&
                itemsManagementKey.includes(statusCode) &&
                abcValidationMessage && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {abcValidationMessage}
                  </Alert>
                )}

              {!isCompareActive &&
                isCanvasOverABC &&
                abcValidationResult.message && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {abcValidationResult.message}
                  </Alert>
                )}
            </Box>
            <Grid item xs={12} md={6}>
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
                    }}
                  >
                    Transaction Items
                  </Typography>

                  {/* RIGHT ACTIONS */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {/* NEW ITEM */}
                    {showAddButton && (
                      <button
                        style={{
                          fontSize: "0.7rem",
                          background: "#fff",
                          border: "1px solid #cfd8dc",
                          cursor: "pointer",
                          color: "#1976d2",
                          fontWeight: 500,
                          borderRadius: "6px",
                          padding: "1px 6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        onClick={() => {
                          setEditingItem(null);
                          setAddingNewItem(true);
                        }}
                      >
                        <Add fontSize="small" />
                        Item
                      </button>
                    )}

                    {/* COLLAPSE / HIDE ALL */}
                    <button
                      style={{
                        fontSize: "0.7rem",
                        backgroundColor: "#f7fbff",
                        border: "1px solid #cfd8dc",
                        cursor: "pointer",
                        color: "#1976d2",
                        fontWeight: 500,
                        borderRadius: "6px",
                        padding: "1px 6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={handleCollapseAllToggle}
                    >
                      {Object.values(expandedRows).some(
                        (row) => row.specs || row.options,
                      )
                        ? "Hide all"
                        : "Collapse all"}
                      {Object.values(expandedRows).some(
                        (row) => row.specs || row.options,
                      ) ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </button>
                  </Box>
                </Box>
              )}
              {!isCompareActive && (
                <Box sx={{ width: "100%", mt: 1 }}>
                  {/* Scroll Container */}
                  <Box sx={{ overflowX: "auto", pb: 1 }}>
                    <Box sx={{ minWidth: "650px" }}>
                      {/* HEADER */}
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1,
                          background: "#f1f1f1",
                          fontWeight: "bold",
                          borderRadius: 1.5,
                        }}
                      >
                        <Grid
                          container
                          alignItems="center"
                          sx={{
                            textAlign: "center",
                            fontWeight: 600,
                            fontSize: {
                              xs: "0.7rem",
                              sm: "0.75rem",
                              md: "0.8rem",
                            },
                          }}
                        >
                          <Grid
                            item
                            xs={showPurchaseOptions ? 3 : 5}
                            sx={{ textAlign: "center" }}
                          >
                            Description
                          </Grid>
                          <Grid
                            item
                            xs={
                              crudItemsEnabled && !showPurchaseOptions
                                ? 3
                                : showPurchaseOptions
                                  ? 2
                                  : 4
                            }
                          >
                            Quantity
                          </Grid>
                          {showPurchaseOptions && (
                            <Grid item xs={2}>
                              Canvas
                            </Grid>
                          )}
                          <Grid item xs={showPurchaseOptions ? 2 : 3}>
                            ABC
                          </Grid>
                          {showPurchaseOptions && (
                            <Grid item xs={2}>
                              Balance
                            </Grid>
                          )}
                          {(crudItemsEnabled || showPurchaseOptions) && (
                            <Grid item xs={1}>
                              Action
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                      {/* BODY ROWS */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={() => setExpandedRows({})}
                        onDragEnd={crudItemsEnabled ? handleDragEnd : undefined}
                      >
                        <SortableContext
                          items={items.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.map((item) => {
                            const includedQty = item.purchaseOptions
                              .filter(
                                (opt) =>
                                  opt.bIncluded && Number(opt.bAddOn) !== 1,
                              )
                              .reduce(
                                (sum, opt) => sum + Number(opt.nQuantity || 0),
                                0,
                              );
                            const includedTotal = item.purchaseOptions
                              .filter((opt) => opt.bIncluded)
                              .reduce(
                                (sum, opt) =>
                                  sum +
                                  Number(opt.nQuantity || 0) *
                                    Number(opt.dUnitPrice || 0),
                                0,
                              );
                            // Total quantities across all items

                            const isItemExpanded =
                              expandedRows[item.id]?.specs ||
                              expandedRows[item.id]?.options;

                            const isSpecsOpen = expandedRows[item.id]?.specs;
                            const isOptionsOpen =
                              expandedRows[item.id]?.options;
                            const isQuantityEqual =
                              Number(includedQty || 0) ===
                              Number(item.qty || 0);

                            const getEffectiveABC = (item) => {
                              const itemABC = Number(item.abc || 0);

                              // If transaction has ABC and item ABC is empty, distribute transaction ABC
                              if (transactionHasABC && itemABC === 0) {
                                const totalItemQty = items.reduce(
                                  (sum, i) => sum + Number(i.qty || 0),
                                  0,
                                );
                                const itemQty = Number(item.qty || 0);
                                const transABC = Number(
                                  transaction.dTotalABC || 0,
                                );

                                // Proportionally distribute transaction ABC based on quantity
                                return totalItemQty > 0
                                  ? (itemQty / totalItemQty) * transABC
                                  : 0;
                              }

                              // Otherwise use item's own ABC
                              return itemABC;
                            };

                            const effectiveABC = getEffectiveABC(item);

                            // Then update the calculations:
                            const balanceQty = effectiveABC - includedTotal;
                            const isOverABC = includedTotal > effectiveABC;
                            return (
                              <SortableWrapper
                                id={item.id}
                                key={item.id}
                                disabled={!crudItemsEnabled}
                              >
                                <Box sx={{ mt: 1 }}>
                                  <Paper
                                    elevation={1}
                                    sx={{
                                      p: 1,
                                      borderRadius: 1.5,
                                      background: coloredItemRowEnabled
                                        ? isQuantityEqual
                                          ? !isOverABC
                                            ? "rgba(0, 255, 0, 0.1)" // light green when quantities match and not over ABC
                                            : "rgba(255, 0, 0, 0.1)" // light red when over ABC
                                          : "#ffffff" // white if quantities don't match
                                        : "#ffffff", // white when coloredItemRowEnabled is false
                                      borderLeft: "4px solid #1565c0", // darker blue

                                      // 👇 dynamic corners
                                      borderTopLeftRadius: 8,
                                      borderTopRightRadius: 8,
                                      borderBottomLeftRadius: isItemExpanded
                                        ? 0
                                        : 8,
                                      borderBottomRightRadius: isItemExpanded
                                        ? 0
                                        : 8,
                                    }}
                                  >
                                    <Grid
                                      container
                                      alignItems="center"
                                      sx={{ textAlign: "center" }}
                                    >
                                      <Grid
                                        item
                                        xs={showPurchaseOptions ? 3 : 5}
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          textAlign: "left",
                                        }}
                                      >
                                        <Typography
                                          fontWeight="500"
                                          sx={{
                                            fontSize: ".7rem",
                                            lineHeight: 1.2,
                                            wordBreak: "break-word",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {item.nItemNumber}. {item.name || "—"}
                                        </Typography>

                                        <IconButton
                                          onClick={() =>
                                            toggleSpecsRow(item.id)
                                          }
                                          size="small"
                                          sx={{
                                            mr: {
                                              xs: 5, // small screens (mobile)
                                              lg: 0, // large screens
                                            },
                                          }}
                                        >
                                          <ArrowDropDownIcon
                                            sx={{
                                              transform: expandedRows[item.id]
                                                ?.specs
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                              transition: "transform 0.2s",
                                            }}
                                          />
                                        </IconButton>
                                      </Grid>

                                      {/* Quantity */}
                                      <Grid
                                        item
                                        xs={
                                          crudItemsEnabled &&
                                          !showPurchaseOptions
                                            ? 3
                                            : showPurchaseOptions
                                              ? 2
                                              : 4
                                        }
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: ".7rem",
                                            lineHeight: 1,
                                          }}
                                        >
                                          {showPurchaseOptions &&
                                            `${includedQty} / `}
                                          {item.qty}
                                          <br />
                                          <span
                                            style={{
                                              fontSize: "0.75rem",
                                              color: "#666",
                                            }}
                                          >
                                            {item.uom}
                                          </span>
                                        </Typography>
                                      </Grid>

                                      {/* Canvas */}
                                      {showPurchaseOptions && (
                                        <Grid item xs={2}>
                                          <Typography
                                            sx={{
                                              fontSize: ".7rem",
                                              lineHeight: 1.2,
                                              textAlign: "right",
                                              pr: 4,
                                            }}
                                          >
                                            ₱{" "}
                                            {Number(
                                              includedTotal,
                                            ).toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                            })}
                                          </Typography>
                                        </Grid>
                                      )}
                                      {/* ABC */}
                                      <Grid
                                        item
                                        xs={showPurchaseOptions ? 2 : 3}
                                        sx={{ textAlign: "right", pr: 4 }}
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: ".7rem",
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          ₱{" "}
                                          {Number(item.abc).toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                            },
                                          )}
                                        </Typography>
                                      </Grid>

                                      {/* Balance */}
                                      {showPurchaseOptions && (
                                        <Grid
                                          item
                                          xs={2}
                                          sx={{ textAlign: "right" }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: ".7rem",
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            ₱{" "}
                                            {Number(balanceQty).toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                              },
                                            )}
                                          </Typography>
                                        </Grid>
                                      )}
                                      {(crudItemsEnabled ||
                                        showPurchaseOptions) && (
                                        <>
                                          {/* Right-side icons container */}
                                          <Grid
                                            item
                                            xs={1}
                                            sx={{
                                              display: "flex",
                                              justifyContent: "flex-end",
                                              alignItems: "center",
                                              position: "relative",
                                            }}
                                          >
                                            {/* Pencil Icon */}
                                            {crudItemsEnabled && (
                                              <>
                                                {/* Edit Button */}
                                                <BaseButton
                                                  icon={
                                                    <Edit
                                                      sx={{
                                                        fontSize: "0.9rem",
                                                      }}
                                                    />
                                                  }
                                                  tooltip="Edit"
                                                  onClick={(e) => {
                                                    e.stopPropagation(); // prevent row click
                                                    onEdit(item);
                                                  }}
                                                  size="small"
                                                />

                                                {/* Delete Button */}
                                                <BaseButton
                                                  icon={
                                                    <Delete
                                                      sx={{
                                                        fontSize: "0.9rem",
                                                      }}
                                                    />
                                                  }
                                                  tooltip="Delete"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShowDeleteModal(item);
                                                  }}
                                                  size="small"
                                                  color="error"
                                                />
                                              </>
                                            )}
                                            {/* Arrow Dropdown */}
                                            {showPurchaseOptions && (
                                              <IconButton
                                                size="small"
                                                sx={{
                                                  position: "relative",
                                                  marginRight: 2,
                                                }}
                                                onClick={() =>
                                                  toggleOptionsRow(item.id)
                                                }
                                              >
                                                <ArrowDropDownIcon
                                                  sx={{
                                                    transform: expandedRows[
                                                      item.id
                                                    ]?.options
                                                      ? "rotate(180deg)"
                                                      : "rotate(0deg)",
                                                    transition:
                                                      "transform 0.2s",
                                                    fontSize: "1.4rem",
                                                  }}
                                                />
                                                {/* Badge visible only if item has purchase options */}
                                                {item.purchaseOptions.length >
                                                  0 &&
                                                  !expandedRows[item.id]
                                                    ?.options && (
                                                    <Box
                                                      sx={{
                                                        position: "absolute",
                                                        top: "1px",
                                                        right: "-3px",
                                                        backgroundColor:
                                                          "#d9ecff",
                                                        color: "#1976d2",
                                                        width: "14px",
                                                        height: "14px",
                                                        fontSize: "0.50rem",
                                                        borderRadius: "50%",
                                                        border:
                                                          "1px solid #90caf9",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                          "center",
                                                        zIndex: 2,
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {
                                                        item.purchaseOptions
                                                          .length
                                                      }
                                                    </Box>
                                                  )}
                                              </IconButton>
                                            )}
                                          </Grid>
                                        </>
                                      )}
                                    </Grid>
                                  </Paper>

                                  {/* Specs */}
                                  {expandedRows[item.id]?.specs && (
                                    <Paper
                                      elevation={1}
                                      sx={{
                                        mt: "-1px",
                                        borderRadius: 2,
                                        background: "#f3f8ff",
                                        borderLeft: "4px solid #1e88e5",
                                        overflow: "hidden",
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                        borderBottomLeftRadius: isOptionsOpen
                                          ? 0
                                          : 8,
                                        borderBottomRightRadius: isOptionsOpen
                                          ? 0
                                          : 8,
                                      }}
                                    >
                                      {/* Top Header */}
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
                                        }}
                                      >
                                        <span>Specifications:</span>

                                        <Box sx={{ display: "flex", gap: 1 }}>
                                          {/* Hide Specs Button with Icon */}
                                          <button
                                            style={{
                                              fontSize: "0.6rem",
                                              backgroundColor: "#f7fbff",
                                              border: "1px solid #cfd8dc",
                                              cursor: "pointer",
                                              color: "#1976d2",
                                              fontWeight: 500,
                                              borderRadius: "6px",
                                              padding: "1px 8px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "4px",
                                            }}
                                            onClick={() =>
                                              toggleSpecsRow(item.id)
                                            }
                                          >
                                            Hide
                                            <ExpandLess fontSize="small" />
                                          </button>
                                        </Box>
                                      </Box>
                                      <Box
                                        sx={{
                                          px: 2,
                                          py: 1,
                                          minHeight: 150,
                                          maxHeight: 150,
                                          overflowY: "auto",
                                          backgroundColor: "#ADD8E65A ",
                                          color: "text.secondary",
                                          fontSize: "0.8rem",
                                          "& *": {
                                            backgroundColor:
                                              "transparent !important",
                                          },
                                          "& ul": {
                                            paddingLeft: 2,
                                            margin: 0,
                                            listStyleType: "disc",
                                          },
                                          "& ol": {
                                            paddingLeft: 2,
                                            margin: 0,
                                            listStyleType: "decimal",
                                          },
                                          "& li": { marginBottom: 0.25 },
                                          wordBreak: "break-word",
                                        }}
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            item.specs || "No data available.",
                                        }}
                                      />
                                    </Paper>
                                  )}

                                  {/* OPTIONS */}
                                  {expandedRows[item.id]?.options && (
                                    <Paper
                                      elevation={2}
                                      sx={{
                                        mt: "-1px",
                                        background: "#fafbfd",
                                        borderLeft: "4px solid #90caf9",
                                        borderRadius: 2.5,
                                        overflow: "hidden",
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                        borderBottomLeftRadius: 10,
                                        borderBottomRightRadius: 10,
                                      }}
                                    >
                                      {/* HEADER */}
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
                                        }}
                                      >
                                        <span>Purchase Options</span>

                                        <Box sx={{ display: "flex", gap: 1 }}>
                                          {/* NEW OPTION */}
                                          {checkboxOptionsEnabled && (
                                            <button
                                              style={{
                                                fontSize: "0.7rem",
                                                backgroundColor: "#fff",
                                                border: "1px solid #cfd8dc",
                                                cursor: "pointer",
                                                color: "#1976d2",
                                                fontWeight: 500,
                                                borderRadius: "6px",
                                                padding: "1px 6px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                              }}
                                              onClick={() => {
                                                setEditingOption(null);
                                                setOptionModalItemId(item.id);
                                              }}
                                            >
                                              <Add fontSize="small" />
                                              Option
                                            </button>
                                          )}

                                          {/* HIDE / SHOW OPTIONS */}
                                          <button
                                            style={{
                                              fontSize: "0.7rem",
                                              backgroundColor: "#f7fbff",
                                              border: "1px solid #cfd8dc",
                                              cursor: "pointer",
                                              color: "#1976d2",
                                              fontWeight: 500,
                                              borderRadius: "6px",
                                              padding: "1px 6px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "4px",
                                            }}
                                            onClick={() =>
                                              toggleOptionsRow(item.id)
                                            }
                                          >
                                            Hide
                                            <ExpandLess fontSize="small" />
                                          </button>
                                        </Box>
                                      </Box>

                                      {/* TABLE HEADER */}
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
                                        <Box
                                          sx={{
                                            flex: 2.5,
                                            textAlign: "center",
                                          }}
                                        >
                                          Description
                                        </Box>
                                        <Box
                                          sx={{
                                            flex: 2,
                                            textAlign: "center",
                                          }}
                                        >
                                          Brand | Model
                                        </Box>
                                        <Box
                                          sx={{
                                            flex: 1,
                                            textAlign: "center",
                                          }}
                                        >
                                          Quantity
                                        </Box>
                                        <Box
                                          sx={{
                                            flex: 1.5,
                                            textAlign: "center",
                                          }}
                                        >
                                          Unit Price
                                        </Box>
                                        <Box
                                          sx={{
                                            flex: 1.5,
                                            textAlign: "center",
                                          }}
                                        >
                                          EWT
                                        </Box>
                                        <Box
                                          sx={{
                                            flex: 1.5,
                                            textAlign: "center",
                                          }}
                                        >
                                          Total
                                        </Box>
                                        {checkboxOptionsEnabled && (
                                          <Box
                                            sx={{
                                              flex: 1,
                                              textAlign: "center",
                                            }}
                                          >
                                            Action
                                          </Box>
                                        )}
                                      </Box>

                                      {/* OPTION ROWS */}
                                      {item.optionsLoading ? (
                                        // LOADING STATE
                                        <Box
                                          sx={{
                                            py: 2,
                                            textAlign: "center",
                                            fontSize: "0.75rem",
                                            color: "text.secondary",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 1,
                                          }}
                                        >
                                          <DotSpinner size={6} />
                                        </Box>
                                      ) : item.purchaseOptions.length === 0 ? (
                                        // EMPTY STATE
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
                                        // Inside the mapping of item.purchaseOptions
                                        item.purchaseOptions.map(
                                          (option, index) => {
                                            // Check if there are any regular (non-add-on) options
                                            const hasNoRegularOptions =
                                              item.purchaseOptions.every(
                                                (opt) =>
                                                  Number(opt.bAddOn) === 1,
                                              );

                                            // Determine if this is the first add-on
                                            const isFirstAddOn =
                                              Number(option.bAddOn) === 1 &&
                                              (index === 0 ||
                                                Number(
                                                  item.purchaseOptions[
                                                    index - 1
                                                  ].bAddOn,
                                                ) !== 1);

                                            // Calculate display index based on whether it's an add-on or regular option
                                            let displayIndex;
                                            if (Number(option.bAddOn) === 1) {
                                              // For add-ons, count only add-ons before this one
                                              displayIndex =
                                                item.purchaseOptions
                                                  .slice(0, index)
                                                  .filter(
                                                    (opt) =>
                                                      Number(opt.bAddOn) === 1,
                                                  ).length + 1;
                                            } else {
                                              // For regular options, count only regular options before this one
                                              displayIndex =
                                                item.purchaseOptions
                                                  .slice(0, index)
                                                  .filter(
                                                    (opt) =>
                                                      Number(opt.bAddOn) !== 1,
                                                  ).length + 1;
                                            }

                                            return (
                                              <PurchaseOptionRow
                                                key={option.id}
                                                option={option}
                                                index={index}
                                                displayIndex={displayIndex} // Pass the calculated display index
                                                isLastOption={
                                                  index ===
                                                  item.purchaseOptions.length -
                                                    1
                                                }
                                                itemId={item.id}
                                                item={item}
                                                checkboxOptionsEnabled={
                                                  checkboxOptionsEnabled
                                                }
                                                expandedOptions={
                                                  expandedOptions
                                                }
                                                optionErrors={optionErrors}
                                                onToggleInclude={
                                                  handleToggleInclude
                                                }
                                                onToggleOptionSpecs={
                                                  toggleOptionSpecs
                                                }
                                                onEditOption={handleEditOption}
                                                onDeleteOption={
                                                  handleShowDeleteOptionModal
                                                }
                                                onCompareClick={
                                                  handleCompareClick
                                                }
                                                isManagement={isManagement}
                                                isFirstAddOn={isFirstAddOn}
                                                hasNoRegularOptions={
                                                  hasNoRegularOptions
                                                }
                                              />
                                            );
                                          },
                                        )
                                      )}
                                    </Paper>
                                  )}
                                </Box>
                              </SortableWrapper>
                            );
                          })}
                        </SortableContext>
                      </DndContext>
                    </Box>
                  </Box>
                </Box>
              )}
              {items.length === 0 && (
                <Box
                  sx={{
                    height: 100,
                    border: "1px dashed #bbb",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography>No items available.</Typography>
                </Box>
              )}
            </Grid>
            {isCompareActive && compareData && (
              <CompareView
                compareData={compareData}
                onSpecsChange={(newSpecs) => {
                  setCompareData((prev) => ({
                    ...prev,
                    specs: newSpecs,
                  }));
                  updateSpecsT(compareData.itemId, newSpecs);
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
        onSuccess={fetchItems}
      />
      <NewItemModal
        open={addingNewItem}
        onClose={() => {
          setAddingNewItem(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        onSuccess={fetchItems}
        transactionId={transaction?.nTransactionId}
        transactionHasABC={transactionHasABC}
        transactionABC={transaction?.dTotalABC}
      />

      <NewOptionModal
        open={optionModalItemId !== null}
        onClose={() => {
          setOptionModalItemId(null);
          setEditingOption(null);
        }}
        editingOption={editingOption}
        itemId={optionModalItemId}
        onSuccess={fetchItems}
        suppliers={suppliers}
        cItemType={cItemType}
        itemType={itemType}
        vaGoSeValue={vaGoSeValue}
      />
    </PageLayout>
  );
}

export default TransactionCanvas;
