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
import { showSwal, withSpinner } from "../../../../../utils/swal";

const steps = ["Basic Information", "Procurement Details", "Schedule Details"];

function AddTransactionModal({ open, onClose, onSaved }) {
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

  const [errors, setErrors] = useState({});
  const [clientOptions, setClientOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // -------------------------
  // 🔹 Fetch Clients & Companies
  // -------------------------
  const fetchClients = async () => {
    try {
      const data = await api.get("clients");
      const clients = data.clients || [];
      setClientOptions(
        clients.map((c) => ({
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
      const companies = data.companies || [];
      setCompanyOptions(
        companies.map((c) => ({
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

  // -------------------------
  // 🔹 Handle Changes
  // -------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // -------------------------
  // 🔹 Step Management
  // -------------------------
  const handleNext = () => {
    // Validate before going next from first 2 steps
    if (activeStep === 0 || activeStep === 1) {
      if (!validateStep(activeStep)) return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => setActiveStep(0);

  // -------------------------
  // 🔹 Validation Logic
  // -------------------------
  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 0) {
      if (!formData.strCode)
        stepErrors.strCode = "Transaction Code is required";
      if (!formData.nCompanyId) stepErrors.nCompanyId = "Company is required";
      if (!formData.nClientId) stepErrors.nClientId = "Client is required";
    }

    if (step === 1) {
      if (!formData.strTitle) stepErrors.strTitle = "Title is required";
      if (!formData.cItemType) stepErrors.cItemType = "Item Type is required";
      if (!formData.dTotalABC) stepErrors.dTotalABC = "Total ABC is required";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // -------------------------
  // 🔹 Save Logic with Spinner
  // -------------------------
  const handleSave = async () => {
    if (!validateStep(1)) return; // validate

    const entity = formData.strTitle?.trim() || "Transaction";

    try {
      setLoading(true);
      onClose(); // close modal immediately like AddClientModal

      await withSpinner(`Processing ${entity}...`, async () => {
        const payload = { ...formData, cProcStatus: "110" };
        await api.post("transactions", payload);
      });

      await showSwal("SUCCESS", {}, { entity, action: "added" });

      onSaved?.();

      // Reset form and stepper
      handleReset();
      setFormData({
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
    } catch (error) {
      console.error("❌ Error saving transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 🔹 Form Step Fields
  // -------------------------
  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return [
          { label: "Transaction Code", name: "strCode", xs: 12 },
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
            required: true,
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
            required: true,
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
            type: "datetime-local",
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
            type: "datetime-local",
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
            type: "datetime-local",
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

  // -------------------------
  // 🔹 Render
  // -------------------------
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Add Transaction"
      subTitle={formData.strTitle || ""}
      width={650}
      loading={loading}
      showSave={false}
      saveLabel={activeStep === steps.length - 1 ? "Save" : "Next"}
      onSave={activeStep === steps.length - 1 ? handleSave : handleNext}
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
        errors={errors}
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
            {loading ? "Saving..." : "Save"}
          </Button>
        )}
      </Box>
    </ModalContainer>
  );
}

export default AddTransactionModal;
