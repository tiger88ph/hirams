import React from "react";
import SidebarContent from "../ui/sidebar/SidebarContent";

const Sidebar = ({ collapsed, mobileOpen, setMobileOpen }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex h-screen bg-white shadow-lg transition-all duration-300 border-r border-gray-200 ${
          collapsed ? "w-20" : "w-56"
        } flex-col overflow-y-auto`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-56 bg-white h-full shadow-lg flex flex-col overflow-y-auto">
            <SidebarContent collapsed={false} forceExpanded onItemClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
