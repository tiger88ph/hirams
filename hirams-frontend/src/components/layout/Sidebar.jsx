import React from "react";
import { Link } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People"; // User
import BusinessIcon from "@mui/icons-material/Business"; // Company
import PersonIcon from "@mui/icons-material/Person"; // Client
import FolderIcon from "@mui/icons-material/Folder"; // Repository
import BookIcon from "@mui/icons-material/Book"; // Documentation

function Sidebar({ collapsed }) {
  const ICON_CLASS = "w-6 h-6 flex items-center justify-center flex-shrink-0";

  const SidebarItem = ({ icon, label, to }) => (
    <Link
      to={to}
      className={`flex items-center p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 w-full ${
        !collapsed ? "justify-start" : "justify-center"
      }`}
    >
      <div className={ICON_CLASS}>{icon}</div>
      {!collapsed && (
        <span className="truncate text-gray-700 text-sm font-medium">
          {label}
        </span>
      )}
    </Link>
  );

  return (
    <aside
      className={`h-screen bg-white shadow-lg transition-all duration-300 border-r border-gray-200 ${
        collapsed ? "w-20" : "w-56"
      } flex flex-col overflow-y-auto`}
    >
      <div
        className={`flex flex-col ${
          collapsed ? "items-center" : "items-start"
        } p-3`}
      >
        {/* Logo */}
        <div
          className={`flex items-center w-full gap-2 mb-1 ${
            collapsed ? "pl-4" : "pl-2 pb-3 border-b border-gray-200"
          }`}
        >
          <img
            src={collapsed ? "/hirams-logo-sm.png" : "/hirams-logo.png"}
            alt="HIRAMS Logo"
            className="object-contain"
            style={{
              height: collapsed ? "1.5rem" : "2rem", // smaller height
              width: collapsed ? "1.5rem" : `${2 * 5.52}rem`, // maintains aspect ratio
            }}
          />
        </div>

        {!collapsed && (
          <span className="text-gray-400 uppercase text-[10px] tracking-wider">
            PLATFORM
          </span>
        )}

        {/* Main Links */}
        <SidebarItem
          icon={<DashboardIcon fontSize="small" />}
          label="Dashboard"
          to="/"
        />
        {!collapsed && (
          <span className="text-gray-400 uppercase text-[10px] tracking-wider">
            MANAGEMENT
          </span>
        )}
        <SidebarItem
          icon={<PeopleIcon fontSize="small" />}
          label="User"
          to="/user"
        />
        <SidebarItem
          icon={<BusinessIcon fontSize="small" />}
          label="Company"
          to="/company"
        />
        <SidebarItem
          icon={<PersonIcon fontSize="small" />}
          label="Client"
          to="/client"
        />
      </div>

      {/* Bottom Section */}
      <div
        className={`flex flex-col gap-2 ${
          collapsed ? "items-center" : "items-start"
        } p-3 w-full mt-auto`}
      >
        {!collapsed && (
          <span className="text-gray-400 uppercase text-[10px] tracking-wider">
            OTHERS
          </span>
        )}

        <nav className="flex flex-col w-full">
          <SidebarItem
            icon={<FolderIcon fontSize="small" />}
            label="Repository"
            to="/repository"
          />
          <SidebarItem
            icon={<BookIcon fontSize="small" />}
            label="Documentation"
            to="/docs"
          />
        </nav>

        {/* User profile */}
        <div
          className={`flex items-center gap-2 p-2 mt-2 pt-2 border-t pb-0 border-gray-200 rounded-md hover:bg-gray-100 transition cursor-pointer w-full ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="bg-gray-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white">
            MF
          </div>
          {!collapsed && (
            <span className="truncate text-gray-700 text-sm font-medium">
              Mark Ferguson
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
