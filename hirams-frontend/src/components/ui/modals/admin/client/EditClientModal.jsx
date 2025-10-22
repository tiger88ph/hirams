import React, { useState, useEffect } from "react";
import { CircularProgress, Switch, FormControlLabel, Typography } from "@mui/material";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";

function EditClientModal({ open, handleClose, clientData, onClientUpdated }) {
  const [formData, setFormData] = useState({
    clientName: "",
    nickname: "",
    tin: "",
    address: "",
    businessStyle: "",
    contactPerson: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Populate form when clientData changes
  useEffect(() => {
    if (clientData) {
      setFormData({
        clientName: clientData.clientName || clientData.name || "",
        nickname: clientData.nickname || "",
        tin: clientData.tin || "",
        address: clientData.address || "",
        businessStyle: clientData.businessStyle || "",
        contactPerson: clientData.contactPerson || "",
        contactNumber: clientData.contactNumber || "",
      });
      setErrors({});
    }
  }, [clientData]);

  // ✅ Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // TIN auto-format: numeric only, spaced 3-3-3-2
    if (name === "tin") {
      const digits = value.replace(/\D/g, "");
      const parts = [];
      if (digits.length > 0) parts.push(digits.substring(0, 3));
      if (digits.length > 3) parts.push(digits.substring(3, 6));
      if (digits.length > 6) parts.push(digits.substring(6, 9));
      if (digits.length > 9) parts.push(digits.substring(9, 11));
      formattedValue = parts.join(" ");
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ Validation
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CLIENT");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ✅ Save
  const handleSave = async () => {
    if (!validateForm()) return;
    const entity = formData.clientName || "Client";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(`Updating ${entity}...`, async () => {
        const payload = {
          strClientName: formData.clientName,
          strClientNickName: formData.nickname,
          strTIN: formData.tin,
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,
        };
        await api.put(`clients/${clientData.id}`, payload);
      });

      await showSwal("SUCCESS", {}, { entity });
      onClientUpdated?.();
    } catch (error) {
      console.error("❌ Error updating client:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Edit Client"
      subTitle={formData.clientName?.trim() || ""}
      onSave={handleSave}
      loading={loading}
      saveLabel={
        loading ? (
          <>
            <CircularProgress size={16} sx={{ color: "white", mr: 1 }} />
            Saving...
          </>
        ) : (
          "Save"
        )
      }
    >
      <FormGrid
        fields={[
          { label: "Client Name", name: "clientName", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          { label: "TIN", name: "tin", xs: 6, placeholder: "123-456-789-000" },
          { label: "Address", name: "address", xs: 12, multiline: true, minRows: 2 },
          { label: "Business Style", name: "businessStyle", xs: 12 },
          { label: "Contact Person", name: "contactPerson", xs: 6 },
          { label: "Contact Number", name: "contactNumber", xs: 6, placeholder: "09XXXXXXXXX or +639XXXXXXXXX" },
        ]}
        switches={[]} // no switches in this modal
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </ModalContainer>
  );
}

export default EditClientModal;
