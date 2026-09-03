import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "@mui/material";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import TransacRemarksModalContent from "../../../../../components/content/TransacRemarksModalContent.jsx";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";
import { getItem } from "../../../../../utils/storage/localStorage.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// ── Theme Token Map — only tokens THIS component actually uses ─────────────
const useColors = (c) => ({
  slateBorder: c.slate.border,
  slateBg: c.slate.innerBg,
  grayTextPrimary: c.gray.textPrimary,
  grayTextSecondary: c.gray.textSecondary,
  grayInputBg: c.gray.inputBg,
  redBg: c.red.bg,
  redBorder: c.red.border,
  redBorderStrong: c.red.borderStrong,
  redText: c.red.text,
  redHover: c.red.hover,
  redActive: c.red.active,
  greenBg: c.green.bg,
  greenBorder: c.green.border,
  greenText: c.green.text,
  greenHover: c.green.hover,
  greenActive: c.green.active,
  amberBg: c.amber.bg,
  amberBorder: c.amber.border,
  amberText: c.amber.text,
  blueBg: c.blue.bg,
  blueBorder: c.blue.border,
  blueText: c.blue.text,
});

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
  for_collection: "Move to For Collection",
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
  for_collection: "Move to Collection",
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
  onForCollection,
  forCollectionKey,
  aostatus,
  canvasVerificationLabel,
  forCanvasLabel,
  transacstatus,
  finalizeKeyLabel,
  isPricing,
  priceFinalizeVerificationLabel,
  priceSettingLabel,
}) {
  // ── THEME: always first — hooks before any early return ──────────────────
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  // ── ALL component hooks ──────────────────────────────────────────────────
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
    const userId = getItem("user", {})?.nUserId;
    if (!userId) throw new Error("User ID missing.");

    /* ── FOR COLLECTION (role-agnostic, fixed target status) ────────────── */
    if (action === "for_collection") {
      if (!forCollectionKey) throw new Error(uiMessages.common.errorAction);
      return {
        apiFn: TransactionAPI.forCollection,
        payload: {
          userId,
          remarks: remarks.trim() || null,
          next_status: forCollectionKey,
        },
        targetStatus: forCollectionKey,
      };
    }

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

      const apiFn =
        action === "verified"
          ? details.status === canvasVerificationLabel
            ? TransactionAPI.verifyAoCanvas
            : TransactionAPI.verifyAo
          : action === "finalized"
            ? details.status === forCanvasLabel ||
              details.status === canvasVerificationLabel
              ? TransactionAPI.finalizeAoCanvas
              : TransactionAPI.finalizeAo
            : TransactionAPI.revertTransaction;

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

      return { apiFn, payload, targetStatus };
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
              : selectedRevertTo || defaultRevertTo;

      if (!targetStatus) {
        throw new Error(
          action === "reverted"
            ? uiMessages.common.errorRevert
            : uiMessages.common.errorAction,
        );
      }

      const apiFn =
        action === "verified"
          ? isPricing
            ? TransactionAPI.verifyPricing
            : details.status === finalizeKeyLabel
              ? TransactionAPI.verify
              : details.status === canvasVerificationLabel
                ? TransactionAPI.verifyAoCanvas
                : TransactionAPI.verifyAo
          : action === "finalized"
            ? TransactionAPI.forceFinalize
            : action === "approved"
              ? TransactionAPI.approvePricing
              : TransactionAPI.revertTransaction;

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

      return { apiFn, payload, targetStatus };
    }

    /* ── ROLE P ──────────────────────────────────────────────────────────── */
    if (isRoleP) {
      const currentStatusCode = String(details.status_code);
      let apiFn = null;
      let payload = {};
      let nextStatusCode = null;

      if (action === "verified") {
        apiFn =
          details.status === priceFinalizeVerificationLabel
            ? TransactionAPI.verifyPricing
            : TransactionAPI.verify;
        payload = { userId, remarks: remarks.trim() || null };
      } else if (action === "finalized") {
        apiFn =
          details.status === priceSettingLabel
            ? TransactionAPI.finalizePricing
            : TransactionAPI.finalize;
        nextStatusCode = getPStatusByOffset(currentStatusCode, aostatus, 1);
        payload = {
          userId,
          remarks: remarks.trim() || null,
          next_status: nextStatusCode,
        };
      } else if (action === "reverted") {
        apiFn = TransactionAPI.revertTransaction;
        nextStatusCode = getPStatusByOffset(currentStatusCode, aostatus, -1);
        if (!nextStatusCode) throw new Error(uiMessages.common.errorRevert);
        payload = {
          user_id: userId,
          remarks: remarks.trim() || null,
          revert_to_status: nextStatusCode,
        };
      }

      return { apiFn, payload, targetStatus: nextStatusCode };
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
      const { apiFn, payload } = request;
      const response = await withSpinner(entity, () =>
        apiFn(details.nTransactionId, payload),
      );
      await showSwal("SUCCESS", {}, { entity, action });

      setRemarks("");
      setRemarksError("");

      if (action === "verified") onVerified?.();
      if (action === "reverted") onReverted?.();
      if (action === "finalized") onFinalized?.();
      if (action === "approved") onApproved?.();
      if (action === "for_collection") onForCollection?.();
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
      subTitle={details?.strCode?.trim() ? `${details.strCode.trim()}` : ""}
      onSave={confirmAction}
      saveLabel={SAVE_LABEL_MAP[actionType] ?? "Save"}
      customLoading={loading}
      loading={loading}
      showSave
      showCancel
      cancelLabel="Cancel"
      onCancel={onClose}
    >
      <TransacRemarksModalContent
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
