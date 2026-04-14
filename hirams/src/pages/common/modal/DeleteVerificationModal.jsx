import React, { useState, useEffect } from "react";
import ModalContainer from "../../../components/common/ModalContainer.jsx";
import VerificationModalCard from "../../../components/common/VerificationModalCard.jsx";
import api from "../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../utils/helpers/swal.jsx";
import uiMessages from "../../../utils/helpers/uiMessages.js";

function DeleteVerificationModal({ open, onClose, entityToDelete, onSuccess }) {
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationError, setVerificationError] = useState("");

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
        : type === "user"
          ? data?.name
          : type === "company"
            ? data?.nickname
            : type === "client"
              ? data?.nickname || data?.name
              : type === "transaction"
                ? data?.code
                : type === "option"
                  ? data?.supplierNickName || data?.supplierName
                  : type === "direct-cost"
                    ? data?.name
                    : data?.supplierName || data?.strSupplierName;

  const handleConfirm = async () => {
    if (!entityName) return;

    // Validate user input: first character must match entity name
    if (
      verificationInput.trim().toLowerCase() !== entityName[0].toLowerCase()
    ) {
      setVerificationError(uiMessages.common.errorReqChar);
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
        } else if (type === "user") {
          await api.delete(`users/${data.id}`);
        } else if (type === "company") {
          await api.delete(`companies/${data.id}`);
        } else if (type === "supplier") {
          await api.delete(`suppliers/${data.id}`);
        } else if (type === "client") {
          await api.delete(`clients/${data.id}`);
        } else if (type === "transaction") {
          await api.delete(`transactions/${data.id}`);
        } else if (type === "direct-cost") {
          await api.delete(`direct-cost-options/${data.id}`);
        }

        await onSuccess();
      });

      await showSwal("SUCCESS", {}, { entity: entityName, action: "deleted" });
    } catch (err) {
      const serverMessage = err?.message;
      const isConflict =
        serverMessage &&
        !serverMessage.toLowerCase().includes("something went wrong");

      if (isConflict) {
        await showSwal("ERROR", { text: serverMessage });
      } else {
        await showSwal("ERROR", {}, { entity: entityName });
      }
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
      subTitle={entityName ? ` / ${entityName}` : ""}
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
