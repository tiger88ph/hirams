import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import useMapping from "../../utils/mappings/useMapping";
import PTransactionActionModal from "../../components/ui/modals/procurement/TransactionActionModal";
import BaseButton from "../../components/common/BaseButton";
import TransactionDetails from "../../components/common/TransactionDetails";
import PageLayout from "../../components/common/PageLayout";
import api from "../../utils/api/api";

// MUI Icons
import {
  ArrowBack,
  VerifiedUser,
  DoneAll,
  Undo,
  PriceCheck,
} from "@mui/icons-material";

function PTransactionInfo() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const detailsFromState = state?.transaction;

  /** --- State --- */
  const [details, setDetails] = useState(detailsFromState || null);
  const [txnLoading, setTxnLoading] = useState(!detailsFromState);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  /** --- Mappings --- */
  const {
    procMode,
    procSource,
    itemType,
    statusTransaction,
    proc_status,
    loading: mappingLoading,
  } = useMapping();

  const draftKey = Object.keys(proc_status)[0] || "";
  const finalizeKey = Object.keys(proc_status)[1] || "";
  const finalizeVerificationKey = Object.keys(proc_status)[2] || "";
  const priceSettingKey = Object.keys(proc_status)[3] || "";
  const priceFinalizeVerificationKey = Object.keys(proc_status)[5] || "";

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!detailsFromState) {
        setTxnLoading(true);
        try {
          const response = await api.get(
            `transaction/procurement/${state?.transactionId}`,
          );
          setDetails(response.transaction || null);
        } catch (err) {
          console.error(err);
        } finally {
          setTxnLoading(false);
        }
      }
    };

    fetchTransaction();
  }, [detailsFromState, state?.transactionId]);
  const itemsLoading =
    txnLoading || mappingLoading || !Object.keys(proc_status || {}).length;

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
      title={`Transaction`}
      subtitle={`/ ${details?.strCode || details?.transactionId || ""}`}  
      loading={itemsLoading}
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          {/* Back */}
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => navigate(-1)}
            disabled={itemsLoading}
          />

          {/* Right side actions */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Revert: show only if NOT draft AND NOT price setting */}
            {details &&
              !draftKey.includes(String(details.status_code)) &&
              !priceSettingKey.includes(String(details.status_code)) && (
                <BaseButton
                  label="Revert"
                  icon={<Undo />}
                  onClick={() => openActionModal("revert")}
                  disabled={itemsLoading}
                />
              )}

            {/* Verify: show if in finalizeVerificationKey OR priceFinalizeVerificationKey */}
            {details &&
              (finalizeVerificationKey.includes(String(details.status_code)) ||
                priceFinalizeVerificationKey.includes(
                  String(details.status_code),
                )) && (
                <BaseButton
                  label="Verify"
                  icon={<VerifiedUser />}
                  onClick={() => openActionModal("verify")}
                  disabled={itemsLoading}
                  color="success"
                />
              )}

            {/* Finalize: show only if draft */}
            {details && draftKey.includes(String(details.status_code)) && (
              <BaseButton
                label="Finalize"
                icon={<DoneAll />}
                onClick={() => openActionModal("finalize")}
                disabled={itemsLoading}
                color="primary"
              />
            )}

            {/* Set Price: show only if in priceSettingKey */}
            {details &&
              priceSettingKey.includes(String(details.status_code)) && (
                <BaseButton
                  label="Set Price"
                  icon={<PriceCheck />}
                  disabled={itemsLoading}
                  color="secondary"
                />
              )}
          </Box>
        </Box>
      }
    >
      {!details ? (
        <p>
          {itemsLoading
            ? "Loading transaction..."
            : "No transaction data found."}
        </p>
      ) : (
        <>
          <TransactionDetails
            details={details}
            statusTransaction={statusTransaction}
            itemType={itemType}
            procMode={procMode}
            procSourceLabel={
              procSource?.[details.cProcSource] || details.cProcSource
            }
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
