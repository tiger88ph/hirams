import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import ApartmentIcon from "@mui/icons-material/Apartment";
import CloseIcon from "@mui/icons-material/Close";

import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";
import VerificationModalCard from "../../../../common/VerificationModalCard";
import { validateFormData } from "../../../../../utils/form/validation";
import messages from "../../../../../utils/messages/messages";
import DotSpinner from "../../../../common/DotSpinner";

function ContactModal({
  open,
  handleClose,
  supplier,
  onUpdate,
  supplierId,
  managementKey,
}) {
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

  // Get userType from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;

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
    let formattedValue = value;
    if (name === "strNumber") formattedValue = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CONTACT_SUPPLIER");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const entity = formData.strName.trim() || messages.supplierContact.entity;
    setLoading(true);
    setLoadingMessage(
      selectedIndex !== null
        ? `${messages.crudPresent.updatingMess}${entity}${messages.typography.ellipsis}`
        : `${messages.crudPresent.addingMess}${entity}${messages.typography.ellipsis}`
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
          ? `${entity} ${messages.crudSuccess.updatingMess}`
          : `${entity} ${messages.crudSuccess.addingMess}`,
        "success"
      );
    } catch (error) {
      console.error(error);
      showToast(
        `${messages.supplierContact.errorAlertSaveMess}${entity}${messages.typography.period}`,
        "error"
      );
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

    const entity = contact.strName?.trim() || messages.supplierContact.entity;
    if (deleteLetter.toUpperCase() !== entity[0]?.toUpperCase()) {
      setDeleteError(messages.supplierContact.errorDeleteMess);
      return;
    }

    setLoading(true);
    setLoadingMessage(
      `${messages.crudPresent.deletingMess}${entity}${messages.typography.period}`
    );

    try {
      await api.delete(`supplier-contacts/${contact.nSupplierContactId}`);
      const supplierResp = await api.get("suppliers");
      const updatedSupplier = supplierResp.suppliers.find(
        (s) => s.nSupplierId === supplierId
      );
      if (updatedSupplier) setContactList(updatedSupplier.contacts || []);
      showToast(`${entity} ${messages.crudSuccess.deletingMess}`, "success");
      onUpdate?.(updatedSupplier?.contacts || []);
    } catch (error) {
      console.error(error);
      showToast(
        `${messages.supplierContact.errorAlertDeleteMess}${entity}${messages.typography.period}`,
        "error"
      );
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
      title={
        supplier
          ? `Contacts / ${supplier.supplierName.slice(0, 13)}${supplier.supplierName.length > 13 ? "…" : ""}`
          : "Supplier Contacts"
      }
      onSave={handleSave}
      loading={loading}
      showSave={isEditing && userType === managementKey}
    >
      {toast.open && (
        <Alert
          severity={toast.severity}
          sx={{ mb: 2, width: "100%" }}
          onClose={() =>
            setToast({ open: false, message: "", severity: "success" })
          }
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
          <DotSpinner size={15} />
          <Typography sx={{ mt: 1 }}>{loadingMessage}</Typography>
        </Box>
      )}

      {deleteIndex !== null ? (
        <VerificationModalCard
          entityName={contactList[deleteIndex]?.strName}
          verificationInput={deleteLetter}
          setVerificationInput={setDeleteLetter}
          verificationError={deleteError}
          onBack={() => setDeleteIndex(null)}
          onConfirm={confirmDelete}
          actionWord="Delete"
          confirmButtonColor="error"
          showToast={showToast}
        />
      ) : !isEditing ? (
        <>
          {hasContacts ? (
            <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
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
                        cursor:
                          userType === managementKey ? "pointer" : "default",
                        boxShadow: 2,
                        transition: "0.3s",
                        "&:hover": {
                          bgcolor:
                            userType === managementKey ? "#d2e3fc" : "#e3f2fd",
                          boxShadow: userType === managementKey ? 6 : 2,
                        },
                      }}
                      onClick={() =>
                        userType === managementKey && handleEditContact(index)
                      }
                    >
                      {userType === managementKey && (
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
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.6,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "gray",
                              fontWeight: 500,
                              display: { xs: "none", sm: "inline" },
                            }}
                          >
                            Name:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {c.strName || "—"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "gray",
                              fontWeight: 500,
                              display: { xs: "none", sm: "inline" },
                            }}
                          >
                            Number:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {c.strNumber || "—"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <WorkIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "gray",
                              fontWeight: 500,
                              display: { xs: "none", sm: "inline" },
                            }}
                          >
                            Position:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {c.strPosition || "—"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <ApartmentIcon
                            sx={{ fontSize: 16, color: "#1565c0" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "gray",
                              fontWeight: 500,
                              display: { xs: "none", sm: "inline" },
                            }}
                          >
                            Department:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {c.strDepartment || "—"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        component="img"
                        src="/contact-icon.png"
                        alt="Contact Icon"
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: "contain",
                          margin: "8px;",
                          opacity: 0.9,
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
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

          {userType === managementKey && (
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
          )}
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
              inputProps={{ maxLength: 15 }}
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

export default React.memo(ContactModal);
