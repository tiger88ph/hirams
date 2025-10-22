import React from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import HEADER_TITLES from "../../utils/header/page";

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
  const metrics = [
    { title: "Users", value: "14k", change: "+25%", color: "#4caf50" },
    { title: "Company", value: "120", change: "+5%", color: "#1976d2" },
    { title: "Clients", value: "1.2k", change: "-10%", color: "#f44336" },
    { title: "Suppliers", value: "340", change: "+8%", color: "#9e9e9e" },
  ];

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-4 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          {HEADER_TITLES.DASHBOARD}
        </h1>
      </header>

      <div className="space-y-6">
        {/* First Row: Welcome */}
        <Box className="bg-white p-4 rounded-lg shadow">
          <Typography variant="h6" fontWeight="bold">
            Welcome back, User!
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Here's a quick overview of your metrics and performance this month.
          </Typography>
        </Box>

        {/* Second Row: Metrics */}
        <Grid container spacing={2}>
          {metrics.map((item, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card className="bg-white rounded-lg shadow p-4">
                <Typography variant="subtitle2" color="textSecondary">
                  {item.title}
                </Typography>
                <Typography variant="h5" fontWeight="bold" mt={0.5}>
                  {item.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: item.color, fontWeight: 600 }}
                >
                  {item.change} from last month
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Third Row: Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card className="bg-white rounded-lg shadow p-4" style={{ height: 300 }}>
              <Typography variant="subtitle1" mb={1}>
                Sessions
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={sessionData}>
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#1976d2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="bg-white rounded-lg shadow p-4" style={{ height: 300 }}>
              <Typography variant="subtitle1" mb={1}>
                Page Views & Downloads
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="views" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
