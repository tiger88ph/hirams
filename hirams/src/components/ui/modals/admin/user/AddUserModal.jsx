import React, { useState, useEffect } from "react";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";

function AddUserModal({ open, handleClose, onUserAdded }) {
  const { userTypes, sex, statuses } = useMapping();
  const activeKey = Object.keys(statuses)[0] || "A";

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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
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
      setErrors({});
    }
  }, [open]);

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
  };

  const validateForm = () => {
    const newErrors = validateFormData(formData, "USER");

    // Additional validation for confirm password
    if (formData.password && formData.password !== formData.cpassword) {
      newErrors.cpassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity =
      `${formData.firstName} ${formData.lastName}`.trim() || "User";

    try {
      setLoading(true);

      // Close modal first
      handleClose();

      // Then show spinner and execute API call
      await withSpinner(entity, async () => {
        const payload = {
          strFName: formData.firstName,
          strMName: formData.middleName || "",
          strLName: formData.lastName,
          strNickName: formData.nickname,
          cUserType: Object.keys(userTypes).find(
            (key) => userTypes[key] === formData.type,
          ),
          cSex: Object.keys(sex).find((key) => sex[key] === formData.sex),
          strEmail: formData.email || "",
          strUserName: formData.username || "",
          cStatus: activeKey,
        };

        if (formData.password && formData.password.trim() !== "") {
          payload.strPassword = formData.password;
        }

        await api.post("users", payload);
      });

      await showSwal("SUCCESS", {}, { entity, action: "added" });
      onUserAdded?.();
    } catch (error) {
      console.error("Error creating user:", error);
      await showSwal("ERROR", {}, { entity });
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
        key={open ? "open" : "closed"}
        fields={[
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
            options: Object.entries(sex).map(([key, label]) => ({
              value: label,
              label,
            })),
          },
          {
            label: "User Type",
            name: "type",
            type: "select",
            xs: 6,
            options: Object.entries(userTypes).map(([key, label]) => ({
              value: label,
              label,
            })),
          },
          { type: "label", label: "Account Credentials", xs: 6 },

          { label: "Username", name: "username", xs: 5 },
          { label: "Email", name: "email", type: "email", xs: 7 },
          { label: "Password", name: "password", type: "password", xs: 6 },
          {
            label: "Confirm Password",
            name: "cpassword",
            type: "password",
            xs: 6,
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

export default AddUserModal;
