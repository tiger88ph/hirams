import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalContainer from "../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../components/common/RemarksModalCard.jsx";
import api from "../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";

/**
 * Unified Transaction Action Modal
 * Handles all three roles: Account Officer (A), Management (M), Procurement (P)
 *
 * Role "A" — verify / revert / finalize  (TransactionActionModal)
 * Role "M" — verify / revert             (MTransactionActionModal)
 * Role "P" — verify / revert / finalize  (PTransactionActionModal)
 */
function TransactionActionModal({
  open,
  onClose,

  // Common
  actionType,
  transaction,
  role, // "A" | "M" | "P"

  // Role A & M callbacks
  onVerified,
  onReverted,
  onFinalized,

  // Role A specific
  aostatus,
  canvasVerificationLabel,
  forCanvasLabel,

  // Role M specific
  transacstatus,
  finalizeKeyLabel,
  isPricing,

  // Role P specific (aostatus is reused as proc_status for P)
  priceFinalizeVerificationLabel,
  priceSettingLabel,
}) {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const isRoleA = role === "A";
  const isRoleM = role === "M";
  const isRoleP = role === "P";

  // Normalise transaction shape (P uses `details`, others use `transaction`)
  const details = transaction;

  const transactionName = `${details.clientName || ""} : ${details.strTitle || "Transaction"}`;
  const entity = ` ${details.strCode || "Transaction"}`;

  /* ─── Status helpers ─── */

  // Role A & M — status map is a plain object with sequential keys
  const getStatusByOffset = (currentStatus, statusMap, offset) => {
    const keys = Object.keys(statusMap);
    const index = keys.indexOf(String(currentStatus));
    if (index === -1) return null;
    const target = index + offset;
    if (target < 0 || target >= keys.length) return null;
    return keys[target];
  };

  // Role P — status map has numeric keys, needs sorting
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

  /* ─── Build endpoint + payload per role ─── */

  const buildRequest = () => {
    const userId = isRoleP
      ? JSON.parse(localStorage.getItem("user"))?.nUserId
      : JSON.parse(localStorage.getItem("user"))?.nUserId;

    if (!userId) throw new Error("User ID missing.");

    /* ── ROLE A ── */
    if (isRoleA) {
      const statusMap = aostatus;
      const currentStatus = details.latest_history?.nStatus;

      const targetStatus =
        actionType === "verified"
          ? currentStatus
          : actionType === "finalized"
            ? getStatusByOffset(currentStatus, statusMap, 1)
            : getStatusByOffset(currentStatus, statusMap, -1); // reverted

      if (!targetStatus && actionType !== "verified") {
        throw new Error(
          actionType === "reverted"
            ? "This transaction cannot be reverted."
            : "This transaction cannot proceed further.",
        );
      }

      const endpoint =
        actionType === "verified"
          ? details.status === canvasVerificationLabel
            ? `transactions/${details.nTransactionId}/verify-ao-canvas`
            : `transactions/${details.nTransactionId}/verify-ao`
          : actionType === "finalized"
            ? details.status === forCanvasLabel ||
              details.status === canvasVerificationLabel
              ? `transactions/${details.nTransactionId}/finalize-ao-canvas`
              : `transactions/${details.nTransactionId}/finalize-ao`
            : `transactions/${details.nTransactionId}/revert`;

      const payload =
        actionType === "reverted"
          ? {
              user_id: userId,
              remarks: remarks.trim() || null,
              revert_to_status: targetStatus,
            }
          : actionType === "verified"
            ? { userId, remarks: remarks.trim() || null }
            : {
                userId,
                remarks: remarks.trim() || null,
                next_status: targetStatus,
              };

      return { endpoint, payload, targetStatus };
    }

    /* ── ROLE M ── */
    if (isRoleM) {
      const statusMap = transacstatus;
      const currentStatus = details.latest_history?.nStatus;

      const targetStatus =
        actionType === "verified"
          ? getStatusByOffset(currentStatus, statusMap, 1)
          : getStatusByOffset(currentStatus, statusMap, -1); // reverted

      if (!targetStatus) {
        throw new Error(
          actionType === "verified"
            ? "This transaction cannot be verified further."
            : "This transaction cannot be reverted.",
        );
      }

      const endpoint =
        actionType === "verified"
          ? isPricing
            ? `transactions/${details.nTransactionId}/verify-pricing`
            : details.status === finalizeKeyLabel
              ? `transactions/${details.nTransactionId}/verify`
              : details.status === canvasVerificationLabel
                ? `transactions/${details.nTransactionId}/verify-ao-canvas`
                : `transactions/${details.nTransactionId}/verify-ao`
          : `transactions/${details.nTransactionId}/revert`;

      const payload =
        actionType === "verified"
          ? {
              userId,
              remarks: remarks.trim() || null,
              next_status: targetStatus,
            }
          : {
              user_id: userId,
              remarks: remarks.trim() || null,
              revert_to_status: targetStatus,
            };

      return { endpoint, payload, targetStatus };
    }

    /* ── ROLE P ── */
    /* ── ROLE P ── */
    if (isRoleP) {
      const statusMap = aostatus;
      const currentStatusCode = String(details.status_code);

      let endpoint = "";
      let payload = {};
      let nextStatusCode = null;

      if (actionType === "verify" || actionType === "verified") {
        endpoint =
          details.status === priceFinalizeVerificationLabel
            ? `transactions/${details.nTransactionId}/verify-pricing`
            : `transactions/${details.nTransactionId}/verify`;
        payload = { userId, remarks: remarks.trim() || null };
      } else if (actionType === "finalize" || actionType === "finalized") {
        endpoint =
          details.status === priceSettingLabel
            ? `transactions/${details.nTransactionId}/finalize-pricing`
            : `transactions/${details.nTransactionId}/finalize`;
        nextStatusCode = getPStatusByOffset(currentStatusCode, statusMap, 1);
        payload = {
          userId,
          remarks: remarks.trim() || null,
          next_status: nextStatusCode,
        };
      } else if (actionType === "revert" || actionType === "reverted") {
        endpoint = `transactions/${details.nTransactionId}/revert`;
        nextStatusCode = getPStatusByOffset(currentStatusCode, statusMap, -1);
        if (!nextStatusCode)
          throw new Error("This transaction cannot be reverted.");
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

  /* ─── Confirm handler ─── */

  const confirmAction = async () => {
    try {
      onClose();
      setLoading(true);

      const { endpoint, payload, targetStatus } = buildRequest();

      const response = await withSpinner(entity, async () => {
        return await api.put(endpoint, payload);
      });

      await showSwal("SUCCESS", {}, { entity, action: actionType });

      const newStatus = response?.new_status ?? targetStatus;

      setRemarks("");
      setRemarksError("");

      // Role P — fire callbacks (handleAfterAction in canvas does the navigate)
      if (isRoleP) {
        if (targetStatus && aostatus?.[targetStatus]) {
          sessionStorage.setItem("selectedProcStatusCode", targetStatus);
        }
        if (actionType === "verified" || actionType === "verify")
          onVerified?.(newStatus);
        if (actionType === "reverted" || actionType === "revert")
          onReverted?.(newStatus);
        if (actionType === "finalized" || actionType === "finalize")
          onFinalized?.(newStatus);
        return;
      }

      // Role A & M — fire callbacks
      if (actionType === "verified" || actionType === "verify")
        onVerified?.(newStatus);
      if (actionType === "reverted" || actionType === "revert")
        onReverted?.(newStatus);
      if (actionType === "finalized" || actionType === "finalize")
        onFinalized?.(newStatus);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  /* ─── UI labels ─── */

  const titleMap = {
    verify: "Verification Remarks",
    verified: "Verify Transaction",
    revert: "Revert Remarks",
    reverted: "Revert Transaction",
    finalize: "Finalization Remarks",
    finalized: "Finalize Transaction",
  };

  const saveLabelMap = {
    verify: "Confirm Verify",
    verified: "Verify",
    revert: "Confirm Revert",
    reverted: "Revert",
    finalize: "Confirm Finalize",
    finalized: "Finalize",
  };

  const buttonTextMap = {
    verify: "Confirm",
    verified: "Confirm",
    revert: "Confirm",
    reverted: "Confirm",
    finalize: "Confirm",
    finalized: "Confirm",
  };

  const isRevert = actionType === "revert" || actionType === "reverted";

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={titleMap[actionType] || "Action"}
      subTitle={details?.strCode?.trim() ? `/ ${details.strCode.trim()}` : ""}
      onSave={confirmAction}
      saveLabel={saveLabelMap[actionType] || "Save"}
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
        saveButtonText={buttonTextMap[actionType]}
      />
    </ModalContainer>
  );
}

export default TransactionActionModal;
