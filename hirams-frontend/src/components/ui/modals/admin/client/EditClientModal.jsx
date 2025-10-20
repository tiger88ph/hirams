// src/features/clients/modals/EditClientModal.jsx
import React, { useState, useEffect } from "react";
import { Grid, TextField, CircularProgress } from "@mui/material";
import api from "../../../../../api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";

function EditClientModal({ open, handleClose, clientData, onClientUpdated }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientData) setFormData(clientData);
  }, [clientData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateTIN = (tin) => /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(tin.trim());
  const validateContact = (contact) => /^(09\d{9}|\+639\d{9})$/.test(contact.trim());

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Client Name is required.";
    if (!formData.nickname?.trim()) newErrors.nickname = "Nickname is required.";
    if (formData.tin && !validateTIN(formData.tin))
      newErrors.tin = "TIN must be in the format 123-456-789-000.";
    if (formData.contactNumber && !validateContact(formData.contactNumber))
      newErrors.contactNumber = "Must start with 09 or +639 and contain 11 digits.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const entity = formData.name || "Client";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Updating ${entity}...`, async () => {
        const payload = {
          nClientId: formData.id,
          strClientName: formData.name,
          strClientNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,
        };
        await api.put(`clients/${formData.id}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onClientUpdated?.();
    } catch (error) {
      console.error("❌ Error updating client:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Edit Client"
      onSave={handleSave}
      loading={loading}
      saveLabel={
        loading ? (
          <>
            <CircularProgress size={16} sx={{ color: "white", mr: 1 }} />
            Saving...
          </>
        ) : (
          "Save"
        )
      }
    >
      <Grid container spacing={1.5}>
        {[
          { label: "Client Name", name: "name", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          { label: "TIN", name: "tin", xs: 6, placeholder: "123-456-789-000" },
          { label: "Address", name: "address", xs: 12, multiline: true, minRows: 2 },
          { label: "Business Style", name: "businessStyle", xs: 6 },
          { label: "Contact Person", name: "contactPerson", xs: 6 },
          {
            label: "Contact Number",
            name: "contactNumber",
            xs: 12,
            placeholder: "09XXXXXXXXX or +639XXXXXXXXX",
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

export default EditClientModal;
