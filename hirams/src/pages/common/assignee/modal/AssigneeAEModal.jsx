import React, { useEffect, useState } from "react";
import AssigneeAPI from "../../../../api/endpoints/assignee.api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import ModalContainer from "../../../../layouts/modal/ModalContainer.jsx";
import FormGrid from "../../../../components/form/FormGrid.jsx";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../utils/formatters/formatter.js";

function AssigneeAEModal({
  open,
  handleClose,
  assignee = null,
  activeStatusKey,
  onAssigneeSaved,
}) {
  const isEditMode = Boolean(assignee);

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    address: "",
    tin: "",
    status: activeStatusKey ?? "A",
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
          status: assignee.statusCode || activeStatusKey,
        });
      } else {
        setFormData({
          name: "",
          nickname: "",
          address: "",
          tin: "",
          status: activeStatusKey ?? "A",
        });
      }
      setErrors({});
    }
  }, [assignee, open, isEditMode, activeStatusKey]);

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
          const res = await AssigneeAPI.checkExists({
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
          await AssigneeAPI.updateAssignee(assignee.id, payload);
        } else {
          await AssigneeAPI.createAssignee(payload);
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
      subTitle={formData.nickname ? `${formData.nickname}` : ""}
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
