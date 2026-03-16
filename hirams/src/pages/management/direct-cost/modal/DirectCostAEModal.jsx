import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import { Box } from "@mui/material";
import api from "../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import FormGrid from "../../../../components/common/FormGrid.jsx";

function DirectCostAEModal({ open, onClose, initialData = null, onSaved }) {
  const isEditMode = Boolean(initialData);
  const [formData, setFormData] = useState({ costName: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setFormData({
          costName: initialData.strName || initialData.costName || "",
        });
      } else {
        setFormData({ costName: "" });
      }
      setErrors({});
    }
  }, [initialData, open, isEditMode]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.costName.trim()) {
      newErrors.costName = "Name is required.";
    } else if (formData.costName.length > 20) {
      newErrors.costName = "Name must not exceed 20 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.costName.trim();
    const action = isEditMode ? "updated" : "added";

    try {
      setLoading(true);
      onClose();

      await withSpinner(entity, async () => {
        if (isEditMode) {
          await api.put(`direct-cost-options/${initialData.id}`, {
            strName: formData.costName.trim(),
          });
        } else {
          await api.post("direct-cost-options", {
            strName: formData.costName.trim(),
          });
        }
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onSaved?.();
    } catch (err) {
      console.error(`❌ Error ${action} direct cost:`, err);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "costName",
      label: "Cost Name",
      type: "text",
      xs: 12,
      placeholder: "Enter direct cost name",
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={isEditMode ? "Edit Direct Cost" : "Add Direct Cost"}
      subTitle={
        formData.costName?.trim() ? `/ ${formData.costName.trim()}` : ""
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

export default DirectCostAEModal;
