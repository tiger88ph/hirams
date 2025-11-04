import React, { useState } from "react";
import { Box, Typography, Grid, Paper, Button } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import VerificationModalCard from "../../../../common/VerificationModalCard";
import useMapping from "../../../../../utils/mappings/useMapping";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import { VerifyButton, FinalizeButton } from "../../../../common/Buttons";

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

function TransactionInfoModal({
  open,
  onClose,
  transaction,
  onFinalized,
  onVerified,
}) {
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false); // 🟢 new verify modal state
  const [loading, setLoading] = useState(false);
  const [verifyLetter, setVerifyLetter] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const { procMode, procSource, itemType } = useMapping();

  if (!open || !transaction) return null;

  const transactionName =
    transaction.strTitle || transaction.transactionName || "Transaction";
  const firstLetter = transactionName[0]?.toUpperCase() || "T";

  // 🟢 Finalize flow
  const handleFinalizeClick = () => setConfirming(true);

  const confirmFinalize = async () => {
    if (verifyLetter.toUpperCase() !== firstLetter) {
      setVerifyError(
        "The letter does not match the first letter of the transaction name."
      );
      return;
    }

    setVerifyError("");
    const entity = transactionName;

    try {
      setLoading(true);
      onClose();

      await withSpinner(`Finalizing ${entity}...`, async () => {
        // 🧠 Get the user from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.nUserId;

        if (!userId) {
          console.error("❌ No userId found in localStorage");
          throw new Error("User ID is missing.");
        }

        // 📨 Send userId with PUT request payload
        await api.put(`transactions/${transaction.nTransactionId}/finalize`, {
          userId,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "finalized" });

      if (typeof onFinalized === "function") {
        await onFinalized();
      }

      setVerifyLetter("");
      setVerifyError("");
      setConfirming(false);
    } catch (error) {
      console.error("❌ Error finalizing transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Verify flow
  const handleVerifyClick = () => {
    setVerifying(true);
    setVerifyLetter("");
    setVerifyError("");
  };

  const confirmVerify = async () => {
    if (verifyLetter.toUpperCase() !== firstLetter) {
      setVerifyError(
        "The letter does not match the first letter of the transaction name."
      );
      return;
    }

    setVerifyError("");
    const entity = transactionName;

    try {
      setLoading(true);
      onClose();

      await withSpinner(`Verifying ${entity}...`, async () => {
        // 🧠 Get the user from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.nUserId;

        if (!userId) {
          console.error("❌ No userId found in localStorage");
          throw new Error("User ID is missing.");
        }

        // 📨 Send userId with PUT request payload
        await api.put(`transactions/${transaction.nTransactionId}/verify`, {
          userId,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "verified" });

      if (typeof onVerified === "function") {
        await onVerified();
      }

      setVerifyLetter("");
      setVerifyError("");
      setVerifying(false);
    } catch (error) {
      console.error("❌ Error verifying transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const itemTypeLabel =
    itemType?.[transaction.cItemType] || transaction.cItemType;
  const procModeLabel =
    procMode?.[transaction.cProcMode] || transaction.cProcMode;
  const procSourceLabel =
    procSource?.[transaction.cProcSource] || transaction.cProcSource;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isSubmitted = [
    "finalized transaction",
    "submitted to manager",
    "submitted",
  ].includes(transaction?.status?.toLowerCase());

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setVerifyLetter("");
        setVerifyError("");
        setConfirming(false);
        setVerifying(false);
        onClose();
      }}
      title={
        confirming
          ? "Transaction Details / Confirm Finalization"
          : verifying
            ? "Transaction Details / Confirm Verification"
            : "Transaction Details"
      }
      width={confirming || verifying ? 400 : 750}
      showFooter={false}
      loading={loading}
    >
      {/* ⚠️ Finalize Confirmation */}
      {confirming && (
        <VerificationModalCard
          entityName={transactionName}
          verificationInput={verifyLetter}
          setVerificationInput={setVerifyLetter}
          verificationError={verifyError}
          onBack={() => {
            setConfirming(false);
            setVerifyLetter("");
            setVerifyError("");
          }}
          onConfirm={confirmFinalize}
          actionWord="Finalize"
          confirmButtonColor="success"
          icon={
            <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
          }
          description={`You are about to finalize the transaction "${transactionName}" (${transaction.transactionId}). This action cannot be undone.`}
        />
      )}

      {/* 🟢 Verify Confirmation */}
      {verifying && (
        <VerificationModalCard
          entityName={transactionName}
          verificationInput={verifyLetter}
          setVerificationInput={setVerifyLetter}
          verificationError={verifyError}
          onBack={() => {
            setVerifying(false);
            setVerifyLetter("");
            setVerifyError("");
          }}
          onConfirm={confirmVerify}
          actionWord="Verify"
          confirmButtonColor="success"
          icon={
            <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
          }
          description={`You are about to verify the transaction "${transactionName}". Please confirm by typing the first letter of the transaction name.`}
        />
      )}

      {/* 📋 Main Transaction Info */}
      {!confirming && !verifying && (
        <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1, pb: 1 }}>
          {/* 🟨 Status Note */}
          {isSubmitted && (
            <Box
              sx={{
                backgroundColor: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: 2,
                p: 2,
                mb: 2.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#92400e",
                  fontWeight: 500,
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                This transaction has been{" "}
                <strong>submitted to the Manager</strong>.<br />
                You can use <strong>Revert</strong> if any changes are needed.
                <br />
                Once the transaction has an assigned{" "}
                <strong>Account Officer</strong>, it can no longer be reverted.
              </Typography>
            </Box>
          )}

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
                  transaction.companyName ||
                  "—"
                }
              />
              <DetailItem
                label="Client"
                value={
                  transaction.client?.strClientName ||
                  transaction.clientName ||
                  "—"
                }
              />
            </Grid>
          </InfoSection>

          {/* 🟧 Procurement Details */}
          <InfoSection title="Procurement Details">
            <Grid container spacing={2}>
              <DetailItem label="Item Type" value={itemTypeLabel} />
              <DetailItem label="Procurement Mode" value={procModeLabel} />
              <DetailItem label="Procurement Source" value={procSourceLabel} />
              <DetailItem
                label="Total ABC"
                value={
                  transaction.dTotalABC
                    ? `₱${Number(transaction.dTotalABC).toLocaleString()}`
                    : "—"
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
                    : "—"
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
                    : "—"
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
                    : "—"
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
                    : "—"
                }
              />
            </Grid>
          </InfoSection>

          {/* ✅ Finalize + Verify Buttons */}
          {!isSubmitted && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
                gap: 2,
              }}
            >
              {/* Hide Finalize button if status is "Verifying Transaction" */}
              {transaction.status?.toLowerCase() !==
                "verifying transaction" && (
                <FinalizeButton
                  onClick={handleFinalizeClick}
                  label="Finalize"
                />
              )}

              {/* Hide Verify button if status is "Creating Transaction" */}
              {transaction.status?.toLowerCase() !== "creating transaction" && (
                <VerifyButton onClick={handleVerifyClick} label="Verify" />
              )}
            </Box>
          )}
        </Box>
      )}
    </ModalContainer>
  );
}

export default TransactionInfoModal;
