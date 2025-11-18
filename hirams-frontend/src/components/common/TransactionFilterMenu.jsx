import React, { useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function TransactionFilterMenu({
  statuses = {}, // { 1: "Create Transaction", 2: "Pending", ... }
  items = [], // array of transactions
  selectedStatus,
  onSelect,
  statusKey = "status", // the property of each item to match status
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (label) => {
    onSelect(label);
    handleMenuClose();
  };

  // Compute counts per status
  const statusCounts = Object.values(statuses).reduce((acc, label) => {
    acc[label] = items.filter((item) => item[statusKey] === label).length;
    return acc;
  }, {});

  return (
    <>
      <div
        className="flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none"
        onClick={handleMenuClick}
      >
        <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
        <span className="text-sm text-gray-700">{selectedStatus}</span>
      </div>

      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        {Object.entries(statuses).map(([statusCode, label]) => {
          const count = statusCounts[label] || 0;
          return (
            <MenuItem
              key={label}
              onClick={() => handleMenuSelect(label)}
              selected={selectedStatus === label}
              className="flex justify-between min-w-[200px]"
            >
              <span>
                {label}{" "}
                {count > 0 && (
                  <span className="italic text-gray-500">({count})</span>
                )}
              </span>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
