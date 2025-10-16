import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";

function Header({ toggleSidebar, collapsed, toggleMobileSidebar, mobileOpen }) {
  return (
    <header className="bg-white text-gray-700 shadow-b-md p-3 flex justify-between items-center">
      {/* Desktop View */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          className="p-1.5 rounded border border-gray-300 bg-transparent transition-colors duration-200 flex items-center gap-1 hover:bg-gray-100 hover:border-gray-400"
          onClick={toggleSidebar}
        >
          {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
        </button>
      </div>

      {/* Mobile + Tablet Logo */}
      <div className="flex lg:hidden items-center">
        <img
          src="/hirams-logo.png"
          alt="HIRAMS Logo"
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Mobile + Tablet Burger */}
      <button
        className="p-1.5 rounded border border-gray-300 bg-transparent transition-colors duration-200 flex items-center gap-1 lg:hidden hover:bg-gray-100 hover:border-gray-400"
        onClick={toggleMobileSidebar}
      >
        {mobileOpen ? <MenuOpenIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
      </button>
    </header>
  );
}

export default Header;
