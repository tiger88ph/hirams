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

function AddUserModal({ open, handleClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    type: "",
    status: true, // true = Active
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Swal.fire("Error", "First and Last Name are required", "error");
      return;
    }

    Swal.fire({
      title: "",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#f5c518">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span style="font-size:16px;">Saving... Please wait</span>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();

        setTimeout(() => {
          if (onSave) onSave(formData);
          handleClose();

          Swal.fire({
            icon: "success",
            title: "Saved!",
            text: `User "${formData.firstName} ${formData.lastName}" has been added successfully.`,
            showConfirmButton: true,
          });

          setFormData({
            firstName: "",
            middleName: "",
            lastName: "",
            phone: "",
            email: "",
            type: "",
            status: true,
          });
        }, 1000);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-user-modal"
      aria-describedby="add-user-form"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
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
            id="add-user-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
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
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {/* Name row */}
            <Grid item xs={12} sm={5}>
              <TextField
                label="First Name"
                name="firstName"
                fullWidth
                size="small"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Middle Name"
                name="middleName"
                fullWidth
                size="small"
                value={formData.middleName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Last Name"
                name="lastName"
                fullWidth
                size="small"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>

            {/* Phone + Email */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Phone No."
                name="phone"
                fullWidth
                size="small"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                size="small"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            {/* Type */}
            <Grid item xs={12} sm={3}>
              <TextField
                label="Type"
                name="type"
                fullWidth
                size="small"
                value={formData.type}
                onChange={handleChange}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6} display="flex" alignItems="center">
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

export default AddUserModal;
