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
import Swal from "sweetalert2";

function EditUserModal({ open, handleClose, user, onSave }) {
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

  // ✅ Bring SweetAlert above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  useEffect(() => {
    if (user) {
      let lastName = "";
      let firstName = "";
      let middleName = "";

      if (user.fullName?.includes(",")) {
        const [last, rest] = user.fullName.split(",").map((s) => s.trim());
        lastName = last;
        if (rest) {
          const nameParts = rest.split(" ");
          firstName = nameParts[0] || "";
          middleName = nameParts[1]?.replace(".", "") || "";
        }
      }

      setFormData({
        firstName,
        middleName,
        lastName,
        nickname: user.nickname || "",
        phone: user.phone || "",
        email: user.email || "",
        type: user.type || "",
        status: user.status ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Validation Function (same as AddUserModal)
  const validateForm = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^(\+?\d{10,15})$/;

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

  // ✅ Save Function (same UI as Add)
  const handleSave = () => {
    if (!validateForm()) return;

    Swal.fire({
      title: "",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#f5c518" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span style="font-size:16px;">Updating... Please wait</span>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTopAlertZIndex();

        setTimeout(() => {
          if (onSave) {
            const fullName = `${formData.lastName}, ${formData.firstName} ${
              formData.middleName ? formData.middleName[0] + "." : ""
            }`;
            onSave({ ...user, ...formData, fullName });
          }

          handleClose();

          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: `User "${formData.firstName} ${formData.lastName}" has been updated successfully.`,
            showConfirmButton: true,
          });
          setTopAlertZIndex();
        }, 1000);
      },
    });
    setTopAlertZIndex();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-user-modal"
      aria-describedby="edit-user-form"
    >
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
            py: 1.2,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333" }}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="firstName"
                fullWidth
                size="small"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
              <TextField
                label="Nickname"
                name="nickname"
                fullWidth
                size="small"
                value={formData.nickname}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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
            sx={{
              textTransform: "none",
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditUserModal;
