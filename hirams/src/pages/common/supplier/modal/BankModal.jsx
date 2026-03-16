import React, { useState, useEffect } from "react";
import { Grid, TextField, Box, Typography, IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CloseIcon from "@mui/icons-material/Close";

import ModalContainer from "../../../../components/common/ModalContainer";
import api from "../../../../utils/api/api";
import VerificationModalCard from "../../../../components/common/VerificationModalCard";
import Toast from "../../../../components/helper/Toast";
import uiMessages from "../../../../utils/helpers/uiMessages";
import { validateFormData } from "../../../../utils/form/validation";
import FormGrid from "../../../../components/common/FormGrid";
import {
  formatBankAccountNo,
  bankAccountNoToStorage,
  bankAccountNoToDisplay,
} from "../../../../utils/helpers/bankAccountNoFormat";

function BankModal({ open, handleClose, supplier, isManagement }) {
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
  useEffect(() => {
    if (supplier?.bankInfo) {
      setBankList(
        Array.isArray(supplier.bankInfo)
          ? supplier.bankInfo
          : [supplier.bankInfo],
      );
    } else {
      setBankList([]);
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
    const formattedValue =
      name === "strAccountNumber" ? formatBankAccountNo(value) : value;

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

    const entity = formData.strBankName.trim() || "Bank Account";
    setLoading(true);
    setLoadingMessage(
      selectedBankIndex !== null
        ? `${uiMessages.common.updating}${entity}${uiMessages.common.ellipsis}`
        : `${uiMessages.common.adding}${entity}${uiMessages.common.ellipsis}`,
    );

    try {
      const payload = {
        nSupplierId: supplier.nSupplierId,
        strBankName: formData.strBankName,
        strAccountName: formData.strAccountName,
        strAccountNumber: bankAccountNoToStorage(formData.strAccountNumber),
      };

      if (selectedBankIndex !== null) {
        const bankId = bankList[selectedBankIndex].nSupplierBankId;
        await api.put(`supplier-banks/${bankId}`, payload);
      } else {
        await api.post("supplier-banks", payload);
      }

      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplier.nSupplierId,
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
          ? `${entity}${uiMessages.common.updatedSuccessfully}`
          : `${entity}${uiMessages.common.addedSuccessfully}`,
        "success",
      );
    } catch (error) {
      setErrors({ general: "Failed to save bank account" });
      showToast(`Failed to save ${entity}.`, "error");
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
    const bank = bankList[index];
    setFormData({
      strBankName: bank.strBankName,
      strAccountName: bank.strAccountName,
      strAccountNumber: bankAccountNoToDisplay(bank.strAccountNumber),
    });
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

    const entity = bank.strBankName?.trim() || "Bank Account";

    if (deleteLetter.toUpperCase() !== entity[0]?.toUpperCase()) {
      setDeleteError(`${uiMessages.common.errorReqChar}`);
      return;
    }

    setLoading(true);
    setLoadingMessage(
      `${uiMessages.common.deleting}${entity}${uiMessages.common.ellipsis}`,
    );

    try {
      await api.delete(`supplier-banks/${bank.nSupplierBankId}`);
      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplier.nSupplierId,
      );
      if (updatedSupplier) setBankList(updatedSupplier.banks || []);

      showToast(`${entity}${uiMessages.common.deletedSuccessfully}`, "success");
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
  const hasBankData =
    bankList.length > 0 &&
    bankList.some(
      (b) =>
        b.strBankName?.trim() ||
        b.strAccountName?.trim() ||
        b.strAccountNumber?.trim(),
    );

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setIsEditing(false);
        setSelectedBankIndex(null);
        setDeleteIndex(null);
        handleClose();
      }}
      title={
        deleteIndex !== null
          ? "Delete Bank Account"
          : isEditing
            ? selectedBankIndex !== null
              ? "Edit Bank Account"
              : "Add Bank Account"
            : "Supplier Banks"
      }
      subTitle={
        deleteIndex !== null && bankList[deleteIndex]
          ? `/ ${supplier.supplierNickName} / ${bankList[deleteIndex].strBankName}`
          : isEditing
            ? `/ ${supplier.supplierNickName}${
                formData.strBankName ? ` / ${formData.strBankName}` : ""
              }`
            : supplier
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
      loading={loading}
      customMessage={loadingMessage}
      disabled={loading} // ADD THIS LINE
      showSave={(isEditing || deleteIndex !== null) && isManagement}
      saveLabel={isEditing ? "Save" : "Confirm"}
      showCancel={true}
      cancelLabel={isEditing || deleteIndex !== null ? "Back" : "Cancel"}
      width={800}
      onCancel={() => {
        if (isEditing) {
          setIsEditing(false);
          setSelectedBankIndex(null);
        } else if (deleteIndex !== null) {
          setDeleteIndex(null);
        } else handleClose();
      }}
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
          <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
            <Grid container spacing={2}>
              {hasBankData &&
                bankList.map((bank, index) => (
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
                            {bankAccountNoToDisplay(bank.strAccountNumber) ||
                              "—"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        component="img"
                        src={`${import.meta.env.BASE_URL}images/contact-icon.png`}
                        alt="Card Icon"
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

              {/* Add Bank Card — always shown at the end if management */}
              {isManagement && (
                <Grid item xs={12}>
                  <Box
                    onClick={handleAddBank}
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
                      Add Bank Account
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Empty state — only shown when no data and not management */}
              {!hasBankData && !isManagement && (
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
                    No account registered.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </>
      ) : (
        <FormGrid
          key={isEditing ? "editing" : "closed"}
          fields={[
            { label: "Bank Name", name: "strBankName", xs: 12 },
            { label: "Account Name", name: "strAccountName", xs: 12 },
            {
              label: "Account Number",
              name: "strAccountNumber",
              xs: 12,
              placeholder: "1234 5678 9012",
            },
          ]}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
        />
      )}
    </ModalContainer>
  );
}

export default React.memo(BankModal);
