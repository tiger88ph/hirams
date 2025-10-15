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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

function EditClientModal({
  open,
  handleClose,
  clientData,
  onSave,
  onClientUpdated,
}) {
  const [id, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [nickname, setNickname] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");
  const [businessStyle, setBusinessStyle] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    if (clientData) {
      setClientId(clientData.id || "");
      setClientName(clientData.name || "");
      setNickname(clientData.nickname || "");
      setTin(clientData.tin || "");
      setAddress(clientData.address || "");
      setBusinessStyle(clientData.businessStyle || "");
      setContactPerson(clientData.contactPerson || "");
      setContactNumber(clientData.contactNumber || "");
    }
  }, [clientData]);

  // ✅ Bring SweetAlert above modal
  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  // ✅ Validation functions
  const validateTIN = (tin) => /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(tin);
  const validateContact = (contact) => /^(09\d{9}|\+639\d{9})$/.test(contact);

  // ✅ Validate form
  const validateForm = () => {
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
        <span style="font-size:16px;">Updating... Please wait</span>
      </div>
    `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTopAlertZIndex();
      },
    });

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nClientId: id,
          strClientName: clientName,
          strClientNickName: nickname,
          strTIN: tin,
          strAddress: address,
          strBusinessStyle: businessStyle,
          strContactPerson: contactPerson,
          strContactNumber: contactNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const updatedClient = await response.json();

      // ✅ Update the parent component if callback exists
      if (onSave) {
        onSave(updatedClient);
      }

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Client "${clientName}" has been updated successfully.`,
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        if (onClientUpdated) onClientUpdated(); // optional callback
      });

      handleClose();
      setTopAlertZIndex();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update client. Please try again.",
        showConfirmButton: true,
      });
      setTopAlertZIndex();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-client-modal"
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
            borderBottom: "1px solid #e0e0e0",
            px: 2.5,
            py: 1.5,
            bgcolor: "#f9fafb",
          }}
        >
          <Typography
            id="edit-client-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Edit Client
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
                label="Client Name"
                fullWidth
                size="small"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Nickname"
                fullWidth
                size="small"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TIN"
                fullWidth
                size="small"
                placeholder="123-456-789-000"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={{ "& textarea": { resize: "vertical" } }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Business Style"
                fullWidth
                size="small"
                value={businessStyle}
                onChange={(e) => setBusinessStyle(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Contact Person"
                fullWidth
                size="small"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contact Number"
                fullWidth
                size="small"
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
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
            sx={{
              textTransform: "none",
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
            onClick={handleSave}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default EditClientModal;
