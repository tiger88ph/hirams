import React, { useState, useEffect, useRef } from "react";
import { Grid, TextField, Box, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";
import { validateFormData } from "../../../../../utils/form/validation";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function ContactModal({ open, handleClose, contactList = [], onUpdate, supplierId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    nSupplierId: "",
    strName: "",
    strNumber: "",
    strPosition: "",
    strDepartment: "",
  });
  const [errors, setErrors] = useState({});
  const [contacts, setContacts] = useState(contactList || []);
  const [loading, setLoading] = useState(false);
  const gridRef = useRef(null); // for scrolling

  useEffect(() => setContacts(contactList || []), [contactList]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CONTACT_SUPPLIER");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleCardClick = (index) => {
    setFormData(contacts[index]);
    setEditIndex(index);
    setIsEditing(true);
    setErrors({});
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
    setErrors({});
  };

  const handleRemoveContact = async (index) => {
    const contact = contacts[index];
    if (!contact?.nSupplierContactId) return;

    const confirmed = await showSwal("CONFIRM", {
      title: "Delete Contact?",
      text: "Are you sure you want to delete this contact?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirmed) return;

    try {
      await withSpinner("Deleting contact...", async () => {
        await api.delete(`supplier-contacts/${contact.nSupplierContactId}`);
      });

      const updatedContacts = contacts.filter((_, i) => i !== index);
      setContacts(updatedContacts);
      onUpdate?.(updatedContacts);

      await showSwal("SUCCESS", { title: "Contact deleted" });
    } catch (err) {
      console.error("Error deleting contact:", err);
      await showSwal("ERROR", { title: err.response?.data?.message || "Failed to delete contact." });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.strName?.trim() || "Contact";

    try {
      setLoading(true);
      await withSpinner(editIndex !== null ? `Updating ${entity}...` : `Adding ${entity}...`, async () => {
        const payload = { ...formData, nSupplierId: supplierId };
        let response;
        if (editIndex !== null) {
          response = await api.put(`supplier-contacts/${formData.nSupplierContactId}`, payload);
        } else {
          response = await api.post("supplier-contacts", payload);
        }

        const contactData = {
          ...formData,
          ...(response?.data?.supplier_contact || response?.data?.data || response?.data),
        };

        const updatedContacts = [...contacts];
        if (editIndex !== null) updatedContacts[editIndex] = contactData;
        else updatedContacts.push(contactData);

        setContacts(updatedContacts);
        onUpdate?.(updatedContacts);
        setIsEditing(false);
        setErrors({});

        // scroll to bottom if added
        if (editIndex === null && gridRef.current) {
          gridRef.current.scrollTop = gridRef.current.scrollHeight;
        }
      });

      await showSwal("SUCCESS", { title: `${entity} saved successfully!` });
    } catch (err) {
      console.error("Error saving contact:", err);
      await showSwal("ERROR", { title: err.response?.data?.message || `Failed to save ${entity}.` });
    } finally {
      setLoading(false);
    }
  };

  const visibleContacts = contacts.filter(
    (c) => c && typeof c === "object" && [c.strName, c.strNumber, c.strPosition, c.strDepartment].some((f) => f?.trim())
  );

  return (
    <ModalContainer
      open={open}
      handleClose={() => setIsEditing(false) || handleClose()}
      title="Supplier Contacts"
      onSave={handleSave}
      loading={loading}
      showFooter={true}
    >
      {!isEditing ? (
        <Grid
          container
          spacing={1.5}
          sx={{ maxHeight: 400, overflowY: "auto", pr: 1, scrollBehavior: "smooth" }}
          ref={gridRef}
        >
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
              <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => setIsEditing(false)}>
                <ArrowBackIosNewIcon sx={{ fontSize: 16, color: "#1976d2", mr: 0.5 }} />
                <Typography sx={{ color: "#1976d2", fontWeight: 400, fontSize: "0.8rem" }}>Contacts</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Name" name="strName" fullWidth size="small" value={formData.strName} onChange={handleChange} error={!!errors.strName} helperText={errors.strName || ""} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Contact Number" name="strNumber" fullWidth size="small" placeholder="09XXXXXXXXX or +639XXXXXXXXX" value={formData.strNumber} onChange={handleChange} error={!!errors.strNumber} helperText={errors.strNumber || ""} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Position" name="strPosition" fullWidth size="small" value={formData.strPosition} onChange={handleChange} error={!!errors.strPosition} helperText={errors.strPosition || ""} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Department" name="strDepartment" fullWidth size="small" value={formData.strDepartment} onChange={handleChange} error={!!errors.strDepartment} helperText={errors.strDepartment || ""} />
          </Grid>
        </Grid>
      )}
    </ModalContainer>
  );
}

export default ContactModal;
