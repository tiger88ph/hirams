import React, { useState } from "react";
import { Grid, TextField } from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../../components/common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";

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
  // ✅ Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    // Special handling for TIN: numeric only, auto spacing 3-3-3-2
    if (name === "tin") {
      const digits = value.replace(/\D/g, ""); // remove non-numeric
      const parts = [];
      if (digits.length > 0) parts.push(digits.substring(0, 3));
      if (digits.length > 3) parts.push(digits.substring(3, 6));
      if (digits.length > 6) parts.push(digits.substring(6, 9));
      if (digits.length > 9) parts.push(digits.substring(9, 11));
      formattedValue = parts.join(" ");
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    // Clear error for this field while typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Validation handler
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CLIENT");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ✅ Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.clientName.trim() || "Client";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Adding ${entity}...`, async () => {
        const payload = {
          strClientName: formData.clientName,
          strClientNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,
        };

        await api.post("clients", payload);
      });

      await showSwal("SUCCESS", {}, { entity });
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

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add Client"
      subTitle={`${formData.clientName}`.trim()}
      onSave={handleSave}
      loading={loading}
    >
      <Grid container spacing={1.5}>
        {[
          { label: "Client Name", name: "clientName", xs: 12 },
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
          { label: "Business Style", name: "businessStyle", xs: 6 },
          { label: "Contact Person", name: "contactPerson", xs: 6 },
          {
            label: "Contact Number",
            name: "contactNumber",
            xs: 12,
            placeholder: "09XXXXXXXXX",
          },
        ].map((field) => (
          <Grid item xs={field.xs} key={field.name}>
            <TextField
              {...field}
              fullWidth
              size="small"
              value={formData[field.name] || ""}
              onChange={handleChange}
              error={!!errors[field.name]}
              helperText={errors[field.name] || ""}
            />
          </Grid>
        ))}
      </Grid>
    </ModalContainer>
  );
}

export default AddClientModal;
