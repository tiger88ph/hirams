import React from "react";
import ModalContainer from "../../../common/ModalContainer";
import FormGrid from "../../../common/FormGrid";
import { Box, Typography, Link } from "@mui/material";
import { BackButton } from "../../../common/Buttons";
import { SaveButton } from "../../../common/Buttons";
import { useNavigate } from "react-router-dom";

function NewOptionModal({
  open,
  onClose,
  formData,
  handleChange,
  handleSwitchChange,
  errors,
  fields,
  savePurchaseOption,
}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={formData?.id ? "Edit Purchase Option" : "Add Purchase Option"}
      onSave={savePurchaseOption}
    >
      <FormGrid
        fields={fields}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSwitchChange={handleSwitchChange}
      />

      <Box sx={{ textAlign: "right", mt: 1 }}>
        <Typography variant="caption">
          New Supplier?{" "}
          <Link
            component="button"
            underline="hover"
            color="primary"
            onClick={() => {
              onClose(); // close the current modal
              navigate("/a-supplier?add=true"); // navigate to add supplier page
            }}
          >
            Click here
          </Link>
        </Typography>
      </Box>
    </ModalContainer>
  );
}

export default NewOptionModal;
