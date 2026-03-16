import React, { useState } from "react";
import ModalContainer from "../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../components/common/RemarksModalCard.jsx";
import api from "../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";
import uiMessages from "../../../utils/helpers/uiMessages.js";

function RevertModal({
  open,
  onClose,
  transaction,
  transactionId,
  onReverted,
  statusMapping, // Pass either transacstatus or aostatus
  transactionCode,
  saveButtonColor = "error", // Default to error, can override with "success"
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;
  const entity = `${transaction.strCode || "Transaction"}`;
  const getPreviousStatus = (currentStatus, statusMapping) => {
    if (!statusMapping) {
      return null;
    }
    const keys = Object.keys(statusMapping);
    const index = keys.indexOf(String(currentStatus));
    if (index <= 0) return null;
    return keys[index - 1];
  };

  const confirmRevert = async () => {
    try {
      setLoading(true);
      onClose();

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;

      const currentStatus = transaction.latest_history?.nStatus;
      const revertTo = getPreviousStatus(currentStatus, statusMapping);

      if (!revertTo) {
        throw new Error(`${uiMessages.common.errorRevert}`);
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
      subTitle={transactionCode ? `/ ${transactionCode}` : ""}
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
        saveButtonColor={saveButtonColor}
        saveButtonText="Confirm Revert"
      />
    </ModalContainer>
  );
}

export default RevertModal;
