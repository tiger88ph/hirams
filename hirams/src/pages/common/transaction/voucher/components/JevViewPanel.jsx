import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, IconButton, Skeleton, useTheme } from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
} from "@mui/icons-material";
import JevEntryAEModal from "../modal/JevEntryAEModal.jsx";
import JevEntriesAPI from "../../../../../api/endpoints/jev-entries.api.js";
import { fmtPHP, fmtDate } from "../../../../../utils/formatters/formatter";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  slate: {
    border: c.slate.border,
    itemHeaderBg: c.slate.itemHeaderBg,
    divider: c.slate.divider,
    hover: c.slate.hover,
    expandedBg: c.slate.expandedBg,
  },
  gray: {
    textHeading: c.gray.textHeading,
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
  blue: {
    bg: c.blue.bg,
    border: c.blue.border,
    hoverBg: c.blue.hover,
    text: c.blue.text,
  },
  skeleton: { strong: c.skeleton.strong },
  red: { text: c.red.text },
  green: { paid: c.green.paid },
});
const resolveAccountLabel = (account) => {
  if (account?.strAccountName) return account.strAccountName;
  if (account?.client) {
    return `Receivables from ${
      account.client.strClientNickName || account.client.strClientName
    }`;
  }
  if (account?.supplier) {
    return `Receivables from ${
      account.supplier.strSupplierNickName || account.supplier.strSupplierName
    }`;
  }
  return "—";
};

