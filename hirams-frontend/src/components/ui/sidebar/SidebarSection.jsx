import React from "react";
import SidebarItem from "./SidebarItem";

const SidebarSection = ({ title, items, collapsed, forceExpanded, onClick }) => {
  const showTitle = !collapsed || forceExpanded;
  return (
    <div className="flex flex-col w-full mb-2">
      {showTitle && title && (
        <span className="text-gray-400 uppercase text-[10px] tracking-wider">{title}</span>
      )}
      {items.map((item, idx) => (
        <SidebarItem
          key={idx}
          icon={item.icon}
          label={item.label}
          to={item.to}
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default SidebarSection;
