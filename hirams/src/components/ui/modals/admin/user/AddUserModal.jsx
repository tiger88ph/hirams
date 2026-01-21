import React, { useState, useEffect } from "react";
import { MenuItem } from "@mui/material";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";

function AddUserModal({ open, handleClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    type: "",
    sex: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { statuses, userTypes, sex} = useMapping();
  const activeKey = Object.keys(statuses)[0] || "";
  // Reset form and errors whenever modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        nickname: "",
        type: "",
        sex: "",
      });
      setErrors({});
    }
  }, [open]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = validateFormData(formData, "USER");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity =
      `${formData.firstName} ${formData.lastName}`.trim() || "User";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        const payload = {
          strFName: formData.firstName,
          strMName: formData.middleName || "",
          strLName: formData.lastName,
          strNickName: formData.nickname,
          cUserType: Object.keys(userTypes).find(
            (key) => userTypes[key] === formData.type
          ),
          cSex: Object.keys(sex).find(
            (key) => sex[key] === formData.sex
          ),
          cStatus: activeKey
        };

        await api.post("users", payload);
      });

      await showSwal("SUCCESS", {}, { entity, action: "added" });
      onUserAdded?.();

      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        nickname: "",
        type: "",
        status: true,
      });
      setErrors({});
    } catch (error) {
      console.error("Error saving user:", error);
      await showSwal("ERROR", {}, { entity: "User" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add User"
      subTitle={`${formData.firstName || ""} ${formData.lastName || ""}`.trim()}
      onSave={handleSave}
      loading={loading}
    >
      <FormGrid
        fields={[
          { label: "First Name", name: "firstName", xs: 6 },
          { label: "Middle Name", name: "middleName", xs: 6 },
          { label: "Last Name", name: "lastName", xs: 6 },
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "User Type",
            name: "type",
            type: "select", // ✅ FIXED: use "type" not "select: true"
            xs: 6,
            options:
              Object.entries(userTypes || {}).length > 0
                ? Object.entries(userTypes).map(([key, label]) => ({
                    value: label,
                    label,
                  }))
                : [{ value: "", label: "Loading types..." }],
          },
          {
            label: "Sex",
            name: "sex",
            type: "select", // ✅ FIXED: use "type" not "select: true"
            xs: 6,
            options:
              Object.entries(sex || {}).length > 0
                ? Object.entries(sex).map(([key, label]) => ({
                    value: label,
                    label,
                  }))
                : [{ value: "", label: "Loading types..." }],
          },
        ]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleChange}
      />
    </ModalContainer>
  );
}

export default AddUserModal;
