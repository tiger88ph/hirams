import React from "react";
import { useTheme } from "@mui/material";
import {
  Tabs,
  Tab,
  Grid,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Typography,
} from "@mui/material";
import { Settings } from "@mui/icons-material";
import PageLayout from "../../../layouts/page/content-page";
import CustomSearchField from "../../../components/form/SearchField";
import getThemeColors from "../../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — pulls ONLY tokens THIS component actually uses
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  pageBg: c.slate.outerBg,
  cardBg: c.slate.btnBg,
  border: c.slate.border,
  textSecondary: c.gray.textSecondary,
  textPrimary: c.gray.textPrimary,
  textDisabled: c.gray.textDisabled,
  shadow: "0 1px 2px rgba(0,0,0,0.05)",
  rounded: "0.5rem",
});

// ─────────────────────────────────────────────────────────────────────
// GENERAL SETTINGS PANEL
// ─────────────────────────────────────────────────────────────────────
function GeneralSettingsPanel({ colors }) {
  const [form, setForm] = React.useState({
    orgName: "",
    supportEmail: "",
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    language: "en",
    sessionTimeout: 30,
    maintenanceMode: false,
    allowNewRegistrations: true,
    twoFactorRequired: false,
  });

  const handleChange = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // wire this to your update API / mutation
    console.log("Saving general settings:", form);
  };

  const sectionTitleSx = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
    mb: 1.5,
  };

  const helperSx = {
    fontSize: 11.5,
    color: colors.textDisabled,
    mt: 0.5,
  };

  return (
    <div style={{ padding: "24px" }}>
      <Typography sx={sectionTitleSx}>Organization</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Title"
            value={form.orgName}
            onChange={handleChange("orgName")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Subtitle"
            type="email"
            value={form.supportEmail}
            onChange={handleChange("supportEmail")}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: colors.border }} />

      {/* ── System State ─────────────────────────────────────── */}
      <Typography sx={sectionTitleSx}>System State</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={form.maintenanceMode}
            onChange={handleChange("maintenanceMode")}
            color="warning"
          />
        }
        label={
          <span style={{ fontSize: 13, color: colors.textPrimary }}>
            Maintenance Mode
          </span>
        }
      />
      <Typography sx={helperSx}>
        When enabled, only administrators can access the system.
      </Typography>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button variant="outlined" size="small">
          Reset
        </Button>
        <Button variant="contained" size="small" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PLACEHOLDER PANEL — reused for tabs not yet implemented
// ─────────────────────────────────────────────────────────────────────
function ComingSoonPanel({ colors, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Settings sx={{ fontSize: 40, color: colors.textDisabled }} />
      <p
        className="text-[13px] font-medium"
        style={{ color: colors.textSecondary }}
      >
        {label} — coming soon
      </p>
      <p className="text-[12px]" style={{ color: colors.textDisabled }}>
        This section is under construction.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────
export default function SystemView({ search, setSearch, tab, handleTabChange }) {
  // ✅ Standardized color wiring
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  return (
    <PageLayout title="System Config" subtitle="Configure system-wide settings">
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Settings"
            value={search}
            onChange={setSearch}
          />
        </div>
      </section>

      <section
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
          borderRadius: colors.rounded,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            borderBottom: `1px solid ${colors.border}`,
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontSize: 13 },
          }}
        >
          <Tab label="General" value="general" />
          <Tab label="User Activities" value="users" />
          <Tab label="Audit Logs" value="audit" />
          <Tab label="Preferences" value="preferences" />
        </Tabs>

        {/* Tab content */}
        {tab === "general" && <GeneralSettingsPanel colors={colors} />}
        {tab === "users" && (
          <ComingSoonPanel colors={colors} label="User Activities" />
        )}
        {tab === "audit" && (
          <ComingSoonPanel colors={colors} label="Audit Logs" />
        )}
        {tab === "preferences" && (
          <ComingSoonPanel colors={colors} label="Preferences" />
        )}
      </section>
    </PageLayout>
  );
}