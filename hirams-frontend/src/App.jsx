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
                <Route path="/" element={<Dashboard />} />
                <Route path="/user" element={<User />} />
                <Route path="/company" element={<Company />} />
                <Route path="/client" element={<Client />} />
                <Route path="/supplier" element={<Supplier />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
