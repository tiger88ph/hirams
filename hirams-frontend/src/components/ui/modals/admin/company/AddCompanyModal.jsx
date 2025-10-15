import React, { useState } from "react";
import Swal from "sweetalert2";
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

function AddCompanyModal({ open, handleClose, onCompanyAdded }) {
  const [formData, setFormData] = useState({
    strCompanyName: "",
    strCompanyNickName: "",
    strTIN: "",
    strAddress: "",
    bVAT: false,
    bEWT: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  // ✅ Validation (TIN is optional but must follow format if provided)
  const validateForm = () => {
    const tinPattern = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/;

    if (!formData.strCompanyName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter the Company Name.",
      });
      setTopAlertZIndex();
      return false;
    }

    if (!formData.strCompanyNickName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter the Company Nickname.",
      });
      setTopAlertZIndex();
      return false;
    }

    if (formData.strTIN.trim() && !tinPattern.test(formData.strTIN.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Invalid TIN Format",
        text: "TIN must follow 123-456-789 or 123-456-789-000 format.",
      });
      setTopAlertZIndex();
      return false;
    }

    return true;
  };

  // ✅ Ensure alert is always above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  const addCompany = async () => {
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
            <span style="font-size:16px;">Adding company... Please wait</span>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      setTopAlertZIndex();

      const response = await fetch("http://127.0.0.1:8000/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add company");
      const data = await response.json();

      Swal.fire({
        icon: "success",
        title: "Company Added",
        text: `${data.strCompanyName} has been successfully added!`,
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        handleClose();
        onCompanyAdded(); // ✅ Refresh only table data
      });
      setTopAlertZIndex();

      // Reset form
      setFormData({
        strCompanyName: "",
        strCompanyNickName: "",
        strTIN: "",
        strAddress: "",
        bVAT: false,
        bEWT: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add company. Please try again.",
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
            px: 2.5,
            py: 1.5,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Add Company
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
                label="Company Name"
                name="strCompanyName"
                fullWidth
                size="small"
                value={formData.strCompanyName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Nickname"
                name="strCompanyNickName"
                fullWidth
                size="small"
                value={formData.strCompanyNickName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TIN"
                name="strTIN"
                placeholder="123-456-789 or 123-456-789-000"
                fullWidth
                size="small"
                value={formData.strTIN}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Address"
                name="strAddress"
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={{ "& textarea": { resize: "vertical" } }}
                value={formData.strAddress}
                onChange={handleChange}
              />
            </Grid>

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
            onClick={addCompany}
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

export default AddCompanyModal;
