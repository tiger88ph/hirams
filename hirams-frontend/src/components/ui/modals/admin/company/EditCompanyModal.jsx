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

function EditCompanyModal({ open, handleClose, company, onCompanyUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    tin: "",
    address: "",
    vat: false,
    ewt: false,
  });

  const [loading, setLoading] = useState(false); // ✅ loading state

  // When company prop changes, populate the form
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        nickname: company.nickname || "",
        tin: company.tin || "",
        address: company.address || "",
        vat: company.vat || false,
        ewt: company.ewt || false,
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    setLoading(true); // disable button

    try {
      // ✅ Show loader SweetAlert (info icon)
      Swal.fire({
        title: "",
        html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#2196f3" class="swal2-animate-spin">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15h-1v-6h2v6h-1zm0-8h-1V7h2v2h-1z"/>
          </svg>
          <span style="font-size:16px;">Updating company... Please wait</span>
        </div>
      `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: {
          popup: "swal-top",
        },
      });

      // ✅ Ensure loader is above modal
      const swalPopup = document.querySelector(".swal2-container");
      if (swalPopup) swalPopup.style.zIndex = "9999";

      const payload = {
        strCompanyName: formData.name,
        strCompanyNickName: formData.nickname,
        strTIN: formData.tin,
        strAddress: formData.address,
        bVAT: formData.vat ? 1 : 0,
        bEWT: formData.ewt ? 1 : 0,
      };

      // 📨 Send PUT request
      const response = await fetch(
        `http://localhost:8000/api/companies/${company.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to update company");

      const updated = await response.json();
      console.log("✅ Updated company:", updated);

      // ✅ Close loader and show success
      Swal.fire({
        icon: "success",
        title: "Company Updated!",
        text: `${payload.strCompanyName} has been successfully updated.`,
        showConfirmButton: false,
        timer: 2000,
        didOpen: () => {
          // Ensure it's above modal
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) swalContainer.style.zIndex = "2000";
        },
      }).then(() => {
        handleClose();
        onCompanyUpdated(); // ✅ Refresh only the table (no page reload)
      });
    } catch (error) {
      console.error("❌ Error updating company:", error);

      // ❌ Error alert
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "There was an issue updating the company. Please try again.",
      });
    } finally {
      setLoading(false); // re-enable button
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-company-modal"
      aria-describedby="edit-company-form"
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
            px: 2.5,
            py: 1.5,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#f9fafb",
          }}
        >
          <Typography
            id="edit-company-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Edit Company
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
            {/* Company Name */}
            <Grid item xs={12}>
              <TextField
                label="Company Name"
                fullWidth
                size="small"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            {/* Nickname + TIN */}
            <Grid item xs={6}>
              <TextField
                label="Nickname"
                fullWidth
                size="small"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TIN"
                fullWidth
                size="small"
                name="tin"
                value={formData.tin}
                onChange={handleChange}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                size="small"
                multiline
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>

            {/* VAT & EWT */}
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    name="vat"
                    checked={formData.vat}
                    onChange={handleSwitchChange}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                    Value Added Tax
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    name="ewt"
                    checked={formData.ewt}
                    onChange={handleSwitchChange}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                    Expanded Withholding Tax
                  </Typography>
                }
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
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditCompanyModal;
