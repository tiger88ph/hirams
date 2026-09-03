import React, { useState, useMemo } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
  useTheme as useMuiTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  slateBorder: c.slate.border,
  slateHover: c.slate.hover,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  // Accent color refs for dynamic lookups
  blue: c.blue,
  green: c.green,
  red: c.red,
  amber: c.amber,
  cyan: c.cyan,
  slate: c.slate,
});

// ── Resolve action color from color string → theme token ────────────────
const resolveColorGroup = (colorName, c) => {
  const map = {
    default: c.slate,
    primary: c.blue,
    secondary: c.slate,
    success: c.green,
    danger: c.red,
    warning: c.amber,
    info: c.cyan || c.blue,
    blue: c.blue,
    green: c.green,
    red: c.red,
    amber: c.amber,
    cyan: c.cyan,
  };
  return map[colorName] || c.slate;
};

export default function RowActionsMenu({ actions }) {
  const muiTheme = useMuiTheme();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      {/* Desktop: show individual buttons */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          gap: 1,
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, i) =>
          action ? (
            <React.Fragment key={i}>{action.button}</React.Fragment>
          ) : null
        )}
      </Box>

      {/* Mobile: show 3-dot menu */}
      <Box
        sx={{ display: { xs: "flex", lg: "none" }, justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Actions">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              minWidth: 160,
              borderRadius: 2,
              boxShadow: 3,
              bgcolor: muiTheme.palette.background.paper,
              border: `1px solid ${colors.slateBorder}`,
            },
          }}
        >
          {actions.map((action, i) =>
            action ? (
              <MenuItem
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick?.();
                  setAnchorEl(null);
                }}
                sx={{
                  gap: 1,
                  color: colors.textPrimary,
                  "&:hover": {
                    bgcolor: colors.slateHover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 28,
                    color: resolveColorGroup(action.color, base).text,
                  }}
                >
                  {action.icon}
                </ListItemIcon>
                <ListItemText
                  primary={action.label}
                  primaryTypographyProps={{ fontSize: "0.85rem" }}
                />
              </MenuItem>
            ) : null
          )}
        </Menu>
      </Box>
    </>
  );
}