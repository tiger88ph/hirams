import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, Button, Divider } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import {
  AssignAccountOfficerButton,
  ReassignAccountOfficerButton,
  VerifyButton,
  RevertButton1,
} from "../../../../common/Buttons";
import FormGrid from "../../../../common/FormGrid";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function DetailItem({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography
        variant="body2"
        sx={{ color: "text.primary", fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontStyle: "italic", color: "text.secondary" }}
      >
        {value || "—"}
      </Typography>
    </Grid>
  );
}

function TransactionInfoModal({ open, onClose, transaction, onUpdated }) {
  const [showAssignAO, setShowAssignAO] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    nAssignedAO: "",
    dtAODueDate: "",
  });
  const [assignErrors, setAssignErrors] = useState({});
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [remarksAssign, setRemarksAssign] = useState("");
  const [remarksVerify, setRemarksVerify] = useState("");
  const [remarksRevert, setRemarksRevert] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReassignAO, setShowReassignAO] = useState(false);
  const [showReassignConfirm, setShowReassignConfirm] = useState(false);
  const [remarksReassign, setRemarksReassign] = useState("");

  const { procMode, procSource, itemType, statusTransaction } = useMapping();

  useEffect(() => {
    if (!open) return;

    const fetchAccountOfficers = async () => {
      try {
        const res = await api.get("users");
        const users = res?.users || res?.data?.users || res?.data || [];
        const formatted = users
          .filter((u) => u.cUserType === "A")
          .map((u) => ({
            label: `${u.strFName} ${u.strLName}`,
            value: u.nUserId,
          }));
        setAccountOfficers(formatted);
      } catch (err) {
        console.error("Error fetching Account Officers:", err);
      }
    };

    fetchAccountOfficers();
  }, [open]);

  if (!open || !transaction) return null;

  const details = transaction;

  // Add this state
  const [selectedAOName, setSelectedAOName] = useState("");

  // Update handleAssignChange to also store the AO name
  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));

    if (name === "nAssignedAO") {
      const selected = accountOfficers.find((ao) => ao.value === value);
      setSelectedAOName(selected ? selected.label : "");
    }
  };

  const handleAssignClick = () => {
    // set current date/time in proper format
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    setAssignForm({ nAssignedAO: "", dtAODueDate: formattedNow });

    // Keep remarks empty
    setRemarksAssign("");

    setShowAssignAO(true);
  };

  const handleVerifyClick = () => {
    // Keep remarks empty
    setRemarksVerify("");

    setShowVerifyConfirm(true);
  };

  const handleRevertClick = () => {
    // Keep remarks empty
    setRemarksRevert("");

    setShowRevertConfirm(true);
  };
  const handleReassignClick = () => {
    // set current date/time in proper format
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    setAssignForm({ nAssignedAO: "", dtAODueDate: formattedNow });

    setRemarksReassign(""); // keep remarks empty
    setShowReassignAO(true);
  };

  const handleBackReassign = () => {
    setShowReassignAO(false);
    setShowReassignConfirm(false);
    setRemarksReassign("");
  };
  const confirmReassignAO = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();
      await withSpinner("Reassigning Account Officer...", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/reassign`, {
          nAssignedAO: assignForm.nAssignedAO,
          dtAODueDate: assignForm.dtAODueDate,
          user_id: user?.nUserId,
          remarks: remarksReassign.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "reassigned" });
      onUpdated?.();
      setShowReassignAO(false);
      setShowReassignConfirm(false);
      setRemarksReassign("");
    } catch (error) {
      console.error("❌ Error reassigning AO:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setShowAssignAO(false);
    setShowConfirm(false);
    setRemarksAssign("");
  };

  const handleSaveAO = () => {
    const { nAssignedAO, dtAODueDate } = assignForm;
    if (!nAssignedAO || !dtAODueDate) return;

    if (details.dtDocSubmission) {
      const submissionDate = new Date(details.dtDocSubmission);
      const aoDueDate = new Date(dtAODueDate);

      // Calculate 4 days before submission
      const maxDueDate = new Date(submissionDate);
      maxDueDate.setDate(submissionDate.getDate() - 4);

      if (aoDueDate > maxDueDate) {
        setAssignErrors({
          dtAODueDate: `AO Due Date must be at least 4 days before Document Submission (${maxDueDate.toLocaleDateString()})`,
        });
        return;
      }
    }

    setAssignErrors({});
    setShowConfirm(true);
  };

  const handleSaveReassign = () => {
    const { nAssignedAO, dtAODueDate } = assignForm;
    if (!nAssignedAO || !dtAODueDate) return;

    if (details.dtDocSubmission) {
      const submissionDate = new Date(details.dtDocSubmission);
      const aoDueDate = new Date(dtAODueDate);

      const maxDueDate = new Date(submissionDate);
      maxDueDate.setDate(submissionDate.getDate() - 4);

      if (aoDueDate > maxDueDate) {
        setAssignErrors({
          dtAODueDate: `AO Due Date must be at least 4 days before Document Submission (${maxDueDate.toLocaleDateString()})`,
        });
        return;
      }
    }

    setAssignErrors({});
    setShowReassignConfirm(true);
  };

  const confirmAssignAO = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();
      await withSpinner("Assigning Account Officer...", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/assign`, {
          nAssignedAO: assignForm.nAssignedAO,
          dtAODueDate: assignForm.dtAODueDate,
          user_id: user?.nUserId,
          remarks: remarksAssign.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "assigned" });
      onUpdated?.();
      setShowAssignAO(false);
      setShowConfirm(false);
      setRemarksAssign("");
    } catch (error) {
      console.error("❌ Error assigning AO:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const confirmVerifyTransaction = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";
    try {
      setLoading(true);
      onClose();
      await withSpinner("Verifying Transaction...", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/verify`, {
          userId: user?.nUserId,
          remarks: remarksVerify.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "verified" });
      onUpdated?.();
      setShowVerifyConfirm(false);
      setRemarksVerify("");
    } catch (error) {
      console.error("❌ Error verifying transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const confirmRevertTransaction = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";
    try {
      setLoading(true);
      onClose();
      await withSpinner("Reverting Transaction...", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/revert`, {
          userId: user?.nUserId,
          remarks: remarksRevert.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "reverted" });
      onUpdated?.();
      setShowRevertConfirm(false);
      setRemarksRevert("");
    } catch (error) {
      console.error("❌ Error reverting transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    if (showVerifyConfirm) return "Verify Transaction";
    if (showRevertConfirm) return "Revert Transaction";
    if (showConfirm || showAssignAO) return "Assign Account Officer";
    return "Transaction Details";
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const assignAOFields = [
    {
      name: "nAssignedAO",
      label: "Account Officer",
      type: "select",
      xs: 12,
      options: accountOfficers,
    },
    {
      name: "dtAODueDate",
      label: "Due Date",
      type: "datetime-local",
      xs: 12,
    },
  ];

  const itemTypeLabel = itemType?.[details.cItemType] || details.cItemType;
  const procModeLabel = procMode?.[details.cProcMode] || details.cProcMode;
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={getHeaderTitle()}
      showSave={false}
      loading={loading}
    >
      <Box>
        {showReassignConfirm && (
          <RemarksModalCard
            remarks={remarksReassign}
            setRemarks={setRemarksReassign}
            onBack={handleBackReassign}
            onSave={confirmReassignAO}
            title={`Remarks for reassigning "${details.strTitle || details.transactionName}" to "${selectedAOName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="success"
            saveButtonText="Confirm Reassignment"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {/* REASSIGN FORM */}
        {showReassignAO && !showReassignConfirm && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Reassign an Account Officer
            </Typography>
            <FormGrid
              fields={assignAOFields}
              formData={assignForm}
              errors={assignErrors}
              handleChange={handleAssignChange}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
                gap: 1.5,
              }}
            >
              <Button variant="outlined" onClick={handleBackReassign}>
                Back
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSaveReassign}
                disabled={!assignForm.nAssignedAO || !assignForm.dtAODueDate}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}
        {/* REMARKS MODALS */}
        {showVerifyConfirm && (
          <RemarksModalCard
            remarks={remarksVerify}
            setRemarks={setRemarksVerify}
            onBack={() => setShowVerifyConfirm(false)}
            onSave={confirmVerifyTransaction}
            title={`Remarks for verifying "${details.strTitle || details.transactionName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="success"
            saveButtonText="Confirm Verification"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {showRevertConfirm && (
          <RemarksModalCard
            remarks={remarksRevert}
            setRemarks={setRemarksRevert}
            onBack={() => setShowRevertConfirm(false)}
            onSave={confirmRevertTransaction}
            title={`Remarks for reverting "${details.strTitle || details.transactionName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="error"
            saveButtonText="Confirm Revert"
            icon={
              <WarningAmberRoundedIcon color="error" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {showConfirm && (
          <RemarksModalCard
            remarks={remarksAssign}
            setRemarks={setRemarksAssign}
            onBack={() => setShowConfirm(false)}
            onSave={confirmAssignAO}
            title={`Remarks for assigning "${details.strTitle || details.transactionName}" to "${selectedAOName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="success"
            saveButtonText="Confirm Assignment"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {/* ASSIGN AO FORM */}
        {showAssignAO &&
          !showConfirm &&
          !showVerifyConfirm &&
          !showRevertConfirm && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Assign an Account Officer
              </Typography>
              <FormGrid
                fields={assignAOFields}
                formData={assignForm}
                errors={assignErrors} // <-- this now contains the due date error
                handleChange={handleAssignChange}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 3,
                  gap: 1.5,
                }}
              >
                <Button variant="outlined" onClick={handleBackClick}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveAO}
                  disabled={!assignForm.nAssignedAO || !assignForm.dtAODueDate}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )}
        {/* MAIN DETAILS VIEW */}
        {!showAssignAO &&
          !showConfirm &&
          !showVerifyConfirm &&
          !showRevertConfirm &&
          !showReassignAO &&
          !showReassignConfirm && (
            <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
              {/* Transaction */}
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}
              >
                Transaction
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <DetailItem
                  label="Assigned Account Officer"
                  value={
                    details.user?.strFName
                      ? `${details.user.strFName} ${details.user.strLName}`
                      : "Not Assigned"
                  }
                />
                <DetailItem
                  label="Status"
                  value={statusTransaction?.[details.current_status] || "—"}
                />
              </Grid>

              {/* Basic Info */}
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
              >
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <DetailItem
                  label="Transaction Code"
                  value={details.strCode || details.transactionId}
                />
                <DetailItem
                  label="Title"
                  value={details.strTitle || details.transactionName}
                />
                <DetailItem
                  label="Company"
                  value={
                    details.company?.strCompanyNickName ||
                    details.companyNickName
                  }
                />
                <DetailItem
                  label="Client"
                  value={
                    details.client?.strClientNickName || details.clientNickName
                  }
                />
              </Grid>

              {/* Procurement */}
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
              >
                Procurement
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <DetailItem label="Item Type" value={itemTypeLabel} />
                <DetailItem label="Procurement Mode" value={procModeLabel} />
                <DetailItem
                  label="Procurement Source"
                  value={procSourceLabel}
                />
                <DetailItem
                  label="Total ABC"
                  value={
                    details.dTotalABC
                      ? `₱${Number(details.dTotalABC).toLocaleString()}`
                      : "—"
                  }
                />
              </Grid>

              {/* Schedule */}
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
              >
                Schedule
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {["PreBid", "DocIssuance", "DocSubmission", "DocOpening"].map(
                  (key) => (
                    <DetailItem
                      key={key}
                      label={key.replace(/([A-Z])/g, " $1").trim()}
                      value={
                        details[`dt${key}`]
                          ? `${formatDateTime(details[`dt${key}`])}${details[`str${key}_Venue`] ? ` — ${details[`str${key}_Venue`]}` : ""}`
                          : "—"
                      }
                    />
                  )
                )}
              </Grid>
              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 4,
                  gap: 2,
                }}
              >
                {details.status === "Finalized" && (
                  <VerifyButton onClick={handleVerifyClick} />
                )}
                {details.status === "For Assignment" && (
                  <AssignAccountOfficerButton onClick={handleAssignClick} />
                )}
                {/* Show Reassign button only if there is an assigned AO */}
                {details.user?.strFName && (
                  <ReassignAccountOfficerButton onClick={handleReassignClick} />
                )}
                {details.status !== "Draft" && (
                  <RevertButton1 onClick={handleRevertClick} />
                )}
              </Box>
            </Paper>
          )}
      </Box>
    </ModalContainer>
  );
}

export default TransactionInfoModal;
