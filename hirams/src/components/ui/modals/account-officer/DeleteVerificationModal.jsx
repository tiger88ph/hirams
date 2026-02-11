import React, { useState, useEffect } from "react";
import ModalContainer from "../../../common/ModalContainer";
import VerificationModalCard from "../../../common/VerificationModalCard";
import api from "../../../../utils/api/api";
import { withSpinner, showSwal } from "../../../../utils/swal/index";
import messages from "../../../../utils/messages/messages";

function DeleteVerificationModal({
  open,
  onClose,
  entityToDelete, // { type: 'item' | 'option', data: item/option, itemIndex?, optionIndex? }
  onSuccess,
}) {
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationError, setVerificationError] = useState("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setVerificationInput("");
      setVerificationError("");
    }
  }, [open]);

  if (!open || !entityToDelete) return null;

  const { type, data } = entityToDelete;
  
  // Get entity name based on type
  const entityName = type === "item" 
    ? data?.name 
    : (data?.supplierNickName || data?.supplierNickName);

  const handleConfirm = async () => {
    if (!entityName) return;

    // Validate input
    if (verificationInput.trim().toLowerCase() !== entityName[0].toLowerCase()) {
      setVerificationError(messages.transaction.errorDeleteMess);
      return;
    }

    const entity = entityName;

    try {
      setVerificationInput("");
      setVerificationError("");
      onClose();

      await withSpinner(entity, async () => {
        if (type === "item") {
          await api.delete(`transaction-items/${data.id}`);
        } else if (type === "option") {
          await api.delete(`purchase-options/${data.id}`);
        }

        await onSuccess(); // Refresh items in parent
      });

      await showSwal("SUCCESS", {}, { entity, action: "deleted" });
    } catch (err) {
      console.error(`❌ Error deleting ${type}:`, err);
      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleClose = () => {
    setVerificationInput("");
    setVerificationError("");
    onClose();
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Delete Confirmation"
      subTitle={entityName ? `/ ${entityName}` : ""}
      onSave={handleConfirm}
      saveLabel="Confirm"
    >
      <VerificationModalCard
        entityName={entityName}
        verificationInput={verificationInput}
        setVerificationInput={setVerificationInput}
        verificationError={verificationError}
        onBack={handleClose}
        onConfirm={handleConfirm}
        actionWord="Delete"
        confirmButtonColor="error"
      />
    </ModalContainer>
  );
}

export default DeleteVerificationModal;