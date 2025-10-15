import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";

function Header({ toggleSidebar, collapsed, toggleMobileSidebar }) {
  return (
    <header className="bg-white text-gray-700 shadow-b-md p-3 flex justify-between items-center">
      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-2">
        <button
          className="p-1.5 rounded border border-gray-300 bg-transparent transition flex items-center gap-1"
          onClick={toggleSidebar}
        >
          {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
        </button>
      </div>

      {/* Mobile Logo */}
      <div className="flex md:hidden items-center">
        <img src="/hirams-logo.png" alt="HIRAMS Logo" className="h-8 w-auto object-contain" />
      </div>

      {/* Mobile Burger */}
      <button
        className="p-1.5 rounded border border-gray-300 bg-transparent transition flex items-center gap-1 md:hidden"
        onClick={toggleMobileSidebar}
      >
        {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
      </button>
    </header>
  );
}

export default Header;
