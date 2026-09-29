import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Popover, useTheme } from "@mui/material";
// ADD to imports
import {
  EventOutlined,
  KeyboardArrowDown,
  FilterListOutlined,
} from "@mui/icons-material";

import getThemeColors from "../../../utils/style/getThemeColors";

const useColors = (c) => ({
  border: c.slate.border,
  divider: c.slate.divider,
  hoverBg: c.slate.hover,
  blue: { text: c.blue.text, bg: c.blue.bg, border: c.blue.border },
  inputBg: c.gray.inputBg,
  gray: {
    pri: c.gray.textPrimary,
    sec: c.gray.textSecondary,
    muted: c.gray.textMuted,
  },
  panelBg: c.slate.outerBg,
});

const DATE_MODES = [
  { value: "all", label: "All" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

// "YYYY-MM-DD" -> "MM/DD/YYYY"
const formatDisplay = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

/**
 * Compact date-range filter. Clicking the trigger opens a popover with a
 * mode picker (All / Month / Year / Custom) and the matching input(s); the
 * chosen range is only committed — and the trigger label updated — when
 * "Apply" is clicked. "Cancel" discards any unsaved changes.
 *
 *   <FilterDate onChange={({ from, to }) => …} hint={<Warning />} />
 */
const FilterDate = ({ onChange, hint = null, sx }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  // ── Committed state (what's actually applied) ──
  const [mode, setMode] = useState("all");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ── Draft state (edited inside the popover, not yet applied) ──
  const [anchorEl, setAnchorEl] = useState(null);
  const [draftMode, setDraftMode] = useState(mode);
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftYear, setDraftYear] = useState(year);
  const [draftFrom, setDraftFrom] = useState(fromDate);
  const [draftTo, setDraftTo] = useState(toDate);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = String(now.getFullYear());

  const resolveRange = (m, mo, yr, from, to) => {
    if (m === "month" && mo) {
      const [y, mm] = mo.split("-");
      const lastDay = new Date(Number(y), Number(mm), 0).getDate();
      return {
        from: `${mo}-01`,
        to: `${mo}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    if (m === "year" && yr) return { from: `${yr}-01-01`, to: `${yr}-12-31` };
    if (m === "custom" && (from || to))
      return { from: from || null, to: to || null };
    return { from: null, to: null };
  };

  const appliedRange = useMemo(
    () => resolveRange(mode, month, year, fromDate, toDate),
    [mode, month, year, fromDate, toDate],
  );

  // Fire onChange only when the committed range actually changes
  useEffect(() => {
    onChange?.(appliedRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedRange]);

  const openPopover = (e) => {
    // seed the draft from the last committed values every time it opens
    setDraftMode(mode);
    setDraftMonth(month || currentMonth);
    setDraftYear(year || currentYear);
    setDraftFrom(fromDate);
    setDraftTo(toDate);
    setAnchorEl(e.currentTarget);
  };
  const closePopover = () => setAnchorEl(null);

  const pickDraftMode = (next) => {
    setDraftMode(next);
    if (next === "month" && !draftMonth) setDraftMonth(currentMonth);
    if (next === "year" && !draftYear) setDraftYear(currentYear);
  };

  const handleApply = () => {
    setMode(draftMode);
    setMonth(draftMonth);
    setYear(draftYear);
    setFromDate(draftFrom);
    setToDate(draftTo);
    closePopover();
  };
  const handleCancel = () => closePopover();

  // ── Trigger label ──
  const triggerLabel = useMemo(() => {
    if (mode === "all") return "All";
    if (mode === "month" && month) {
      const d = new Date(`${month}-01`);
      return d.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    }
    if (mode === "year" && year) return year;
    if (mode === "custom" && (fromDate || toDate)) {
      const f = formatDisplay(fromDate);
      const t = formatDisplay(toDate);
      if (f && t) return `${f} - ${t}`;
      return f ? `From ${f}` : `To ${t}`;
    }
    return "All";
  }, [mode, month, year, fromDate, toDate]);

  const fieldSx = {
    height: 32,
    px: 1,
    borderRadius: "7px",
    border: `1px solid ${colors.border}`,
    background: colors.inputBg,
    color: colors.gray.pri,
    fontSize: "0.75rem",
    outline: "none",
    fontFamily: "inherit",
    "&:focus": { borderColor: colors.blue.text },
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, ...sx }}>

      <Box
        component="button"
        type="button"
        onClick={openPopover}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          height: 32,
          borderRadius: "7px",
          border: `1px solid ${open ? colors.blue.border : colors.border}`,
          background: colors.inputBg,
          color: colors.gray.pri,
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          overflow: "hidden",
          "&:hover": { background: colors.hoverBg },
        }}
        title="Filter by date"
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: "100%",
            color: colors.gray.muted,
            borderRight: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <FilterListOutlined sx={{ fontSize: "1.05rem" }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.1 }}>
          <EventOutlined sx={{ fontSize: "1rem", color: colors.gray.muted }} />
          {triggerLabel}
          <KeyboardArrowDown
            sx={{
              fontSize: "1rem",
              color: colors.gray.muted,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform .15s",
            }}
          />
        </Box>
      </Box>
      {hint}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCancel}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 1.5, minWidth: 260, background: colors.panelBg }}>
          {/* Mode tabs */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 1.25 }}>
            {DATE_MODES.map((m) => (
              <Box
                key={m.value}
                component="button"
                type="button"
                onClick={() => pickDraftMode(m.value)}
                sx={{
                  flex: 1,
                  py: 0.6,
                  borderRadius: "6px",
                  border: `1px solid ${draftMode === m.value ? colors.blue.border : colors.border}`,
                  background:
                    draftMode === m.value ? colors.blue.bg : "transparent",
                  color:
                    draftMode === m.value ? colors.blue.text : colors.gray.sec,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {m.label}
              </Box>
            ))}
          </Box>

          {draftMode === "month" && (
            <Box
              component="input"
              type="month"
              value={draftMonth}
              onChange={(e) => setDraftMonth(e.target.value)}
              aria-label="Month"
              sx={{ ...fieldSx, width: "100%" }}
            />
          )}

          {draftMode === "year" && (
            <Box
              component="input"
              type="number"
              value={draftYear}
              onChange={(e) => setDraftYear(e.target.value)}
              placeholder="Year"
              min="1900"
              max="2999"
              aria-label="Year"
              sx={{ ...fieldSx, width: "100%" }}
            />
          )}

          {draftMode === "custom" && (
            <Box sx={{ display: "flex", gap: 0.75 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{ fontSize: "0.6rem", color: colors.gray.muted, mb: 0.3 }}
                >
                  From
                </Typography>
                <Box
                  component="input"
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  aria-label="From date"
                  sx={{ ...fieldSx, width: "100%" }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{ fontSize: "0.6rem", color: colors.gray.muted, mb: 0.3 }}
                >
                  To
                </Typography>
                <Box
                  component="input"
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  aria-label="To date"
                  sx={{ ...fieldSx, width: "100%" }}
                />
              </Box>
            </Box>
          )}

          {draftMode === "all" && (
            <Typography sx={{ fontSize: "0.7rem", color: colors.gray.muted }}>
              Shows the entire history.
            </Typography>
          )}

          {/* Apply / Cancel */}
          <Box sx={{ display: "flex", gap: 0.75, mt: 1.5 }}>
            <Box
              component="button"
              type="button"
              onClick={handleCancel}
              sx={{
                flex: 1,
                py: 0.7,
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.gray.sec,
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                "&:hover": { background: colors.hoverBg },
              }}
            >
              Cancel
            </Box>
            <Box
              component="button"
              type="button"
              onClick={handleApply}
              sx={{
                flex: 1,
                py: 0.7,
                borderRadius: "7px",
                border: `1px solid ${colors.blue.text}`,
                background: colors.blue.text,
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Apply
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default FilterDate;
