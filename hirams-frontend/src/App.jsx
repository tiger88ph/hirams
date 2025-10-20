// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import User from "./pages/management/User";
import Company from "./pages/management/Company";
import Client from "./pages/management/Client";
import Supplier from "./pages/management/Supplier";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/user" element={<User />} />
          <Route path="/company" element={<Company />} />
          <Route path="/client" element={<Client />} />
          <Route path="/supplier" element={<Supplier />} />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
