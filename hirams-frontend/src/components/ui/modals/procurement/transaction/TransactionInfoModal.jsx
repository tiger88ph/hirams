import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import { FinalizeButton } from "../../../../common/Buttons"; // ✅ Custom button
import useMapping from "../../../../../utils/mappings/useMapping";
import api from "../../../../../utils/api/api";

function InfoSection({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2.5,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        backgroundColor: "#fafafa",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          mb: 1.5,
          color: "primary.main",
          textTransform: "uppercase",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function DetailItem({ label, value }) {
  return (
    <Grid item xs={6}>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontWeight: 600, color: "text.primary" }}
      >
        {value || "—"}
      </Typography>
    </Grid>
  );
}

function TransactionInfoModal({ open, onClose, transaction, onFinalized }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Load mappings
  const {
    procMode,
    procSource,
    itemType,
    loading: mappingLoading,
  } = useMapping();

  if (!open || !transaction) return null;

  const handleFinalizeClick = () => {
    setConfirming(true);
  };

  const handleFinalizeConfirm = async () => {
    if (!transaction?.nTransactionId) return; // use transaction.id or transaction.nTransactionId

    try {
      setLoading(true);

      // ✅ Call the API with the correct transaction ID
      const response = await api.put(
        `transactions/${transaction.nTransactionId}/finalize`
      );

      console.log("✅ Transaction finalized successfully:", response.data);

      if (onFinalized) onFinalized();
      onClose();
    } catch (error) {
      console.error("❌ Error finalizing transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safely display mapping values
  const itemTypeLabel =
    itemType?.[transaction.cItemType] || transaction.cItemType;
  const procModeLabel =
    procMode?.[transaction.cProcMode] || transaction.cProcMode;
  const procSourceLabel =
    procSource?.[transaction.cProcSource] || transaction.cProcSource;

  // 🔹 Format date & time to 12-hour format with AM/PM
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true, // 🕒 12-hour format with AM/PM
    });
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      width={750}
      showFooter={true}
      showSave={false}
    >
      <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1, pb: 1 }}>
        {!confirming ? (
          <>
            {/* 🟦 Basic Information */}
            <InfoSection title="Basic Information">
              <Grid container spacing={2}>
                <DetailItem
                  label="Transaction Code"
                  value={transaction.strCode || transaction.transactionId}
                />
                <DetailItem
                  label="Title"
                  value={transaction.strTitle || transaction.transactionName}
                />
                <DetailItem
                  label="Company"
                  value={
                    transaction.company?.strCompanyName ||
                    transaction.companyName
                  }
                />
                <DetailItem
                  label="Client"
                  value={
                    transaction.client?.strClientName || transaction.clientName
                  }
                />
              </Grid>
            </InfoSection>

            {/* 🟧 Procurement Details */}
            <InfoSection title="Procurement Details">
              <Grid container spacing={2}>
                <DetailItem label="Item Type" value={itemTypeLabel} />
                <DetailItem label="Procurement Mode" value={procModeLabel} />
                <DetailItem
                  label="Procurement Source"
                  value={procSourceLabel}
                />
                <DetailItem
                  label="Total ABC"
                  value={
                    transaction.dTotalABC
                      ? `₱${Number(transaction.dTotalABC).toLocaleString()}`
                      : null
                  }
                />
              </Grid>
            </InfoSection>

            {/* 🟩 Schedule Details */}
            <InfoSection title="Schedule Details">
              <Grid container spacing={2}>
                <DetailItem
                  label="Pre-Bid"
                  value={
                    transaction.dtPreBid
                      ? `${formatDateTime(transaction.dtPreBid)}${
                          transaction.strPreBid_Venue
                            ? ` — ${transaction.strPreBid_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
                <DetailItem
                  label="Doc Issuance"
                  value={
                    transaction.dtDocIssuance
                      ? `${formatDateTime(transaction.dtDocIssuance)}${
                          transaction.strDocIssuance_Venue
                            ? ` — ${transaction.strDocIssuance_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
                <DetailItem
                  label="Doc Submission"
                  value={
                    transaction.dtDocSubmission
                      ? `${formatDateTime(transaction.dtDocSubmission)}${
                          transaction.strDocSubmission_Venue
                            ? ` — ${transaction.strDocSubmission_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
                <DetailItem
                  label="Doc Opening"
                  value={
                    transaction.dtDocOpening
                      ? `${formatDateTime(transaction.dtDocOpening)}${
                          transaction.strDocOpening_Venue
                            ? ` — ${transaction.strDocOpening_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
              </Grid>
            </InfoSection>

            {/* ✅ Finalize Button */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <FinalizeButton
                onClick={handleFinalizeClick}
                label="Finalize Transaction"
              />
            </Box>
          </>
        ) : (
          // ⚠️ Confirmation Section
          <Box sx={{ textAlign: "center", py: 3, px: 2 }}>
            <WarningAmberRoundedIcon
              color="warning"
              sx={{ fontSize: 48, mb: 1 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Are you sure?
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              You are about to <strong>finalize</strong> the transaction{" "}
              <span style={{ fontWeight: 600, color: "#4f46e5" }}>
                {transaction.transactionName || transaction.strTitle}
              </span>{" "}
              ({transaction.transactionId}). This action cannot be undone.
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1.5,
                mt: 2,
              }}
            >
              <Button
                variant="contained"
                color="success"
                onClick={handleFinalizeConfirm}
                disabled={loading}
                startIcon={!loading && <CheckCircleRoundedIcon />}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Finalize"
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </ModalContainer>
  );
}

export default TransactionInfoModal;
