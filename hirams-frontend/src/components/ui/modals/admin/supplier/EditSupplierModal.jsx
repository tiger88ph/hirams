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
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

function EditSupplierModal({ open, handleClose, supplier, onUpdate }) {
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    address: "",
    bVAT: false,
    bEWT: false,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        fullName: supplier.fullName || "",
        nickname: supplier.nickname || "",
        address: supplier.address || "",
        bVAT: supplier.vat === "VAT",
        bEWT: supplier.ewt === "EWT",
      });
    }
  }, [supplier]);

  // ✅ Bring SweetAlert to front
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Input and switch handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  // ✅ Save changes
  const handleSave = async () => {
    if (!validateForm()) return;

    Swal.fire({
      title: "",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#1976d2" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 22c5.421 0 10-4.579 10-10S17.421 2 12 2 2 6.579 2 12s4.579 10 10 10zm0-18c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"/>
          </svg>
          <span style="font-size:16px;">Updating Supplier...</span>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
        setTopAlertZIndex();

        try {
          const response = await fetch(
            `http://127.0.0.1:8000/api/suppliers/${supplier.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                strFullName: formData.fullName,
                strNickname: formData.nickname,
                strAddress: formData.address,
                vat: formData.bVAT ? "VAT" : "",
                ewt: formData.bEWT ? "EWT" : "",
              }),
            }
          );

          if (!response.ok) throw new Error("Failed to update supplier");

          const result = await response.json();

          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: `Supplier "${formData.fullName}" updated successfully.`,
            showConfirmButton: false,
            timer: 2000,
          }).then(() => {
            handleClose();
            if (onUpdate) onUpdate(result);
          });

          setTopAlertZIndex();
        } catch (error) {
          console.error("Error updating supplier:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to update supplier. Please try again.",
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
      aria-labelledby="edit-supplier-modal"
      aria-describedby="edit-supplier-form"
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
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Edit Supplier
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

            {/* VAT & EWT Switches */}
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
            Update
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditSupplierModal;
