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

function AddCompanyModal({ open, handleClose }) {
  const [formData, setFormData] = useState({
    strCompanyName: "",
    strCompanyNickName: "",
    strTIN: "",
    strAddress: "",
    bVAT: false,
    bEWT: false,
  });

  const [loading, setLoading] = useState(false); // Disable button while saving

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const addCompany = async () => {
    try {
      // ✅ Show loader SweetAlert on top of modal
      Swal.fire({
        title: "",
        html: `
       <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#2196f3" class="swal2-animate-spin">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15h-1v-6h2v6h-1zm0-8h-1V7h2v2h-1z"/>
          </svg>
          <span style="font-size:16px;">Adding company... Please wait</span>
        </div>
      `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
        // ✅ Force alert above Material UI modal
        customClass: {
          popup: "swal-top",
        },
      });

      // ✅ Adjust z-index dynamically
      const swalPopup = document.querySelector(".swal2-container");
      if (swalPopup) swalPopup.style.zIndex = "9999";

      const response = await fetch("http://127.0.0.1:8000/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add company");

      const data = await response.json();
      console.log("Company added:", data);

      Swal.fire({
        icon: "success",
        title: "Company Added",
        text: `${data.strCompanyName} has been successfully added!`,
        showConfirmButton: false,
        timer: 2000,
        didOpen: () => {
          // ✅ Force SweetAlert container above modal
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) swalContainer.style.zIndex = "9999";
        },
      }).then(() => {
        handleClose();
        window.location.reload();
      });

      // Reset form
      setFormData({
        strCompanyName: "",
        strCompanyNickName: "",
        strTIN: "",
        strAddress: "",
        bVAT: false,
        bEWT: false,
      });

      handleClose();
    } catch (error) {
      console.error(error);

      // ❌ Show error SweetAlert
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add company. Please try again.",
        didOpen: () => {
          // ✅ Force SweetAlert container above modal
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) swalContainer.style.zIndex = "9999";
        },
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-company-modal"
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
