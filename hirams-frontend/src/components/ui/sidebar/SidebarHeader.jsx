import React from "react";

const SidebarHeader = ({ collapsed, forceExpanded = false }) => {
  const showFull = forceExpanded || !collapsed;
  return (
    <div
      className={`flex items-center w-full gap-2 mb-1 ${
        showFull ? "pl-1 pb-4 pt-1 border-b border-gray-200" : "pl-2 p-1 border-b pt-0 border-gray-200"
      }`}
    >
      <img
        src={showFull ? "/hirams-logo.png" : "/hirams-logo-sm.png"}
        alt="HIRAMS Logo"
        className="object-contain"
        style={{
          height: showFull ? "1.5rem" : "2.5rem",
          width: showFull ? `${2 * 4.52}rem` : "2.5rem",
        }}
      />
    </div>
  );
};

export default SidebarHeader;
