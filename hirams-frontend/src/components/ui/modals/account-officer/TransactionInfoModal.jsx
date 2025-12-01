import React from "react";
import { Paper } from "@mui/material";
import ModalContainer from "../../../common/ModalContainer";
import useMapping from "../../../../utils/mappings/useMapping";
import TransactionDetails from "../../../common/TransactionDetails";
/** -----------------------------
 * Main Modal Component
 --------------------------------*/
function ATransactionInfoModal({ open, onClose, transaction: details }) {
  const {
    itemsManagementCode,
    itemsVerificationCode,
    forCanvasCode,
    canvasVerificationCode,
    procSource,
    itemType,
    statusTransaction,
    procMode,
  } = useMapping();

  if (!open || !details) return null;

  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;
  const showTransactionDetails =
    Object.keys(itemsManagementCode).includes(String(details.status_code)) ||
    Object.keys(itemsVerificationCode).includes(String(details.status_code)) ||
    Object.keys(forCanvasCode).includes(String(details.status_code)) ||
    Object.keys(canvasVerificationCode).includes(String(details.status_code));
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      subTitle={details.strCode.trim() || ""}
      showSave={false}
    >
      <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
        <TransactionDetails
          details={details}
          statusTransaction={statusTransaction}
          itemType={itemType}
          procMode={procMode}
          procSourceLabel={procSourceLabel}
          showTransactionDetails={showTransactionDetails}
        />
      </Paper>
    </ModalContainer>
  );
}

export default ATransactionInfoModal;