const buildAccountPath = (account) => {
  const path = [];
  let current = account;
  let guard = 0;
  while (current && guard < 10) {
    path.unshift(current.display_name ?? "—");
    current = current.parent ?? null;
    guard++;
  }
  return path.join(" / ");
};
export default function JevViewPanel({
  jev,
  voucherNumber,
  onClose,
  particularsGrandTotal = 0,
  jev_types,
  jev_status,
  jevPendingKey,
  isJevBalanced,
  jevBalanceLoading,
  isAssigneeType,
  assigneeLinks = [],
  supplierLinks = [],
  isFinanceOfficer,
  isManagement,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  const jevId = jev?.nJEVId;

  const [entries, setEntries] = useState(jev?.entries ?? []);
  const [loading, setLoading] = useState(!jev?.entries);

  const [formOpen, setFormOpen] = useState(false);
  const [formSide, setFormSide] = useState("from");
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    nJournalAccountId: "",
    amount: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!jevId) return;
    setLoading(true);
    try {
      const res = await JevEntriesAPI.getByJevId(jevId);
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setEntries(list);
    } catch (err) {
      console.error("Failed to fetch JEV entries:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [jevId]);

  useEffect(() => {
    if (!jev?.entries) fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jevId]);

  const fromEntries = useMemo(
    () => entries.filter((e) => Number(e.dAmount) < 0),
    [entries],
  );
  const toEntries = useMemo(
    () => entries.filter((e) => Number(e.dAmount) >= 0),
    [entries],
  );

  const fromTotal = useMemo(
    () =>
      fromEntries.reduce((sum, e) => sum + Math.abs(Number(e.dAmount || 0)), 0),
    [fromEntries],
  );
  const toTotal = useMemo(
    () =>
      toEntries.reduce((sum, e) => sum + Math.abs(Number(e.dAmount || 0)), 0),
    [toEntries],
  );

  const fromAccountIds = useMemo(
    () => fromEntries.map((e) => Number(e.nJournalAccountId)).filter(Boolean),
    [fromEntries],
  );
  const toAccountIds = useMemo(
    () => toEntries.map((e) => Number(e.nJournalAccountId)).filter(Boolean),
    [toEntries],
  );

  const usedAccountIds = useMemo(() => {
    const ids = formSide === "from" ? fromAccountIds : toAccountIds;
    if (editingEntry?.nJournalAccountId) {
      const editingId = Number(editingEntry.nJournalAccountId);
      return ids.filter((id) => id !== editingId);
    }
    return ids;
  }, [formSide, fromAccountIds, toAccountIds, editingEntry]);

  const oppositeSideAccountIds = useMemo(
    () => (formSide === "from" ? toAccountIds : fromAccountIds),
    [formSide, toAccountIds, fromAccountIds],
  );

  const openAdd = (side) => {
    setFormSide(side);
    setEditingEntry(null);
    setFormData({ nJournalAccountId: "", journalAccount: null, amount: "" });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (entry, side) => {
    setFormSide(side);
    setEditingEntry(entry);
    setFormData({
      nJournalAccountId: entry.nJournalAccountId ?? "",
      journalAccount: entry.journal_account,
      amount: Math.abs(Number(entry.dAmount || 0)),
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEntry(null);
  };

  const handleSaveEntry = async () => {
    const errs = {};
    const grandTotal = Number(particularsGrandTotal) || 0;
    const amount = Number(formData.amount) || 0;
    const selectedAccountId = Number(formData.nJournalAccountId);

    if (!formData.nJournalAccountId)
      errs.nJournalAccountId = "Account is required";
    if (!formData.amount || amount <= 0) errs.amount = "Amount must be > 0";

    if (selectedAccountId && usedAccountIds.includes(selectedAccountId)) {
      errs.nJournalAccountId =
        "This account already exists here — please choose a different one.";
    }

    if (
      selectedAccountId &&
      oppositeSideAccountIds.includes(selectedAccountId)
    ) {
      errs.nJournalAccountId =
        "Cannot use the same account in both From and To.";
    }

    if (grandTotal > 0) {
      const currentTotal = formSide === "from" ? fromTotal : toTotal;
      let newSideTotal;

      if (editingEntry) {
        const originalAmount = Math.abs(Number(editingEntry.dAmount || 0));
        newSideTotal = currentTotal - originalAmount + amount;
      } else {
        newSideTotal = currentTotal + amount;
      }

      if (newSideTotal > grandTotal) {
        const remaining =
          grandTotal -
          (editingEntry
            ? currentTotal - Math.abs(Number(editingEntry.dAmount || 0))
            : currentTotal);
        errs.amount = `Total cannot exceed ₱${grandTotal.toFixed(2)}. Remaining max: ₱${Math.max(0, remaining).toFixed(2)}`;
      }
    }

    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    const entity = "JEV Entry";
    const action = editingEntry ? "updated" : "added";
    const signedAmount =
      formSide === "from" ? -Math.abs(amount) : Math.abs(amount);

    closeForm();
    setSaving(true);
    try {
      await withSpinner(entity, async () => {
        editingEntry
          ? await JevEntriesAPI.update(editingEntry.nJEVEntryId, {
              nJEVId: jevId,
              nJournalAccountId: formData.nJournalAccountId,
              dAmount: signedAmount,
            })
          : await JevEntriesAPI.create({
              nJEVId: jevId,
              nJournalAccountId: formData.nJournalAccountId,
              dAmount: signedAmount,
            });
        await fetchEntries();
        notifyEntryUpdated(); // ✅ sync voucher-level balance in the same tab
      });
      await showSwal("SUCCESS", {}, { entity, action });
    } catch (err) {
      console.error("Save JEV entry failed:", err);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entry) => {
    await JevEntriesAPI.delete(entry.nJEVEntryId);
    await fetchEntries();
    notifyEntryDeleted(entry.nJEVEntryId); // ✅ sync voucher-level balance
  };
  const notifyEntryUpdated = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("jev_entry_data_updated", { detail: { jevId } }),
    );
  }, [jevId]);

  const notifyEntryDeleted = useCallback(
    (entryId) => {
      window.dispatchEvent(
        new CustomEvent("jev_entry_data_deleted", {
          detail: { jevId, jevEntryId: entryId },
        }),
      );
    },
    [jevId],
  );

  // Listen for real-time changes to this JEV's entries (e.g. from another
  // tab/user) so this panel stays in sync without a full voucher reload.
  useEffect(() => {
    if (!jevId) return;

    const handleChange = (e) => {
      const eventJevId = e.detail?.jevId;
      if (String(eventJevId) !== String(jevId)) return;
      fetchEntries();
    };

    window.addEventListener("jev_entry_data_updated", handleChange);
    window.addEventListener("jev_entry_data_deleted", handleChange);
    return () => {
      window.removeEventListener("jev_entry_data_updated", handleChange);
      window.removeEventListener("jev_entry_data_deleted", handleChange);
    };
  }, [jevId, fetchEntries]);
  const renderColumn = (label, icon, list, side, total) => (
    <Box
      sx={{
        flex: 1,
        borderRadius: "12px",
        border: `0.5px solid ${colors.slate.border}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: "20vh",
        maxHeight: "30vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 0.5,
          py: 0.5,
          bgcolor: colors.slate.itemHeaderBg,
          borderBottom: `0.5px solid ${colors.slate.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, ml: 1 }}>
          {icon}
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,

              letterSpacing: "0.06em",
              color: colors.gray.textHeading,
            }}
          >
            {label}
          </Typography>
        </Box>
        {(isManagement || isFinanceOfficer) &&
          jev?.cStatus === jevPendingKey && (
            <IconButton
              size="small"
              onClick={() => openAdd(side)}
              sx={{
                width: "auto",
                height: 24,
                px: 0.75,
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                bgcolor: colors.blue.bg,
                border: `0.5px solid ${colors.blue.border}`,
                "&:hover": { bgcolor: colors.blue.hoverBg },
              }}
            >
              <AddOutlined
                sx={{ fontSize: "0.85rem", color: colors.blue.text }}
              />
              <Typography
                sx={{
                  fontSize: "0.5rem",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: colors.gray.textHeading,
                }}
              >
                Entry
              </Typography>
            </IconButton>
          )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          [1, 2].map((i) => (
            <Box key={i} sx={{ px: 1.5, py: 1 }}>
              <Skeleton
                variant="text"
                width="70%"
                height={14}
                sx={{ bgcolor: colors.skeleton.strong }}
              />
            </Box>
          ))
        ) : list.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            <Typography
              sx={{ fontSize: "0.65rem", color: colors.gray.textMuted }}
            >
              No entries yet.
            </Typography>
          </Box>
        ) : (
          list.map((entry, idx) => (
            <Box
              key={entry.nJEVEntryId}
              sx={{
                px: 1.5,
                py: 0.875,
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderBottom:
                  idx < list.length - 1
                    ? `0.5px solid ${colors.slate.divider}`
                    : "none",
                "&:hover": { background: colors.slate.hover },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: colors.gray.textPrimary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {buildAccountPath(entry.journal_account) || "—"}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: "0.68rem",
                  color: colors.gray.textSecondary,
                  minWidth: "90px",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {fmtPHP(Math.abs(Number(entry.dAmount || 0)))}
              </Typography>

              {(isManagement || isFinanceOfficer) &&
                jev?.cStatus === jevPendingKey && (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => openEdit(entry, side)}
                      sx={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        color: colors.gray.textSecondary,
                      }}
                    >
                      <EditOutlined sx={{ fontSize: "0.75rem" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEntry(entry)}
                      sx={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        color: colors.red.text,
                      }}
                    >
                      <DeleteOutline sx={{ fontSize: "0.75rem" }} />
                    </IconButton>
                  </>
                )}
            </Box>
          ))
        )}
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          borderTop: `0.5px solid ${colors.slate.border}`,
          bgcolor: colors.slate.expandedBg,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: colors.gray.textHeading,
          }}
        >
          Total
        </Typography>
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: colors.gray.textPrimary,
          }}
        >
          {fmtPHP(total)}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {renderColumn(
          "From",
          <ArrowUpwardOutlined
            sx={{ fontSize: "0.85rem", color: colors.red.text }}
          />,
          fromEntries,
          "from",
          fromTotal,
        )}
        {renderColumn(
          "To",
          <ArrowDownwardOutlined
            sx={{ fontSize: "0.85rem", color: colors.green.paid }}
          />,
          toEntries,
          "to",
          toTotal,
        )}
      </Box>

      <JevEntryAEModal
        open={formOpen}
        onClose={closeForm}
        side={formSide}
        editingEntry={editingEntry}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        saving={saving}
        onSave={handleSaveEntry}
        particularsGrandTotal={particularsGrandTotal}
        sideTotal={formSide === "from" ? fromTotal : toTotal}
        usedAccountIds={usedAccountIds}
        oppositeSideAccountIds={oppositeSideAccountIds}
        isAssigneeType={isAssigneeType}
        assigneeLinks={assigneeLinks}
        supplierLinks={supplierLinks}
      />
    </Box>
  );
}
