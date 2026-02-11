import React, { useState, useEffect } from "react";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { validateFormData } from "../../../../../utils/form/validation";
import ModalContainer from "../../../../common/ModalContainer";
import FormGrid from "../../../../common/FormGrid";

function SupplierAEModal({
  open,
  handleClose,
  supplier,
  onSupplierSubmitted,
  activeKey,
  pendingKey,
  managementKey,
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

  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;
  const isManagement = managementKey?.includes(userType);

  // Populate form when modal opens
  useEffect(() => {
    if (open) {
      if (supplier) {
        // Edit mode: populate with existing data
        setFormData({
          fullName: supplier.supplierName || "",
          nickname: supplier.supplierNickName || "",
          tin: supplier.supplierTIN || "",
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

  // Format TIN as user types: 3-3-3-5 spacing
  const formatTIN = (value) => {
    const digits = value.replace(/\D/g, "");
    const parts = [];
    if (digits.length > 0) parts.push(digits.substring(0, 3));
    if (digits.length > 3) parts.push(digits.substring(3, 6));
    if (digits.length > 6) parts.push(digits.substring(6, 9));
    if (digits.length > 9) parts.push(digits.substring(9, 14));
    return parts.join(" ");
  };

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

    const entity = formData.fullName.trim() || "Supplier";
    const action = isEditMode ? "updated" : "added";
    const defaultStatus = isManagement ? activeKey : pendingKey;

    try {
      setLoading(true);
      handleClose();

      await withSpinner(
        `${isEditMode ? "Updating" : "Adding"} ${entity}...`,
        async () => {
          const payload = {
            strSupplierName: formData.fullName,
            strSupplierNickName: formData.nickname,
            strTIN: formData.tin.replace(/ /g, "-"), // spaces → dashes
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
        }
      );

      await showSwal("SUCCESS", {}, { entity, action });

      onSupplierSubmitted?.();
    } catch (error) {
      console.error(`❌ Error ${action} supplier:`, error);
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
            xs: 6,
            placeholder: "000 000 000 00000",
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
          { label: "Value Added Tax", name: "bVAT", xs: 6 },
          { label: "Expanded Withholding Tax", name: "bEWT", xs: 6 },
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