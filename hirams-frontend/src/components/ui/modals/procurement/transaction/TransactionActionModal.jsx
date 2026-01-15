import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function PTransactionActionModal({
  open,
  onClose,
  transaction: details,
  actionType, // "verify", "finalize", "revert"
}) {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !details) return null;

  const transactionName = details.strTitle || details.transactionName;

  /** --- API call --- */
  const confirmAction = async () => {
    try {
      // Close modal immediately for smooth UX
      onClose();

      setLoading(true);
      const userId = JSON.parse(localStorage.getItem("user"))?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      let endpoint = "";
      if (actionType === "verify") endpoint = `transactions/${details.nTransactionId}/verify`;
      else if (actionType === "finalize") endpoint = `transactions/${details.nTransactionId}/finalize`;
      else if (actionType === "revert") endpoint = `transactions/${details.nTransactionId}/revert`;

      const payload =
        actionType === "revert"
          ? { user_id: userId, remarks: remarks.trim() || null }
          : { userId, remarks: remarks.trim() || null };

      // Execute API with spinner
      await withSpinner(transactionName, async () => {
        await api.put(endpoint, payload);
      });

      // Show success message
      await showSwal("SUCCESS", {}, { entity: transactionName, action: actionType });

      // Reset state
      setRemarks("");
      setRemarksError("");
      
      // Navigate back after success
      navigate(-1);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={
        actionType === "verify"
          ? "Verification Remarks"
          : actionType === "finalize"
          ? "Finalization Remarks"
          : "Revert Remarks"
      }
      showSave
      saveLabel={
        actionType === "verify"
          ? "Confirm Verify"
          : actionType === "finalize"
          ? "Confirm Finalize"
          : "Confirm Revert"
      }
      showCancel
      cancelLabel="Cancel"
      onSave={confirmAction}
      onCancel={onClose}
      loading={loading}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={onClose}
        onSave={confirmAction}
        actionWord={actionType}
        entityName={transactionName}
        saveButtonColor={actionType === "revert" ? "error" : "success"}
        saveButtonText={
          actionType === "verify"
            ? "Confirm Verify"
            : actionType === "finalize"
            ? "Confirm Finalize"
            : "Confirm Revert"
        }
      />
    </ModalContainer>
  );
}

export default PTransactionActionModal;
