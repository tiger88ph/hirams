import React, { useState, useEffect, useRef } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Typography,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // ✅ Added
import ModalContainer from "../../../../common/ModalContainer";
import FormGrid from "../../../../common/FormGrid";
import api from "../../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import useMapping from "../../../../../utils/mappings/useMapping";

const steps = ["Basic Information", "Procurement Details", "Schedule Details"];

function AddTransactionModal({ open, onClose, onSaved }) {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate(); // ✅ Added

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
    dtPreBidChb: false,
    dtPreBid: "",
    strPreBid_Venue: "",
    dtDocIssuanceChb: false,
    dtDocIssuance: "",
    strDocIssuance_Venue: "",
    dtDocSubmissionChb: false,
    dtDocSubmission: "",
    strDocSubmission_Venue: "",
    dtDocOpeningChb: false,
    dtDocOpening: "",
    strDocOpening_Venue: "",
  });

  const [errors, setErrors] = useState({});
  const [clientOptions, setClientOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const { itemType, procMode, procSource } = useMapping();
  const convertToOptions = (obj) =>
    Object.entries(obj || {}).map(([value, label]) => ({ label, value }));

  const itemTypeOptions = convertToOptions(itemType);
  const procModeOptions = convertToOptions(procMode);
  const procSourceOptions = convertToOptions(procSource);

  const saveButtonRef = useRef(null);
  const nextButtonRef = useRef(null);

  const fetchClients = async () => {
    try {
      const data = await api.get("client/active");
      const clients = data.clients || [];
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 0) {
      if (!formData.strCode)
        stepErrors.strCode = "Transaction Code is required";
      if (!formData.nCompanyId) stepErrors.nCompanyId = "Company is required";
      if (!formData.nClientId) stepErrors.nClientId = "Client is required";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSave = async () => {
    if (!validateStep(2)) return;

    const entity = formData.strTitle?.trim() || "Transaction";

    try {
      setLoading(true);
      onClose();

      await withSpinner(`Processing ${entity}...`, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const payload = { ...formData, nUserId: user?.nUserId };
        await api.post("transactions", payload);
      });

      await showSwal("SUCCESS", {}, { entity, action: "added" });
      onSaved?.();
      setActiveStep(0);
    } catch (error) {
      console.error("❌ Error saving transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return [
          { label: "Transaction Code", name: "strCode", xs: 12 },
          {
            label: "Company Name",
            name: "nCompanyId",
            type: "select",
            options: companyOptions,
            xs: 6,
          },
          {
            label: "Client Name",
            name: "nClientId",
            type: "select",
            options: clientOptions,
            xs: 6,
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
      width={650}
      loading={loading}
      showSave={false}
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
      {/* ✅ Added Navigation Text */}
      {activeStep === 0 && (
        <Box sx={{ textAlign: "right", mb: 1 }}>
          <Typography variant="caption">
            New Client?{" "}
            <Link
              component="button"
              onClick={() => {
                onClose(); // close modal first
                navigate("/p-client");
                navigate("/p-client?add=true"); // ✅ send flag
              }}
              underline="hover"
              color="primary"
            >
              Click here
            </Link>
          </Typography>
        </Box>
      )}

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
