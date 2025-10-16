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
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Swal from "sweetalert2";

function BankModal({ open, handleClose, supplier }) {
  const [bankList, setBankList] = useState([]);
  const [selectedBankIndex, setSelectedBankIndex] = useState(null);
  const [formData, setFormData] = useState({
    strBankName: "",
    strAccountName: "",
    strAccountNumber: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Load static data from supplier
  useEffect(() => {
    if (supplier && Array.isArray(supplier.bankInfo)) {
      setBankList(supplier.bankInfo);
    } else if (supplier?.bankInfo) {
      setBankList([supplier.bankInfo]);
    } else {
      setBankList([]);
    }
  }, [supplier]);

  const setTopAlertZIndex = () => {
    setTimeout(() => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer) swalContainer.style.zIndex = "9999";
    }, 50);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "strAccountNumber") {
      const digits = value.replace(/\D/g, "");
      const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const { strBankName, strAccountName, strAccountNumber } = formData;
    const digitsOnly = strAccountNumber.replace(/\s/g, "");

    if (!strBankName.trim()) {
      Swal.fire("Missing Field", "Please enter Bank Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!strAccountName.trim()) {
      Swal.fire("Missing Field", "Please enter Account Name.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!strAccountNumber.trim()) {
      Swal.fire("Missing Field", "Please enter Account Number.", "warning");
      setTopAlertZIndex();
      return false;
    }
    if (!/^\d{10,12}$/.test(digitsOnly)) {
      Swal.fire(
        "Invalid Format",
        "Account Number must be 10 to 12 digits long (numbers only).",
        "error"
      );
      setTopAlertZIndex();
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedBanks = [...bankList];
    if (selectedBankIndex !== null) {
      updatedBanks[selectedBankIndex] = formData;
    } else {
      updatedBanks.push(formData);
    }

    setBankList(updatedBanks);
    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: `Bank details saved successfully (static data only).`,
      showConfirmButton: false,
      timer: 2000,
    });

    setTopAlertZIndex();
    setIsEditing(false);
    setSelectedBankIndex(null);
    setFormData({ strBankName: "", strAccountName: "", strAccountNumber: "" });
  };

  const handleAddBank = () => {
    setIsEditing(true);
    setSelectedBankIndex(null);
    setFormData({ strBankName: "", strAccountName: "", strAccountNumber: "" });
  };

  const handleEditBank = (index) => {
    setSelectedBankIndex(index);
    setFormData(bankList[index]);
    setIsEditing(true);
  };

  // ✅ Detect if there's any valid bank data
  const hasBankData =
    bankList.length > 0 &&
    bankList.some(
      (b) =>
        b.strBankName?.trim() ||
        b.strAccountName?.trim() ||
        b.strAccountNumber?.trim()
    );

  return (
    <Modal
      open={open}
      onClose={() => {
        setIsEditing(false);
        handleClose();
      }}
      aria-labelledby="bank-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 520,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          overflow: "hidden",
        }}
      >
        {/* ✅ Header */}
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
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#333" }}
          >
            Supplier Bank Accounts
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: "gray", "&:hover": { color: "black" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ✅ Body */}
        <Box sx={{ p: 2 }}>
          {!isEditing ? (
            <>
              {hasBankData ? (
                <Grid container spacing={2}>
                  {bankList.map((bank, index) => (
                    <Grid item xs={12} key={index}>
                      <Box
                        onClick={() => handleEditBank(index)}
                        sx={{
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
                            mr: 1,
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                // ✅ Show message when no bank account exists
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

              {/* ✅ Always show Add Bank Card */}
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
            // ✅ Form Mode
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  label="Bank Name"
                  name="strBankName"
                  fullWidth
                  size="small"
                  value={formData.strBankName}
                  onChange={handleChange}
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
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Account Number"
                  name="strAccountNumber"
                  fullWidth
                  size="small"
                  placeholder="e.g. 1234 5678 9012"
                  value={formData.strAccountNumber}
                  onChange={handleChange}
                  inputProps={{ maxLength: 19 }}
                />
              </Grid>
            </Grid>
          )}
        </Box>

        <Divider />

        {/* ✅ Footer */}
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
              onClick={() => {
                setIsEditing(false);
                setSelectedBankIndex(null);
              }}
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

export default BankModal;
