import React from "react";
import { Box, Typography, Divider, Grid, Paper } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";

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
  if (!open || !transaction) return null;

  const details = transaction;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      width={750}
      showFooter={true}
    >
      <Box
        sx={{
          maxHeight: "70vh",
          overflowY: "auto",
          pr: 1,
          pb: 1,
        }}
      >
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
            <DetailItem label="Procurement Mode" value={details.cProcMode} />
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
      </Box>
    </ModalContainer>
  );
}

export default TransactionInfoModal;
