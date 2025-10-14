// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import User from "./pages/User";
import Company from "./pages/Company";
import Client from "./pages/Client";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/user" element={<User />} />
          <Route path="/company" element={<Company />} />
            <Route path="/client" element={<Client />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
