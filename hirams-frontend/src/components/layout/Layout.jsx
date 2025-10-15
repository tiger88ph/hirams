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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen transition-all">
        <Header
          toggleSidebar={toggleCollapse}
          collapsed={sidebarCollapsed}
          toggleMobileSidebar={toggleMobileSidebar} // pass mobile toggle
        />
        <main className="flex-1 p-4 pr-0 bg-gray-100 overflow-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
