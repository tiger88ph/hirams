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
  transactionCode,
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName =
    transaction.transactionName || transaction.strTitle;

  const confirmRevert = async () => {
    const entity = transactionName;

    try {
      setLoading(true);

      // Close modal immediately for smooth UX
      onClose();

      // Get userId
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      // Use spinner while reverting
      await withSpinner(`${messages.crudPresent.revertingMess}${entity}${messages.typography.ellipsis}`, async () => {
        await api.put(`transactions/${transactionId}/revert`, {
          user_id: userId,
          remarks: remarks.trim() || null,
        });
      });

      // Show success alert
      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      if (typeof onReverted === "function") {
        await onReverted();
      }

      setRemarks("");
      setRemarksError("");
    } catch (error) {
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
