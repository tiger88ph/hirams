import React, { useState } from "react";
import { Menu, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import DotSpinner from "./DotSpinner";
export default function TransactionFilterMenu({
  statuses = {},
  items = [],
  selectedStatus,
  onSelect,
  forAssignmentCode = {},
  itemsManagementCode = {},
  itemsVerificationCode = {},
  forCanvasCode = {},
  statusKey = "status",
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const theme = useTheme();

  const isXs = useMediaQuery(theme.breakpoints.down("xs")); // very small <360px
  const isSm = useMediaQuery(theme.breakpoints.between("xs", "sm")); // 360–600px
  const isMdUp = useMediaQuery(theme.breakpoints.up("sm")); // >600px

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (label) => {
    onSelect(label);
    handleMenuClose();
  };

  const statusCounts = Object.entries(statuses).reduce(
    (acc, [statusCode, label]) => {
      let count = 0;

      if (label === "For Assignment") {
        const allowedCodes = [
          String(forAssignmentCode),
          String(itemsManagementCode),
          String(itemsVerificationCode),
          String(forCanvasCode),
        ];

        count = items.filter((item) =>
          allowedCodes.includes(String(item.latest_history?.nStatus))
        ).length;
      } else {
        count = items.filter((item) => item[statusKey] === label).length;
      }

      acc[label] = count;
      return acc;
    },
    {}
  );

  const fontSize = isXs ? "0.65rem" : isSm ? "0.75rem" : "1rem";
  const menuItemPadding = isXs ? "2px 8px" : isSm ? "4px 12px" : "6px 16px";
  const menuItemMinHeight = isXs ? 24 : isSm ? 28 : 36;

  return (
    <>
      <div
        className="flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none max-w-[200px] overflow-hidden"
        onClick={handleMenuClick}
        title={selectedStatus}
        style={{ fontSize }}
      >
        <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
        <span className="text-gray-700 truncate">{selectedStatus}</span>

        {/* Show DotSpinner if statuses is empty or still loading */}
        {Object.keys(statuses).length === 0 && (
          <DotSpinner className="ml-2" size={6} gap={0} color="primary.main" />
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
        MenuListProps={{
          sx: { padding: 0 },
        }}
      >
        {Object.keys(statuses).length === 0 ? (
          // Show spinner inside menu if loading
          <MenuItem sx={{ justifyContent: "center", minHeight: 48 }}>
            <DotSpinner size={8} gap={1} color="primary.main" />
          </MenuItem>
        ) : (
          Object.entries(statuses).map(([statusCode, label]) => {
            const count = statusCounts[label] || 0;
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
                  {label}{" "}
                  {count > 0 && (
                    <span className="italic text-gray-500">({count})</span>
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
