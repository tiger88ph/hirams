import React, { useState } from "react";
import { Box, Typography, Grid, Paper, Divider } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import AlertBox from "../../../../common/AlertBox";
import useMapping from "../../../../../utils/mappings/useMapping";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import {
  VerifyButton,
  FinalizeButton,
  RevertButton1,
} from "../../../../common/Buttons";

function DetailItem({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography
        variant="body2"
        sx={{ color: "text.primary", fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontStyle: "italic", color: "text.secondary" }}
      >
        {value || "—"}
      </Typography>
    </Grid>
  );
}

function PTransactionInfoModal({
  open,
  onClose,
  transaction: details,
  onFinalized,
  onVerified,
  nUserId,
}) {
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false); // ✅ revert state
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const { draftCode, procMode, procSource, itemType, statusTransaction } =
    useMapping();

  if (!open || !details) return null;

  const transactionName =
    details.strTitle || details.transactionName || "Transaction";

  /** --- Finalize --- */
  const handleFinalizeClick = () => setConfirming(true);
  const confirmFinalize = async () => {
    try {
      setLoading(true);
      onClose();
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Finalizing ${transactionName}...`, async () => {
        await api.put(`transactions/${details.nTransactionId}/finalize`, {
          userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transactionName, action: "finalized" }
      );
      onFinalized?.();
      setRemarks("");
      setConfirming(false);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  /** --- Verify --- */
  const handleVerifyClick = () => {
    setVerifying(true);
    setRemarks("");
    setRemarksError("");
  };
  const confirmVerify = async () => {
    try {
      setLoading(true);
      onClose();
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Verifying ${transactionName}...`, async () => {
        await api.put(`transactions/${details.nTransactionId}/verify`, {
          userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transactionName, action: "verified" }
      );
      onVerified?.();
      setRemarks("");
      setVerifying(false);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  /** --- Revert --- */
  const handleRevertClick = () => {
    setReverting(true);
    setRemarks("");
    setRemarksError("");
  };
  const confirmRevert = async () => {
    try {
      setLoading(true);
      onClose(); // hide transaction info for smooth UX

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Reverting ${transactionName}...`, async () => {
        await api.put(`transactions/${details.nTransactionId}/revert`, {
          user_id: userId,
          remarks: remarks.trim() || null,
        });
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transactionName, action: "reverted" }
      );
      onFinalized?.();
      setRemarks("");
      setReverting(false);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const itemTypeLabel = itemType?.[details.cItemType] || details.cItemType;
  const procModeLabel = procMode?.[details.cProcMode] || details.cProcMode;
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

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
  const isDraft = Object.keys(draftCode).includes(String(details.status_code));
  const showFinalize = isDraft;
  const showRevert = !isDraft;

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setRemarks("");
        setRemarksError("");
        setConfirming(false);
        setVerifying(false);
        setReverting(false);
        onClose();
      }}
      title={
        confirming
          ? "Transaction Details / Finalization Remarks"
          : verifying
            ? "Transaction Details / Verification Remarks"
            : reverting
              ? "Revert Transaction"
              : "Transaction Details"
      }
      showSave={false}
      loading={loading}
    >
      {/* --- Revert Modal View --- */}
      {reverting && (
        <RemarksModalCard
          remarks={remarks}
          setRemarks={setRemarks}
          remarksError={remarksError}
          onBack={() => setReverting(false)}
          onSave={confirmRevert}
          title={`Remarks for reverting "${transactionName}"`}
          placeholder="Optional: Add remarks for reverting this transaction..."
          saveButtonColor="error"
          saveButtonText="Confirm Revert"
          icon={
            <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
          }
        />
      )}

      {/* --- Finalize Modal View --- */}
      {confirming && !reverting && (
        <RemarksModalCard
          remarks={remarks}
          setRemarks={setRemarks}
          remarksError={remarksError}
          onBack={() => setConfirming(false)}
          onSave={confirmFinalize}
          title={`Remarks for finalizing "${transactionName}"`}
          placeholder="Optional: Add remarks for finalization..."
          saveButtonColor="success"
          saveButtonText="Confirm Finalize"
        />
      )}

      {/* --- Verify Modal View --- */}
      {verifying && !reverting && (
        <RemarksModalCard
          remarks={remarks}
          setRemarks={setRemarks}
          remarksError={remarksError}
          onBack={() => setVerifying(false)}
          onSave={confirmVerify}
          title={`Remarks for Verifying "${transactionName}"`}
          placeholder="Optional: Add remarks for verification..."
          saveButtonColor="success"
          saveButtonText="Confirm Verify"
        />
      )}

      {/* --- Transaction Info --- */}
      {!confirming && !verifying && !reverting && (
        <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
          {showRevert && (
            <AlertBox>
              This transaction is currently under verification by another
              procurement officer, team leader, or management. You may revert it
              only if further correction is required.
            </AlertBox>
          )}
          {showFinalize && (
            <AlertBox>
              Review all encoded information thoroughly before finalizing. Once
              finalized, this transaction can no longer be edited or deleted. If
              corrections are needed later, you may revert it back—provided it
              has not yet been verified.
            </AlertBox>
          )}

          {/* Transaction */}
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}
          >
            Transaction
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <DetailItem
              label="Assigned Account Officer"
              value={
                details.user?.strFName
                  ? `${details.user.strFName} ${details.user.strLName}`
                  : "Not Assigned"
              }
            />
            <DetailItem
              label="Status"
              value={statusTransaction?.[details.status_code] || "—"}
            />
          </Grid>

          {/* Basic Information */}
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
          >
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <DetailItem
              label="Transaction Code"
              value={details.strCode || details.transactionId}
            />
            <DetailItem
              label="Title"
              value={details.strTitle || details.transactionName}
            />
            <DetailItem
              label="Company"
              value={
                details.company?.strCompanyNickName || details.companyNickName
              }
            />
            <DetailItem
              label="Client"
              value={
                details.client?.strClientNickName || details.clientNickName
              }
            />
          </Grid>

          {/* Procurement */}
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
          >
            Procurement
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <DetailItem label="Item Type" value={itemTypeLabel} />
            <DetailItem label="Procurement Mode" value={procModeLabel} />
            <DetailItem label="Procurement Source" value={procSourceLabel} />
            <DetailItem
              label="Total ABC"
              value={
                details.dTotalABC
                  ? `₱${Number(details.dTotalABC).toLocaleString()}`
                  : "—"
              }
            />
          </Grid>

          {/* Schedule */}
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
          >
            Schedule
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <DetailItem
              label="Pre-Bid"
              value={
                details.dtPreBid
                  ? `${formatDateTime(details.dtPreBid)}${details.strPreBid_Venue ? ` — ${details.strPreBid_Venue}` : ""}`
                  : "—"
              }
            />
            <DetailItem
              label="Doc Issuance"
              value={
                details.dtDocIssuance
                  ? `${formatDateTime(details.dtDocIssuance)}${details.strDocIssuance_Venue ? ` — ${details.strDocIssuance_Venue}` : ""}`
                  : "—"
              }
            />
            <DetailItem
              label="Doc Submission"
              value={
                details.dtDocSubmission
                  ? `${formatDateTime(details.dtDocSubmission)}${details.strDocSubmission_Venue ? ` — ${details.strDocSubmission_Venue}` : ""}`
                  : "—"
              }
            />
            <DetailItem
              label="Doc Opening"
              value={
                details.dtDocOpening
                  ? `${formatDateTime(details.dtDocOpening)}${details.strDocOpening_Venue ? ` — ${details.strDocOpening_Venue}` : ""}`
                  : "—"
              }
            />
          </Grid>

          {/* Action Buttons */}
          <Box
            sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}
          >
            {/* Verify Button (unchanged logic) */}
            {(() => {
              const loggedUser = JSON.parse(localStorage.getItem("user"));
              const loggedUserId = loggedUser?.nUserId;
              const transactionUserId = nUserId;
              const isNotDraft = !isDraft;

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

            {/* Finalize Button */}
            {showFinalize && (
              <FinalizeButton onClick={handleFinalizeClick} label="Finalize" />
            )}

            {/* Revert Button */}
            {showRevert && (
              <RevertButton1 onClick={handleRevertClick} label="Revert" />
            )}
          </Box>
        </Paper>
      )}
    </ModalContainer>
  );
}

export default PTransactionInfoModal;
