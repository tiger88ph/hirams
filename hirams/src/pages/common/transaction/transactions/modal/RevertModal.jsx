import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "@mui/material";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import TransacRemarksModalContent from "../../../../../components/content/TransacRemarksModalContent.jsx";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import { getItem } from "../../../../../utils/storage/localStorage.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// ── Theme Mapping — only tokens THIS component actually uses ──────────────────
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
  amberBg: c.amber.bg,
  amberBorder: c.amber.border,
  amberText: c.amber.text,
  blueBg: c.blue.bg,
  blueBorder: c.blue.border,
  blueText: c.blue.text,
});

function RevertModal({
  open,
  onClose,
  transaction,
  transactionId,
  onReverted,
  statusMapping,
  transactionCode,
  saveButtonColor = "error",
  isManagement = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;
  const entity = `${transaction.strCode || transactionCode || "Transaction"}`;
  const currentStatus = transaction?.latest_history?.nStatus;

  const getPreviousStatus = (curStatus, map) => {
    if (!map) return null;
    const stringKeys = Object.keys(map);
    const stringIndex = stringKeys.indexOf(String(curStatus));
    if (stringIndex > 0) return stringKeys[stringIndex - 1];
    if (stringIndex === 0) return null;
    const entries = Object.entries(map)
      .map(([key, value]) => ({ key: Number(key), value }))
      .sort((a, b) => a.key - b.key);
    const numIndex = entries.findIndex((e) => e.key === Number(curStatus));
    if (numIndex <= 0) return null;
    return String(entries[numIndex - 1].key);
  };

  const defaultRevertTo = useMemo(
    () => getPreviousStatus(currentStatus, statusMapping) ?? "",
    [currentStatus, statusMapping],
  );

  const [selectedRevertTo, setSelectedRevertTo] = useState(defaultRevertTo);

  useEffect(() => {
    if (open) setSelectedRevertTo(defaultRevertTo);
  }, [open, defaultRevertTo]);

  const revertableStatuses = useMemo(() => {
    if (!isManagement || !statusMapping) return [];
    const keys = Object.keys(statusMapping);
    const currentIndex = keys.indexOf(String(currentStatus));
    if (currentIndex <= 0) return [];
    return keys.slice(0, currentIndex).map((key) => ({
      key,
      label: statusMapping[key],
    }));
  }, [isManagement, statusMapping, currentStatus]);

  const buildRequest = () => {
    const user = getItem("user", {});
    const userId = user?.nUserId;
    if (!userId) throw new Error("User ID missing.");
    const revertTo = isManagement
      ? selectedRevertTo || defaultRevertTo
      : getPreviousStatus(currentStatus, statusMapping);
    if (!revertTo) throw new Error(uiMessages.common.errorRevert);
    return {
      payload: {
        user_id: userId,
        remarks: remarks.trim() || null,
        revert_to_status: revertTo,
      },
      targetStatus: revertTo,
    };
  };

  const confirmRevert = async () => {
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
      const { payload, targetStatus } = request;
      const response = await withSpinner(entity, () =>
        TransactionAPI.revertTransaction(transactionId, payload),
      );
      await showSwal("SUCCESS", {}, { entity, action: "reverted" });
      setRemarks("");
      setRemarksError("");
      setSelectedRevertTo(defaultRevertTo);
      if (typeof onReverted === "function") {
        await onReverted(response?.new_status ?? targetStatus);
      }
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRemarks("");
    setRemarksError("");
    setSelectedRevertTo(defaultRevertTo);
    onClose();
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Revert Transaction"
      subTitle={transactionCode || ""}
      onSave={confirmRevert}
      saveLabel="Revert"
      customLoading={loading}
      loading={loading}
      showSave
      showCancel
      cancelLabel="Cancel"
      onCancel={handleClose}
    >
      <TransacRemarksModalContent
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={handleClose}
        onSave={confirmRevert}
        actionWord="reverting"
        entityName={transactionName}
        saveButtonColor={saveButtonColor}
        saveButtonText="Confirm Revert"
        {...(isManagement && revertableStatuses.length > 0
          ? {
              selectLabel: "Revert to",
              selectValue: selectedRevertTo,
              onSelectChange: setSelectedRevertTo,
              selectOptions: revertableStatuses,
            }
          : {})}
      />
    </ModalContainer>
  );
}

export default RevertModal;
