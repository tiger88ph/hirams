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
import Swal from "sweetalert2";
import api from "../../../../../api/api";

function AddUserModal({ open, handleClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    phone: "",
    email: "",
    type: "",
    status: true,
  });

  const [loading, setLoading] = useState(false);

  // ✅ Bring Swal above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Validation
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Swal.fire("Missing Field", "Please enter First Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!formData.lastName.trim()) {
      Swal.fire("Missing Field", "Please enter Last Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!formData.nickname.trim()) {
      Swal.fire("Missing Field", "Please enter Nickname.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!formData.type.trim()) {
      Swal.fire("Missing Field", "Please specify a Type.", "warning");
      setTopAlertZIndex();
      return false;
    }
    return true;
  };

  // ✅ Save User
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      Swal.fire({
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#2196f3" class="swal2-animate-spin" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2z" opacity=".1"/>
              <path d="M12 2v4a6 6 0 0 1 0 12v4a10 10 0 0 0 0-20z"/>
            </svg>
            <span style="font-size:16px;">Saving user... Please wait</span>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      setTopAlertZIndex();

      const payload = {
        strFName: formData.firstName,
        strMName: formData.middleName || "",
        strLName: formData.lastName,
        strNickName: formData.nickname,
        cUserType: formData.type,
        cStatus: formData.status ? "A" : "I",
      };

      const data = await api.post("users", payload);

      Swal.fire({
        icon: "success",
        title: "User Added",
        text: `${data.strFName} ${data.strLName} has been successfully added!`,
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        handleClose();
        if (onUserAdded) onUserAdded(); // ✅ Trigger table reload
      });
      setTopAlertZIndex();

      // Reset form
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        nickname: "",
        phone: "",
        email: "",
        type: "",
        status: true,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save user. Please try again.",
      });
      setTopAlertZIndex();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} sx={{ zIndex: 1200 }}>
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
            Add User
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
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default AddUserModal;
