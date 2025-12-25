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
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import useMapping from "../../../utils/mappings/useMapping";
const SidebarContent = ({ collapsed, forceExpanded = false, onItemClick }) => {
  const layoutClass = forceExpanded
    ? "items-start"
    : collapsed
      ? "items-center"
      : "items-start";

  // ✅ Load user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType?.toUpperCase(); // normalize
  const { userTypes } = useMapping();
  const managementLevel = [
    Object.keys(userTypes)[1],
    Object.keys(userTypes)[4],
  ].includes(userType);
  const procurementLevel = [
    Object.keys(userTypes)[3],
    Object.keys(userTypes)[6],
  ].includes(userType);
  const accountOfficerLevel = [
    Object.keys(userTypes)[0],
    Object.keys(userTypes)[5],
  ].includes(userType);

  return (
    <div
      className={`pl-3 pr-3 pt-3 flex flex-col ${layoutClass} h-full w-full`}
    >
      {/* 🧭 Sticky Header */}
      <div className="flex-none sticky top-0 bg-white z-10 w-full">
        <SidebarHeader collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>

      {/* 🏗 Scrollable Middle Sections */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 w-full scrollbar-hide">
        {/* 🏠 Platform Section */}
        <SidebarSection
          title="PLATFORM"
          items={[
            {
              icon: <DashboardIcon fontSize="small" />,
              label: "Dashboard",
              to: "/dashboard",
            },
          ]}
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onClick={onItemClick}
        />

        {/* ⚙️ Management Section — only visible to userType 'M' */}
        {managementLevel && (
          <SidebarSection
            title="MANAGEMENT"
            items={[
              {
                icon: <PeopleIcon fontSize="small" />,
                label: "User",
                to: "/user",
              },
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
              {
                icon: <AccountBalanceIcon fontSize="small" />,
                label: "Transaction",
                to: "/m-transaction",
              },
            ]}
            collapsed={collapsed}
            forceExpanded={forceExpanded}
            onClick={onItemClick}
          />
        )}

        {/* 📦 Procurement Section — only visible to userType 'P' */}
        {procurementLevel && (
          <SidebarSection
            title="PROCUREMENT"
            items={[
              {
                icon: <PersonIcon fontSize="small" />,
                label: "Client",
                to: "/p-client",
              },
              {
                icon: <AccountBalanceIcon fontSize="small" />,
                label: "Transaction",
                to: "/p-transaction",
              },
            ]}
            collapsed={collapsed}
            forceExpanded={forceExpanded}
            onClick={onItemClick}
          />
        )}
        {/* 📦 Account Officer Section — only visible to userType 'AO' */}
        {accountOfficerLevel && (
          <SidebarSection
            title="ACCOUNT OFFICER"
            items={[
              {
                icon: <LocalShippingIcon fontSize="small" />,
                label: "Supplier",
                to: "/a-supplier",
              },
              {
                icon: <AccountBalanceIcon fontSize="small" />,
                label: "Transaction",
                to: "/a-transaction",
              },
            ]}
            collapsed={collapsed}
            forceExpanded={forceExpanded}
            onClick={onItemClick}
          />
        )}
      </div>

      {/* 👤 Sticky Bottom Sections */}
      <div className="flex-none sticky bottom-0 w-full pt-1 border-t border-gray-200 bg-white z-10">
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
