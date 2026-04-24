import React, { useState, useMemo, useEffect } from "react";
import ModalContainer from "../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../components/common/RemarksModalCard.jsx";
import api from "../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";
import uiMessages from "../../../utils/helpers/uiMessages.js";

const TITLE_MAP = {
  verify: "Verification Remarks",
  verified: "Verify Transaction",
  revert: "Revert Remarks",
  reverted: "Revert Transaction",
  finalize: "Finalization Remarks",
  finalized: "Finalize Transaction",
  force_finalized: "Force Finalize Transaction",
  approve: "Approval Remarks",
  approved: "Approve Transaction",
};

const SAVE_LABEL_MAP = {
  verify: "Confirm",
  verified: "Verify",
  revert: "Confirm",
  reverted: "Revert",
  finalize: "Confirm",
  finalized: "Finalize",
  force_finalized: "Force Finalize",
  approve: "Confirm",
  approved: "Approve",
};

const getStatusByOffset = (currentStatus, statusMap, offset) => {
  const keys = Object.keys(statusMap);
  const index = keys.indexOf(String(currentStatus));
  if (index === -1) return null;
  const target = index + offset;
  if (target < 0 || target >= keys.length) return null;
  return keys[target];
};

const getPStatusByOffset = (currentStatus, statusMap, offset) => {
  if (!statusMap) return null;
  const entries = Object.entries(statusMap)
    .map(([key, value]) => ({ key: Number(key), value }))
    .sort((a, b) => a.key - b.key);
  const index = entries.findIndex((e) => e.key === Number(currentStatus));
  if (index < 0) return null;
  const target = index + offset;
  if (target < 0 || target >= entries.length) return null;
  return String(entries[target].key);
};

const normaliseAction = (actionType) =>
  ({
    verify: "verified",
    revert: "reverted",
    finalize: "finalized",
    force_finalized: "finalized",
    approve: "approved",
  })[actionType] ?? actionType;

