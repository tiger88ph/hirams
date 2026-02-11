import React, { useState } from "react";
import ModalContainer from "../../../common/ModalContainer";
import RemarksModalCard from "../../../common/RemarksModalCard";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";

function PRevertModal({
  open,
  onClose,
  transaction,
  onReverted,
  transactionId,
  proc_status, // ✅ pass from parent
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = transaction.transactionName || transaction.strTitle;

  // ------------------------------
  // Get previous status properly
  // ------------------------------
  const getPreviousStatus = (currentStatus) => {
    if (!proc_status) return null;
    const entries = Object.entries(proc_status)
      .map(([key, value]) => ({ key: Number(key), value }))
      .sort((a, b) => a.key - b.key);

    const index = entries.findIndex((e) => e.key === Number(currentStatus));
    if (index <= 0) return null;
    return String(entries[index - 1].key); // return string key
  };

  const confirmRevert = async () => {
    const entity = transactionName;

    try {
      setLoading(true);
      onClose(); // close immediately for UX

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const currentStatus = transaction.status_code;
      const revertTo = getPreviousStatus(currentStatus);

      if (!revertTo) throw new Error("This transaction cannot be reverted.");

      await withSpinner(entity, async () => {
        await api.put(`transactions/${transactionId}/revert`, {
          user_id: userId,
          remarks: remarks.trim() || null,
          revert_to_status: revertTo,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      if (typeof onReverted === "function") {
        await onReverted(revertTo); // pass reverted status to parent
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
        saveButtonColor="success"
        saveButtonText="Confirm Revert"
      />
    </ModalContainer>
  );
}

export default PRevertModal;
