import React, { useState } from "react";
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
import { AssignAccountOfficerButton } from "../../../../common/Buttons"; // ✅ Correct import

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

function TransactionInfoModal({ open, onClose, transaction }) {
  const [showAssignAO, setShowAssignAO] = useState(false);
  const [selectedAO, setSelectedAO] = useState("");

  if (!open || !transaction) return null;

  const details = transaction;

  const handleAssignClick = () => {
    setShowAssignAO(true);
  };

  const handleBackClick = () => {
    setShowAssignAO(false);
  };

  const handleSaveAO = () => {
    console.log("Assigned AO:", selectedAO);
    // You can later replace this with an API call to save the assigned AO
    setShowAssignAO(false);
  };

  const accountOfficers = [
    { label: "John Doe", value: "john" },
    { label: "Jane Smith", value: "jane" },
    { label: "Carlos Mendoza", value: "carlos" },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={showAssignAO ? "Assign Account Officer" : "Transaction Details"}
      width={750}
      showFooter={true}
      showSave={false} // ✅ hides only the Save button
    >
      <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1, pb: 1 }}>
        {/* 🔹 Transaction Details */}
        {!showAssignAO && (
          <>
            {/* 🟦 Basic Information */}
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

            {/* 🟧 Procurement Details */}
            <InfoSection title="Procurement Details">
              <Grid container spacing={2}>
                <DetailItem label="Item Type" value={details.cItemType} />
                <DetailItem
                  label="Procurement Mode"
                  value={details.cProcMode}
                />
                <DetailItem
                  label="Procurement Source"
                  value={details.cProcSource}
                />
                <DetailItem
                  label="Total ABC"
                  value={
                    details.dTotalABC
                      ? `₱${Number(details.dTotalABC).toLocaleString()}`
                      : null
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
                      ? `${details.dtPreBid}${
                          details.strPreBid_Venue
                            ? ` — ${details.strPreBid_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
                <DetailItem
                  label="Doc Issuance"
                  value={
                    details.dtDocIssuance
                      ? `${details.dtDocIssuance}${
                          details.strDocIssuance_Venue
                            ? ` — ${details.strDocIssuance_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
                <DetailItem
                  label="Doc Submission"
                  value={
                    details.dtDocSubmission
                      ? `${details.dtDocSubmission}${
                          details.strDocSubmission_Venue
                            ? ` — ${details.strDocSubmission_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
                <DetailItem
                  label="Doc Opening"
                  value={
                    details.dtDocOpening
                      ? `${details.dtDocOpening}${
                          details.strDocOpening_Venue
                            ? ` — ${details.strDocOpening_Venue}`
                            : ""
                        }`
                      : null
                  }
                />
              </Grid>
            </InfoSection>

            {/* 🟨 Assign AO Button */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <AssignAccountOfficerButton onClick={handleAssignClick} /> {/* ✅ fixed name */}
            </Box>
          </>
        )}

        {/* 🔸 Assign AO Section */}
        {showAssignAO && (
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
                {accountOfficers.map((officer) => (
                  <MenuItem key={officer.value} value={officer.value}>
                    {officer.label}
                  </MenuItem>
                ))}
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
      </Box>
    </ModalContainer>
  );
}

export default TransactionInfoModal;
