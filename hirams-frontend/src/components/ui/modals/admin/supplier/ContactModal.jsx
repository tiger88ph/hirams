import React, { useState, useEffect } from "react";
import { Grid, TextField, Box, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import ModalContainer from "../../../../../components/common/ModalContainer";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => setContacts(contactList || []), [contactList]);

  const validateContact = (number) => /^(09\d{9}|\+639\d{9})$/.test(number);

  const validateForm = () => {
    if (!formData.strName.trim()) {
      Swal.fire("Missing Field", "Please enter Name.", "warning");
      return false;
    }
    if (!formData.strNumber.trim()) {
      Swal.fire("Missing Field", "Please enter Contact Number.", "warning");
      return false;
    }
    if (!validateContact(formData.strNumber)) {
      Swal.fire(
        "Invalid Contact Number",
        "Number must start with 09 or +639 and contain 11 digits.",
        "error"
      );
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardClick = (index) => {
    setFormData(contacts[index]);
    setEditIndex(index);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setFormData({ strName: "", strNumber: "", strPosition: "", strDepartment: "" });
    setEditIndex(null);
    setIsEditing(true);
  };

  const handleRemoveContact = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will remove the contact.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...contacts];
        updated.splice(index, 1);
        setContacts(updated);
        onUpdate?.(updated);
        Swal.fire("Deleted!", "Contact removed.", "success");
      }
    });
  };

  const handleSave = () => {
    if (!validateForm()) return;
    setLoading(true);

    const updatedContacts = [...contacts];
    if (editIndex !== null) updatedContacts[editIndex] = formData;
    else updatedContacts.push(formData);

    setContacts(updatedContacts);
    setIsEditing(false);
    onUpdate?.(updatedContacts);

    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Contact information saved successfully.",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => setLoading(false));
  };

  const visibleContacts = contacts.filter((c) =>
    [c.strName, c.strNumber, c.strPosition, c.strDepartment].some((f) => f && f.trim() !== "")
  );

  return (
    <ModalContainer
      open={open}
      handleClose={() => setIsEditing(false) || handleClose()}
      title="Supplier Contacts"
      onSave={handleSave}
      loading={loading}
      showFooter={isEditing}
    >
      {!isEditing ? (
        <Grid container spacing={1.5}>
          {visibleContacts.map((c, index) => (
            <Grid item xs={12} key={index}>
              <Box
                sx={{
                  position: "relative",
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
                onClick={() => handleCardClick(index)}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveContact(index);
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "#fff",
                    width: 24,
                    height: 24,
                    "&:hover": { bgcolor: "#f0f0f0" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="body2"><strong>Name:</strong> {c.strName}</Typography>
                  <Typography variant="body2"><strong>Contact Number:</strong> {c.strNumber}</Typography>
                  <Typography variant="body2"><strong>Position:</strong> {c.strPosition}</Typography>
                  <Typography variant="body2"><strong>Department:</strong> {c.strDepartment}</Typography>
                </Box>
                <ContactPhoneIcon sx={{ fontSize: 80, color: "#1976d2", opacity: 0.9 }} />
              </Box>
            </Grid>
          ))}

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
              <Typography sx={{ ml: 1, color: "#1976d2" }}>Add Contact</Typography>
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                onClick={() => setIsEditing(false)}
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 16, color: "#1976d2", mr: 0.5 }} />
                <Typography sx={{ color: "#1976d2", fontWeight: 400, fontSize: "0.8rem" }}>Contacts</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Name" name="strName" fullWidth size="small" value={formData.strName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Contact Number" name="strNumber" fullWidth size="small" placeholder="09XXXXXXXXX or +639XXXXXXXXX" value={formData.strNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Position" name="strPosition" fullWidth size="small" value={formData.strPosition} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Department" name="strDepartment" fullWidth size="small" value={formData.strDepartment} onChange={handleChange} />
          </Grid>
        </Grid>
      )}
    </ModalContainer>
  );
}

export default ContactModal;
