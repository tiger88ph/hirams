import React from "react";

const SidebarHeader = ({ collapsed, forceExpanded = false }) => {
  const showFull = forceExpanded || !collapsed;
  return (
    <div
      className={`flex items-center w-full gap-2 mb-1 ${
        showFull ? "pl-2 pb-3 border-b border-gray-200" : "pl-4 p-2 border-b border-gray-200"
      }`}
    >
      <img
        src={showFull ? "/hirams-logo.png" : "/hirams-logo-sm.png"}
        alt="HIRAMS Logo"
        className="object-contain"
        style={{
          height: showFull ? "2rem" : "1.9rem",
          width: showFull ? `${2 * 5.52}rem` : "1.9rem",
        }}
      />
    </div>
  );
};

export default SidebarHeader;
