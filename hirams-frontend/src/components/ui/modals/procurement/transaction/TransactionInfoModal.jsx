import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import useMapping from "../../../../../utils/mappings/useMapping";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import messages from "../../../../../utils/messages/messages";
import {
  VerifyButton,
  FinalizeButton,
  RevertButton1,
  SetPriceButton,
} from "../../../../common/Buttons";
import TransactionDetails from "../../../../common/TransactionDetails";

function PTransactionInfoModal({
  open,
  onClose,
  transaction: details,
  onFinalized,
  onVerified,
  nUserId,
  transactionCode,
}) {
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false); // ✅ revert state
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const {
    draftCode,
    finalizeCode,
    priceSettingCode,
    priceVerificationCode,
    priceApprovalCode,
    priceVerificationRequestCode,
    transactionVerificationRequestCode,
    procMode,
    procSource,
    itemType,
    statusTransaction,
  } = useMapping();

  if (!open || !details) return null;

  const transactionName =
    details.strTitle || details.transactionName;

  /** --- Finalize --- */
  const handleFinalizeClick = () => setConfirming(true);
  const confirmFinalize = async () => {
    try {
      setLoading(true);
      onClose();
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(transactionName, async () => {
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

      await withSpinner(transactionName, async () => {
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

      await withSpinner(transactionName, async () => {
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
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  const isDraft = Object.keys(draftCode).includes(String(details.status_code));
  const isFinalize = Object.keys(finalizeCode).includes(
    String(details.status_code)
  );
  const isPriceSetting = Object.keys(priceSettingCode).includes(
    String(details.status_code)
  );
  const isPriceVerification =
    Object.keys(transactionVerificationRequestCode).includes(
      String(details.status_code)
    ) ||
    Object.keys(priceVerificationRequestCode).includes(
      String(details.status_code)
    );
  const isPriceApproval = Object.keys(priceApprovalCode).includes(
    String(details.status_code)
  );
  const showFinalize = isDraft;
  const showRevert = !isDraft;
  const showInFinalze = isFinalize;
  const showSetPrice = isPriceSetting;
  const showVerification = isPriceVerification;
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
      subTitle={transactionCode.trim() || ""}
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
          actionWord="reverting"
          entityName={transactionName}
          saveButtonColor="success"
          saveButtonText="Confirm Revert"
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
          actionWord="finalizing"
          entityName={transactionName}
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
          actionWord="verifying"
          entityName={transactionName}
          saveButtonColor="success"
          saveButtonText="Confirm Verify"
        />
      )}

      {/* --- Transaction Info --- */}
      {!confirming && !verifying && !reverting && (
        <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
          <TransactionDetails
            details={details}
            statusTransaction={statusTransaction}
            itemType={itemType}
            procMode={procMode}
            procSourceLabel={procSourceLabel}
          />

          {/* Action Buttons */}
          <Box
            sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}
          >
            {showVerification && (
              <VerifyButton onClick={handleVerifyClick} label="Verify" />
            )}

            {/* Finalize Button */}
            {showFinalize && (
              <FinalizeButton onClick={handleFinalizeClick} label="Finalize" />
            )}
            {showSetPrice && <SetPriceButton label="Set Price" />}
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
