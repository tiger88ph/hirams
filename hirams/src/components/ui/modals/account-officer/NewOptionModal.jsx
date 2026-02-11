import React, { useState, useEffect } from "react";
import ModalContainer from "../../../common/ModalContainer";
import FormGrid from "../../../common/FormGrid";
import { Box, Typography, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/api/api";
import { withSpinner, showSwal } from "../../../../utils/swal/index";
import { validateFormData } from "../../../../utils/form/validation";
import { calculateEWT } from "../../../../utils/formula/calculateEWT";
import messages from "../../../../utils/messages/messages";

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
  bAddOn: false,
};

function NewOptionModal({
  open,
  onClose,
  editingOption,
  itemId,
  onSuccess,
  suppliers,
  cItemType,
  itemType,
  vaGoSeValue,
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (editingOption) {
      setFormData({
        nSupplierId: editingOption.nSupplierId || "",
        quantity: editingOption.nQuantity || "",
        uom: editingOption.strUOM || "",
        brand: editingOption.strBrand || "",
        model: editingOption.strModel || "",
        specs: editingOption.strSpecs || "",
        unitPrice: editingOption.dUnitPrice || "",
        ewt: editingOption.dEWT || "",
        bIncluded: !!editingOption.bIncluded,
        bAddOn: editingOption.bAddOn, // already boolean

        id: editingOption.id,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editingOption, open]);

  // Auto-calculate EWT when relevant fields change
  useEffect(() => {
    const selectedSupplier = suppliers.find(
      (s) => s.value === Number(formData.nSupplierId),
    );

    setFormData((prev) => ({
      ...prev,
      ewt: calculateEWT(
        prev.quantity,
        prev.unitPrice,
        selectedSupplier,
        cItemType,
        itemType,
        vaGoSeValue,
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
        vaGoSeValue,
      ),
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      const selectedSupplier = suppliers.find(
        (s) => s.value === Number(newData.nSupplierId),
      );

      newData.ewt = calculateEWT(
        newData.quantity,
        newData.unitPrice,
        selectedSupplier,
        cItemType,
        itemType,
        vaGoSeValue,
      );

      return newData;
    });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_OPTION");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const brandModel =
      formData.model || formData.brand
        ? `${formData.model || ""}${
            formData.model && formData.brand ? " (" : ""
          }${formData.brand || ""}${
            formData.model && formData.brand ? ")" : ""
          }`
        : "Purchase Option";

    const entity = brandModel;
    const isEdit = Boolean(formData.id);

    const payload = {
      nTransactionItemId: itemId,
      nSupplierId: formData.nSupplierId || null,
      quantity: Number(formData.quantity),
      uom: formData.uom,
      brand: formData.brand || null,
      model: formData.model || null,
      specs: formData.specs || null,
      unitPrice: Number(formData.unitPrice),
      ewt: Number(formData.ewt) || 0,
      bIncluded: formData.bIncluded ? 1 : 0,
      bAddOn: formData.bAddOn ? 1 : 0,
    };

    try {
      handleClose();
      await withSpinner(entity, async () => {
        if (isEdit) {
          await api.put(`purchase-options/${formData.id}`, payload);
        } else {
          await api.post("purchase-options", payload);
        }

        await onSuccess(); // Refresh items in parent
      });

      await showSwal(
        "SUCCESS",
        {},
        {
          entity,
          action: isEdit ? "updated" : "added",
        },
      );
    } catch (err) {
      console.error("❌ Error saving purchase option:", err);

      setErrors(
        err.response?.data?.errors || {
          general: messages.transaction.poErrorSaveMess,
        },
      );

      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  const fields = [
    { name: "brand", label: "Brand", xs: 6 },
    { name: "model", label: "Model", xs: 6 },
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
    {
      name: "specs",
      label: "Specifications",
      placeholder: "Type here the specifications...",
      type: "textarea",
      xs: 12,
      multiline: true,
      minRows: 4,
      showHighlighter: false,
      showAllFormatting: true,
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
  const switches = [{ name: "bAddOn", label: "Add-On?", xs: 12 }];

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={formData?.id ? "Edit Purchase Option" : "Add Purchase Option"}
      subTitle={
        formData.brand || formData.model
          ? `/ ${[formData.brand, formData.model].filter(Boolean).join(" ")}`
          : ""
      }
      onSave={handleSave}
    >
      <FormGrid
        fields={fields}
        switches={switches}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleSwitchChange}
      />
      <Box sx={{ textAlign: "right", mt: 1 }}>
        <Typography variant="caption">
          New Supplier?{" "}
          <Link
            component="button"
            underline="hover"
            color="primary"
            onClick={() => {
              handleClose();
              navigate("/supplier?add=true");
            }}
          >
            Click here
          </Link>
        </Typography>
      </Box>
    </ModalContainer>
  );
}

export default NewOptionModal;
