import React, { useState } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard";
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
  nUserId,
}) {
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const { draftCode, procMode, procSource, itemType, finalizeCode } =
    useMapping();

  if (!open || !transaction) return null;

  const transactionName =
    transaction.strTitle || transaction.transactionName || "Transaction";

  // 🟢 Finalize flow
  const handleFinalizeClick = () => setConfirming(true);

  const confirmFinalize = async () => {
    const entity = transactionName;

    try {
      setLoading(true);
      onClose();

      await withSpinner(`Finalizing ${entity}...`, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.nUserId;
        if (!userId) throw new Error("User ID missing.");

        await api.put(`transactions/${transaction.nTransactionId}/finalize`, {
          userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "finalized" });
      if (typeof onFinalized === "function") await onFinalized();

      setRemarks("");
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
    setRemarks("");
    setRemarksError("");
  };

  const confirmVerify = async () => {
    const entity = transactionName;

    try {
      setLoading(true);
      onClose();

      await withSpinner(`Verifying ${entity}...`, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.nUserId;
        if (!userId) throw new Error("User ID missing.");

        await api.put(`transactions/${transaction.nTransactionId}/verify`, {
          userId,
          remarks: remarks.trim() || null, // ✅ optional remarks
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "verified" });
      if (typeof onVerified === "function") await onVerified();

      setRemarks("");
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

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setRemarks("");
        setRemarksError("");
        setConfirming(false);
        setVerifying(false);
        onClose();
      }}
      title={
        confirming
          ? "Transaction Details / Finalization Remarks"
          : verifying
          ? "Transaction Details / Verification Remarks"
          : "Transaction Details"
      }
      width={confirming || verifying ? 400 : 750}
      showFooter={false}
      loading={loading}
    >
      {/* 🟩 Finalize Remarks */}
      {confirming && (
        <RemarksModalCard
          remarks={remarks}
          setRemarks={setRemarks}
          remarksError={remarksError}
          onBack={() => {
            setConfirming(false);
            setRemarks("");
            setRemarksError("");
          }}
          onSave={confirmFinalize}
          title={`Finalize Remarks for "${transactionName}"`}
          placeholder="Optional: Add remarks for finalization..."
          saveButtonColor="success"
          saveButtonText="Confirm Finalize"
        />
      )}
      {/* 🟢 Verify Remarks */}
      {verifying && (
        <RemarksModalCard
          remarks={remarks}
          setRemarks={setRemarks}
          remarksError={remarksError}
          onBack={() => {
            setVerifying(false);
            setRemarks("");
            setRemarksError("");
          }}
          onSave={confirmVerify}
          title={`Verification Remarks for "${transactionName}"`}
          placeholder="Optional: Add remarks for verification..."
          saveButtonColor="success"
          saveButtonText="Confirm Verify"
        />
      )}
      {/* 📋 Transaction Info */}
      {!confirming && !verifying && (
        <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1, pb: 1 }}>
          {/* 🔹 Show info box if finalized and same user */}
          {(() => {
            const loggedUser = JSON.parse(localStorage.getItem("user"));
            const loggedUserId = loggedUser?.nUserId;
            const transactionUserId = nUserId;

            const isFinalized = Object.keys(finalizeCode).includes(
              String(transaction.status_code)
            );

            if (
              isFinalized &&
              transactionUserId &&
              loggedUserId &&
              transactionUserId === loggedUserId
            ) {
              return (
                <Box
                  sx={{
                    backgroundColor: "#e0f2fe",
                    border: "1px solid #38bdf8",
                    borderRadius: 2,
                    p: 2,
                    mb: 2.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#0369a1",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      textAlign: "center",
                    }}
                  >
                    This transaction is for verification of other procurement,
                    management, or procurement TL.
                  </Typography>
                </Box>
              );
            }

            return null;
          })()}

          {/* Info Sections */}
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

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 3,
              gap: 2,
            }}
          >
            {/* 🟢 Finalize button (only if draft) */}
            {Object.keys(draftCode).includes(
              String(transaction.status_code)
            ) && (
              <FinalizeButton onClick={handleFinalizeClick} label="Finalize" />
            )}

            {/* ✅ Verify button (only if not same user and not draft) */}
            {(() => {
              const loggedUser = JSON.parse(localStorage.getItem("user"));
              const loggedUserId = loggedUser?.nUserId;
              const transactionUserId = nUserId;

              const isNotDraft = !Object.keys(draftCode).includes(
                String(transaction.status_code)
              );

              if (
                isNotDraft &&
                transactionUserId &&
                loggedUserId &&
                transactionUserId !== loggedUserId
              ) {
                return (
                  <VerifyButton onClick={handleVerifyClick} label="Verify" />
                );
              }

              return null;
            })()}
          </Box>
        </Box>
      )}
    </ModalContainer>
  );
}

export default TransactionInfoModal;
