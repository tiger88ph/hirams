import React, { useState } from "react";
import { Switch, FormControlLabel, Typography } from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../../components/common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";

function AddClientModal({ open, handleClose, onClientAdded }) {
  const [formData, setFormData] = useState({
    clientName: "",
    nickname: "",
    tin: "",
    address: "",
    businessStyle: "",
    contactPerson: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // TIN auto-format: numeric only, spaced 3-3-3-2
    if (name === "tin") {
      const digits = value.replace(/\D/g, "");
      const parts = [];
      if (digits.length > 0) parts.push(digits.substring(0, 3));
      if (digits.length > 3) parts.push(digits.substring(3, 6));
      if (digits.length > 6) parts.push(digits.substring(6, 9));
      if (digits.length > 9) parts.push(digits.substring(9, 11));
      formattedValue = parts.join(" ");
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CLIENT");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.clientName.trim() || "Client";

    try {
      setLoading(true);
      handleClose();

      // Spinner automatically shows: "Processing {entity}..."
      await withSpinner(entity, async () => {
        const payload = {
          strClientName: formData.clientName,
          strClientNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,

          // ✅ Add this
          cStatus: defaultStatus,
        };

        await api.post("clients", payload);
      });

      // Success message: "{entity} added successfully."
      await showSwal("SUCCESS", {}, { entity, action: "added" });

      onClientAdded?.();

      // Reset form
      setFormData({
        clientName: "",
        nickname: "",
        tin: "",
        address: "",
        businessStyle: "",
        contactPerson: "",
        contactNumber: "",
      });
      setErrors({});
    } catch (error) {
      console.error("❌ Error adding client:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };
  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType; // "M", "A", "F", "P", "G"
  const defaultStatus = userType === "M" ? "A" : "P";

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add Client"
      subTitle={formData.clientName?.trim() || ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
    >
      <FormGrid
        fields={[
          { label: "Client", name: "clientName", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          { label: "TIN", name: "tin", xs: 6, placeholder: "123-456-789-000" },
          {
            label: "Address",
            name: "address",
            xs: 12,
            multiline: true,
            minRows: 2,
            sx: { "& textarea": { resize: "vertical" } },
          },
          { label: "Business Style", name: "businessStyle", xs: 12 },
          { label: "Contact Person", name: "contactPerson", xs: 6 },
          {
            label: "Contact Number",
            name: "contactNumber",
            xs: 6,
            placeholder: "09XXXXXXXXX",
          },
        ]}
        switches={[]} // No switches in AddClientModal
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </ModalContainer>
  );
}

export default AddClientModal;
