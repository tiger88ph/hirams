import React, { useState } from "react";
import ModalContainer from "../../../common/ModalContainer";
import RemarksModalCard from "../../../common/RemarksModalCard";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";
import messages from "../../../../utils/messages/messages";

function ARevertModal({
  open,
  onClose,
  transaction,
  onReverted,
  transactionId,
  aostatus,
  transactionCode,
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;

  const getPreviousStatus = (currentStatus, aostatus) => {
    if (!aostatus) {
      console.error("❌ aostatus is undefined");
      return null;
    }
    const keys = Object.keys(aostatus);
    const index = keys.indexOf(String(currentStatus));
    if (index <= 0) return null;
    return keys[index - 1];
  };

  const confirmRevert = async () => {
    const entity = transactionName;
    try {
      setLoading(true);
      onClose();

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const currentStatus = transaction.latest_history?.nStatus;
      const revertTo = getPreviousStatus(currentStatus, aostatus);

      if (!revertTo) {
        throw new Error("This transaction cannot be reverted.");
      }

      const response = await withSpinner(entity, async () => {
        return await api.put(`transactions/${transactionId}/revert`, {
          user_id: userId,
          remarks: remarks.trim() || null,
          revert_to_status: revertTo,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      if (typeof onReverted === "function") {
        await onReverted(response?.new_status || revertTo);
      }

      setRemarks("");
      setRemarksError("");
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
        setRemarks("");
        setRemarksError("");
        onClose();
      }}
      title="Revert Transaction"
      subTitle={transactionCode.trim() || ""}
      onSave={confirmRevert}
      saveLabel="Revert"
      loading={loading}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={onClose}
        onSave={confirmRevert}
        actionWord="reverting"
        entityName={transactionName}
        saveButtonColor="error"
        saveButtonText="Confirm Revert"
      />
    </ModalContainer>
  );
}

export default ARevertModal;