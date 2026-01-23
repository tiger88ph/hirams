import React from "react";
import ModalContainer from "../../../common/ModalContainer";
import FormGrid from "../../../common/FormGrid";
import { Box, Typography, Link } from "@mui/material";
import { BackButton } from "../../../common/Buttons";
import { SaveButton } from "../../../common/Buttons";

function NewItemModal({
  open,
  onClose,
  formData,
  handleChange,
  errors,
  editingItem,
  onSave,
  onUpdate,
}) {
  if (!open) return null;

  return (
    <ModalContainer
    open={open}
    handleClose={onClose}
    onSave={
        editingItem
        ? () => onUpdate(editingItem.id)
        : onSave
    }
    title={editingItem ? "Edit Item" : "Add New Item"}
    >

      <FormGrid
        fields={[
          { name: "name", label: "Item Name", xs: 12 },
          {
            label: "Specifications",
            placeholder: "Type here the specifications...",
            name: "specs",
            xs: 12,
            multiline: true,
            minRows: 1,
            showHighlighter: false,
            sx: { "& textarea": { resize: "vertical" } },
          },
          {
            name: "qty",
            label: "Quantity",
            type: "number",
            xs: 4,
            numberOnly: true,
          },
          { name: "uom", label: "UOM", xs: 4 },
          {
            name: "abc",
            label: "Total ABC",
            type: "number",
            xs: 4,
            numberOnly: true,
          },
        ]}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
      />

    </ModalContainer>
  );
}

export default NewItemModal;
