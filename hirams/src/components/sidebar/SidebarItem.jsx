import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cloneElement } from "react";

const SidebarItem = ({ icon, label, to, collapsed, forceExpanded = false, onClick }) => {
  const { pathname } = useLocation();
  const active =
    pathname === to ||
    pathname.startsWith(to + "-") ||
    pathname.startsWith(to + "/");
  const showLabel = forceExpanded || !collapsed;

  const coloredIcon = icon
    ? cloneElement(icon, {
        sx: { color: active ? "#1565c0" : "#0d47a1", fontSize: 20 },
      })
    : null;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center p-2 rounded-md transition-colors duration-200 w-full ${
        !collapsed || forceExpanded ? "justify-start" : "justify-center"
      }`}
      style={{
        backgroundColor: active ? "rgba(21,101,192,0.1)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = active
          ? "rgba(21,101,192,0.1)"
          : "transparent";
      }}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {coloredIcon}
      </div>
      {showLabel && (
        <span
          className="truncate text-sm font-medium"
          style={{ color: active ? "#1565c0" : "#374151", marginLeft: "8px", flex: 1 }}
        >
          {label}
        </span>
      )}
    </Link>
  );
};

export default SidebarItem;