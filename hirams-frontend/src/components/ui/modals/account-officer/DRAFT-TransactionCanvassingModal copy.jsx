import React, { useState, useEffect, useCallback } from "react";
import { Box, Grid, Typography, IconButton, Paper, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import ModalContainer from "../../../common/ModalContainer";
import VerificationModalCard from "../../../common/VerificationModalCard";
import api from "../../../../utils/api/api";
import useMapping from "../../../../utils/mappings/useMapping";
import AlertBox from "../../../common/AlertBox";
import FormGrid from "../../../common/FormGrid";
import { SaveButton, BackButton } from "../../../common/Buttons";
import {
  VerifyButton,
  FinalizeButton,
  RevertButton1,
} from "../../../common/Buttons";
import RemarksModalCard from "../../../common/RemarksModalCard";
import { withSpinner, showSwal } from "../../../../utils/swal";
// Add this import at the top
import { calculateEWT } from "../../../../utils/formula/calculateEWT";
import messages from "../../../../utils/messages/messages";

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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTransactionItem from "../../account-officer/SortableTransactionItem";
import DotSpinner from "../../../common/DotSpinner";
import { validateFormData } from "../../../../utils/form/validation";

const initialFormData = {
  nSupplierId: "",
  quantity: "",
  uom: "",
  brand: "",
  model: "",
  specs: "",
  unitPrice: "",
  ewt: "",
  bIncluded: false,
};

function TransactionCanvassingModal({
  open,
  onClose,
  transaction,
  onVerified,
  onReverted,
  onFinalized,
  transactionCode,
}) {
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);

  const [addingNewItem, setAddingNewItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    specs: "",
    qty: "",
    uom: "",
    abc: "",
    purchasePrice: "",
  });
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteLetter, setDeleteLetter] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteIndexOption, setDeleteIndexOption] = useState(null);
  const [deleteLetterOption, setDeleteLetterOption] = useState("");
  const [deleteErrorOption, setDeleteErrorOption] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [isCompareActive, setIsCompareActive] = useState(false);

  const [newItemErrors, setNewItemErrors] = useState({});
  const [purchaseOptionErrors, setPurchaseOptionErrors] = useState({});
  // States for verify/revert/finalize modals
  const [cItemType, setCItemType] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  //TOAST HANDLER
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [itemsLoading, setItemsLoading] = useState(true);
  const { itemType, ao_status, clientstatus, userTypes, vaGoSeValue } =
    useMapping();
  // --- Finalize Visibility Logic ---
  const statusCode = String(transaction.current_status);
  // A transaction is FINALIZABLE if its status code exists inside finalizeCode object
  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const itemsManagementKey = Object.keys(ao_status)[0] || "";
  const itemsFinalizeKey = Object.keys(ao_status)[1] || "";
  const itemsVerificationKey = Object.keys(ao_status)[2] || "";
  const forCanvasKey = Object.keys(ao_status)[3] || "";
  const canvasFinalizeKey = Object.keys(ao_status)[4] || "";
  const canvasVerificationKey = Object.keys(ao_status)[5] || "";
  const managementKey = (Object.keys(userTypes)[1] || Object.keys(userTypes)[4]) || "";


  const showVerify =
    (itemsVerificationKey.includes(statusCode) ||
      canvasVerificationKey.includes(statusCode)) &&
    !isCompareActive;
  const showFinalize =
    itemsManagementKey.includes(statusCode) ||
    (forCanvasKey.includes(statusCode) && !isCompareActive);
  const showRevert = !itemsManagementKey.includes(statusCode);
  const showPurchaseOptions =
    forCanvasKey.includes(statusCode) ||
    canvasFinalizeKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);

  const showAddButton = itemsManagementKey.includes(statusCode);
  const isNotVisibleCanvasVerification = canvasFinalizeKey.includes(statusCode);
  const crudOptionsEnabled = forCanvasKey.includes(statusCode);
  const checkboxOptionsEnabled = forCanvasKey.includes(statusCode);
  //OTHER
  const forVerificationKey = forCanvasKey || "";
  const canvasVerificationLabel = ao_status[canvasFinalizeKey] || "";
  const forCanvasLabel = ao_status[forVerificationKey] || "";

  // ---------------------------------------------------------
  // TOAST HANDLER (same as Bank)
  // ---------------------------------------------------------
  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });

    setTimeout(() => {
      setToast({ open: false, message: "", severity: "success" });
    }, 6000);
  };
  // ---------------------------------------------------------
  // FETCH SUPPLIERS
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("suppliers/all");
        const options = res.suppliers.map((s) => ({
          label: s.strSupplierName,
          value: s.nSupplierId,
          bEWT: s.bEWT,
          bVAT: s.bVAT,
          nickName: s.strSupplierNickName
        }));
        setSuppliers(options);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);
  // ---------------------------------------------------------
  // FETCH ITEMS
  // ---------------------------------------------------------
  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;
    try {
      setItemsLoading(true); // start loading
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`
      );
      setItems(res.items || []);

      // Extract only the key like "G"
      const itemTypeKey =
        res.cItemType && typeof res.cItemType === "object"
          ? Object.keys(res.cItemType)[0]
          : res.cItemType;
      setCItemType(itemTypeKey);
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    } finally {
      setItemsLoading(false); // finish loading
    }
  };
  useEffect(() => {
    if (open) fetchItems();
  }, [open, transaction]);
  // ---------------------------------------------------------
  // RESET FORM WHEN MODAL OPENS
  // ---------------------------------------------------------
  useEffect(() => {
    if (open) {
      setFormData(initialFormData); // reset all fields
      setErrors({}); // reset validation errors
      setNewItemForm({
        name: "",
        specs: "",
        qty: "",
        uom: "",
        abc: "",
        purchasePrice: "",
      }); // reset new item form
      setAddingNewItem(false);
      setEditingItem(null);
      setAddingOptionItemId(null);
    }
  }, [open]);
  if (!open || !transaction) return null;
  // ---------------------------------------------------------
  // Inside useEffect for formData updates
  useEffect(() => {
    const selectedSupplier = suppliers.find(
      (s) => s.value === Number(formData.nSupplierId)
    );
    setFormData((prev) => ({
      ...prev,
      ewt: calculateEWT(
        prev.quantity,
        prev.unitPrice,
        selectedSupplier,
        cItemType,
        itemType, // pass the mapping here
        vaGoSeValue
      ),
    }));
  }, [
    formData.nSupplierId,
    formData.quantity,
    formData.unitPrice,
    cItemType,
    suppliers,
    itemType,
    vaGoSeValue,
  ]);
  // ---------------------------------------------------------
  // FORM HANDLERS
  // ---------------------------------------------------------
  const handleSupplierChange = (value) => {
    const selectedSupplier = suppliers.find((s) => s.value === Number(value));

    setFormData((prev) => ({
      ...prev,
      nSupplierId: selectedSupplier?.value || "",
      ewt: calculateEWT(
        prev.quantity,
        prev.unitPrice,
        selectedSupplier,
        cItemType,
        itemType,
        vaGoSeValue
      ),
    }));
  };
  const handleChangeAdd = (itemId) => {
    setFormData(initialFormData); // reset the fields
    setPurchaseOptionErrors({}); // reset validation errors
    setAddingOptionItemId(itemId); // set the item for which you are adding options
  };

  // Handle quantity/unitPrice changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      const selectedSupplier = suppliers.find(
        (s) => s.value === Number(newData.nSupplierId)
      );
      newData.ewt = calculateEWT(
        newData.quantity,
        newData.unitPrice,
        selectedSupplier,
        cItemType,
        itemType,
        vaGoSeValue
      );

      return newData;
    });
  };
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItemForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  const togglePurchaseOptions = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    setAddingOptionItemId(null);
  };
  const validateNewItemForm = () => {
    const validationErrors = validateFormData(newItemForm, "TRANSACTION_ITEM");
    setNewItemErrors(validationErrors); // <-- use newItemErrors
    return Object.keys(validationErrors).length === 0;
  };

  const validatePurchaseOption = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_OPTION");
    setPurchaseOptionErrors(validationErrors); // <-- use purchaseOptionErrors
    return Object.keys(validationErrors).length === 0;
  };

  // ---------------------------------------------------------
  // ADD ITEM
  // ---------------------------------------------------------
  const saveNewItem = async () => {
    if (!validateNewItemForm()) return; // validation stops invalid submission
    try {
      const entity =
        newItemForm.name?.trim() || messages.transaction.entityItem;

      setLoading(true);
      setLoadingMessage(
        `${messages.crudPresent.addingMess}${entity}${messages.typography.ellipsis}`
      );

      const payload = {
        nTransactionId: transaction.nTransactionId,
        strName: newItemForm.name,
        strSpecs: newItemForm.specs,
        nQuantity: Number(newItemForm.qty),
        strUOM: newItemForm.uom,
        dUnitABC: Number(newItemForm.abc),
      };

      await api.post("transaction-items", payload);
      await fetchItems();

      setNewItemForm({ name: "", specs: "", qty: "", uom: "", abc: "" });
      setAddingNewItem(false);

      showToast(`${entity} ${messages.crudSuccess.addingMess}`, "success");
    } catch (err) {
      showToast(messages.reusable.errorMess, "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };
  // EDIT ITEM
  const updateItem = async (id) => {
    if (!validateNewItemForm()) return; // validation stops invalid submission
    try {
      const entity =
        newItemForm.name?.trim() || messages.transaction.entityItem;
      setLoading(true);
      setLoadingMessage(
        `${messages.crudPresent.updatingMess}${entity}${messages.typography.ellipsis}`
      );
      const payload = {
        nTransactionId: transaction.nTransactionId,
        strName: newItemForm.name,
        strSpecs: newItemForm.specs,
        nQuantity: Number(newItemForm.qty),
        strUOM: newItemForm.uom,
        dUnitABC: Number(newItemForm.abc),
      };

      await api.put(`transaction-items/${id}`, payload);
      await fetchItems();

      setEditingItem(null);
      setAddingNewItem(false);
      setNewItemForm({ name: "", specs: "", qty: "", uom: "", abc: "" });

      showToast(`${entity} ${messages.crudSuccess.updatingMess}`, "success");
    } catch (err) {
      showToast(messages.reusable.errorMess, "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };
  // DELETE ITEM
  const confirmDelete = async () => {
    if (deleteIndex === null) return;

    const itemToDelete = items[deleteIndex];
    if (!itemToDelete) return;

    // Check if the typed letter matches the first letter of the item name
    if (
      deleteLetter.trim().toLowerCase() !== itemToDelete.name[0].toLowerCase()
    ) {
      setDeleteError(messages.transaction.errorDeleteMess);
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage(
        `${messages.crudPresent.deletingMess}${itemToDelete.name}${messages.typography.ellipsis}`
      );

      // Call API to delete
      await api.delete(`transaction-items/${itemToDelete.id}`);
      await fetchItems();

      showToast(
        `${itemToDelete.name} ${messages.crudSuccess.deletingMess}`,
        "success"
      );

      // Reset delete states
      setDeleteIndex(null);
      setDeleteLetter("");
      setDeleteError("");
    } catch (err) {
      showToast(messages.reusable.errorMess, "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };
  const handleShowDeleteModal = (item) => {
    const index = items.findIndex((i) => i.id === item.id);
    setDeleteIndex(index);
    setDeleteLetter("");
    setDeleteError("");
  };
  // DELETE OPTION
  const confirmDeleteOption = async () => {
    if (!deleteIndexOption) return;

    const { itemIndex, optionIndex } = deleteIndexOption;

    const item = items[itemIndex];
    const option = item.purchaseOptions[optionIndex];

    if (!item || !option) return;

    // Validation — type first letter of supplier name
    const supplierName = option.supplierName || option.strSupplierName;

    if (
      deleteLetterOption.trim().toLowerCase() !== supplierName[0].toLowerCase()
    ) {
      setDeleteErrorOption(messages.transaction.errorDeleteMess);
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage(
        `${messages.crudPresent.deletingMess}${supplierName}${messages.typography.ellipsis}`
      );

      // API DELETE
      await api.delete(`purchase-options/${option.id}`);

      await fetchItems();

      showToast(
        `${supplierName} ${messages.crudSuccess.deletingMess}`,
        "success"
      );

      // Reset
      setDeleteIndexOption(null);
      setDeleteLetterOption("");
      setDeleteErrorOption("");
    } catch (err) {
      showToast(messages.reusable.errorMess, "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };
  const handleShowDeleteOptionModal = (itemId, option) => {
    // Find item index first
    const itemIndex = items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return;

    // Find option index inside that item
    const optionIndex = items[itemIndex].purchaseOptions.findIndex(
      (o) => o.id === option.id
    );

    if (optionIndex === -1) return;

    setDeleteIndexOption({ itemIndex, optionIndex });
    setDeleteLetterOption("");
    setDeleteErrorOption("");
  };
  // PURCHASE OPTIONS SAVE
  const savePurchaseOption = async () => {
    if (!addingOptionItemId) return;

    // FIXED: Call the function
    if (!validatePurchaseOption()) return;

    const selectedSupplier = suppliers.find(
      (s) => s.value === Number(formData.nSupplierId)
    );

    const entity = selectedSupplier?.label;

    const payload = {
      nTransactionItemId: addingOptionItemId,
      nSupplierId: formData.nSupplierId || null,
      quantity: Number(formData.quantity),
      uom: formData.uom,
      brand: formData.brand || null,
      model: formData.model || null,
      specs: formData.specs || null,
      unitPrice: Number(formData.unitPrice),
      ewt: Number(formData.ewt) || 0,
      bIncluded: formData.bIncluded ? 1 : 0,
    };

    try {
      setLoading(true);
      setLoadingMessage(
        formData.id
          ? `${messages.crudPresent.updatingMess}${entity}${messages.typography.ellipsis}`
          : `${messages.crudPresent.addingMess}${entity}${messages.typography.ellipsis}`
      );

      if (formData.id) {
        await api.put(`purchase-options/${formData.id}`, payload);
        showToast(`${entity} ${messages.crudSuccess.updatingMess}`);
      } else {
        await api.post("purchase-options", payload);
        showToast(`${entity} ${messages.crudSuccess.addingMess}`);
      }

      fetchItems();
      setFormData(initialFormData);
      setAddingOptionItemId(null);
    } catch (err) {
      showToast(messages.transaction.poErrorSaveMess, "error");
      setErrors(err.response?.data?.errors || { general: err.message });
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleEditOption = (option) => {
    setAddingOptionItemId(option.nTransactionItemId);
    setFormData({
      nSupplierId: option.nSupplierId || "",
      quantity: option.nQuantity,
      uom: option.strUOM,
      brand: option.strBrand || "",
      model: option.strModel || "",
      specs: option.strSpecs || "",
      unitPrice: option.dUnitPrice,
      ewt: option.dEWT,
      bIncluded: !!option.bIncluded,
      id: option.id,
    });
  };
  const handleToggleInclude = async (itemId, optionId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              purchaseOptions: item.purchaseOptions.map((option) =>
                option.id === optionId
                  ? { ...option, bIncluded: value }
                  : option
              ),
            }
          : item
      )
    );
    try {
      await api.put(`purchase-options/${optionId}`, {
        bIncluded: value ? 1 : 0,
      });
      await fetchItems();
    } catch (err) {
      console.error("Error updating included:", err);
    }
  };
  // ---------------------------------------------------------
  // DRAG & DROP ORDERING
  // ---------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
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
    [items]
  );
  // ---------------------------------------------------------
  // VERIFY / REVERT / FINALIZE HANDLERS
  // ---------------------------------------------------------
  const handleVerifyClick = () => {
    setVerifying(true);
    setRemarks("");
    setRemarksError("");
  };
  const handleRevertClick = () => {
    setReverting(true);
    setRemarks("");
    setRemarksError("");
  };
  const handleFinalizeClick = () => {
    setConfirming(true);
    setRemarks("");
    setRemarksError("");
  };
  const confirmAction = async (actionType) => {
    const entity = transaction.strTitle || "Transaction";
    try {
      setLoading(true);
      onClose();

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const endpointMap = {
        verified:
          transaction.status === canvasVerificationLabel
            ? `transactions/${transaction.nTransactionId}/verify-ao-canvas`
            : `transactions/${transaction.nTransactionId}/verify-ao`,
        reverted: `transactions/${transaction.nTransactionId}/revert`,
        finalized:
          transaction.status === forCanvasLabel ||
          transaction.status === canvasVerificationLabel
            ? `transactions/${transaction.nTransactionId}/finalize-ao-canvas`
            : `transactions/${transaction.nTransactionId}/finalize-ao`,
      };

      const payload =
        actionType === "reverted"
          ? { user_id: userId, remarks: remarks.trim() || null }
          : { userId, remarks: remarks.trim() || null };

      await withSpinner(entity, async () => {
        await api.put(endpointMap[actionType], payload);
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transaction.strTitle, action: actionType }
      );

      setRemarks("");
      setVerifying(false);
      setReverting(false);
      setConfirming(false);

      if (actionType === "verified" && typeof onVerified === "function")
        onVerified();
      if (actionType === "reverted" && typeof onReverted === "function")
        onReverted();
      if (actionType === "finalized" && typeof onFinalized === "function")
        onFinalized();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transaction.strTitle });
    } finally {
      setLoading(false);
    }
  };
  const fields = [
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      options: suppliers,
      xs: 12,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      xs: 6,
      numberOnly: true,
    },
    { name: "uom", label: "UOM", xs: 6 },
    { name: "brand", label: "Brand", xs: 6 },
    { name: "model", label: "Model", xs: 6 },
    {
      name: "specs",
      label: "Specifications",
      placeholder: "Type here the specifications...",
      type: "textarea",
      xs: 12,
      multiline: true,
      minRows: 4,
      showHighlighter: false, // 👈 hide highlighter
      showAllFormatting: true, // 👈 show all other formatting
      sx: { "& textarea": { resize: "vertical" } },
    },
    {
      name: "unitPrice",
      label: "Unit Price",
      type: "number",
      xs: 6,
      numberOnly: true,
    },
    {
      name: "ewt",
      label: "EWT",
      type: "number",
      xs: 6,
      InputProps: { readOnly: true },
      numberOnly: true,
    },
  ];
  const handleCompareClick = (item, selectedOption) => {
    // Clear previous compare data
    setCompareData(null);

    // Prepare new compare data
    const data = {
      itemId: item.id,
      itemName: item.name,
      quantity: item.qty,
      specs: item.specs,
      uom: item.uom,
      abc: item.abc,
      // Only include the selected option
      purchaseOptions: [
        {
          supplierId: selectedOption.nSupplierId,
          supplierName:
            selectedOption.supplierName || selectedOption.strSupplierName,
          supplierNickName:
            selectedOption.supplierNickName || selectedOption.strSupplierNickName,
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
    // Set new compare data
    setCompareData(data);
    setIsCompareActive(true);
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      subTitle={transactionCode.trim() || ""}
      showSave={false}
      showFooter={true}
      width={isCompareActive ? 950 : 800}
      customLoading={itemsLoading} // <-- load instantly
    >
      <Box>
        {/* VERIFY MODAL */}
        {verifying && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => {
              setVerifying(false);
            }}
            onSave={() => confirmAction("verified")}
            actionWord="verifying"
            entityName={transaction.strTitle}
            saveButtonColor="success"
            saveButtonText="Confirm Verify"
          />
        )}
        {/* REVERT MODAL */}
        {reverting && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => {
              setReverting(false);
            }}
            onSave={() => confirmAction("reverted")}
            actionWord="verifying"
            entityName={transaction.strTitle}
            saveButtonColor="success"
            saveButtonText="Confirm Revert"
          />
        )}
        {/* FINALIZE MODAL */}
        {confirming && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => setConfirming(false)}
            onSave={() => confirmAction("finalized")}
            actionWord="finalizing"
            entityName={transaction.strTitle}
            saveButtonColor="success"
            saveButtonText="Confirm Finalize"
          />
        )}
        {/* Toast Alert at the very top */}
        {toast.open && (
          <Alert
            severity={toast.severity}
            sx={{
              mb: 2,
              width: "100%",
              position: "absolute",
              top: 16,
              left: 0,
              zIndex: 20,
            }}
            onClose={() =>
              setToast({ open: false, message: "", severity: "success" })
            }
          >
            {toast.message}
          </Alert>
        )}
        {loading && (
          <Box
            sx={{
              position: "fixed", // cover the whole screen
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1000, // higher than other elements
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: "rgba(255,255,255,0.7)",
              pointerEvents: "all", // block clicks
            }}
          >
            {/* Prevent scrolling */}
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            />
            <DotSpinner size={15} />
            <Typography sx={{ mt: 1 }}>{loadingMessage}</Typography>
          </Box>
        )}
        {!verifying && !reverting && !confirming && (
          <>
            {/* AlertBox below the toast */}
            <Box sx={{ mt: toast.open ? 6 : 0 }}>
              {" "}
              {/* optional margin if toast is open */}
              {!addingOptionItemId &&
                !addingNewItem &&
                deleteIndex === null &&
                deleteIndexOption === null &&
                !isCompareActive && (
                  <AlertBox>
                    <Grid container spacing={0.5}>
                      {/* Row 1: Transaction Code | ABC */}
                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>Transaction Code:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{ textAlign: "left", fontStyle: "italic" }}
                      >
                        {transaction.strCode ||
                          transaction.transactionId ||
                          "—"}
                      </Grid>

                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>ABC:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{ textAlign: "left", fontStyle: "italic" }}
                      >
                        {transaction.dTotalABC
                          ? `₱${Number(transaction.dTotalABC).toLocaleString()}`
                          : "—"}
                      </Grid>

                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>Title:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{
                          textAlign: "left",
                          fontStyle: "italic",
                          wordBreak: "break-word",
                          lineHeight: 1.2,
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                        }}
                      >
                        {transaction.strTitle ||
                          transaction.transactionName ||
                          "—"}
                      </Grid>

                      {/* AO DueDate | Doc Submission */}
                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>AO DueDate:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{
                          textAlign: "left",
                          fontStyle: "italic",
                          color:
                            transaction.dtAODueDate &&
                            (new Date(transaction.dtAODueDate) - new Date()) /
                              (1000 * 60 * 60 * 24) <=
                              4
                              ? "red"
                              : "inherit",
                        }}
                      >
                        {transaction.dtAODueDate
                          ? new Date(
                              transaction.dtAODueDate
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

                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>Doc Submission:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{
                          textAlign: "left",
                          fontStyle: "italic",
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
                              transaction.dtDocSubmission
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            })
                          : "—"}
                      </Grid>
                    </Grid>
                  </AlertBox>
                )}
            </Box>
            <Grid item xs={12} md={6}>
              {deleteIndex === null &&
                !addingOptionItemId &&
                deleteIndexOption === null &&
                !isCompareActive && (
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

                    {showAddButton &&
                      !addingNewItem &&
                      deleteIndex === null &&
                      deleteIndexOption === null && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setEditingItem(null);
                            setAddingNewItem(true);
                            setNewItemForm({
                              name: "",
                              specs: "",
                              qty: "",
                              uom: "",
                              abc: "",
                            });
                            setNewItemErrors({}); // <-- clear validation errors
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                  </Box>
                )}
              {addingNewItem ? (
                <Paper
                  sx={{ p: 2, borderRadius: 2, background: "#fafafa", mb: 1 }}
                >
                  <FormGrid
                    fields={[
                      { name: "name", label: "Item Name", xs: 12 },
                      {
                        label: "Specifications",
                        placeholder: "Type here the specifications...",
                        name: "specs",
                        xs: 12,
                        multiline: true,
                        minRows: 1,
                        showHighlighter: false,
                        sx: { "& textarea": { resize: "vertical" } },
                      },
                      {
                        name: "qty",
                        label: "Quantity",
                        type: "number",
                        xs: 4,
                        numberOnly: true,
                      },
                      { name: "uom", label: "UOM", xs: 4 },
                      {
                        name: "abc",
                        label: "Total ABC",
                        type: "number",
                        xs: 4,
                        numberOnly: true,
                      },
                    ]}
                    formData={newItemForm}
                    handleChange={handleNewItemChange}
                    errors={newItemErrors} // <-- pass errors here
                  />

                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <BackButton onClick={() => setAddingNewItem(false)} />
                    {editingItem ? (
                      <SaveButton onClick={() => updateItem(editingItem.id)} />
                    ) : (
                      <SaveButton onClick={saveNewItem} />
                    )}
                  </Box>
                </Paper>
              ) : deleteIndex !== null ? (
                <VerificationModalCard
                  entityName={items[deleteIndex]?.name}
                  verificationInput={deleteLetter}
                  setVerificationInput={setDeleteLetter}
                  verificationError={deleteError}
                  onBack={() => setDeleteIndex(null)}
                  onConfirm={confirmDelete}
                  actionWord="Delete"
                  confirmButtonColor="error"
                />
              ) : deleteIndexOption !== null ? (
                <VerificationModalCard
                  entityName={
                    items[deleteIndexOption.itemIndex]?.purchaseOptions[
                      deleteIndexOption.optionIndex
                    ]?.supplierName ||
                    items[deleteIndexOption.itemIndex]?.purchaseOptions[
                      deleteIndexOption.optionIndex
                    ]?.strSupplierName
                  }
                  verificationInput={deleteLetterOption}
                  setVerificationInput={setDeleteLetterOption}
                  verificationError={deleteErrorOption}
                  onBack={() => setDeleteIndexOption(null)}
                  onConfirm={confirmDeleteOption}
                  actionWord="Delete"
                  confirmButtonColor="error"
                />
              ) : items.length === 0 ? (
                <Box
                  sx={{
                    height: 200,
                    border: "1px dashed #bbb",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography>No items added yet</Typography>
                </Box>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {!isCompareActive &&
                      items
                        .filter(
                          (item) =>
                            !expandedItemId || expandedItemId === item.id
                        ) // only show expanded item or all if none expanded
                        .map((item) => (
                          <SortableTransactionItem
                            key={item.id}
                            item={item}
                            showAddButton={showAddButton}
                            showPurchaseOptions={showPurchaseOptions}
                            isNotVisibleCanvasVerification={
                              isNotVisibleCanvasVerification
                            }
                            expandedItemId={expandedItemId}
                            togglePurchaseOptions={togglePurchaseOptions}
                            addingOptionItemId={addingOptionItemId}
                            setAddingOptionItemId={setAddingOptionItemId}
                            formData={formData}
                            handleChange={handleChange}
                            handleChangeAdd={handleChangeAdd}
                            savePurchaseOption={savePurchaseOption}
                            handleEditOption={handleEditOption}
                            handleShowDeleteOptionModal={
                              handleShowDeleteOptionModal
                            }
                            handleToggleInclude={handleToggleInclude}
                            onEdit={(item) => {
                              setEditingItem(item);
                              setAddingNewItem(true);
                              setNewItemForm({
                                name: item.name,
                                specs: item.specs,
                                qty: item.qty,
                                uom: item.uom,
                                abc: item.abc,
                              });
                              setNewItemErrors({}); // <-- clear validation errors
                            }}
                            onDelete={handleShowDeleteModal}
                            setExpandedItemId={setExpandedItemId}
                            fields={fields}
                            purchaseOptionErrors={purchaseOptionErrors}
                            handleCompareClick={handleCompareClick}
                            crudOptionsEnabled={crudOptionsEnabled}
                            checkboxOptionsEnabled={checkboxOptionsEnabled}
                          />
                        ))}
                  </SortableContext>
                </DndContext>
              )}
            </Grid>
            {isCompareActive && compareData && (
              <>
                <AlertBox>
                  Comparison of the transaction{" "}
                  <strong>
                    <em>"{compareData.itemName}"</em>
                  </strong>{" "}
                  with the offer model{" ("}
                  <strong>
                    <em>{compareData.purchaseOptions[0].model}</em>
                  </strong>
                  {") "}
                  and brand{" ("}
                  <strong>
                    <em>{compareData.purchaseOptions[0].brand}</em>
                  </strong>
                  {") "}
                  from{" "}
                  <strong>
                    <em>"{compareData.purchaseOptions[0]?.supplierName}"</em>
                  </strong>
                  .
                </AlertBox>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-start",
                    overflowX: { xs: "auto", md: "visible" }, // scroll only on small screens
                  }}
                >
                  {/* ------------------- PARENT: ITEM INFO ------------------- */}
                  <Paper
                    sx={{
                      position: "relative",
                      flex: { xs: "0 0 300px", md: 1 }, // min-width 300px on small screens, full flex on large
                      minWidth: 300,
                      p: 1.5,
                      borderRadius: 3,
                      backgroundColor: "#F0F8FF",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      borderTop: "3px solid #115293",
                      borderBottom: "2px solid #ADD8E6",
                    }}
                  >
                    {/* Badge at top-right */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "#115293",
                        color: "#fff",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 3,
                        fontSize: "0.50rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Transaction Item
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Quantity:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {compareData.quantity}
                      </Box>{" "}
                      {compareData.uom}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      ABC:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        ₱{Number(compareData.abc).toLocaleString()}
                      </Box>
                    </Typography>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Specifications:
                      </Typography>

                      <FormGrid
                        fields={[
                          {
                            name: "specs",
                            label: "",
                            type: "textarea",
                            xs: 12,
                            multiline: true,
                            minRows: 2,
                            showAllFormatting: false,
                            hideHighlights: true, // <-- NEW PROP: hides highlights visually
                            readOnly: true,
                            sx: {
                              "& textarea": {
                                resize: "vertical",
                                userSelect: "text",
                                pointerEvents: "auto",
                                backgroundColor: "#fafafa",
                                borderRadius: 2,
                              },
                            },
                          },
                        ]}
                        formData={{ specs: compareData.specs }}
                        handleChange={() => {}}
                        errors={{}}
                        readOnly
                      />
                    </Box>
                  </Paper>

                  {/* ------------------- CHILD: PURCHASE OPTIONS ------------------- */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      flex: { xs: "0 0 300px", md: 1 }, // same as parent
                      minWidth: 300,
                    }}
                  >
                    {compareData.purchaseOptions.length > 0 ? (
                      compareData.purchaseOptions.map((option) => (
                        <Paper
                          key={option.supplierId}
                          sx={{
                            position: "relative",
                            flex: "1",
                            p: 1.5,
                            borderRadius: 3,
                            backgroundColor: "#F0FFF0",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0,
                            borderTop: "3px solid #28a745",
                            borderBottom: "2px solid #90EE90",
                          }}
                        >
                          {/* Badge at top-right */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              backgroundColor: "#28a745",
                              color: "#fff",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 3,
                              fontSize: "0.50rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            Purchase Option
                          </Box>

                          {/* Quantity, Unit Price */}
                          <Typography
                            variant="caption" // smaller than body2
                            color="text.secondary"
                          >
                            Quantity:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              {option.quantity}
                            </Box>{" "}
                            {option.uom} • Unit Price:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              ₱{option.unitPrice.toLocaleString()}
                            </Box>
                          </Typography>

                          {/* Total Price, EWT */}
                          <Typography variant="caption" color="text.secondary">
                            Total Price:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              ₱
                              {(
                                option.quantity * option.unitPrice
                              ).toLocaleString()}
                            </Box>{" "}
                            • EWT:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              ₱{option.ewt?.toLocaleString() || 0}
                            </Box>
                          </Typography>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              Specifications:
                            </Typography>

                            <FormGrid
                              fields={[
                                {
                                  name: "specs",
                                  label: "",
                                  type: "textarea",
                                  xs: 12,
                                  multiline: true,
                                  minRows: 2,
                                  // showOnlyHighlighter: true,
                                  showAllFormatting: false,
                                  readOnly: true,
                                  hideHighlights: true, // <-- NEW PROP: hides highlights visually
                                  sx: {
                                    "& textarea": {
                                      resize: "vertical",
                                      userSelect: "text",
                                      pointerEvents: "auto",
                                      backgroundColor: "#fafafa",
                                      borderRadius: 2,
                                    },
                                  },
                                },
                              ]}
                              formData={{ specs: option.specs }}
                              handleChange={() => {}}
                              errors={{}}
                              readOnly
                            />
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#fff",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No purchase options available
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* ACTION BUTTONS (HIDE WHEN ADDING NEW ITEM OR PURCHASE OPTIONS) */}
            {addingNewItem === false &&
              addingOptionItemId === null &&
              deleteIndexOption === null &&
              deleteIndex === null && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                    gap: 2,
                  }}
                >
                  {isCompareActive && (
                    <BackButton
                      label="Back"
                      onClick={() => setIsCompareActive(false)}
                    />
                  )}
                  {showVerify && (
                    <VerifyButton onClick={handleVerifyClick} label="Verify" />
                  )}

                  {showFinalize && (
                    <FinalizeButton
                      onClick={handleFinalizeClick}
                      label="Finalize"
                    />
                  )}
                  {showRevert && (
                    <RevertButton1 onClick={handleRevertClick} label="Revert" />
                  )}
                </Box>
              )}
          </>
        )}
      </Box>
    </ModalContainer>
  );
}

export default React.memo(TransactionCanvassingModal);
