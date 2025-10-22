import React, { useState } from "react";
import { ClickAwayListener, Paper, Popper } from "@mui/material";

// Import MUI icons
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

const SidebarProfile = ({ collapsed, forceExpanded = false }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const showFull = forceExpanded || !collapsed;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="relative w-full flex flex-col items-start">
        {/* Row */}
        <div
          onClick={handleClick}
          className={`flex items-center gap-2 px-2 py-2 mt-2 border-t border-gray-200 rounded-md hover:bg-gray-100 transition cursor-pointer w-full ${
            showFull ? "" : "justify-center"
          }`}
        >
          {/* Profile Image */}
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <img
              src="/profile/index.png" // <-- your profile picture
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {showFull && (
            <span className="truncate text-gray-700 text-sm font-medium">
              Mark Ferguson
            </span>
          )}
        </div>

        {/* Floating panel/dialog */}
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="right-start"
          modifiers={[
            { name: "offset", options: { offset: [10, 0] } },
            { name: "preventOverflow", options: { boundary: "viewport" } },
          ]}
          style={{ zIndex: 1300 }}
        >
          <Paper elevation={3} className="p-2 min-w-[190px]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                <AccountCircleIcon fontSize="small" />
                <span>Account Profile</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                <SettingsIcon fontSize="small" />
                <span>Settings</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer hover:text-red-600">
                <LogoutIcon fontSize="small" />
                <span>Logout</span>
              </div>
            </div>
          </Paper>
        </Popper>
      </div>
    </ClickAwayListener>
  );
};

export default SidebarProfile;
