import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Divider } from "@mui/material";
import { Person, Business, Tag } from "@mui/icons-material";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import TransacRemarksModalContent from "../../../../../components/content/TransacRemarksModalContent.jsx";
import FormGrid from "../../../../../components/form/FormGrid.jsx";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  borderLight: c.slate.borderLight,
  divider: c.slate.divider,
  outerBg: c.slate.outerBg,
  text: {
    primary: c.gray.textPrimary,
    secondary: c.gray.textSecondary,
    disabled: c.gray.textDisabled,
  },
});

function AssignProcurementModal({
  open,
  transaction,
  procurementUsers = [],
  currentUserId,
  onClose,
  onSuccess,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [step, setStep] = useState("form");
  const [assignForm, setAssignForm] = useState({ user_id: "" });
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedUserName, setSelectedUserName] = useState("");

  const normalisedOptions = useMemo(
    () => procurementUsers.map((u) => ({ ...u, value: String(u.value) })),
    [procurementUsers],
  );

  const fields = useMemo(
    () => [
      {
        name: "user_id",
        label: "Procurement Officer",
        type: "select",
        xs: 12,
        options: normalisedOptions,
      },
    ],
    [normalisedOptions],
  );

  useEffect(() => {
    if (!open) return;
    const prefillId =
      (transaction?.creator_id ?? transaction?.created_by_id)
        ? String(transaction.creator_id ?? transaction.created_by_id)
        : "";
    const match = prefillId
      ? normalisedOptions.find((u) => u.value === prefillId)
      : null;
    setAssignForm({ user_id: match ? match.value : "" });
    setSelectedUserName(match?.label || "");
    setRemarks("");
    setErrors({});
    setStep("form");
  }, [
    open,
    normalisedOptions,
    transaction?.creator_id,
    transaction?.created_by_id,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));
    if (name === "user_id") {
      const selected = normalisedOptions.find((u) => u.value === String(value));
      setSelectedUserName(selected?.label || "");
      setErrors((prev) => ({ ...prev, user_id: undefined }));
    }
  };

  const handleProceed = () => {
    if (!assignForm.user_id)
      return setErrors({ user_id: "Please select a procurement officer" });
    setErrors({});
    setStep("confirm");
  };

  const handleConfirm = async () => {
    const entity = `${transaction?.clientName || "—"} : ${transaction?.strTitle || "—"}`;
    onClose();
    try {
      await withSpinner(entity, async () => {
        await TransactionAPI.assignProcurement(transaction.nTransactionId, {
          user_id: Number(assignForm.user_id),
          remarks: remarks.trim() || null,
        });
      });
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: "assigned to procurement" },
      );
      onSuccess?.();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleSave = step === "form" ? handleProceed : handleConfirm;
  const saveLabel = step === "form" ? "Proceed" : "Confirm Assign";

  const InfoRow = ({ icon: Icon, label, value }) =>
    value ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Icon sx={{ fontSize: 13, color: colors.text.disabled }} />
        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
          {label}:
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: colors.text.primary }}
        >
          {value}
        </Typography>
      </Box>
    ) : null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Assign to Procurement"
      subTitle={transaction?.strCode?.trim() || ""}
      onSave={handleSave}
      saveLabel={saveLabel}
      width={750}
    >
      {step === "form" && (
        <Box sx={{ p: 0.5 }}>
          <Box
            sx={{
              mb: 2.5,
              px: 1.5,
              py: 1.25,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: colors.border,
              bgcolor: colors.outerBg,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <InfoRow
              icon={Tag}
              label="Code"
              value={transaction?.strCode?.trim() || "—"}
            />
            <InfoRow
              icon={Business}
              label="Client"
              value={transaction?.clientName || "—"}
            />
            <InfoRow
              icon={Person}
              label="Title"
              value={transaction?.strTitle || "—"}
            />
          </Box>
          <Divider sx={{ mb: 2, color: colors.divider }} />
          <FormGrid
            fields={fields}
            formData={assignForm}
            errors={errors}
            handleChange={handleChange}
          />
        </Box>
      )}
      {step === "confirm" && (
        <TransacRemarksModalContent
          remarks={remarks}
          setRemarks={setRemarks}
          onBack={() => setStep("form")}
          onSave={handleConfirm}
          actionWord="assigning"
          entityName={transaction?.strTitle}
          selectedAOName={selectedUserName}
          saveButtonColor="success"
          saveButtonText="Confirm Assign"
        />
      )}
    </ModalContainer>
  );
}

export default AssignProcurementModal;
