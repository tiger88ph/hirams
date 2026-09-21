import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  StoreOutlined,
  BusinessOutlined,
  PersonOutlined,
  DoubleArrowOutlined,
} from "@mui/icons-material";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import FormGrid from "../../../../../components/form/FormGrid.jsx";
import AccountChainSelect from "../components/AccountChainSelect.jsx";
import POListPanel from "../../voucher/components/POListPanel.jsx";
import AssigneeListPanel from "../../voucher/components/AssigneeListPanel.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import { fmtPHP } from "../../../../../utils/formatters/formatter.js";

const useColors = (c) => ({
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
  slate: {
    innerBg: c.slate.innerBg,
    border: c.slate.border,
    btnBg: c.slate.btnBg,
  },
  amber: { bg: c.amber.bg, text: c.amber.text, border: c.amber.border },
  orange: { text: c.orange.text, bg: c.orange.bg, border: c.orange.border },
});
function SupplierCompanyBreadcrumb({
  supplierName,
  companyName,
  clientName,
  flowType = "received",
  c,
}) {
  const isDelivered = flowType === "delivered";
  const isVoucher = flowType === "voucher";

  const leftIcon = isDelivered ? (
    <BusinessOutlined
      sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
    />
  ) : (
    <StoreOutlined
      sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
    />
  );

  const leftLabel = isDelivered
    ? (companyName ?? "—")
    : isVoucher
      ? (companyName ?? "—")
      : (supplierName ?? "—");

  const rightLabel = isDelivered
    ? (clientName ?? "—")
    : isVoucher
      ? (supplierName ?? "—")
      : (companyName ?? "—");

  const rightIcon =
    isDelivered || isVoucher ? (
      <StoreOutlined
        sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
      />
    ) : (
      <BusinessOutlined
        sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
      />
    );
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.75,
        mb: 1,
        borderRadius: "8px",
        background: c.btnBgDisabled,
        border: `0.5px solid ${c.pendingBorder}`,
        borderLeft: `3px solid ${c.pendingBorder}`,
      }}
    >
      {leftIcon}
      <Typography
        noWrap
        sx={{
          flex: 1,
          fontSize: "0.58rem",
          fontWeight: 700,
          color: c.pendingText,
        }}
      >
        {leftLabel}
      </Typography>

      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <DoubleArrowOutlined
            key={i}
            sx={{
              fontSize: "0.75rem",
              color: c.pendingText,
              animation: `arrowPulse 1s ease-in-out ${i * 0.15}s infinite`,
              "@keyframes arrowPulse": {
                "0%, 100%": { opacity: 0.15 },
                "50%": { opacity: 1 },
              },
            }}
          />
        ))}
      </Box>

      <Typography
        noWrap
        sx={{
          flex: 1,
          fontSize: "0.58rem",
          fontWeight: 700,
          color: c.pendingText,
          textAlign: "right",
        }}
      >
        {rightLabel}
      </Typography>
      {rightIcon}
    </Box>
  );
}
export default function JevEntryAEModal({
  open,
  onClose,
  side,
  editingEntry,
  formData,
  setFormData,
  formErrors,
  setFormErrors,
  saving,
  onSave,
  particularsGrandTotal = 0,
  sideTotal = 0,
  oppositeSideAccountIds = [],
  usedAccountIds = [],
  isAssigneeType,
  assigneeLinks = [],
  supplierLinks = [],
  logsPanel = null,
  supplierInfo = null,
  supplierLabel = "Supplier",
  companyName = null,
  clientName = null,
  flowType = "received", // ← new
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const getMaxAmount = useCallback(() => {
    const grandTotal = Number(particularsGrandTotal) || 0;
    const currentTotal = Number(sideTotal) || 0;
    let result;
    if (editingEntry) {
      const editingAmount = Math.abs(Number(editingEntry.dAmount || 0));
      result = grandTotal - (currentTotal - editingAmount);
    } else {
      result = grandTotal - currentTotal;
    }
    // round to 2 decimal places, avoiding float drift
    return Math.round((result + Number.EPSILON) * 100) / 100;
  }, [particularsGrandTotal, sideTotal, editingEntry]);

  const maxAmount = getMaxAmount();

  const validateAccountIsUnique = useCallback(
    (accountId) => {
      if (!accountId) return "";
      const id = Number(accountId);
      const editingId = editingEntry?.nJournalAccountId
        ? Number(editingEntry.nJournalAccountId)
        : null;

      const isUsedOnThisSide = usedAccountIds.some(
        (usedId) => Number(usedId) === id && Number(usedId) !== editingId,
      );
      if (isUsedOnThisSide)
        return "This account is already used — please choose a different one.";

      const isUsedOnOppositeSide = oppositeSideAccountIds.some(
        (oppId) => Number(oppId) === id,
      );
      if (isUsedOnOppositeSide)
        return "This account already exists on the other side — cannot use same account.";

      return "";
    },
    [usedAccountIds, oppositeSideAccountIds, editingEntry],
  );

  const handleChange = useCallback(
    ({ target: { name, value } }) => {
      if (name === "amount") {
        // allow only digits and at most one decimal point with up to 2 places
        let sanitized = value.replace(/[^0-9.]/g, "");

        // prevent multiple decimal points
        const parts = sanitized.split(".");
        if (parts.length > 2) {
          sanitized = parts[0] + "." + parts.slice(1).join("");
        }

        // limit to 2 decimal places
        const [intPart, decPart] = sanitized.split(".");
        if (decPart !== undefined) {
          sanitized = `${intPart}.${decPart.slice(0, 2)}`;
        }

        setFormData((prev) => ({ ...prev, amount: sanitized }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [setFormData],
  );

  useEffect(() => {
    const accountId = formData.nJournalAccountId;
    if (!accountId) {
      setFormErrors?.((prev) => ({ ...prev, nJournalAccountId: "" }));
      return;
    }
    const errorMsg = validateAccountIsUnique(accountId);
    setFormErrors?.((prev) => ({ ...prev, nJournalAccountId: errorMsg }));
  }, [formData.nJournalAccountId, validateAccountIsUnique, setFormErrors]);

  useEffect(() => {
    if (!open) return;
    if (!editingEntry) {
      const initialValue = Math.max(0, maxAmount);
      setFormData({
        nJournalAccountId: "",
        journalAccount: null,
        amount: initialValue > 0 ? initialValue.toFixed(2) : "",
      });
    }
  }, [open, editingEntry, maxAmount, setFormData]);

  const formFields = [
    {
      name: "account_wrapper",
      type: "custom",
      label: "Account Title",
      xs: 12,
      render: () => (
        <Box sx={{ mb: 0.5 }}>
          <AccountChainSelect
            value={formData.nJournalAccountId}
            preloadedAccount={formData.journalAccount}
            onChange={(id) =>
              setFormData((prev) => ({ ...prev, nJournalAccountId: id }))
            }
            error={formErrors.nJournalAccountId}
          />
        </Box>
      ),
    },
    {
      name: "amount",
      label: (
        <Box sx={{ color: colors.gray.textPrimary }}>
          Amount{" "}
          <Box
            component="span"
            sx={{ color: colors.gray.textMuted, fontWeight: "normal", ml: 0.5 }}
          >
            (Remaining: ₱{fmtPHP(maxAmount)})
          </Box>
        </Box>
      ),
      type: "peso",
      xs: 12,
      helperText: formErrors.amount || "",
      placeholder: "0.00",
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={editingEntry ? "Edit Entry" : "Add Entry"}
      subTitle={side === "from" ? "From" : "To"}
      saveLabel={editingEntry ? "Update Entry" : "Save Entry"}
      onSave={onSave}
      cancelLabel="Back"
      onCancel={onClose}
      loading={saving}
      disableSave={!!formErrors.nJournalAccountId}
    >
      <Box sx={{ px: 0.5, py: 0.5 }}>
        {supplierInfo && (
          <SupplierCompanyBreadcrumb
            flowType={flowType}
            supplierName={
              supplierInfo.strSupplierNickName ?? supplierInfo.strSupplierName
            }
            companyName={companyName}
            clientName={clientName}
            c={{
              pendingText: colors.orange.text,
              pendingBorder: colors.orange.border,
              btnBgDisabled: colors.slate.btnBg,
            }}
          />
        )}
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: colors.gray.textMuted,
            mb: 0.5,
          }}
        >
          {logsPanel ? "Logs" : "Particulars"}
        </Typography>

        {logsPanel ? (
          <Box sx={{ mb: 1 }}>{logsPanel}</Box>
        ) : isAssigneeType ? (
          <AssigneeListPanel assigneeLinks={assigneeLinks} />
        ) : (
          <POListPanel supplierLinks={supplierLinks} isJEVPage />
        )}
        <FormGrid
          fields={formFields}
          switches={[]}
          formData={formData}
          errors={formErrors}
          handleChange={handleChange}
          autoFocus={true}
        />
      </Box>
    </ModalContainer>
  );
}
