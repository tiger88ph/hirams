import React from "react";
import ModalContainer from "../../../common/ModalContainer";
import VerificationModalCard from "../../../common/VerificationModalCard";

function DeleteVerificationModal({
  open,
  onClose,
  entityName,
  verificationInput,
  setVerificationInput,
  verificationError,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Delete Confirmation"
      subTitle={entityName || ""}
      showSave={false}
    >
      <VerificationModalCard
        entityName={entityName}
        verificationInput={verificationInput}
        setVerificationInput={setVerificationInput}
        verificationError={verificationError}
        onBack={onClose}
        onConfirm={onConfirm}
        actionWord="Delete"
        confirmButtonColor="error"
      />
    </ModalContainer>
  );
}

export default DeleteVerificationModal;
