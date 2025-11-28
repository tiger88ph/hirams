import React, { useState, useEffect, useCallback } from "react";
import { Box, Grid, Typography, IconButton, Paper, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import ModalContainer from "../../../common/ModalContainer";
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

  const {
    itemsManagementCode,
    itemsVerificationCode,
    forCanvasCode,
    canvasVerificationCode,
    itemVerificationRequestCode,
    canvasVerificationRequestCode,
    itemTypeGoods,
    goodsValue,
    serviceValue,
    vatValue,
    unitOfMeasurements,
  } = useMapping();

  // States for verify/revert/finalize modals
  const [cItemType, setCItemType] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);
  // --- Finalize Visibility Logic ---
  const statusCode = String(transaction.current_status);
  // A transaction is FINALIZABLE if its status code exists inside finalizeCode object
  const showVerify =
    Object.keys(itemVerificationRequestCode).includes(statusCode) ||
    Object.keys(canvasVerificationRequestCode).includes(statusCode);
  const showFinalize =
    Object.keys(itemsManagementCode).includes(statusCode) ||
    Object.keys(forCanvasCode).includes(statusCode);
  const showRevert = !Object.keys(itemsManagementCode).includes(statusCode);
  const showPurchaseOptions =
    Object.keys(forCanvasCode).includes(statusCode) ||
    Object.keys(canvasVerificationCode).includes(statusCode);
  const showAddButton = Object.keys(itemsManagementCode).includes(statusCode);
  const isNotVisibleCanvasVerification = !Object.keys(
    canvasVerificationCode
  ).includes(statusCode);

  //TOAST HANDLER
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
    setTimeout(
      () => setToast({ open: false, message: "", severity: "success" }),
      3000
    );
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
    }
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open, transaction]);
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
        itemTypeGoods, // pass the mapping here
        goodsValue,
        serviceValue,
        vatValue
      ),
    }));
  }, [
    formData.nSupplierId,
    formData.quantity,
    formData.unitPrice,
    cItemType,
    suppliers,
    itemTypeGoods,
    goodsValue,
    serviceValue,
    vatValue,
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
        itemTypeGoods,
        goodsValue,
        serviceValue,
        vatValue
      ),
    }));
  };
  const handleChangeAdd = () => {
    setFormData(initialFormData); // reset all fields
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
        itemTypeGoods,
        goodsValue,
        serviceValue,
        vatValue
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
  // ---------------------------------------------------------
  // ADD ITEM
  // ---------------------------------------------------------
  const saveNewItem = async () => {
    try {
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

      showToast("Item added successfully!", "success"); // ✅ here
    } catch (err) {
      console.error("Error saving new item:", err);
      showToast("Failed to add item.", "error"); // ✅ error case
    }
  };

  // ---------------------------------------------------------
  // EDIT ITEM
  // ---------------------------------------------------------
  const updateItem = async (id) => {
    try {
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

      showToast("Item updated successfully!", "success"); // ✅ here
    } catch (err) {
      console.error("Error updating item:", err.response?.data || err.message);
      showToast("Failed to update item.", "error"); // ✅ error case
    }
  };

  // ---------------------------------------------------------
  // DELETE ITEM
  // ---------------------------------------------------------
  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`transaction-items/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };
  // ---------------------------------------------------------
  // PURCHASE OPTIONS SAVE
  // ---------------------------------------------------------
  const savePurchaseOption = async () => {
    if (!addingOptionItemId) return;

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
      if (formData.id) {
        await api.put(`purchase-options/${formData.id}`, payload);
      } else {
        await api.post("purchase-options", payload);
      }

      await fetchItems();
      setFormData(initialFormData);
      setAddingOptionItemId(null);
    } catch (err) {
      console.error("Error saving purchase option:", err);
      setErrors(err.response?.data?.errors || { general: err.message });
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
  const handleDeleteOption = async (option) => {
    if (!confirm("Are you sure you want to delete this purchase option?"))
      return;
    try {
      await api.delete(`purchase-options/${option.id}`);
      await fetchItems();
    } catch (err) {
      console.error("Error deleting purchase option:", err);
    }
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
    try {
      setLoading(true);
      onClose();

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const endpointMap = {
        verify:
          transaction.status === "Canvas Verification"
            ? `transactions/${transaction.nTransactionId}/verify-ao-canvas`
            : `transactions/${transaction.nTransactionId}/verify-ao`,
        revert: `transactions/${transaction.nTransactionId}/revert`,
        finalize:
          transaction.status === "For Canvas" ||
          transaction.status === "Canvas Verification"
            ? `transactions/${transaction.nTransactionId}/finalize-ao-canvas`
            : `transactions/${transaction.nTransactionId}/finalize-ao`,
      };

      const payload =
        actionType === "revert"
          ? { user_id: userId, remarks: remarks.trim() || null }
          : { userId, remarks: remarks.trim() || null };

      await withSpinner(
        `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} transaction...`,
        async () => {
          await api.put(endpointMap[actionType], payload);
        }
      );

      await showSwal(
        "SUCCESS",
        {},
        { entity: transaction.strTitle, action: actionType }
      );

      setRemarks("");
      setVerifying(false);
      setReverting(false);
      setConfirming(false);

      if (actionType === "verify" && typeof onVerified === "function")
        onVerified();
      if (actionType === "revert" && typeof onReverted === "function")
        onReverted();
      if (actionType === "finalize" && typeof onFinalized === "function")
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
    { name: "quantity", label: "Quantity", type: "number", xs: 6 },
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
      sx: { "& textarea": { resize: "vertical" } },
    },
    { name: "unitPrice", label: "Unit Price", type: "number", xs: 6 },
    {
      name: "ewt",
      label: "EWT",
      type: "number",
      xs: 6,
      InputProps: { readOnly: true },
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      subTitle={transactionCode.trim() || ""}
      showSave={false}
      showFooter={true}
    >
      <Box>
        {/* VERIFY MODAL */}
        {verifying && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => setVerifying(false)}
            onSave={() => confirmAction("verify")}
            title={`Remarks for verifying "${transaction.strTitle}"`}
            placeholder="Optional: Add remarks for verification..."
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
            onBack={() => setReverting(false)}
            onSave={() => confirmAction("revert")}
            title={`Remarks for reverting "${transaction.strTitle}"`}
            placeholder="Optional: Add remarks for reverting..."
            saveButtonColor="error"
            saveButtonText="Confirm Revert"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}

        {/* FINALIZE MODAL */}
        {confirming && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => setConfirming(false)}
            onSave={() => confirmAction("finalize")}
            title={`Remarks for finalizing "${transaction.strTitle}"`}
            placeholder="Optional: Add remarks for finalization..."
            saveButtonColor="success"
            saveButtonText="Confirm Finalize"
          />
        )}

        {!verifying && !reverting && !confirming && (
          <>
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

            {/* AlertBox below the toast */}
            <Box sx={{ mt: toast.open ? 6 : 0 }}>
              {" "}
              {/* optional margin if toast is open */}
              <AlertBox>
                <Grid container spacing={2}>
                  {/* Row 1: Transaction Code | ABC */}
                  <Grid item xs={5} sx={{ textAlign: "left" }}>
                    <strong>Transaction Code:</strong>
                  </Grid>
                  <Grid
                    item
                    xs={7}
                    sx={{ textAlign: "left", fontStyle: "italic" }}
                  >
                    {transaction.strCode || transaction.transactionId || "—"}
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
                    {transaction.strTitle || transaction.transactionName || "—"}
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
                      ? new Date(transaction.dtAODueDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
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
                        (new Date(transaction.dtDocSubmission) - new Date()) /
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
            </Box>

            <Grid item xs={12} md={6}>
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

                {showAddButton && !addingNewItem && (
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
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

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
                        minRows: 1, // adjust number of visible rows
                        sx: { "& textarea": { resize: "vertical" } }, // allow vertical resize
                      },
                      { name: "qty", label: "Quantity", type: "number", xs: 4 },
                      {
                        name: "uom",
                        label: "UOM",
                        xs: 4,
                      },
                      {
                        name: "abc",
                        label: "Total ABC",
                        type: "number",
                        xs: 4,
                      },
                    ]}
                    formData={newItemForm}
                    handleChange={handleNewItemChange}
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
                    {items.map((item) => (
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
                        handleDeleteOption={handleDeleteOption}
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
                        }}
                        onDelete={handleDeleteItem}
                        setExpandedItemId={setExpandedItemId}
                        fields={fields}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </Grid>

            {/* ACTION BUTTONS (HIDE WHEN ADDING NEW ITEM OR PURCHASE OPTIONS) */}
            {addingNewItem === false && addingOptionItemId === null && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 4,
                  gap: 2,
                }}
              >
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

export default TransactionCanvassingModal;
