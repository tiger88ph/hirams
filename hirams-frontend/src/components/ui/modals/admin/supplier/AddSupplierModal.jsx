import React, { useState } from "react";
import { Grid, TextField, Switch, FormControlLabel, Box, Typography } from "@mui/material";
import Swal from "sweetalert2";
import ModalContainer from "../../../../../components/common/ModalContainer";

function AddSupplierModal({ open, handleClose, onSave, onClientAdded }) {
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    address: "",
    bVAT: false,
    bEWT: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Swal.fire("Missing Field", "Please enter Full Name.", "warning");
      return false;
    }
    if (!formData.nickname.trim()) {
      Swal.fire("Missing Field", "Please enter Nickname.", "warning");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate API call
      const payload = {
        strFullName: formData.fullName,
        strNickname: formData.nickname,
        strAddress: formData.address,
        vat: formData.bVAT ? "VAT" : "",
        ewt: formData.bEWT ? "EWT" : "",
      };

      // Replace with actual API call
      await fetch("http://127.0.0.1:8000/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: `Supplier "${formData.fullName}" added successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      onSave?.(payload); // Optional callback to update parent state
      onClientAdded?.();

      setFormData({
        fullName: "",
        nickname: "",
        address: "",
        bVAT: false,
        bEWT: false,
      });

      handleClose();
    } catch (error) {
      console.error("Error saving supplier:", error);
      Swal.fire("Error", "Failed to save supplier. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add Supplier"
      onSave={handleSave}
      loading={loading}
    >
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TextField
            label="Full Name"
            name="fullName"
            fullWidth
            size="small"
            value={formData.fullName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Nickname"
            name="nickname"
            fullWidth
            size="small"
            value={formData.nickname}
            onChange={handleChange}
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
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={formData.bVAT}
                  name="bVAT"
                  onChange={handleSwitchChange}
                />
              }
              label={<Typography variant="body2">Value Added Tax</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={formData.bEWT}
                  name="bEWT"
                  onChange={handleSwitchChange}
                />
              }
              label={<Typography variant="body2">Expanded Withholding Tax</Typography>}
            />
          </Box>
        </Grid>
      </Grid>
    </ModalContainer>
  );
}

export default AddSupplierModal;
