import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  StoreOutlined,
  BusinessOutlined,
  DoubleArrowOutlined,
} from "@mui/icons-material";
import ModalContainer from "../../../../components/layouts/modal/ModalContainer.jsx";
import FormGrid from "../../../../components/ui/form/FormGrid.jsx";
import AccountChainSelect from "../components/AccountChainSelect.jsx";
import POListPanel from "../../voucher/components/POListPanel.jsx";
import AssigneeListPanel from "../../voucher/components/AssigneeListPanel.jsx";
import getThemeColors from "../../../../utils/style/getThemeColors.js";
import { fmtPHP } from "../../../../utils/formatters/formatter.js";

// ── Helpers ────────────────────────────────────────────────────────────
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const parseAmount = (v) => Number(String(v ?? "").replace(/,/g, "")) || 0;

// A single space turns the fields red without printing any message text.
// If FormGrid trims it and the field stays gray, use "Maximum reached".
const RED_NO_TEXT = " ";

const useColors = (c) => ({
  gray: {
    textPrimary: c.gray.textPrimary,
    textMuted: c.gray.textMuted,
  },
  slate: { btnBg: c.slate.btnBg },
  orange: { text: c.orange.text, border: c.orange.border },
});

const ARROW_INDEXES = [0, 1, 2, 3, 4];

