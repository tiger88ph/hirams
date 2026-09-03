import React from "react";

const SectionHeader = ({ label, collapsed, forceExpanded }) => {
  if (collapsed && !forceExpanded) return null;
  return (
    <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
      {label}
    </span>
  );
};

export default SectionHeader;
