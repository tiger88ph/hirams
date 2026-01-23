import React from "react";
import { Typography, Divider, Grid } from "@mui/material";

/**
 * Props:
 * - details: object containing all transaction info
 * - statusTransaction: object mapping status codes
 * - itemType: object mapping item types
 * - procMode: object mapping procurement modes
 * - procSourceLabel: string
 */

function DetailItem({ label, value, xs = 12, sm = 6 }) {
  return (
    <Grid item xs={xs} sm={sm}>
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

const TransactionDetails = ({
  details,
  statusTransaction,
  itemType,
  procMode,
  procSourceLabel,
  showTransactionDetails,
}) => {
  const scheduleKeys = ["PreBid", "DocIssuance", "DocSubmission", "DocOpening"];
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date)
      ? "—"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
  };

  return (
    <>
      {/* -------- Transaction -------- */}
      {showTransactionDetails && (
        <>

          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Transaction
          </Typography>
          <Divider sx={{ mt: 1, mb: 1 }} />

          <Grid container spacing={2}>
            <DetailItem
              label="Assigned Account Officer"
              value={
                `${details.user?.strFName || ""} ${details.user?.strLName || ""}`.trim() ||
                "Not Assigned"
              }
              xs={12}
              sm={4}
            />
            <DetailItem
              label="Status"
              value={statusTransaction?.[details.current_status] || "—"}
              xs={12}
              sm={4}
            />
            <DetailItem
              label="Account Officer Due Date"
              value={
                details.dtAODueDate ? formatDateTime(details.dtAODueDate) : "—"
              }
              xs={12}
              sm={4}
            />
          </Grid>
          <Divider sx={{ mt: 2, mb: 1 }} />
        </>
      )}
      <Typography
        variant="subtitle2"
        sx={{ color: "primary.main", fontWeight: 600 }}
      >
        Basic Information
      </Typography>
      <Divider sx={{ mt: 1, mb: 1 }} />
      <Grid container spacing={2}>
        <DetailItem
          label="Title"
          value={details.strTitle || details.transactionName || "—"}
          xs={12}
          sm={12}
        />
        <DetailItem
          label="Transaction Code"
          value={details.strCode || details.transactionId || "—"}
          xs={12}
          sm={4}
        />
        <DetailItem
          label="Company"
          value={
            details.company?.strCompanyNickName ||
            details.companyNickName ||
            "—"
          }
          xs={12}
          sm={4}
        />
        <DetailItem
          label="Client"
          value={
            details.client?.strClientNickName || details.clientNickName || "—"
          }
          xs={12}
          sm={4}
        />
      </Grid>
      <Divider sx={{ mt: 2, mb: 1 }} />
      {/* -------- Procurement -------- */}
      <Typography
        variant="subtitle2"
        sx={{ color: "primary.main", fontWeight: 600 }}
      >
        Procurement
      </Typography>
      <Divider sx={{ mt: 1, mb: 1 }} />
      <Grid container spacing={2}>
        <DetailItem
          label="Item Type"
          value={itemType?.[details.cItemType] || details.cItemType || "—"}
          xs={12}
          sm={3}
        />
        <DetailItem
          label="Procurement Mode"
          value={procMode?.[details.cProcMode] || details.cProcMode || "—"}
          xs={12}
          sm={3}
        />
        <DetailItem
          label="Procurement Source"
          value={procSourceLabel || "—"}
          xs={12}
          sm={3}
        />
        <DetailItem
          label="Total ABC"
          value={
            details.dTotalABC
              ? `₱${Number(details.dTotalABC).toLocaleString()}`
              : "—"
          }
          xs={12}
          sm={3}
        />
      </Grid>
      <Divider sx={{ mt: 2, mb: 1 }} />
      {/* -------- Schedule -------- */}
      <Typography
        variant="subtitle2"
        sx={{ color: "primary.main", fontWeight: 600 }}
      >
        Schedule
      </Typography>
      <Grid container spacing={2}>
        {scheduleKeys.map((key) => {
          const dateKey = `dt${key}`;
          const venueKey = `str${key}_Venue`;
          const label = key.replace(/([A-Z])/g, " $1").trim();
          const value = details[dateKey] ? (
            <>
              {formatDateTime(details[dateKey])}
              {details[venueKey] && (
                <>
                  <br />
                  <span
                    style={{
                      fontSize: "0.675rem",
                      margin: 0,
                      lineHeight: ".5",
                      display: "block",
                    }}
                  >
                    Venue: {details[venueKey]?.toUpperCase()}
                  </span>
                </>
              )}
            </>
          ) : (
            "—"
          );

          return (
            <DetailItem key={key} label={label} value={value} xs={12} sm={6} />
          );
        })}
      </Grid>
    </>
  );
};

export default TransactionDetails;
