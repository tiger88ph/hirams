import React, { useState } from "react";
import { TextField, Grid, FormControlLabel, Switch } from "@mui/material";
import api from "../../../../../api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";

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
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.nickname.trim()) newErrors.nickname = "Nickname is required";
    if (!formData.type.trim()) newErrors.type = "Type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = `${formData.firstName} ${formData.lastName}`.trim() || "User";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Saving ${entity}...`, async () => {
        const payload = {
          strFName: formData.firstName,
          strMName: formData.middleName || "",
          strLName: formData.lastName,
          strNickName: formData.nickname,
          cUserType: formData.type,
          cStatus: formData.status ? "A" : "I",
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
      onSave={handleSave}
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
            label="Type"
            name="type"
            fullWidth
            size="small"
            value={formData.type}
            onChange={handleChange}
            error={!!errors.type}
            helperText={errors.type || ""}
          />
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

export default AddUserModal;
