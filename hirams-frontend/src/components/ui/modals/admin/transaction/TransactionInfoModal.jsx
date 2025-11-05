import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Button,
} from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import {
  AssignAccountOfficerButton,
  VerifyButton,
} from "../../../../common/Buttons";
import RemarksModalCard from "../../../../common/RemarksModalCard"; // ✅ replaced VerificationModalCard
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { showSwal, withSpinner } from "../../../../../utils/swal";

function InfoSection({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2.5,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        backgroundColor: "#fafafa",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          mb: 1.5,
          color: "primary.main",
          textTransform: "uppercase",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function DetailItem({ label, value }) {
  return (
    <Grid item xs={6}>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontWeight: 600, color: "text.primary" }}
      >
        {value || "—"}
      </Typography>
    </Grid>
  );
}

function TransactionInfoModal({ open, onClose, transaction, onUpdated }) {
  const [showAssignAO, setShowAssignAO] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAO, setSelectedAO] = useState("");
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [remarksAssign, setRemarksAssign] = useState("");
  const [remarksVerify, setRemarksVerify] = useState("");
  const [loading, setLoading] = useState(false);
  const { procMode, procSource, itemType } = useMapping();

  // 🟢 Verify modal
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);

  useEffect(() => {
    const fetchAccountOfficers = async () => {
      try {
        const res = await api.get("users");
        const users = res?.users || res?.data?.users || res?.data || [];
        const filtered = users.filter((u) => u.cUserType === "A");
        const formatted = filtered.map((u) => ({
          label: `${u.strFName} ${u.strLName}`,
          value: u.nUserId,
        }));
        setAccountOfficers(formatted);
      } catch (err) {
        console.error("Error fetching Account Officers:", err);
      }
    };
    if (open) fetchAccountOfficers();
  }, [open]);

  if (!open || !transaction) return null;

  const details = transaction;
  const itemTypeLabel = itemType?.[details.cItemType] || details.cItemType;
  const procModeLabel = procMode?.[details.cProcMode] || details.cProcMode;
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  const handleAssignClick = () => setShowAssignAO(true);
  const handleBackClick = () => {
    setShowAssignAO(false);
    setShowConfirm(false);
    setRemarksAssign("");
  };

  const handleSaveAO = () => {
    if (!selectedAO) return;
    setShowConfirm(true);
  };

  const confirmAssignAO = async () => {
    const entity =
      transaction.strTitle || transaction.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();

      await withSpinner(`Assigning Account Officer...`, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.nUserId;
        await api.put(`transactions/${transaction.nTransactionId}/assign`, {
          nAssignedAO: selectedAO,
          user_id: userId,
          remarks: remarksAssign.trim() || null,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "assigned" });

      if (typeof onUpdated === "function") {
        await onUpdated();
      }

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

  const handleVerifyClick = () => {
    setShowVerifyConfirm(true);
    setRemarksVerify("");
  };

  const confirmVerifyTransaction = async () => {
    const entity =
      transaction.strTitle || transaction.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();

      await withSpinner("Verifying Transaction...", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.nUserId;

        await api.put(`transactions/${transaction.nTransactionId}/verify`, {
          userId,
          remarks: remarksVerify.trim() || null,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action: "verified" });

      if (typeof onUpdated === "function") {
        await onUpdated();
      }

      setShowVerifyConfirm(false);
      setRemarksVerify("");
    } catch (error) {
      console.error("❌ Error verifying transaction:", error);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    if (showVerifyConfirm)
      return "Transaction Details / Verify Transaction / Remarks";
    if (showConfirm)
      return "Transaction Details / Assign Account Officer / Remarks";
    if (showAssignAO) return "Transaction Details / Assign Account Officer";
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

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={getHeaderTitle()}
      width={showConfirm || showVerifyConfirm ? 400 : 750}
      showFooter={false}
      loading={loading}
    >
      <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1, pb: 1 }}>
        {/* 🟢 Verify Confirmation Step */}
        {showVerifyConfirm && (
          <RemarksModalCard
            remarks={remarksVerify}
            setRemarks={setRemarksVerify}
            onBack={() => {
              setShowVerifyConfirm(false);
              setRemarksVerify("");
            }}
            onSave={confirmVerifyTransaction}
            title={`Verify Transaction "${
              transaction.strTitle || transaction.transactionName
            }"`}
            placeholder="Optional: Add remarks for verifying this transaction..."
            saveButtonColor="success"
            saveButtonText="Confirm Verification"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}

        {/* ⚠️ Assign AO Confirmation Step */}
        {showConfirm && (
          <RemarksModalCard
            remarks={remarksAssign}
            setRemarks={setRemarksAssign}
            onBack={() => {
              setShowConfirm(false);
              setRemarksAssign("");
            }}
            onSave={confirmAssignAO}
            title="Assign Account Officer"
            placeholder="Optional: Add remarks for this assignment..."
            saveButtonColor="success"
            saveButtonText="Confirm Assignment"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}

        {/* 🧑‍💼 Assign AO Form */}
        {!showConfirm && showAssignAO && !showVerifyConfirm && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
              Select an Account Officer:
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Account Officer</InputLabel>
              <Select
                value={selectedAO}
                label="Account Officer"
                onChange={(e) => setSelectedAO(e.target.value)}
              >
                {accountOfficers.length > 0 ? (
                  accountOfficers.map((officer) => (
                    <MenuItem key={officer.value} value={officer.value}>
                      {officer.label}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Account Officers Found</MenuItem>
                )}
              </Select>
            </FormControl>

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
                disabled={!selectedAO}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}

        {/* 📋 Transaction Info View */}
        {!showAssignAO && !showConfirm && !showVerifyConfirm && (
          <>
            <InfoSection title="Transaction Information">
              <Grid container spacing={2}>
                <DetailItem
                  label="Assigned Account Officer"
                  value={
                    details.user?.strFName
                      ? `${details.user.strFName} ${details.user.strLName}`
                      : "Not Assigned"
                  }
                />
                <DetailItem label="Status" value={details.status || "—"} />
              </Grid>
            </InfoSection>

            <InfoSection title="Basic Information">
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
                  value={details.company?.strCompanyName || details.companyName}
                />
                <DetailItem
                  label="Client"
                  value={details.client?.strClientName || details.clientName}
                />
              </Grid>
            </InfoSection>

            <InfoSection title="Procurement Details">
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
            </InfoSection>

            {/* 🟩 Schedule Details */}
            <InfoSection title="Schedule Details">
              <Grid container spacing={2}>
                <DetailItem
                  label="Pre-Bid"
                  value={
                    details.dtPreBid
                      ? `${formatDateTime(details.dtPreBid)}${
                          details.strPreBid_Venue
                            ? ` — ${details.strPreBid_Venue}`
                            : ""
                        }`
                      : "—"
                  }
                />
                <DetailItem
                  label="Doc Issuance"
                  value={
                    details.dtDocIssuance
                      ? `${formatDateTime(details.dtDocIssuance)}${
                          details.strDocIssuance_Venue
                            ? ` — ${details.strDocIssuance_Venue}`
                            : ""
                        }`
                      : "—"
                  }
                />
                <DetailItem
                  label="Doc Submission"
                  value={
                    details.dtDocSubmission
                      ? `${formatDateTime(details.dtDocSubmission)}${
                          details.strDocSubmission_Venue
                            ? ` — ${details.strDocSubmission_Venue}`
                            : ""
                        }`
                      : "—"
                  }
                />
                <DetailItem
                  label="Doc Opening"
                  value={
                    details.dtDocOpening
                      ? `${formatDateTime(details.dtDocOpening)}${
                          details.strDocOpening_Venue
                            ? ` — ${details.strDocOpening_Venue}`
                            : ""
                        }`
                      : "—"
                  }
                />
              </Grid>
            </InfoSection>

            {/* 🟢 Verify button */}
            {details.status === "Verifying Transaction" &&
              details.status !== "Creating Transaction" && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <VerifyButton onClick={handleVerifyClick} />
                </Box>
              )}

            {/* 🟣 Assign AO button */}
            {details.status === "Assigning Account Officer" && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <AssignAccountOfficerButton onClick={handleAssignClick} />
              </Box>
            )}
          </>
        )}
      </Box>
    </ModalContainer>
  );
}

export default TransactionInfoModal;
