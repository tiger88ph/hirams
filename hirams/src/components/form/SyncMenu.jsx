import React, { useState, useMemo } from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  slateBorder: c.slate.border,
  slateHover: c.slate.hover,
  iconColor: c.gray.textSecondary,
  syncColor: c.blue.text,
});

export default function SyncMenu({ onSync = () => {} }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [rotating, setRotating] = useState(false);

  const handleClick = () => {
    setRotating(true);
    onSync();

    // stop rotating after 1.5 seconds
    setTimeout(() => {
      setRotating(false);
    }, 1500);
  };

  return (
    <Tooltip title="Sync">
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          color: colors.iconColor,
          border: `1px solid ${colors.slateBorder}`,
          borderRadius: "999px",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: colors.slateHover,
            color: colors.syncColor,
            borderColor: colors.syncColor,
          },
        }}
      >
        <AutorenewIcon
          fontSize="small"
          className={rotating ? "rotate-sync" : ""}
          sx={rotating ? { color: colors.syncColor } : {}}
        />
      </IconButton>
    </Tooltip>
  );
}