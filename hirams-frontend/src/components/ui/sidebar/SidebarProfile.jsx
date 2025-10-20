import React from "react";

const SidebarProfile = ({ collapsed, forceExpanded = false }) => {
  const showFull = forceExpanded || !collapsed;
  return (
    <div
      className={`flex items-center gap-2 p-2 mt-2 pt-2 border-t pb-0 border-gray-200 rounded-md hover:bg-gray-100 transition cursor-pointer w-full ${
        showFull ? "" : "justify-center"
      }`}
    >
      <div className="bg-gray-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white">
        MF
      </div>
      {showFull && <span className="truncate text-gray-700 text-sm font-medium">Mark Ferguson</span>}
    </div>
  );
};

export default SidebarProfile;
