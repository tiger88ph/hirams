import React, { useState, useMemo } from "react";
import { Menu, MenuItem, useMediaQuery, useTheme, Skeleton } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function TransactionFilterMenu({
  statuses = {},
  items = [],
  selectedStatus,
  onSelect,
  // Role-based status keys (mirrors SidebarContent / Transaction props)
  forAssignmentCode = null,
  itemsManagementCode = null,
  itemsVerificationCode = null,
  forCanvasCode = null,
  canvasVerificationCode = null,
  // Procurement keys
  draftKey = null,
  finalizeKey = null,
  finalizeVerificationKey = null,
  priceSettingKey = null,
  priceFinalizeKey = null,
  priceFinalizeVerificationKey = null,
  procPriceApprovalKey = null,
  // Role flags
  isManagement = false,
  isProcurement = false,
  isAOTL = false,
  currentUserId = null,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("xs", "sm"));

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (label) => { onSelect(label); handleMenuClose(); };

  // ── Count logic — mirrors SidebarContent `statusCounts` exactly ────────────
  const statusCounts = useMemo(() => {
    if (!Object.keys(statuses).length) return {};

    // current_status already has virtual codes remapped by the backend
    const txnCode = (t) => String(t.current_status ?? t.latest_history?.nStatus ?? "");
    const isMe    = (t) => String(t.nAssignedAO  ?? t.aoUserId ?? "") === String(currentUserId);
    const isMine  = (t) => String(t.creator_id   ?? "")                === String(currentUserId);

    const counts = {};

    // ── MANAGEMENT ──────────────────────────────────────────────────────────
    if (isManagement) {
      Object.keys(statuses).forEach((code) => {
        if (code === String(forAssignmentCode)) {
          // '200' For Assignment: counts entire AO pipeline
          counts[code] = items.filter((t) =>
            ["200", "210", "220", "230", "240"].includes(txnCode(t)),
          ).length;
        } else {
          counts[code] = items.filter((t) => txnCode(t) === String(code)).length;
        }
      });
      return counts;
    }

    // ── PROCUREMENT ─────────────────────────────────────────────────────────
    if (isProcurement) {
      Object.keys(statuses).forEach((code) => {
        switch (code) {
          case String(draftKey):                     // '100' — mine only
            counts[code] = items.filter((t) => txnCode(t) === code && isMine(t)).length;
            break;
          case String(finalizeKey):                  // '110' — mine only
            counts[code] = items.filter((t) => txnCode(t) === code && isMine(t)).length;
            break;
          case String(finalizeVerificationKey):      // '115' — virtual (no creator filter)
            counts[code] = items.filter((t) => txnCode(t) === code).length;
            break;
          case String(priceSettingKey):              // '300' — mine only
            counts[code] = items.filter((t) => txnCode(t) === code && isMine(t)).length;
            break;
          case String(priceFinalizeKey):             // '310' — mine only
            counts[code] = items.filter((t) => txnCode(t) === code && isMine(t)).length;
            break;
          case String(priceFinalizeVerificationKey): // '315' — virtual (no creator filter)
            counts[code] = items.filter((t) => txnCode(t) === code).length;
            break;
          case String(procPriceApprovalKey):         // '320' — mine only
            counts[code] = items.filter((t) => txnCode(t) === code && isMine(t)).length;
            break;
          default:
            counts[code] = 0;
        }
      });
      return counts;
    }

    // ── AOTL ────────────────────────────────────────────────────────────────
    if (isAOTL) {
      Object.keys(statuses).forEach((code) => {
        switch (code) {
          case String(forAssignmentCode):      // '200' — ALL AO-pipeline statuses
            counts[code] = items.filter((t) =>
              ["200", "210", "220", "225", "230", "240", "245"].includes(txnCode(t)),
            ).length;
            break;
          case String(itemsManagementCode):    // '210' — assigned to me
            counts[code] = items.filter((t) => txnCode(t) === code && isMe(t)).length;
            break;
          case String(itemsVerificationCode):  // '225' — virtual, shown to all AOTL
            counts[code] = items.filter((t) => txnCode(t) === code).length;
            break;
          case String(forCanvasCode):          // '230' — assigned to me
            counts[code] = items.filter((t) => txnCode(t) === code && isMe(t)).length;
            break;
          case String(canvasVerificationCode): // '245' — virtual, shown to all AOTL
            counts[code] = items.filter((t) => txnCode(t) === code).length;
            break;
          default:
            // '220' canvas-finalize and any other own codes: assigned to me
            counts[code] = items.filter((t) => txnCode(t) === code && isMe(t)).length;
        }
      });
      return counts;
    }

    // ── ACCOUNT OFFICER ─────────────────────────────────────────────────────
    Object.keys(statuses).forEach((code) => {
      switch (code) {
        case String(itemsVerificationCode):  // '225' — virtual, no user filter
          counts[code] = items.filter((t) => txnCode(t) === code).length;
          break;
        case String(canvasVerificationCode): // '245' — virtual, no user filter
          counts[code] = items.filter((t) => txnCode(t) === code).length;
          break;
        default:
          // All other own codes: only if assigned to me
          counts[code] = items.filter((t) => txnCode(t) === code && isMe(t)).length;
      }
    });
    return counts;
  }, [
    items,
    statuses,
    isManagement,
    isProcurement,
    isAOTL,
    currentUserId,
    forAssignmentCode,
    itemsManagementCode,
    itemsVerificationCode,
    forCanvasCode,
    canvasVerificationCode,
    draftKey,
    finalizeKey,
    finalizeVerificationKey,
    priceSettingKey,
    priceFinalizeKey,
    priceFinalizeVerificationKey,
    procPriceApprovalKey,
  ]);

  const isLoading = Object.keys(statuses).length === 0;
  const fontSize = isXs ? "0.65rem" : isSm ? "0.75rem" : "1rem";
  const menuItemPadding = isXs ? "2px 8px" : isSm ? "4px 12px" : "6px 16px";
  const menuItemMinHeight = isXs ? 24 : isSm ? 28 : 36;

  return (
    <>
      {/* Trigger */}
      <div
        className="flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none max-w-[200px] overflow-hidden"
        onClick={handleMenuClick}
        title={selectedStatus}
        style={{ fontSize }}
      >
        <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
        {isLoading ? (
          <Skeleton variant="text" width={90} height={16} sx={{ borderRadius: 1 }} />
        ) : (
          <span className="text-gray-700 truncate">{selectedStatus}</span>
        )}
      </div>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            width: isXs ? "70vw" : isSm ? "60vw" : "auto",
            maxWidth: 400,
            maxHeight: "60vh",
          },
        }}
        MenuListProps={{ sx: { padding: 0 } }}
      >
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <MenuItem
              key={i}
              disabled
              sx={{ padding: menuItemPadding, minHeight: menuItemMinHeight }}
            >
              <Skeleton
                variant="text"
                width={`${50 + i * 10}%`}
                height={14}
                sx={{ borderRadius: 1 }}
              />
            </MenuItem>
          ))
        ) : (
          Object.entries(statuses).map(([statusCode, label]) => {
            const count = statusCounts[statusCode] || 0;
            return (
              <MenuItem
                key={label}
                onClick={() => handleMenuSelect(label)}
                selected={selectedStatus === label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  minWidth: 200,
                  fontSize,
                  padding: menuItemPadding,
                  minHeight: menuItemMinHeight,
                }}
              >
                <span>
                  {label}{" "}
                  {count > 0 && (
                    <span className="italic text-gray-500">({count})</span>
                  )}
                </span>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
}