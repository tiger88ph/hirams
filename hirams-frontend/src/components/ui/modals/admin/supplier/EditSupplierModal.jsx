import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { validateFormData } from "../../../../../utils/form/validation";
import ModalContainer from "../../../../common/ModalContainer";

function EditSupplierModal({
  open,
  handleClose,
  supplier,
  onUpdate,
  onSupplierUpdated,
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    tin: "",
    address: "",
    bVAT: false,
    bEWT: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Populate form when supplier changes
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
      setErrors({});
    }
  }, [supplier]);

  // ✅ Handle input changes (with TIN auto-format)
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

  // ✅ Centralized validation
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "SUPPLIER");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ✅ Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.fullName.trim() || "Supplier";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Updating ${entity}...`, async () => {
        const payload = {
          strSupplierName: formData.fullName,
          strSupplierNickName: formData.nickname,
          strAddress: formData.address,
          strTIN: formData.tin,
          bVAT: formData.bVAT ? 1 : 0,
          bEWT: formData.bEWT ? 1 : 0,
        };

        await api.put(`suppliers/${supplier.nSupplierId}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onUpdate?.();
      onSupplierUpdated?.();
    } catch (error) {
      console.error("❌ Error updating supplier:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Edit Supplier"
      subTitle={formData.fullName?.trim() || ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
      width={500}
    >
      <Grid container spacing={1.5}>
        {/* --- Text Fields --- */}
        {[
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
            minRows: 2,
            sx: { "& textarea": { resize: "vertical" } },
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

        {/* --- Switches --- */}
        {[
          { label: "Value Added Tax", name: "bVAT" },
          { label: "Expanded Withholding Tax", name: "bEWT" },
        ].map((switchField) => (
          <Grid item xs={6} key={switchField.name}>
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  name={switchField.name}
                  checked={formData[switchField.name] || false}
                  onChange={handleSwitchChange}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  {switchField.label}
                </Typography>
              }
            />
          </Grid>
        ))}
      </Grid>
    </ModalContainer>
  );
}

export default EditSupplierModal;
