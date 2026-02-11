import React, { useState, useEffect } from "react";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import ModalContainer from "../../../../common/ModalContainer";
import { validateFormData } from "../../../../../utils/form/validation";
import FormGrid from "../../../../common/FormGrid";

function ClientAEModal({
  open,
  handleClose,
  clientData = null, // null = Add mode, object = Edit mode
  onClientSaved,
  activeKey,
  pendingKey,
  managementKey,
}) {
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

  // Determine if we're in Edit mode
  const isEditMode = Boolean(clientData);
  
  // Get user info for status determination (Add mode only)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userType = user?.cUserType;
  const isManagement = managementKey?.includes(userType);
  const defaultStatus = isManagement ? activeKey : pendingKey;

  // Populate form when modal opens or clientData changes
  useEffect(() => {
    if (open) {
      if (isEditMode && clientData) {
        // Edit mode: populate with existing data
        setFormData({
          clientName: clientData.clientName || clientData.name || "",
          nickname: clientData.nickname || "",
          tin: clientData.tin || "",
          address: clientData.address || "",
          businessStyle: clientData.businessStyle || "",
          contactPerson: clientData.contactPerson || "",
          contactNumber: clientData.contactNumber || "",
        });
      } else {
        // Add mode: reset form
        setFormData({
          clientName: "",
          nickname: "",
          tin: "",
          address: "",
          businessStyle: "",
          contactPerson: "",
          contactNumber: "",
        });
      }
      setErrors({});
    }
  }, [open, clientData, isEditMode]);

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // TIN auto-format: numeric only, spaced 3-3-3-5
    if (name === "tin") {
      const digits = value.replace(/\D/g, "");
      const parts = [];
      if (digits.length > 0) parts.push(digits.substring(0, 3));
      if (digits.length > 3) parts.push(digits.substring(3, 6));
      if (digits.length > 6) parts.push(digits.substring(6, 9));
      if (digits.length > 9) parts.push(digits.substring(9, 14));
      formattedValue = parts.join(" ");
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validation
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CLIENT");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Save handler (Add or Edit)
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.clientName.trim() || "Client";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        const payload = {
          strClientName: formData.clientName,
          strClientNickName: formData.nickname,
          strTIN: formData.tin.replace(/ /g, "-"), // Replace spaces with dash
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: formData.contactNumber,
        };

        if (isEditMode) {
          // Edit mode: PUT request
          await api.put(`clients/${clientData.id}`, payload);
        } else {
          // Add mode: POST request with status
          await api.post("clients", {
            ...payload,
            cStatus: defaultStatus,
          });
        }
      });

      // Success message
      const action = isEditMode ? "updated" : "added";
      await showSwal("SUCCESS", {}, { entity, action });

      onClientSaved?.();
      
      // Reset form if in Add mode
      if (!isEditMode) {
        setFormData({
          clientName: "",
          nickname: "",
          tin: "",
          address: "",
          businessStyle: "",
          contactPerson: "",
          contactNumber: "",
        });
      }
      setErrors({});
    } catch (error) {
      console.error(`❌ Error ${isEditMode ? 'updating' : 'adding'} client:`, error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isEditMode ? "Edit Client" : "Add Client"}
      subTitle={formData.nickname ? `/ ${formData.nickname}` : ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
    >
      <FormGrid
        fields={[
          { label: "Client", name: "clientName", xs: 12 },
          { label: "Nickname", name: "nickname", xs: 6 },
          {
            label: "TIN",
            name: "tin",
            xs: 6,
            placeholder: "000-000-000-00000",
          },
          {
            label: "Address",
            name: "address",
            xs: 12,
            multiline: true,
            plainMultiline: true,
            minRows: 2,
            sx: { "& textarea": { resize: "vertical" } },
          },
          { label: "Business Style", name: "businessStyle", xs: 12 },
          { label: "Contact Person", name: "contactPerson", xs: 6 },
          {
            label: "Contact Number",
            name: "contactNumber",
            xs: 6,
            placeholder: "09XXXXXXXXX",
            numberOnly: true,
          },
        ]}
        switches={[]}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </ModalContainer>
  );
}

export default ClientAEModal;