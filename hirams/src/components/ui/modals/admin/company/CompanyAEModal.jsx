import React, { useState, useEffect } from "react";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { validateFormData } from "../../../../../utils/form/validation";
import ModalContainer from "../../../../common/ModalContainer";
import FormGrid from "../../../../common/FormGrid";

function CompanyAEModal({ open, handleClose, company, onCompanySubmitted }) {
  const initialForm = {
    name: "",
    nickname: "",
    tin: "",
    address: "",
    vat: false,
    ewt: false,
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(company);

  // Populate form when modal opens
  useEffect(() => {
    if (open) {
      if (company) {
        // Edit mode: populate with existing data
        setFormData({
          name: company.name || "",
          nickname: company.nickname || "",
          tin: company.tin || "",
          address: company.address || "",
          vat: company.vat === "VAT",
          ewt: company.ewt === "EWT",
        });
      } else {
        // Add mode: reset to initial values
        setFormData(initialForm);
      }
      setErrors({});
    }
  }, [open, company]);

  // Format TIN as user types
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
    const validationErrors = validateFormData(formData, "COMPANY");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.name.trim() || "Company";
    const action = isEditMode ? "updated" : "added";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(
        `${isEditMode ? "Updating" : "Adding"} ${entity}...`,
        async () => {
          const payload = {
            strCompanyName: formData.name,
            strCompanyNickName: formData.nickname,
            strTIN: formData.tin.replace(/ /g, "-"), // spaces → dashes
            strAddress: formData.address,
            bVAT: formData.vat ? 1 : 0,
            bEWT: formData.ewt ? 1 : 0,
          };

          if (isEditMode) {
            await api.put(`companies/${company.id}`, payload);
          } else {
            await api.post("companies", payload);
          }
        }
      );

      await showSwal("SUCCESS", {}, { entity, action });

      onCompanySubmitted?.();
    } catch (error) {
      console.error(`❌ Error ${action} company:`, error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isEditMode ? "Edit Company" : "Add Company"}
      subTitle={formData.nickname ? `/ ${formData.nickname}` : ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
    >
      <FormGrid
        fields={[
          { label: "Company Name", name: "name", xs: 12 },
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
            plainMultiline: true,
            minRows: isEditMode ? 2 : 3,
            sx: { "& textarea": { resize: "vertical" } },
          },
        ]}
        switches={[
          { label: "Value Added Tax", name: "vat", xs: 6 },
          { label: "Expanded Withholding Tax", name: "ewt", xs: 6 },
        ]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleSwitchChange}
      />
    </ModalContainer>
  );
}

export default CompanyAEModal;