function TransactionActionModal({
  open,
  onClose,
  actionType,
  transaction,
  role,
  onVerified,
  onReverted,
  onFinalized,
  onApproved,
  aostatus,
  canvasVerificationLabel,
  forCanvasLabel,
  transacstatus,
  finalizeKeyLabel,
  isPricing,
  priceFinalizeVerificationLabel,
  priceSettingLabel,
}) {
  // ── ALL hooks must be declared before any early return ───────────────────
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRoleM = role === "M";
  const isRevertAction = actionType === "revert" || actionType === "reverted";

  const currentStatus = transaction?.latest_history?.nStatus;

  const defaultRevertTo = useMemo(() => {
    if (!isRoleM || !isRevertAction || !transacstatus) return "";
    const keys = Object.keys(transacstatus);
    const idx = keys.indexOf(String(currentStatus));
    return idx > 0 ? keys[idx - 1] : "";
  }, [isRoleM, isRevertAction, transacstatus, currentStatus]);

  const [selectedRevertTo, setSelectedRevertTo] = useState(defaultRevertTo);

  useEffect(() => {
    if (open) setSelectedRevertTo(defaultRevertTo);
  }, [open, defaultRevertTo]);

  const revertableStatuses = useMemo(() => {
    if (!isRoleM || !isRevertAction || !transacstatus) return [];
    const keys = Object.keys(transacstatus);
    const currentIndex = keys.indexOf(String(currentStatus));
    if (currentIndex <= 0) return [];
    return keys.slice(0, currentIndex).map((key) => ({
      key,
      label: transacstatus[key],
    }));
  }, [isRoleM, isRevertAction, transacstatus, currentStatus]);

  // ── Early return AFTER all hooks ─────────────────────────────────────────
  if (!open || !transaction) return null;

  const isRoleA = role === "A";
  const isRoleP = role === "P";
  const isForceFinalize = actionType === "force_finalized";
  const details = transaction;

  const transactionName = `${details.clientName || ""} : ${details.strTitle || "Transaction"}`;
  const entity = ` ${details.strCode || "Transaction"}`;
  const action = normaliseAction(actionType);

  const buildRequest = () => {
    const userId = JSON.parse(localStorage.getItem("user"))?.nUserId;
    if (!userId) throw new Error("User ID missing.");

    /* ── ROLE A ──────────────────────────────────────────────────────────── */
    if (isRoleA) {
      const currentStatus = details.latest_history?.nStatus;

      const targetStatus =
        action === "verified"
          ? currentStatus
          : action === "finalized"
            ? getStatusByOffset(currentStatus, aostatus, 1)
            : getStatusByOffset(currentStatus, aostatus, -1);

      if (!targetStatus && action !== "verified") {
        throw new Error(
          action === "reverted"
            ? uiMessages.common.errorRevert
            : uiMessages.common.errorAction,
        );
      }

      const endpoint =
        action === "verified"
          ? details.status === canvasVerificationLabel
            ? `transactions/${details.nTransactionId}/verify-ao-canvas`
            : `transactions/${details.nTransactionId}/verify-ao`
          : action === "finalized"
            ? details.status === forCanvasLabel ||
              details.status === canvasVerificationLabel
              ? `transactions/${details.nTransactionId}/finalize-ao-canvas`
              : `transactions/${details.nTransactionId}/finalize-ao`
            : `transactions/${details.nTransactionId}/revert`;

      const payload =
        action === "reverted"
          ? {
              user_id: userId,
              remarks: remarks.trim() || null,
              revert_to_status: targetStatus,
            }
          : action === "verified"
            ? { userId, remarks: remarks.trim() || null }
            : {
                userId,
                remarks: remarks.trim() || null,
                next_status: targetStatus,
              };

      return { endpoint, payload, targetStatus };
    }

    /* ── ROLE M ──────────────────────────────────────────────────────────── */
    if (isRoleM) {
      const currentStatus = details.latest_history?.nStatus;

      const targetStatus =
        action === "verified"
          ? getStatusByOffset(currentStatus, transacstatus, 1)
          : action === "finalized"
            ? getStatusByOffset(currentStatus, transacstatus, 1)
            : action === "approved"
              ? getStatusByOffset(currentStatus, transacstatus, 1)
              : selectedRevertTo || defaultRevertTo; // ← reverted: picker value

      if (!targetStatus) {
        throw new Error(
          action === "reverted"
            ? uiMessages.common.errorRevert
            : uiMessages.common.errorAction,
        );
      }

      const endpoint =
        action === "verified"
          ? isPricing
            ? `transactions/${details.nTransactionId}/verify-pricing`
            : details.status === finalizeKeyLabel
              ? `transactions/${details.nTransactionId}/verify`
              : details.status === canvasVerificationLabel
                ? `transactions/${details.nTransactionId}/verify-ao-canvas`
                : `transactions/${details.nTransactionId}/verify-ao`
          : action === "finalized"
            ? `transactions/${details.nTransactionId}/force-finalize`
            : action === "approved"
              ? `transactions/${details.nTransactionId}/approve-pricing`
              : `transactions/${details.nTransactionId}/revert`;

      const payload =
        action === "reverted"
          ? {
              user_id: userId,
              remarks: remarks.trim() || null,
              revert_to_status: targetStatus,
            }
          : {
              userId,
              remarks: remarks.trim() || null,
              next_status: targetStatus,
            };

      return { endpoint, payload, targetStatus };
    }

    /* ── ROLE P ──────────────────────────────────────────────────────────── */
    if (isRoleP) {
      const currentStatusCode = String(details.status_code);
      let endpoint = "";
      let payload = {};
      let nextStatusCode = null;

      if (action === "verified") {
        endpoint =
          details.status === priceFinalizeVerificationLabel
            ? `transactions/${details.nTransactionId}/verify-pricing`
            : `transactions/${details.nTransactionId}/verify`;
        payload = { userId, remarks: remarks.trim() || null };
      } else if (action === "finalized") {
        endpoint =
          details.status === priceSettingLabel
            ? `transactions/${details.nTransactionId}/finalize-pricing`
            : `transactions/${details.nTransactionId}/finalize`;
        nextStatusCode = getPStatusByOffset(currentStatusCode, aostatus, 1);
        payload = {
          userId,
          remarks: remarks.trim() || null,
          next_status: nextStatusCode,
        };
      } else if (action === "reverted") {
        endpoint = `transactions/${details.nTransactionId}/revert`;
        nextStatusCode = getPStatusByOffset(currentStatusCode, aostatus, -1);
        if (!nextStatusCode) throw new Error(uiMessages.common.errorRevert);
        payload = {
          user_id: userId,
          remarks: remarks.trim() || null,
          revert_to_status: nextStatusCode,
        };
      }

      return { endpoint, payload, targetStatus: nextStatusCode };
    }

    throw new Error(`Unknown role: ${role}`);
  };

  const confirmAction = async () => {
    let request;
    try {
      request = buildRequest();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: err.message || transactionName });
      return;
    }

    setLoading(true);
    onClose();

    try {
      const { endpoint, payload, targetStatus } = request;

      const response = await withSpinner(entity, () =>
        api.put(endpoint, payload),
      );

      await showSwal("SUCCESS", {}, { entity, action });

      const newStatus = response?.new_status ?? targetStatus;

      setRemarks("");
      setRemarksError("");

      if (isRoleP && targetStatus && aostatus?.[targetStatus]) {
        sessionStorage.setItem("selectedProcStatusCode", targetStatus);
      }

      if (action === "verified") onVerified?.(newStatus);
      if (action === "reverted") onReverted?.(newStatus);
      if (action === "finalized") onFinalized?.(newStatus);
      if (action === "approved") onApproved?.(newStatus);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const isRevert = action === "reverted";

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={TITLE_MAP[actionType] ?? "Action"}
      subTitle={details?.strCode?.trim() ? `/ ${details.strCode.trim()}` : ""}
      onSave={confirmAction}
      saveLabel={SAVE_LABEL_MAP[actionType] ?? "Save"}
      customLoading={loading}
      loading={loading}
      showSave
      showCancel
      cancelLabel="Cancel"
      onCancel={onClose}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={onClose}
        onSave={confirmAction}
        actionWord={actionType}
        entityName={transactionName}
        saveButtonColor={isRevert ? "error" : "success"}
        saveButtonText="Confirm"
        {...(isRoleM && isRevertAction && revertableStatuses.length > 0
          ? {
              selectLabel: "Revert to",
              selectValue: selectedRevertTo,
              onSelectChange: setSelectedRevertTo,
              selectOptions: revertableStatuses,
              selectHelperText:
                "Select a status to revert this transaction to.",
            }
          : {})}
      />
    </ModalContainer>
  );
}

export default TransactionActionModal;
