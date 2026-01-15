import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import useMapping from "../../utils/mappings/useMapping";
import PTransactionActionModal from "../../components/ui/modals/procurement/transaction/TransactionActionModal";
import {
  VerifyButton,
  FinalizeButton,
  RevertButton1,
  SetPriceButton,
  BackButton,
} from "../../components/common/Buttons";
import TransactionDetails from "../../components/common/TransactionDetails";
import PageLayout from "../../components/common/PageLayout";

function PTransactionInfo() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const details = state?.transaction;

  if (!details) {
    return (
      <PageLayout
        title="Transaction"
        footer={
          <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 1 }}>
            <BackButton label="Back" onClick={() => navigate(-1)} />
          </Box>
        }
      >
        <p>No transaction data found.</p>
      </PageLayout>
    );
  }

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // "verify", "finalize", "revert"

  const { procMode, procSource, itemType, statusTransaction, proc_status } =
    useMapping();

  const transactionName = details.strTitle || details.transactionName;
  const statusCode = String(details.status_code);

  const draftKey = Object.keys(proc_status)[0] || "";
  const finalizeKey = Object.keys(proc_status)[1] || "";
  const finalizeVerificationKey = Object.keys(proc_status)[2] || "";
  const priceSettingKey = Object.keys(proc_status)[3] || "";
  const priceFinalizeVerificationKey = Object.keys(proc_status)[5] || "";

  const procSourceLabel = procSource?.[details.cProcSource] || details.cProcSource;

  const isDraft = draftKey.includes(statusCode);
  const isPriceSetting = priceSettingKey.includes(statusCode);
  const isPriceVerification =
    finalizeVerificationKey.includes(statusCode) || priceFinalizeVerificationKey.includes(statusCode);

  const showFinalize = isDraft;
  const showRevert = !isDraft;
  const showSetPrice = isPriceSetting;
  const showVerification = isPriceVerification;

  /** --- Open modal handlers --- */
  const openActionModal = (type) => {
    setActionType(type);
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setActionType(null);
  };

  /** --- Footer buttons --- */
  const footerContent = (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <BackButton label="Back" onClick={() => navigate(-1)} />
      <Box sx={{ display: "flex", gap: 1 }}>
        {showRevert && <RevertButton1 onClick={() => openActionModal("revert")} label="Revert" />}
        {showVerification && <VerifyButton onClick={() => openActionModal("verify")} label="Verify" />}
        {showFinalize && <FinalizeButton onClick={() => openActionModal("finalize")} label="Finalize" />}
        {showSetPrice && <SetPriceButton label="Set Price" />}
      </Box>
    </Box>
  );

  return (
    <PageLayout title={`Transaction • ${details.strCode || details.transactionId}`} footer={footerContent}>
      {/* Transaction Details */}
      <TransactionDetails
        details={details}
        statusTransaction={statusTransaction}
        itemType={itemType}
        procMode={procMode}
        procSourceLabel={procSourceLabel}
      />

      {/* Transaction Action Modal */}
      {actionModalOpen && (
        <PTransactionActionModal
          open={actionModalOpen}
          onClose={closeActionModal}
          actionType={actionType}
          transaction={details}
          aostatus={proc_status}
          // Optional: pass these if needed in your modal for canvas labels
          canvasVerificationLabel={finalizeVerificationKey}
          forCanvasLabel={priceFinalizeVerificationKey}
          onVerified={() => closeActionModal()}
          onFinalized={() => closeActionModal()}
          onReverted={() => closeActionModal()}
        />
      )}
    </PageLayout>
  );
}

export default PTransactionInfo;
