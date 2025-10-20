import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  Grid,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

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

  // ✅ Populate form when modal opens
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

  // ✅ Keep SweetAlerts above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Handle text field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // clear error for that field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Handle switch changes
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

      // 🔹 Close modal first to avoid overlay conflicts
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
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-company-modal"
      sx={{ zIndex: 1200 }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.5,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#f9fafb",
          }}
        >
          <Typography
            id="edit-company-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Edit Company
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: "gray", "&:hover": { color: "black" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
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
                  <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
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
                  <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                    Expanded Withholding Tax
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 2,
            gap: 1,
            bgcolor: "#fafafa",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              textTransform: "none",
              color: "#555",
              "&:hover": { bgcolor: "#f0f0f0" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{
              textTransform: "none",
              bgcolor: loading ? "#90caf9" : "#1976d2",
              "&:hover": { bgcolor: loading ? "#90caf9" : "#1565c0" },
            }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditCompanyModal;
