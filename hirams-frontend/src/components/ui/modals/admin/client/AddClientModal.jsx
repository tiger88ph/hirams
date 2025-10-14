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
  const [clientName, setClientName] = useState("");
  const [nickname, setNickname] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");
  const [businessStyle, setBusinessStyle] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const handleSave = () => {
    if (!clientName.trim() || !nickname.trim()) {
      Swal.fire("Error", "Client Name and Nickname are required", "error");
      return;
    }

    const newClient = {
      nClientId: Date.now(),
      strClientName: clientName,
      strClientNickName: nickname,
      strTIN: tin,
      strAddress: address,
      strBusinessStyle: businessStyle,
      strContactPerson: contactPerson,
      strContactNumber: contactNumber,
    };

    if (onSave) onSave(newClient);
    handleClose();

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
          Swal.fire({
            icon: "success",
            title: "Saved!",
            text: `Client "${clientName}" has been added successfully.`,
            showConfirmButton: true,
          });
        }, 1000);
      },
    });

    // Reset form
    setClientName("");
    setNickname("");
    setTin("");
    setAddress("");
    setBusinessStyle("");
    setContactPerson("");
    setContactNumber("");
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="add-client-modal">
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
          }}
        >
          <Typography
            id="add-client-modal"
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

export default AddClientModal;
