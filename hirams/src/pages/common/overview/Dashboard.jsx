import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  Chip,
  Avatar,
  LinearProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import ChartCard from "../../../components/common/ChartCard";
import { getPhilippinesTime } from "../../../utils/helpers/timeZone";
import PageLayout from "../../../components/common/PageLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  People,
  Business,
  Group,
  LocalShipping,
  NotificationsActive,
  CalendarToday,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  EventNote,
  AccessTime,
} from "@mui/icons-material";
import api from "../../../utils/api/api";

// ─── Data ────────────────────────────────────────────────────────────────────

const sessionData = [
  { name: "Apr 1", sessions: 2000 },
  { name: "Apr 10", sessions: 8000 },
  { name: "Apr 15", sessions: 13000 },
  { name: "Apr 25", sessions: 15000 },
  { name: "Apr 30", sessions: 18000 },
];

const monthlyData = [
  { month: "Jan", views: 8000, expenses: 5000 },
  { month: "Feb", views: 10000, expenses: 6200 },
  { month: "Mar", views: 7000, expenses: 4800 },
  { month: "Apr", views: 12000, expenses: 7100 },
  { month: "May", views: 9000, expenses: 5500 },
  { month: "Jun", views: 11000, expenses: 6800 },
];

const statusData = [
  { name: "Active", value: 42 },
  { name: "Pending", value: 18 },
  { name: "Inactive", value: 10 },
  { name: "Completed", value: 30 },
];

const PIE_COLORS = ["#1976d2", "#ff9800", "#9e9e9e", "#4caf50"];

const scheduleMetrics = [
  {
    title: "Total Schedules",
    value: 128,
    color: "#1976d2",
    bg: "#e3f2fd",
    icon: CalendarToday,
  },
  {
    title: "Reminders Sent",
    value: 94,
    color: "#4caf50",
    bg: "#e8f5e9",
    icon: NotificationsActive,
  },
  {
    title: "Completed",
    value: 76,
    color: "#7b1fa2",
    bg: "#f3e5f5",
    icon: CheckCircle,
  },
  {
    title: "Overdue",
    value: 12,
    color: "#c62828",
    bg: "#ffebee",
    icon: Cancel,
  },
];

const upcomingReminders = [
  {
    id: 1,
    title: "Team Standup",
    time: "09:00 AM",
    date: "Today",
    priority: "High",
    color: "#1976d2",
  },
  {
    id: 2,
    title: "Client Proposal Review",
    time: "11:30 AM",
    date: "Today",
    priority: "High",
    color: "#1976d2",
  },
  {
    id: 3,
    title: "Invoice Follow-up",
    time: "02:00 PM",
    date: "Today",
    priority: "Medium",
    color: "#ff9800",
  },
  {
    id: 4,
    title: "Supplier Meeting",
    time: "10:00 AM",
    date: "Tomorrow",
    priority: "Medium",
    color: "#ff9800",
  },
  {
    id: 5,
    title: "Monthly Report Due",
    time: "05:00 PM",
    date: "Feb 22",
    priority: "High",
    color: "#1976d2",
  },
  {
    id: 6,
    title: "System Maintenance",
    time: "12:00 AM",
    date: "Feb 23",
    priority: "Low",
    color: "#4caf50",
  },
];

const reminderCompletionData = [
  { month: "Jan", completed: 28, missed: 4, pending: 6 },
  { month: "Feb", completed: 34, missed: 2, pending: 5 },
  { month: "Mar", completed: 22, missed: 6, pending: 8 },
  { month: "Apr", completed: 38, missed: 3, pending: 4 },
  { month: "May", completed: 30, missed: 5, pending: 7 },
  { month: "Jun", completed: 42, missed: 1, pending: 3 },
];

const reminderTypeData = [
  { name: "Meetings", value: 35, fill: "#1976d2" },
  { name: "Deadlines", value: 28, fill: "#f44336" },
  { name: "Follow-ups", value: 20, fill: "#ff9800" },
  { name: "Reports", value: 17, fill: "#4caf50" },
];

const scheduleCompletionRate = [
  { name: "Completion Rate", value: 79, fill: "#4caf50" },
];

const priorityBreakdown = [
  { priority: "High", count: 48, pct: 38, color: "#c62828" },
  { priority: "Medium", count: 52, pct: 41, color: "#ff9800" },
  { priority: "Low", count: 28, pct: 21, color: "#4caf50" },
];

// ─── Shared Styles ───────────────────────────────────────────────────────────

const cardSx = (accentColor) => ({
  borderRadius: 1.5,
  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  border: "1px solid #f0f0f0",
  ...(accentColor && { borderLeft: `3px solid ${accentColor}` }),
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
});

