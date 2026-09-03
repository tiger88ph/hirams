import React from "react";
import { Skeleton, Box } from "@mui/material";
import SidebarItemSkeleton from "./SidebarItemSkeleton";

const SidebarSectionSkeleton = ({ collapsed, forceExpanded, itemCount = 3 }) => {
  const isCollapsed = collapsed && !forceExpanded;
  return (
    <Box sx={{ mb: 1.5 }}>
      {!isCollapsed && (
        <Skeleton variant="text" width="40%" height={10} sx={{ mb: 0.5, ml: 0.5, borderRadius: 1 }} />
      )}
      {Array.from({ length: itemCount }).map((_, i) => (
        <SidebarItemSkeleton key={i} collapsed={collapsed} forceExpanded={forceExpanded} />
      ))}
    </Box>
  );
};

export default SidebarSectionSkeleton;
