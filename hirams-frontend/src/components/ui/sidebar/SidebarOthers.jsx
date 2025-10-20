import React from "react";
import FolderIcon from "@mui/icons-material/Folder";
import BookIcon from "@mui/icons-material/Book";
import SidebarItem from "./SidebarItem"; // assuming you have a SidebarItem component

const SidebarOthers = ({ collapsed, forceExpanded = false, onItemClick }) => {
  const showFull = forceExpanded || !collapsed;

  const items = [
    { icon: <FolderIcon fontSize="small" />, label: "Repository", to: "/repository" },
    { icon: <BookIcon fontSize="small" />, label: "Documentation", to: "/docs" },
  ];

  return (
    <div className="flex flex-col w-full mb-2">
      {showFull && (
        <span className="text-gray-400 uppercase text-[10px] tracking-wider">
          OTHERS
        </span>
      )}
      <nav className="flex flex-col w-full">
        {items.map((item, idx) => (
          <SidebarItem
            key={idx}
            icon={item.icon}
            label={item.label}
            to={item.to}
            forceExpanded={forceExpanded}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </nav>
    </div>
  );
};

export default SidebarOthers;
