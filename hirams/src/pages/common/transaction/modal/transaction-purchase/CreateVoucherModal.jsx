import React, { useState, useEffect, useCallback } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import { ArrowBack, PersonAdd, PersonSearch } from "@mui/icons-material";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../../utils/helpers/tinFormat.js";
// ── Views ─────────────────────────────────────────────────────────────────────
const VIEW = {
  SEARCH: "SEARCH",
  ADD_ASSIGNEE: "ADD_ASSIGNEE",
  LOADING: "LOADING", // ← ADD
  VOUCHER_FORM: "VOUCHER_FORM",
};

const initialAssigneeForm = {
  strAssigneeName: "",
  strAssigneeNickName: "",
  strAddress: "",
  strTIN: "",
};

const initialVoucherForm = {
  particular: "",
  amount: "",
};

// ── Main Component ─────────────────────────────────────────────────────────────
function CreateVoucherModal({
  open,
  onClose,
  onSuccess,
  voucherActiveKey,
  voucherClosedKey,
  voucherCancelledKey,
  voucherSupplierTypeKey,
  voucherAssigneeTypeKey,
}) {
  const [view, setView] = useState(VIEW.SEARCH);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const [assigneeForm, setAssigneeForm] = useState(initialAssigneeForm);
  const [assigneeErrors, setAssigneeErrors] = useState({});
  const [assigneeSaving, setAssigneeSaving] = useState(false);

  const [voucherForm, setVoucherForm] = useState(initialVoucherForm);
  const [voucherErrors, setVoucherErrors] = useState({});

  // ── Reset on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setView(VIEW.SEARCH);
      setSearchQuery("");
      setAssignees([]);
      setSelectedAssignee(null);
      setAssigneeForm(initialAssigneeForm);
      setAssigneeErrors({});
      setVoucherForm(initialVoucherForm);
      setVoucherErrors({});
    }
  }, [open]);

  // ── Search assignees ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== VIEW.SEARCH) return;
    const q = searchQuery.trim();
    if (!q) {
      setAssignees([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(
          `assignees?search=${encodeURIComponent(q)}&cStatus=A`,
        );
        setAssignees(
          Array.isArray(res) ? res : (res.assignees ?? res.data ?? []),
        );
      } catch {
        setAssignees([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, view]);

  // ── Handlers: Search view ────────────────────────────────────────────────────
  const handleSelectAssignee = (assignee) => {
    setSelectedAssignee(assignee);
    setView(VIEW.VOUCHER_FORM);
  };

  const handleGoAddAssignee = () => {
    setAssigneeForm({
      strAssigneeName: searchQuery.trim(), // pre-fill with what they typed
      strAssigneeNickName: "",
      strAddress: "",
      strTIN: "",
    });
    setView(VIEW.ADD_ASSIGNEE);
  };

  const handleAssigneeFormChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "strTIN" ? formatTIN(value) : value; // ← add this
    setAssigneeForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const validateAssignee = () => {
    const errs = {};
    if (!assigneeForm.strAssigneeName?.trim())
      errs.strAssigneeName = "Assignee name is required";
    if (!assigneeForm.strAssigneeNickName?.trim())
      errs.strAssigneeNickName = "Nickname is required";
    setAssigneeErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSaveAssignee = async () => {
    if (!validateAssignee()) return;
    setAssigneeSaving(true);
    setView(VIEW.LOADING); // ← switch to loading view immediately
    try {
      await api.post("assignees", {
        ...assigneeForm,
        strTIN: tinToStorage(assigneeForm.strTIN) || null,
        cStatus: voucherActiveKey,
      });

      const res = await api.get(
        `assignees?search=${encodeURIComponent(assigneeForm.strAssigneeName.trim())}&cStatus=A`,
      );
      const list = Array.isArray(res) ? res : (res.assignees ?? res.data ?? []);
      const created = list.find(
        (a) =>
          a.strAssigneeName.trim().toLowerCase() ===
          assigneeForm.strAssigneeName.trim().toLowerCase(),
      );

      if (!created?.nAssigneeId) {
        await showSwal("ERROR", {}, { entity: "Assignee" });
        setView(VIEW.ADD_ASSIGNEE); // ← go back on error
        return;
      }

      setSelectedAssignee(created);
      setView(VIEW.VOUCHER_FORM);
    } catch {
      await showSwal("ERROR", {}, { entity: "Assignee" });
      setView(VIEW.ADD_ASSIGNEE); // ← go back on error
    } finally {
      setAssigneeSaving(false);
    }
  };
  // ── Handlers: Voucher Form view ──────────────────────────────────────────────
  const handleVoucherFormChange = (e) => {
    const { name, value } = e.target;
    setVoucherForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateVoucher = () => {
    const errs = {};
    if (!voucherForm.particular?.trim())
      errs.particular = "Particular is required";
    if (!voucherForm.amount || Number(voucherForm.amount) <= 0)
      errs.amount = "Amount must be greater than 0";
    setVoucherErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSaveVoucher = async () => {
    if (!validateVoucher()) return;
    const entity = "Voucher";
    try {
      onClose();
      await withSpinner(entity, async () => {
        // Step 1 — create the voucher row in tblvoucher
        const voucherRes = await api.post("vouchers", {
          cType: voucherAssigneeTypeKey, // assignee type
          nTypeId: selectedAssignee.nAssigneeId, // links to the assignee
          cStatus: voucherActiveKey,
        });

        // Step 2 — get the new voucher's ID
        const nVoucherId =
          voucherRes?.data?.nVoucherId ?? voucherRes?.nVoucherId;

        // Step 3 — insert into tblvoucher_assignee
        await api.post("voucher-assignees", {
          nVoucherId,
          nAssigneeId: selectedAssignee.nAssigneeId,
          strParticular: voucherForm.particular,
          dAmount: Number(voucherForm.amount),
        });

        await onSuccess();
      });
      await showSwal("SUCCESS", {}, { entity, action: "created" });
    } catch {
      await showSwal("ERROR", {}, { entity });
    }
  };

  const titleMap = {
    [VIEW.SEARCH]: "Create Voucher",
    [VIEW.ADD_ASSIGNEE]: "Create Voucher",
    [VIEW.LOADING]: "Create Voucher", // ← ADD
    [VIEW.VOUCHER_FORM]: "Create Voucher",
  };

  const subTitleMap = {
    [VIEW.SEARCH]: "/ Select Assignee",
    [VIEW.ADD_ASSIGNEE]: "/ New Assignee",
    [VIEW.LOADING]: "/ Saving...", // ← ADD
    [VIEW.VOUCHER_FORM]: `/ ${selectedAssignee?.strAssigneeNickName ?? selectedAssignee?.strAssigneeName ?? ""}`,
  };
  // ── Save button behavior per view ────────────────────────────────────────────
  const handleSave =
    view === VIEW.ADD_ASSIGNEE
      ? handleSaveAssignee
      : view === VIEW.VOUCHER_FORM
        ? handleSaveVoucher
        : undefined;

  // hide save + cancel while loading
  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      onSave={handleSave}
      title={titleMap[view]}
      subTitle={subTitleMap[view]}
      hideSave={view === VIEW.SEARCH || view === VIEW.LOADING} // ← ADD LOADING
      showSave={view !== VIEW.SEARCH && view !== VIEW.LOADING} // ← ADD LOADING
      cancelLabel={
        view !== VIEW.SEARCH && view !== VIEW.LOADING ? "Back" : "Cancel"
      }
      onCancel={
        view !== VIEW.SEARCH && view !== VIEW.LOADING
          ? () => setView(VIEW.SEARCH)
          : onClose
      }
    >
      {/* ══════════════════════════════════════════════════
          VIEW 1 — SEARCH
      ══════════════════════════════════════════════════ */}
      {view === VIEW.LOADING && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 6,
            gap: 2,
          }}
        >
          <CircularProgress size={32} thickness={4} sx={{ color: "#2563EB" }} />
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            Saving assignee...
          </Typography>
        </Box>
      )}
      {view === VIEW.SEARCH && (
        <Box>
          {/* Search input */}
          {assigneeSaving && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress size={20} />
            </Box>
          )}
          <FormGrid
            fields={[
              {
                name: "searchQuery",
                label: "Assignee Name or Nickname",
                xs: 12,
                placeholder: "Type to search...",
              },
            ]}
            formData={{ searchQuery }}
            handleChange={(e) => setSearchQuery(e.target.value)}
            errors={{}}
          />

          {/* Results */}
          {searchLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}

          {!searchLoading && searchQuery.trim() && (
            <Box
              sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
            >
              {/* Matched assignees */}
              {assignees.map((a) => (
                <Box
                  key={a.nAssigneeId}
                  onClick={() => handleSelectAssignee(a)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    border: "0.5px solid #E5E7EB",
                    borderRadius: 1.5,
                    cursor: "pointer",
                    "&:hover": {
                      background: "rgba(59,130,246,0.06)",
                      borderColor: "#93C5FD",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {a.strAssigneeName}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                  >
                    {a.strAssigneeNickName}{" "}
                    {a.strTIN ? `· TIN: ${a.strTIN}` : ""}
                  </Typography>
                </Box>
              ))}

              {/* No match — Add new button */}
              {assignees.length === 0 && (
                <Box
                  onClick={handleGoAddAssignee}
                  sx={{
                    px: 1.5,
                    py: 1,
                    border: "0.5px dashed #93C5FD",
                    borderRadius: 1.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#2563EB",
                    "&:hover": { background: "rgba(59,130,246,0.06)" },
                  }}
                >
                  <PersonAdd sx={{ fontSize: "1rem" }} />
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Add "{searchQuery.trim()}" as new assignee
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════
          VIEW 2 — ADD NEW ASSIGNEE
      ══════════════════════════════════════════════════ */}
      {view === VIEW.ADD_ASSIGNEE && (
        <FormGrid
          fields={[
            { name: "strAssigneeName", label: "Assignee Name", xs: 12 },
            { name: "strAssigneeNickName", label: "Nickname", xs: 6 },
            { name: "strTIN", label: "TIN", type: "tin", xs: 6 },
            {
              label: "Address",
              name: "strAddress",
              xs: 12,
              multiline: true,
              plainMultiline: true,
              minRows: 2,
              sx: { "& textarea": { resize: "vertical" } },
            },
          ]}
          formData={assigneeForm}
          handleChange={handleAssigneeFormChange}
          errors={assigneeErrors}
        />
      )}

      {/* ══════════════════════════════════════════════════
          VIEW 3 — VOUCHER FORM
      ══════════════════════════════════════════════════ */}
      {view === VIEW.VOUCHER_FORM && (
        <Box>
          {/* Selected assignee pill */}
          <Box
            sx={{
              mb: 2,
              px: 1.5,
              py: 0.75,
              background: "rgba(59,130,246,0.06)",
              border: "0.5px solid #93C5FD",
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PersonSearch sx={{ fontSize: "0.9rem", color: "#2563EB" }} />
            <Box>
              <Typography
                sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#1D4ED8" }}
              >
                {selectedAssignee?.strAssigneeName}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "#3B82F6" }}>
                {selectedAssignee?.strAssigneeNickName}
                {selectedAssignee?.strTIN
                  ? ` · TIN: ${selectedAssignee.strTIN}`
                  : ""}
              </Typography>
            </Box>
          </Box>

          <FormGrid
            fields={[
              {
                name: "particular",
                label: "Particular",
                xs: 12,
              },
              {
                name: "amount",
                label: "Amount",
                type: "peso",
                xs: 12,
                numberOnly: true,
                required: true,
              },
            ]}
            formData={voucherForm}
            handleChange={handleVoucherFormChange}
            errors={voucherErrors}
          />
        </Box>
      )}
    </ModalContainer>
  );
}

export default CreateVoucherModal;
