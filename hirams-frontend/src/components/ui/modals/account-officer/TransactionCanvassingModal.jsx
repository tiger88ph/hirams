import React, { useState, useEffect, useCallback } from "react";

import { Box, Grid, Typography, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import ModalContainer from "../../../common/ModalContainer";
import api from "../../../../utils/api/api";
import useMapping from "../../../../utils/mappings/useMapping";
import AlertBox from "../../../common/AlertBox";
import FormGrid from "../../../common/FormGrid";
import { SaveButton, BackButton } from "../../../common/Buttons";
import { UOM_OPTIONS } from "../../account-officer/uomOptions";
import {
  VerifyButton,
  FinalizeButton,
  RevertButton1,
} from "../../../common/Buttons";
// Add at the top:
import RemarksModalCard from "../../../common/RemarksModalCard";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { withSpinner, showSwal } from "../../../../utils/swal";

// Drag & Drop
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

function TransactionCanvassingModal({ open, onClose, transaction }) {
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

  const { procMode, procSource, itemType } = useMapping();
  // Inside the component, add states:
  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    }
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open, transaction]);

  if (!open || !transaction) return null;

  // ---------------------------------------------------------
  // UTILS
  // ---------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItemForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (value) => {
    setFormData((prev) => ({ ...prev, nSupplierId: Number(value) }));
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
    } catch (err) {
      console.error("Error saving new item:", err);
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
    } catch (err) {
      console.error("Error updating item:", err.response?.data || err.message);
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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
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

  // --- Handlers ---
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

  const confirmVerify = async () => {
    try {
      setLoading(true);
      onClose();
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Verifying transaction...`, async () => {
        await api.put(`transactions/${transaction.nTransactionId}/verify`, {
          userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transaction.strTitle, action: "verified" }
      );
      setRemarks("");
      setVerifying(false);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transaction.strTitle });
    } finally {
      setLoading(false);
    }
  };

  const confirmRevert = async () => {
    try {
      setLoading(true);
      onClose();
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Reverting transaction...`, async () => {
        await api.put(`transactions/${transaction.nTransactionId}/revert`, {
          user_id: userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transaction.strTitle, action: "reverted" }
      );
      setRemarks("");
      setReverting(false);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transaction.strTitle });
    } finally {
      setLoading(false);
    }
  };
  const handleFinalizeClick = () => {
    setConfirming(true);
    setRemarks("");
    setRemarksError("");
  };

  const confirmFinalize = async () => {
    try {
      setLoading(true);
      onClose();
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Finalizing transaction...`, async () => {
        await api.put(`transactions/${transaction.nTransactionId}/finalize`, {
          userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transaction.strTitle, action: "finalized" }
      );
      setRemarks("");
      setConfirming(false);
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
    { name: "uom", label: "UOM", type: "select", xs: 6, options: UOM_OPTIONS },
    { name: "brand", label: "Brand", xs: 6 },
    { name: "model", label: "Model", xs: 6 },
    { name: "specs", label: "Specs", xs: 12 },
    { name: "unitPrice", label: "Unit Price", type: "number", xs: 6 },
    { name: "ewt", label: "EWT", type: "number", xs: 6 },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      showSave={false}
      showFooter={true}
    >
      <Box>
        {/* =====================================================
           RIGHT CONTENT NOW INLINED HERE — NO MORE COMPONENT
           ===================================================== */}
        {/* --- Remarks Modal for Verify / Revert --- */}
        {verifying && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => setVerifying(false)}
            onSave={confirmVerify}
            title={`Remarks for verifying "${transaction.strTitle}"`}
            placeholder="Optional: Add remarks for verification..."
            saveButtonColor="success"
            saveButtonText="Confirm Verify"
          />
        )}

        {reverting && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => setReverting(false)}
            onSave={confirmRevert}
            title={`Remarks for reverting "${transaction.strTitle}"`}
            placeholder="Optional: Add remarks for reverting..."
            saveButtonColor="error"
            saveButtonText="Confirm Revert"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {confirming && (
          <RemarksModalCard
            remarks={remarks}
            setRemarks={setRemarks}
            remarksError={remarksError}
            onBack={() => setConfirming(false)}
            onSave={confirmFinalize}
            title={`Remarks for finalizing "${transaction.strTitle}"`}
            placeholder="Optional: Add remarks for finalization..."
            saveButtonColor="success"
            saveButtonText="Confirm Finalize"
          />
        )}
        {!(verifying || reverting || confirming) && (
          <>
            <AlertBox>
              Transaction{" "}
              <strong>
                {transaction.strCode || transaction.transactionId || "—"}
              </strong>{" "}
              titled "
              <strong>
                {transaction.strTitle || transaction.transactionName || "—"}
              </strong>
              " has a total ABC of{" "}
              <strong>
                {transaction.dTotalABC
                  ? `₱${Number(transaction.dTotalABC).toLocaleString()}`
                  : "—"}
              </strong>
              . The account officer due date is{" "}
              <strong>
                {transaction.dtAODueDate
                  ? new Date(transaction.dtAODueDate).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—"}
              </strong>
              , and the document submission date is{" "}
              <strong>
                {transaction.dtDocSubmission
                  ? new Date(transaction.dtDocSubmission).toLocaleString(
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
              </strong>
              .
            </AlertBox>
            <Grid
              item
              xs={12}
              md={6}
              sx={{ maxHeight: "70vh", overflowY: "auto" }}
            >
              {/* HEADER */}
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

                {transaction?.status === "Items Management" && (
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

              {/* ADD / EDIT ITEM FORM */}
              {addingNewItem && (
                <Paper
                  sx={{ p: 2, borderRadius: 2, background: "#fafafa", mb: 1 }}
                >
                  <FormGrid
                    fields={[
                      { name: "name", label: "Item Name", xs: 12 },
                      { name: "specs", label: "Specs", xs: 12 },
                      { name: "qty", label: "Quantity", type: "number", xs: 4 },
                      {
                        name: "uom",
                        label: "UOM",
                        type: "select",
                        xs: 4,
                        options: UOM_OPTIONS,
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
                    sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}
                  >
                    <BackButton onClick={() => setAddingNewItem(false)} />

                    {editingItem ? (
                      <SaveButton onClick={() => updateItem(editingItem.id)} />
                    ) : (
                      <SaveButton onClick={saveNewItem} />
                    )}
                  </Box>
                </Paper>
              )}

              {/* LIST */}
              {items.length === 0 ? (
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
                  <Typography>No items loaded</Typography>
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
                        status={transaction?.status} // ✅ use actual status
                        canEdit={transaction?.status === "Items Management"}
                        onEdit={(i) => {
                          setEditingItem(i);
                          setNewItemForm({
                            name: i.name,
                            specs: i.specs,
                            qty: i.qty,
                            uom: i.uom,
                            abc: i.abc,
                          });
                          setAddingNewItem(true);
                        }}
                        onDelete={handleDeleteItem}
                        expandedItemId={expandedItemId}
                        addingOptionItemId={addingOptionItemId}
                        togglePurchaseOptions={togglePurchaseOptions}
                        formData={formData}
                        errors={errors}
                        fields={fields}
                        handleChange={handleChange}
                        handleSwitchChange={handleSwitchChange}
                        handleEditOption={handleEditOption}
                        handleDeleteOption={handleDeleteOption}
                        handleToggleInclude={handleToggleInclude}
                        setAddingOptionItemId={setAddingOptionItemId}
                        savePurchaseOption={savePurchaseOption}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </Grid>

            {/* ==============================
                ACTION BUTTONS (FIXED)
                ================================ */}
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}
            >
              {(() => {
                const loggedUser = JSON.parse(localStorage.getItem("user"));
                const loggedUserId = loggedUser?.nUserId;

                const transactionUserId = transaction?.nUserId;
                const isDraft = transaction?.status === "Draft";

                const isNotDraft = !isDraft;

                // SAFETY: ensure IDs exist
                if (!loggedUserId || !transactionUserId) return null;

                // SHOW VERIFY BUTTON IF:
                // - NOT DRAFT
                // - LOGGED USER IS NOT THE OWNER OF TRANSACTION
                if (isNotDraft && loggedUserId !== transactionUserId) {
                  return (
                    <VerifyButton onClick={handleVerifyClick} label="Verify" />
                  );
                }

                return null;
              })()}

              {/* FINALIZE BUTTON 
            Show only if status is "Items Verification"*/}
              {transaction?.status === "Items Management" && (
                <FinalizeButton
                  onClick={handleFinalizeClick}
                  label="Finalize"
                />
              )}

              {/* REVERT BUTTON — optional */}
              {transaction?.status !== "Items Management" && (
                <RevertButton1 onClick={handleRevertClick} label="Revert" />
              )}
            </Box>
          </>
        )}
      </Box>
    </ModalContainer>
  );
}

export default TransactionCanvassingModal;
