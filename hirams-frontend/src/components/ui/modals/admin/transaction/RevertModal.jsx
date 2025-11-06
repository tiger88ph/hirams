import React, { useState } from "react";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard"; // ✅ use remarks input
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function MRevertModal({ open, onClose, transactionId, onReverted, transaction }) {
  const [remarks, setRemarks] = useState(""); // ✅ remarks only
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName =
    transaction.transactionName || transaction.strTitle || "Transaction";

  const confirmRevert = async () => {
    const entity = transactionName;

    try {
      setLoading(true);
      onClose(); // close for smooth UX

      // ✅ Get userId from localStorage
      const userId = localStorage.getItem("userId");

      // ✅ API call with remarks + user_id
      await withSpinner(`Reverting ${entity}...`, async () => {
        await api.put(`transactions/${transactionId}/revert`, {
          user_id: userId,
          remarks: remarks || null, // optional remarks
        }); 
      });

      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      if (typeof onReverted === "function") await onReverted();

      setRemarks("");
    } catch (error) {
      console.error("❌ Error reverting:", error);
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
        onClose();
      }}
      title="Revert Transaction"
      width={450}
      showSave={false}
      loading={loading}
    >
      <RemarksModalCard
        title={`Revert ${transactionName}`}
        description={`You are about to revert the transaction "${transactionName}". This action cannot be undone.`}
        icon={<WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />}
        remarks={remarks}
        setRemarks={setRemarks}
        onCancel={onClose}
        onConfirm={confirmRevert}
        confirmLabel="Revert"
        confirmColor="error"
      />
    </ModalContainer>
  );
}

export default MRevertModal;
