import React, { useState, useEffect } from "react";
import api from "../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../utils/form/validation.js";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../utils/helpers/tinFormat.js";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../components/common/FormGrid.jsx";

function SupplierAEModal({
  open,
  handleClose,
  supplier,
  onSupplierSubmitted,
  activeKey,
  pendingKey,
  isManagement,
  vatLabel,
  ewtLabel,
}) {
  const initialForm = {
    fullName: "",
    nickname: "",
    tin: "",
    address: "",
    bVAT: false,
    bEWT: false,
  };
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(supplier);

  // Populate form when modal opens
  useEffect(() => {
    if (open) {
      if (supplier) {
        // Edit mode: populate with existing data
        setFormData({
          fullName: supplier.supplierName || "",
          nickname: supplier.supplierNickName || "",
          tin: tinToDisplay(supplier.supplierTIN),
          address: supplier.address || "",
          bVAT: supplier.vat === vatLabel,
          bEWT: supplier.ewt === ewtLabel,
        });
      } else {
        // Add mode: reset to initial values
        setFormData(initialForm);
      }
      setErrors({});
    }
  }, [open, supplier, vatLabel, ewtLabel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "tin" ? formatTIN(value) : value;

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const validationErrors = validateFormData(formData, "SUPPLIER");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.nickname.trim() || "Supplier";
    const action = isEditMode ? "updated" : "added";
    const defaultStatus = isManagement ? activeKey : pendingKey;

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        const payload = {
          strSupplierName: formData.fullName,
          strSupplierNickName: formData.nickname,
          strTIN: tinToStorage(formData.tin),
          strAddress: formData.address,
          bVAT: formData.bVAT ? 1 : 0,
          bEWT: formData.bEWT ? 1 : 0,
          ...(isEditMode ? {} : { cStatus: defaultStatus }),
        };

        if (isEditMode) {
          await api.put(`suppliers/${supplier.nSupplierId}`, payload);
        } else {
          await api.post("suppliers", payload);
        }
      });

      await showSwal("SUCCESS", {}, { entity, action });

      onSupplierSubmitted?.();
    } catch (error) {
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isEditMode ? "Edit Supplier" : "Add Supplier"}
      subTitle={formData.nickname ? `/ ${formData.nickname}` : ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
    >
      <FormGrid
        fields={[
          { label: "Supplier Name", name: "fullName", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "TIN",
            name: "tin",
            type: "tin",
            xs: 6,
            placeholder: "000-000-000-00000",
          },
          {
            label: "Address",
            name: "address",
            xs: 12,
            multiline: true,
            plainMultiline: true,
            minRows: 2,
            sx: { "& textarea": { resize: "vertical" } },
          },
        ]}
        switches={[
          { label: "Value Added Tax", mobileLabel: "VAT", name: "bVAT", xs: 6 },
          {
            label: "Expanded Withholding Tax",
            mobileLabel: "EWT",
            name: "bEWT",
            xs: 6,
          },
        ]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleSwitchChange}
      />
    </ModalContainer>
  );
}

export default SupplierAEModal;
