import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import AssignAOModalContent from "../../../../../components/content/AssignAOModalContent.jsx";
import TransacRemarksModalContent from "../../../../../components/content/TransacRemarksModalContent.jsx";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { getPhilippinesTime } from "../../../../../utils/helpers/timeZone.js";
import { getDueDateColor } from "../../../../../utils/helpers/dueDateColor";
import { getItem } from "../../../../../utils/storage/localStorage.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// ── Inline color map (Prompt 1 style) ──────────────────────────────────────
const useColors = (c) => ({
  // slate: structural / borders / surfaces
  border: c.slate.border,
  borderLight: c.slate.borderLight,
  hoverBg: c.slate.hover,
  cardBg: c.slate.innerBg,
  // gray: text hierarchy
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  inputBg: c.gray.inputBg,
  inputFocusBg: c.gray.inputFocusBg,
  // accent — success button
  success: {
    bg: c.green.bg,
    border: c.green.border,
    text: c.green.text,
    hover: c.green.hover,
  },
});

function AssignAOModal({
  open,
  mode,
  transaction,
  accountOfficers,
  onClose,
  onSuccess,
}) {
  // ── Wire up theme colors ──────────────────────────────────────────────────
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  const [step, setStep] = useState("form");
  const [assignForm, setAssignForm] = useState({
    nAssignedAO: "",
    dtAODueDate: "",
  });
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedAOName, setSelectedAOName] = useState("");

  const formatLocalDateTime = (date) => {
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getInitialAODueDate = (docSubmissionDate) => {
    const now = getPhilippinesTime();
    if (!docSubmissionDate) return formatLocalDateTime(now);
    const submission = new Date(docSubmissionDate);
    if (now > submission) return formatLocalDateTime(submission);
    const threeDaysBefore = new Date(submission);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    return formatLocalDateTime(threeDaysBefore > now ? threeDaysBefore : now);
  };

  const getMaxDueDate = () => {
    if (!transaction?.dtDocSubmission) return undefined;
    return formatLocalDateTime(new Date(transaction.dtDocSubmission));
  };

  useEffect(() => {
    if (!open || !transaction) return;
    const initialDueDate = getInitialAODueDate(transaction.dtDocSubmission);
    if (mode === "reassign") {
      const selected = accountOfficers.find(
        (ao) => ao.value === transaction.nAssignedAO,
      );
      setSelectedAOName(selected?.label || "");
      setAssignForm({
        nAssignedAO: transaction.nAssignedAO || "",
        dtAODueDate: initialDueDate,
      });
    } else {
      setAssignForm({ nAssignedAO: "", dtAODueDate: initialDueDate });
      setSelectedAOName("");
    }
    setRemarks("");
    setErrors({});
    setStep("form");
  }, [open, mode, transaction, accountOfficers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "dtAODueDate" && transaction?.dtDocSubmission) {
      const max = new Date(transaction.dtDocSubmission);
      const selected = new Date(value);
      if (selected > max) {
        setAssignForm((prev) => ({
          ...prev,
          dtAODueDate: formatLocalDateTime(max),
        }));
        return;
      }
    }
    setAssignForm((prev) => ({ ...prev, [name]: value }));
    if (name === "nAssignedAO") {
      const selected = accountOfficers.find((ao) => ao.value === value);
      setSelectedAOName(selected?.label || "");
    }
  };

  const handleProceed = () => {
    if (!assignForm.nAssignedAO || !assignForm.dtAODueDate) {
      setErrors({
        nAssignedAO: !assignForm.nAssignedAO ? "Required" : "",
        dtAODueDate: !assignForm.dtAODueDate ? "Required" : "",
      });
      return;
    }
    setErrors({});
    setStep("confirm");
  };

  const handleConfirm = async () => {
    const entity = `${transaction.clientName || "—"} : ${
      transaction.strTitle || transaction.transactionName || "—"
    }`;
    onClose();
    try {
      await withSpinner(entity, async () => {
        const user = getItem("user", {});
        await TransactionAPI.assignTransaction(transaction.nTransactionId, {
          nAssignedAO: assignForm.nAssignedAO,
          dtAODueDate: assignForm.dtAODueDate,
          user_id: user?.nUserId,
          remarks: remarks.trim() || null,
        });
      });
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: mode === "reassign" ? "reassigned" : "assigned" },
      );
      onSuccess?.();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity });
    }
  };

  // Due date color — kept separate (business logic, not theme palette)
  const dueDateColor = getDueDateColor(assignForm.dtAODueDate);

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={
        mode === "reassign"
          ? "Reassign Account Officer"
          : "Assign Account Officer"
      }
      subTitle={
        transaction?.strCode?.trim() ? `${transaction.strCode.trim()}` : ""
      }
      onSave={handleConfirm}
      saveLabel={mode === "reassign" ? "Reassign" : "Assign"}
      width={750}
      // Apply theme colors to modal header/actions
      sx={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
      }}
      saveButtonProps={{
        sx: {
          bgcolor: colors.success.bg,
          borderColor: colors.success.border,
          color: colors.success.text,
          "&:hover": {
            bgcolor: colors.success.hover,
          },
        },
      }}
    >
      {step === "form" && (
        <AssignAOModalContent
          mode={mode === "reassign" ? "Reassign" : "Assign"}
          details={transaction}
          assignForm={assignForm}
          assignErrors={errors}
          assignAOFields={[
            {
              name: "nAssignedAO",
              label: "Account Officer",
              type: "select",
              xs: 12,
              options: accountOfficers,
              // Apply input colors
              InputProps: {
                sx: {
                  bgcolor: colors.inputBg,
                  color: colors.textPrimary,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.border,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.borderLight,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.success.border,
                    bgcolor: colors.inputFocusBg,
                  },
                },
              },
            },
            {
              name: "dtAODueDate",
              label: "AO Due Date",
              type: "datetime-local",
              xs: 12,
              max: getMaxDueDate(),
              inputProps: {
                style: {
                  color: dueDateColor ?? colors.textPrimary,
                  fontWeight: dueDateColor ? 600 : 400,
                },
              },
              // Consistent input styling
              InputProps: {
                sx: {
                  bgcolor: colors.inputBg,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.border,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.borderLight,
                  },
                },
              },
            },
          ]}
          handleAssignChange={handleChange}
          onBack={onClose}
          onSave={handleProceed}
        />
      )}

      {step === "confirm" && (
        <TransacRemarksModalContent
          remarks={remarks}
          setRemarks={setRemarks}
          onBack={() => setStep("form")}
          onSave={handleConfirm}
          actionWord={mode === "reassign" ? "reassigning" : "assigning"}
          entityName={transaction.strTitle || transaction.transactionName}
          selectedAOName={selectedAOName}
          saveButtonColor="success"
          saveButtonText={
            mode === "reassign" ? "Confirm Reassign" : "Confirm Assign"
          }
          // Pass theme colors down to content component
          colors={{
            textPrimary: colors.textPrimary,
            textSecondary: colors.textSecondary,
            inputBg: colors.inputBg,
            border: colors.border,
            successBg: colors.success.bg,
            successText: colors.success.text,
          }}
        />
      )}
    </ModalContainer>
  );
}

export default AssignAOModal;
