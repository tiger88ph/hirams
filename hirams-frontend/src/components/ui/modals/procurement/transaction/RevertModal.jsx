import React, { useState } from "react";
import { Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard"; // ✅ replaced VerificationModalCard
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function PRevertModal({
  open,
  onClose,
  transaction,
  onReverted,
  transactionId,
}) {
  const [remarks, setRemarks] = useState(""); // ✅ remarks instead of verifyLetter
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName =
    transaction.transactionName || transaction.strTitle || "Transaction";

  const confirmRevert = async () => {
    const entity = transactionName;

    try {
      setLoading(true);
      onClose(); // close immediately for smooth UX

      // ✅ Get userId from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(`Reverting ${entity}...`, async () => {
        // ✅ Send userId and optional remarks
        await api.put(`transactions/${transactionId}/revert`, {
          user_id: userId,
          remarks: remarks.trim() || null, // ✅ optional remarks
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "reverted" });

      if (typeof onReverted === "function") {
        await onReverted();
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
      showSave={false}
      loading={loading}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={onClose}
        onSave={confirmRevert}
        title={`Revert Transaction "${transactionName}"`}
        placeholder="Optional: Add remarks for reverting this transaction..."
        saveButtonColor="error"
        saveButtonText="Confirm Revert"
        icon={<WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />}
      />
    </ModalContainer>
  );
}

export default PRevertModal;
