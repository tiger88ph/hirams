import React, { useState } from "react";
import { TextField, Grid, Switch, FormControlLabel, Typography, Box } from "@mui/material";
import api from "../../../../../api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";

function AddCompanyModal({ open, handleClose, onCompanyAdded }) {
  const [formData, setFormData] = useState({
    strCompanyName: "",
    strCompanyNickName: "",
    strTIN: "",
    strAddress: "",
    bVAT: false,
    bEWT: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};
    const tinPattern = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/;

    if (!formData.strCompanyName.trim())
      newErrors.strCompanyName = "Company Name is required";
    if (!formData.strCompanyNickName.trim())
      newErrors.strCompanyNickName = "Company Nickname is required";
    if (formData.strTIN.trim() && !tinPattern.test(formData.strTIN.trim()))
      newErrors.strTIN = "TIN must follow 123-456-789 or 123-456-789-000 format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Save Handler
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.strCompanyName.trim() || "Company";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Adding ${entity}...`, async () => {
        const payload = {
          ...formData,
          bVAT: formData.bVAT ? 1 : 0,
          bEWT: formData.bEWT ? 1 : 0,
        };
        await api.post("companies", payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onCompanyAdded?.();

      // Reset form
      setFormData({
        strCompanyName: "",
        strCompanyNickName: "",
        strTIN: "",
        strAddress: "",
        bVAT: false,
        bEWT: false,
      });
      setErrors({});
    } catch (error) {
      console.error("Error adding company:", error);
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
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
      width={500}
    >
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TextField
            label="Company Name"
            name="strCompanyName"
            fullWidth
            size="small"
            value={formData.strCompanyName}
            onChange={handleChange}
            error={!!errors.strCompanyName}
            helperText={errors.strCompanyName || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Nickname"
            name="strCompanyNickName"
            fullWidth
            size="small"
            value={formData.strCompanyNickName}
            onChange={handleChange}
            error={!!errors.strCompanyNickName}
            helperText={errors.strCompanyNickName || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="TIN"
            name="strTIN"
            placeholder="123-456-789 or 123-456-789-000"
            fullWidth
            size="small"
            value={formData.strTIN}
            onChange={handleChange}
            error={!!errors.strTIN}
            helperText={errors.strTIN || ""}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Address"
            name="strAddress"
            fullWidth
            size="small"
            multiline
            minRows={3}
            sx={{ "& textarea": { resize: "vertical" } }}
            value={formData.strAddress}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={formData.bVAT}
                  name="bVAT"
                  onChange={handleChange}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  Value Added Tax
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={formData.bEWT}
                  name="bEWT"
                  onChange={handleChange}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  Expanded Withholding Tax
                </Typography>
              }
            />
          </Box>
        </Grid>
      </Grid>
    </ModalContainer>
  );
}

export default AddCompanyModal;
