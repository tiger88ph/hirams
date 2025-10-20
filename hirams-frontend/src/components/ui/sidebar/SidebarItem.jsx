import React from "react";
import { Link } from "react-router-dom";
import { cloneElement } from "react";

const SidebarItem = ({ icon, label, to, collapsed, forceExpanded = false, onClick }) => {
  const showLabel = forceExpanded || !collapsed;

  // Clone the icon and inject color
  const coloredIcon = icon
    ? cloneElement(icon, {
        sx: { color: "#0d47a1", fontSize: 20 }, // adjust size if needed
      })
    : null;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 w-full ${
        !collapsed || forceExpanded ? "justify-start" : "justify-center"
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {coloredIcon}
      </div>
      {showLabel && <span className="truncate text-gray-700 text-sm font-medium">{label}</span>}
    </Link>
  );
};

export default SidebarItem;
