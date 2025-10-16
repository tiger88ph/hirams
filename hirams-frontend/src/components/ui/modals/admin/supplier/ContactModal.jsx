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
import AddIcon from "@mui/icons-material/Add";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import Swal from "sweetalert2";

function ContactModal({ open, handleClose, contactList = [], onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    strName: "",
    strNumber: "",
    strPosition: "",
    strDepartment: "",
  });
  const [contacts, setContacts] = useState(contactList);

  useEffect(() => {
    if (contactList?.length) {
      setContacts(contactList);
    } else {
      setContacts([]);
    }
  }, [contactList]);

  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  const validateContact = (number) => /^(09\d{9}|\+639\d{9})$/.test(number);

  const validateForm = () => {
    if (!formData.strName.trim()) {
      Swal.fire("Missing Field", "Please enter Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!formData.strNumber.trim()) {
      Swal.fire("Missing Field", "Please enter Contact Number.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!validateContact(formData.strNumber)) {
      Swal.fire(
        "Invalid Contact Number",
        "Number must start with 09 or +639 and contain 11 digits.",
        "error"
      );
      setTopAlertZIndex();
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardClick = (index) => {
    const contact = contacts[index];
    setFormData(contact);
    setEditIndex(index);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setFormData({
      strName: "",
      strNumber: "",
      strPosition: "",
      strDepartment: "",
    });
    setEditIndex(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedContacts = [...contacts];
    if (editIndex !== null) {
      updatedContacts[editIndex] = formData;
    } else {
      updatedContacts.push(formData);
    }

    setContacts(updatedContacts);
    setIsEditing(false);
    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Contact information saved successfully.",
      timer: 1500,
      showConfirmButton: false,
    });

    if (onUpdate) onUpdate(updatedContacts);
  };

  const visibleContacts = contacts.filter(
    (c) =>
      c.strName?.trim() !== "" ||
      c.strNumber?.trim() !== "" ||
      c.strPosition?.trim() !== "" ||
      c.strDepartment?.trim() !== ""
  );

  return (
    <Modal
      open={open}
      onClose={() => {
        setIsEditing(false);
        handleClose();
      }}
      aria-labelledby="contact-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Supplier Contacts
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
          {!isEditing ? (
            <Grid container spacing={1.5}>
              {visibleContacts.length > 0 ? (
                visibleContacts.map((c, index) => (
                  <Grid item xs={12} key={index}>
                    <Box
                      onClick={() => handleCardClick(index)}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        bgcolor: "#e3f2fd",
                        borderRadius: 2,
                        p: 2,
                        cursor: "pointer",
                        transition: "0.2s",
                        "&:hover": { bgcolor: "#d2e3fc" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Name:</strong> {c.strName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Contact Number:</strong> {c.strNumber}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Position:</strong> {c.strPosition}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Department:</strong> {c.strDepartment}
                        </Typography>
                      </Box>
                      <ContactPhoneIcon
                        sx={{ fontSize: 80, color: "#1976d2", opacity: 0.9 }}
                      />
                    </Box>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography
                    align="center"
                    sx={{
                      color: "gray",
                      fontStyle: "italic",
                      py: 3,
                      borderRadius: 2,
                      bgcolor: "#f5f5f5",
                    }}
                  >
                    No contacts registered.
                  </Typography>
                </Grid>
              )}

              {/* Add new contact card */}
              <Grid item xs={12}>
                <Box
                  onClick={handleAddNew}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #90caf9",
                    borderRadius: 2,
                    p: 3,
                    cursor: "pointer",
                    transition: "0.2s",
                    "&:hover": { bgcolor: "#e3f2fd" },
                  }}
                >
                  <AddIcon sx={{ color: "#1976d2", fontSize: 40 }} />
                  <Typography sx={{ ml: 1, color: "#1976d2" }}>
                    Add Contact
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  name="strName"
                  fullWidth
                  size="small"
                  value={formData.strName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Contact Number"
                  name="strNumber"
                  fullWidth
                  size="small"
                  placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                  value={formData.strNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Position"
                  name="strPosition"
                  fullWidth
                  size="small"
                  value={formData.strPosition}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Department"
                  name="strDepartment"
                  fullWidth
                  size="small"
                  value={formData.strDepartment}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          )}
        </Box>

        <Divider />

        {/* Footer */}
        {isEditing && (
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
              onClick={() => setIsEditing(false)}
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
        )}
      </Box>
    </Modal>
  );
}

export default ContactModal;