function SupplierCompanyBreadcrumb({
  supplierName,
  companyName,
  clientName,
  flowType = "received",
  c,
}) {
  const isDelivered = flowType === "delivered";
  const isVoucher = flowType === "voucher";

  const leftLabel =
    isDelivered || isVoucher ? (companyName ?? "—") : (supplierName ?? "—");
  const rightLabel = isDelivered
    ? (clientName ?? "—")
    : isVoucher
      ? (supplierName ?? "—")
      : (companyName ?? "—");

  const iconSx = { fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 };
  const LeftIcon = isDelivered ? BusinessOutlined : StoreOutlined;
  const RightIcon = isDelivered || isVoucher ? StoreOutlined : BusinessOutlined;

  const labelSx = {
    flex: 1,
    fontSize: "0.58rem",
    fontWeight: 700,
    color: c.pendingText,
  };

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
      <LeftIcon sx={iconSx} />
      <Typography noWrap sx={labelSx}>
        {leftLabel}
      </Typography>

      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {ARROW_INDEXES.map((i) => (
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

      <Typography noWrap sx={{ ...labelSx, textAlign: "right" }}>
        {rightLabel}
      </Typography>
      <RightIcon sx={iconSx} />
    </Box>
  );
}

export default function JevEntryAEModal({
  open,
  onClose,
  side,
  jevActiveKey = "A",
  editingEntry,
  formData,
  setFormData,
  formErrors,
  setFormErrors,
  saving,
  onSave,
  particularsGrandTotal = 0,
  sideTotal = 0,
  equivalentValue = 0,
  oppositeSideAccountIds = [],
  usedAccountIds = [],
  isAssigneeType,
  assigneeLinks = [],
  supplierLinks = [],
  logsPanel = null,
  supplierInfo = null,
  companyName = null,
  clientName = null,
  panelTitle,
  flowType = "received",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colors = useMemo(() => useColors(getThemeColors(isDark)), [isDark]);

  // ── Remaining amount for this side ───────────────────────────────────
  const maxAmount = useMemo(() => {
    const grandTotal = Number(particularsGrandTotal) || 0;
    const currentTotal = Number(sideTotal) || 0;
    const editingAmount = editingEntry
      ? Math.abs(Number(editingEntry.dAmount || 0))
      : 0;
    return round2(grandTotal - (currentTotal - editingAmount));
  }, [particularsGrandTotal, sideTotal, editingEntry]);

  // ── Fund cap ─────────────────────────────────────────────────────────
  // Money OUT of a fund account can't exceed its available balance.
  // To cap the "to" side as well, remove the `side === "from"` check.
  const isFundOut =
    side === "from" &&
    !!formData.nJournalAccountId &&
    !!formData.isFundAccount &&
    formData.fundBalance != null;

  // Editing an active entry on the same fund account: its own amount is
  // already deducted from the balance, so add it back.
  const fundAvailable = useMemo(() => {
    if (!isFundOut) return null;
    const activeKey = String(jevActiveKey ?? "").trim() || "A";
    const isOwnActiveOut =
      editingEntry &&
      Number(editingEntry.nJournalAccountId) ===
        Number(formData.nJournalAccountId) &&
      Number(editingEntry.dAmount) < 0 &&
      String(editingEntry?.jev?.cStatus ?? "").trim() === activeKey;
    const addBack = isOwnActiveOut ? Math.abs(Number(editingEntry.dAmount)) : 0;
    return Math.max(0, round2(Number(formData.fundBalance) + addBack));
  }, [
    isFundOut,
    editingEntry,
    formData.nJournalAccountId,
    formData.fundBalance,
    jevActiveKey,
  ]);

  // Highest amount the user may enter
  const amountCap = useMemo(() => {
    const remaining = Math.max(0, maxAmount);
    return isFundOut ? Math.min(remaining, fundAvailable) : remaining;
  }, [isFundOut, maxAmount, fundAvailable]);

  // True after the user tried to type past the limit (cleared on edit-down)
  const [capHit, setCapHit] = useState(false);
  const overLimitAttempt = isFundOut && capHit;

  const fundAmountError =
    isFundOut && fundAvailable <= 0
      ? "This fund account has no available balance."
      : "";

  // Clamp whatever the peso field sends, and flag the attempt.
  useEffect(() => {
    if (!open) return;
    const typed = parseAmount(formData.amount);
    if (typed > amountCap) {
      setCapHit(true);
      setFormData((prev) => ({
        ...prev,
        amount: amountCap > 0 ? amountCap.toFixed(2) : "",
      }));
    } else if (typed < amountCap) {
      setCapHit(false);
    }
  }, [open, formData.amount, amountCap, setFormData]);
  // ── Hard block: reject any keystroke / paste that would exceed the cap ──
  const formRef = useRef(null);
  const capRef = useRef(amountCap);
  capRef.current = amountCap;
  useEffect(() => {
    const root = formRef.current;
    if (!root) return;

    const isField = (el) => el instanceof HTMLInputElement && root.contains(el);

    // Write the DOM value in a way React and the peso field both notice
    const forceValue = (el, val) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const cleanNumber = (s) => String(s ?? "").replace(/[^0-9.]/g, "");

    // 1) Block the keystroke / paste before it lands
    const onBeforeInput = (e) => {
      const el = e.target;
      if (!isField(el) || e.inputType?.startsWith("delete")) return;

      const inserted = e.data ?? e.dataTransfer?.getData("text") ?? "";
      const v = el.value ?? "";
      const start = el.selectionStart ?? v.length;
      const end = el.selectionEnd ?? v.length;
      const next = cleanNumber(v.slice(0, start) + inserted + v.slice(end));

      const [, dec = ""] = next.split(".");
      if (
        dec.length > 2 ||
        (next !== "" && round2(Number(next)) > capRef.current)
      ) {
        e.preventDefault();
        setCapHit(true);
      }
    };

    // 2) Safety net for anything that still gets through (masks, IME, autofill)
    const onInput = (e) => {
      const el = e.target;
      if (!isField(el)) return;

      const raw = cleanNumber(el.value);
      if (raw === "") return;
      const [int, dec] = raw.split(".");

      if (dec !== undefined && dec.length > 2) {
        forceValue(el, `${int}.${dec.slice(0, 2)}`);
        return;
      }
      if (Number(raw) > capRef.current) {
        forceValue(el, capRef.current > 0 ? capRef.current.toFixed(2) : "");
        setCapHit(true);
      }
    };

    root.addEventListener("beforeinput", onBeforeInput, true);
    root.addEventListener("input", onInput, true);
    return () => {
      root.removeEventListener("beforeinput", onBeforeInput, true);
      root.removeEventListener("input", onInput, true);
    };
  }, [open]);
  // ── Account uniqueness ───────────────────────────────────────────────
  const validateAccountIsUnique = useCallback(
    (accountId) => {
      if (!accountId) return "";
      const id = Number(accountId);
      const editingId = editingEntry?.nJournalAccountId
        ? Number(editingEntry.nJournalAccountId)
        : null;

      if (
        usedAccountIds.some((u) => Number(u) === id && Number(u) !== editingId)
      )
        return "This account is already used — please choose a different one.";

      if (oppositeSideAccountIds.some((o) => Number(o) === id))
        return "This account already exists on the other side — cannot use same account.";

      return "";
    },
    [usedAccountIds, oppositeSideAccountIds, editingEntry],
  );

  useEffect(() => {
    const accountId = formData.nJournalAccountId;
    setFormErrors?.((prev) => ({
      ...prev,
      nJournalAccountId: accountId ? validateAccountIsUnique(accountId) : "",
    }));
  }, [formData.nJournalAccountId, validateAccountIsUnique, setFormErrors]);

  // ── Input handling ───────────────────────────────────────────────────
  const handleChange = useCallback(
    ({ target: { name, value } }) => {
      if (name === "amount") {
        // digits + one decimal point, max 2 decimals (cap is enforced by effect)
        let s = String(value ?? "").replace(/[^0-9.]/g, "");
        const parts = s.split(".");
        if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
        const [int, dec] = s.split(".");
        if (dec !== undefined) s = `${int}.${dec.slice(0, 2)}`;
        setFormData((prev) => ({ ...prev, amount: s }));
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [setFormData],
  );

  useEffect(() => {
    if (!open) return;
    const typed = parseAmount(formData.amount);

    if (typed > amountCap) {
      setCapHit(true);
      setFormData((prev) => ({
        ...prev,
        amount: amountCap > 0 ? amountCap.toFixed(2) : "",
      }));
    } else if (typed < amountCap) {
      setCapHit(false);
    }

    // Resync the field's displayed text if it drifted above the cap
    const input = formRef.current?.querySelector("input");
    if (input && parseAmount(input.value) > amountCap) {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set.call(input, amountCap > 0 ? amountCap.toFixed(2) : "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, [open, formData.amount, amountCap, setFormData]);

  // Account picked → store fund info. For NEW entries, silently pull a
  // prefilled amount down to the fund balance (no red flag for that).
  const handleAccountChange = useCallback(
    (id, meta) => {
      setCapHit(false);
      setFormData((prev) => {
        const next = {
          ...prev,
          nJournalAccountId: id,
          isFundAccount: meta?.isFund ?? false,
          fundBalance: meta?.balance ?? null,
        };
        if (
          side === "from" &&
          !editingEntry &&
          meta?.isFund &&
          meta.balance != null
        ) {
          const cap = Math.max(0, meta.balance);
          if (parseAmount(next.amount) > cap) {
            next.amount = cap > 0 ? cap.toFixed(2) : "";
          }
        }
        return next;
      });
    },
    [setFormData, side, editingEntry],
  );

  // ── Fields ───────────────────────────────────────────────────────────
  const accountError = formErrors.nJournalAccountId || fundAmountError;
  const fieldsError = fundAmountError || (overLimitAttempt ? RED_NO_TEXT : "");

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
            jevActiveKey={jevActiveKey}
            side={side}
            onChange={handleAccountChange}
            error={accountError || (overLimitAttempt ? RED_NO_TEXT : "")}
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
            (Remaining: ₱{fmtPHP(maxAmount)}
            {isFundOut && (
              <Box
                component="span"
                sx={{
                  color: overLimitAttempt
                    ? "error.main"
                    : colors.gray.textMuted,
                  fontWeight: overLimitAttempt ? 600 : "normal",
                }}
              >
                {` · Fund balance: ₱${fmtPHP(fundAvailable)}`}
              </Box>
            )}
            )
          </Box>
        </Box>
      ),
      type: "peso",
      xs: 12,
      placeholder: "0.00",
    },
  ];

  const errors = {
    ...formErrors,
    amount: formErrors.amount || fieldsError,
  };

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
      disableSave={
        !!formErrors.nJournalAccountId || !!fundAmountError || overLimitAttempt
      }
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
          {panelTitle ??
            (flowType === "collected"
              ? "Details"
              : logsPanel
                ? "Logs"
                : "Particulars")}
        </Typography>

        {logsPanel ? (
          <Box sx={{ mb: 1 }}>{logsPanel}</Box>
        ) : isAssigneeType ? (
          <AssigneeListPanel assigneeLinks={assigneeLinks} />
        ) : (
          <POListPanel supplierLinks={supplierLinks} isJEVPage />
        )}
        <Box ref={formRef}>
          <FormGrid
            fields={formFields}
            switches={[]}
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            autoFocus={true}
          />
        </Box>
      </Box>
    </ModalContainer>
  );
}
