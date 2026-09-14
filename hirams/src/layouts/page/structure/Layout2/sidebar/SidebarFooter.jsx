import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import { useLogout } from "../../../../../utils/auth/logout";
import getThemeColors from "../../../../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// PROMPT 1 — useColors(c): ONLY tokens from getThemeColors map
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  hoverBg: c.slate.hover,
  textSecondary: c.gray.textSecondary,
  textPrimary: c.gray.textPrimary,
  textDisabled: c.gray.textDisabled,
});

const SidebarFooter = ({
  collapsed,
  forceExpanded = false,
  toggleCollapse,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ✅ Wired EXACTLY as PROMPT 1 specifies
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const showFull = forceExpanded || !collapsed;
  const logout = useLogout();
  const isCollapsed = collapsed && !forceExpanded;

  return (
    <div className="flex flex-col w-full px-1.5 py-1.5 gap-0.5">
      {/* Row 1: Collapse UI */}
      <div
        className="flex items-center justify-center gap-2 rounded-md transition-colors duration-150
          cursor-pointer select-none w-full min-h-[30px]"
        style={{ color: colors.textSecondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hoverBg;
          e.currentTarget.style.color = colors.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = colors.textSecondary;
        }}
        onClick={toggleCollapse}
        title={showFull ? "Collapse" : "Expand"}
      >
        {isCollapsed ? (
          <ChevronRightIcon
            sx={{ fontSize: 16, color: colors.textSecondary }}
          />
        ) : (
          <>
            <ChevronLeftIcon
              sx={{ fontSize: 16, color: colors.textSecondary }}
            />
            <span className="text-[13px] font-medium">Collapse UI</span>
          </>
        )}
      </div>

      {/* Row 2: Sign Out */}
      <div
        className="flex items-center justify-center gap-2 rounded-md transition-colors duration-150
          cursor-pointer select-none w-full min-h-[30px]"
        style={{ color: colors.textSecondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hoverBg;
          e.currentTarget.style.color = colors.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = colors.textSecondary;
        }}
        onClick={logout}
        title="Sign Out"
      >
        <LogoutIcon sx={{ fontSize: 16, color: colors.textSecondary }} />
        {!isCollapsed && (
          <span className="text-[13px] font-medium">Sign Out</span>
        )}
      </div>

      {/* Row 3: Version — centered always */}
      <div className="flex items-center justify-center w-full py-1">
        <span
          className={`tracking-wide ${showFull ? "text-[10px]" : "text-[9px]"}`}
          style={{ color: colors.textDisabled }}
        >
          {showFull ? "Version 06.38.90" : "v06.38.90"}
        </span>
      </div>
    </div>
  );
};

export default SidebarFooter;
