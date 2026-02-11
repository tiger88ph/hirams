import React, { useEffect, useState } from "react";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";
import DotSpinner from "../../../../common/DotSpinner";

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

  // Populate form when modal opens or user changes
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

  // Password validators
  const validatePassword = (password) => {
    if (!password) return "";
    const missing = [];
    if (password.length < 8) missing.push("8 characters");
    if (!/[A-Z]/.test(password)) missing.push("uppercase");
    if (!/[a-z]/.test(password)) missing.push("lowercase");
    if (!/[0-9]/.test(password)) missing.push("number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
      missing.push("special character");
    return missing.length ? `Password needs: ${missing.join(", ")}` : "";
  };

  const validateConfirmPassword = (password, cpassword) => {
    if (!password) return "";
    if (!cpassword) return "Please confirm your password";
    if (password !== cpassword) return "Passwords do not match";
    return "";
  };

  // Handle input changes
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

    try {
      setLoading(true);

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
            newErrors.username = "This username already exists.";
            setErrors(newErrors);
            return;
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
            newErrors.email = "This email already exists.";
            setErrors(newErrors);
            return;
          }
        }
      }

      const entity =
        `${formData.firstName} ${formData.lastName}`.trim() || "User";
      handleClose();

      await withSpinner(entity, async () => {
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

      const action = isEditMode ? "updated" : "added";
      await showSwal("SUCCESS", {}, { entity, action });
      onUserSaved?.();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} user:`,
        error,
      );
      await showSwal(
        "ERROR",
        {},
        { entity: `${formData.firstName} ${formData.lastName}` },
      );
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
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <DotSpinner />
        </div>
      )}

      <div style={{ position: "relative", opacity: loading ? 0.5 : 1 }}>
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
            { label: "Username", name: "username", xs: 5 },
            { label: "Email", name: "email", type: "email", xs: 7 },
            // ✅ Conditional label for edit mode
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
      </div>
    </ModalContainer>
  );
}

export default UserAEModal;
