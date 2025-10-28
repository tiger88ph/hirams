import React, { useState } from "react";
import { Switch, FormControlLabel, Typography } from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { validateFormData } from "../../../../../utils/form/validation";
import ModalContainer from "../../../../common/ModalContainer";
import FormGrid from "../../../../common/FormGrid";

function AddCompanyModal({ open, handleClose, onCompanyAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    tin: "",
    address: "",
    vat: false,
    ewt: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "tin") {
      const digits = value.replace(/\D/g, "");
      const parts = [];
      if (digits.length > 0) parts.push(digits.substring(0, 3));
      if (digits.length > 3) parts.push(digits.substring(3, 6));
      if (digits.length > 6) parts.push(digits.substring(6, 9));
      if (digits.length > 9) parts.push(digits.substring(9, 12));
      formattedValue = parts.join(" ");
    }

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

    try {
      setLoading(true);
      handleClose();

      // Spinner automatically shows: "Processing {entity}..."
      await withSpinner(entity, async () => {
        const payload = {
          strCompanyName: formData.name,
          strCompanyNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          bVAT: formData.vat ? 1 : 0,
          bEWT: formData.ewt ? 1 : 0,
        };

        await api.post("companies", payload);
      });

      // Shows: "Company added successfully."
      await showSwal("SUCCESS", {}, { entity, action: "added" });

      onCompanyAdded?.();

      setFormData({
        name: "",
        nickname: "",
        tin: "",
        address: "",
        vat: false,
        ewt: false,
      });
      setErrors({});
    } catch (error) {
      console.error("❌ Error adding company:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add Company"
      subTitle={formData.name?.trim() || ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
      width={500}
    >
      <FormGrid
        fields={[
          { label: "Company Name", name: "name", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "TIN",
            name: "tin",
            xs: 6,
            placeholder: "123-456-789 or 123-456-789-000",
          },
          {
            label: "Address",
            name: "address",
            xs: 12,
            multiline: true,
            minRows: 3,
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

export default AddCompanyModal;