const priorityChipSx = (priority) => {
  const map = {
    High: { bg: "#ffebee", color: "#c62828" },
    Medium: { bg: "#fff3e0", color: "#e65100" },
    Low: { bg: "#e8f5e9", color: "#2e7d32" },
    Scheduled: { bg: "#e3f2fd", color: "#1565c0" },
  };
  const s = map[priority] ?? map.Low;
  return {
    backgroundColor: s.bg,
    color: s.color,
    fontWeight: 700,
    fontSize: "0.6rem",
    height: 20,
  };
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
  }),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Reusable summary card used in both metric rows */
function SummaryCard({ item, index }) {
  const Icon = item.icon;
  return (
    <Grid item xs={12} sm={6} md={3}>
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card sx={cardSx(item.color)}>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.62rem",
                }}
              >
                {item.title}
              </Typography>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                <CountUp
                  start={0}
                  end={Number(item.value)}
                  duration={2}
                  separator=","
                  useEasing
                  easingFn={(t) => t * t * t}
                />
              </Typography>
              {item.change && (
                <Typography
                  variant="caption"
                  sx={{
                    color: item.color,
                    fontWeight: 600,
                    fontSize: "0.68rem",
                  }}
                >
                  {item.change}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                backgroundColor: item.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon sx={{ color: item.color, fontSize: 20 }} />
            </Box>
          </Box>
        </Card>
      </motion.div>
    </Grid>
  );
}

/** Section header with icon */
function SectionHeader({ icon: Icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <Icon sx={{ color: "#1976d2", fontSize: 20 }} />
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Box>
  );
}

