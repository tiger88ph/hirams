import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-screen">
        <Header
          toggleSidebar={toggleCollapse}
          collapsed={sidebarCollapsed}
          toggleMobileSidebar={toggleMobileSidebar}
        />

        <main className="flex-1 p-3 pr-0 overflow-auto bg-gray-100">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default Layout;
