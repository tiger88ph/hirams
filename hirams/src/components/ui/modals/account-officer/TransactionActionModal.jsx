import React, { useState } from "react";
import ModalContainer from "../../../common/ModalContainer";
import RemarksModalCard from "../../../common/RemarksModalCard";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";

function TransactionActionModal({
  open,
  onClose,
  actionType,
  transaction,
  onVerified,
  onReverted,
  onFinalized,
  canvasVerificationLabel,
  aostatus,
  forCanvasLabel,
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;
  const confirmAction = async () => {
    try {
      onClose(); // close modal immediately
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      if (!targetStatus) {
        throw new Error(
          actionType === "reverted"
            ? "This transaction cannot be reverted."
            : "This transaction cannot proceed further."
        );
      }

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
          ? {
              user_id: userId,
              remarks: remarks.trim() || null,
              revert_to_status: targetStatus,
            }
          : actionType === "verified"
          ? {
              userId,
              remarks: remarks.trim() || null,
            }
          : {
              userId,
              remarks: remarks.trim() || null,
              next_status: targetStatus,
            };

      const response = await withSpinner(transactionName, async () => {
        return await api.put(endpointMap[actionType], payload);
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transactionName, action: actionType }
      );

      const newStatus = response?.new_status ?? targetStatus;

      if (actionType === "verified") onVerified?.(newStatus);
      if (actionType === "reverted") onReverted?.(newStatus);
      if (actionType === "finalized") onFinalized?.(newStatus);

      setRemarks("");
      setRemarksError("");
    } catch (err) {
      console.error("❌ Action failed:", err);
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
  /* ---------------- STATUS FLOW HELPERS ---------------- */

  const getNextStatus = (currentStatus, statusMap) => {
    const keys = Object.keys(statusMap);
    const index = keys.indexOf(String(currentStatus));
    if (index === -1 || index >= keys.length - 1) return null;
    return keys[index + 1];
  };

  const getPreviousStatus = (currentStatus, statusMap) => {
    const keys = Object.keys(statusMap);
    const index = keys.indexOf(String(currentStatus));
    if (index <= 0) return null;
    return keys[index - 1];
  };

  const currentStatus = transaction.latest_history?.nStatus;

  const targetStatus =
    actionType === "verified"
      ? currentStatus // keep status the same
      : actionType === "finalized"
      ? getNextStatus(currentStatus, aostatus)
      : actionType === "reverted"
      ? getPreviousStatus(currentStatus, aostatus)
      : null;

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
