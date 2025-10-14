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

function AddClientModal({ open, handleClose, onSave }) {
  const [formData, setFormData] = useState({
    strClientName: "",
    strClientNickName: "",
    strTIN: "",
    strAddress: "",
    strBusinessStyle: "",
    strContactPerson: "",
    strContactNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.strClientName.trim() || !formData.strClientNickName.trim()) {
      Swal.fire("Error", "Client Name and Nickname are required", "error");
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
            text: `Client "${formData.strClientName}" has been added successfully.`,
            showConfirmButton: true,
          });

          setFormData({
            strClientName: "",
            strClientNickName: "",
            strTIN: "",
            strAddress: "",
            strBusinessStyle: "",
            strContactPerson: "",
            strContactNumber: "",
          });
        }, 1000);
      },
    });
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
            id="add-client-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Add New Client
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client Name"
                name="strClientName"
                fullWidth
                size="small"
                value={formData.strClientName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client Nickname"
                name="strClientNickName"
                fullWidth
                size="small"
                value={formData.strClientNickName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="TIN"
                name="strTIN"
                fullWidth
                size="small"
                value={formData.strTIN}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Business Style"
                name="strBusinessStyle"
                fullWidth
                size="small"
                value={formData.strBusinessStyle}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Address"
                name="strAddress"
                fullWidth
                size="small"
                value={formData.strAddress}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Person"
                name="strContactPerson"
                fullWidth
                size="small"
                value={formData.strContactPerson}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Number"
                name="strContactNumber"
                fullWidth
                size="small"
                value={formData.strContactNumber}
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

export default AddClientModal;
