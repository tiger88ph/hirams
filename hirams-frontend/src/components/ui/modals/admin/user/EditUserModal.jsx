import React, { useEffect, useState } from "react";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";

function EditUserModal({ open, handleClose, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    type: "",
    sex: "",
    // status: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { statuses, userTypes, sex} = useMapping();

  // Populate form when `user` changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        nickname: user.nickname || "",
        type: user.type || "",
        sex: user.sex || "",
        // status: user.status ?? true,
      });
      setErrors({});
    }
  }, [user]);

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

  const entity = `${formData.firstName} ${formData.lastName}`.trim() || "User";

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
        // cStatus: Object.keys(statuses).find(
        //   (key) => statuses[key] === (formData.status ? "Active" : "Inactive")
        // ),
      };

      await api.put(`users/${user.id}`, payload);
    });

    await showSwal("SUCCESS", {}, { entity, action: "updated" });
    onUserUpdated?.();
  } catch (error) {
    console.error("Error updating user:", error);
    await showSwal("ERROR", {}, { entity });
  } finally {
    setLoading(false);
  }
};


  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Edit User"
      subTitle={`${formData.firstName || ""} ${formData.lastName || ""}`.trim()}
      onSave={handleSave}
      saveLabel="Update"
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
            type: "select", // ✅ FIXED
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
            type: "select", // ✅ FIXED
            xs: 6,
            options:
              Object.entries(sex || {}).length > 0
                ? Object.entries(sex).map(([key, label]) => ({
                    value: label,
                    label,
                  }))
                : [{ value: "", label: "Loading sex..." }],
          },
        ]}
        // switches={[
        //   {
        //     name: "status",
        //     label: formData.status ? "Active" : "Inactive",
        //     xs: 12,
        //   },
        // ]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleChange}
      />
    </ModalContainer>
  );
}

export default EditUserModal;
