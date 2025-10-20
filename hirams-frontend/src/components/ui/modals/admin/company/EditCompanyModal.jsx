import React, { useState, useEffect } from "react";
import {
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import api from "../../../../../api/api";
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

  // ✅ Populate form on open
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

  // ✅ Maintain SweetAlert above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Handle text input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ Handle switches
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // ✅ Inline validation
  const validateForm = () => {
    const newErrors = {};
    const tinPattern = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/;

    if (!formData.name.trim()) newErrors.name = "Company Name is required";
    if (!formData.nickname.trim())
      newErrors.nickname = "Company Nickname is required";

    if (formData.tin.trim() && !tinPattern.test(formData.tin.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Invalid TIN Format",
        text: "TIN must follow 123-456-789 or 123-456-789-000 format.",
      });
      setTopAlertZIndex();
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
            label={
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                Value Added Tax
              </Typography>
            }
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
            label={
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                Expanded Withholding Tax
              </Typography>
            }
          />
        </Grid>
      </Grid>
    </ModalContainer>
  );
}

export default EditCompanyModal;
