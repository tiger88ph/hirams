import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  Chip,
  Avatar,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";
import ChartCard from "../../../components/common/ChartCard";
import { getPhilippinesTime, fmtDate } from "../../../utils/helpers/timeZone";
import { getDueDateColor } from "../../../utils/helpers/dueDateColor";
import useMapping from "../../../utils/mappings/useMapping";
import PageLayout from "../../../components/common/PageLayout";
import {
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
  Line,
} from "recharts";
import {
  People,
  Business,
  Group,
  LocalShipping,
  TrendingUp,
} from "@mui/icons-material";
import api from "../../../utils/api/api";

// ─── Data (dummy chart placeholders) ────────────────────────────────────────
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

const STAGE_PALETTE = [
  "#94a3b8",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#10b981",
  "#059669",
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
  }),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

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

/** Ongoing Transactions panel — funnel by stage + urgency-sorted worklist */
function OngoingTransactionsPanel({
  transactions,
  stageOrder,
  navigate,
  sessionKey,
}) {
  const stageCounts = useMemo(() => {
    const counts = {};
    stageOrder.forEach((s) => (counts[s.key] = 0));
    transactions.forEach((t) => {
      const code = String(t.status_code ?? "");
      if (counts[code] !== undefined) counts[code]++;
    });
    return counts;
  }, [transactions, stageOrder]);

  const totalOngoing = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  const worklist = useMemo(() => {
    return [...transactions]
      .filter((t) => t.dtAODueDate)
      .sort((a, b) => new Date(a.dtAODueDate) - new Date(b.dtAODueDate))
      .slice(0, 6);
  }, [transactions]);

  return (
    <Card sx={{ ...cardSx(), p: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Ongoing Transactions
        </Typography>
        <Chip
          label={`${totalOngoing} active`}
          size="small"
          sx={{
            bgcolor: "#e3f2fd",
            color: "#1565c0",
            fontWeight: 700,
            fontSize: "0.68rem",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        {stageOrder.length === 0 && (
          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled" }}>
            Loading stages…
          </Typography>
        )}
        {stageOrder.map((stage) => {
          const count = stageCounts[stage.key] ?? 0;
          const pct = totalOngoing > 0 ? (count / totalOngoing) * 100 : 0;
          return (
            <Box
              key={stage.key}
              onClick={() => {
                sessionStorage.setItem(sessionKey, stage.key);
                navigate("/transaction");
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                "&:hover .stage-bar": { opacity: 0.85 },
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  minWidth: 120,
                  color: "text.secondary",
                }}
                noWrap
              >
                {stage.label}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 16,
                  borderRadius: 1,
                  background: "#f1f5f9",
                  overflow: "hidden",
                }}
              >
                <Box
                  className="stage-bar"
                  sx={{
                    width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                    height: "100%",
                    background: stage.color,
                    transition: "width 0.4s ease, opacity 0.15s",
                    borderRadius: 1,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  minWidth: 20,
                  textAlign: "right",
                }}
              >
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Typography
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          color: "text.disabled",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          mb: 1,
        }}
      >
        Needs Attention
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {worklist.length === 0 && (
          <Typography
            sx={{ fontSize: "0.72rem", color: "text.disabled", py: 1 }}
          >
            Nothing due soon.
          </Typography>
        )}
        {worklist.map((t) => {
          const dueColor = getDueDateColor(t.dtAODueDate);
          const stage = stageOrder.find((s) => s.key === String(t.status_code));
          return (
            <Box
              key={t.id}
              onClick={() => navigate("/transaction")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                borderLeft: `3px solid ${dueColor || "#e2e8f0"}`,
                cursor: "pointer",
                "&:hover": { background: "#f8fafc" },
              }}
            >
              <Box flex={1} minWidth={0}>
                <Typography
                  sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                  noWrap
                >
                  {t.transactionId} — {t.transactionName}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.62rem", color: "text.secondary" }}
                  noWrap
                >
                  {stage?.label ?? "—"} · {t.aoName || "Unassigned"}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: dueColor || "text.secondary",
                  flexShrink: 0,
                }}
              >
                {t.dtAODueDate ? fmtDate(t.dtAODueDate) : "—"}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}

/** Transactions by Month — year selector + Jan-Dec bar chart + peak month */
function TransactionsByMonthCard({
  monthlyTxnCounts,
  peakMonth,
  availableYears,
  selectedYear,
  onYearChange,
}) {
  return (
    <Card sx={{ ...cardSx(), p: 2, height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Transactions by Month
        </Typography>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <Select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            sx={{ fontSize: "0.75rem", height: 32 }}
          >
            {availableYears.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: "0.75rem" }}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", mb: 1 }}>
        Peak: <strong>{peakMonth.month}</strong> ({peakMonth.count}{" "}
        transactions)
      </Typography>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={monthlyTxnCounts}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            label={{
              value: "Transactions",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: "#888" },
            }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
function ProfitByMonthCard({
  data,
  availableYears,
  selectedYear,
  onYearChange,
}) {
  const totals = data.reduce(
    (acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      expenses: acc.expenses + (m.expenses || 0),
      profit: acc.profit + (m.profit || 0),
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  const fmtPHP = (n) =>
    `₱ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card sx={{ ...cardSx(), p: 2, height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Revenue, Expenses & Profit
        </Typography>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <Select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            sx={{ fontSize: "0.75rem", height: 32 }}
          >
            {availableYears.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: "0.75rem" }}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
          Revenue:{" "}
          <strong style={{ color: "#2563eb" }}>{fmtPHP(totals.revenue)}</strong>
        </Typography>
        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
          Expenses:{" "}
          <strong style={{ color: "#f59e0b" }}>
            {fmtPHP(totals.expenses)}
          </strong>
        </Typography>
        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
          Profit:{" "}
          <strong style={{ color: totals.profit >= 0 ? "#16a34a" : "#dc2626" }}>
            {fmtPHP(totals.profit)}
          </strong>
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => fmtPHP(value)} />
          <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#2563eb"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#f59e0b"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="profit"
            name="Profit"
            fill="#16a34a"
            radius={[3, 3, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit Trend"
            stroke="#166534"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
function EmployeeChart({ data, availableYears, selectedYear, onYearChange }) {
  const topEmployees = data.slice(0, 10); // cap for readability

  return (
    <Card sx={{ ...cardSx(), p: 2, height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Employee Performance
        </Typography>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <Select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            sx={{ fontSize: "0.75rem", height: 32 }}
          >
            {availableYears.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: "0.75rem" }}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 1 }}>
        Bars: transactions handled · Line: avg business hours per step
      </Typography>

      {topEmployees.length === 0 ? (
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: "text.disabled",
            py: 4,
            textAlign: "center",
          }}
        >
          No employee activity for {selectedYear}.
        </Typography>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={topEmployees} margin={{ bottom: 40 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{
                value: "hrs",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 10, fill: "#888" },
              }}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
            <Bar
              yAxisId="left"
              dataKey="transactionsHandled"
              name="Transactions"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgBusinessHours"
              name="Avg Hrs/Step"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
function EmployeeRankingPanel({ data, selectedYear }) {
  const ranked = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        if (b.transactionsHandled !== a.transactionsHandled) {
          return b.transactionsHandled - a.transactionsHandled;
        }
        return (a.avgBusinessHours || 0) - (b.avgBusinessHours || 0);
      })
      .slice(0, 10);
  }, [data]);

  const maxHandled = ranked.length > 0 ? ranked[0].transactionsHandled : 0;

  const medalColor = (rank) => {
    if (rank === 0)
      return { bg: "#fef3c7", border: "#fbbf24", text: "#92400e" }; // gold
    if (rank === 1)
      return { bg: "#f1f5f9", border: "#94a3b8", text: "#475569" }; // silver
    if (rank === 2)
      return { bg: "#fed7aa", border: "#fb923c", text: "#9a3412" }; // bronze
    return { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" };
  };

  return (
    <Card sx={{ ...cardSx(), p: 2, height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Rankings
        </Typography>
        <Chip
          label={selectedYear}
          size="small"
          sx={{
            bgcolor: "#e3f2fd",
            color: "#1565c0",
            fontWeight: 700,
            fontSize: "0.65rem",
          }}
        />
      </Box>

      <Typography
        sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 1.5 }}
      >
        Ranked by transactions handled, ties broken by speed
      </Typography>

      {ranked.length === 0 ? (
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: "text.disabled",
            py: 4,
            textAlign: "center",
          }}
        >
          No employee activity for {selectedYear}.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {ranked.map((emp, index) => {
            const medal = medalColor(index);
            const pct =
              maxHandled > 0 ? (emp.transactionsHandled / maxHandled) * 100 : 0;
            return (
              <Box
                key={emp.userId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  border: `1px solid ${medal.border}`,
                  background: medal.bg,
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: medal.text,
                    border: `1.5px solid ${medal.border}`,
                    background: "#fff",
                  }}
                >
                  {index + 1}
                </Box>

                <Box flex={1} minWidth={0}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                    noWrap
                  >
                    {emp.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.3,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        background: "rgba(0,0,0,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.max(pct, 4)}%`,
                          height: "100%",
                          background: medal.text,
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: medal.text,
                    }}
                  >
                    {emp.transactionsHandled}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.58rem", color: "text.secondary" }}
                  >
                    {emp.avgBusinessHours != null
                      ? `${emp.avgBusinessHours}h avg`
                      : "—"}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { transacstatus, loading: mappingLoading } = useMapping();

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
  const [ongoingTxns, setOngoingTxns] = useState([]);
  const [allTxns, setAllTxns] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [profitData, setProfitData] = useState(
    MONTH_LABELS.map((m) => ({ month: m, revenue: 0, expenses: 0, profit: 0 })),
  );
  const [profitYear, setProfitYear] = useState(new Date().getFullYear());
  const [profitLoading, setProfitLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [employeeYear, setEmployeeYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const updateTime = () => {
      const now = getPhilippinesTime();
      setPhTime(now);
      const delay = 1000 - now.getMilliseconds();
      setTimeout(updateTime, delay);
    };
    updateTime();
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

  useEffect(() => {
    let mounted = true;
    api
      .get(`dashboard/employee-performance?year=${employeeYear}`)
      .then((res) => {
        if (!mounted) return;
        setEmployeeData(res.employees || []);
      })
      .catch((err) =>
        console.error("Failed to load employee performance", err),
      );
    return () => {
      mounted = false;
    };
  }, [employeeYear]);
  // ── Ongoing transactions for management ──────────────────────────────────
  useEffect(() => {
    let mounted = true;
    api
      .get("dashboard/ongoing-transactions") // ← CHANGED from "transactions"
      .then((res) => {
        if (!mounted) return;
        const list = res.transactions || res.data || [];
        const formatted = list.filter(Boolean).map((txn, idx) => ({
          id: txn.nTransactionId ?? `txn-fallback-${idx}`,
          transactionId: txn.strCode || "--",
          transactionName: txn.strTitle || "--",
          status_code: txn.current_status ?? txn.latest_history?.nStatus,
          dtAODueDate: txn.dtAODueDate ?? null,
          dtOccur: txn.latest_history?.dtOccur ?? null,
          aoName: txn.user ? `${txn.user.strNickName}`.trim() : "",
        }));
        setOngoingTxns(formatted);
        setAllTxns(formatted);
      })
      .catch((err) =>
        console.error("Failed to load ongoing transactions", err),
      );
    return () => {
      mounted = false;
    };
  }, []);
  // ── Stage order derived from real transacstatus mapping, excludes terminal states ──
  const stageOrder = useMemo(() => {
    if (mappingLoading || !transacstatus) return [];
    return Object.entries(transacstatus)
      .filter(([, label]) => !/archived|closed|cancelled/i.test(label))
      .map(([key, label], i) => ({
        key,
        label,
        color: STAGE_PALETTE[i % STAGE_PALETTE.length],
      }));
  }, [transacstatus, mappingLoading]);

  // ── Years: earliest transaction year through 7 years past today ──────────
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Find the earliest transaction year from the data
    let earliestYear = currentYear;
    allTxns.forEach((t) => {
      if (t.dtOccur) {
        const y = new Date(t.dtOccur).getFullYear();
        if (!isNaN(y) && y < earliestYear) earliestYear = y;
      }
    });

    const lastYear = currentYear + 7;

    const years = [];
    for (let y = earliestYear; y <= lastYear; y++) {
      years.push(y);
    }
    return years.sort((a, b) => b - a); // newest first in the dropdown
  }, [allTxns]);
  // ── Jan–Dec counts for the selected year ──────────────────────────────────
  const monthlyTxnCounts = useMemo(() => {
    const counts = MONTH_LABELS.map((label) => ({ month: label, count: 0 }));
    allTxns.forEach((t) => {
      if (!t.dtOccur) return; // ← CHANGED
      const d = new Date(t.dtOccur); // ← CHANGED
      if (isNaN(d.getTime()) || d.getFullYear() !== selectedYear) return;
      counts[d.getMonth()].count++;
    });
    return counts;
  }, [allTxns, selectedYear]);

  useEffect(() => {
    let mounted = true;
    setProfitLoading(true);
    api
      .get(`dashboard/profit-by-month?year=${profitYear}`)
      .then((res) => {
        if (!mounted) return;
        setProfitData(res.monthly || []);
      })
      .catch((err) => console.error("Failed to load profit chart", err))
      .finally(() => mounted && setProfitLoading(false));
    return () => {
      mounted = false;
    };
  }, [profitYear]);
  const peakMonth = useMemo(() => {
    return monthlyTxnCounts.reduce(
      (max, m) => (m.count > max.count ? m : max),
      { month: "—", count: 0 },
    );
  }, [monthlyTxnCounts]);

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
                  const nowPH = getPhilippinesTime();
                  const hour = nowPH.getHours();
                  return hour < 12
                    ? "Morning"
                    : hour < 18
                      ? "Afternoon"
                      : "Evening";
                })()}
              </Typography>
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
              <Typography
                sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.6 }}
              >
                Here's your overview and performance metrics for this month.
              </Typography>
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
                  })}
                  {" — "}
                  {phTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </Typography>
              </Box>
            </Box>
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
        <Grid container spacing={1.5}>
          {metrics.map((item, i) => (
            <SummaryCard key={i} item={item} index={i} />
          ))}
        </Grid>

        {/* ── Ongoing Transactions ── */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <OngoingTransactionsPanel
              transactions={ongoingTxns}
              stageOrder={stageOrder}
              navigate={navigate}
              sessionKey="selectedStatusCode"
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TransactionsByMonthCard
              monthlyTxnCounts={monthlyTxnCounts}
              peakMonth={peakMonth}
              availableYears={availableYears}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ProfitByMonthCard
              data={profitData}
              availableYears={availableYears}
              selectedYear={profitYear}
              onYearChange={setProfitYear}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <EmployeeChart
              data={employeeData}
              availableYears={availableYears}
              selectedYear={employeeYear}
              onYearChange={setEmployeeYear}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <EmployeeRankingPanel
              data={employeeData}
              selectedYear={employeeYear}
            />
          </Grid>
        </Grid>
      </div>
    </PageLayout>
  );
}
