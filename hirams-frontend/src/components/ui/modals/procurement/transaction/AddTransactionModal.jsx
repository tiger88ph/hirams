import React, { useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Typography,
} from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import FormGrid from "../../../../common/FormGrid";

const steps = ["Basic Information", "Procurement Details", "Schedule Details"];

function AddTransactionModal({ open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    nCompanyId: "",
    nClientId: "",
    nAssignedAO: "",
    strTitle: "",
    strRefNumber: "",
    dTotalABC: "",
    cItemType: "",
    cProcMode: "",
    cProcSource: "",
    cProcStatus: "",
    strCode: "",
    dtPreBid: "",
    strPreBid_Venue: "",
    dtDocIssuance: "",
    strDocIssuance_Venue: "",
    dtDocSubmission: "",
    strDocSubmission_Venue: "",
    dtDocOpening: "",
    strDocOpening_Venue: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => setActiveStep(0);
  const handleSave = () => {
    console.log("Saved:", formData);
    onClose();
    handleReset();
  };

  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return [
          { label: "Transaction Code", name: "strCode", xs: 6 },
          {
            label: "Company ID",
            name: "nCompanyId",
            xs: 6,
            type: "select",
            options: [
              { label: "Company A", value: "A" },
              { label: "Company B", value: "B" },
              { label: "Company C", value: "C" },
            ],
          },
          {
            label: "Client",
            name: "nClientId",
            xs: 6,
            type: "select",
            options: [{ label: "Mercado, Janinay", value: "34" }],
          },
          {
            label: "Account Officer",
            name: "nAssignedAO",
            xs: 6,
            type: "select",
            options: [{ label: "Kevin Maranan", value: "45" }],
          },
        ];
      case 1:
        return [
          { label: "Title", name: "strTitle", xs: 12 },
          {
            label: "Item Type",
            name: "cItemType",
            xs: 3,
            type: "select",
            options: [
              { label: "Goods", value: "G" },
              { label: "Service", value: "O" },
            ],
          },

          { label: "Procurement Mode", name: "cProcMode", xs: 4 },
          {
            label: "Procurement Source",
            name: "cProcSource",
            xs: 5,
            type: "select",
            options: [
              { label: "Walk-in", value: "W" },
              { label: "Online", value: "O" },
            ],
          },
          { label: "Reference Number", name: "strRefNumber", xs: 6 },
          { label: "Total ABC", name: "dTotalABC", xs: 6, type: "number" },
        ];
      case 2:
        return [
          { name: "dtPreBidChb", type: "checkbox", xs: 1 },
          {
            label: "Pre-Bid Date",
            name: "dtPreBid",
            type: "date",
            xs: 5,
            dependsOn: "dtPreBidChb",
          },
          {
            label: "Pre-Bid Venue",
            name: "strPreBid_Venue",
            xs: 6,
            dependsOn: "dtPreBidChb",
          },

          { name: "dtDocIssuanceChb", type: "checkbox", xs: 1 },
          {
            label: "Doc Issuance Date",
            name: "dtDocIssuance",
            type: "date",
            xs: 5,
            dependsOn: "dtDocIssuanceChb",
          },
          {
            label: "Doc Issuance Venue",
            name: "strDocIssuance_Venue",
            xs: 6,
            dependsOn: "dtDocIssuanceChb",
          },

          { name: "dtDocSubmissionChb", type: "checkbox", xs: 1 },
          {
            label: "Doc Submission Date",
            name: "dtDocSubmission",
            type: "date",
            xs: 5,
            dependsOn: "dtDocSubmissionChb",
          },
          {
            label: "Doc Submission Venue",
            name: "strDocSubmission_Venue",
            xs: 6,
            dependsOn: "dtDocSubmissionChb",
          },

          { name: "dtDocOpeningChb", type: "checkbox", xs: 1 },
          {
            label: "Doc Opening Date",
            name: "dtDocOpening",
            type: "date",
            xs: 5,
            dependsOn: "dtDocOpeningChb",
          },
          {
            label: "Doc Opening Venue",
            name: "strDocOpening_Venue",
            xs: 6,
            dependsOn: "dtDocOpeningChb",
          },
        ];

      default:
        return [];
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Add Transaction"
      subTitle={formData.strTitle || ""}
      saveLabel={activeStep === steps.length - 1 ? "Save" : "Next"}
      onSave={activeStep === steps.length - 1 ? handleSave : handleNext}
      width={650}
      showFooter={false}
    >
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="body2" fontWeight={500}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <FormGrid
        fields={getStepFields(activeStep)}
        formData={formData}
        handleChange={handleChange}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Button onClick={handleSave} variant="contained" color="success">
            Save
          </Button>
        )}
      </Box>
    </ModalContainer>
  );
}

export default AddTransactionModal;
