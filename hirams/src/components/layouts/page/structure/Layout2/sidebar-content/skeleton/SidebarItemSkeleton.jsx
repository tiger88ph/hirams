import React from "react";
import { Skeleton, Box } from "@mui/material";

const SidebarItemSkeleton = ({ collapsed, forceExpanded }) => {
  const isCollapsed = collapsed && !forceExpanded;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        minHeight: 32,
      }}
    >
      <Skeleton variant="circular" width={16} height={16} sx={{ flexShrink: 0 }} />
      {!isCollapsed && (
        <Skeleton variant="text" width="65%" height={14} sx={{ borderRadius: 1 }} />
      )}
    </Box>
  );
};

export default SidebarItemSkeleton;
