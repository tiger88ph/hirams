import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AnnouncementStructure from "../../../../../components/structure/AnnouncementStructure";

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  return (
    <>
      <AnnouncementStructure />
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <Header
            toggleSidebar={toggleCollapse}
            collapsed={sidebarCollapsed}
            toggleMobileSidebar={toggleMobileSidebar}
          />
          <main className="flex-1 min-w-0 overflow-auto bg-gray-100 p-4">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default Layout;
