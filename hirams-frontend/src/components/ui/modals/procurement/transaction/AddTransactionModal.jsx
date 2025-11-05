import React, { useState, useEffect, useRef } from "react";
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
import useMapping from "../../../../../utils/mappings/useMapping";

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

  const {
    itemType,
    procMode,
    procSource,
    loading: mappingLoading,
  } = useMapping();

  const convertToOptions = (obj) =>
    Object.entries(obj || {}).map(([value, label]) => ({ label, value }));

  const itemTypeOptions = convertToOptions(itemType);
  const procModeOptions = convertToOptions(procMode);
  const procSourceOptions = convertToOptions(procSource);

  const saveButtonRef = useRef(null);
  const nextButtonRef = useRef(null);

  const fetchClients = async () => {
    try {
      const data = await api.get("clients");
      const clients = data.clients || [];
      setClientOptions(
        clients.map((c) => ({ label: c.strClientName, value: c.nClientId }))
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
        companies.map((c) => ({ label: c.strCompanyName, value: c.nCompanyId }))
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

    if (step === 1) {
      if (!formData.strTitle) stepErrors.strTitle = "Title is required";
      if (!formData.cItemType) stepErrors.cItemType = "Item Type is required";
    }

    if (step === 2) {
      const {
        dtPreBid,
        dtDocIssuance,
        dtDocSubmission,
        dtDocOpening,
        dtPreBidChb,
        dtDocIssuanceChb,
        dtDocSubmissionChb,
        dtDocOpeningChb,
      } = formData;

      const d1 = dtPreBidChb && dtPreBid ? new Date(dtPreBid) : null;
      const d2 =
        dtDocIssuanceChb && dtDocIssuance ? new Date(dtDocIssuance) : null;
      const d3 =
        dtDocSubmissionChb && dtDocSubmission
          ? new Date(dtDocSubmission)
          : null;
      const d4 =
        dtDocOpeningChb && dtDocOpening ? new Date(dtDocOpening) : null;

      if (d1 && d2 && d2 < d1)
        stepErrors.dtDocIssuance =
          "Doc Issuance must be after or same as Pre-Bid";

      if (d2 && d3 && d3 < d2)
        stepErrors.dtDocSubmission =
          "Doc Submission must be after or same as Doc Issuance";

      if (d3 && d4 && d4 < d3)
        stepErrors.dtDocOpening =
          "Doc Opening must be after or same as Doc Submission";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => setActiveStep(0);

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
      handleReset();
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
            options: itemTypeOptions,
          },
          {
            label: "Procurement Mode",
            name: "cProcMode",
            xs: 4,
            type: "select",
            options: procModeOptions,
          },
          {
            label: "Procurement Source",
            name: "cProcSource",
            xs: 5,
            type: "select",
            options: procSourceOptions,
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

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Add Transaction"
      subTitle={formData.strTitle || ""}
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
        autoFocus={`${open}-${activeStep}`} // ✅ Re-focus when step changes
        onLastFieldTab={() => {
          if (activeStep === steps.length - 1) {
            saveButtonRef.current?.focus(); // ✅ Final step → move to Save
          } else {
            nextButtonRef.current?.focus(); // ✅ Otherwise → move to Next
          }
        }}
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
          <Button ref={nextButtonRef} onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Button
            ref={saveButtonRef}
            onClick={handleSave}
            variant="contained"
            color="success"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        )}
      </Box>
    </ModalContainer>
  );
}

export default AddTransactionModal;
