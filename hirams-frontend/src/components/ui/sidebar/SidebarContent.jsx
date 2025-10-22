import React from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarSection from "./SidebarSection";
import SidebarProfile from "./SidebarProfile";
import SidebarOthers from "./SidebarOthers";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';


const SidebarContent = ({ collapsed, forceExpanded = false, onItemClick }) => {
  const layoutClass = forceExpanded
    ? "items-start"
    : collapsed
    ? "items-center"
    : "items-start";

  return (
    <div
      className={`flex flex-col ${layoutClass} h-full px-3 pt-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent`}
    >
      {/* 🧭 Header */}
      <SidebarHeader collapsed={collapsed} forceExpanded={forceExpanded} />

      {/* 🏠 Platform Section */}
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

      {/* ⚙️ Management Section */}
      <SidebarSection
        title="MANAGEMENT"
        items={[
          { icon: <PeopleIcon fontSize="small" />, label: "User", to: "/user" },
          {
            icon: <BusinessIcon fontSize="small" />,
            label: "Company",
            to: "/company",
          },
          {
            icon: <PersonIcon fontSize="small" />,
            label: "Client",
            to: "/client",
          },
          {
            icon: <LocalShippingIcon fontSize="small" />,
            label: "Supplier",
            to: "/supplier",
          },
        ]}
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onClick={onItemClick}
      />

      {/* 📦 Procurement Section */}
      <SidebarSection
        title="PROCUREMENT"
        items={[
          {
            icon: <AccountBalanceIcon fontSize="small" />,
            label: "Transactions",
            to: "/transactions",
          },
          {
            icon: <AttachMoneyIcon  fontSize="small" />,
            label: "Pricing",
            to: "/pricing",
          },
          {
            icon: <PersonIcon fontSize="small" />,
            label: "Client",
            to: "/client",
          },
          
        ]}
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onClick={onItemClick}
      />

      {/* 👤 Bottom Sections */}
      <div className="flex flex-col mt-auto w-full pt-3 border-t border-gray-200">
        <SidebarOthers
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onItemClick={onItemClick}
        />
        <SidebarProfile collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>
    </div>
  );
};

export default SidebarContent;
