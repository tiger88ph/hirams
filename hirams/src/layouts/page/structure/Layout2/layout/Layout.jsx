import React, { useState, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import Sidebar from "./Sidebar";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const useColors = (c) => ({
  layoutBg: c.slate.outerBg,
});

function Layout() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  return (
    <>
      {/* items-stretch makes sidebar fill full height — DO NOT CHANGE */}
      <div
        className="flex items-stretch h-screen w-full overflow-hidden py-2 pl-2 gap-1"
        style={{ backgroundColor: colors.layoutBg }}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          toggleCollapse={toggleCollapse}
        />
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <main className="flex-1 min-w-0 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export default Layout;