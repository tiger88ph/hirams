import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function RowActionsMenu({ actions }) {
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
        onClick={(e) => e.stopPropagation()} // ← add this
      >
        {actions.map((action, i) =>
          action ? (
            <React.Fragment key={i}>{action.button}</React.Fragment>
          ) : null,
        )}
      </Box>

      {/* Mobile: show 3-dot menu */}
      <Box
        sx={{ display: { xs: "flex", lg: "none" }, justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()} // ← add this
      >
        <Tooltip title="Actions">
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
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
          PaperProps={{ sx: { minWidth: 160, borderRadius: 2, boxShadow: 3 } }}
        >
          {actions.map((action, i) =>
            action ? (
              <MenuItem
                key={i}
                onClick={() => {
                  action.onClick();
                  setAnchorEl(null);
                }}
                sx={{ gap: 1 }}
              >
                <ListItemIcon
                  sx={{ minWidth: 28, color: `${action.color}.main` }}
                >
                  {action.icon}
                </ListItemIcon>
                <ListItemText
                  primary={action.label}
                  primaryTypographyProps={{ fontSize: "0.85rem" }}
                />
              </MenuItem>
            ) : null,
          )}
        </Menu>
      </Box>
    </>
  );
}
