import React, { useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function StatusFilterMenu({
  statuses = {},     // e.g. { A: "Active", I: "Inactive" }
  items = [],        // array of objects containing `statusCode`
  selectedStatus,
  onSelect,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (label) => {
    onSelect(label);
    handleMenuClose();
  };

  return (
    <>
      {/* Trigger */}
      <div
        className="relative flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none"
        onClick={handleMenuClick}
      >
        <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
        <span className="text-sm text-gray-700">{selectedStatus}</span>
      </div>

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        {Object.entries(statuses).map(([statusCode, label]) => {
          const count = items.filter((item) => item.statusCode === statusCode).length;
          return (
            <MenuItem
              key={label}
              onClick={() => handleMenuSelect(label)}
              selected={selectedStatus === label}
              className="min-w-[200px]"
            >
              <span className="text-gray-900">
                {label}
                {count > 0 && <span className="italic text-gray-500">{` (${count})`}</span>}
              </span>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
