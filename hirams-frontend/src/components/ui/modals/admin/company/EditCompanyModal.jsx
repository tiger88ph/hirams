import React, { useState, useEffect } from "react";
import {
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { validateFormData } from "../../../../../utils/form/validation";
import ModalContainer from "../../../../common/ModalContainer";

function EditCompanyModal({ open, handleClose, company, onCompanyUpdated }) {
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

  // ✅ Populate form when editing
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        nickname: company.nickname || "",
        tin: company.tin || "",
        address: company.address || "",
        vat: company.vat || false,
        ewt: company.ewt || false,
      });
      setErrors({});
    }
  }, [company]);

  // ✅ Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Auto-format TIN (numeric only, spaced 3-3-3-3)
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

  // ✅ Use centralized validation
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "COMPANY");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ✅ Save handler
  const handleSave = async () => {
    if (!validateForm()) return;
    const entity = formData.name.trim() || "Company";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Updating ${entity}...`, async () => {
        const payload = {
          strCompanyName: formData.name,
          strCompanyNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          bVAT: formData.vat ? 1 : 0,
          bEWT: formData.ewt ? 1 : 0,
        };
        await api.put(`companies/${company.id}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onCompanyUpdated?.();
    } catch (error) {
      console.error("❌ Error updating company:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Edit Company"
      subTitle={formData.name?.trim() || ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
      width={500}
    >
      <Grid container spacing={1.5}>
        {/* --- Text Fields --- */}
        {[
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
          { label: "Value Added Tax", name: "vat" },
          { label: "Expanded Withholding Tax", name: "ewt" },
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

export default EditCompanyModal;
