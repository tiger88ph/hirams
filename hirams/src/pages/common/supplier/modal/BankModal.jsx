import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Grid, Box, Typography, IconButton, useTheme } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CloseIcon from "@mui/icons-material/Close";
import ModalContainer from "../../../../layouts/modal/ModalContainer";
import SupplierBankAPI from "../../../../api/endpoints/supplier-bank.api.js";
import TransacVerificationModalContent from "../../../../components/content/TransacVerificationModalContent.jsx";
import Toast from "../../../../components/banner/Toast.jsx";
import uiMessages from "../../../../utils/helpers/uiMessages";
import { validateFormData } from "../../../../utils/form/validation";
import FormGrid from "../../../../components/form/FormGrid.jsx";
import getThemeColors from "../../../../utils/style/getThemeColors.js";

import {
  formatBankAccountNo,
  bankAccountNoToStorage,
  bankAccountNoToDisplay,
} from "../../../../utils/formatters/formatter.js";


// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — pulls ONLY tokens THIS component actually uses
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  blueBg: c.blue.bg,
  blueHover: c.blue.hover,
  blueBorder: c.blue.border,
  blueText: c.blue.text,
  slateBtnBg: c.slate.btnBg,
  slateHover: c.slate.hover,
  grayTextPrimary: c.gray.textPrimary,
  grayTextSecondary: c.gray.textSecondary,
});


