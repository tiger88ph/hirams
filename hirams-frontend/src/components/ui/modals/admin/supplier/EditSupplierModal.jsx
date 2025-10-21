import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function EditSupplierModal({ open, handleClose, supplier, onUpdate }) {
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    address: "",
    bVAT: false,
    bEWT: false,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        fullName: supplier.supplierName || "",
        nickname: supplier.supplierNickName || "",
        tin: supplier.supplierTIN || "",
        address: supplier.address || "",
        bVAT: supplier.vat === "VAT",
        bEWT: supplier.ewt === "EWT",
      });
    }
  }, [supplier]);

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
      const payload = {
        strSupplierName: formData.fullName,
        strSupplierNickName: formData.nickname || "",
        strAddress: formData.address || "",
        strTIN: formData.tin || "",
        bVAT: formData.bVAT ? 1 : 0,
        bEWT: formData.bEWT ? 1 : 0,
      };

      await withSpinner(
        `Updating supplier "${formData.fullName}"...`,
        async () => {
          const result = await api.put(
            `suppliers/${supplier.nSupplierId}`,
            payload
          );

          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: `Supplier "${formData.fullName}" updated successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });

          onUpdate?.(result);
          handleClose();
        }
      );
    } catch (error) {
      console.error("Error updating supplier:", error);
      Swal.fire(
        "Error",
        "Failed to update supplier. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Edit Supplier"
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
            label="TIN"
            name="tin"
            fullWidth
            size="small"
            value={formData.tin}
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
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
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
              label={
                <Typography variant="body2">
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

export default EditSupplierModal;
