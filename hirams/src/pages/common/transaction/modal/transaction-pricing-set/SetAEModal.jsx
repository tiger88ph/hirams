import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import { Box } from "@mui/material";
import api from "../../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";

function SetAEModal({
  open,
  onClose,
  initialData = null,
  onSaved,
  transactionId,
}) {
  const [formData, setFormData] = useState({ name: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
      });
    } else {
      setFormData({ name: "" });
    }
    setErrors({});
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSave = async () => {
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onClose();
    try {
      setLoading(true);

      if (initialData?.id) {
        // EDIT
        await withSpinner("Saving changes", async () => {
          await api.patch(`pricing-sets/${initialData.id}`, {
            strName: formData.name.trim(),
          });
        });
        await showSwal(
          "SUCCESS",
          {},
          { entity: "Pricing Set", action: "updated" },
        );
      } else {
        // ADD - include transactionId
        if (!transactionId)
          throw new Error("Transaction ID missing for new set.");
        await withSpinner("Adding", async () => {
          await api.post("pricing-sets", {
            strName: formData.name.trim(),
            nTransactionId: transactionId, // 🔑 required
          });
        });
        await showSwal(
          "SUCCESS",
          {},
          { entity: "Pricing Set", action: "added" },
        );
      }

      onSaved?.(); // refresh parent table
      setFormData({ name: "" });
      setErrors({});
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: "Pricing Set" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      xs: 12,
      placeholder: "",
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={initialData?.id ? "Edit Pricing Set" : "Add Pricing Set"}
      subTitle={formData.name?.trim() ? `/ ${formData.name.trim()}` : ""}
      onSave={handleSave}
      saveLabel={initialData?.id ? "Save Changes" : "Add"}
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

export default SetAEModal;
