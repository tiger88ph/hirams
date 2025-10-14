import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";

function Header({ toggleSidebar, collapsed }) {
  return (
    <header className=" bg-white text-gray-700 shadow-b-md p-3 flex justify-between items-center">
      <button
        className="p-1.5 rounded border border-gray-300 bg-transparent transition flex items-center gap-1"
        onClick={toggleSidebar}
      >
        {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
      </button>
    </header>
  );
}

export default Header;
