import React, { useState } from "react";
import { ClickAwayListener, Paper, Popper } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountProfileModal from "../modals/profile/AccountProfileModal";
import { useLogout } from "../../../utils/auth/logout";

const SidebarProfile = ({ collapsed, forceExpanded = false }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const showFull = forceExpanded || !collapsed;

  const logout = useLogout(); // use the hook

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  const handleClickAway = () => setOpen(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const profileImage = user.strProfileImage
    ? `${import.meta.env.BASE_URL}profile/${user.strProfileImage}`
    : user.cSex === "M"
    ? `${import.meta.env.BASE_URL}profile/profile-male.png`
    : user.cSex === "F"
    ? `${import.meta.env.BASE_URL}profile/profile-female.png`
    : `${import.meta.env.BASE_URL}profile/index.png`;

  const userName =
    [user.strFName, user.strMName, user.strLName].filter(Boolean).join(" ") ||
    "No Name";

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="relative w-full flex flex-col items-start">
        {/* Profile button */}
        <div
          onClick={handleClick}
          className={`flex items-center gap-2 px-2 py-2 mt-2 border-t border-gray-200 rounded-md hover:bg-gray-100 transition cursor-pointer w-full ${
            showFull ? "" : "justify-center"
          }`}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          {showFull && (
            <span className="truncate text-gray-700 text-sm font-medium">
              {userName}
            </span>
          )}
        </div>

        {/* Popper menu */}
        <Popper open={open} anchorEl={anchorEl} placement="right-start" style={{ zIndex: 1300 }}>
          <Paper elevation={3} className="p-2 min-w-[190px]">
            <div className="flex flex-col gap-1">
              {/* Account Profile */}
              <div
                className="flex p-1 items-center gap-2 cursor-pointer hover:text-blue-600"
                onClick={() => {
                  setProfileModalOpen(true);
                  setOpen(false);
                }}
              >
                <AccountCircleIcon fontSize="small" />
                <span>Account Profile</span>
              </div>

              {/* Logout */}
              <div
                onClick={logout}
                className="flex p-1 items-center gap-2 cursor-pointer hover:text-red-600"
              >
                <LogoutIcon fontSize="small" />
                <span>Logout</span>
              </div>
            </div>
          </Paper>
        </Popper>

        {/* Account Profile Modal */}
        <AccountProfileModal
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={user}
        />
      </div>
    </ClickAwayListener>
  );
};

export default SidebarProfile;
