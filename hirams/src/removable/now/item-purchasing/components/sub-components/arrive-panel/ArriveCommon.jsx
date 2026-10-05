import React from "react";
import { Box, Typography } from "@mui/material";
import {
  UnfoldLess,
  StoreOutlined,
  BusinessOutlined,
  DoubleArrowOutlined,
  PersonOutlined,
} from "@mui/icons-material";

export function JevSelector({ jevIds, activeId, onSelect, c }) {
  if (!jevIds || jevIds.length < 2) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
      }}
    >
      <Typography
        sx={{
          flexShrink: 0,
          fontSize: "0.6rem",
          fontWeight: 700,
          color: c.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}
      >
        JEV Records:
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {jevIds.map((id, i) => {
          const isActive = String(id) === String(activeId);
          return (
            <Box
              key={id}
              component="button"
              onClick={() => !isActive && onSelect?.(id)}
              sx={{
                flexShrink: 0,
                px: 1.1,
                py: 0.4,
                borderRadius: "50px",
                fontSize: "0.6rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: isActive ? "default" : "pointer",
                color: isActive ? c.blueText : c.textMuted,
                background: isActive ? c.blueBgSoft : "transparent",
                border: `0.5px solid ${isActive ? c.blueBorder : c.inputBorder}`,
                transition: "all 0.15s ease",
                "&:hover": {
                  background: isActive ? c.blueBgSoft : c.rowHover,
                },
              }}
            >
              JEV {i + 1}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function SupplierCompanyBreadcrumb({
  supplierName,
  companyName,
  clientName,
  flowType = "received",
  c,
}) {
  const isDelivered = flowType === "delivered";

  const leftIcon = isDelivered ? (
    <BusinessOutlined
      sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
    />
  ) : (
    <StoreOutlined
      sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
    />
  );
  const leftLabel = isDelivered ? (companyName ?? "—") : (supplierName ?? "—");
  const rightLabel = isDelivered ? (clientName ?? "—") : (companyName ?? "—");
  const rightIcon = isDelivered ? (
    <PersonOutlined
      sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
    />
  ) : (
    <BusinessOutlined
      sx={{ fontSize: "0.85rem", color: c.pendingText, flexShrink: 0 }}
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.75,
        mb: 1,
        borderRadius: "8px",
        background: c.btnBgDisabled,
        border: `0.5px solid ${c.pendingBorder}`,
        borderLeft: `3px solid ${c.pendingBorder}`,
      }}
    >
      {leftIcon}
      <Typography
        noWrap
        sx={{
          flex: 1,
          fontSize: "0.58rem",
          fontWeight: 700,
          color: c.pendingText,
        }}
      >
        {leftLabel}
      </Typography>

      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <DoubleArrowOutlined
            key={i}
            sx={{
              fontSize: "0.75rem",
              color: c.pendingText,
              animation: `arrowPulse 1s ease-in-out ${i * 0.15}s infinite`,
              "@keyframes arrowPulse": {
                "0%, 100%": { opacity: 0.15 },
                "50%": { opacity: 1 },
              },
            }}
          />
        ))}
      </Box>

      <Typography
        noWrap
        sx={{
          flex: 1,
          fontSize: "0.58rem",
          fontWeight: 700,
          color: c.pendingText,
          textAlign: "right",
        }}
      >
        {rightLabel}
      </Typography>
      {rightIcon}
    </Box>
  );
}

export function ItemsSection({ count, children, c }) {
  return (
    <Box
      sx={{
        borderRadius: "0 0 8px 8px",
        border: `0.5px solid ${c.cardBorder}`,
        borderTop: "none",
        background: c.cardBg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          minHeight: 375,
          maxHeight: 375,
          overflowY: "auto",
        }}
      >
        {count === 0 ? (
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: c.textFaint,
              py: 1.5,
              textAlign: "center",
            }}
          >
            No data available.
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}

export const ExpandAllButton = ({ expanded, onClick, c, icon, expandedIcon }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.4,
      px: 1,
      py: 0.4,
      borderRadius: "6px",
      border: `0.5px solid ${c.inputBorder}`,
      background: "transparent",
      color: c.textMuted,
      fontSize: "0.62rem",
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0,
      whiteSpace: "nowrap",
      "&:hover": { background: c.rowHover },
    }}
  >
    {expanded ? (
      expandedIcon ? (
        <Box component={expandedIcon} sx={{ fontSize: "0.85rem" }} />
      ) : (
        <UnfoldLess sx={{ fontSize: "0.85rem" }} />
      )
    ) : (
      <Box component={icon} sx={{ fontSize: "0.85rem" }} />
    )}
    {expanded ? "Collapse All" : "Expand All"}
  </Box>
);

export const TAB_OPTIONS = [
  { key: "TO_RECEIVE", label: "To Receive" },
  { key: "PENDING", label: "Pending JEV - Received" },
  { key: "RECEIVED", label: "Received" },
  { key: "FOR_DELIVERY", label: "For Delivery" },
  { key: "PENDING_DELIVERED", label: "Pending JEV - Delivered" },
  { key: "DELIVERED", label: "Delivered" },
];

export function SectionTabs({ active, onChange, counts, c, extraControl, hideExtra }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.75,
        p: 0.4,
        borderRadius: "10px 10px 0 0",
        border: `0.5px solid ${c.cardBorder}`,
        borderBottom: "none",
        background: c.rowBgDisabled,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {TAB_OPTIONS.map((tab) => {
          const isActive = active === tab.key;
          const count = counts[tab.key];
          return (
            <Box
              key={tab.key}
              component="button"
              onClick={() => onChange(tab.key)}
              sx={{
                flex: { xs: "1 0 auto", sm: "0 0 auto" },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.4,
                px: 1.25,
                py: 0.55,
                borderRadius: "4px",
                border: "none",
                background: isActive ? c.cardBg : "transparent",
                color: isActive ? c.blueText : c.textMuted,
                fontSize: "0.65rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: isActive ? `0 0 0 0.5px ${c.blueBorder}` : "none",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {count != null && (
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: isActive ? c.blueText : c.textFaint,
                    opacity: 0.85,
                  }}
                >
                  ({count})
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {extraControl && !hideExtra && (
        <Box sx={{ flexShrink: 0, pr: 0.4 }}>{extraControl}</Box>
      )}
    </Box>
  );
}
