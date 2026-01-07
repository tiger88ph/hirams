import React, { useState } from "react";
import ModalContainer from "../../../common/ModalContainer";
import RemarksModalCard from "../../../common/RemarksModalCard";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";

function TransactionActionModal({
  open,
  onClose,
  actionType, // "verified" | "reverted" | "finalized"
  transaction,
  onVerified,
  onReverted,
  onFinalized,
  canvasVerificationLabel,
  forCanvasLabel,
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = transaction.strTitle;

  const confirmAction = async () => {
    try {
      setLoading(true);
      onClose(); // close modal immediately

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const endpointMap = {
        verified:
          transaction.status === canvasVerificationLabel
            ? `transactions/${transaction.nTransactionId}/verify-ao-canvas`
            : `transactions/${transaction.nTransactionId}/verify-ao`,
        reverted: `transactions/${transaction.nTransactionId}/revert`,
        finalized:
          transaction.status === forCanvasLabel ||
          transaction.status === canvasVerificationLabel
            ? `transactions/${transaction.nTransactionId}/finalize-ao-canvas`
            : `transactions/${transaction.nTransactionId}/finalize-ao`,
      };

      const payload =
        actionType === "reverted"
          ? { user_id: userId, remarks: remarks.trim() || null }
          : { userId, remarks: remarks.trim() || null };

      await withSpinner(transactionName, async () => {
        await api.put(endpointMap[actionType], payload);
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transactionName, action: actionType }
      );

      if (actionType === "verified") onVerified?.();
      if (actionType === "reverted") onReverted?.();
      if (actionType === "finalized") onFinalized?.();

      setRemarks("");
      setRemarksError("");
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const modalTitles = {
    verified: "Verify Transaction",
    reverted: "Revert Transaction",
    finalized: "Finalize Transaction",
  };

  const buttonText = {
    verified: "Confirm Verify",
    reverted: "Confirm Revert",
    finalized: "Confirm Finalize",
  };

  // ✅ Correct saveLabel mapping
  const saveLabelMap = {
    verified: "Verify",
    reverted: "Revert",
    finalized: "Finalize",
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={modalTitles[actionType]}
      subTitle={transaction.strCode}
      onSave={confirmAction}
      saveLabel={saveLabelMap[actionType] || "Save"} // fallback to Save
      customLoading={loading}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={onClose}
        onSave={confirmAction}
        actionWord={actionType}
        entityName={transactionName}
        saveButtonColor={actionType === "reverted" ? "error" : "success"}
        saveButtonText={buttonText[actionType]}
      />
    </ModalContainer>
  );
}

export default TransactionActionModal;
