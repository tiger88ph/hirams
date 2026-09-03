import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// PROMPT 1 — useColors(c): ONLY tokens from getThemeColors map
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
});

const SidebarHeader = ({ collapsed, forceExpanded = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ✅ Wired EXACTLY as PROMPT 1 specifies
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const showFull = forceExpanded || !collapsed;
  const logoSrc = `${import.meta.env.BASE_URL}images/hirams-icon-square.png`;

  return (
    <div
      className="flex items-center w-full px-0.5 py-1.5 h-10.5 gap-1"
      style={{
        justifyContent: showFull ? "flex-start" : "center",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <img
        src={logoSrc}
        alt="HIRAMS Logo"
        className="object-contain"
        style={{
          width: showFull ? "2.25rem" : "1.75rem",
          height: showFull ? "2.25rem" : "1.75rem",
          flexShrink: 1,
          transition: "all 0.3s ease-in-out",
        }}
      />
      {showFull && (
        <div
          className="flex flex-col justify-center leading-tight min-w-0"
          style={{
            opacity: 1,
            transform: "translateX(0)",
            transition: "all 0.3s ease-in-out",
          }}
        >
          <span
            className="text-xs font-bold truncate"
            style={{ color: colors.textPrimary }}
          >
            Hirams' Supply Wholesaling
          </span>
          <span
            className="text-[0.65rem] font-normal tracking-wide truncate"
            style={{ color: colors.textSecondary }}
          >
            E-COMMERCE WEBSITE
          </span>
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
