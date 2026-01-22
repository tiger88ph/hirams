import React from "react";

const SidebarHeader = ({ collapsed, forceExpanded = false }) => {
  const showFull = forceExpanded || !collapsed;

  // Dynamically set logo paths using Vite's BASE_URL
  const logoSrc = showFull
    ? `${import.meta.env.BASE_URL}images/hirams-icon-rectangle.png`
    : `${import.meta.env.BASE_URL}images/hirams-icon-square.png`;

  return (
    <div
      className={`flex items-center w-full gap-2 mb-1 ${
        showFull
          ? "pb-3 border-b border-gray-200"
          : "pl-2 p-1 border-b pt-0 border-gray-200"
      }`}
    >
      <img
        src={logoSrc}
        alt="HIRAMS Logo"
        className="object-contain"
        style={{
          height: showFull ? "2rem" : "2.5rem",
          width: showFull ? `${2 * 4.52}rem` : "2.5rem",
        }}
      />
    </div>
  );
};

export default SidebarHeader;
