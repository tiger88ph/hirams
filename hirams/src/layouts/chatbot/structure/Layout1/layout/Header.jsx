import React, { useMemo } from "react";
import { Box, IconButton, Typography, Tooltip, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import getThemeColors from "../../../../../utils/style/getThemeColors";

function Header({
  onClose,
  title = "AI Assistant",
  iconBoxSize = 26,
  iconFontSize = 14,
  titleFontSize = "0.8rem",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.5,
        py: 1,
        borderBottom: `1px solid ${colors.slate.border}`,
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            width: iconBoxSize,
            height: iconBoxSize,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.blue.bgSoft,
          }}
        >
          <AutoAwesome sx={{ fontSize: iconFontSize, color: colors.blue.textStrong }} />
        </Box>
        <Typography sx={{ fontSize: titleFontSize, fontWeight: 700, color: colors.gray.textPrimary }}>
          {title}
        </Typography>
      </Box>
      <Tooltip title="Close">
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" sx={{ color: colors.gray.textSecondary }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default Header;