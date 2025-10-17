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
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import api from "../../../../../api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function EditClientModal({ open, handleClose, clientData, onClientUpdated }) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    nickname: "",
    tin: "",
    address: "",
    businessStyle: "",
    contactPerson: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Populate form
  useEffect(() => {
    if (clientData) {
      setFormData({
        id: clientData.id || "",
        name: clientData.name || "",
        nickname: clientData.nickname || "",
        tin: clientData.tin || "",
        address: clientData.address || "",
        businessStyle: clientData.businessStyle || "",
        contactPerson: clientData.contactPerson || "",
        contactNumber: clientData.contactNumber || "",
      });
    }
  }, [clientData]);

  // ✅ Validation
  const validateTIN = (tin) => /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(tin);
  const validateContact = (contact) => /^(09\d{9}|\+639\d{9})$/.test(contact);

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Client Name is required.";
    if (!formData.nickname.trim())
      tempErrors.nickname = "Nickname is required.";
    if (formData.tin && !validateTIN(formData.tin))
      tempErrors.tin = "TIN must be in the format 123-456-789-000.";
    if (formData.contactNumber && !validateContact(formData.contactNumber))
      tempErrors.contactNumber =
        "Must start with 09 or +639 and contain 11 digits.";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ✅ Ensure SweetAlert always on top
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.name.trim() || "Client";

    try {
      setLoading(true);

      // 🔹 Close modal first for a clean transition
      handleClose();

      await withSpinner(`Updating ${entity}...`, async () => {
        const payload = {
          nClientId: formData.id,
          strClientName: formData.name,
          strClientNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,
        };

        await api.put(`clients/${formData.id}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onClientUpdated?.();
    } catch (error) {
      console.error("❌ Error updating client:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-client-modal"
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
            borderBottom: "1px solid #e0e0e0",
            px: 2.5,
            py: 1.5,
            bgcolor: "#f9fafb",
          }}
        >
          <Typography
            id="edit-client-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Edit Client
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
                label="Client Name"
                fullWidth
                size="small"
                value={formData.name}
                onChange={handleChange("name")}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Nickname"
                fullWidth
                size="small"
                value={formData.nickname}
                onChange={handleChange("nickname")}
                error={!!errors.nickname}
                helperText={errors.nickname}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TIN"
                fullWidth
                size="small"
                placeholder="123-456-789-000"
                value={formData.tin}
                onChange={handleChange("tin")}
                error={!!errors.tin}
                helperText={errors.tin}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={{ "& textarea": { resize: "vertical" } }}
                value={formData.address}
                onChange={handleChange("address")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Business Style"
                fullWidth
                size="small"
                value={formData.businessStyle}
                onChange={handleChange("businessStyle")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Contact Person"
                fullWidth
                size="small"
                value={formData.contactPerson}
                onChange={handleChange("contactPerson")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contact Number"
                fullWidth
                size="small"
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                value={formData.contactNumber}
                onChange={handleChange("contactNumber")}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
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
            {loading ? (
              <>
                <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditClientModal;
