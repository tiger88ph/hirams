import React, { useEffect, useState } from "react";
import {
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
} from "@mui/material";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";

function EditUserModal({ open, handleClose, user, onUserUpdated }) {
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

  const { statuses, userTypes } = useMapping(); // ✅ get user types

  // Populate form when `user` changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        nickname: user.nickname || "",
        type: user.type || "",
        status: user.status ?? true,
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
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.nickname.trim()) newErrors.nickname = "Nickname is required";
    if (!formData.type.trim()) newErrors.type = "Type is required";
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

      await withSpinner(`Updating ${entity}...`, async () => {
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

        await api.put(`users/${user.id}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
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
      subTitle={`${formData.firstName} ${formData.lastName}`.trim()} // <-- added
      onSave={handleSave}
      saveLabel="Update"
      loading={loading}
    >
      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <TextField
            label="First Name"
            name="firstName"
            fullWidth
            size="small"
            value={formData.firstName}
            onChange={handleChange}
            error={!!errors.firstName}
            helperText={errors.firstName || ""}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Middle Name"
            name="middleName"
            fullWidth
            size="small"
            value={formData.middleName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Last Name"
            name="lastName"
            fullWidth
            size="small"
            value={formData.lastName}
            onChange={handleChange}
            error={!!errors.lastName}
            helperText={errors.lastName || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Nickname"
            name="nickname"
            fullWidth
            size="small"
            value={formData.nickname}
            onChange={handleChange}
            error={!!errors.nickname}
            helperText={errors.nickname || ""}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            select
            label="User Type"
            name="type"
            fullWidth
            size="small"
            value={formData.type}
            onChange={handleChange}
            error={!!errors.type}
            helperText={errors.type || ""}
            SelectProps={{
              MenuProps: { disablePortal: false, sx: { zIndex: 9999 } },
            }}
          >
            {Object.entries(userTypes || {}).length > 0 ? (
              Object.entries(userTypes).map(([key, label]) => (
                <MenuItem key={key} value={label}>
                  {label}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>Loading types...</MenuItem>
            )}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.status}
                onChange={handleChange}
                name="status"
                color="primary"
              />
            }
            label={formData.status ? "Active" : "Inactive"}
          />
        </Grid>
      </Grid>
    </ModalContainer>
  );
}

export default EditUserModal;
