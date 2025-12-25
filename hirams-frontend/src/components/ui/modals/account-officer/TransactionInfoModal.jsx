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
    procSource,
    itemType,
    statusTransaction,
    procMode,
    ao_status,
    clientstatus,
  } = useMapping();

  if (!open || !details) return null;

  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;
  const statusCode = String(details.status_code);
  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const itemsManagementKey = Object.keys(ao_status)[0] || "";
  const itemsFinalizeKey = Object.keys(ao_status)[1] || "";
  const itemsVerificationKey = Object.keys(ao_status)[2] || "";
  const forCanvasKey = Object.keys(ao_status)[3] || "";
  const canvasFinalizeKey = Object.keys(ao_status)[4] || "";
  const canvasVerificationKey = Object.keys(ao_status)[5] || "";

  const showTransactionDetails =
    itemsManagementKey.includes(statusCode) ||
    itemsVerificationKey.includes(statusCode) ||
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
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
