import React, { useEffect, useState } from "react";
import api from "../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../components/common/FormGrid.jsx";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../utils/helpers/tinFormat.js";

function AssigneeAEModal({
  open,
  handleClose,
  assignee = null,
  activeKey,
  onAssigneeSaved,
}) {
  const isEditMode = Boolean(assignee);

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    address: "",
    tin: "",
    status: activeKey ?? "A",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ── Populate form when opened ──────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      if (isEditMode && assignee) {
        setFormData({
          name: assignee.name || "",
          nickname: assignee.nickname !== "—" ? assignee.nickname : "",
          address: assignee.address !== "—" ? assignee.address : "",
          tin: tinToDisplay(assignee.tin !== "—" ? assignee.tin : ""),
          status: assignee.statusCode || activeKey,
        });
      } else {
        setFormData({
          name: "",
          nickname: "",
          address: "",
          tin: "",
          status: activeKey ?? "A",
        });
      }
      setErrors({});
    }
  }, [assignee, open, isEditMode, activeKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "tin" ? formatTIN(value) : value;
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Assignee name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.name.trim() || "Assignee";
    const action = isEditMode ? "updated" : "added";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        // Duplicate name check (skip when name unchanged on edit)
        const shouldCheck = isEditMode ? formData.name !== assignee.name : true;
        if (shouldCheck) {
          const res = await api.post("assignees/check-exist", {
            strAssigneeName: formData.name.trim(),
          });
          if (res.exists) {
            setErrors({ name: "This assignee name already exists." });
            throw new Error("This assignee name already exists.");
          }
        }

        const payload = {
          strAssigneeName: formData.name.trim(),
          strAssigneeNickName: formData.nickname || null,
          strAddress: formData.address || null,
          strTIN: tinToStorage(formData.tin) || null,
          cStatus: formData.status,
        };

        if (isEditMode) {
          await api.put(`assignees/${assignee.id}`, payload);
        } else {
          await api.post("assignees", payload);
        }
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onAssigneeSaved?.();
    } catch (error) {
      console.error(`❌ Error ${action} assignee:`, error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isEditMode ? "Edit Assignee" : "Add Assignee"}
      subTitle={formData.nickname ? `/ ${formData.nickname}` : ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
    >
      <FormGrid
        key={open ? "open" : "closed"}
        fields={[
          { label: "Assignee Name", name: "name", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "TIN",
            name: "tin",
            type: "tin",
            xs: 6,
            placeholder: "000-000-000-00000",
          },
          {
            label: "Address",
            name: "address",
            xs: 12,
            multiline: true,
            plainMultiline: true,
            minRows: 2,
            sx: { "& textarea": { resize: "vertical" } },
          },
        ]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </ModalContainer>
  );
}

export default AssigneeAEModal;