import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../../../utils/style/getThemeColors";
import DotSpinner from "../../../../../components/loader/DotSpinner";
const ITEM_HEIGHT = "min-h-[26px]";

const useColors = (c) => ({
  activeBg: c.blue.bgSoft,
  activeText: c.blue.textStrong,
  inactiveText: c.gray.textDisabled,
  hoverBg: c.slate.hover,
  hoverText: c.gray.textSecondary,
  dotActive: c.blue.text,
  dotInactive: c.slate.mutedBorder,
  badgeActiveBg: c.blue.bg,
  badgeActiveText: c.blue.text,
  badgeInactiveBg: c.slate.mutedBg,
  badgeInactiveText: c.gray.textDisabled,
  redBadgeBg: c.red.bg,
  redBadgeText: c.red.text,
  orangeBadgeBg: c.orange.bg,
  orangeBadgeText: c.orange.text,
});

const SidebarSubmenu = ({
  label,
  active = false,
  count,
  redCount,
  orangeCount,
  countLoading = false,
  onClick,
  indent = "pl-5",
}) => {
  const theme = useTheme(),
    isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const rowStyle = active
    ? { backgroundColor: colors.activeBg, color: colors.activeText }
    : { color: colors.inactiveText };
  const handleMouseEnter = (e) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = colors.hoverBg;
      e.currentTarget.style.color = colors.hoverText;
    }
  };
  const handleMouseLeave = (e) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = "transparent";
      e.currentTarget.style.color = colors.inactiveText;
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 ${indent} pr-1.5 rounded-md ${ITEM_HEIGHT} cursor-pointer select-none transition-colors duration-150`}
      style={rowStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <span
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{
          backgroundColor: active ? colors.dotActive : colors.dotInactive,
        }}
      />
      <span
        className={`flex-1 truncate text-[11.5px] ${active ? "font-medium" : ""}`}
      >
        {label}
      </span>
      {countLoading ? (
        <DotSpinner scale={0.28} />
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          {redCount > 0 && (
            <span
              className="text-[9px] font-medium rounded-full px-1 leading-[15px] min-w-[15px] text-center"
              style={{
                backgroundColor: colors.redBadgeBg,
                color: colors.redBadgeText,
              }}
            >
              {redCount}
            </span>
          )}
          {orangeCount > 0 && (
            <span
              className="text-[9px] font-medium rounded-full px-1 leading-[15px] min-w-[15px] text-center"
              style={{
                backgroundColor: colors.orangeBadgeBg,
                color: colors.orangeBadgeText,
              }}
            >
              {orangeCount}
            </span>
          )}
          {count > 0 && (
            <span
              className="text-[9px] font-medium rounded-full px-1 leading-[15px] min-w-[15px] text-center"
              style={{
                backgroundColor: active
                  ? colors.badgeActiveBg
                  : colors.badgeInactiveBg,
                color: active
                  ? colors.badgeActiveText
                  : colors.badgeInactiveText,
              }}
            >
              {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarSubmenu;
