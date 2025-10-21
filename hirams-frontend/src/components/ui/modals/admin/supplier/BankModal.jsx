import React, { useState, useEffect } from "react";
import { Grid, TextField, Box, Typography, IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";

function BankModal({ open, handleClose, supplier }) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format account number: digits only, spaced every 4
    let formattedValue = value;
    if (name === "strAccountNumber") {
      const digits = value.replace(/\D/g, "");
      formattedValue = digits.replace(/(.{4})/g, "$1 ").trim();
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    // Clear error for this field while typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Inline validations
  const validateForm = () => {
    const newErrors = {};
    const digitsOnly = formData.strAccountNumber.replace(/\s/g, "");

    if (!formData.strBankName.trim())
      newErrors.strBankName = "Bank Name is required";
    if (!formData.strAccountName.trim())
      newErrors.strAccountName = "Account Name is required";
    if (!formData.strAccountNumber.trim())
      newErrors.strAccountNumber = "Account Number is required";
    else if (!/^\d{10,12}$/.test(digitsOnly))
      newErrors.strAccountNumber = "Account Number must be 10–12 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        nSupplierId: supplier.nSupplierId,
        strBankName: formData.strBankName,
        strAccountName: formData.strAccountName,
        strAccountNumber: formData.strAccountNumber.replace(/\s/g, ""),
      };

      let response;
      if (selectedBankIndex !== null) {
        // Update existing bank
        const bankId = bankList[selectedBankIndex].nSupplierBankId;
        response = await api.put(`supplier-banks/${bankId}`, payload);
      } else {
        // Create new bank
        response = await api.post("supplier-banks", payload);
      }

      // Refresh the supplier data to get updated banks
      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplier.nSupplierId
      );

      if (updatedSupplier) {
        setBankList(updatedSupplier.banks || []);
      }

      setIsEditing(false);
      setSelectedBankIndex(null);
      setFormData({
        strBankName: "",
        strAccountName: "",
        strAccountNumber: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error saving bank:", error);
      setErrors({
        general: "Failed to save bank information. Please try again.",
      });
    } finally {
      setLoading(false);
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

  const handleRemoveBank = async (index) => {
    const bankId = bankList[index].nSupplierBankId;

    try {
      await api.delete(`supplier-banks/${bankId}`);

      // Refresh the supplier data to get updated banks
      const supplierResponse = await api.get("suppliers");
      const updatedSupplier = supplierResponse.suppliers.find(
        (s) => s.nSupplierId === supplier.nSupplierId
      );

      if (updatedSupplier) {
        setBankList(updatedSupplier.banks || []);
      }
    } catch (error) {
      console.error("Error deleting bank:", error);
      setErrors({ general: "Failed to delete bank. Please try again." });
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

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setIsEditing(false);
        handleClose();
      }}
      title="Supplier Bank Accounts"
      onSave={handleSave}
      loading={loading}
      showFooter={isEditing}
    >
      {!isEditing ? (
        <>
          {hasBankData ? (
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
                      cursor: "pointer",
                      boxShadow: "inset 0 0 3px rgba(0,0,0,0.1)",
                      transition: "0.2s",
                      "&:hover": { bgcolor: "#d2e3fc" },
                    }}
                    onClick={() => handleEditBank(index)}
                  >
                    {/* X button */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBank(index);
                      }}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "#fff",
                        width: 24,
                        height: 24,
                        "&:hover": { bgcolor: "#f0f0f0" },
                        zIndex: 2,
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>

                    <Box
                      sx={{
                        display: "flex",
                        flex: 1,
                        alignItems: "center",
                        gap: 2,
                        zIndex: 1,
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
                          <strong>Bank Name:</strong> {bank.strBankName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Account Name:</strong> {bank.strAccountName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Account Number:</strong>{" "}
                          {bank.strAccountNumber}
                        </Typography>
                      </Box>
                      <AccountBalanceIcon
                        sx={{
                          fontSize: 70,
                          color: "#1976d2",
                          opacity: 0.9,
                          ml: "auto",
                        }}
                      />
                    </Box>
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
              No account registered.
            </Typography>
          )}

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
                Banks
              </Typography>
            </Box>
          </Grid>

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

export default BankModal;
