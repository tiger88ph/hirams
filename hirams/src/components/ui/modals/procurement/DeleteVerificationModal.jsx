import React, { useState, useEffect } from "react";
import ModalContainer from "../../../common/ModalContainer";
import VerificationModalCard from "../../../common/VerificationModalCard";
import api from "../../../../utils/api/api";
import { withSpinner, showSwal } from "../../../../utils/swal/index";
import messages from "../../../../utils/messages/messages";

function DeleteVerificationModal({
  open,
  onClose,
  entityToDelete, // { type: 'item' | 'option' | 'pricing-set', data: entityData }
  onSuccess, // function to call after deletion
}) {
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationError, setVerificationError] = useState("");

  // Reset input/error whenever modal opens/closes
  useEffect(() => {
    if (open) {
      setVerificationInput("");
      setVerificationError("");
    }
  }, [open]);

  if (!open || !entityToDelete) return null;

  const { type, data } = entityToDelete;

  // Determine entity name to show in modal & verify input
  const entityName =
    type === "item"
      ? data?.name
      : type === "pricing-set"
      ? data?.name
      : data?.supplierName || data?.strSupplierName;

  const handleConfirm = async () => {
    if (!entityName) return;

    // Validate user input: first character must match entity name
    if (verificationInput.trim().toLowerCase() !== entityName[0].toLowerCase()) {
      setVerificationError(messages.transaction.errorDeleteMess);
      return;
    }

    try {
      setVerificationInput("");
      setVerificationError("");
      onClose();

      await withSpinner(entityName, async () => {
        // Delete via API based on type
        if (type === "item") {
          await api.delete(`transaction-items/${data.id}`);
        } else if (type === "pricing-set") {
          await api.delete(`pricing-sets/${data.id}`);
        } else if (type === "option") {
          await api.delete(`purchase-options/${data.id}`);
        }
        await onSuccess(); // Refresh parent table
      });

      await showSwal("SUCCESS", {}, { entity: entityName, action: "deleted" });
    } catch (err) {
      console.error(`❌ Error deleting ${type}:`, err);
      await showSwal("ERROR", {}, { entity: entityName });
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
      subTitle={entityName || ""}
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