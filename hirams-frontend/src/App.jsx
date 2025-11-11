import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Index (shown when user is NOT logged in)
import IndexPage from "./pages/index";

// Pages
import Dashboard from "./pages/dashboard/Dashboard";
import User from "./pages/management/User";
import Company from "./pages/management/Company";
import Client from "./pages/management/Client";
import Supplier from "./pages/management/Supplier";
import MTransaction from "./pages/management/Transaction";
import PTransaction from "./pages/procurement/Transaction";
import PClient from "./pages/procurement/Client";
import Index from "./pages/documentation/index";

import ATransaction from "./pages/account-officer/Transaction";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/index" element={<IndexPage />} />

        <Route element={<ProtectedRoute allowedRoles={["A", "M", "P"]} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documention" element={<Index />} />
          </Route>
        </Route>

        {/* Dashboard + Management pages → ADMIN, MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={["M"]} />}>
          <Route element={<Layout />}>
            <Route path="/user" element={<User />} />
            <Route path="/company" element={<Company />} />
            <Route path="/client" element={<Client />} />
            <Route path="/supplier" element={<Supplier />} />
            <Route path="/m-transaction" element={<MTransaction />} />
          </Route>
        </Route>

        {/* Procurement pages → ADMIN, PROCUREMENT */}
        <Route element={<ProtectedRoute allowedRoles={["P"]} />}>
          <Route element={<Layout />}>
            <Route path="/p-transaction" element={<PTransaction />} />
            <Route path="/p-client" element={<PClient />} />
          </Route>
        </Route>
        {/* Procurement pages → ADMIN, PROCUREMENT */}
        <Route element={<ProtectedRoute allowedRoles={["A"]} />}>
          <Route element={<Layout />}>
            <Route path="/a-transaction" element={<ATransaction />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
