import React from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarSection from "./SidebarSection";
import SidebarProfile from "./SidebarProfile";
import SidebarOthers from "./SidebarOthers";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import FolderIcon from "@mui/icons-material/Folder";
import LocalShippingIcon from "@mui/icons-material/LocalShipping"; // new icon

const SidebarContent = ({ collapsed, forceExpanded = false, onItemClick }) => {
  return (
    <div
      className={`flex flex-col ${forceExpanded ? "items-start" : collapsed ? "items-center" : "items-start"} pl-3 pr-3 pt-3 h-full`}
    >
      <SidebarHeader collapsed={collapsed} forceExpanded={forceExpanded} />

      <SidebarSection
        title="PLATFORM"
        items={[
          {
            icon: <DashboardIcon fontSize="small" />,
            label: "Dashboard",
            to: "/",
          },
        ]}
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onClick={onItemClick}
      />

      <SidebarSection
        title="MANAGEMENT"
        items={[
          { icon: <PeopleIcon fontSize="small" />, label: "User", to: "/user" },
          { icon: <BusinessIcon fontSize="small" />, label: "Company", to: "/company" },
          { icon: <PersonIcon fontSize="small" />, label: "Client", to: "/client" },
          { icon: <LocalShippingIcon fontSize="small" />, label: "Supplier", to: "/supplier" }, // updated icon
        ]}
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onClick={onItemClick}
      />

      <div className="flex flex-col gap-0 mt-auto w-full">
        {/* OTHERS Section */}
        <SidebarOthers
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onItemClick={onItemClick}
        />

        {/* Profile Section */}
        <SidebarProfile collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>
    </div>
  );
};

export default SidebarContent;
