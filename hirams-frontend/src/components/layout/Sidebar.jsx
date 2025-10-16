import React from "react";
import { Link } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import FolderIcon from "@mui/icons-material/Folder";
import BookIcon from "@mui/icons-material/Book";

function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  const ICON_CLASS = "w-6 h-6 flex items-center justify-center flex-shrink-0";

  const SidebarItem = ({ icon, label, to, forceExpanded = false }) => {
    const showLabel = forceExpanded || !collapsed;
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)} // close mobile sidebar on click
        className={`flex items-center p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 w-full ${
          !collapsed || forceExpanded ? "justify-start" : "justify-center"
        }`}
      >
        <div className={ICON_CLASS}>{icon}</div>
        {showLabel && (
          <span className="truncate text-gray-700 text-sm font-medium">{label}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ forceExpanded = false }) => (
    <div
      className={`flex flex-col ${
        forceExpanded ? "items-start" : collapsed ? "items-center" : "items-start"
      } p-3 h-full`}
    >
      {/* Logo */}
      <div
        className={`flex items-center w-full gap-2 mb-1 ${
          forceExpanded || !collapsed ? "pl-2 pb-3 border-b border-gray-200" : "pl-4 p-2 border-b border-gray-200"
        }`}
      >
        <img
          src={forceExpanded || !collapsed ? "/hirams-logo.png" : "/hirams-logo-sm.png"}
          alt="HIRAMS Logo"
          className="object-contain"
          style={{
            height: forceExpanded || !collapsed ? "2rem" : "1.9rem",
            width: forceExpanded || !collapsed ? `${2 * 5.52}rem` : "1.9rem",
          }}
        />
      </div>

      {/* Links */}
      {(!collapsed || forceExpanded) && (
        <span className="text-gray-400 uppercase text-[10px] tracking-wider">PLATFORM</span>
      )}
      <SidebarItem icon={<DashboardIcon fontSize="small" />} label="Dashboard" to="/" forceExpanded={forceExpanded} />
      {(!collapsed || forceExpanded) && (
        <span className="text-gray-400 uppercase text-[10px] tracking-wider">MANAGEMENT</span>
      )}
      <SidebarItem icon={<PeopleIcon fontSize="small" />} label="User" to="/user" forceExpanded={forceExpanded} />
      <SidebarItem icon={<BusinessIcon fontSize="small" />} label="Company" to="/company" forceExpanded={forceExpanded} />
      <SidebarItem icon={<PersonIcon fontSize="small" />} label="Client" to="/client" forceExpanded={forceExpanded} />
      <SidebarItem icon={<PersonIcon fontSize="small" />} label="Supplier" to="/supplier" forceExpanded={forceExpanded} />

      {/* Bottom */}
      <div className={`flex flex-col gap-2 mt-auto w-full ${forceExpanded || !collapsed ? "items-start" : "items-center"}`}>
        {(!collapsed || forceExpanded) && (
          <span className="text-gray-400 uppercase text-[10px] tracking-wider">OTHERS</span>
        )}

        <nav className="flex flex-col w-full">
          <SidebarItem icon={<FolderIcon fontSize="small" />} label="Repository" to="/repository" forceExpanded={forceExpanded} />
          <SidebarItem icon={<BookIcon fontSize="small" />} label="Documentation" to="/docs" forceExpanded={forceExpanded} />
        </nav>

        <div className={`flex items-center gap-2 p-2 mt-2 pt-2 border-t pb-0 border-gray-200 rounded-md hover:bg-gray-100 transition cursor-pointer w-full ${forceExpanded || !collapsed ? "" : "justify-center"}`}>
          <div className="bg-gray-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white">
            MF
          </div>
          {(forceExpanded || !collapsed) && (
            <span className="truncate text-gray-700 text-sm font-medium">Mark Ferguson</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex h-screen bg-white shadow-lg transition-all duration-300 border-r border-gray-200 ${collapsed ? "w-20" : "w-56"} flex-col overflow-y-auto`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile + Tablet Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black opacity-30"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Panel */}
          <div className="relative z-50 w-56 bg-white h-full shadow-lg flex flex-col overflow-y-auto">
            {/* forceExpanded ensures icons + labels are always visible on mobile/tablet */}
            <SidebarContent forceExpanded={true} />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
