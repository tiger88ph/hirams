import React from "react";
import SidebarItem from "./SidebarItem";

/**
 * SidebarSection
 *
 * Renders a labeled group of nav items.
 *
 * Props:
 *   title        — section heading (e.g. "MANAGEMENT"), hidden when collapsed
 *   items        — array of { icon, label, to, children?, defaultOpen? }
 *   collapsed    — sidebar collapsed state
 *   forceExpanded — mobile override
 *   onClick      — forwarded to each SidebarItem
 */
const SidebarSection = ({ title, items, collapsed, forceExpanded, onClick }) => {
  const showTitle = !collapsed || forceExpanded;

  return (
    <div className="flex flex-col w-full mb-2">
      {showTitle && title && (
        <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
          {title}
        </span>
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
          defaultOpen={item.defaultOpen}
        >
          {item.children}
        </SidebarItem>
      ))}
    </div>
  );
};

export default SidebarSection;