import React, { useState } from "react";
import { MenuItem } from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { validateFormData } from "../../../../../utils/form/validation";
import ModalContainer from "../../../../../components/common/ModalContainer";
import FormGrid from "../../../../../components/common/FormGrid"; // ✅ import FormGrid

function AddSupplierModal({ open, handleClose, onSupplierAdded }) {
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    tin: "",
    address: "",
    bVAT: false,
    bEWT: false,
    cStatus: "", // <- add this
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle text input changes with optional TIN formatting
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
    const validationErrors = validateFormData(formData, "SUPPLIER");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.fullName.trim() || "Supplier";

    try {
      setLoading(true);
      handleClose();

      // Set status based on logged-in user
      const status = userType === "M" ? "A" : "P";

      const payload = {
        strSupplierName: formData.fullName,
        strSupplierNickName: formData.nickname,
        strAddress: formData.address,
        strTIN: formData.tin,
        bVAT: formData.bVAT ? 1 : 0,
        bEWT: formData.bEWT ? 1 : 0,
        cStatus: status,
      };

      await withSpinner(`Adding ${entity}...`, async () => {
        await api.post("suppliers", payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onSupplierAdded?.();

      setFormData({
        fullName: "",
        nickname: "",
        tin: "",
        address: "",
        bVAT: false,
        bEWT: false,
        cStatus: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error :", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add Supplier"
      subTitle={formData.fullName?.trim() || ""}
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

export default AddSupplierModal;
