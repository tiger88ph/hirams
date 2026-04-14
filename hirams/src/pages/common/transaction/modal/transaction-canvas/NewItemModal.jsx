import React, { useState, useEffect, useRef } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../../utils/form/validation.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";

const initialFormData = {
  name: "",
  specs: "",
  qty: "",
  uom: "",
  abc: "",
};

// ── Main Modal ─────────────────────────────────────────────────────────────
function NewItemModal({
  open,
  onClose,
  editingItem,
  onSuccess,
  transactionId,
  transactionHasABC,
  transactionABC,
  totalItemsABC,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || "",
        specs: editingItem.specs || "",
        qty: editingItem.qty || "",
        uom: editingItem.uom || "",
        abc: editingItem.abc || "",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editingItem, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_ITEM");

    const itemABCValue = Number(formData.abc || 0);
    const otherItemsABC = editingItem
      ? totalItemsABC - Number(editingItem.abc || 0)
      : totalItemsABC;

    // Scenario 2: No transaction ABC → each item MUST have ABC
    if (!transactionHasABC) {
      if (!formData.abc || itemABCValue <= 0)
        validationErrors.abc =
          "Item ABC is required when transaction has no total ABC";
    }

    // Scenario 1: Has transaction ABC AND other items already have ABC → sum must not exceed
    if (transactionHasABC && otherItemsABC > 0 && itemABCValue > 0) {
      const newTotal = otherItemsABC + itemABCValue;
      if (newTotal > Number(transactionABC)) {
        validationErrors.abc = `Total items ABC (₱${newTotal.toLocaleString()}) would exceed Transaction ABC (₱${Number(transactionABC).toLocaleString()})`;
      }
    }

    // Scenario 1: Has transaction ABC AND *other* items already have ABC → this item must also have ABC
    if (transactionHasABC && otherItemsABC > 0) {
      if (!formData.abc || itemABCValue <= 0)
        validationErrors.abc =
          "Item ABC is required since other items have ABC values";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;
    const entity = formData.name?.trim() || "Transaction Item";
    const isEdit = Boolean(editingItem);
    try {
      handleClose();
      await withSpinner(entity, async () => {
        const payload = {
          nTransactionId: transactionId,
          strName: formData.name,
          strSpecs: formData.specs,
          nQuantity: Number(formData.qty),
          strUOM: formData.uom,
          dUnitABC: Number(formData.abc),
        };
        if (isEdit) {
          await api.put(`transaction-items/${editingItem.id}`, payload);
        } else {
          await api.post("transaction-items", payload);
        }
        await onSuccess();
      });
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isEdit ? "updated" : "added" },
      );
    } catch {
      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      onSave={handleSave}
      title={editingItem ? "Edit Item" : "Add New Item"}
      subTitle={formData.name?.trim() ? `/ ${formData.name.trim()}` : ""}
    >
      <FormGrid
        fields={[
          {
            name: "name",
            label: "Item Name",
            xs: 12,
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
            type: "peso",
            xs: 4,
            numberOnly: true,
            // required hint — show asterisk when abc is needed
            required: !transactionHasABC || totalItemsABC > 0,
          },
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
        ]}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
      />
    </ModalContainer>
  );
}

export default NewItemModal;
