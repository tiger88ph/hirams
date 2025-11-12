import React from "react";
import { Grid, Divider } from "@mui/material";
import InfoSection from "./InfoSection";
import DetailItem from "./DetailItem";

function TransactionDetailsLeft({ details, itemTypeLabel, procModeLabel, procSourceLabel, formatDateTime }) {
  return (
    <InfoSection title="Transaction Details">
      <Grid container spacing={0.1}>
        <DetailItem
          label="Assigned AO"
          value={
            details.user?.strFName
              ? `${details.user.strFName} ${details.user.strLName}`
              : "Not Assigned"
          }
        />
        <DetailItem label="Status" value={details.status || "—"} />
        <Divider sx={{ width: "100%", my: 0.1 }} />
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
        <Divider sx={{ width: "100%", my: 0.1 }} />
        <DetailItem label="Item Type" value={itemTypeLabel} />
        <DetailItem label="Procurement Mode" value={procModeLabel} />
        <DetailItem label="Procurement Source" value={procSourceLabel} />
        <DetailItem
          label="Total ABC"
          value={
            details.dTotalABC
              ? `₱${Number(details.dTotalABC).toLocaleString()}`
              : "—"
          }
        />
        <Divider sx={{ width: "100%", my: 0.1 }} />
        <DetailItem
          label="Pre-Bid"
          value={
            details.dtPreBid
              ? `${formatDateTime(details.dtPreBid)}${details.strPreBid_Venue ? ` — ${details.strPreBid_Venue}` : ""}`
              : "—"
          }
        />
        <DetailItem
          label="Doc Issuance"
          value={
            details.dtDocIssuance
              ? `${formatDateTime(details.dtDocIssuance)}${details.strDocIssuance_Venue ? ` — ${details.strDocIssuance_Venue}` : ""}`
              : "—"
          }
        />
        <DetailItem
          label="Doc Submission"
          value={
            details.dtDocSubmission
              ? `${formatDateTime(details.dtDocSubmission)}${details.strDocSubmission_Venue ? ` — ${details.strDocSubmission_Venue}` : ""}`
              : "—"
          }
        />
        <DetailItem
          label="Doc Opening"
          value={
            details.dtDocOpening
              ? `${formatDateTime(details.dtDocOpening)}${details.strDocOpening_Venue ? ` — ${details.strDocOpening_Venue}` : ""}`
              : "—"
          }
        />
      </Grid>
    </InfoSection>
  );
}

export default TransactionDetailsLeft;
