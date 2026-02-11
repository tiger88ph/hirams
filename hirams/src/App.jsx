import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./utils/style/theme";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import useMapping from "./utils/mappings/useMapping";
import { useIdleTimer } from "./utils/auth/useIdleTimer";
import Swal from "sweetalert2";
import { createRoot } from "react-dom/client";
import api from "./utils/api/api";
import DotSpinner from "./components/common/DotSpinner";

// Auth
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Register from "./pages/auth/Register";

// Index
import IndexPage from "./pages/index";
import TransactionCanvas from "./pages/account-officer/TransactionCanvas";
import MTransactionCanvas from "./pages/management/TransactionCanvas";

// Pages
import Dashboard from "./pages/dashboard/Dashboard";
import User from "./pages/management/User";
import Company from "./pages/management/Company";
import Client from "./pages/management/Client";
import Supplier from "./pages/management/Supplier";
import MTransaction from "./pages/management/Transaction";
import PTransaction from "./pages/procurement/Transaction";
import PTransactionInfo from "./pages/procurement/TransactionInfo";
import PTransactionPricing from "./pages/procurement/TransactionPricing";
import Documentation from "./pages/documentation/Index";
import ATransaction from "./pages/account-officer/Transaction";

function AppContent() {
  const { userTypes } = useMapping();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userTypes && Object.keys(userTypes).length > 0) {
      setLoading(false);
    }
  }, [userTypes]);

  // Handle idle timeout - automatic logout
  const handleIdle = async () => {
    const userString = localStorage.getItem("user");

    let user = null;
    try {
      user = JSON.parse(userString || "{}");
    } catch (e) {
      console.error("Failed to parse user:", e);
      return;
    }

    if (user?.nUserId) {
      Swal.fire({
        html: `<div id="spinner-container" style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                  <div id="spinner-root"></div>
                  <span style="font-size:0.85rem;">You have been logged out due to inactivity...</span>
              </div>`,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          const container = document.getElementById("spinner-root");
          if (container) {
            const root = createRoot(container);
            root.render(React.createElement(DotSpinner, { size: 8 }));
          }
        },
      });

      try {
        await api.post("logout", { nUserId: user.nUserId });
        localStorage.clear();
        sessionStorage.clear();

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }

        if ("serviceWorker" in navigator) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        }

        document.cookie
          .split(";")
          .forEach(
            (c) =>
              (document.cookie = c
                .replace(/^ +/, "")
                .replace(
                  /=.*/,
                  `=;expires=${new Date(0).toUTCString()};path=/`,
                )),
          );

        Swal.close();
        window.location.href = "/";
      } catch (error) {
        console.error("Auto-logout failed:", error);
        Swal.close();
        window.location.href = "/";
      }
    }
  };

  // Use idle timer hook (15 minutes)
  useIdleTimer(900000, handleIdle);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DotSpinner size={12} gap={2} color="primary.main" />
      </div>
    );
  }

  const generalManagerLevel = Object.keys(userTypes)[4];
  const managementLevel = Object.keys(userTypes)[1];
  const procurementLevel = Object.keys(userTypes)[3];
  const procurementLeaderLevel = Object.keys(userTypes)[6];
  const accountOfficerLevel = Object.keys(userTypes)[0];
  const accountOfficerLeaderLevel = Object.keys(userTypes)[5];

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/forgotPassword" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/index" element={<IndexPage />} />

      {/* Routes accessible by multiple roles */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              accountOfficerLevel,
              accountOfficerLeaderLevel,
              generalManagerLevel,
              managementLevel,
              procurementLevel,
              procurementLeaderLevel,
            ]}
          />
        }
      >
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/supplier" element={<Supplier />} />
          <Route path="/client" element={<Client />} />
        </Route>
      </Route>

      {/* Dashboard + Management pages */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[generalManagerLevel, managementLevel]}
          />
        }
      >
        <Route element={<Layout />}>
          <Route path="/user" element={<User />} />
          <Route path="/company" element={<Company />} />

          <Route path="/m-transaction" element={<MTransaction />} />
          <Route
            path="/m-transaction-canvas"
            element={<MTransactionCanvas />}
          />
        </Route>
      </Route>

      {/* Procurement pages */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[procurementLevel, procurementLeaderLevel]}
          />
        }
      >
        <Route element={<Layout />}>
          <Route path="/p-transaction" element={<PTransaction />} />
          <Route path="/p-transaction-info" element={<PTransactionInfo />} />
          <Route
            path="/p-transaction-pricing"
            element={<PTransactionPricing />}
          />
          {/* <Route path="/p-client" element={<PClient />} /> */}
        </Route>
      </Route>

      {/* Account Officer pages */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[accountOfficerLevel, accountOfficerLeaderLevel]}
          />
        }
      >
        <Route element={<Layout />}>
          <Route path="/transaction-canvas" element={<TransactionCanvas />} />
          <Route path="/a-transaction" element={<ATransaction />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  const isProduction = import.meta.env.MODE === "production";

  return (
    <ThemeProvider theme={theme}>
      <Router basename={isProduction ? "/hirams" : "/"}>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
