import React, { useState } from "react";
import { MenuItem } from "@mui/material";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid"; // ✅ import FormGrid

function AddUserModal({ open, handleClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    type: "",
    status: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const { statuses, userTypes } = useMapping();

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity =
      `${formData.firstName} ${formData.lastName}`.trim() || "User";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Saving ${entity}...`, async () => {
        const payload = {
          strFName: formData.firstName,
          strMName: formData.middleName || "",
          strLName: formData.lastName,
          strNickName: formData.nickname,
          cUserType: Object.keys(userTypes).find(
            (key) => userTypes[key] === formData.type
          ),
          cStatus: Object.keys(statuses).find(
            (key) => statuses[key] === (formData.status ? "Active" : "Inactive")
          ),
        };

        await api.post("users", payload);
      });

      await showSwal("SUCCESS", {}, { entity });
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
      width={500}
    >
      <FormGrid
        fields={[
          { label: "First Name", name: "firstName", xs: 6 },
          { label: "Middle Name", name: "middleName", xs: 6 },
          { label: "Last Name", name: "lastName", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "User Type",
            name: "type",
            xs: 6,
            select: true,
            SelectProps: {
              MenuProps: { disablePortal: false, sx: { zIndex: 9999 } },
            },
            children:
              Object.entries(userTypes || {}).length > 0 ? (
                Object.entries(userTypes).map(([key, label]) => (
                  <MenuItem key={key} value={label}>
                    {label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Loading types...</MenuItem>
              ),
          },
        ]}
        switches={[
          {
            name: "status",
            label: formData.status ? "Active" : "Inactive",
            xs: 12,
          },
        ]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleChange} // ✅ use same handler for Switch
      />
    </ModalContainer>
  );
}

export default AddUserModal;
