import React, { useState } from "react";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function MTransactionActionModal({
  open,
  onClose,
  actionType, // "verified" | "reverted"
  transaction,
  onVerified,
  onReverted,
  canvasVerificationLabel,
  transacstatus,
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;

  /* ---------------- STATUS FLOW HELPERS ---------------- */

  const getNextStatus = (currentStatus, statusMap) => {
    const keys = Object.keys(statusMap);
    const index = keys.indexOf(String(currentStatus));
    if (index === -1 || index >= keys.length - 1) return null;
    return keys[index + 1]; // ✅ NEXT status
  };

  const getPreviousStatus = (currentStatus, statusMap) => {
    const keys = Object.keys(statusMap);
    const index = keys.indexOf(String(currentStatus));
    if (index <= 0) return null;
    return keys[index - 1]; // ✅ PREVIOUS (grievous) status
  };

  const currentStatus = transaction.latest_history?.nStatus;

  const targetStatus =
    actionType === "verified"
      ? getNextStatus(currentStatus, transacstatus)
      : actionType === "reverted"
      ? getPreviousStatus(currentStatus, transacstatus)
      : null;

  /* ---------------- ACTION HANDLER ---------------- */

  const confirmAction = async () => {
    try {
      onClose();
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const endpointMap = {
        verified:
          transaction.status === canvasVerificationLabel
            ? `transactions/${transaction.nTransactionId}/verify-ao-canvas`
            : `transactions/${transaction.nTransactionId}/verify-ao`,
        reverted: `transactions/${transaction.nTransactionId}/revert`,
      };

      if (!targetStatus) {
        throw new Error(
          actionType === "verified"
            ? "This transaction cannot be verified further."
            : "This transaction cannot be reverted."
        );
      }

      const payload =
        actionType === "verified"
          ? {
              userId,
              remarks: remarks.trim() || null,
              next_status: targetStatus, // ✅ explicit next status (recommended)
            }
          : {
              user_id: userId,
              remarks: remarks.trim() || null,
              revert_to_status: targetStatus,
            };

      const response = await withSpinner(transactionName, async () => {
        return await api.put(endpointMap[actionType], payload);
      });

      await showSwal("SUCCESS", {}, { entity: transactionName, action: actionType });

      const newStatus = response?.new_status ?? targetStatus;

      if (actionType === "verified") onVerified?.(newStatus);
      if (actionType === "reverted") onReverted?.(newStatus);

      setRemarks("");
      setRemarksError("");
    } catch (err) {
      console.error("❌ Action failed:", err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={actionType === "verified" ? "Verify Transaction" : "Revert Transaction"}
      subTitle={transaction.strCode}
      onSave={confirmAction}
      saveLabel={actionType === "verified" ? "Verify" : "Revert"}
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
        saveButtonText={
          actionType === "verified" ? "Confirm Verify" : "Confirm Revert"
        }
      />
    </ModalContainer>
  );
}

export default MTransactionActionModal;
