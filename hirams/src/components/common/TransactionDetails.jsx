import React from "react";
import { Typography, Divider, Grid, Box, Chip } from "@mui/material";
import { getDueDateColor } from "../../utils/helpers/dueDateColor";

// Section header icons
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

// Field-level icons
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import TitleOutlinedIcon from "@mui/icons-material/TitleOutlined";
import TagOutlinedIcon from "@mui/icons-material/TagOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  220: "success",
  210: "warning",
  200: "info",
  default: "default",
};

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return isNaN(date)
    ? null
    : date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, showTopDivider = true }) {
  return (
    <>
      {showTopDivider && <Divider sx={{ mb: 1 }} />} {/* ← conditional */}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Icon sx={{ fontSize: 15, color: "text.secondary", opacity: 0.7 }} />
        <Typography
          variant="overline"
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "text.secondary",
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>

      <Divider sx={{ mb: 1.75 }} />
    </>
  );
}
function FieldItem({ label, icon: Icon, children, xs = 12, sm = 6 }) {
  return (
    <Grid item xs={xs} sm={sm}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.5 }}>
        {Icon && (
          <Icon
            sx={{
              fontSize: 12,
              color: "text.secondary",
              opacity: 0.55,
              flexShrink: 0,
            }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        component="div"
        variant="body2"
        sx={{ color: "text.primary", lineHeight: 1.5, ml: 2 }}
      >
        {children ?? "—"}
      </Typography>
    </Grid>
  );
}

// ─── Schedule Card ────────────────────────────────────────────────────────────

const SCHEDULE_COLORS = [
  "primary.main",
  "success.main",
  "warning.main",
  "text.disabled",
];

function ScheduleCard({ label, date, venue, dotColor, dateColor }) {
  const hasDate = Boolean(date);
  const hasVenue = Boolean(venue);

  return (
    <Box
      sx={{
        bgcolor: "action.hover",
        border: "0.5px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      {/* Step label row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            ...(hasDate
              ? { bgcolor: dotColor }
              : {
                  bgcolor: "transparent",
                  border: "1.5px solid",
                  borderColor: "text.disabled",
                }),
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Date row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        <AccessTimeOutlinedIcon
          sx={{
            fontSize: 12,
            color: "text.disabled",
            opacity: hasDate ? 0.55 : 0.35,
            flexShrink: 0,
          }}
        />
        {hasDate ? (
          <Typography
            variant="body2"
            sx={{
              color: dateColor ?? "text.primary",
              fontWeight: dateColor ? 600 : 400,
              lineHeight: 1.4,
              fontSize: "0.78rem",
            }}
          >
            {date}
          </Typography>
        ) : (
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontStyle: "italic" }}
          >
            No date attached
          </Typography>
        )}
      </Box>

      {/* Venue row */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
        <PlaceOutlinedIcon
          sx={{
            fontSize: 12,
            color: "text.disabled",
            opacity: hasVenue ? 0.55 : 0.35,
            mt: "1px",
            flexShrink: 0,
          }}
        />
        {hasVenue ? (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1.3 }}
          >
            {venue}
          </Typography>
        ) : (
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontStyle: "italic" }}
          >
            No venue attached
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const TransactionDetails = ({
  details,
  statusTransaction,
  itemType,
  procMode,
  procSourceLabel,
  showTransactionDetails,
}) => {
  const scheduleKeys = ["PreBid", "DocIssuance", "DocSubmission", "DocOpening"];

  const effectiveStatus =
    details.current_status === 225 ? 220 : details.current_status;

  const statusColor = STATUS_COLOR[effectiveStatus] ?? STATUS_COLOR.default;

  const officerName =
    `${details.user?.strFName || ""} ${details.user?.strLName || ""}`.trim() ||
    "Not Assigned";

  const aoDueDateColor = getDueDateColor(details.dtAODueDate);

  return (
    <Box sx={{ "& .MuiGrid-item": { pt: 1.5 } }}>
      {/* ── Transaction ──────────────────────────────────────────── */}
      {showTransactionDetails && (
        <Box sx={{ mb: 3 }}>
          <SectionHeader   showTopDivider={false} icon={AssignmentOutlinedIcon} label="Transaction" />
          <Grid container spacing={0}>
            <FieldItem
              label="Assigned Account Officer"
              icon={BadgeOutlinedIcon}
              xs={12}
              sm={4}
            >
              {officerName}
            </FieldItem>
            <FieldItem label="Status" icon={FlagOutlinedIcon} xs={12} sm={4}>
              <Chip
                label={statusTransaction?.[effectiveStatus] || "—"}
                color={statusColor}
                size="small"
                sx={{ fontSize: "0.65rem", height: 20, fontWeight: 600 }}
              />
            </FieldItem>
            <FieldItem
              label="Account Officer Due Date"
              icon={EventOutlinedIcon}
              xs={12}
              sm={4}
            >
              {details.dtAODueDate ? (
                <span
                  style={{
                    color: aoDueDateColor ?? "inherit",
                    fontWeight: aoDueDateColor ? 600 : 400,
                  }}
                >
                  {formatDateTime(details.dtAODueDate)}
                </span>
              ) : (
                "—"
              )}
            </FieldItem>
          </Grid>
        </Box>
      )}

      {/* ── Basic Information ────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <SectionHeader showTopDivider={false}  icon={PersonOutlineIcon} label="Basic Information" />
        <Grid container spacing={0}>
          <FieldItem label="Title" icon={TitleOutlinedIcon} xs={12} sm={12}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {details.strTitle || details.transactionName || "—"}
            </Typography>
          </FieldItem>
          <FieldItem
            label="Transaction Code"
            icon={TagOutlinedIcon}
            xs={12}
            sm={4}
          >
            {details.strCode || details.transactionId || "—"}
          </FieldItem>
          <FieldItem
            label="Company"
            icon={ApartmentOutlinedIcon}
            xs={12}
            sm={4}
          >
            {details.company?.strCompanyNickName ||
              details.companyNickName ||
              "—"}
          </FieldItem>
          <FieldItem label="Client" icon={GroupOutlinedIcon} xs={12} sm={4}>
            {details.client?.strClientNickName || details.clientNickName || "—"}
          </FieldItem>
        </Grid>
      </Box>

      {/* ── Procurement ──────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <SectionHeader icon={ShoppingCartOutlinedIcon} label="Procurement" />
        <Grid container spacing={0}>
          <FieldItem
            label="Item Type"
            icon={CategoryOutlinedIcon}
            xs={12}
            sm={3}
          >
            {itemType?.[details.cItemType] || details.cItemType || "—"}
          </FieldItem>
          <FieldItem
            label="Procurement Mode"
            icon={GavelOutlinedIcon}
            xs={12}
            sm={3}
          >
            {procMode?.[details.cProcMode] || details.cProcMode || "—"}
          </FieldItem>
          <FieldItem
            label="Procurement Source"
            icon={AccountBalanceOutlinedIcon}
            xs={12}
            sm={3}
          >
            {procSourceLabel || "—"}
          </FieldItem>
          <FieldItem
            label="Total ABC"
            icon={MonetizationOnOutlinedIcon}
            xs={12}
            sm={3}
          >
            {details.dTotalABC ? (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  ₱{Number(details.dTotalABC).toLocaleString()}
                </Typography>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                />
              </Box>
            ) : (
              "—"
            )}
          </FieldItem>
        </Grid>
      </Box>

      {/* ── Schedule ─────────────────────────────────────────────── */}
      <Box>
        <SectionHeader icon={CalendarTodayOutlinedIcon} label="Schedule" />
        <Grid container spacing={1.25}>
          {scheduleKeys.map((key, idx) => {
            const dateKey = `dt${key}`;
            const venueKey = `str${key}_Venue`;
            const label = key.replace(/([A-Z])/g, " $1").trim();
            const rawDate = details[dateKey];
            const dateColor = getDueDateColor(rawDate);

            return (
              <Grid item xs={12} sm={6} lg={3} key={key}>
                <ScheduleCard
                  label={label}
                  date={rawDate ? formatDateTime(rawDate) : null}
                  venue={details[venueKey] || null}
                  dotColor={SCHEDULE_COLORS[idx] ?? "text.disabled"}
                  dateColor={dateColor}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default TransactionDetails;
