import React, { useState } from "react";
import { Grid, TextField } from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../../components/common/ModalContainer";

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

  // ✅ Validation helper
  const validateTIN = (tin) => {
    const digitsOnly = tin.replace(/\D/g, ""); // only digits
    return /^\d{11}$/.test(digitsOnly); // exactly 11 digits
  };

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim())
      newErrors.clientName = "Client Name is required";
    if (!formData.nickname.trim()) newErrors.nickname = "Nickname is required";

    if (formData.tin && !validateTIN(formData.tin))
      newErrors.tin = "TIN must be 11 digits";

    if (formData.contactNumber && !validateContact(formData.contactNumber))
      newErrors.contactNumber =
        "Contact must start with 09 or +639 and contain 11 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      subTitle={`${formData.clientName}`.trim()} // <-- added
      onSave={handleSave}
      loading={loading}
    >
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TextField
            label="Client Name"
            name="clientName"
            fullWidth
            size="small"
            value={formData.clientName}
            onChange={handleChange}
            error={!!errors.clientName}
            helperText={errors.clientName || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Nickname"
            name="nickname"
            fullWidth
            size="small"
            value={formData.nickname}
            onChange={handleChange}
            error={!!errors.nickname}
            helperText={errors.nickname || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="TIN"
            name="tin"
            fullWidth
            size="small"
            placeholder="123-456-789-000"
            value={formData.tin}
            onChange={handleChange}
            error={!!errors.tin}
            helperText={errors.tin || ""}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Address"
            name="address"
            fullWidth
            size="small"
            multiline
            minRows={2}
            sx={{ "& textarea": { resize: "vertical" } }}
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Business Style"
            name="businessStyle"
            fullWidth
            size="small"
            value={formData.businessStyle}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Contact Person"
            name="contactPerson"
            fullWidth
            size="small"
            value={formData.contactPerson}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Contact Number"
            name="contactNumber"
            fullWidth
            size="small"
            placeholder="09XXXXXXXXX"
            value={formData.contactNumber}
            onChange={handleChange}
            error={!!errors.contactNumber}
            helperText={errors.contactNumber || ""}
          />
        </Grid>
      </Grid>
    </ModalContainer>
  );
}

export default AddClientModal;
