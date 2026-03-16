import React, { useState } from "react";
import { Menu, MenuItem, useMediaQuery, useTheme, Skeleton } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function TransactionFilterMenu({
  statuses = {},
  items = [],
  selectedStatus,
  onSelect,
  forAssignmentCode = {},
  itemsManagementCode = {},
  itemsVerificationCode = {},
  forCanvasCode = {},
  canvasVerificationCode = {},
  statusKey = "status",
  isAOTL = false,
  currentUserId = null,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("xs", "sm"));

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (label) => { onSelect(label); handleMenuClose(); };

  const statusCounts = Object.entries(statuses).reduce((acc, [statusCode, label]) => {
    let count = 0;
    if (label === "For Assignment") {
      const allowedCodes = [
        String(forAssignmentCode), String(itemsManagementCode),
        String(itemsVerificationCode), String(forCanvasCode),
      ];
      count = items.filter((item) =>
        allowedCodes.includes(String(item.latest_history?.nStatus))
      ).length;
    } else if (
      label === statuses[itemsVerificationCode] ||
      label === statuses[canvasVerificationCode]
    ) {
      const verificationCodes = [String(itemsVerificationCode), String(canvasVerificationCode)];
      count = items.filter((item) =>
        verificationCodes.includes(String(item.latest_history?.nStatus))
      ).length;
    } else {
      count = items.filter((item) => {
        const matchesStatus = item[statusKey] === label;
        if (!matchesStatus) return false;
        if (isAOTL && currentUserId) {
          const itemUserId = item.aoUserId || item.user?.nUserId || item.latest_history?.nUserId;
          return itemUserId === currentUserId;
        }
        return true;
      }).length;
    }
    acc[label] = count;
    return acc;
  }, {});

  const isLoading = Object.keys(statuses).length === 0;
  const fontSize = isXs ? "0.65rem" : isSm ? "0.75rem" : "1rem";
  const menuItemPadding = isXs ? "2px 8px" : isSm ? "4px 12px" : "6px 16px";
  const menuItemMinHeight = isXs ? 24 : isSm ? 28 : 36;

  return (
    <>
      {/* Trigger */}
      <div
        className="flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none max-w-[200px] overflow-hidden"
        onClick={handleMenuClick}
        title={selectedStatus}
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
          [1, 2, 3, 4].map((i) => (
            <MenuItem key={i} disabled sx={{ padding: menuItemPadding, minHeight: menuItemMinHeight }}>
              <Skeleton variant="text" width={`${50 + i * 10}%`} height={14} sx={{ borderRadius: 1 }} />
            </MenuItem>
          ))
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