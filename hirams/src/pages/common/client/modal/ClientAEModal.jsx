import React, { useState, useEffect } from "react";
import api from "../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../utils/form/validation.js";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../utils/helpers/tinFormat.js";
import {
  formatPhoneNo,
  phoneNoToStorage,
  phoneNoToDisplay,
} from "../../../../utils/helpers/phoneNoFormat.js";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../components/common/FormGrid.jsx";

function ClientAEModal({
  open,
  handleClose,
  clientData = null,
  onClientSaved,
  activeKey,
  pendingKey,
  isManagement,
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
  const isEditMode = Boolean(clientData);
  const defaultStatus = isManagement ? activeKey : pendingKey;
  useEffect(() => {
    if (open) {
      if (isEditMode && clientData) {
        // Edit mode: populate with existing data
        setFormData({
          clientName: clientData.clientName || clientData.name || "",
          nickname: clientData.nickname || "",
          tin: tinToDisplay(clientData.tin),
          address: clientData.address || "",
          businessStyle: clientData.businessStyle || "",
          contactPerson: clientData.contactPerson || "",
          contactNumber: phoneNoToDisplay(clientData.contactNumber),
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "tin") {
      formattedValue = formatTIN(value);
    } else if (name === "contactNumber") {
      formattedValue = formatPhoneNo(value);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validateForm = () => {
    const validationErrors = validateFormData(formData, "CLIENT");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.nickname.trim() || "Client";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        const payload = {
          strClientName: formData.clientName,
          strClientNickName: formData.nickname,
          strTIN: tinToStorage(formData.tin),
          strAddress: formData.address,
          strBusinessStyle: formData.businessStyle,
          strContactPerson: formData.contactPerson,
          strContactNumber: phoneNoToStorage(formData.contactNumber),
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
            type: "tin",
            xs: 6,
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
            type: "phone",
            xs: 6,
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
