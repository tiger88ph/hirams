import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Card } from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import api from "../../utils/api/api";

// Sample Data
const sessionData = [
  { name: "Apr 1", sessions: 2000 },
  { name: "Apr 10", sessions: 8000 },
  { name: "Apr 15", sessions: 13000 },
  { name: "Apr 25", sessions: 15000 },
  { name: "Apr 30", sessions: 18000 },
];

const monthlyData = [
  { month: "Jan", views: 8000 },
  { month: "Feb", views: 10000 },
  { month: "Mar", views: 7000 },
  { month: "Apr", views: 12000 },
  { month: "May", views: 9000 },
  { month: "Jun", views: 11000 },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState([
    { title: "Users", value: 0, change: "Total", color: "#4caf50" },
    { title: "Company", value: 0, change: "Total", color: "#1976d2" },
    { title: "Clients", value: 0, change: "Total", color: "#f44336" },
    { title: "Suppliers", value: 0, change: "Total", color: "#9e9e9e" },
  ]);

useEffect(() => {
  let mounted = true;

  const loadDashboardMetrics = async () => {
    try {
      const res = await api.get("dashboard/total-metrics");
      const data = res?.totals ?? {};

      if (!mounted) return;

      setMetrics([
        { ...metrics[0], value: Number(data.users).toLocaleString() },
        { ...metrics[1], value: Number(data.companies).toLocaleString() },
        { ...metrics[2], value: Number(data.clients).toLocaleString() },
        { ...metrics[3], value: Number(data.suppliers).toLocaleString() },
      ]);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    }
  };

  loadDashboardMetrics();
  return () => {
    mounted = false;
  };
}, []);


  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-4 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">Dashboard</h1>
      </header>

      <div className="space-y-6">
        {/* Welcome */}
        <Box className="bg-white p-4 rounded-lg shadow">
          <Typography variant="h6" fontWeight="bold">
            Welcome back, {user?.strFName ?? "User"}!
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Here's a quick overview of your metrics and performance this month.
          </Typography>
        </Box>

        {/* Metrics */}
        <Grid container spacing={2}>
          {metrics.map((item, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <motion.div
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="bg-white rounded-lg shadow p-4">
                  <Typography variant="subtitle2" color="text.secondary">
                    {item.title}
                  </Typography>

                  {/* CountUp Animation */}
                  <Typography variant="h5" fontWeight="bold" mt={0.5}>
                    <CountUp
                      start={0}
                      end={Number(item.value)}
                      duration={2} // start fast and slow down
                      separator=","
                      useEasing={true}
                      easingFn={(t) => t * t * t} // ease-out cubic
                    />
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: item.color, fontWeight: 600 }}
                  >
                    {item.change && `${item.change}`}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card className="bg-white rounded-lg shadow p-4" sx={{ height: 300 }}>
              <Typography variant="subtitle1" mb={1}>
                Transactions
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={sessionData}>
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#1976d2"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="bg-white rounded-lg shadow p-4" sx={{ height: 300 }}>
              <Typography variant="subtitle1" mb={1}>
                Page Views & Downloads
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar
                    dataKey="views"
                    fill="#1976d2"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
