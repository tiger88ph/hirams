import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "@mui/material";
import {
  Box,
  Typography,
  Paper,
  useMediaQuery,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import ModalContainer from "../../../../../layouts/modal/ModalContainer";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";

import useKeysLabels from "../../../../../hooks/useKeysLabels.js";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BarChartIcon from "@mui/icons-material/BarChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// ── Theme Token Map — only tokens THIS component actually uses ─────────────
const useColors = (c) => ({
  slateBorder: c.slate.border,
  slateBg: c.slate.innerBg,
  grayTextPrimary: c.gray.textPrimary,
  grayTextSecondary: c.gray.textSecondary,
  grayInputBg: c.gray.inputBg,
  primaryMain: c.blue.text,
  primaryLight: c.blue.border,
  primaryBg: c.blue.bg,
  warningMain: c.amber.text,
  warningLight: c.amber.border,
  warningBg: c.amber.bg,
  successMain: c.green.text,
  successLight: c.green.border,
  successBg: c.green.bg,
  infoMain: c.slate.textPrimary,
  errorLight: c.red.border,
  divider: c.slate.border,
  paperBg: c.slate.innerBg,
  actionHover: c.slate.hover,
});

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 17;

// ── Business Hours Calculation ────────────────────────────────────────────────
function getBusinessMs(startVal, endVal) {
  if (!startVal || !endVal) return 0;
  const start = new Date(startVal);
  const end = new Date(endVal);
  if (start >= end) return 0;

  let totalMs = 0;
  let cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < end) {
    const day = cursor.getDay(); // 0=Sun, 1-5=Weekday, 6=Sat
    const dayStart = new Date(cursor);
    dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    if (day >= 1 && day <= 5) {
      const segStart = start > dayStart ? start : dayStart;
      const segEnd = end < dayEnd ? end : dayEnd;
      if (segStart < segEnd) totalMs += segEnd - segStart;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return totalMs;
}

// ── Format Duration ───────────────────────────────────────────────────────────
const formatDuration = (ms) => {
  if (!ms || ms < 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

function TransactionHistoryModal({
  open,
  onClose,
  transactionId,
  transactionCode,
  isManagement,
  currentUserId,
}) {
  // ── THEME: always first ──────────────────────────────────────────────────
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(true);
  const [sortBy, setSortBy] = useState("dtOccur");
  const [sortDir, setSortDir] = useState("desc");
  const { transacstatus, archiveStatus } = useKeysLabels();

  const allStatuses = { ...transacstatus, ...archiveStatus };
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── Fetch History ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !transactionId) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await TransactionAPI.getHistory(transactionId);
        const history = response?.history ?? response?.data?.history ?? [];
        const sorted = Array.isArray(history) ? [...history].reverse() : [];
        setTransactionHistory(sorted);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        setTransactionHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [open, transactionId]);

  useEffect(() => {
    if (!open) {
      setGraphOpen(false);
      setTableOpen(true);
    }
  }, [open]);

  if (!open) return null;

  const formatDate = (val) =>
    val
      ? new Date(val).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour12: true,
        })
      : "N/A";

  const formatDateShort = (val) =>
    val
      ? new Date(val).toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

  // ── Scoped History ──────────────────────────────────────────────────────────
  const scopedHistory = isManagement
    ? transactionHistory
    : [...transactionHistory].filter((row) => row.nRawUserId === currentUserId);

  // ── Add Duration to Each Row ────────────────────────────────────────────────
  const rowsWithDuration = scopedHistory.map((row, i, arr) => {
    const prev = i > 0 ? arr[i - 1] : null;
    const durationMs = prev ? getBusinessMs(prev.dtOccur, row.dtOccur) : null;
    return {
      ...row,
      statusLabel: allStatuses[row.nStatus] || "Unknown",
      durationMs,
      duration: durationMs !== null ? formatDuration(durationMs) : "—",
      isFirst: i === 0,
      isLatest: i === arr.length - 1,
    };
  });

  // ── Sort Handler ─────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortBy === field)
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const sortedRows = [...rowsWithDuration].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (sortBy === "dtOccur") {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    }
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const totalSteps = scopedHistory.length;
  const firstDate = totalSteps ? new Date(scopedHistory[0].dtOccur) : null;
  const lastDate = totalSteps
    ? new Date(scopedHistory[totalSteps - 1].dtOccur)
    : null;
  const totalDurationMs =
    firstDate && lastDate
      ? getBusinessMs(
          scopedHistory[0].dtOccur,
          scopedHistory[totalSteps - 1].dtOccur,
        )
      : null;
  const totalDuration = formatDuration(totalDurationMs);
  const latestStatus = totalSteps
    ? allStatuses[scopedHistory[totalSteps - 1].nStatus] || "Unknown"
    : "N/A";

  const stepDurations = scopedHistory
    .slice(1)
    .map((row, i) => getBusinessMs(scopedHistory[i].dtOccur, row.dtOccur))
    .filter((d) => d >= 0);
  const avgStepMs = stepDurations.length
    ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
    : null;
  const avgStepDuration = formatDuration(avgStepMs);

  // ── Graph Data ───────────────────────────────────────────────────────────────
  const maxStepMs = stepDurations.length ? Math.max(...stepDurations) : 0;

  const getUnit = (ms) => {
    if (ms >= 1000 * 60 * 60 * 24 * 30 * 12) return "yr";
    if (ms >= 1000 * 60 * 60 * 24 * 30) return "mo";
    if (ms >= 1000 * 60 * 60 * 24 * 7) return "wk";
    if (ms >= 1000 * 60 * 60 * 24) return "day";
    if (ms >= 1000 * 60 * 60) return "hr";
    return "min";
  };

  const convertByUnit = (ms, unit) => {
    const map = {
      yr: +(ms / (1000 * 60 * 60 * 24 * 365)).toFixed(2),
      mo: +(ms / (1000 * 60 * 60 * 24 * 30)).toFixed(2),
      wk: +(ms / (1000 * 60 * 60 * 24 * 7)).toFixed(2),
      day: +(ms / (1000 * 60 * 60 * 24)).toFixed(2),
      hr: +(ms / (1000 * 60 * 60)).toFixed(2),
      min: +(ms / (1000 * 60)).toFixed(1),
    };
    return map[unit];
  };

  const yUnit = getUnit(maxStepMs);
  const convertMs = (ms) => convertByUnit(ms, yUnit);
  const chartData = scopedHistory.slice(1).map((row, i) => {
    const elapsed = getBusinessMs(scopedHistory[i].dtOccur, row.dtOccur);
    return {
      date: formatDateShort(row.dtOccur),
      fullDate: formatDate(row.dtOccur),
      status: allStatuses[row.nStatus] || "Unknown",
      userName: row.nUserId || "System",
      durationMs: elapsed,
      duration: convertMs(elapsed),
    };
  });
  const avgConverted = avgStepMs ? convertMs(avgStepMs) : null;

  // ── Custom Tooltip ───────────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const dotColor =
      d.duration > avgConverted ? colors.warningMain : colors.primaryMain;
    return (
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          borderRadius: 2,
          minWidth: 200,
          border: `1px solid ${colors.divider}`,
          bgcolor: colors.paperBg,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: dotColor,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.grayTextPrimary,
            }}
          >
            {d.status}
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: 10, color: colors.grayTextSecondary, mb: 0.25 }}
        >
          from: {d.userName}
        </Typography>
        <Typography
          sx={{ fontSize: 10, color: colors.grayTextSecondary, mb: 0.75 }}
        >
          {d.fullDate}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: colors.actionHover,
            borderRadius: 1,
            px: 1,
            py: 0.4,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 11, color: colors.warningMain }} />
          <Typography
            sx={{ fontSize: 11, fontWeight: 600, color: colors.warningMain }}
          >
            {formatDuration(d.durationMs)} since previous
          </Typography>
        </Box>
      </Paper>
    );
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const isAboveAvg = avgConverted && payload.duration > avgConverted;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={isAboveAvg ? colors.warningMain : colors.primaryMain}
        stroke={colors.paperBg}
        strokeWidth={2}
      />
    );
  };

  const metrics = [
    {
      icon: <TimelineIcon sx={{ fontSize: 18, color: colors.primaryMain }} />,
      label: "Total Events",
      value: totalSteps || "—",
      color: colors.primaryMain,
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 18, color: colors.warningMain }} />,
      label: "Total Duration (Business Hrs)",
      value: totalDuration,
      color: colors.warningMain,
    },
    {
      icon: <SwapHorizIcon sx={{ fontSize: 18, color: colors.infoMain }} />,
      label: "Avg. per Step",
      value: avgStepDuration,
      color: colors.infoMain,
    },
    {
      icon: (
        <CheckCircleOutlineIcon
          sx={{ fontSize: 18, color: colors.successMain }}
        />
      ),
      label: "Latest Status",
      value: latestStatus,
      color: colors.successMain,
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Activity Log"
      subTitle={transactionCode?.trim() ? `${transactionCode.trim()}` : ""}
      showSave={false}
      width={isMobile ? "100%" : 900}
      loading={loading}
    >
      {/* ── Metrics Card ── */}
      {!loading && totalSteps > 0 && (
        <Paper
          elevation={0}
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            border: `1px solid ${colors.divider}`,
            borderRadius: 2,
            overflow: "hidden",
            mb: 2,
          }}
        >
          {metrics.map((metric, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "stretch",
                borderLeft:
                  i > 0 && !(isMobile && i % 2 === 0)
                    ? `1px solid ${colors.divider}`
                    : "none",
                borderTop:
                  isMobile && i >= 2 ? `1px solid ${colors.divider}` : "none",
              }}
            >
              <Box sx={{ width: 4, bgcolor: metric.color, flexShrink: 0 }} />
              <Box
                sx={{
                  flex: 1,
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.4,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {metric.icon}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: colors.grayTextSecondary,
                    }}
                  >
                    {metric.label}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 700,
                    color: metric.color,
                  }}
                >
                  {metric.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* ── Graph Section ── */}
      {!loading && chartData.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Paper
            elevation={0}
            onClick={() => setGraphOpen((p) => !p)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
              border: `1px solid ${graphOpen ? colors.primaryLight : colors.divider}`,
              borderRadius: graphOpen ? "8px 8px 0 0" : 2,
              cursor: "pointer",
              bgcolor: graphOpen ? colors.primaryBg : colors.paperBg,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: colors.primaryLight,
                bgcolor: colors.actionHover,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BarChartIcon
                sx={{
                  fontSize: 18,
                  color: graphOpen
                    ? colors.primaryMain
                    : colors.grayTextSecondary,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: graphOpen
                    ? colors.primaryMain
                    : colors.grayTextPrimary,
                }}
              >
                Graph Analysis
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: 11, color: colors.grayTextSecondary }}
              >
                — Step duration over time
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                color: graphOpen
                  ? colors.primaryMain
                  : colors.grayTextSecondary,
                p: 0.25,
              }}
            >
              {graphOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Paper>

          <Collapse in={graphOpen}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${colors.primaryLight}`,
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                p: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  mb: 1.5,
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: colors.primaryMain,
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 10, color: colors.grayTextSecondary }}
                  >
                    Normal
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: colors.warningMain,
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 10, color: colors.grayTextSecondary }}
                  >
                    Above avg
                  </Typography>
                </Box>
                {avgConverted && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 2,
                        bgcolor: colors.errorLight,
                        opacity: 0.7,
                      }}
                    />
                    <Typography
                      sx={{ fontSize: 10, color: colors.grayTextSecondary }}
                    >
                      Avg ({avgStepDuration})
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ overflowX: "auto", width: "100%" }}>
                <Box sx={{ minWidth: Math.max(chartData.length * 40, 500) }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 45 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.divider}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: colors.grayTextSecondary }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        tickLine={false}
                        axisLine={{ stroke: colors.divider }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: colors.grayTextSecondary }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}${yUnit}`}
                        width={48}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      {avgConverted && (
                        <ReferenceLine
                          y={avgConverted}
                          stroke={colors.errorLight}
                          strokeDasharray="5 3"
                          strokeOpacity={0.8}
                          label={{
                            value: `avg`,
                            position: "insideTopRight",
                            fontSize: 10,
                            fill: colors.errorLight,
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke={colors.primaryMain}
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={{
                          r: 7,
                          stroke: colors.primaryMain,
                          strokeWidth: 2,
                          fill: colors.paperBg,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Paper>
          </Collapse>
        </Box>
      )}

      {/* ── HISTORY TABLE ── */}
      {!loading && sortedRows.length > 0 && (
        <Box>
          <Paper
            elevation={0}
            onClick={() => setTableOpen((p) => !p)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
              border: `1px solid ${tableOpen ? colors.primaryLight : colors.divider}`,
              borderRadius: tableOpen ? "8px 8px 0 0" : 2,
              cursor: "pointer",
              bgcolor: tableOpen ? colors.primaryBg : colors.paperBg,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: colors.primaryLight,
                bgcolor: colors.actionHover,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimelineIcon
                sx={{
                  fontSize: 18,
                  color: tableOpen
                    ? colors.primaryMain
                    : colors.grayTextSecondary,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: tableOpen
                    ? colors.primaryMain
                    : colors.grayTextPrimary,
                }}
              >
                History Table
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: 11, color: colors.grayTextSecondary }}
              >
                — {totalSteps} event{totalSteps !== 1 ? "s" : ""}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                color: tableOpen
                  ? colors.primaryMain
                  : colors.grayTextSecondary,
                p: 0.25,
              }}
            >
              {tableOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Paper>

          <Collapse in={tableOpen}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${colors.primaryLight}`,
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                bgcolor: colors.paperBg,
                overflow: "hidden",
              }}
            >
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: colors.slateBg }}>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: colors.grayTextPrimary,
                          borderBottom: `1px solid ${colors.divider}`,
                        }}
                        sortDirection={sortBy === "dtOccur" ? sortDir : false}
                      >
                        <TableSortLabel
                          active={sortBy === "dtOccur"}
                          direction={sortBy === "dtOccur" ? sortDir : "asc"}
                          onClick={() => handleSort("dtOccur")}
                        >
                          Date / Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: colors.grayTextPrimary,
                          borderBottom: `1px solid ${colors.divider}`,
                        }}
                        sortDirection={
                          sortBy === "statusLabel" ? sortDir : false
                        }
                      >
                        <TableSortLabel
                          active={sortBy === "statusLabel"}
                          direction={sortBy === "statusLabel" ? sortDir : "asc"}
                          onClick={() => handleSort("statusLabel")}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: colors.grayTextPrimary,
                          borderBottom: `1px solid ${colors.divider}`,
                        }}
                      >
                        Duration
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: colors.grayTextPrimary,
                          borderBottom: `1px solid ${colors.divider}`,
                        }}
                        sortDirection={sortBy === "nUserId" ? sortDir : false}
                      >
                        <TableSortLabel
                          active={sortBy === "nUserId"}
                          direction={sortBy === "nUserId" ? sortDir : "asc"}
                          onClick={() => handleSort("nUserId")}
                        >
                          User
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: colors.grayTextPrimary,
                          borderBottom: `1px solid ${colors.divider}`,
                        }}
                      >
                        Remarks
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRows.map((row, index) => {
                      const isSlowStep =
                        avgStepMs && row.durationMs > avgStepMs * 1.5;
                      return (
                        <TableRow
                          key={index}
                          sx={{
                            "&:hover": { bgcolor: colors.actionHover },
                            ...(row.isLatest && {
                              bgcolor: colors.primaryBg,
                              borderLeft: `3px solid ${colors.primaryMain}`,
                            }),
                          }}
                        >
                          <TableCell
                            sx={{
                              fontSize: 12,
                              color: colors.grayTextSecondary,
                              borderBottom: `1px solid ${colors.divider}`,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              {formatDate(row.dtOccur)}
                              {row.isFirst && (
                                <Chip
                                  label="Start"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              )}
                              {row.isLatest && (
                                <Chip
                                  label="Latest"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: colors.grayTextPrimary,
                              borderBottom: `1px solid ${colors.divider}`,
                            }}
                          >
                            {row.statusLabel}
                          </TableCell>
                          <TableCell
                            sx={{ borderBottom: `1px solid ${colors.divider}` }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: 12,
                                  color: isSlowStep
                                    ? colors.warningMain
                                    : colors.grayTextSecondary,
                                  fontWeight: isSlowStep ? 600 : 400,
                                }}
                              >
                                {row.duration}
                              </Typography>
                              {isSlowStep && (
                                <Chip
                                  label="Slow"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              color: colors.grayTextSecondary,
                              borderBottom: `1px solid ${colors.divider}`,
                            }}
                          >
                            {row.nUserId || "System"}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              color: colors.grayTextSecondary,
                              maxWidth: 200,
                              whiteSpace: "normal",
                              borderBottom: `1px solid ${colors.divider}`,
                            }}
                          >
                            {row.strRemarks || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Collapse>
        </Box>
      )}

      {!loading && sortedRows.length === 0 && (
        <Typography
          align="center"
          sx={{ py: 4, color: colors.grayTextSecondary }}
        >
          No transaction history found.
        </Typography>
      )}
    </ModalContainer>
  );
}

export default TransactionHistoryModal;
