import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const useColors = (c) => ({
  label: c.gray.textDisabled,
});

const SectionHeader = ({ label, collapsed, forceExpanded }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const c = useMemo(() => useColors(base), [base]);

  if (collapsed && !forceExpanded) return null;

  return (
    <div className="flex items-center gap-1.5 mt-1 mb-0.5 px-0.5">
      <span
        className="uppercase text-[10px] tracking-wider whitespace-nowrap"
        style={{ color: c.label }}
      >
        {label}
      </span>
    </div>
  );
};

export default SectionHeader;