import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { ClickAwayListener, Paper, Popper } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../../utils/auth/logout";
function Header({ toggleSidebar, collapsed, toggleMobileSidebar, mobileOpen }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
    setProfileOpen((prev) => !prev);
  };

  const handleProfileClickAway = () => setProfileOpen(false);

  const logout = useLogout(); // use the hook

  // Get current user info from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {};

  // Apply BASE_URL for profile image paths
  const profileImage = user.strProfileImage
    ? `${import.meta.env.BASE_URL}profile/${user.strProfileImage}`
    : user.cSex === "M"
    ? `${import.meta.env.BASE_URL}profile/profile-male.png`
    : user.cSex === "F"
    ? `${import.meta.env.BASE_URL}profile/profile-female.png`
    : `${import.meta.env.BASE_URL}profile/index.png`;

  return (
    <header className="bg-white text-gray-700 shadow-b-md p-3 flex justify-between items-center">
      {/* Desktop Sidebar Toggle */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          className="p-1.5 rounded border border-gray-300 bg-transparent transition-colors duration-200 flex items-center gap-1 hover:bg-gray-100 hover:border-gray-400"
          onClick={toggleSidebar}
        >
          {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
        </button>
      </div>

      {/* Mobile + Tablet Burger */}
      <div className="flex lg:hidden items-center">
        <button
          className="p-1.5 rounded border border-gray-300 bg-transparent transition-colors duration-200 flex items-center gap-1 hover:bg-gray-100 hover:border-gray-400"
          onClick={toggleMobileSidebar}
        >
          {mobileOpen ? <MenuOpenIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
        </button>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-1 rounded transition">
          <NotificationsIcon fontSize="medium" />
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            3
          </span>
        </button>

        {/* Profile Image */}
        <ClickAwayListener onClickAway={handleProfileClickAway}>
          <div className="relative">
            <div
              onClick={handleProfileClick}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
            >
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            </div>

            <Popper
              open={profileOpen}
              anchorEl={anchorEl}
              placement="bottom-end"
              style={{ zIndex: 1300 }}
            >
              <Paper elevation={3} className="p-2 min-w-[190px] mt-2">
                <div className="flex flex-col gap-1">
                  <div className="flex p-1 items-center gap-2 cursor-pointer hover:text-blue-600">
                    <AccountCircleIcon fontSize="small" />
                    <span>Account Profile</span>
                  </div>
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
          </div>
        </ClickAwayListener>
      </div>
    </header>
  );
}

export default Header;
