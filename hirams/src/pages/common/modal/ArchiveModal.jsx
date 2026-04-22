import React, { useState } from "react";
import ModalContainer from "../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../components/common/RemarksModalCard.jsx";
import api from "../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";

function ArchiveModal({
  open,
  onClose,
  transaction,
  transactionId,
  transactionCode,
  mode = "archive", // "archive" | "unarchive"
  onSuccess,
  archiveStatus, // { [code]: label } — e.g. { 900: "Archived", 910: "Lost" }
}) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const isUnarchive = mode === "unarchive";
  const entity = transaction.strCode || transactionCode || "Transaction";
  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;

  const handleConfirm = async () => {
    setLoading(true);
    onClose();

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      const endpoint = isUnarchive
        ? `transactions/${transactionId}/unarchive`
        : `transactions/${transactionId}/archive`;

      await withSpinner(entity, () =>
        api.post(endpoint, {
          user_id: userId,
          remarks: remarks.trim() || null,
        }),
      );
      // ADD THIS — notifies the sidebar to refresh counts for the acting user
      window.dispatchEvent(new CustomEvent("txn_data_updated"));

      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isUnarchive ? "unarchived" : "archived" },
      );

      setRemarks("");
      setRemarksError("");

      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRemarks("");
    setRemarksError("");
    onClose();
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isUnarchive ? "Unarchive Transaction" : "Archive Transaction"}
      subTitle={transactionCode ? `/ ${transactionCode}` : ""}
      onSave={handleConfirm}
      saveLabel={isUnarchive ? "Unarchive" : "Archive"}
      saveButtonColor={isUnarchive ? "primary" : "warning"}
      customLoading={loading}
      loading={loading}
      showSave
      showCancel
      cancelLabel="Cancel"
      onCancel={handleClose}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={handleClose}
        onSave={handleConfirm}
        actionWord={isUnarchive ? "unarchiving" : "archiving"}
        entityName={transactionName}
        saveButtonColor={isUnarchive ? "primary" : "warning"}
        saveButtonText={isUnarchive ? "Confirm Unarchive" : "Confirm Archive"}
      />
    </ModalContainer>
  );
}

export default ArchiveModal;
