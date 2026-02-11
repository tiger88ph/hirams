import React, { useState, useEffect, useRef } from "react";
import { Stepper, Step, StepLabel, Box, Typography, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ModalContainer from "../../../common/ModalContainer";
import FormGrid from "../../../common/FormGrid";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";
const steps = ["Basic Information", "Procurement Details", "Schedule Details"];

function TransactionAEModal({
  open,
  onClose,
  transaction,
  onSaved,
  itemType,
  procMode,
  procSource,
}) {
  const navigate = useNavigate();
  const isEditMode = !!transaction;

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    nCompanyId: "",
    nClientId: "",
    strTitle: "",
    strRefNumber: "",
    dTotalABC: "",
    cItemType: "",
    cProcMode: "",
    cProcSource: "",
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
    nAssignedAO: "",
  });

  const [errors, setErrors] = useState({});
  const [clientOptions, setClientOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveButtonRef = useRef(null);
  const nextButtonRef = useRef(null);

  const convertToOptions = (obj) =>
    Object.entries(obj || {}).map(([value, label]) => ({ label, value }));

  const itemTypeOptions = convertToOptions(itemType);
  const procModeOptions = convertToOptions(procMode);
  const procSourceOptions = convertToOptions(procSource);

  const formatForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    if (
      isEditMode &&
      transaction &&
      clientOptions.length > 0 &&
      companyOptions.length > 0
    ) {
      setFormData({
        nCompanyId: transaction.company?.nCompanyId || "",
        nClientId: transaction.client?.nClientId || "",
        nAssignedAO: transaction.nAssignedAO || "",
        strTitle: transaction.strTitle || "",
        strRefNumber: transaction.strRefNumber || "",
        dTotalABC: transaction.dTotalABC || "",
        cItemType: transaction.cItemType || "",
        cProcMode: transaction.cProcMode || "",
        cProcSource: transaction.cProcSource || "",
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
  }, [transaction, isEditMode, clientOptions, companyOptions]);

  useEffect(() => {
    (async () => {
      try {
        const [clientsData, companiesData] = await Promise.all([
          api.get("client/active"),
          api.get("companies"),
        ]);
        setClientOptions(
          (clientsData.clients || []).map((c) => ({
            label: c.strClientNickName,
            value: c.nClientId,
          })),
        );
        setCompanyOptions(
          (companiesData.companies || []).map((c) => ({
            label: c.strCompanyNickName,
            value: c.nCompanyId,
          })),
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const getLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let updated = { ...prev };

      if (type === "checkbox") {
        updated[name] = checked;

        const checkboxMap = {
          dtPreBidChb: ["dtPreBid", "strPreBid_Venue"],
          dtDocIssuanceChb: ["dtDocIssuance", "strDocIssuance_Venue"],
          dtDocSubmissionChb: ["dtDocSubmission", "strDocSubmission_Venue"],
          dtDocOpeningChb: ["dtDocOpening", "strDocOpening_Venue"],
        };

        if (checkboxMap[name]) {
          const [dateField, venueField] = checkboxMap[name];

          if (checked) {
            updated[dateField] = getLocalDateTime();
          } else {
            updated[dateField] = "";
            updated[venueField] = "";
          }
        }

        return updated;
      }

      updated[name] = value;
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 0) {
      if (!formData.strCode?.trim())
        stepErrors.strCode = "Transaction Code is required";
      if (!formData.nCompanyId) stepErrors.nCompanyId = "Company is required";
      if (!formData.nClientId) stepErrors.nClientId = "Client is required";
    }

    if (step === 1) {
      if (!formData.strTitle?.trim()) stepErrors.strTitle = "Title is required";
      if (!formData.cItemType) stepErrors.cItemType = "Item Type is required";
      if (!formData.cProcMode)
        stepErrors.cProcMode = "Procurement Mode is required";
      if (!formData.cProcSource)
        stepErrors.cProcSource = "Procurement Source is required";
    }

    if (step === 2) {
      const {
        dtPreBidChb,
        dtDocIssuanceChb,
        dtDocSubmissionChb,
        dtDocOpeningChb,
        dtPreBid,
        dtDocIssuance,
        dtDocSubmission,
        dtDocOpening,
      } = formData;

      if (dtPreBidChb && !dtPreBid)
        stepErrors.dtPreBid = "Pre-Bid Date is required";
      if (dtDocIssuanceChb && !dtDocIssuance)
        stepErrors.dtDocIssuance = "Doc Issuance Date is required";
      if (dtDocSubmissionChb && !dtDocSubmission)
        stepErrors.dtDocSubmission = "Doc Submission Date is required";
      if (dtDocOpeningChb && !dtDocOpening)
        stepErrors.dtDocOpening = "Doc Opening Date is required";

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

      for (let i = 1; i < selectedDates.length; i++) {
        const prev = selectedDates[i - 1];
        const curr = selectedDates[i];
        if (curr.date < prev.date) {
          stepErrors[curr.key] =
            `${curr.label} must be same or later than ${prev.label}`;
        }
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleOnSave = () => {
    if (activeStep < steps.length - 1) {
      handleNext();
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!validateStep(2)) return;
    const entity = formData.strTitle?.trim() || "Transaction";

    try {
      setLoading(true);
      onClose();

      if (isEditMode) {
        await withSpinner(`Updating ${entity}...`, async () => {
          await api.put(`transactions/${transaction.nTransactionId}`, formData);
        });
        await showSwal("SUCCESS", {}, { entity, action: "updated" });
      } else {
        await withSpinner(entity, async () => {
          const user = JSON.parse(localStorage.getItem("user"));
          await api.post("transactions", {
            ...formData,
            nUserId: user.nUserId,
          });
        });
        await showSwal("SUCCESS", {}, { entity, action: "added" });
      }

      onSaved?.();
      setActiveStep(0);
    } catch (error) {
      console.error(error);
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
            label: "Company",
            name: "nCompanyId",
            type: "select",
            options: companyOptions,
            xs: 6,
          },
          {
            label: "Client",
            name: "nClientId",
            type: "select",
            options: clientOptions,
            xs: 6,
          },
        ];
      case 1:
        return [
          { label: "Title", name: "strTitle", xs: 12 },
          {
            label: "Item Type",
            name: "cItemType",
            type: "select",
            options: itemTypeOptions,
            xs: 3,
          },
          {
            label: "Mode",
            name: "cProcMode",
            type: "select",
            options: procModeOptions,
            xs: 4,
          },
          {
            label: "Source",
            name: "cProcSource",
            type: "select",
            options: procSourceOptions,
            xs: 5,
          },
          { label: "Reference Number", name: "strRefNumber", xs: 6 },
          { label: "Total ABC", name: "dTotalABC", type: "number", xs: 6 },
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
            disabled: !formData.dtPreBidChb,
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
            disabled: !formData.dtDocIssuanceChb,
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
            disabled: !formData.dtDocSubmissionChb,
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
            disabled: !formData.dtDocOpeningChb,
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
      title={isEditMode ? "Edit Transaction" : "Add Transaction"}
      subTitle={formData.strCode?.trim() ? `/ ${formData.strCode.trim()}` : ""}
      loading={loading}
      onSave={handleOnSave}
      onCancel={() => {
        if (activeStep > 0) {
          handleBack();
        } else {
          onClose();
        }
      }}
      width={900}
      cancelLabel={activeStep > 0 ? "Previous" : "Cancel"}
      saveLabel={activeStep < steps.length - 1 ? "Next" : "Save"}
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
        autoFocus={`${open}-${activeStep}`}
        onLastFieldTab={() => {
          if (activeStep === steps.length - 1) {
            saveButtonRef.current?.focus();
          } else {
            nextButtonRef.current?.focus();
          }
        }}
      />

      {activeStep === 0 && (
        <Box sx={{ textAlign: "right", mt: 1 }}>
          <Typography variant="caption">
            New Client?{" "}
            <Link
              component="button"
              underline="hover"
              color="primary"
              onClick={() => {
                onClose();
                navigate("/p-client?add=true");
              }}
            >
              Click here
            </Link>
          </Typography>
        </Box>
      )}
    </ModalContainer>
  );
}

export default TransactionAEModal;
