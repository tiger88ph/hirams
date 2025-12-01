import React, { useState } from "react";
import { Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";
import RemarksModalCard from "../../../../common/RemarksModalCard"; // ✅ replaced VerificationModalCard
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import messages from "../../../../../utils/messages/messages";
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

  const transactionName = transaction.transactionName || transaction.strTitle;

  const confirmRevert = async () => {
    const entity = transactionName;

    try {
      setLoading(true);
      onClose(); // close immediately for smooth UX

      // ✅ Get userId from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;
      if (!userId) throw new Error("User ID missing.");

      await withSpinner(entity, async () => {
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
        actionWord="reverting"
        entityName={transactionName}
        saveButtonColor="success"
        saveButtonText="Confirm Revert"
      />
    </ModalContainer>
  );
}

export default PRevertModal;
