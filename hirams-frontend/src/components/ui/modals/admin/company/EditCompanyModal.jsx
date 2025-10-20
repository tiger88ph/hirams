import React, { useState, useEffect } from "react";
import {
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
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

  // Populate form when company changes
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

  // Keep SweetAlert above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Auto-format TIN: numeric only, spaced 3-3-3-3
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
    const newErrors = {};
    const tinDigits = formData.tin.replace(/\D/g, "");

    if (!formData.name.trim()) newErrors.name = "Company Name is required";
    if (!formData.nickname.trim())
      newErrors.nickname = "Company Nickname is required";

    if (formData.tin.trim() && (tinDigits.length < 9 || tinDigits.length > 12)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid TIN",
        text: "TIN must be 9–12 digits",
      });
      setTopAlertZIndex();
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      subTitle={formData.name.trim()}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
      width={500}
    >
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TextField
            label="Company Name"
            fullWidth
            size="small"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Nickname"
            fullWidth
            size="small"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            error={!!errors.nickname}
            helperText={errors.nickname || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="TIN"
            fullWidth
            size="small"
            name="tin"
            placeholder="123-456-789 or 123-456-789-000"
            value={formData.tin}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Address"
            fullWidth
            size="small"
            multiline
            rows={3}
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                color="primary"
                name="vat"
                checked={formData.vat}
                onChange={handleSwitchChange}
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Value Added Tax</Typography>}
          />
        </Grid>

        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                color="primary"
                name="ewt"
                checked={formData.ewt}
                onChange={handleSwitchChange}
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Expanded Withholding Tax</Typography>}
          />
        </Grid>
      </Grid>
    </ModalContainer>
  );
}

export default EditCompanyModal;
