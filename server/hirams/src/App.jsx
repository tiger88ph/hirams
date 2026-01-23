import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import useMapping from "./utils/mappings/useMapping";

// Auth
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Index (shown when user is NOT logged in)
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
import PClient from "./pages/procurement/Client";
import Documentation from "./pages/documentation/Index"; // Renamed to avoid conflict
import ASupplier from "./pages/account-officer/Supplier";
import ATransaction from "./pages/account-officer/Transaction";
import DotSpinner from "./components/common/DotSpinner";

function App() {
  const { userTypes } = useMapping();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userTypes && Object.keys(userTypes).length > 0) {
      setLoading(false);
    }
  }, [userTypes]);

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
    <Router basename="/hirams">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
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
          </Route>
        </Route>

        {/* Dashboard + Management pages → General Manager, Management */}
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
            <Route path="/client" element={<Client />} />
            <Route path="/supplier" element={<Supplier />} />
            <Route path="/m-transaction" element={<MTransaction />} />
            <Route
              path="/m-transaction-canvas"
              element={<MTransactionCanvas />}
            />
          </Route>
        </Route>

        {/* Procurement pages → Procurement Level */}
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
            <Route path="/p-client" element={<PClient />} />
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
            <Route path="/a-supplier" element={<ASupplier />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
