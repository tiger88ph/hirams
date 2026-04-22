import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  Chip,
  Collapse,
  IconButton,
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
import ModalContainer from "../../../../../components/common/ModalContainer";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import DotSpinner from "../../../../../components/common/DotSpinner";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BarChartIcon from "@mui/icons-material/BarChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

function TransactionHistoryModal({
  open,
  onClose,
  transactionId,
  transactionCode,
  isManagement,
  currentUserId,
}) {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const { transacstatus, archiveStatus } = useMapping();

  const allStatuses = { ...transacstatus, ...archiveStatus };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [timelineOpen, setTimelineOpen] = useState(true);

  useEffect(() => {
    if (!open || !transactionId) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`transactions/${transactionId}/history`);
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
      setTimelineOpen(true);
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

  const formatDuration = (ms) => {
    if (!ms || ms < 0) return "N/A";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${totalSeconds}s`;
  };

  // ── Scoped history: management sees all, others see only their own ────────
  // displayHistory is reversed (latest first) for timeline rendering
  const displayHistory = [...transactionHistory]
    .reverse()
    .filter((row) => isManagement || row.nRawUserId === currentUserId);

  // scopedHistory is ascending (oldest first) for metric/graph calculations
  // For management: use full transactionHistory (already ascending)
  // For non-management: filter ascending array then re-sort
  const scopedHistory = isManagement
    ? transactionHistory
    : [...transactionHistory].filter(
        (row) => row.nRawUserId === currentUserId,
      );

  // ── Metrics (scoped) ─────────────────────────────────────────────────────
  const totalSteps = scopedHistory.length;
  const firstDate = totalSteps ? new Date(scopedHistory[0].dtOccur) : null;
  const lastDate = totalSteps
    ? new Date(scopedHistory[totalSteps - 1].dtOccur)
    : null;
  const totalDurationMs = firstDate && lastDate ? lastDate - firstDate : null;
  const totalDuration = formatDuration(totalDurationMs);

  const latestStatus = totalSteps
    ? allStatuses[scopedHistory[totalSteps - 1].nStatus] || "Unknown"
    : "N/A";

  const stepDurations = scopedHistory
    .slice(1)
    .map(
      (row, i) =>
        new Date(row.dtOccur) - new Date(scopedHistory[i].dtOccur),
    )
    .filter((d) => d >= 0);

  const avgStepMs = stepDurations.length
    ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
    : null;
  const avgStepDuration = formatDuration(avgStepMs);

  // ── Graph data (scoped) ───────────────────────────────────────────────────
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
    const elapsed =
      new Date(row.dtOccur) - new Date(scopedHistory[i].dtOccur);
    return {
      date: formatDateShort(row.dtOccur),
      fullDate: formatDate(row.dtOccur),
      status: allStatuses[row.nStatus] || "Unknown",
      prevStatus: allStatuses[scopedHistory[i].nStatus] || "Unknown",
      userName: row.nUserId || "System",
      durationMs: elapsed,
      duration: convertMs(elapsed),
      index: i + 1,
    };
  });

  const avgConverted = avgStepMs ? convertMs(avgStepMs) : null;

  // ── Custom tooltip ────────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          borderRadius: 2,
          minWidth: 200,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor:
                d.duration > avgConverted ? "warning.main" : "primary.main",
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{ fontSize: 12, fontWeight: 700, color: "text.primary" }}
          >
            {d.status}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 10, color: "text.disabled", mb: 0.25 }}>
          from: {d.userName}
        </Typography>
        <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 0.75 }}>
          {d.fullDate}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "action.hover",
            borderRadius: 1,
            px: 1,
            py: 0.4,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 11, color: "warning.main" }} />
          <Typography
            sx={{ fontSize: 11, fontWeight: 600, color: "warning.main" }}
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
        fill={
          isAboveAvg ? theme.palette.warning.main : theme.palette.primary.main
        }
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  const metrics = [
    {
      icon: <TimelineIcon sx={{ fontSize: 18, color: "primary.main" }} />,
      label: "Total Events",
      value: totalSteps || "—",
      color: "primary.main",
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 18, color: "warning.main" }} />,
      label: "Total Duration",
      value: totalDuration,
      color: "warning.main",
    },
    {
      icon: <SwapHorizIcon sx={{ fontSize: 18, color: "info.main" }} />,
      label: "Avg. per Step",
      value: avgStepDuration,
      color: "info.main",
    },
    {
      icon: (
        <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "success.main" }} />
      ),
      label: "Latest Status",
      value: latestStatus,
      color: "success.main",
    },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Activity Log"
      subTitle={transactionCode?.trim() ? `/ ${transactionCode.trim()}` : ""}
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
            border: "1px solid",
            borderColor: "divider",
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
                  i > 0 && !(isMobile && i % 2 === 0) ? "1px solid" : "none",
                borderTop: isMobile && i >= 2 ? "1px solid" : "none",
                borderColor: "divider",
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
                    color="text.secondary"
                    fontWeight={500}
                    sx={{ fontSize: 11 }}
                  >
                    {metric.label}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    color: metric.color,
                    fontSize: isMobile ? 13 : 14,
                    lineHeight: 1.3,
                  }}
                >
                  {metric.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* ── Collapsible Graph ── */}
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
              border: "1px solid",
              borderColor: graphOpen ? "primary.light" : "divider",
              borderRadius: graphOpen ? "8px 8px 0 0" : 2,
              cursor: "pointer",
              bgcolor: graphOpen ? "primary.50" : "background.paper",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.light",
                bgcolor: "action.hover",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BarChartIcon
                sx={{
                  fontSize: 18,
                  color: graphOpen ? "primary.main" : "text.secondary",
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: graphOpen ? "primary.main" : "text.primary",
                }}
              >
                Graph Analysis
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: 11 }}
              >
                — Step duration over time
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                color: graphOpen ? "primary.main" : "text.secondary",
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
                border: "1px solid",
                borderColor: "primary.light",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                p: 2,
              }}
            >
              {/* Legend */}
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
                      bgcolor: "primary.main",
                    }}
                  />
                  <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                    Normal
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "warning.main",
                    }}
                  />
                  <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                    Above avg
                  </Typography>
                </Box>
                {avgConverted && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 2,
                        bgcolor: "error.light",
                        opacity: 0.7,
                      }}
                    />
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                      Avg ({avgStepDuration})
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Scrollable chart wrapper */}
              <Box sx={{ overflowX: "auto", width: "100%" }}>
                <Box sx={{ minWidth: Math.max(chartData.length * 40, 500) }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 45 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 10,
                          fill: theme.palette.text.secondary,
                        }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: theme.palette.text.secondary,
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}${yUnit}`}
                        width={48}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      {avgConverted && (
                        <ReferenceLine
                          y={avgConverted}
                          stroke={theme.palette.error.light}
                          strokeDasharray="5 3"
                          strokeOpacity={0.8}
                          label={{
                            value: `avg`,
                            position: "insideTopRight",
                            fontSize: 10,
                            fill: theme.palette.error.light,
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={{
                          r: 7,
                          stroke: theme.palette.primary.main,
                          strokeWidth: 2,
                          fill: "#fff",
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

      {/* ── Timeline Toggle Row ── */}
      {!loading && displayHistory.length > 0 && (
        <Box sx={{ mb: timelineOpen ? 0 : 1 }}>
          <Paper
            elevation={0}
            onClick={() => setTimelineOpen((p) => !p)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
              border: "1px solid",
              borderColor: timelineOpen ? "primary.light" : "divider",
              borderRadius: timelineOpen ? "8px 8px 0 0" : 2,
              cursor: "pointer",
              bgcolor: timelineOpen ? "primary.50" : "background.paper",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.light",
                bgcolor: "action.hover",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimelineIcon
                sx={{
                  fontSize: 18,
                  color: timelineOpen ? "primary.main" : "text.secondary",
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: timelineOpen ? "primary.main" : "text.primary",
                }}
              >
                Timeline
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: 11 }}
              >
                — {totalSteps} event{totalSteps !== 1 ? "s" : ""}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                color: timelineOpen ? "primary.main" : "text.secondary",
                p: 0.25,
              }}
            >
              {timelineOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Paper>

          <Collapse in={timelineOpen}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "primary.light",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "relative", width: "100%", py: 4 }}>
                <Box
                  sx={{
                    position: "absolute",
                    left: isMobile ? "20px" : "50%",
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    transform: isMobile ? "none" : "translateX(-50%)",
                    borderRadius: 2,
                  }}
                />

                {loading && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.7)",
                      zIndex: 20,
                    }}
                  >
                    <DotSpinner size={18} />
                  </Box>
                )}

                {!loading && displayHistory.length === 0 && (
                  <Typography
                    align="center"
                    sx={{ mt: 6 }}
                    color="text.secondary"
                  >
                    No transaction history found.
                  </Typography>
                )}

                {!loading &&
                  displayHistory.map((row, index) => {
                    // Find position in the original ascending array for elapsed calculation
                    const originalIndex = transactionHistory.findIndex(
                      (r) =>
                        r.dtOccur === row.dtOccur &&
                        r.nStatus === row.nStatus,
                    );

                    const formattedDate = formatDate(row.dtOccur);
                    const isLeft = !isMobile && index % 2 === 0;

                    const isLatest =
                      originalIndex === transactionHistory.length - 1;
                    const isStart = originalIndex === 0;

                    // Elapsed is relative to previous entry in scopedHistory
                    const scopedIndex = scopedHistory.findIndex(
                      (r) =>
                        r.dtOccur === row.dtOccur &&
                        r.nStatus === row.nStatus,
                    );
                    const prevScoped =
                      scopedIndex > 0 ? scopedHistory[scopedIndex - 1] : null;
                    const elapsedMs = prevScoped
                      ? new Date(row.dtOccur) - new Date(prevScoped.dtOccur)
                      : null;
                    const elapsed =
                      elapsedMs !== null && elapsedMs >= 0
                        ? formatDuration(elapsedMs)
                        : null;
                    const isSlowStep =
                      avgStepMs && elapsedMs > avgStepMs * 1.5;

                    return (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          mb: 3,
                          display: "flex",
                          justifyContent: isMobile
                            ? "flex-start"
                            : isLeft
                              ? "flex-start"
                              : "flex-end",
                          pr: isMobile ? 0 : isLeft ? "50%" : 0,
                          pl: isMobile ? 0 : isLeft ? 0 : "50%",
                          px: 1,
                        }}
                      >
                        {/* Dot */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: isMobile ? 12 : "50%",
                            top: 14,
                            width: isLatest || isStart ? 20 : 14,
                            height: isLatest || isStart ? 20 : 14,
                            bgcolor: isLatest
                              ? "primary.main"
                              : "background.paper",
                            border: "3px solid",
                            borderColor: isStart
                              ? "success.main"
                              : "primary.main",
                            borderRadius: "50%",
                            transform: isMobile
                              ? isLatest || isStart
                                ? "translateY(-3px)"
                                : "none"
                              : isLatest || isStart
                                ? "translateX(-50%) translateY(-3px)"
                                : "translateX(-50%)",
                            zIndex: 10,
                            boxShadow: isLatest
                              ? "0 0 0 4px rgba(25,118,210,0.15)"
                              : isStart
                                ? "0 0 0 4px rgba(46,125,50,0.15)"
                                : 1,
                          }}
                        />

                        {/* Connector */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 22,
                            left: isMobile ? 28 : "50%",
                            width: isMobile
                              ? "calc(100% - 58px)"
                              : "44%",
                            height: "2px",
                            bgcolor: "divider",
                            transform: isMobile
                              ? "none"
                              : isLeft
                                ? "translateX(-100%)"
                                : "translateX(0)",
                            zIndex: 1,
                          }}
                        />

                        <Paper
                          elevation={0}
                          sx={{
                            width: isMobile ? "calc(100% - 55px)" : "44%",
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: isLatest
                              ? "primary.light"
                              : isSlowStep
                                ? "warning.light"
                                : "divider",
                            boxShadow: isLatest
                              ? "0 4px 16px rgba(25,118,210,0.12)"
                              : isSlowStep
                                ? "0 2px 8px rgba(237,108,2,0.1)"
                                : "0 2px 8px rgba(0,0,0,0.06)",
                            transition: "all 0.2s ease",
                            ml: isMobile ? "38px" : 0,
                            position: "relative",
                            zIndex: 2,
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                              borderColor: "primary.light",
                            },
                          }}
                        >
                          {/* Header */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                flexWrap: "wrap",
                              }}
                            >
                              {isLatest && (
                                <Chip
                                  label="Latest"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    "& .MuiChip-label": { px: 0.75 },
                                  }}
                                />
                              )}
                              {isStart && (
                                <Chip
                                  label="Start"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    "& .MuiChip-label": { px: 0.75 },
                                  }}
                                />
                              )}
                              {isSlowStep && (
                                <Chip
                                  label="Slow"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    "& .MuiChip-label": { px: 0.75 },
                                  }}
                                />
                              )}
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  color: isLatest
                                    ? "primary.main"
                                    : "text.primary",
                                  fontSize: 13,
                                }}
                              >
                                {allStatuses[row.nStatus] || "Unknown Status"}
                              </Typography>
                            </Box>
                            {elapsed && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.4,
                                  bgcolor: isSlowStep
                                    ? "warning.50"
                                    : "action.hover",
                                  borderRadius: 1,
                                  px: 0.75,
                                  py: 0.3,
                                  flexShrink: 0,
                                }}
                              >
                                <AccessTimeIcon
                                  sx={{
                                    fontSize: 10,
                                    color: isSlowStep
                                      ? "warning.main"
                                      : "text.secondary",
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: 10,
                                    color: isSlowStep
                                      ? "warning.main"
                                      : "text.secondary",
                                    whiteSpace: "nowrap",
                                    fontWeight: isSlowStep ? 700 : 400,
                                  }}
                                >
                                  +{elapsed}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Remarks */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1.5,
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {row.strRemarks || "No remarks"}
                          </Typography>

                          {/* Footer */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection:
                                isMobile || isTablet ? "column" : "row",
                              justifyContent: "space-between",
                              alignItems:
                                isMobile || isTablet
                                  ? "flex-start"
                                  : "center",
                              gap: 0.5,
                              pt: 1,
                              borderTop: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <PersonIcon
                                sx={{ fontSize: 12, color: "text.disabled" }}
                              />
                              <Typography
                                sx={{
                                  color: "text.secondary",
                                  fontSize: 11,
                                }}
                              >
                                {row.nUserId || "System"}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CalendarTodayIcon
                                sx={{ fontSize: 12, color: "text.disabled" }}
                              />
                              <Typography
                                sx={{
                                  color: "text.secondary",
                                  fontSize: 11,
                                }}
                              >
                                {formattedDate}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Box>
                    );
                  })}
              </Box>
            </Paper>
          </Collapse>
        </Box>
      )}
    </ModalContainer>
  );
}

export default TransactionHistoryModal;