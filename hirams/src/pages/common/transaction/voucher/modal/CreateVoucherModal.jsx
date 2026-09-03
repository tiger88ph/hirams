import React, { useState, useEffect, useMemo } from "react";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import FormGrid from "../../../../../components/form/FormGrid.jsx";
import CompanyAPI from "../../../../../api/endpoints/company.api.js";
import AssigneeAPI from "../../../../../api/endpoints/assignee.api.js";
import VoucherAPI from "../../../../../api/endpoints/voucher.api.js";
import VoucherAssigneeAPI from "../../../../../api/endpoints/voucher-assignee.api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { Box, Typography, CircularProgress, useTheme } from "@mui/material";
import { PersonAdd, PersonSearch } from "@mui/icons-material";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../../utils/helpers/tinFormat.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  text: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  blue: {
    bg: c.blue.bg,
    border: c.blue.border,
    text: c.blue.text,
    textStrong: c.blue.textStrong,
  },
});

const VIEW = {
  SEARCH: "SEARCH",
  ADD_ASSIGNEE: "ADD_ASSIGNEE",
  LOADING: "LOADING",
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
  quantity: 1,
  strUOM: "",
};

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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

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
  const [voucherTitle, setVoucherTitle] = useState("");
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

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
      setVoucherTitle("");
      setSelectedCompanyId("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const companiesData = await CompanyAPI.getAll();
        setCompanyOptions(
          (companiesData.companies || []).map((c) => ({
            label: c.strCompanyNickName,
            value: c.nCompanyId,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, [open]);

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
        const res = await AssigneeAPI.getAssignees(
          `search=${encodeURIComponent(q)}&cStatus=A`,
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

  const handleSelectAssignee = (assignee) => {
    setSelectedAssignee(assignee);
    setView(VIEW.VOUCHER_FORM);
  };

  const handleGoAddAssignee = () => {
    setAssigneeForm({
      strAssigneeName: searchQuery.trim(),
      strAssigneeNickName: "",
      strAddress: "",
      strTIN: "",
    });
    setView(VIEW.ADD_ASSIGNEE);
  };

  const handleAssigneeFormChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "strTIN" ? formatTIN(value) : value;
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
    setView(VIEW.LOADING);
    try {
      await AssigneeAPI.createAssignee({
        ...assigneeForm,
        strTIN: tinToStorage(assigneeForm.strTIN) || null,
        cStatus: voucherActiveKey,
      });
      const res = await AssigneeAPI.getAssignees(
        `search=${encodeURIComponent(assigneeForm.strAssigneeName.trim())}&cStatus=A`,
      );
      const list = Array.isArray(res) ? res : (res.assignees ?? res.data ?? []);
      const created = list.find(
        (a) =>
          a.strAssigneeName.trim().toLowerCase() ===
          assigneeForm.strAssigneeName.trim().toLowerCase(),
      );
      if (!created?.nAssigneeId) {
        await showSwal("ERROR", {}, { entity: "Assignee" });
        setView(VIEW.ADD_ASSIGNEE);
        return;
      }
      setSelectedAssignee(created);
      setView(VIEW.VOUCHER_FORM);
    } catch {
      await showSwal("ERROR", {}, { entity: "Assignee" });
      setView(VIEW.ADD_ASSIGNEE);
    } finally {
      setAssigneeSaving(false);
    }
  };

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
    if (!voucherForm.quantity || Number(voucherForm.quantity) <= 0)
      errs.quantity = "Quantity must be greater than 0";
    setVoucherErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveVoucher = async () => {
    if (!validateVoucher()) return;
    const entity = "Voucher";
    try {
      onClose();
      await withSpinner(entity, async () => {
        const voucherRes = await VoucherAPI.createVoucher({
          cType: voucherAssigneeTypeKey,
          nTypeId: selectedAssignee.nAssigneeId,
          cStatus: voucherActiveKey,
          strTitle: voucherTitle.trim() || null,
          nCompanyId: selectedCompanyId || null,
        });
        const nVoucherId =
          voucherRes?.data?.nVoucherId ?? voucherRes?.nVoucherId;
        await VoucherAssigneeAPI.create({
          nVoucherId,
          nAssigneeId: selectedAssignee.nAssigneeId,
          strParticular: voucherForm.particular,
          dAmount: Number(voucherForm.amount),
          nQuantity: Number(voucherForm.quantity),
          strUOM: voucherForm.strUOM || null,
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
    [VIEW.LOADING]: "Create Voucher",
    [VIEW.VOUCHER_FORM]: "Create Voucher",
  };
  const subTitleMap = {
    [VIEW.SEARCH]: "Select Assignee",
    [VIEW.ADD_ASSIGNEE]: "New Assignee",
    [VIEW.LOADING]: "Saving...",
    [VIEW.VOUCHER_FORM]: `${selectedAssignee?.strAssigneeNickName ?? selectedAssignee?.strAssigneeName ?? ""}`,
  };
  const handleSave =
    view === VIEW.ADD_ASSIGNEE
      ? handleSaveAssignee
      : view === VIEW.VOUCHER_FORM
        ? handleSaveVoucher
        : undefined;

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      onSave={handleSave}
      title={titleMap[view]}
      subTitle={subTitleMap[view]}
      hideSave={view === VIEW.SEARCH || view === VIEW.LOADING}
      showSave={view !== VIEW.SEARCH && view !== VIEW.LOADING}
      cancelLabel={
        view !== VIEW.SEARCH && view !== VIEW.LOADING ? "Back" : "Cancel"
      }
      onCancel={
        view !== VIEW.SEARCH && view !== VIEW.LOADING
          ? () => setView(VIEW.SEARCH)
          : onClose
      }
    >
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
          <CircularProgress
            size={32}
            thickness={4}
            sx={{ color: colors.blue.text }}
          />
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
          <Box sx={{ mb: 2 }}>
            <FormGrid
              fields={[
                {
                  name: "nCompanyId",
                  label: "Company",
                  type: "select",
                  options: companyOptions,
                  xs: 12,
                },
              ]}
              formData={{
                strTitle: voucherTitle,
                nCompanyId: selectedCompanyId,
              }}
              handleChange={(e) => {
                const { name, value } = e.target;
                if (name === "strTitle") setVoucherTitle(value);
                if (name === "nCompanyId") setSelectedCompanyId(value);
              }}
              errors={{}}
            />
          </Box>

          {assigneeSaving && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress size={20} sx={{ color: colors.blue.text }} />
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

          {searchLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <CircularProgress size={20} sx={{ color: colors.blue.text }} />
            </Box>
          )}

          {!searchLoading && searchQuery.trim() && (
            <Box
              sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
            >
              {assignees.map((a) => (
                <Box
                  key={a.nAssigneeId}
                  onClick={() => handleSelectAssignee(a)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    border: `0.5px solid ${colors.border}`,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    "&:hover": {
                      background: colors.blue.bg,
                      borderColor: colors.blue.border,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: colors.text,
                    }}
                  >
                    {a.strAssigneeName}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.7rem", color: colors.textSecondary }}
                  >
                    {a.strAssigneeNickName}{" "}
                    {a.strTIN ? `· TIN: ${tinToDisplay(a.strTIN)}` : ""}
                  </Typography>
                </Box>
              ))}

              {assignees.length === 0 && (
                <Box
                  onClick={handleGoAddAssignee}
                  sx={{
                    px: 1.5,
                    py: 1,
                    border: `0.5px dashed ${colors.blue.border}`,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: colors.blue.text,
                    "&:hover": { background: colors.blue.bg },
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

      {view === VIEW.VOUCHER_FORM && (
        <Box>
          <Box
            sx={{
              mb: 2,
              px: 1.5,
              py: 0.75,
              background: colors.blue.bg,
              border: `0.5px solid ${colors.blue.border}`,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PersonSearch
              sx={{ fontSize: "0.9rem", color: colors.blue.text }}
            />
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: colors.blue.textStrong,
                }}
              >
                {selectedAssignee?.strAssigneeName}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: colors.blue.text }}>
                {selectedAssignee?.strAssigneeNickName}
                {selectedAssignee?.strTIN
                  ? ` · TIN: ${tinToDisplay(selectedAssignee.strTIN)}`
                  : ""}
              </Typography>
            </Box>
          </Box>

          <FormGrid
            fields={[
              { name: "particular", label: "Particular", xs: 12 },
              {
                name: "quantity",
                label: "Quantity",
                type: "number",
                xs: 4,
                numberOnly: true,
              },
              {
                name: "strUOM",
                label: "UOM",
                placeholder: "e.g. pcs, kg, box",
                xs: 4,
              },
              {
                name: "amount",
                label: "Amount",
                type: "peso",
                xs: 4,
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
