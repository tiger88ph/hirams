import React, { useState, useEffect, useRef } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import { Typography, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../../utils/form/validation.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";

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
  sourceItem,
  onSuccess,
  suppliers,
  cItemType,
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const ewtDebounceRef = useRef(null);
  const [calculatedEWT, setCalculatedEWT] = useState("");
  const [ewtLoading, setEwtLoading] = useState(false);

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
        bAddOn: editingOption.bAddOn,
        id: editingOption.id,
      });
      setCalculatedEWT(editingOption.dEWT || "");
    } else {
      setFormData({
        ...initialFormData,
        quantity: sourceItem?.remainingQty ?? sourceItem?.qty ?? "",
        uom: sourceItem?.uom ?? "",
        specs: sourceItem?.specs ?? "",
      });
      setCalculatedEWT("");
    }
    setErrors({});
  }, [editingOption, open]);

  useEffect(() => {
    const supplierId = Number(formData.nSupplierId);
    const quantity = Number(formData.quantity);
    const unitPrice = Number(formData.unitPrice);

    if (
      !supplierId ||
      !quantity ||
      !unitPrice ||
      isNaN(quantity) ||
      isNaN(unitPrice)
    ) {
      clearTimeout(ewtDebounceRef.current);
      setCalculatedEWT("");
      setFormData((prev) => ({ ...prev, ewt: "" }));
      setEwtLoading(false);
      return;
    }

    setEwtLoading(true);
    clearTimeout(ewtDebounceRef.current);
    let cancelled = false;

    ewtDebounceRef.current = setTimeout(async () => {
      try {
        const response = await api.post("purchase-options/calculate-ewt", {
          nSupplierId: supplierId,
          quantity,
          unitPrice,
          cItemType,
        });
        if (!cancelled) {
          const ewt = response.calculatedEWT;
          setCalculatedEWT(ewt);
          setFormData((prev) => ({ ...prev, ewt }));
        }
      } catch {
        if (!cancelled) {
          setCalculatedEWT("");
          setFormData((prev) => ({ ...prev, ewt: "" }));
        }
      } finally {
        if (!cancelled) setEwtLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(ewtDebounceRef.current);
    };
  }, [
    Number(formData.nSupplierId),
    Number(formData.quantity),
    Number(formData.unitPrice),
    cItemType,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSupplierChange = (value) => {
    const selectedSupplier = suppliers.find((s) => s.value === Number(value));
    setFormData((prev) => ({
      ...prev,
      nSupplierId: selectedSupplier?.value || "",
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_OPTION");

    // Only check remaining qty for new options (not edits) and non-add-ons
    if (!formData.id && !formData.bAddOn && sourceItem?.remainingQty != null) {
      const enteredQty = Number(formData.quantity);
      const remaining = Number(sourceItem.remainingQty);
      if (enteredQty > remaining) {
        validationErrors.quantity = `Quantity exceeds the remaining unfulfilled qty (${remaining} ${sourceItem.uom || ""}).`;
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;

    const brandModel =
      formData.model || formData.brand
        ? `${formData.model || ""}${formData.model && formData.brand ? " (" : ""}${formData.brand || ""}${formData.model && formData.brand ? ")" : ""}`
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
        await onSuccess();
      });
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isEdit ? "updated" : "added" },
      );
    } catch (err) {
      setErrors(
        err.response?.data?.errors || {
          general: `${uiMessages.common.errorMessage}`,
        },
      );
      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setEwtLoading(false);
    onClose();
  };

  const fields = [
    { name: "brand", label: "Brand", xs: 4 },
    { name: "model", label: "Model", xs: 4 },
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      options: suppliers,
      xs: 4,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    {
      name: "_supplierLink",
      type: "custom",
      xs: 12,
      render: () => (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "right",
            mt: -0.5,
            fontSize: "0.65rem",
            lineHeight: 1,
          }}
        >
          New Supplier?{" "}
          <Link
            component="button"
            underline="hover"
            color="primary"
            sx={{ fontSize: "inherit" }}
            onClick={() => {
              handleClose();
              navigate("/supplier?add=true");
            }}
          >
            Click here
          </Link>
        </Typography>
      ),
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      xs: 4,
      numberOnly: true,
    },
    {
      name: "unitPrice",
      label: "Unit Price",
      type: "peso",
      xs: 4,
      numberOnly: true,
    },
    {
      name: "ewt",
      label: ewtLoading ? "EWT (calculating...)" : "EWT",
      type: "peso",
      xs: 4,
      numberOnly: true,
      value: calculatedEWT ? Number(calculatedEWT) : "",
      onChange: (e) =>
        setFormData((prev) => ({ ...prev, ewt: e.target.value })),
      placeholder: calculatedEWT
        ? Number(calculatedEWT).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0.00",
    },
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
      disabled={ewtLoading}
    >
      <FormGrid
        fields={fields}
        switches={switches}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleSwitchChange}
      />
    </ModalContainer>
  );
}

export default NewOptionModal;
