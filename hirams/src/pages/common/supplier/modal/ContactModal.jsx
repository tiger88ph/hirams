import React, { useState, useEffect } from "react";
import { Grid, TextField, Box, Typography, IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import ApartmentIcon from "@mui/icons-material/Apartment";
import CloseIcon from "@mui/icons-material/Close";

import ModalContainer from "../../../../components/common/ModalContainer";
import api from "../../../../utils/api/api";
import VerificationModalCard from "../../../../components/common/VerificationModalCard";
import Toast from "../../../../components/helper/Toast";
import uiMessages from "../../../../utils/helpers/uiMessages";
import { validateFormData } from "../../../../utils/form/validation";
import FormGrid from "../../../../components/common/FormGrid";
import {
  formatPhoneNo,
  phoneNoToStorage,
  phoneNoToDisplay,
} from "../../../../utils/helpers/phoneNoFormat";

function ContactModal({
  open,
  handleClose,
  supplier,
  onUpdate,
  supplierId,
  isManagement,
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
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteLetter, setDeleteLetter] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  useEffect(() => {
    if (supplier?.contacts) {
      setContactList(
        Array.isArray(supplier.contacts)
          ? supplier.contacts
          : [supplier.contacts],
      );
    } else {
      setContactList([]);
    }
  }, [supplier]);
  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };
  const handleCloseToast = () => {
    setToast({ open: false, message: "", severity: "success" });
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "strNumber" ? formatPhoneNo(value) : value;

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

    const entity = formData.strName.trim() || "Contact";
    setLoading(true);
    setLoadingMessage(
      selectedIndex !== null
        ? `${uiMessages.common.updating}${entity}${uiMessages.common.ellipsis}`
        : `${uiMessages.common.adding}${entity}${uiMessages.common.ellipsis}`,
    );

    try {
      const payload = {
        nSupplierId: supplierId,
        strName: formData.strName,
        strNumber: phoneNoToStorage(formData.strNumber),
        strPosition: formData.strPosition,
        strDepartment: formData.strDepartment,
      };

      if (selectedIndex !== null) {
        const contactId = contactList[selectedIndex].nSupplierContactId;
        await api.put(`supplier-contacts/${contactId}`, payload);
      } else {
        await api.post("supplier-contacts", payload);
      }

      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplierId,
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
          ? `${entity}${uiMessages.common.updatedSuccessfully}`
          : `${entity}${uiMessages.common.addedSuccessfully}`,
        "success",
      );
    } catch (error) {
      setErrors({ general: "Failed to save contact" });
      showToast(`Failed to save ${entity}.`, "error");
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
    const contact = contactList[index];
    setFormData({
      strName: contact.strName,
      strNumber: phoneNoToDisplay(contact.strNumber),
      strPosition: contact.strPosition,
      strDepartment: contact.strDepartment,
    });
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

    const entity = contact.strName?.trim() || "Contact";

    if (deleteLetter.toUpperCase() !== entity[0]?.toUpperCase()) {
      setDeleteError(`${uiMessages.common.errorReqChar}`);
      return;
    }

    setLoading(true);
    setLoadingMessage(
      `${uiMessages.common.deleting}${entity}${uiMessages.common.ellipsis}`,
    );

    try {
      await api.delete(`supplier-contacts/${contact.nSupplierContactId}`);
      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplierId,
      );
      if (updatedSupplier) setContactList(updatedSupplier.contacts || []);

      showToast(`${entity}${uiMessages.common.deletedSuccessfully}`, "success");
      onUpdate?.(updatedSupplier?.contacts || []);
    } catch (error) {
      showToast(`Failed to delete ${entity}.`, "error");
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
        setSelectedIndex(null);
        setDeleteIndex(null);
        handleClose();
      }}
      title={
        deleteIndex !== null
          ? "Delete Contact"
          : isEditing
            ? selectedIndex !== null
              ? "Edit Contact"
              : "Add Contact"
            : "Supplier Contacts"
      }
      subTitle={
        // Deleting a contact
        deleteIndex !== null && contactList[deleteIndex]
          ? `/ ${supplier.supplierNickName} / ${contactList[deleteIndex].strName}`
          : // Editing or Adding a contact: show live value from formData
            isEditing
            ? `/ ${supplier.supplierNickName}${
                formData.strName ? ` / ${formData.strName}` : ""
              }`
            : // Viewing all contacts (no selection)
              supplier
              ? `/ ${supplier.supplierNickName}`
              : ""
      }
      onSave={
        isEditing
          ? handleSave
          : deleteIndex !== null
            ? confirmDelete
            : undefined
      }
      disabled={loading} // CHANGE: Replace loading={loading} with disabled={loading}
      showSave={(isEditing || deleteIndex !== null) && isManagement}
      saveLabel={isEditing ? "Save" : "Confirm"}
      showCancel={true}
      cancelLabel={isEditing || deleteIndex !== null ? "Back" : "Cancel"}
      width={800}
      onCancel={() => {
        if (isEditing) {
          setIsEditing(false);
          setSelectedIndex(null);
        } else if (deleteIndex !== null) {
          setDeleteIndex(null);
        } else handleClose();
      }}
      loading={loading}
      customMessage={loadingMessage}
    >
      {/* Toast Notification */}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />

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
        <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
          <Grid container spacing={2}>
            {hasContacts &&
              contactList.map((c, index) => (
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
                      cursor: isManagement ? "pointer" : "default",
                      boxShadow: 2,
                      transition: "0.3s",
                      "&:hover": {
                        bgcolor: isManagement ? "#d2e3fc" : "#e3f2fd",
                        boxShadow: isManagement ? 6 : 2,
                      },
                    }}
                    onClick={() =>
                      isManagement ? handleEditContact(index) : null
                    }
                  >
                    {isManagement && (
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
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
                          {phoneNoToDisplay(c.strNumber) || "—"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
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
                      src={`${import.meta.env.BASE_URL}images/contact-icon.png`}
                      alt="Contact Icon"
                      sx={{
                        width: 80,
                        height: 80,
                        objectFit: "contain",
                        margin: "8px",
                        opacity: 0.9,
                      }}
                    />
                  </Box>
                </Grid>
              ))}

            {/* Add Contact Card — always at the end if management */}
            {isManagement && (
              <Grid item xs={12}>
                <Box
                  onClick={handleAddContact}
                  sx={{
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
              </Grid>
            )}

            {/* Empty state — only when no data and not management */}
            {!hasContacts && !isManagement && (
              <Grid item xs={12}>
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
              </Grid>
            )}
          </Grid>
        </Box>
      ) : (
        <FormGrid
          key={isEditing ? "editing" : "closed"}
          fields={[
            { label: "Name", name: "strName", xs: 12 },
            {
              label: "Contact Number",
              name: "strNumber",
              type: "phone",
              xs: 12,
            },
            { label: "Position", name: "strPosition", xs: 6 },
            { label: "Department", name: "strDepartment", xs: 6 },
          ]}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
        />
      )}
    </ModalContainer>
  );
}

export default React.memo(ContactModal);
