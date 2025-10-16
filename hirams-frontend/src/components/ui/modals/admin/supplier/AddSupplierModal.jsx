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

function AddSupplierModal({ open, handleClose, onSave, onClientAdded }) {
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    address: "",
    bVAT: false,
    bEWT: false,
  });

  // ✅ Ensure SweetAlert appears above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Handle switch changes
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // ✅ Validate required fields
  const validateForm = () => {
    const { fullName, nickname } = formData;

    if (!fullName.trim()) {
      Swal.fire("Missing Field", "Please enter Full Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!nickname.trim()) {
      Swal.fire("Missing Field", "Please enter Nickname.", "warning");
      setTopAlertZIndex();
      return false;
    }

    return true;
  };

  // ✅ Save supplier
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
          const response = await fetch("http://127.0.0.1:8000/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              strFullName: formData.fullName,
              strNickname: formData.nickname,
              strAddress: formData.address,
              vat: formData.bVAT ? "VAT" : "",
              ewt: formData.bEWT ? "EWT" : "",
            }),
          });

          if (!response.ok) throw new Error("Failed to save supplier");

          const result = await response.json();
          if (onSave) onSave(result);

          Swal.fire({
            icon: "success",
            title: "Saved!",
            text: `Supplier "${formData.fullName}" added successfully.`,
            showConfirmButton: false,
            timer: 2000,
          }).then(() => {
            handleClose();
            if (onClientAdded) onClientAdded();
          });

          setTopAlertZIndex();

          // ✅ Reset form
          setFormData({
            fullName: "",
            nickname: "",
            address: "",
            bVAT: false,
            bEWT: false,
          });
        } catch (error) {
          console.error("Error saving supplier:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to save supplier. Please try again.",
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
      aria-labelledby="add-supplier-modal"
      aria-describedby="add-supplier-form"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 460 },
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
            Add Supplier
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
                label="Full Name"
                name="fullName"
                fullWidth
                size="small"
                value={formData.fullName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Nickname"
                name="nickname"
                fullWidth
                size="small"
                value={formData.nickname}
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

            {/* ✅ VAT and EWT Switches */}
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
                      onChange={handleSwitchChange}
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
                      onChange={handleSwitchChange}
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

export default AddSupplierModal;
