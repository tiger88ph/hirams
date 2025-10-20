import React from "react";
import { Link } from "react-router-dom";

const SidebarItem = ({ icon, label, to, collapsed, forceExpanded = false, onClick }) => {
  const showLabel = forceExpanded || !collapsed;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 w-full ${
        !collapsed || forceExpanded ? "justify-start" : "justify-center"
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">{icon}</div>
      {showLabel && <span className="truncate text-gray-700 text-sm font-medium">{label}</span>}
    </Link>
  );
};

export default SidebarItem;
