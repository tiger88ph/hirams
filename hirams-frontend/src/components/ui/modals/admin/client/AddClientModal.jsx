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
import Swal from "sweetalert2";

function AddClientModal({ open, handleClose, onSave, onClientAdded }) {
  const [formData, setFormData] = useState({
    clientName: "",
    nickname: "",
    tin: "",
    address: "",
    businessStyle: "",
    contactPerson: "",
    contactNumber: "",
  });

  // ✅ Ensure SweetAlert appears above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Validation functions
  const validateTIN = (tin) => /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(tin);
  const validateContact = (contact) => /^(09\d{9}|\+639\d{9})$/.test(contact);

  // ✅ Validate form
  const validateForm = () => {
    const { clientName, nickname, tin, contactNumber } = formData;

    if (!clientName.trim()) {
      Swal.fire("Missing Field", "Please enter Client Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!nickname.trim()) {
      Swal.fire("Missing Field", "Please enter Nickname.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (tin && !validateTIN(tin)) {
      Swal.fire(
        "Invalid TIN",
        "TIN must be in the format 123-456-789-000.",
        "error"
      );
      setTopAlertZIndex();
      return false;
    }
    if (contactNumber && !validateContact(contactNumber)) {
      Swal.fire(
        "Invalid Contact Number",
        "Contact must start with 09 or +639 and contain 11 digits.",
        "error"
      );
      setTopAlertZIndex();
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    Swal.fire({
      title: "",
      html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#f5c518" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <span style="font-size:16px;">Saving... Please wait</span>
      </div>
    `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
        setTopAlertZIndex();

        try {
          const response = await fetch("http://127.0.0.1:8000/api/clients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              strClientName: formData.clientName,
              strClientNickName: formData.nickname,
              strTIN: formData.tin,
              strAddress: formData.address,
              strBusinessStyle: formData.businessStyle,
              strContactPerson: formData.contactPerson,
              strContactNumber: formData.contactNumber,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save client");
          }

          const result = await response.json();

          // ✅ Optional: update parent list
          if (onSave) onSave(result);

          handleClose();

          Swal.fire({
            icon: "success",
            title: "Saved!",
            text: `Client "${formData.clientName}" added successfully.`,
            showConfirmButton: false,
            timer: 2000,
          }).then(() => {
            handleClose();
            if (onClientAdded) onClientAdded(); // ✅ Trigger table reload
          });

          setTopAlertZIndex();

          // ✅ Reset form
          setFormData({
            clientName: "",
            nickname: "",
            tin: "",
            address: "",
            businessStyle: "",
            contactPerson: "",
            contactNumber: "",
          });
        } catch (error) {
          console.error("Error saving client:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to save client. Please try again.",
          });
          setTopAlertZIndex();
        }
      },
    });
    setTopAlertZIndex();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-client-modal"
      aria-describedby="add-client-form"
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
            px: 2,
            py: 1.2,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#f9fafb",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
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
                label="TIN"
                name="tin"
                fullWidth
                size="small"
                placeholder="123-456-789-000"
                value={formData.tin}
                onChange={handleChange}
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

export default AddClientModal;
