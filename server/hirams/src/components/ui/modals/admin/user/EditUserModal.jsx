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
    email: "",
    username: "",
    password: "",
    cpassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { statuses, userTypes, sex } = useMapping();

  // Populate form when `user` changes or modal opens
  useEffect(() => {
    if (user && open) {
      setFormData({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        nickname: user.nickname || "",
        type: user.type || "",
        sex: user.sex || "",
        email: user.email || "",
        username: user.username || "",
        password: "", // Don't populate password for security
        cpassword: "",
      });
      setErrors({});
    }
  }, [user, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error for the field being changed
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    
    // Clear confirm password error when password changes
    if (name === "password" && errors.cpassword) {
      setErrors((prev) => ({ ...prev, cpassword: "" }));
    }
    
    // Clear confirm password value when password is cleared
    if (name === "password" && !value) {
      setFormData((prev) => ({ ...prev, cpassword: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = validateFormData(formData, "USER_EDIT");
    
    // Additional validation for confirm password (only if password is being changed)
    if (formData.password && formData.password !== formData.cpassword) {
      newErrors.cpassword = "Passwords do not match";
    }
    
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
          cSex: Object.keys(sex).find((key) => sex[key] === formData.sex),
          strEmail: formData.email || "",
          strUserName: formData.username || "",
        };

        // Only include password if it's not empty
        if (formData.password && formData.password.trim() !== "") {
          payload.strPassword = formData.password;
        }

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
      loading={loading}
    >
      <FormGrid
        fields={[
          // Section Label: User Information
          { type: "label", label: "User Information", xs: 12 },

          { label: "First Name", name: "firstName", xs: 4 },
          { label: "Middle Name", name: "middleName", xs: 4 },
          { label: "Last Name", name: "lastName", xs: 4 },
          { label: "Nickname", name: "nickname", xs: 3 },
          {
            label: "Sex",
            name: "sex",
            type: "select",
            xs: 3,
            options:
              Object.entries(sex || {}).length > 0
                ? Object.entries(sex).map(([key, label]) => ({
                    value: label,
                    label,
                  }))
                : [{ value: "", label: "Loading sex..." }],
          },
          {
            label: "User Type",
            name: "type",
            type: "select",
            xs: 6,
            options:
              Object.entries(userTypes || {}).length > 0
                ? Object.entries(userTypes).map(([key, label]) => ({
                    value: label,
                    label,
                  }))
                : [{ value: "", label: "Loading types..." }],
          },

          // Section Label: Account Information
          { type: "label", label: "Account Credentials", xs: 12 },

          { label: "Username", name: "username", xs: 5 },
          { label: "Email", name: "email", type: "email", xs: 7 },

          { 
            label: "Password", 
            name: "password", 
            type: "password", 
            xs: 6,
            placeholder: "Leave blank to keep current password"
          },
          { 
            label: "Confirm Password", 
            name: "cpassword", 
            type: "password", 
            xs: 6,
            placeholder: "Leave blank to keep current password",
            disabled: !formData.password || formData.password.length < 6,
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

export default EditUserModal;