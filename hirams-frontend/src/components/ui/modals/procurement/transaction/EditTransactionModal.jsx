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

function EditTransactionModal({ open, onClose, transaction, onSaved }) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [clientOptions, setClientOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔹 Initialize form data when editing
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
        dtPreBidChb: !!transaction.dtPreBid,
        dtDocIssuanceChb: !!transaction.dtDocIssuance,
        dtDocSubmissionChb: !!transaction.dtDocSubmission,
        dtDocOpeningChb: !!transaction.dtDocOpening,
      });
    }
  }, [transaction]);

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 🔹 Validation per step
  const validateStep = () => {
    const newErrors = {};

    if (activeStep === 0) {
      if (!formData.strCode?.trim())
        newErrors.strCode = "Transaction code is required.";
      if (!formData.nCompanyId) newErrors.nCompanyId = "Company is required.";
      if (!formData.nClientId) newErrors.nClientId = "Client is required.";
    }

    if (activeStep === 1) {
      if (!formData.strTitle?.trim()) newErrors.strTitle = "Title is required.";
      if (!formData.cItemType) newErrors.cItemType = "Item type is required.";
      if (!formData.dTotalABC || parseFloat(formData.dTotalABC) <= 0)
        newErrors.dTotalABC = "Total ABC must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Step navigation
  const handleNext = () => {
    if (validateStep()) setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // 🔹 Save with Swal + Spinner + Refresh
  const handleSave = async () => {
    if (!validateStep()) return;
    const entity = formData.strTitle?.trim() || "Transaction";

    try {
      setLoading(true);
      onClose(); // close modal immediately like AddTransactionModal

      await withSpinner(`Processing ${entity}...`, async () => {
        await api.put(`transactions/${transaction.nTransactionId}`, formData);
      });

      await showSwal("SUCCESS", {}, { entity, action: "updated" });

      onSaved?.(); // refresh parent data
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch clients & companies
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

  // 🔹 Step field configurations
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

  // 🔹 Render
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Edit Transaction"
      subTitle={formData.strTitle || ""}
      width={650}
      loading={loading}
      showSave={false}
      saveLabel={activeStep === steps.length - 1 ? "Save Changes" : "Next"}
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
        handleChange={handleChange}
        errors={errors}
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
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </Box>
    </ModalContainer>
  );
}

export default EditTransactionModal;
