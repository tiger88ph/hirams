import React, { useEffect, useState } from "react";
import api from "../../../../utils/api/api.js";
import useMapping from "../../../../utils/mappings/useMapping.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../../../utils/helpers/passwordFormat.js";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import { validateFormData } from "../../../../utils/form/validation.js";
import FormGrid from "../../../../components/common/FormGrid.jsx";
import uiMessages from "../../../../utils/helpers/uiMessages.js";

function UserAEModal({
  open,
  handleClose,
  user = null,
  activeKey,
  onUserSaved,
}) {
  const { userTypes, sex } = useMapping();
  const isEditMode = Boolean(user);
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
  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        setFormData({
          firstName: user.firstName || "",
          middleName: user.middleName || "",
          lastName: user.lastName || "",
          nickname: user.nickname || "",
          type: user.type || "",
          sex: user.sex || "",
          email: user.email || "",
          username: user.username || "",
          password: "",
          cpassword: "",
        });
      } else {
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
      }
      setErrors({});
    }
  }, [user, open, isEditMode]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Live password validation
    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
        cpassword: formData.cpassword
          ? validateConfirmPassword(value, formData.cpassword)
          : prev.cpassword,
      }));
      if (!value) setFormData((prev) => ({ ...prev, cpassword: "" }));
    } else if (name === "cpassword") {
      setErrors((prev) => ({
        ...prev,
        cpassword: validateConfirmPassword(formData.password, value),
      }));
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const validationType = isEditMode ? "USER_EDIT" : "USER";
    const newErrors = validateFormData(formData, validationType);

    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
      const cpasswordError = validateConfirmPassword(
        formData.password,
        formData.cpassword,
      );
      if (cpasswordError) newErrors.cpassword = cpasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity =
      `${formData.firstName} ${formData.lastName}`.trim() || "User";
    const action = isEditMode ? "updated" : "added";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        const newErrors = { ...errors };

        // Duplicate check for username
        if (formData.username) {
          const shouldCheckUsername = isEditMode
            ? formData.username !== user.username
            : true;

          if (shouldCheckUsername) {
            const res = await api.post("users/check-exist", {
              strUserName: formData.username,
            });
            if (res.exists) {
              newErrors.username = `${uiMessages.common.usernameExists}`;
              setErrors(newErrors);
              throw new Error(`${uiMessages.common.usernameExists}`);
            }
          }
        }

        // Duplicate check for email
        if (formData.email) {
          const shouldCheckEmail = isEditMode
            ? formData.email !== user.email
            : true;

          if (shouldCheckEmail) {
            const res = await api.post("users/check-exist", {
              strEmail: formData.email,
            });
            if (res.exists) {
              newErrors.email = `${uiMessages.common.emailExists}`;
              setErrors(newErrors);
              throw new Error(`${uiMessages.common.emailExists}`);
            }
          }
        }

        const payload = {
          strFName: formData.firstName,
          strMName: formData.middleName || "",
          strLName: formData.lastName,
          strNickName: formData.nickname || "",
          cUserType: Object.keys(userTypes).find(
            (key) => userTypes[key] === formData.type,
          ),
          cStatus: activeKey,
          cSex: Object.keys(sex).find((key) => sex[key] === formData.sex),
          strEmail: formData.email || "",
          strUserName: formData.username || "",
          ...(formData.password && { strPassword: formData.password }),
          ...(!isEditMode && { cStatus: activeKey }),
        };

        if (isEditMode) {
          await api.put(`users/${user.id}`, payload);
        } else {
          await api.post("users", payload);
        }
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onUserSaved?.();
    } catch (error) {
      console.error(`❌ Error ${action} user:`, error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isEditMode ? "Edit User" : "Add User"}
      subTitle={formData.nickname ? `/ ${formData.nickname}` : ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
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
          { type: "label", label: "Account Credentials", xs: 12 },
          { label: "Username", name: "username", type: "username", xs: 5 },
          { label: "Email", name: "email", type: "email", xs: 7 },
          ...(isEditMode
            ? [
                {
                  type: "label",
                  label: "Change Password (Leave empty if no changes)",
                  xs: 12,
                },
              ]
            : []),
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

export default UserAEModal;
