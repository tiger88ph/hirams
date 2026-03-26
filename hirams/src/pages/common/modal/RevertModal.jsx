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
  statusMapping,
  transactionCode,
  saveButtonColor = "error",
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;
  const entity = `${transaction.strCode || transactionCode || "Transaction"}`;

  /**
   * Mirrors TransactionActionModal's getStatusByOffset / getPStatusByOffset:
   * tries string-keyed lookup first, then falls back to numeric-sorted lookup.
   */
  const getPreviousStatus = (currentStatus, map) => {
    if (!map) return null;

    // --- String-keyed path (Management / AO) ---
    const stringKeys = Object.keys(map);
    const stringIndex = stringKeys.indexOf(String(currentStatus));
    if (stringIndex > 0) return stringKeys[stringIndex - 1];
    if (stringIndex === 0) return null; // already at the first status

    // --- Numeric-keyed path (Procurement) ---
    const entries = Object.entries(map)
      .map(([key, value]) => ({ key: Number(key), value }))
      .sort((a, b) => a.key - b.key);
    const numIndex = entries.findIndex((e) => e.key === Number(currentStatus));
    if (numIndex <= 0) return null;
    return String(entries[numIndex - 1].key);
  };

  /**
   * Build & validate request BEFORE touching loading state or closing,
   * exactly like TransactionActionModal.buildRequest().
   */
  const buildRequest = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.nUserId;
    if (!userId) throw new Error("User ID missing.");

    const currentStatus = transaction.latest_history?.nStatus;
    const revertTo = getPreviousStatus(currentStatus, statusMapping);

    if (!revertTo) throw new Error(uiMessages.common.errorRevert);

    return {
      endpoint: `transactions/${transactionId}/revert`,
      payload: {
        user_id: userId,
        remarks: remarks.trim() || null,
        revert_to_status: revertTo,
      },
      targetStatus: revertTo,
    };
  };

  const confirmRevert = async () => {
    // 1. Validate FIRST — keep modal open on error (mirrors TransactionActionModal)
    let request;
    try {
      request = buildRequest();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: err.message || transactionName });
      return; // modal stays open
    }

    // 2. Only close + set loading after validation passes
    setLoading(true);
    onClose();

    try {
      const { endpoint, payload, targetStatus } = request;

      const response = await withSpinner(entity, () =>
        api.put(endpoint, payload),
      );

      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      setRemarks("");
      setRemarksError("");

      if (typeof onReverted === "function") {
        await onReverted(response?.new_status ?? targetStatus);
      }
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
      handleClose={() => {
        setRemarks("");
        setRemarksError("");
        onClose();
      }}
      title="Revert Transaction"
      subTitle={transactionCode ? `/ ${transactionCode}` : ""}
      onSave={confirmRevert}
      saveLabel="Revert"
      customLoading={loading}
      loading={loading}
      showSave
      showCancel
      cancelLabel="Cancel"
      onCancel={() => {
        setRemarks("");
        setRemarksError("");
        onClose();
      }}
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
