import React, { useState } from "react";
import { Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import VerificationModalCard from "../../../../common/VerificationModalCard";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function PRevertModal({ open, onClose, transaction, onReverted, transactionId }) {
  const [verifyLetter, setVerifyLetter] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName =
    transaction.transactionName || transaction.strTitle || "Transaction";
  const firstLetter = transactionName[0]?.toUpperCase() || "T";

  const confirmRevert = async () => {
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
      onClose(); // close immediately for smooth UX

      await withSpinner(`Reverting ${entity}...`, async () => {
        await api.put(`transactions/${transactionId}/revert`);
      });

      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      if (typeof onReverted === "function") {
        await onReverted();
      }

      // reset
      setVerifyLetter("");
      setVerifyError("");
    } catch (error) {
      console.error("❌ Error reverting transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setVerifyLetter("");
        setVerifyError("");
        onClose();
      }}
      title="Revert Transaction"
      width={400}
      showSave={false}
      loading={loading}
    >
      <VerificationModalCard
        entityName={transactionName}
        verificationInput={verifyLetter}
        setVerificationInput={setVerifyLetter}
        verificationError={verifyError}
        onBack={onClose}
        onConfirm={confirmRevert}
        actionWord="Revert"
        confirmButtonColor="error"
        icon={<WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />}
        description={`You are about to revert the transaction "${transactionName}" (${transaction.transactionId}). This action cannot be undone.`}
      />
    </ModalContainer>
  );
}

export default PRevertModal;
