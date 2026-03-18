import React, { useState, useEffect } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { ClickAwayListener, IconButton } from "@mui/material";
import { resolveProfileImage } from "../../utils/helpers/profileImage";
import ProfileMenu from "../common/ProfileMenu";
import NotificationMenu from "../common/NotificationMenu";

const readUserFromStorage = () =>
  JSON.parse(localStorage.getItem("user")) || {};

function Header({ toggleSidebar, collapsed, toggleMobileSidebar, mobileOpen }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(readUserFromStorage);

  useEffect(() => {
    const handleStorageChange = () => setUser(readUserFromStorage());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const profileImage = resolveProfileImage(user);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
    setProfileOpen((prev) => !prev);
  };

  return (
    <header className="bg-white text-gray-700 shadow-b-md p-2 flex justify-between items-center">
      {/* Desktop Sidebar Toggle */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          className="p-1.5 rounded border border-gray-300 bg-transparent transition-colors duration-200 flex items-center gap-1 hover:bg-gray-100 hover:border-gray-400"
          onClick={toggleSidebar}
        >
          {collapsed ? (
            <MenuIcon fontSize="small" />
          ) : (
            <MenuOpenIcon fontSize="small" />
          )}
        </button>
      </div>

      {/* Mobile + Tablet Burger */}
      <div className="flex lg:hidden items-center">
        <button
          className="p-1.5 rounded border border-gray-300 bg-transparent transition-colors duration-200 flex items-center gap-1 hover:bg-gray-100 hover:border-gray-400"
          onClick={toggleMobileSidebar}
        >
          {mobileOpen ? (
            <MenuOpenIcon fontSize="small" />
          ) : (
            <MenuIcon fontSize="small" />
          )}
        </button>
      </div>

      {/* Right: Notifications + Help + Profile */}
      <div className="flex items-center">
        {/* Notifications */}
        <NotificationMenu />

        {/* Help */}
        <IconButton
          size="small"
          title="Help"
          onClick={() => {
            /* handle help click */
          }}
          sx={{
            color: "text.secondary",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <HelpOutlineIcon fontSize="small" />
        </IconButton>

        {/* Profile Image + Menu */}
        <ClickAwayListener onClickAway={() => setProfileOpen(false)}>
          <div className="relative flex items-center ml-2">
            <div
              onClick={handleProfileClick}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-blue-300 transition-all duration-200"
            >
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <ProfileMenu
              anchorEl={anchorEl}
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              placement="bottom-end"
            />
          </div>
        </ClickAwayListener>
      </div>
    </header>
  );
}

export default Header;
