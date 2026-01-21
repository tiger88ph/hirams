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
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CloseIcon from "@mui/icons-material/Close";

import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";
import VerificationModalCard from "../../../../common/VerificationModalCard";
import DotSpinner from "../../../../common/DotSpinner";
import { validateFormData } from "../../../../../utils/form/validation";
import messages from "../../../../../utils/messages/messages";

function BankModal({ open, handleClose, supplier, managementKey }) {
  const [bankList, setBankList] = useState([]);
  const [selectedBankIndex, setSelectedBankIndex] = useState(null);
  const [formData, setFormData] = useState({
    strBankName: "",
    strAccountName: "",
    strAccountNumber: "",
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

  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;

  useEffect(() => {
    if (supplier?.bankInfo) {
      setBankList(
        Array.isArray(supplier.bankInfo)
          ? supplier.bankInfo
          : [supplier.bankInfo]
      );
    } else {
      setBankList([]);
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
    if (name === "strAccountNumber") {
      const digits = value.replace(/\D/g, "");
      formattedValue = digits.replace(/(.{4})/g, "$1 ").trim();
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "BANK_SUPPLIER");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.strBankName.trim() || messages.supplierBank.entity;
    setLoading(true);
    setLoadingMessage(
      selectedBankIndex !== null
        ? `${messages.crudPresent.updatingMess}${entity}${messages.typography.ellipsis}`
        : `${messages.crudPresent.addingMess}${entity}${messages.typography.ellipsis}`
    );

    try {
      const payload = {
        nSupplierId: supplier.nSupplierId,
        strBankName: formData.strBankName,
        strAccountName: formData.strAccountName,
        strAccountNumber: formData.strAccountNumber.replace(/\s/g, ""),
      };

      if (selectedBankIndex !== null) {
        const bankId = bankList[selectedBankIndex].nSupplierBankId;
        await api.put(`supplier-banks/${bankId}`, payload);
      } else {
        await api.post("supplier-banks", payload);
      }

      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplier.nSupplierId
      );
      if (updatedSupplier) setBankList(updatedSupplier.banks || []);

      setIsEditing(false);
      setSelectedBankIndex(null);
      setFormData({
        strBankName: "",
        strAccountName: "",
        strAccountNumber: "",
      });
      setErrors({});

      showToast(
        selectedBankIndex !== null
          ? `${entity} ${messages.crudSuccess.updatingMess}`
          : `${entity} ${messages.crudSuccess.addingMess}`,
        "success"
      );
    } catch (error) {
      setErrors({ general: `${messages.supplierBank.errorSaveMess}` });
      showToast(
        `${messages.supplierBank.errorAlertSaveMess}${entity}${messages.typography.period}`,
        "error"
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleAddBank = () => {
    setIsEditing(true);
    setSelectedBankIndex(null);
    setFormData({ strBankName: "", strAccountName: "", strAccountNumber: "" });
    setErrors({});
  };

  const handleEditBank = (index) => {
    setSelectedBankIndex(index);
    setFormData(bankList[index]);
    setIsEditing(true);
    setErrors({});
  };

  const handleDeleteBank = (index) => {
    setDeleteIndex(index);
    setDeleteLetter("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    const bank = bankList[deleteIndex];
    if (!bank) return;

    const entity = bank.strBankName?.trim() || messages.supplierBank.entity;

    if (deleteLetter.toUpperCase() !== entity[0]?.toUpperCase()) {
      setDeleteError(messages.supplierBank.errorDeleteMess);
      return;
    }

    setLoading(true);
    setLoadingMessage(
      `${messages.crudPresent.deletingMess}${entity}${messages.typography.period}`
    );

    try {
      await api.delete(`supplier-banks/${bank.nSupplierBankId}`);
      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplier.nSupplierId
      );
      if (updatedSupplier) setBankList(updatedSupplier.banks || []);

      showToast(`${entity} ${messages.crudSuccess.deletingMess}`, "success");
    } catch (error) {
      showToast(
        `${messages.supplierBank.errorAlertDeleteMess}${entity}${messages.typography.period}`,
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

  const hasBankData =
    bankList.length > 0 &&
    bankList.some(
      (b) =>
        b.strBankName?.trim() ||
        b.strAccountName?.trim() ||
        b.strAccountNumber?.trim()
    );
  const isManagement = Array.isArray(managementKey)
    ? managementKey.includes(userType)
    : managementKey === userType;

  return (
    <ModalContainer
  open={open}
  handleClose={() => {
    setIsEditing(false);
    setDeleteIndex(null);
    handleClose();
  }}
  title={
    deleteIndex !== null
      ? "Delete Bank Account"
      : supplier
      ? `Bank Accounts / ${supplier.supplierName.slice(0, 13)}${
          supplier.supplierName.length > 13 ? "…" : ""
        }`
      : "Supplier Bank Accounts"
  }
  onSave={
    isEditing
      ? handleSave
      : deleteIndex !== null
      ? confirmDelete
      : undefined
  }
  loading={loading}
  showSave={(isEditing || deleteIndex !== null) && isManagement} // Show Save/Confirm only if form or delete open
  saveLabel={isEditing ? "Save" : "Confirm"}
  showCancel={true} // Cancel/Back always visible
  cancelLabel={isEditing || deleteIndex !== null ? "Back" : "Cancel"} // Back if form or delete open
  onCancel={() => {
    if (isEditing) setIsEditing(false); // Close form
    else if (deleteIndex !== null) setDeleteIndex(null); // Close delete
    else handleClose(); // Close modal
  }}
>

      {/* Toast Alert */}
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
          entityName={bankList[deleteIndex]?.strBankName}
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
          {hasBankData ? (
            <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
              <Grid container spacing={2}>
                {bankList.map((bank, index) => (
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
                        isManagement ? handleEditBank(index) : null
                      }
                    >
                      {isManagement && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBank(index);
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
                          <BusinessIcon
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
                            Bank Name:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {bank.strBankName || "—"}
                          </Typography>
                        </Box>

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
                            Account Name:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {bank.strAccountName || "—"}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <CreditCardIcon
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
                            Account Number:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#000" }}>
                            {bank.strAccountNumber || "—"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        component="img"
                        src="/card-icon.png"
                        alt="Card Icon"
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
              No account registered.
            </Typography>
          )}

          {isManagement && (
            <Box
              onClick={handleAddBank}
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
                Add Bank Account
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Grid container spacing={1.5}>

          <Grid item xs={12}>
            <TextField
              label="Bank Name"
              name="strBankName"
              fullWidth
              size="small"
              value={formData.strBankName}
              onChange={handleChange}
              error={!!errors.strBankName}
              helperText={errors.strBankName || ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Account Name"
              name="strAccountName"
              fullWidth
              size="small"
              value={formData.strAccountName}
              onChange={handleChange}
              error={!!errors.strAccountName}
              helperText={errors.strAccountName || ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Account Number"
              name="strAccountNumber"
              fullWidth
              size="small"
              placeholder="1234 5678 9012"
              value={formData.strAccountNumber}
              onChange={handleChange}
              error={!!errors.strAccountNumber}
              helperText={errors.strAccountNumber || ""}
              inputProps={{ maxLength: 19 }}
            />
          </Grid>
        </Grid>
      )}
    </ModalContainer>
  );
}

export default React.memo(BankModal);
