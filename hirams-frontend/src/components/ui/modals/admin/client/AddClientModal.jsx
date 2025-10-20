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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function AddClientModal({ open, handleClose, onClientAdded }) {
  const [formData, setFormData] = useState({
    clientName: "",
    nickname: "",
    tin: "",
    address: "",
    businessStyle: "",
    contactPerson: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Validation helpers
  const validateTIN = (tin) => /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(tin.trim());
  const validateContact = (contact) =>
    /^(09\d{9}|\+639\d{9})$/.test(contact.trim());

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim())
      newErrors.clientName = "Client Name is required";
    if (!formData.nickname.trim()) newErrors.nickname = "Nickname is required";
    if (formData.tin && !validateTIN(formData.tin))
      newErrors.tin = "TIN must follow 123-456-789-000 format";
    if (formData.contactNumber && !validateContact(formData.contactNumber))
      newErrors.contactNumber =
        "Contact must start with 09 or +639 and contain 11 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Save handler (unified logic)
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.clientName.trim() || "Client";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Adding ${entity}...`, async () => {
        const payload = {
          strClientName: formData.clientName,
          strClientNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,
        };

        await api.post("clients", payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onClientAdded?.();

      // ✅ Reset form after success
      setFormData({
        clientName: "",
        nickname: "",
        tin: "",
        address: "",
        businessStyle: "",
        contactPerson: "",
        contactNumber: "",
      });
      setErrors({});
    } catch (error) {
      console.error("❌ Error adding client:", error);
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
            py: 1.2,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Add Client
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
                label="Client Name"
                name="clientName"
                fullWidth
                size="small"
                value={formData.clientName}
                onChange={handleChange}
                error={!!errors.clientName}
                helperText={errors.clientName || ""}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Nickname"
                name="nickname"
                fullWidth
                size="small"
                value={formData.nickname}
                onChange={handleChange}
                error={!!errors.nickname}
                helperText={errors.nickname || ""}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="TIN"
                name="tin"
                fullWidth
                size="small"
                placeholder="123-456-789-000"
                value={formData.tin}
                onChange={handleChange}
                error={!!errors.tin}
                helperText={errors.tin || ""}
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
                sx={{ "& textarea": { resize: "vertical" } }}
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Business Style"
                name="businessStyle"
                fullWidth
                size="small"
                value={formData.businessStyle}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Contact Person"
                name="contactPerson"
                fullWidth
                size="small"
                value={formData.contactPerson}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Contact Number"
                name="contactNumber"
                fullWidth
                size="small"
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                value={formData.contactNumber}
                onChange={handleChange}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber || ""}
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

export default AddClientModal;
