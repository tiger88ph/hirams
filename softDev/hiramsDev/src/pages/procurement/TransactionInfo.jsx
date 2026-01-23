import React, { useState, useEffect } from "react";
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
import api from "../../utils/api/api";

function PTransactionInfo() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const detailsFromState = state?.transaction;

  /** --- State --- */
  const [details, setDetails] = useState(detailsFromState || null);
  const [itemsLoading, setItemsLoading] = useState(!detailsFromState);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  /** --- Mappings --- */
  const { procMode, procSource, itemType, statusTransaction, proc_status } =
    useMapping();

  const draftKey = Object.keys(proc_status)[0] || "";
  const finalizeKey = Object.keys(proc_status)[1] || "";
  const finalizeVerificationKey = Object.keys(proc_status)[2] || "";
  const priceSettingKey = Object.keys(proc_status)[3] || "";
  const priceFinalizeVerificationKey = Object.keys(proc_status)[5] || "";

  /** --- Fetch transaction if not passed via state --- */
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!detailsFromState) {
        setItemsLoading(true);
        try {
          const response = await api.get(
            `transaction/procurement/${state?.transactionId}`
          );
          setDetails(response.transaction || null);
        } catch (err) {
          console.error(err);
        } finally {
          setItemsLoading(false);
        }
      }
    };
    fetchTransaction();
  }, [detailsFromState, state?.transactionId]);

  /** --- Action modal handlers --- */
  const openActionModal = (type) => {
    setActionType(type);
    setActionModalOpen(true);
  };
  const closeActionModal = () => {
    setActionModalOpen(false);
    setActionType(null);
  };

  return (
    <PageLayout
      title={`Transaction • ${details?.strCode || details?.transactionId || ""}`}
      loading={itemsLoading}
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <BackButton
            label="Back"
            onClick={() => navigate(-1)}
            disabled={itemsLoading}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            {details && !draftKey.includes(String(details.status_code)) && (
              <RevertButton1
                onClick={() => openActionModal("revert")}
                label="Revert"
                disabled={itemsLoading}
              />
            )}
            {details &&
              (finalizeVerificationKey.includes(String(details.status_code)) ||
                priceFinalizeVerificationKey.includes(String(details.status_code))) && (
                <VerifyButton
                  onClick={() => openActionModal("verify")}
                  label="Verify"
                  disabled={itemsLoading}
                />
              )}
            {details && draftKey.includes(String(details.status_code)) && (
              <FinalizeButton
                onClick={() => openActionModal("finalize")}
                label="Finalize"
                disabled={itemsLoading}
              />
            )}
            {details && priceSettingKey.includes(String(details.status_code)) && (
              <SetPriceButton label="Set Price" disabled={itemsLoading} />
            )}
          </Box>
        </Box>
      }
    >
      {!details ? (
        <p>{itemsLoading ? "Loading transaction..." : "No transaction data found."}</p>
      ) : (
        <>
          <TransactionDetails
            details={details}
            statusTransaction={statusTransaction}
            itemType={itemType}
            procMode={procMode}
            procSourceLabel={procSource?.[details.cProcSource] || details.cProcSource}
          />

          {actionModalOpen && (
            <PTransactionActionModal
              open={actionModalOpen}
              onClose={closeActionModal}
              actionType={actionType}
              transaction={details}
              aostatus={proc_status}
              onVerified={closeActionModal}
              onFinalized={closeActionModal}
              onReverted={closeActionModal}
              disabled={itemsLoading}
            />
          )}
        </>
      )}
    </PageLayout>
  );
}

export default PTransactionInfo;
