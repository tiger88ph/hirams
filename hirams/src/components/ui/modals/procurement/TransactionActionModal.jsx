import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalContainer from "../../../common/ModalContainer";
import RemarksModalCard from "../../../common/RemarksModalCard";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";

function PTransactionActionModal({
  open,
  onClose,
  transaction: details,
  actionType,
  aostatus: proc_status, 
}) {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !details) return null;

  const transactionName = details.strTitle || details.transactionName;
  const getNextStatus = (currentStatus) => {
    if (!proc_status) return null;
    const entries = Object.entries(proc_status)
      .map(([key, value]) => ({ key: Number(key), value }))
      .sort((a, b) => a.key - b.key);
    const index = entries.findIndex((e) => e.key === Number(currentStatus));
    if (index < 0 || index >= entries.length - 1) return null;
    return String(entries[index + 1].key); // return string key
  };
  const getPreviousStatus = (currentStatus) => {
    if (!proc_status) return null;
    const entries = Object.entries(proc_status)
      .map(([key, value]) => ({ key: Number(key), value }))
      .sort((a, b) => a.key - b.key);
    const index = entries.findIndex((e) => e.key === Number(currentStatus));
    if (index <= 0) return null;
    return String(entries[index - 1].key); // return string key
  };
  const confirmAction = async () => {
    try {
      onClose();

      const userId = JSON.parse(localStorage.getItem("user"))?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const currentStatusCode = String(details.status_code);
      let endpoint = "";
      let payload = {};
      let nextStatusCode = null;

      if (actionType === "verify") {
        endpoint = `transactions/${details.nTransactionId}/verify`;
        payload = { userId, remarks: remarks.trim() || null };
      } else if (actionType === "finalize") {
        endpoint = `transactions/${details.nTransactionId}/finalize`;
        nextStatusCode = getNextStatus(currentStatusCode);
        payload = {
          userId,
          remarks: remarks.trim() || null,
          next_status: nextStatusCode,
        };
      } else if (actionType === "revert") {
        endpoint = `transactions/${details.nTransactionId}/revert`;
        nextStatusCode = getPreviousStatus(currentStatusCode);
        if (!nextStatusCode) {
          throw new Error("This transaction cannot be reverted.");
        }
        payload = {
          user_id: userId,
          remarks: remarks.trim() || null,
          revert_to_status: nextStatusCode,
        };
      }

      setLoading(true);

      // Execute API call
      await withSpinner(transactionName, async () => {
        await api.put(endpoint, payload);
      });

      await showSwal(
        "SUCCESS",
        {},
        { entity: transactionName, action: actionType },
      );

      // Reset remarks
      setRemarks("");
      setRemarksError("");

      // ✅ Save new status in sessionStorage for filter
      if (nextStatusCode && proc_status[nextStatusCode]) {
        sessionStorage.setItem("selectedProcStatusCode", nextStatusCode);
      }

      // ✅ Navigate back for all actions
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
