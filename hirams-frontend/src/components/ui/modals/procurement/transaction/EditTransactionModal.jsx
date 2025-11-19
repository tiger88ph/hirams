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

function EditTransactionModal({ open, onClose, transaction, onSaved }) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [clientOptions, setClientOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const saveButtonRef = useRef(null);
  const nextButtonRef = useRef(null);

  const formatForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    if (transaction) {
      setFormData({
        nCompanyId: transaction.company?.nCompanyId || "", // <- fixed
        nClientId: transaction.client?.nClientId || "", // <- fixed
        nAssignedAO: transaction.nAssignedAO || "",
        strTitle: transaction.strTitle || "",
        strRefNumber: transaction.strRefNumber || "",
        dTotalABC: transaction.dTotalABC || "",
        cItemType: transaction.cItemType || "",
        cProcMode: transaction.cProcMode || "",
        cProcSource: transaction.cProcSource || "",
        cProcStatus: transaction.cProcStatus || "",
        strCode: transaction.strCode || "",
        dtPreBid: formatForInput(transaction.dtPreBid),
        strPreBid_Venue: transaction.strPreBid_Venue || "",
        dtDocIssuance: formatForInput(transaction.dtDocIssuance),
        strDocIssuance_Venue: transaction.strDocIssuance_Venue || "",
        dtDocSubmission: formatForInput(transaction.dtDocSubmission),
        strDocSubmission_Venue: transaction.strDocSubmission_Venue || "",
        dtDocOpening: formatForInput(transaction.dtDocOpening),
        strDocOpening_Venue: transaction.strDocOpening_Venue || "",
        dtPreBidChb: !!transaction.dtPreBid,
        dtDocIssuanceChb: !!transaction.dtDocIssuance,
        dtDocSubmissionChb: !!transaction.dtDocSubmission,
        dtDocOpeningChb: !!transaction.dtDocOpening,
      });
    }
  }, [transaction]);

  const getLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // minutes offset from UTC
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let updated = { ...prev };

      // Handle checkbox logic
      if (type === "checkbox") {
        updated[name] = checked;

        // Map checkbox -> [datetimeField, venueField]
        const checkboxMap = {
          dtPreBidChb: ["dtPreBid", "strPreBid_Venue"],
          dtDocIssuanceChb: ["dtDocIssuance", "strDocIssuance_Venue"],
          dtDocSubmissionChb: ["dtDocSubmission", "strDocSubmission_Venue"],
          dtDocOpeningChb: ["dtDocOpening", "strDocOpening_Venue"],
        };

        if (checkboxMap[name]) {
          const [dateField, venueField] = checkboxMap[name];

          if (checked) {
            // When checked → set current LOCAL datetime
            updated[dateField] = getLocalDateTime();
          } else {
            // When unchecked → clear both date and venue
            updated[dateField] = "";
            updated[venueField] = "";
          }
        }

        return updated;
      }

      // Handle normal text/select/date
      updated[name] = value;

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Step Validation Including Incremental Date Rules
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
    }

    // ✅ Step 2 Incremental Date Logic (handles any combination of checked dates)
    if (activeStep === 2) {
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

      // Required date validation for checked items
      if (dtPreBidChb && !dtPreBid)
        newErrors.dtPreBid = "Pre-Bid Date is required";
      if (dtDocIssuanceChb && !dtDocIssuance)
        newErrors.dtDocIssuance = "Doc Issuance Date is required";
      if (dtDocSubmissionChb && !dtDocSubmission)
        newErrors.dtDocSubmission = "Doc Submission Date is required";
      if (dtDocOpeningChb && !dtDocOpening)
        newErrors.dtDocOpening = "Doc Opening Date is required";

      // Build array of selected dates in order
      const selectedDates = [
        dtPreBidChb && dtPreBid
          ? { key: "dtPreBid", date: new Date(dtPreBid), label: "Pre-Bid" }
          : null,
        dtDocIssuanceChb && dtDocIssuance
          ? {
              key: "dtDocIssuance",
              date: new Date(dtDocIssuance),
              label: "Doc Issuance",
            }
          : null,
        dtDocSubmissionChb && dtDocSubmission
          ? {
              key: "dtDocSubmission",
              date: new Date(dtDocSubmission),
              label: "Doc Submission",
            }
          : null,
        dtDocOpeningChb && dtDocOpening
          ? {
              key: "dtDocOpening",
              date: new Date(dtDocOpening),
              label: "Doc Opening",
            }
          : null,
      ].filter(Boolean);

      // Validate chronological order for selected dates
      for (let i = 1; i < selectedDates.length; i++) {
        const prev = selectedDates[i - 1];
        const curr = selectedDates[i];
        if (curr.date < prev.date) {
          newErrors[curr.key] =
            `${curr.label} must be same or later than ${prev.label}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSave = async () => {
    if (!validateStep()) return;
    const entity = formData.strTitle?.trim() || "Transaction";
    try {
      setLoading(true);
      onClose();
      await withSpinner(`Updating ${entity}...`, async () => {
        await api.put(`transactions/${transaction.nTransactionId}`, formData);
      });
      await showSwal("SUCCESS", {}, { entity, action: "updated" });
      onSaved?.();
    } catch (error) {
      console.error("❌ Error:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [clientsData, companiesData] = await Promise.all([
          api.get("client/active"),
          api.get("companies"),
        ]);
        setClientOptions(
          (clientsData.clients || []).map((c) => ({
            label: c.strClientName,
            value: c.nClientId,
          }))
        );
        setCompanyOptions(
          (companiesData.companies || []).map((c) => ({
            label: c.strCompanyName,
            value: c.nCompanyId,
          }))
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const { itemType, procMode, procSource } = useMapping();
  const convertToOptions = (obj) =>
    Object.entries(obj || {}).map(([value, label]) => ({ label, value }));
  const itemTypeOptions = convertToOptions(itemType);
  const procModeOptions = convertToOptions(procMode);
  const procSourceOptions = convertToOptions(procSource);

  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return [
          { label: "Transaction Code", name: "strCode", xs: 12 },
          {
            label: "Company",
            name: "nCompanyId",
            xs: 6,
            type: "select",
            options: companyOptions,
          },
          {
            label: "Client",
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
            label: "Mode",
            name: "cProcMode",
            xs: 4,
            type: "select",
            options: procModeOptions,
          },
          {
            label: "Source",
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
            label: "Pre-Bid",
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
            label: "Doc Issuance",
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
            label: "Doc Submission",
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
            label: "Doc Opening",
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
      title="Edit Transaction"
      subTitle={formData.strTitle || ""}
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
        handleChange={handleChange}
        errors={errors}
        autoFocus={`${open}-${activeStep}`} // keep your focus behavior
        onLastFieldTab={() => {
          if (activeStep === steps.length - 1) {
            saveButtonRef.current?.focus();
          } else {
            nextButtonRef.current?.focus();
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
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </Box>
    </ModalContainer>
  );
}

export default EditTransactionModal;
