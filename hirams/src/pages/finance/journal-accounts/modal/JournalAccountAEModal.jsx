import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../layouts/modal/ModalContainer.jsx";
import { Box } from "@mui/material";
import JournalAccountAPI from "../../../../api/endpoints/journal-account.api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import FormGrid from "../../../../components/form/FormGrid.jsx";

function JournalAccountAEModal({ open, onClose, initialData = null, onSaved }) {
  const isEditMode = Boolean(initialData?.id);
  const isAddChildMode = !isEditMode && Boolean(initialData?.nParentAccountId);
  const [formData, setFormData] = useState({
    accountName: "",
    nParentAccountId: "",
    cAccountType: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [parentAccounts, setParentAccounts] = useState([]);
  const [parentAccountsLoading, setParentAccountsLoading] = useState(false);
  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setFormData({
          accountName:
            initialData.strAccountName || initialData.accountName || "",
          nParentAccountId: initialData.nParentAccountId ?? "",
          cAccountType: initialData.cAccountType ?? "",
        });
      } else if (isAddChildMode) {
        setFormData({
          accountName: "",
          nParentAccountId: initialData.nParentAccountId,
          cAccountType: "",
        });
      } else {
        setFormData({
          accountName: "",
          nParentAccountId: "",
          cAccountType: "",
        });
      }
      setErrors({});
    }
  }, [initialData, open, isEditMode, isAddChildMode]);
  useEffect(() => {
    if (!open || isAddChildMode) return;
    setParentAccountsLoading(true);
    const fetcher = isEditMode
      ? JournalAccountAPI.getExcludingDescendantsOf(initialData.id)
      : JournalAccountAPI.getAll();

    fetcher
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setParentAccounts(list);
      })
      .catch((err) => {
        console.error("Failed to fetch parent accounts:", err);
        setParentAccounts([]);
      })
      .finally(() => setParentAccountsLoading(false));
  }, [open, isEditMode, isAddChildMode, initialData]);
  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = "Name is required.";
    } else if (formData.accountName.length > 50) {
      newErrors.accountName = "Name must not exceed 50 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.accountName.trim();
    const action = isEditMode ? "updated" : "added";

    try {
      setLoading(true);
      onClose();

      await withSpinner(entity, async () => {
        const payload = {
          strAccountName: formData.accountName.trim(),
          nParentAccountId: formData.nParentAccountId || null,
          cAccountType: formData.nParentAccountId
            ? null
            : formData.cAccountType || null,
        };
        if (isEditMode) {
          await JournalAccountAPI.update(initialData.id, payload);
        } else {
          await JournalAccountAPI.create(payload);
        }
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onSaved?.();
    } catch (err) {
      console.error(`❌ Error ${action} journal account:`, err);
      const serverMessage = err?.response?.data?.message ?? err?.data?.message;
      await showSwal("ERROR", {}, { entity, message: serverMessage });
    } finally {
      setLoading(false);
    }
  };
  const isTopLevel = isAddChildMode ? false : !formData.nParentAccountId;

  const fields = [
    {
      name: "accountName",
      label: "Account Name",
      type: "text",
      xs: 12,
      placeholder: "Enter journal account name",
    },
    ...(isAddChildMode
      ? []
      : [
          {
            name: "nParentAccountId",
            label: "Parent Account",
            type: "select",
            xs: 12,
            placeholder: parentAccountsLoading
              ? "Loading…"
              : "None — this will be a parent account",
            disabled: parentAccountsLoading,
            options: [
              { value: "", label: "None — this will be a parent account" },
              ...parentAccounts.map((a) => ({
                value: a.nJournalAccountId,
                label: a.display_name,
              })),
            ],
          },
        ]),
    ...(isTopLevel
      ? [
          {
            name: "cAccountType",
            label: "Account Type",
            type: "select",
            xs: 12,
            placeholder: "Default — no import type",
            options: [
              { value: "", label: "Default — no import type" },
              { value: "C", label: "Client (allows client flash import)" },
              { value: "P", label: "Supplier (allows supplier flash import)" },
            ],
          },
        ]
      : []),
  ];
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={isEditMode ? "Edit Journal Account" : "Add Journal Account"}
      subTitle={
        formData.accountName?.trim() ? `${formData.accountName.trim()}` : ""
      }
      onSave={handleSave}
      saveLabel={isEditMode ? "Save Changes" : "Add"}
      loading={loading}
    >
      <Box sx={{ mt: 1 }}>
        <FormGrid
          fields={fields}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          onLastFieldTab={handleSave}
          autoFocus={true}
        />
      </Box>
    </ModalContainer>
  );
}

export default JournalAccountAEModal;
