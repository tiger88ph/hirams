import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cloneElement } from "react";
import { Collapse } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ITEM_HEIGHT = "min-h-[32px]";

/**
 * SidebarItem
 *
 * Two modes:
 *   1. Standard nav link  — pass `to`, renders as <Link>
 *   2. Collapsible parent — pass `children`, renders as toggle div + Collapse
 *
 * Collapsible behavior:
 *   - Expanded sidebar: clicking just toggles the submenu open/closed
 *   - Collapsed sidebar (icon-only): clicking fires `onParentClick` (e.g. select
 *     first submenu item) instead of trying to expand
 *
 * Open state is persisted in sessionStorage so it survives remounts
 * (e.g. when isLoading flips in SidebarContent). Defaults to open (true)
 * on first load if no saved value exists.
 */
const SidebarItem = ({
  icon,
  label,
  to,
  collapsed,
  forceExpanded = false,
  onClick,
  children,
  defaultOpen = false,
  onParentClick,
}) => {
  const { pathname } = useLocation();
  const showLabel = forceExpanded || !collapsed;
  const hasChildren = Boolean(children);
  const isCollapsed = collapsed && !forceExpanded;

  // ── Persist open state so remounts don't collapse the submenu ──
  const storageKey = hasChildren ? `sidebar_open_${label}` : null;
  const [open, setOpen] = useState(() => {
    if (!storageKey) return false;
    const saved = sessionStorage.getItem(storageKey);
    // null means first load — default to open
    return saved === null ? defaultOpen : saved === "true";
  });

  const setOpenPersisted = (valOrFn) => {
    setOpen((prev) => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      if (storageKey) sessionStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  // AFTER
  const active = to ? pathname === to || pathname.startsWith(to + "/") : false;

  const coloredIcon = icon
    ? cloneElement(icon, {
        sx: { color: active ? "#1565c0" : "#6b7280", fontSize: 16 },
      })
    : null;

  const rowBase = `
    flex items-center gap-1.5 px-1.5 rounded-md transition-colors duration-150
    cursor-pointer select-none w-full ${ITEM_HEIGHT}
    ${isCollapsed ? "justify-center" : ""}
  `;

  const rowColor = active
    ? "bg-blue-50 text-blue-700"
    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800";

  // ── Collapsible parent ──
  if (hasChildren) {
    const handleClick = () => {
      if (isCollapsed) {
        // Icon-only mode: fire first-item selection (navigate + select first status)
        onParentClick?.();
        onClick?.();
      } else {
        // Expanded mode: only toggle open/close, do NOT trigger first item
        setOpenPersisted((v) => !v);
      }
    };

    return (
      <div className="flex flex-col w-full">
        <div
          className={`${rowBase} ${rowColor}`}
          onClick={handleClick}
          title={isCollapsed ? label : undefined}
        >
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {coloredIcon}
          </div>
          {showLabel && (
            <>
              <span className="flex-1 truncate text-[14px] font-medium leading-[1.3]">
                {label}
              </span>
              {open ? (
                <ExpandMoreIcon
                  sx={{ fontSize: 14, color: "#9ca3af", flexShrink: 0 }}
                />
              ) : (
                <ChevronRightIcon
                  sx={{ fontSize: 14, color: "#9ca3af", flexShrink: 0 }}
                />
              )}
            </>
          )}
        </div>
        {showLabel && (
          <Collapse in={open} timeout="auto">
            <div className="flex flex-col w-full mb-0.5">{children}</div>
          </Collapse>
        )}
      </div>
    );
  }

  // ── Standard link ──
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${rowBase} ${rowColor}`}
      title={isCollapsed ? label : undefined}
    >
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {coloredIcon}
      </div>
      {showLabel && (
        <span className="flex-1 truncate text-[14px] font-medium leading-[1.3]">
          {label}
        </span>
      )}
    </Link>
  );
};

export default SidebarItem;
