import React, { useState } from "react";
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
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};
    const tinPattern = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/;

    if (!formData.strCompanyName.trim())
      newErrors.strCompanyName = "Company Name is required";
    if (!formData.strCompanyNickName.trim())
      newErrors.strCompanyNickName = "Company Nickname is required";
    if (
      formData.strTIN.trim() &&
      !tinPattern.test(formData.strTIN.trim())
    )
      newErrors.strTIN =
        "TIN must follow 123-456-789 or 123-456-789-000 format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Save Handler (same pattern as AddUserModal)
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
    <Modal open={open} onClose={handleClose} sx={{ zIndex: 2000 }}>
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
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Add Company
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
        <Box sx={{ p: 2 }}>
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
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
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
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      Expanded Withholding Tax
                    </Typography>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 1.5,
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
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default AddCompanyModal;
