import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import FormGrid from "../../../../../components/form/FormGrid.jsx";
import TransactionItemAPI from "../../../../../api/endpoints/transaction-item.api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../../utils/form/validation.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// ── Initial State ──────────────────────────────────────────────────────────
const initialFormData = {
  name: "",
  specs: "",
  qty: "",
  uom: "",
  abc: "",
};

// ── Theme Color Map ─────────────────────────────────────────────────────────
const useColors = (c) => ({
  textPrimary: c.gray.textPrimary,
  textMuted: c.gray.textMuted,
  errorText: c.red.text,
  border: c.slate.border,
  inputBg: c.gray.inputBg,
});

// ── Main Modal ──────────────────────────────────────────────────────────────
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const baseColors = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(baseColors), [baseColors]);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Populate form when editing / reset when adding or closed
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

  // ── Validation Logic ──────────────────────────────────────────────────────
  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_ITEM");

    const itemABC = Number(formData.abc || 0);
    const otherItemsABC = editingItem
      ? totalItemsABC - Number(editingItem.abc || 0)
      : totalItemsABC;
    const txnABC = Number(transactionABC || 0);

    // === Rule A: No Transaction ABC → EVERY item MUST have ABC > 0 ===
    if (!transactionHasABC) {
      if (!formData.abc || itemABC <= 0) {
        validationErrors.abc =
          "Item ABC is required when transaction has no total ABC";
      }
    }

    // === Rule B: Transaction HAS ABC AND other items already have ABC → this item MUST also have ABC ===
    if (transactionHasABC && otherItemsABC > 0) {
      if (!formData.abc || itemABC <= 0) {
        validationErrors.abc =
          "Item ABC is required since other items have ABC values";
      }

      // === Rule C: Sum of all items' ABC must NOT exceed Transaction ABC ===
      const newTotal = otherItemsABC + itemABC;
      if (itemABC > 0 && newTotal > txnABC) {
        validationErrors.abc = `Total items ABC (₱${newTotal.toLocaleString()}) would exceed Transaction ABC (₱${txnABC.toLocaleString()})`;
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ── Save Handler ──────────────────────────────────────────────────────────
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

        isEdit
          ? await TransactionItemAPI.updateItem(editingItem.id, payload)
          : await TransactionItemAPI.createItem(payload);

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

  const isABCRequired = !transactionHasABC || totalItemsABC > 0;

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      onSave={handleSave}
      title={editingItem ? "Edit Item" : "Add New Item"}
      subTitle={formData.name?.trim() || ""}
    >
      <FormGrid
        fields={[
          { name: "name", label: "Item Name", xs: 12 },
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
            required: isABCRequired,
          },
          {
            name: "specs",
            label: "Specifications",
            placeholder: "Type here the specifications...",
            xs: 12,
            multiline: true,
            minRows: 1,
            showHighlighter: false,
            sx: {
              "& textarea": {
                resize: "vertical",
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
              },
            },
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
