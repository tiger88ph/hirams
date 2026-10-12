import React, { useEffect, useState } from "react";
import { Box, Typography, Card } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useKeysLabels from "../../../hooks/useKeysLabels";
import PageLayout from "../../../components/layouts/page/content-page";
import { getPhilippinesTime } from "../../../utils/helpers/timeZone";
import { getItem } from "../../../utils/storage/localStorage";
import { cardSx } from "./components/overviewStyles";
import ManagementView from "./components/ManagementView";
import ProcurementView from "./components/ProcurementView";
import AOView from "./components/AOView";
import FinanceView from "./components/FinanceView";

// ─── Dashboard ────────────────────────────────────────────────────────────────
// The page shell — the welcome banner plus the dashboard body for the signed-in
// role. Every widget moved out to ./components/<Role>View.jsx so each role can
// carry its own set.

export default function Dashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const user = getItem("user");
  const { isManagement, isProcurement, isAccountOfficer, isFinanceOfficer } =
    useKeysLabels();

  // Live Philippine time, ticking inside the banner.
  const [phTime, setPhTime] = useState(getPhilippinesTime());
  useEffect(() => {
    const updateTime = () => {
      const now = getPhilippinesTime();
      setPhTime(now);
      const delay = 1000 - now.getMilliseconds();
      setTimeout(updateTime, delay);
    };
    updateTime();
  }, []);

  return (
    <PageLayout title={"Dashboard"}>
      <div className="space-y-6">
        {/* Welcome Banner — Themed Gradient */}
        <Card
          sx={{
            ...cardSx(theme),
            background: isDark
              ? "linear-gradient(135deg, #1e293b 0%, #1e1b4b 50%, #1e293b 100%)"
              : "linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 50%, #ede9fe 100%)",
            overflow: "hidden",
            position: "relative",
            border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "#dbeafe"}`,
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
              background: isDark
                ? "rgba(99,102,241,0.12)"
                : "rgba(99,102,241,0.07)",
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
              background: isDark
                ? "rgba(59,130,246,0.10)"
                : "rgba(59,130,246,0.06)",
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
              background: isDark
                ? "rgba(139,92,246,0.10)"
                : "rgba(139,92,246,0.05)",
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
                  color: isDark ? "#a5b4fc" : "#6366f1",
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
                  color: "text.primary",
                  lineHeight: 1.2,
                }}
              >
                {user?.strFName ?? "User"} {user?.strLName ?? ""}
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.6 }}
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
                  bgcolor: isDark
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(99,102,241,0.08)",
                  borderRadius: "20px",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.15)"}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    color: isDark ? "#c7d2fe" : "#6366f1",
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
                background: isDark
                  ? "linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.20) 100%)"
                  : "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.12) 100%)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)"}`,
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

        {/* Role-specific dashboard body — one view per user role */}
        {isManagement && <ManagementView />}
        {isProcurement && <ProcurementView />}
        {isAccountOfficer && <AOView />}
        {isFinanceOfficer && <FinanceView />}
      </div>
    </PageLayout>
  );
}