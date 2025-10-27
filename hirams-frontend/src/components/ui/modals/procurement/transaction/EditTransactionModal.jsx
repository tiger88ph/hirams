import React, { useState, useEffect } from "react";
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
import api from "../../../../../utils/api/api";

const steps = ["Basic Information", "Procurement Details", "Schedule Details"];

function EditTransactionModal({ open, onClose, transaction }) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});

  const [clientOptions, setClientOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  // 🟢 Initialize form data when editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        nCompanyId: transaction.nCompanyId || "",
        nClientId: transaction.nClientId || "",
        nAssignedAO: transaction.nAssignedAO || "",
        strTitle: transaction.strTitle || "",
        strRefNumber: transaction.strRefNumber || "",
        dTotalABC: transaction.dTotalABC || "",
        cItemType: transaction.cItemType || "",
        cProcMode: transaction.cProcMode || "",
        cProcSource: transaction.cProcSource || "",
        cProcStatus: transaction.cProcStatus || "",
        strCode: transaction.strCode || "",
        dtPreBid: transaction.dtPreBid || "",
        strPreBid_Venue: transaction.strPreBid_Venue || "",
        dtDocIssuance: transaction.dtDocIssuance || "",
        strDocIssuance_Venue: transaction.strDocIssuance_Venue || "",
        dtDocSubmission: transaction.dtDocSubmission || "",
        strDocSubmission_Venue: transaction.strDocSubmission_Venue || "",
        dtDocOpening: transaction.dtDocOpening || "",
        strDocOpening_Venue: transaction.strDocOpening_Venue || "",

        // ✅ MUST ADD THESE FOR CHECKBOXES TO WORK
        dtPreBidChb: false,
        dtDocIssuanceChb: false,
        dtDocSubmissionChb: false,
        dtDocOpeningChb: false,
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSave = async () => {
    try {
      await api.put(`transactions/${transaction.id}`, formData);
      console.log("Updated transaction:", formData);
      onClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  // Fetch clients & companies
  const fetchClients = async () => {
    try {
      const data = await api.get("clients");
      setClientOptions(
        (data.clients || []).map((c) => ({
          label: c.strClientName,
          value: c.nClientId,
        }))
      );
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await api.get("companies");
      setCompanyOptions(
        (data.companies || []).map((c) => ({
          label: c.strCompanyName,
          value: c.nCompanyId,
        }))
      );
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCompanies();
  }, []);

  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return [
          { label: "Transaction Code", name: "strCode", xs: 6 },
          {
            label: "Company Name",
            name: "nCompanyId",
            xs: 6,
            type: "select",
            options: companyOptions,
          },
          {
            label: "Client Name",
            name: "nClientId",
            xs: 6,
            type: "select",
            options: clientOptions,
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
            type: "datetime-local",
            xs: 5,
          },
          { label: "Pre-Bid Venue", name: "strPreBid_Venue", xs: 6 },
          { name: "dtDocIssuanceChb", type: "checkbox", xs: 1 },
          {
            label: "Doc Issuance Date",
            name: "dtDocIssuance",
            type: "datetime-local",
            xs: 5,
          },
          { label: "Doc Issuance Venue", name: "strDocIssuance_Venue", xs: 6 },
          { name: "dtDocSubmissionChb", type: "checkbox", xs: 1 },
          {
            label: "Doc Submission Date",
            name: "dtDocSubmission",
            type: "datetime-local",
            xs: 5,
          },
          {
            label: "Doc Submission Venue",
            name: "strDocSubmission_Venue",
            xs: 6,
          },
          { name: "dtDocOpeningChb", type: "checkbox", xs: 1 },
          {
            label: "Doc Opening Date",
            name: "dtDocOpening",
            type: "datetime-local",
            xs: 5,
          },
          { label: "Doc Opening Venue", name: "strDocOpening_Venue", xs: 6 },
        ];
      default:
        return [];
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Edit Transaction"
      subTitle={formData.strTitle || ""}
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
            Save Changes
          </Button>
        )}
      </Box>
    </ModalContainer>
  );
}

export default EditTransactionModal;
