import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import SidebarItem from "./SidebarItem";
import getThemeColors from "../../../../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// PROMPT 1 — useColors(c): ONLY tokens from getThemeColors map
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  sectionTitle: c.gray.textDisabled,
});

const SidebarSection = ({
  title,
  items,
  collapsed,
  forceExpanded,
  onClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ✅ Wired EXACTLY as PROMPT 1 specifies
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const showTitle = !collapsed || forceExpanded;

  return (
    <div className="flex flex-col w-full mb-2">
      {showTitle && title && (
        <span
          className="uppercase text-[10px] tracking-wider mb-0.5 px-0.5"
          style={{ color: colors.sectionTitle }}
        >
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
