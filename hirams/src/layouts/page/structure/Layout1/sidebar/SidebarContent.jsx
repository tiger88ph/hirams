import React from "react";
import useMapping from "../../../../../utils/mappings/useMapping";
import { getUserRoles } from "../../../../../utils/helpers/roleHelper";

// Layout & UI
import SidebarHeader from "./SidebarHeader";
import SidebarSection from "./SidebarSection";
import SidebarProfile from "./SidebarProfile";
import SidebarOthers from "./SidebarOthers";
import SidebarItem from "./SidebarItem";
import SidebarSectionSkeleton from "../sidebar-content/skeleton/SidebarSectionSkeleton";
import SectionHeader from "../sidebar-content/SectionHeader";
import { Box } from "@mui/material";

// Constants
import { SECTION_LABELS } from "../../../../../constants/navigations";

// Navigation Builder
import { buildNavItems } from "../sidebar-content/BuildNavItems";

// ── Main Component ─────────────────────────────────────────────────
const SidebarContent = ({ collapsed, forceExpanded = false, onItemClick }) => {
  const layoutClass = forceExpanded
    ? "items-start"
    : collapsed
      ? "items-center"
      : "items-start";

  const { userTypes = {} } = useMapping();
  const { isManagement, isProcurement, isAccountOfficer, isFinanceOfficer } =
    getUserRoles(userTypes);
  const isLoading = Object.keys(userTypes).length === 0;

  const navConfig = buildNavItems();
  // Universal renderer — fixed key handling
  const renderNavItem = (entry) => {
    if (entry.type === "nav") {
      const { key, component: Comp, ...rest } = entry;
      return (
        <Comp
          key={key}
          {...rest}
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onItemClick={onItemClick}
        />
      );
    }
    if (entry.type === "item") {
      const { key, ...rest } = entry;
      return (
        <SidebarItem
          key={key}
          {...rest}
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onClick={onItemClick}
        />
      );
    }
    return null;
  };

  return (
    <div
      className={`pl-2 pr-2 pt-2 flex flex-col ${layoutClass} h-full w-full`}
    >
      <div className="flex-none sticky top-0 bg-white z-10 w-full">
        <SidebarHeader collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-2 w-full scrollbar-hide">
        {isLoading ? (
          <Box sx={{ pt: 1 }}>
            <SidebarSectionSkeleton
              {...{ collapsed, forceExpanded, itemCount: 2 }}
            />
            <SidebarSectionSkeleton
              {...{ collapsed, forceExpanded, itemCount: 4 }}
            />
            <SidebarSectionSkeleton
              {...{ collapsed, forceExpanded, itemCount: 2 }}
            />
          </Box>
        ) : (
          <>
            <SidebarSection
              title={SECTION_LABELS.overview}
              items={navConfig.overview[0].items}
              {...{ collapsed, forceExpanded, onClick: onItemClick }}
            />

            {isManagement && (
              <>
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.management}
                    {...{ collapsed, forceExpanded }}
                  />
                  {navConfig.management.common.map(renderNavItem)}
                </div>
                {renderNavItem(navConfig.management.transaction)}
                {renderNavItem(navConfig.management.cart)}
                {renderNavItem(navConfig.management.archive)}
                <SectionHeader
                  label={SECTION_LABELS.records}
                  {...{ collapsed, forceExpanded }}
                />
                {renderNavItem(navConfig.management.inventory)}
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.accounting}
                    {...{ collapsed, forceExpanded }}
                  />
                  {navConfig.management.accounting.map(renderNavItem)}
                </div>
              </>
            )}

            {isProcurement && (
              <>
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.management}
                    {...{ collapsed, forceExpanded }}
                  />
                  {renderNavItem(navConfig.management.common[1])}
                </div>
                {renderNavItem(navConfig.management.transaction)}
                {renderNavItem(navConfig.management.archive)}
                <SectionHeader
                  label={SECTION_LABELS.records}
                  {...{ collapsed, forceExpanded }}
                />
                {renderNavItem(navConfig.management.inventory)}
              </>
            )}

            {isAccountOfficer && (
              <>
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.management}
                    {...{ collapsed, forceExpanded }}
                  />
                  {renderNavItem(navConfig.management.common[2])}
                </div>
                {renderNavItem(navConfig.management.transaction)}
                {renderNavItem(navConfig.management.cart)}
                {renderNavItem(navConfig.management.archive)}
                <SectionHeader
                  label={SECTION_LABELS.records}
                  {...{ collapsed, forceExpanded }}
                />
                {renderNavItem(navConfig.management.inventory)}
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.accounting}
                    {...{ collapsed, forceExpanded }}
                  />
                  {renderNavItem(navConfig.management.accounting[0])}
                </div>
              </>
            )}

            {isFinanceOfficer && (
              <>
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.management}
                    {...{ collapsed, forceExpanded }}
                  />
                  {renderNavItem(navConfig.management.common[2])}
                  {renderNavItem(navConfig.management.common[3])}
                </div>
                {renderNavItem(navConfig.management.transaction)}
                {renderNavItem(navConfig.management.accounting[0])}
                <div className="flex flex-col w-full mb-1.5">
                  <SectionHeader
                    label={SECTION_LABELS.accounting}
                    {...{ collapsed, forceExpanded }}
                  />
                  {navConfig.management.accounting.slice(1).map(renderNavItem)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex-none sticky bottom-0 w-full pt-1 border-t border-gray-200 bg-white z-10">
        <SidebarOthers {...{ collapsed, forceExpanded, onItemClick }} />
        <SidebarProfile {...{ collapsed, forceExpanded }} />
      </div>
    </div>
  );
};

export default SidebarContent;
