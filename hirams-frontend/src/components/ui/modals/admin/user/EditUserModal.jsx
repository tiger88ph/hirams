import React, { useEffect, useState } from "react";
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
import api from "../../../../../api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function EditUserModal({ open, handleClose, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    type: "",
    status: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Populate form when `user` changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        nickname: user.nickname || "",
        type: user.type || "",
        status: user.status ?? true,
      });
      setErrors({});
    }
  }, [user]);

  // ✅ Handle field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear individual field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Inline validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.nickname.trim()) newErrors.nickname = "Nickname is required";
    if (!formData.type.trim()) newErrors.type = "Type is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ✅ Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = `${formData.firstName} ${formData.lastName}`.trim() || "User";

    try {
      setLoading(true);

      // 🔹 Hide modal before showing spinner
      handleClose();

      await withSpinner(`Updating ${entity}...`, async () => {
        const payload = {
          strFName: formData.firstName,
          strMName: formData.middleName || "",
          strLName: formData.lastName,
          strNickName: formData.nickname,
          cUserType: formData.type,
          cStatus: formData.status ? "A" : "I",
        };

        await api.put(`users/${user.id}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onUserUpdated?.();
    } catch (error) {
      console.error("Error updating user:", error);
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
          width: 420,
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
            Edit User
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
            <Grid item xs={6}>
              <TextField
                label="First Name"
                name="firstName"
                fullWidth
                size="small"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName || ""}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Middle Name"
                name="middleName"
                fullWidth
                size="small"
                value={formData.middleName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Last Name"
                name="lastName"
                fullWidth
                size="small"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName || ""}
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
                label="Type"
                name="type"
                fullWidth
                size="small"
                value={formData.type}
                onChange={handleChange}
                error={!!errors.type}
                helperText={errors.type || ""}
              />
            </Grid>
            <Grid item xs={12} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status}
                    onChange={handleChange}
                    name="status"
                    color="primary"
                  />
                }
                label={formData.status ? "Active" : "Inactive"}
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
            {loading ? "Updating..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditUserModal;
