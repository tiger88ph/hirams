import React, { useState, useEffect } from "react";

import {
  Box,
  Grid,
  Typography,
  Divider,
  IconButton,
  Paper,
} from "@mui/material";
import ModalContainer from "../../../common/ModalContainer";
import api from "../../../../utils/api/api";
import useMapping from "../../../../utils/mappings/useMapping";

import TransactionDetailsLeft from "../../account-officer/TransactionDetailsLeft";
import TransactionItemsRight from "../../account-officer/TransactionItemsRight";
import { UOM_OPTIONS } from "../../../../components/ui/account-officer/uomOptions";
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

function ATransactionInfoModal({ open, onClose, transaction }) {
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    specs: "",
    qty: "",
    uom: "",
    abc: "",
    purchasePrice: "",
  });

  const { procMode, procSource, itemType } = useMapping();

  // Fetch suppliers
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

  // Fetch transaction items
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

  const details = transaction;
  const itemTypeLabel = itemType?.[details.cItemType] || details.cItemType;
  const procModeLabel = procMode?.[details.cProcMode] || details.cProcMode;
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const togglePurchaseOptions = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    setAddingOptionItemId(null);
  };

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

      await fetchItems(); // refresh items properly
      setFormData(initialFormData);
      setErrors({});
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
      await fetchItems(); // refresh items properly
    } catch (err) {
      console.error("Error updating included status:", err);
      // revert on failure
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                purchaseOptions: item.purchaseOptions.map((option) =>
                  option.id === optionId
                    ? { ...option, bIncluded: !value }
                    : option
                ),
              }
            : item
        )
      );
    }
  };
  const [editingItem, setEditingItem] = useState(null);

  const updateItem = async (id) => {
    try {
      const payload = {
        nTransactionId: transaction.nTransactionId, // ✅ REQUIRED BY BACKEND
        strName: newItemForm.name,
        strSpecs: newItemForm.specs,
        nQuantity: Number(newItemForm.qty),
        strUOM: newItemForm.uom,
        dUnitABC: Number(newItemForm.abc),
      };

      await api.put(`transaction-items/${id}`, payload);
      await fetchItems();
      setNewItemForm({ name: "", specs: "", qty: "", uom: "", abc: "" });
      setAddingNewItem(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Error updating item:", err.response?.data || err.message);
    }
  };

  const fields = [
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      xs: 12,
      options: suppliers,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    { name: "quantity", label: "Quantity", type: "number", xs: 6 },
    {
      name: "uom",
      label: "UOM",
      type: "select",
      xs: 6,
      options: UOM_OPTIONS, // ✅ Reused constant
    },
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
      width={1080}
      showFooter={true}
      showSave={false}
    >
      <Box>
        <Grid container spacing={0}>
          {/* Left Info */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              maxHeight: "70vh",
              overflowY: "auto",
              pr: 1,
              /* Hide scrollbar for WebKit browsers (Chrome, Safari, Edge) */
              "&::-webkit-scrollbar": {
                display: "none",
              },
              /* Hide scrollbar for Firefox */
              scrollbarWidth: "none",
              /* Hide scrollbar for IE/Edge */
              "-ms-overflow-style": "none",
            }}
          >
            <TransactionDetailsLeft
              details={details}
              itemTypeLabel={itemTypeLabel}
              procModeLabel={procModeLabel}
              procSourceLabel={procSourceLabel}
              formatDateTime={formatDateTime}
            />
          </Grid>

          {/* Right Items */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              maxHeight: "70vh",
              overflowY: "auto",
              pr: 1,
              /* Hide scrollbar for WebKit browsers (Chrome, Safari, Edge) */
              "&::-webkit-scrollbar": {
                display: "none",
              },
              /* Hide scrollbar for Firefox */
              scrollbarWidth: "none",
              /* Hide scrollbar for IE/Edge */
              "-ms-overflow-style": "none",
            }}
          >
            <TransactionItemsRight
              items={items}
              setItems={setItems}
              addingNewItem={addingNewItem}
              setAddingNewItem={setAddingNewItem}
              newItemForm={newItemForm}
              setNewItemForm={setNewItemForm}
              handleNewItemChange={handleNewItemChange}
              saveNewItem={saveNewItem}
              updateItem={updateItem}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
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
          </Grid>
        </Grid>
      </Box>
    </ModalContainer>
  );
}

export default ATransactionInfoModal;
