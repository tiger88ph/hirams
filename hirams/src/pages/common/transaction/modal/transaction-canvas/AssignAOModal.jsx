import React, { useEffect, useState } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import AssignModalCard from "../../../../../components/common/AssignModalCard.jsx";
import RemarksModalCard from "../../../../../components/common/RemarksModalCard.jsx";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { getPhilippinesTime } from "../../../../../utils/helpers/timeZone.js";
import { getDueDateColor } from "../../../../../utils/helpers/dueDateColor"; // ← add this

function AssignAOModal({
  open,
  mode,
  transaction,
  accountOfficers,
  onClose,
  onSuccess,
}) {
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
    // Pre-fill 3 days before submission (or now if that's already past)
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
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/assign`, {
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

  // ── Due date color (mirrors Transaction.jsx table cell behavior) ──────────
  const dueDateColor = getDueDateColor(assignForm.dtAODueDate); // ← derive color

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
        transaction?.strCode?.trim() ? `/ ${transaction.strCode.trim()}` : ""
      }
      onSave={handleConfirm}
      saveLabel={mode === "reassign" ? "Reassign" : "Assign"}
      width={750}
    >
      {step === "form" && (
        <AssignModalCard
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
            },
            {
              name: "dtAODueDate",
              label: "AO Due Date",
              type: "datetime-local",
              xs: 12,
              max: getMaxDueDate(),
              inputProps: {
                // ← apply color to input text
                style: {
                  color: dueDateColor ?? "inherit",
                  fontWeight: dueDateColor ? 600 : 400,
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
        <RemarksModalCard
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
        />
      )}
    </ModalContainer>
  );
}

export default AssignAOModal;
