import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const useColors = (c) => ({
  line: c.slate.divider,
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
      <span style={{ width: 10, height: 1, background: c.line }} />
      <span
        className="uppercase text-[10px] tracking-wider whitespace-nowrap"
        style={{ color: c.label }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: c.line }} />
    </div>
  );
};

export default SectionHeader;