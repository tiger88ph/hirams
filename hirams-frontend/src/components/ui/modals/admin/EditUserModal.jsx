import React, { useEffect, useState } from "react";
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

function EditUserModal({ open, handleClose, user }) {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      let lastName = "";
      let firstName = "";
      let middleName = "";

      if (user.fullName?.includes(",")) {
        const [last, rest] = user.fullName.split(",").map((s) => s.trim());
        lastName = last;
        if (rest) {
          const nameParts = rest.split(" ");
          firstName = nameParts[0] || "";
          middleName = nameParts[1]?.replace(".", "") || "";
        }
      }

      setFormData({
        lastName,
        firstName,
        middleName,
        suffix: user.suffix || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // ✅ Combine names back to the same format
    const fullName = `${formData.lastName}, ${formData.firstName} ${formData.middleName ? formData.middleName[0] + "." : ""}`;
    const updatedUser = { ...user, ...formData, fullName };

    console.log("Updated User Data:", updatedUser);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-user-modal"
      aria-describedby="edit-user-form"
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
            id="edit-user-modal"
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Edit User
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: "gray",
              "&:hover": { color: "black" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                size="small"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Middle Name"
                fullWidth
                size="small"
                value={formData.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                size="small"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Suffix"
                fullWidth
                size="small"
                value={formData.suffix}
                onChange={(e) => handleChange("suffix", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone No."
                fullWidth
                size="small"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                size="small"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
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

export default EditUserModal;
