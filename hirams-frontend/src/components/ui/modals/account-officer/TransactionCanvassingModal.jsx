import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Paper,
  Alert,
  Checkbox,
  Link,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

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
import { useNavigate } from "react-router-dom";
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
const buttonSm = {
  fontSize: "0.6rem",
  background: "#ffffff",
  border: "1px solid #cfd8dc",
  cursor: "pointer",
  color: "#1976d2",
  fontWeight: 600,
  borderRadius: "6px",
  padding: "2px 10px",
};

const SortableWrapper = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled, // ⬅ disables dragging inside dnd-kit
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: disabled ? "default" : "grab",
  };

  // When disabled → strip all drag behavior
  const dragAttributes = disabled ? {} : attributes;
  const dragListeners = disabled ? {} : listeners;

  return (
    <div ref={setNodeRef} style={style} {...dragAttributes} {...dragListeners}>
      {children}
    </div>
  );
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
  const navigate = useNavigate();

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
  const managementKey =
    Object.keys(userTypes)[1] || Object.keys(userTypes)[4] || "";

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
  const crudItemsEnabled = itemsManagementKey.includes(statusCode);

  const showAddButton = itemsManagementKey.includes(statusCode);
  const isNotVisibleCanvasVerification = canvasFinalizeKey.includes(statusCode);
  const crudOptionsEnabled = forCanvasKey.includes(statusCode);
  const checkboxOptionsEnabled = forCanvasKey.includes(statusCode);
  // const checkboxOptionsEnabled = (forCanvasKey.includes(statusCode) && !option.bIncluded);

  //OTHER
  const forVerificationKey = forCanvasKey || "";
  const canvasVerificationLabel = ao_status[canvasFinalizeKey] || "";
   const itemsManagementLabel = ao_status[itemsManagementKey] || "";
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
          nickName: s.strSupplierNickName,
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
            ? `transactions/${transaction.nTransactionId}/verify-ao`
            : `transactions/${transaction.nTransactionId}/verify-ao-canvas`,
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
    // Set new compare data
    setCompareData(data);
    setIsCompareActive(true);
  };
  const [expandedRows, setExpandedRows] = useState({}); // { [itemId]: "specs" | "options" | null }
  const [expandedOptions, setExpandedOptions] = useState({});
  const [failedOptions, setFailedOptions] = React.useState({});
  const isAdding = addingOptionItemId !== null;

  const toggleSpecsRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: prev[id] === "specs" ? null : "specs", // toggle specs, collapse options automatically
    }));
  };

  const toggleOptionsRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: prev[id] === "options" ? null : "options", // toggle options, collapse specs automatically
    }));
  };
  // For individual purchase option
  const toggleOptionSpecs = (optionId) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };
  const onEdit = (item) => {
    setEditingItem(item);
    setAddingNewItem(true);
    setNewItemForm({
      name: item.name,
      specs: item.specs,
      qty: item.qty,
      uom: item.uom,
      abc: item.abc,
    });

    setNewItemErrors({}); // clear validation errors
  };
  const totalCanvas = items.reduce((sum, item) => {
    const includedTotal = item.purchaseOptions
      .filter((opt) => opt.bIncluded)
      .reduce(
        (sub, opt) =>
          sub + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
        0
      );
    return sum + includedTotal;
  }, 0);

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
        {toast.open && (
          <Alert
            severity={toast.severity}
            sx={{
              position: "sticky", // stays at top while scrolling
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              width: "100%",
              textAlign: "center",
              borderRadius: 0,
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
        {deleteIndex !== null && (
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
        )}
        {deleteIndexOption !== null && (
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
        )}
        {!verifying && !reverting && !confirming && (
          <>
            {/* AlertBox below the toast */}
            <Box sx={{ mt: toast.open ? 1 : 0 }}>
              {!addingOptionItemId &&
                !addingNewItem &&
                deleteIndex === null &&
                deleteIndexOption === null &&
                !isCompareActive && (
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
                                sx={{ fontStyle: "italic", textAlign: "left" }}
                              >
                                {transaction.strCode ||
                                  transaction.transactionId ||
                                  "—"}
                              </Grid>
                            </Grid>
                            {/* ABC ROW */}
                            <Grid container sx={{ mt: "6px" }}>
                              <Grid item xs={3} sx={{ textAlign: "left" }}>
                                <strong>ABC:</strong>
                              </Grid>
                              <Grid
                                item
                                xs={9}
                                sx={{ fontStyle: "italic", textAlign: "left" }}
                              >
                                {transaction.dTotalABC
                                  ? `₱ ${Number(transaction.dTotalABC).toLocaleString()}`
                                  : "—"}
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
                                    textAlign: "left",
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
                                      transaction.dtDocSubmission
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
            </Box>
            <Grid item xs={12} md={6}>
              {deleteIndex === null &&
                !addingOptionItemId &&
                !addingNewItem &&
                deleteIndexOption === null &&
                !isCompareActive &&
                !isAdding && (
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
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {/* Add Option Button */}
                          <button
                            style={{
                              fontSize: "0.75rem",
                              background: "#fff",
                              border: "1px solid #cfd8dc",
                              cursor: "pointer",
                              color: "#1976d2",
                              fontWeight: 500,
                              borderRadius: "6px",
                              padding: "1px 8px",
                            }}
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
                            New Item
                          </button>
                        </Box>
                      )}
                  </Box>
                )}
              {!addingNewItem &&
                deleteIndex === null &&
                deleteIndexOption === null &&
                !isCompareActive &&
                !isAdding && (
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
                              <Grid item xs={1}>
                                Balance
                              </Grid>
                            )}
                            {(crudItemsEnabled || showPurchaseOptions) && (
                              <Grid item xs={showPurchaseOptions ? 2 : 1}>
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
                          onDragEnd={
                            crudItemsEnabled ? handleDragEnd : undefined
                          }
                        >
                          <SortableContext
                            items={items.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {items.map((item) => {
                              const includedQty = item.purchaseOptions
                                .filter((opt) => opt.bIncluded)
                                .reduce(
                                  (sum, opt) =>
                                    sum + Number(opt.nQuantity || 0),
                                  0
                                );
                              const includedTotal = item.purchaseOptions
                                .filter((opt) => opt.bIncluded)
                                .reduce(
                                  (sum, opt) =>
                                    sum +
                                    Number(opt.nQuantity || 0) *
                                      Number(opt.dUnitPrice || 0),
                                  0
                                );
                              const balanceQty = item.purchaseOptions
                                .filter((opt) => opt.bIncluded)
                                .reduce(
                                  (sum, opt) =>
                                    sum +
                                    Number(item.abc || 0) -
                                    Number(includedTotal || 0),
                                  0
                                );
                              const totalCanvas = items.reduce((sum, item) => {
                                const includedTotal = item.purchaseOptions
                                  .filter((opt) => opt.bIncluded)
                                  .reduce(
                                    (sub, opt) =>
                                      sub +
                                      Number(opt.nQuantity || 0) *
                                        Number(opt.dUnitPrice || 0),
                                    0
                                  );
                                return sum + includedTotal;
                              }, 0);

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
                                        mt: 1,
                                        p: 1,
                                        borderRadius: 1.5,
                                        borderLeft: "4px solid #1976d2",
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
                                            {item.nItemNumber}.{" "}
                                            {item.name || "—"}
                                          </Typography>

                                          <IconButton
                                            onClick={() =>
                                              toggleSpecsRow(item.id)
                                            }
                                            size="small"
                                          >
                                            <ArrowDropDownIcon
                                              sx={{
                                                transform:
                                                  expandedRows[item.id] ===
                                                  "specs"
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
                                              lineHeight: 0.9,
                                            }}
                                          >
                                            {includedQty} / {item.qty}
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
                                                textAlign: "left",
                                              }}
                                            >
                                              ₱{" "}
                                              {Number(
                                                includedTotal
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
                                          sx={{ textAlign: "left" }}
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
                                              }
                                            )}
                                          </Typography>
                                        </Grid>

                                        {/* Balance */}
                                        {showPurchaseOptions && (
                                          <Grid
                                            item
                                            xs={1}
                                            sx={{ textAlign: "left" }}
                                          >
                                            <Typography
                                              sx={{
                                                fontSize: ".7rem",
                                                lineHeight: 1.2,
                                              }}
                                            >
                                              ₱{" "}
                                              {Number(
                                                balanceQty
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                              })}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {(crudItemsEnabled ||
                                          showPurchaseOptions) && (
                                          <>
                                            {/* Right-side icons container */}
                                            <Grid
                                              item
                                              xs={showPurchaseOptions ? 2 : 1}
                                              sx={{
                                                display: "flex",
                                                justifyContent: "flex-end", //showPurchaseOptions ? "flex-end" : "flex-center"
                                                alignItems: "center",
                                                position: "relative", // <-- needed for overlap
                                              }}
                                            >
                                              {/* Pencil Icon */}
                                              {crudItemsEnabled && (
                                                <>
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onEdit(item);
                                                    }}
                                                  >
                                                    <EditIcon
                                                      sx={{
                                                        fontSize: "0.90rem",
                                                      }}
                                                    />
                                                  </IconButton>

                                                  {/* Delete Icon */}
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      // Pass the item ID to the parent to show the modal
                                                      handleShowDeleteModal(
                                                        item
                                                      ); // pass the whole item instead of just ID
                                                    }}
                                                  >
                                                    <DeleteIcon
                                                      sx={{
                                                        fontSize: "0.90rem",
                                                      }}
                                                    />
                                                  </IconButton>
                                                </>
                                              )}
                                              {/* Arrow Dropdown */}
                                              {showPurchaseOptions && (
                                                <IconButton
                                                  size="small"
                                                  sx={{
                                                    position: "relative",
                                                    marginRight: 6,
                                                  }}
                                                  onClick={() =>
                                                    toggleOptionsRow(item.id)
                                                  }
                                                >
                                                  <ArrowDropDownIcon
                                                    sx={{
                                                      transform:
                                                        expandedRows[
                                                          item.id
                                                        ] === "options"
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
                                                    expandedRows[item.id] !==
                                                      "options" && (
                                                      <Box
                                                        sx={{
                                                          position: "absolute",
                                                          top: "1px",
                                                          right: "-3px",
                                                          backgroundColor:
                                                            "#d9ecff", // light blue
                                                          color: "#1976d2",
                                                          width: "14px",
                                                          height: "14px",
                                                          fontSize: "0.50rem",
                                                          borderRadius: "50%", // <-- perfect circle
                                                          border:
                                                            "1px solid #90caf9",
                                                          display: "flex",
                                                          alignItems: "center",
                                                          justifyContent:
                                                            "center", // center text
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
                                    {expandedRows[item.id] === "specs" && (
                                      <Paper
                                        elevation={1}
                                        sx={{
                                          mt: 0.5,
                                          borderRadius: 2,
                                          background: "#f9f9f9",
                                          borderLeft: "2px solid #2e7d32",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {/* Top Header */}
                                        <Box
                                          sx={{
                                            px: 2,
                                            py: 0.5,
                                            backgroundColor: "#e3f2fd",
                                            borderBottom: "1px solid #cfd8dc",
                                            fontWeight: 400,
                                            color: "#1976d2",
                                            fontSize: "0.75rem",
                                            borderTopLeftRadius: 8,
                                            borderTopRightRadius: 8,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <span>Specifications:</span>

                                          <Box sx={{ display: "flex", gap: 1 }}>
                                            {/* Hide Button */}
                                            <button
                                              style={{
                                                fontSize: "0.6rem",
                                                background: "#fff",
                                                border: "1px solid #cfd8dc",
                                                cursor: "pointer",
                                                color: "#1976d2",
                                                fontWeight: 500,
                                                borderRadius: "6px",
                                                padding: "1px 8px",
                                              }}
                                              onClick={() =>
                                                toggleSpecsRow(item.id)
                                              }
                                            >
                                              Hide
                                            </button>
                                          </Box>
                                        </Box>
                                        <Box
                                          sx={{
                                            px: 2,
                                            py: 1,
                                            maxHeight: 120,
                                            overflowY: "auto",
                                            backgroundColor: "#f4faff",

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
                                              item.specs ||
                                              "No data available.",
                                          }}
                                        />
                                      </Paper>
                                    )}

                                    {/* OPTIONS */}
                                    {expandedRows[item.id] === "options" && (
                                      <Paper
                                        elevation={2}
                                        sx={{
                                          mt: 0.5,
                                          borderLeft: "2px solid #2e7d32",
                                          borderRadius: 2.5,
                                          overflow: "hidden",
                                          background: "#ffffff",
                                        }}
                                      >
                                        {/* HEADER */}
                                        <Box
                                          sx={{
                                            px: 2,
                                            py: 0.5,
                                            backgroundColor: "#e9f5ff",
                                            borderBottom: "1px solid #d3e3eb",
                                            color: "#1976d2",
                                            fontSize: "0.75rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <span>Purchase Options</span>

                                          <Box sx={{ display: "flex", gap: 1 }}>
                                            {checkboxOptionsEnabled && (
                                              <button
                                                style={buttonSm}
                                                onClick={() => {
                                                  setAddingOptionItemId(
                                                    item.id
                                                  );
                                                  setExpandedItemId(item.id);
                                                  handleChangeAdd(item.id);
                                                }}
                                              >
                                                New Option
                                              </button>
                                            )}
                                            <button
                                              style={buttonSm}
                                              onClick={() =>
                                                toggleOptionsRow(item.id)
                                              }
                                            >
                                              Hide
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
                                              flex: 2,
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
                                            Brand / Model
                                          </Box>
                                          <Box
                                            sx={{
                                              flex: 1,
                                              textAlign: "center",
                                            }}
                                          >
                                            Qty
                                          </Box>
                                          <Box
                                            sx={{
                                              flex: 2,
                                              textAlign: "center",
                                            }}
                                          >
                                            Unit Price
                                          </Box>
                                          <Box
                                            sx={{
                                              flex: checkboxOptionsEnabled
                                                ? 1
                                                : 2,
                                              textAlign: "center",
                                            }}
                                          >
                                            EWT
                                          </Box>
                                          <Box
                                            sx={{
                                              flex: 2,
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
                                        {item.purchaseOptions.map(
                                          (option, index) => {
                                            const showActionIcons =
                                              checkboxOptionsEnabled &&
                                              !option.bIncluded;

                                            return (
                                              <React.Fragment key={option.id}>
                                                <Paper
                                                  elevation={0}
                                                  sx={{
                                                    px: 1.2,
                                                    py: 0.7,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: "#f8fcff",
                                                    borderBottom:
                                                      "1px solid #eee",
                                                    transition:
                                                      "background 0.2s",
                                                    "&:hover": {
                                                      background: "#f0f8ff",
                                                    },
                                                  }}
                                                >
                                                  {/* Description + Expand Icon */}
                                                  <Box
                                                    sx={{
                                                      flex: 2,
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent:
                                                        "space-between",
                                                    }}
                                                  >
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                      }}
                                                    >
                                                      <Checkbox
                                                        checked={
                                                          !!option.bIncluded
                                                        }
                                                        disabled={
                                                          !checkboxOptionsEnabled
                                                        }
                                                        onChange={(e) => {
                                                          const num = (v) =>
                                                            Number(v ?? 0);

                                                          const itemQty = num(
                                                            item.nQuantity ??
                                                              item.qty
                                                          );
                                                          const itemABC = num(
                                                            item.dUnitABC ??
                                                              item.abc
                                                          );

                                                          const optionQty = num(
                                                            option.nQuantity ??
                                                              option.quantity
                                                          );
                                                          const optionUnitPrice =
                                                            num(
                                                              option.dUnitPrice ??
                                                                option.dUnitABC ??
                                                                option.abc
                                                            );

                                                          const purchasePrice =
                                                            optionQty *
                                                            optionUnitPrice;

                                                          // Reset previous error
                                                          setFailedOptions(
                                                            (prev) => ({
                                                              ...prev,
                                                              [option.id]: null,
                                                            })
                                                          );

                                                          // Validation: Quantity
                                                          if (
                                                            optionQty > itemQty
                                                          ) {
                                                            setFailedOptions(
                                                              (prev) => ({
                                                                ...prev,
                                                                [option.id]:
                                                                  "quantity",
                                                              })
                                                            );

                                                            showToast(
                                                              `Purchase option's quantity (${optionQty}) exceeds ITEM QUANTITY (${itemQty}). Include rejected.`,
                                                              "error"
                                                            );

                                                            // Clear red highlight after 6 seconds
                                                            setTimeout(() => {
                                                              setFailedOptions(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [option.id]:
                                                                    null,
                                                                })
                                                              );
                                                            }, 6000);

                                                            return;
                                                          }

                                                          // Validation: Price
                                                          if (
                                                            purchasePrice >
                                                            itemABC
                                                          ) {
                                                            setFailedOptions(
                                                              (prev) => ({
                                                                ...prev,
                                                                [option.id]:
                                                                  "price",
                                                              })
                                                            );

                                                            showToast(
                                                              `Purchase price (₱${purchasePrice.toLocaleString()}.00) exceeds ITEM ABC (₱${itemABC.toLocaleString()}.00). Include rejected.`,
                                                              "error"
                                                            );

                                                            // Clear red highlight after 6 seconds
                                                            setTimeout(() => {
                                                              setFailedOptions(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [option.id]:
                                                                    null,
                                                                })
                                                              );
                                                            }, 6000);

                                                            return;
                                                          }

                                                          // ✅ Update handler
                                                          handleToggleInclude(
                                                            item.id,
                                                            option.id,
                                                            e.target.checked
                                                          );

                                                          // Success toast
                                                          showToast(
                                                            e.target.checked
                                                              ? `Purchase option included successfully. Quantity: ${optionQty}, Total Price: ₱${purchasePrice.toLocaleString()}.00`
                                                              : `Purchase option removed. Quantity: ${optionQty}, Total Price: ₱${purchasePrice.toLocaleString()}.00`,
                                                            "success"
                                                          );
                                                        }}
                                                      />
                                                      <Typography
                                                        sx={{
                                                          fontSize: "0.75rem",
                                                          fontWeight: 500,
                                                        }}
                                                      >
                                                        {index + 1}.{" "}
                                                        {option.supplierNickName ||
                                                          option.strSupplierNickName}
                                                      </Typography>
                                                    </Box>

                                                    <ArrowDropDownIcon
                                                      sx={{
                                                        fontSize: 22,
                                                        transform:
                                                          expandedOptions[
                                                            option.id
                                                          ]
                                                            ? "rotate(180deg)"
                                                            : "rotate(0deg)",
                                                        transition: "0.25s",
                                                        cursor: "pointer",
                                                      }}
                                                      onClick={() =>
                                                        toggleOptionSpecs(
                                                          option.id
                                                        )
                                                      }
                                                    />
                                                  </Box>

                                                  {/* BRAND / MODEL */}
                                                  <Box
                                                    sx={{
                                                      flex: 2,
                                                      textAlign: "left",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.7rem",
                                                      }}
                                                    >
                                                      {option.strBrand} |{" "}
                                                      {option.strModel}
                                                    </Typography>
                                                  </Box>

                                                  {/* QUANTITY */}
                                                  <Box
                                                    sx={{
                                                      flex: 1,
                                                      textAlign: "center",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.7rem",
                                                        color:
                                                          failedOptions[
                                                            option.id
                                                          ] === "quantity" ||
                                                          failedOptions[
                                                            option.id
                                                          ] === "price"
                                                            ? "error.main"
                                                            : "text.primary",
                                                        fontWeight:
                                                          failedOptions[
                                                            option.id
                                                          ]
                                                            ? 600
                                                            : 400, // optional: bold for error
                                                      }}
                                                    >
                                                      {option.nQuantity}{" "}
                                                      {option.strUOM}
                                                    </Typography>
                                                  </Box>

                                                  {/* UNIT PRICE */}
                                                  <Box
                                                    sx={{
                                                      flex: 2,
                                                      textAlign: "center",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.7rem",
                                                      }}
                                                    >
                                                      ₱{" "}
                                                      {Number(
                                                        option.dUnitPrice
                                                      ).toLocaleString(
                                                        undefined,
                                                        {
                                                          minimumFractionDigits: 2,
                                                        }
                                                      )}
                                                    </Typography>
                                                  </Box>

                                                  {/* EWT */}
                                                  <Box
                                                    sx={{
                                                      flex: 1,
                                                      textAlign: "center",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.7rem",
                                                      }}
                                                    >
                                                      ₱{" "}
                                                      {Number(
                                                        option.dEWT
                                                      ).toLocaleString(
                                                        undefined,
                                                        {
                                                          minimumFractionDigits: 2,
                                                        }
                                                      )}
                                                    </Typography>
                                                  </Box>

                                                  {/* TOTAL */}
                                                  <Box
                                                    sx={{
                                                      flex: 2,
                                                      textAlign: "center",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.7rem",
                                                        color:
                                                          failedOptions[
                                                            option.id
                                                          ] === "quantity" ||
                                                          failedOptions[
                                                            option.id
                                                          ] === "price"
                                                            ? "error.main"
                                                            : "text.primary",
                                                        fontWeight:
                                                          failedOptions[
                                                            option.id
                                                          ]
                                                            ? 600
                                                            : 400,
                                                      }}
                                                    >
                                                      ₱{" "}
                                                      {Number(
                                                        option.nQuantity *
                                                          option.dUnitPrice
                                                      ).toLocaleString(
                                                        undefined,
                                                        {
                                                          minimumFractionDigits: 2,
                                                        }
                                                      )}
                                                    </Typography>
                                                  </Box>

                                                  {/* ACTION ICONS */}
                                                  {checkboxOptionsEnabled && (
                                                  <Box
                                                    sx={{
                                                      flex: 1,
                                                      display: "flex",
                                                      justifyContent: "center",
                                                      alignItems: "center",
                                                      gap: 0.5,
                                                    }}
                                                  >
                                                    {showActionIcons ? (
                                                      <>
                                                        <IconButton
                                                          size="small"
                                                          onClick={() =>
                                                            handleEditOption(
                                                              option
                                                            )
                                                          }
                                                        >
                                                          <EditIcon
                                                            sx={{
                                                              fontSize: ".9rem",
                                                            }}
                                                          />
                                                        </IconButton>

                                                        <IconButton
                                                          size="small"
                                                          onClick={() =>
                                                            handleShowDeleteOptionModal(
                                                              item.id,
                                                              option
                                                            )
                                                          }
                                                        >
                                                          <DeleteIcon
                                                            sx={{
                                                              fontSize: ".9rem",
                                                            }}
                                                          />
                                                        </IconButton>
                                                      </>
                                                    ) : (
                                                      <Box
                                                        sx={{
                                                          backgroundColor:
                                                            "#d9ecff",
                                                          color: "#1976d2",
                                                          px: 1,
                                                          py: 0.3,
                                                          borderRadius: "12px",
                                                          fontSize: "0.65rem",
                                                          fontWeight: 600,
                                                        }}
                                                      >
                                                        Included
                                                      </Box>
                                                    )}
                                                  </Box>
                                                  )}
                                                </Paper>

                                                {/* SPECS DROPDOWN */}
                                                {expandedOptions[option.id] && (
                                                  <Paper
                                                    elevation={1}
                                                    sx={{
                                                      mx: 1.2,
                                                      mt: 0.5,
                                                      mb: 1,
                                                      borderRadius: 2,
                                                      background: "#f7fbff",
                                                      overflow: "hidden",
                                                    }}
                                                  >
                                                    {/* SPECS HEADER */}
                                                    <Box
                                                      sx={{
                                                        px: 2,
                                                        py: 0.8,
                                                        backgroundColor:
                                                          "#e9f5ff",
                                                        borderBottom:
                                                          "1px solid #d3e3eb",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        color: "#1976d2",
                                                        display: "flex",
                                                        justifyContent:
                                                          "space-between",
                                                        alignItems: "center",
                                                      }}
                                                    >
                                                      <span>
                                                        Specifications
                                                      </span>

                                                      <Box
                                                        sx={{
                                                          display: "flex",
                                                          gap: 1,
                                                        }}
                                                      >
                                                        <button
                                                          style={buttonSm}
                                                          onClick={() =>
                                                            handleCompareClick(
                                                              item,
                                                              option
                                                            )
                                                          }
                                                        >
                                                          Compare
                                                        </button>
                                                        <button
                                                          style={buttonSm}
                                                          onClick={() =>
                                                            toggleOptionSpecs(
                                                              option.id
                                                            )
                                                          }
                                                        >
                                                          Hide
                                                        </button>
                                                      </Box>
                                                    </Box>

                                                    {/* SPECS CONTENT */}
                                                    <Box
                                                      sx={{
                                                        px: 2,
                                                        py: 1,
                                                        maxHeight: 140,
                                                        overflowY: "auto",
                                                        backgroundColor:
                                                          "#fdfdfd",
                                                        fontSize: "0.75rem",
                                                        color: "#555",
                                                        lineHeight: 1.35,
                                                        "& li": {
                                                          marginBottom: "2px",
                                                        },
                                                      }}
                                                      dangerouslySetInnerHTML={{
                                                        __html:
                                                          option.strSpecs ||
                                                          "No specifications available.",
                                                      }}
                                                    />
                                                  </Paper>
                                                )}
                                              </React.Fragment>
                                            );
                                          }
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
              {addingNewItem && (
                <>
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
                </>
              )}
              {isAdding && (
                <>
                  <FormGrid
                    fields={fields}
                    formData={formData}
                    errors={purchaseOptionErrors}
                    handleChange={handleChange}
                    handleSwitchChange={handleSwitchChange}
                  />
                  <Box sx={{ textAlign: "right", mt: 1 }}>
                    <Typography variant="caption">
                      New Client?{" "}
                      <Link
                        component="button"
                        underline="hover"
                        color="primary"
                        onClick={() => {
                          setAddingOptionItemId(null); // close the current form
                          navigate("/a-supplier?add=true"); // navigate to add supplier page
                        }}
                      >
                        Click here
                      </Link>
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <BackButton onClick={() => setAddingOptionItemId(null)} />
                    <SaveButton onClick={savePurchaseOption} />
                  </Box>
                </>
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
