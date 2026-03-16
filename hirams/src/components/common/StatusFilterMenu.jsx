import React, { useState } from "react";
import { Menu, MenuItem, useMediaQuery, useTheme, Skeleton } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function StatusFilterMenu({
  statuses = {},
  items = [],
  selectedStatus,
  onSelect,
  pendingClient,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("xs", "sm"));

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (label) => { onSelect(label); handleMenuClose(); };

  const fontSize = isXs ? "0.65rem" : isSm ? "0.75rem" : "1rem";
  const menuItemPadding = isXs ? "2px 8px" : isSm ? "4px 12px" : "6px 16px";
  const menuItemMinHeight = isXs ? 24 : isSm ? 28 : 36;

  const isLoading = Object.keys(statuses).length === 0;

  return (
    <>
      {/* Trigger button */}
      <div
        className="relative flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none max-w-[200px] overflow-hidden"
        onClick={handleMenuClick}
        style={{ fontSize }}
      >
        <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
        {isLoading ? (
          <Skeleton variant="text" width={90} height={16} sx={{ borderRadius: 1 }} />
        ) : (
          <span className="text-gray-700 truncate">{selectedStatus}</span>
        )}
      </div>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            width: isXs ? "70vw" : isSm ? "60vw" : "auto",
            maxWidth: 400,
            maxHeight: "60vh",
          },
        }}
        MenuListProps={{ sx: { padding: 0 } }}
      >
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <MenuItem key={i} disabled sx={{ padding: menuItemPadding, minHeight: menuItemMinHeight }}>
              <Skeleton variant="text" width="80%" height={14} sx={{ borderRadius: 1 }} />
            </MenuItem>
          ))
        ) : (
          Object.entries(statuses).map(([statusCode, label]) => {
            const count = items.filter((item) => item.statusCode === statusCode).length;
            const pendingKey = Object.keys(pendingClient)[2];
            const isCountVisible = statusCode === pendingKey;
            return (
              <MenuItem
                key={label}
                onClick={() => handleMenuSelect(label)}
                selected={selectedStatus === label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  minWidth: 200,
                  fontSize,
                  padding: menuItemPadding,
                  minHeight: menuItemMinHeight,
                }}
              >
                <span>
                  {label}
                  {isCountVisible && count > 0 && (
                    <span className="italic text-gray-500">{` (${count})`}</span>
                  )}
                </span>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
}