/** Wrapper card with consistent height and optional padding */
function PanelCard({ height = 300, children, sx = {} }) {
  return (
    <Card
      sx={{
        height,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        p: 2,
        ...cardSx(),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}

/** Chart area inside PanelCard — gives ResponsiveContainer a real pixel height */
function ChartBox({ titleHeight = 32, cardHeight, children }) {
  const chartHeight = cardHeight - titleHeight - 16; // subtract title + padding
  return (
    <Box
      sx={{ width: "100%", height: chartHeight, minHeight: 0, flexShrink: 0 }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { width: "100%", height: chartHeight })
          : child,
      )}
    </Box>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [metrics, setMetrics] = useState([
    {
      title: "Users",
      value: 0,
      change: "Total",
      color: "#1976d2",
      bg: "#e3f2fd",
      icon: People,
    },
    {
      title: "Company",
      value: 0,
      change: "Total",
      color: "#7b1fa2",
      bg: "#f3e5f5",
      icon: Business,
    },
    {
      title: "Clients",
      value: 0,
      change: "Total",
      color: "#c62828",
      bg: "#ffebee",
      icon: Group,
    },
    {
      title: "Suppliers",
      value: 0,
      change: "Total",
      color: "#e65100",
      bg: "#fff3e0",
      icon: LocalShipping,
    },
  ]);
  const [phTime, setPhTime] = useState(getPhilippinesTime());
  useEffect(() => {
    const updateTime = () => {
      const now = getPhilippinesTime();
      setPhTime(now);
      // Schedule next tick exactly at the next second
      const delay = 1000 - now.getMilliseconds();
      setTimeout(updateTime, delay);
    };

    updateTime(); // start the loop
  }, []);
  useEffect(() => {
    let mounted = true;
    api
      .get("dashboard/total-metrics")
      .then((res) => {
        const data = res?.totals ?? {};
        if (!mounted) return;
        setMetrics((prev) => [
          { ...prev[0], value: Number(data.users) || 0 },
          { ...prev[1], value: Number(data.companies) || 0 },
          { ...prev[2], value: Number(data.clients) || 0 },
          { ...prev[3], value: Number(data.suppliers) || 0 },
        ]);
      })
      .catch((err) => console.error("Failed to load dashboard metrics", err));
    return () => {
      mounted = false;
    };
  }, []);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  return (
    <PageLayout title={"Dashboard"}>

      <div className="space-y-6">
        {/* Welcome */}
        <Card
          sx={{
            ...cardSx(),
            background:
              "linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 50%, #ede9fe 100%)",
            overflow: "hidden",
            position: "relative",
            border: "1px solid #dbeafe",
          }}
        >
          {/* Decorative circles */}
          <Box
            sx={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.07)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -20,
              right: 60,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.06)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 90,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(139,92,246,0.05)",
            }}
          />

          <Box
            sx={{
              p: 2.5,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              {/* Greeting label */}
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#6366f1",
                  mb: 0.4,
                }}
              >
                Good{" "}
                {(() => {
                  const nowPH = getPhilippinesTime(); // Returns JS Date in PH timezone
                  const hour = nowPH.getHours();
                  return hour < 12
                    ? "Morning"
                    : hour < 18
                      ? "Afternoon"
                      : "Evening";
                })()}
              </Typography>

              {/* Name */}
              <Typography
                sx={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.2,
                }}
              >
                {user?.strFName ?? "User"} {user?.strLName ?? ""}
              </Typography>

              {/* Subtitle */}
              <Typography
                sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.6 }}
              >
                Here's your overview and performance metrics for this month.
              </Typography>

              {/* Date chip */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 1.2,
                  px: 2.2,
                  py: 0.8,
                  bgcolor: "rgba(99,102,241,0.08)",
                  borderRadius: "20px",
                  border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    color: "#6366f1",
                    fontWeight: 500,
                  }}
                >
                  {phTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  —{" "}
                  {phTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </Typography>
              </Box>
            </Box>

            {/* Avatar box */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.12) 100%)",
                border: "1px solid rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                ml: 2,
              }}
            >
              <Typography sx={{ fontSize: "1.6rem" }}>👋</Typography>
            </Box>
          </Box>
        </Card>

        {/* ── Overview Metrics ── */}
        <SectionHeader icon={People} title="Overview" />
        <Grid container spacing={1.5}>
          {metrics.map((item, i) => (
            <SummaryCard key={i} item={item} index={i} />
          ))}
        </Grid>

        {/* ── Charts ── */}
        <SectionHeader icon={Business} title="Performance" />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ChartCard title="Transactions">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sessionData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="sessions" stroke="#1976d2" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard title="Profit">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ChartCard title="Status Distribution">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ChartCard title="Growth">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area dataKey="views" stroke="#4caf50" fill="#4caf50" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ChartCard title="Revenue vs Expenses">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#1976d2" />
                  <Line dataKey="expenses" stroke="#f44336" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── Schedule & Reminder Metrics ── */}
        <SectionHeader icon={EventNote} title="Schedule & Reminder Metrics" />

        <Grid container spacing={1.5} mb={2}>
          {scheduleMetrics.map((item, i) => (
            <SummaryCard key={i} item={item} index={i + 4} />
          ))}
        </Grid>

        <Grid container spacing={2}>
          {/* Upcoming Reminders */}
          <Grid item xs={12} md={5}>
            <PanelCard height={320}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <AccessTime sx={{ fontSize: 16, color: "#1976d2" }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Upcoming Reminders
                </Typography>
              </Box>
              <Box sx={{ overflowY: "auto", flex: 1 }}>
                {upcomingReminders.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 1,
                        px: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        borderLeft: `3px solid ${r.color}`,
                        backgroundColor: "#fafafa",
                        transition: "background 0.2s",
                        "&:hover": { backgroundColor: "#f0f4ff" },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          backgroundColor: r.color,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}
                      >
                        {r.title.charAt(0)}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          noWrap
                          display="block"
                          sx={{ fontSize: "0.72rem" }}
                        >
                          {r.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.65rem" }}
                        >
                          {r.date} · {r.time}
                        </Typography>
                      </Box>
                      <Chip
                        label={r.priority}
                        size="small"
                        sx={priorityChipSx(r.priority)}
                      />
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </PanelCard>
          </Grid>

          {/* Monthly Reminder Completion */}
          <Grid item xs={12} md={7}>
            <PanelCard height={320}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Monthly Reminder Completion
              </Typography>
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={reminderCompletionData} barSize={14}>
                  <XAxis
                    dataKey="month"
                    stroke="#888"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: "0.72rem" }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#4caf50"
                    radius={[3, 3, 0, 0]}
                    animationDuration={1200}
                  />
                  <Bar
                    dataKey="missed"
                    name="Missed"
                    fill="#f44336"
                    radius={[3, 3, 0, 0]}
                    animationDuration={1200}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="#ff9800"
                    radius={[3, 3, 0, 0]}
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </PanelCard>
          </Grid>

          {/* Reminder by Type */}
          <Grid item xs={12} md={4}>
            <PanelCard height={280}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Reminder by Type
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={reminderTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    animationDuration={1000}
                  >
                    {reminderTypeData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: "0.72rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </PanelCard>
          </Grid>

          {/* Overall Completion Rate */}
          <Grid item xs={12} md={4}>
            <PanelCard height={280}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Overall Completion Rate
              </Typography>
              <Box sx={{ position: "relative", width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    data={scheduleCompletionRate}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={6}
                      fill="#4caf50"
                      background={{ fill: "#e8f5e9" }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h5" fontWeight={800} color="#4caf50">
                    79%
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.65rem" }}
                  >
                    Completed
                  </Typography>
                </Box>
              </Box>
            </PanelCard>
          </Grid>

          {/* Priority Breakdown */}
          <Grid item xs={12} md={4}>
            <PanelCard height={280}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>
                Priority Breakdown
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {priorityBreakdown.map((p) => (
                  <Box key={p.priority}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ color: p.color, fontSize: "0.72rem" }}
                      >
                        {p.priority} Priority
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ fontSize: "0.72rem" }}
                      >
                        {p.count} ({p.pct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={p.pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#f0f0f0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: p.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))}
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.68rem" }}
                  >
                    Total Reminders: <strong>128</strong> &nbsp;|&nbsp; Avg. per
                    Month: <strong>21.3</strong>
                  </Typography>
                </Box>
              </Box>
            </PanelCard>
          </Grid>
        </Grid>
      </div>
    </PageLayout>
  );
}
