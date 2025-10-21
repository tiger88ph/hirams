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
import { validateFormData } from "../../../../../utils/form/validation";

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
      subTitle={`${formData.firstName || ""} ${formData.lastName || ""}`.trim()}
      onSave={handleSave}
      saveLabel="Update"
      loading={loading}
      width={500}
    >
      <Grid container spacing={1.5}>
        {[
          { label: "First Name", name: "firstName", xs: 6 },
          { label: "Middle Name", name: "middleName", xs: 6 },
          { label: "Last Name", name: "lastName", xs: 12},
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "User Type",
            name: "type",
            xs: 6,
            select: true,
            SelectProps: {
              MenuProps: {
                disablePortal: false,
                sx: { zIndex: 9999 },
              },
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
        ].map((field) => (
          <Grid item xs={field.xs} key={field.name}>
            <TextField
              {...field}
              fullWidth
              size="small"
              value={formData[field.name] || ""}
              onChange={handleChange}
              error={!!errors[field.name]}
              helperText={errors[field.name] || ""}
            />
          </Grid>
        ))}

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={!!formData.status}
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
