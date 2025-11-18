import React from "react";
import { Box, Typography, Grid, Paper, Divider } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import ModalContainer from "../../../common/ModalContainer";
import AlertBox from "../../../common/AlertBox";
import useMapping from "../../../../utils/mappings/useMapping";

/** -----------------------------
 * Reusable Detail Item Component
 --------------------------------*/
const DetailItem = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
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

/** -----------------------------
 * Main Modal Component
 --------------------------------*/
function ATransactionInfoModal({ open, onClose, transaction: details }) {
  const {
    itemsManagementCode,
    itemsVerificationCode,
    procSource,
    itemType,
    statusTransaction,
    procMode,
  } = useMapping();

  if (!open || !details) return null;

  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  /** -----------------------------
   * Helpers
   --------------------------------*/
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

  const isItemsManagement = Object.keys(itemsManagementCode).includes(
    String(details.status_code)
  );
  const isVerification = Object.keys(itemsVerificationCode).includes(
    String(details.status_code)
  );

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      showSave={false}
    >
      <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
        {isItemsManagement ? (
          <AlertBox>
            Review all encoded information thoroughly before finalizing. It
            cannot be edited afterward.
          </AlertBox>
        ) : (
          ""
        )}
        {isVerification ? (
          <AlertBox>
            This transaction is under verification. You may revert it only if
            corrections are required.
          </AlertBox>
        ) : (
          ""
        )}

        {/* -------- Transaction -------- */}
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
            // value={statusTransaction?.[details.current_status] || "—"}
            value={statusTransaction?.[details.current_status] || "—"}
          />

          <DetailItem
            label="Account Officer Due Date"
            value={
              details.dtAODueDate ? formatDateTime(details.dtAODueDate) : "—"
            }
          />
        </Grid>

        {/* -------- Basic Info -------- */}
        <Typography
          variant="subtitle2"
          sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
        >
          Basic Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <DetailItem label="Transaction Code" value={details.strCode} />
          <DetailItem label="Title" value={details.strTitle} />
          <DetailItem
            label="Company"
            value={details.company?.strCompanyNickName}
          />
          <DetailItem
            label="Client"
            value={details.client?.strClientNickName}
          />
        </Grid>

        {/* -------- Procurement -------- */}
        <Typography
          variant="subtitle2"
          sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
        >
          Procurement
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <DetailItem
            label="Item Type"
            value={itemType?.[details.cItemType] || details.cItemType}
          />
          <DetailItem
            label="Procurement Mode"
            value={procMode?.[details.cProcMode] || details.cProcMode}
          />
          <DetailItem label="Procurement Source" value={procSourceLabel} />
          <DetailItem
            label="Total ABC"
            value={
              details.dTotalABC
                ? `₱${Number(details.dTotalABC).toLocaleString()}`
                : "—"
            }
          />
        </Grid>

        {/* -------- Schedule -------- */}
        <Typography
          variant="subtitle2"
          sx={{ color: "primary.main", fontWeight: 600, mt: 3, mb: 1 }}
        >
          Schedule
        </Typography>
        <Divider sx={{ mb: 2 }} />

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
      </Paper>
    </ModalContainer>
  );
}

export default ATransactionInfoModal;
