import React, { useState, useEffect } from "react";
import { resolveProfileImage } from "../../utils/helpers/profileImage";
import { ClickAwayListener } from "@mui/material";
import ProfileMenu from "../common/ProfileMenu";

const readUserFromStorage = () =>
  JSON.parse(localStorage.getItem("user")) || {};

const SidebarProfile = ({ collapsed, forceExpanded = false }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [rawUser, setRawUser] = useState(readUserFromStorage);

  useEffect(() => {
    const handleStorageChange = () => setRawUser(readUserFromStorage());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const showFull = forceExpanded || !collapsed;
  const profileImage = resolveProfileImage(rawUser);
  const userName =
    [rawUser.strFName, rawUser.strMName, rawUser.strLName]
      .filter(Boolean)
      .join(" ") || "No Name";

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div className="relative w-full flex flex-col items-start">
        {/* Profile button */}
        <div
          onClick={handleClick}
          className={`flex items-center gap-2 px-2 py-2 mt-2 border-t border-gray-200 rounded-md hover:bg-gray-100 transition cursor-pointer w-full ${
            showFull ? "" : "justify-center"
          }`}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
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

        <ProfileMenu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setOpen(false)}
          placement="right-start"
        />
      </div>
    </ClickAwayListener>
  );
};

export default SidebarProfile;
