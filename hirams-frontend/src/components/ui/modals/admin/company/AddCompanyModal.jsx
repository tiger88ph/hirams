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

function AddCompanyModal({ open, handleClose, onSave }) {
  const [companyName, setCompanyName] = useState("");
  const [nickname, setNickname] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");
  const [vat, setVat] = useState(false);
  const [ewt, setEwt] = useState(false);

  const handleSave = () => {
    if (!companyName.trim()) {
      Swal.fire("Error", "Company Name is required", "error");
      return;
    }

    const newCompany = {
      id: Date.now(),
      name: companyName,
      nickname,
      tin,
      address,
      vat,
      ewt,
    };

    if (onSave) onSave(newCompany);
    handleClose();

    Swal.fire({
      title: "",
      html: `
    <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
      <!-- Exclamation icon first -->
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#f5c518">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
      <!-- Spinner text -->
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
            text: `Company "${companyName}" has been added successfully.`,
            showConfirmButton: true,
          });
        }, 1000);
      },
    });

    // Reset form
    setCompanyName("");
    setNickname("");
    setTin("");
    setAddress("");
    setVat(false);
    setEwt(false);
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
            borderBottom: "1px solid #e0e0e0",
            px: 2.5,
            py: 1.5,
          }}
        >
          <Typography
            id="add-company-modal"
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
                fullWidth
                size="small"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
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
                minRows={3}
                sx={{ "& textarea": { resize: "vertical" } }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                      checked={vat}
                      onChange={(e) => setVat(e.target.checked)}
                      color="primary"
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
                      checked={ewt}
                      onChange={(e) => setEwt(e.target.checked)}
                      color="primary"
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

export default AddCompanyModal;