function BankModal({
  open,
  handleClose,
  supplier,
  isManagement,
  isFinanceOfficer,
  isAccountOfficer,
}) {
  // ✅ STANDARD THEME WIRING
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

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
  const [isFetched, setIsFetched] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteLetter, setDeleteLetter] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const supplierId = supplier?.nSupplierId;

  const fetchBanks = useCallback(
    async (force = false, silent = false) => {
      if (!supplierId) return;
      if (!force && isFetched) return;
      if (!silent) setLoading(true);
      try {
        const { banks } = await SupplierBankAPI.getBySupplier(supplierId);
        setBankList(banks || []);
        setIsFetched(true);
      } catch {
        showToast("Failed to load bank accounts.", "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [supplierId, isFetched],
  );

  const fetchBanksRef = useRef(fetchBanks);
  useEffect(() => {
    fetchBanksRef.current = fetchBanks;
  }, [fetchBanks]);

  useEffect(() => {
    if (open && supplierId && !isFetched) {
      fetchBanks();
    }
  }, [open, supplierId, isFetched, fetchBanks]);

  useEffect(() => {
    if (!open || !supplierId) return;
    const handleBankUpdated = (e) => {
      if (e.detail.supplierId !== supplierId) return;
      fetchBanksRef.current?.(true, true);
    };
    const handleBankDeleted = (e) => {
      if (e.detail.supplierId !== supplierId) return;
      setBankList((prev) =>
        prev.filter((b) => b.nSupplierBankId !== e.detail.bankId),
      );
    };
    window.addEventListener("supplier_bank_updated", handleBankUpdated);
    window.addEventListener("supplier_bank_deleted", handleBankDeleted);
    return () => {
      window.removeEventListener("supplier_bank_updated", handleBankUpdated);
      window.removeEventListener("supplier_bank_deleted", handleBankDeleted);
    };
  }, [open, supplierId]);

  useEffect(() => {
    if (!open) {
      setBankList([]);
      setIsEditing(false);
      setSelectedBankIndex(null);
      setDeleteIndex(null);
      setErrors({});
      setIsFetched(false);
      setFormData({
        strBankName: "",
        strAccountName: "",
        strAccountNumber: "",
      });
    }
  }, [open]);

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  const handleCloseToast = () =>
    setToast({ open: false, message: "", severity: "success" });

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

  const resetForm = () => {
    setIsEditing(false);
    setSelectedBankIndex(null);
    setFormData({ strBankName: "", strAccountName: "", strAccountNumber: "" });
    setErrors({});
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
        nSupplierId: supplierId,
        strBankName: formData.strBankName,
        strAccountName: formData.strAccountName,
        strAccountNumber: bankAccountNoToStorage(formData.strAccountNumber),
      };
      if (selectedBankIndex !== null) {
        const bankId = bankList[selectedBankIndex].nSupplierBankId;
        const { bank: updated } = await SupplierBankAPI.updateBank(
          bankId,
          payload,
        );
        setBankList((prev) =>
          prev.map((b, i) => (i === selectedBankIndex ? updated : b)),
        );
      } else {
        const { bank: created } = await SupplierBankAPI.createBank(payload);
        setBankList((prev) => [...prev, created]);
      }
      resetForm();
      showToast(
        selectedBankIndex !== null
          ? `${entity}${uiMessages.common.updatedSuccessfully}`
          : `${entity}${uiMessages.common.addedSuccessfully}`,
        "success",
      );
    } catch {
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
    const bank = bankList[index];
    setSelectedBankIndex(index);
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
      const bankId = bank.nSupplierBankId;
      await SupplierBankAPI.deleteBank(bankId);
      setBankList((prev) => prev.filter((b) => b.nSupplierBankId !== bankId));
      showToast(`${entity}${uiMessages.common.deletedSuccessfully}`, "success");
    } catch {
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
        resetForm();
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
          ? `${supplier?.supplierNickName} / ${bankList[deleteIndex].strBankName}`
          : isEditing
            ? `${supplier?.supplierNickName}${formData.strBankName ? ` / ${formData.strBankName}` : ""}`
            : supplier
              ? `${supplier?.supplierNickName}`
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
      disabled={loading}
      showSave={
        (isEditing || deleteIndex !== null) &&
        (isFinanceOfficer || isManagement || isAccountOfficer)
      }
      saveLabel={isEditing ? "Save" : "Confirm"}
      showCancel={true}
      cancelLabel={isEditing || deleteIndex !== null ? "Back" : "Cancel"}
      width={800}
      onCancel={() => {
        if (isEditing) resetForm();
        else if (deleteIndex !== null) setDeleteIndex(null);
        else handleClose();
      }}
    >
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />

      {deleteIndex !== null ? (
        <TransacVerificationModalContent
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
        <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
          <Grid container spacing={2}>
            {hasBankData &&
              bankList.map((bank, index) => (
                <Grid item xs={12} key={bank.nSupplierBankId ?? index}>
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: colors.blueBg,
                      borderRadius: 2,
                      p: 2,
                      cursor:
                        isFinanceOfficer || isManagement || isAccountOfficer
                          ? "pointer"
                          : "default",
                      boxShadow: isDark ? 1 : 2,
                      transition: "0.3s ease-in-out",
                      "&:hover": {
                        bgcolor:
                          isFinanceOfficer || isManagement || isAccountOfficer
                            ? colors.blueHover
                            : colors.blueBg,
                        boxShadow:
                          isFinanceOfficer || isManagement || isAccountOfficer
                            ? isDark
                              ? 3
                              : 6
                            : isDark
                              ? 1
                              : 2,
                      },
                    }}
                    onClick={() =>
                      isFinanceOfficer || isManagement || isAccountOfficer
                        ? handleEditBank(index)
                        : null
                    }
                  >
                    {(isFinanceOfficer || isManagement || isAccountOfficer) && (
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
                          bgcolor: colors.slateBtnBg,
                          width: 24,
                          height: 24,
                          "&:hover": { bgcolor: colors.slateHover },
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
                        <BusinessIcon sx={{ fontSize: 16, color: colors.blueText }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.grayTextSecondary,
                            fontWeight: 500,
                            display: { xs: "none", sm: "inline" },
                          }}
                        >
                          Bank Name:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.grayTextPrimary }}
                        >
                          {bank.strBankName || "—"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                      >
                        <PersonIcon sx={{ fontSize: 16, color: colors.blueText }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.grayTextSecondary,
                            fontWeight: 500,
                            display: { xs: "none", sm: "inline" },
                          }}
                        >
                          Account Name:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.grayTextPrimary }}
                        >
                          {bank.strAccountName || "—"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                      >
                        <CreditCardIcon
                          sx={{ fontSize: 16, color: colors.blueText }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.grayTextSecondary,
                            fontWeight: 500,
                            display: { xs: "none", sm: "inline" },
                          }}
                        >
                          Account Number:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.grayTextPrimary }}
                        >
                          {bankAccountNoToDisplay(bank.strAccountNumber) || "—"}
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
                        opacity: isDark ? 0.6 : 0.9,
                        filter: isDark ? "invert(0.85)" : "none",
                      }}
                    />
                  </Box>
                </Grid>
              ))}

            {(isFinanceOfficer || isManagement || isAccountOfficer) && (
              <Grid item xs={12}>
                <Box
                  onClick={handleAddBank}
                  sx={{
                    border: `2px dashed ${colors.blueBorder}`,
                    borderRadius: 2,
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.blueText,
                    cursor: "pointer",
                    transition: "0.3s ease-in-out",
                    "&:hover": { bgcolor: colors.blueHover },
                  }}
                >
                  <AddCircleOutlineIcon sx={{ fontSize: 50 }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Add Bank Account
                  </Typography>
                </Box>
              </Grid>
            )}

            {!hasBankData &&
              !(isFinanceOfficer || isManagement || isAccountOfficer) && (
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      color: colors.grayTextSecondary,
                      fontStyle: "italic",
                      py: 3,
                      bgcolor: colors.blueBg,
                      borderRadius: 2,
                    }}
                  >
                    No account registered.
                  </Typography>
                </Grid>
              )}
          </Grid>
        </Box>
      ) : (
        <FormGrid
          key={isEditing ? "editing" : "closed"}
          fields={[
            { label: "Bank Name", name: "strBankName", xs: 12 },
            { label: "Account Name", name: "strAccountName", xs: 12 },
            {
              label: "Account Number",
              name: "strAccountNumber",
              type: "bank",
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