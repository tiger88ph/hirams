import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import User from "./pages/management/User";
import Company from "./pages/management/Company";
import Client from "./pages/management/Client";
import Supplier from "./pages/management/Supplier";
import Login from "./pages/auth/login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Index from "./pages/documentation/index";
import PTransaction from "./pages/procurement/Transaction";
import MTransaction from "./pages/management/Transaction";


function App() {
  return (
    <Router>
      <Routes>
        {/* Login route without Layout */}
        <Route path="/login" element={<Login />} />
        {/* Login route without Layout */}
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        {/* All other routes with Layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/user" element={<User />} />
                <Route path="/company" element={<Company />} />
                <Route path="/client" element={<Client />} />
                <Route path="/supplier" element={<Supplier />} />
                <Route path="/documention" element={<Index />} />
                <Route path="/p-transaction" element={<PTransaction />} />
                <Route path="/m-transaction" element={<MTransaction />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
