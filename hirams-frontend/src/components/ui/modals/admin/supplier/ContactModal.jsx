import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";

function ContactModal({ open, handleClose, supplier, onUpdate, supplierId }) {
  const [contactList, setContactList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [formData, setFormData] = useState({
    strName: "",
    strNumber: "",
    strPosition: "",
    strDepartment: "",
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteLetter, setDeleteLetter] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (supplier?.contacts) {
      setContactList(
        Array.isArray(supplier.contacts)
          ? supplier.contacts
          : [supplier.contacts]
      );
    } else {
      setContactList([]);
    }
  }, [supplier]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
    setTimeout(
      () => setToast({ open: false, message: "", severity: "success" }),
      3000
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.strName.trim()) newErrors.strName = "Name is required";
    if (!formData.strNumber.trim())
      newErrors.strNumber = "Contact Number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const name = formData.strName;
    setLoading(true);
    setLoadingMessage(
      selectedIndex !== null ? `Updating ${name}...` : `Adding ${name}...`
    );

    try {
      const payload = { ...formData, nSupplierId: supplierId };

      if (selectedIndex !== null) {
        await api.put(
          `supplier-contacts/${contactList[selectedIndex].nSupplierContactId}`,
          payload
        );
      } else {
        await api.post("supplier-contacts", payload);
      }

      const supplierResp = await api.get("suppliers");
      const updatedSupplier = supplierResp.suppliers.find(
        (s) => s.nSupplierId === supplierId
      );
      if (updatedSupplier) setContactList(updatedSupplier.contacts || []);

      setIsEditing(false);
      setSelectedIndex(null);
      setFormData({
        strName: "",
        strNumber: "",
        strPosition: "",
        strDepartment: "",
      });
      setErrors({});
      onUpdate?.(updatedSupplier?.contacts || []);

      showToast(
        selectedIndex !== null
          ? `Contact "${name}" updated successfully!`
          : `Contact "${name}" added successfully!`
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to save contact.", "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleAddContact = () => {
    setIsEditing(true);
    setSelectedIndex(null);
    setFormData({
      strName: "",
      strNumber: "",
      strPosition: "",
      strDepartment: "",
    });
    setErrors({});
  };

  const handleEditContact = (index) => {
    setSelectedIndex(index);
    setFormData(contactList[index]);
    setIsEditing(true);
    setErrors({});
  };

  const handleDeleteContact = (index) => {
    setDeleteIndex(index);
    setDeleteLetter("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    const contact = contactList[deleteIndex];
    if (!contact) return;
    if (deleteLetter.toUpperCase() !== contact.strName?.[0]?.toUpperCase()) {
      setDeleteError(
        "The letter does not match the first letter of the contact name."
      );
      return;
    }

    setLoading(true);
    setLoadingMessage(`Deleting ${contact.strName}...`);

    try {
      await api.delete(`supplier-contacts/${contact.nSupplierContactId}`);
      const supplierResp = await api.get("suppliers");
      const updatedSupplier = supplierResp.suppliers.find(
        (s) => s.nSupplierId === supplierId
      );
      if (updatedSupplier) setContactList(updatedSupplier.contacts || []);
      showToast(`Contact "${contact.strName}" deleted successfully!`);
      onUpdate?.(updatedSupplier?.contacts || []);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete contact.", "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setDeleteIndex(null);
      setDeleteLetter("");
      setDeleteError("");
    }
  };

  const hasContacts =
    contactList.length > 0 &&
    contactList.some((c) => c.strName?.trim() || c.strNumber?.trim());

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setIsEditing(false);
        setDeleteIndex(null);
        handleClose();
      }}
      title="Supplier Contacts"
      onSave={handleSave}
      loading={loading}
      showFooter={deleteIndex === null && isEditing}
    >
      {toast.open && (
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ mb: 2, color: "#fff" }}
        >
          {toast.message}
        </Alert>
      )}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(255,255,255,0.7)",
          }}
        >
          <CircularProgress size={45} thickness={5} />
          <Typography sx={{ mt: 1 }}>
            {loadingMessage || "Processing..."}
          </Typography>
        </Box>
      )}

      {deleteIndex !== null ? (
        <Box sx={{ minHeight: 200 }}>
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => setDeleteIndex(null)}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 16, color: "#1976d2" }} />
            <Typography variant="caption" sx={{ ml: 0.5, color: "#1976d2" }}>
              Back to contacts
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Delete Verification for{" "}
            <strong>{contactList[deleteIndex]?.strName}</strong>
          </Typography>
          <TextField
            label="Enter first letter of name"
            value={deleteLetter}
            onChange={(e) => setDeleteLetter(e.target.value)}
            error={!!deleteError}
            helperText={deleteError}
            fullWidth
          />
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </Box>
        </Box>
      ) : !isEditing ? (
        <>
          {hasContacts ? (
            <Grid container spacing={2}>
              {contactList.map((c, index) => (
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
                    onClick={() => handleEditContact(index)}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(index);
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
                      sx={{ fontSize: 70, color: "#1976d2", opacity: 0.9 }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography
              variant="body2"
              align="center"
              sx={{
                color: "gray",
                fontStyle: "italic",
                py: 3,
                bgcolor: "#e3f2fd",
                borderRadius: 2,
              }}
            >
              No contact registered.
            </Typography>
          )}
          <Box
            onClick={handleAddContact}
            sx={{
              mt: 2,
              border: "2px dashed #90caf9",
              borderRadius: 2,
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#1976d2",
              cursor: "pointer",
              "&:hover": { bgcolor: "#f0f8ff" },
            }}
          >
            <AddCircleOutlineIcon sx={{ fontSize: 50 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Add Contact
            </Typography>
          </Box>
        </>
      ) : (
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                cursor: "pointer",
              }}
              onClick={() => setIsEditing(false)}
            >
              <ArrowBackIosNewIcon
                sx={{ fontSize: 16, color: "#1976d2", mr: 0.5 }}
              />
              <Typography
                sx={{ color: "#1976d2", fontWeight: 400, fontSize: "0.8rem" }}
              >
                Contacts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Name"
              name="strName"
              fullWidth
              size="small"
              value={formData.strName}
              onChange={handleChange}
              error={!!errors.strName}
              helperText={errors.strName || ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Contact Number"
              name="strNumber"
              fullWidth
              size="small"
              value={formData.strNumber}
              onChange={handleChange}
              error={!!errors.strNumber}
              helperText={errors.strNumber || ""}
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
    </ModalContainer>
  );
}

export default ContactModal;
