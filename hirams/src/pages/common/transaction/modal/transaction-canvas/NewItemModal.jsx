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

    if (!transactionHasABC) {
      if (!formData.abc || Number(formData.abc) <= 0)
        validationErrors.abc = `${uiMessages.common.invalidABC}`;
    }

    if (
      transactionHasABC &&
      transactionABC &&
      formData.abc &&
      Number(formData.abc) > 0
    ) {
      const otherItemsABC = editingItem
        ? totalItemsABC - Number(editingItem.abc || 0)
        : totalItemsABC;
      const newTotal = otherItemsABC + Number(formData.abc);
      if (newTotal > Number(transactionABC)) {
        validationErrors.abc = `Total items ABC (₱${newTotal.toLocaleString()}) would exceed Transaction ABC (₱${Number(transactionABC).toLocaleString()})`;
      }
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