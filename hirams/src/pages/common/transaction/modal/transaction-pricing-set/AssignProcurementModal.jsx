import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { Person, Business, Tag } from "@mui/icons-material";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../../../components/common/RemarksModalCard.jsx";
import FormGrid from "../../../../../components/common/FormGrid";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";

function AssignProcurementModal({
  open,
  transaction,
  procurementUsers = [],
  currentUserId,
  onClose,
  onSuccess,
}) {
  const [step, setStep] = useState("form");
  const [assignForm, setAssignForm] = useState({ user_id: "" });
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedUserName, setSelectedUserName] = useState("");

  /* ── Normalise opt.value → String so MUI strict === works ── */
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
  /* ── Field change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));

    if (name === "user_id") {
      const selected = normalisedOptions.find((u) => u.value === String(value));
      setSelectedUserName(selected?.label || "");
      setErrors((prev) => ({ ...prev, user_id: undefined }));
    }
  };

  /* ── Step 1: validate → advance ── */
  const handleProceed = () => {
    if (!assignForm.user_id) {
      setErrors({ user_id: "Please select a procurement officer" });
      return;
    }
    setErrors({});
    setStep("confirm");
  };

  /* ── Step 2: submit ── */
  const handleConfirm = async () => {
    const entity = `${transaction?.clientName || "—"} : ${transaction?.strTitle || "—"}`;
    onClose();
    try {
      await withSpinner(entity, async () => {
        await api.post(
          `transactions/${transaction.nTransactionId}/assign-procurement`,
          {
            user_id: Number(assignForm.user_id),
            remarks: remarks.trim() || null,
          },
        );
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

  /* ── Inline InfoRow ── */
  const InfoRow = ({ icon: Icon, label, value }) =>
    value ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Icon sx={{ fontSize: 13, color: "text.disabled" }} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}:
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "text.primary" }}
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
      subTitle={
        transaction?.strCode?.trim() ? `/ ${transaction.strCode.trim()}` : ""
      }
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
              borderColor: "divider",
              bgcolor: "background.default",
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
          <Divider sx={{ mb: 2 }} />
          <FormGrid
            fields={fields}
            formData={assignForm}
            errors={errors}
            handleChange={handleChange}
          />
        </Box>
      )}

      {step === "confirm" && (
        <RemarksModalCard
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
