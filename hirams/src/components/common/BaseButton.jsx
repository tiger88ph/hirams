import React from "react";
import { Button, Tooltip, Box } from "@mui/material";

export const ResponsiveLabel = ({ children, hideOnMobile }) => (
  <Box
    component="span"
    sx={{
      display: hideOnMobile ? { xs: "none", sm: "inline" } : "inline",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);

const ACTION_COLORS = {
  default: { bg: "#1e40af", hover: "#1e3a8a" },

  login: { bg: "#1e40af", hover: "#1e3a8a" },
  register: { bg: "#047857", hover: "#065f46" },

  add: { bg: "#0284c7", hover: "#0369a1" },
  edit: { bg: "#d97706", hover: "#b45309" },
  delete: { bg: "#dc2626", hover: "#b91c1c" },
  view: { bg: "#2563eb", hover: "#1d4ed8" },

  submit: { bg: "#2563eb", hover: "#1d4ed8" },
  save: { bg: "#0284c7", hover: "#0369a1" },
  approve: { bg: "#059669", hover: "#047857" },
  finalize: { bg: "#0f766e", hover: "#0d6b63" },
  verify: { bg: "#7c3aed", hover: "#6d28d9" },
  apply: { bg: "#0891b2", hover: "#0e7490" },
  confirm: { bg: "#16a34a", hover: "#15803d" },

  assign: { bg: "#d97706", hover: "#b45309" },
  reassign: { bg: "#ea580c", hover: "#c2410c" },

  markup: { bg: "#4f46e5", hover: "#4338ca" },
  breakdown: { bg: "#0891b2", hover: "#0e7490" },

  deactivate: { bg: "#6b7280", hover: "#4b5563" },
  cancel: { bg: "#6b7280", hover: "#4b5563" },
  revert: { bg: "#92400e", hover: "#78350f" },
  reset: { bg: "#92400e", hover: "#78350f" },

  back: { bg: "#475569", hover: "#334155" },
  close: { bg: "#374151", hover: "#1f2937" },
};

const BaseButton = ({
  label,
  icon,
  tooltip,
  onClick,
  disabled = false,
  actionColor = "default",
  variant = "contained",
  size = "medium",
  sx = {},
}) => {
  const hasIcon = Boolean(icon);
  const hasLabel = Boolean(label);
  const isIconOnly = hasIcon && !hasLabel;

  const action = ACTION_COLORS[actionColor] || ACTION_COLORS.default;

  const buttonContent = (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={isIconOnly ? "text" : variant}
      size={size}
      aria-label={label || tooltip}
      sx={{
        textTransform: "none",
        fontWeight: 500,
        letterSpacing: "0.2px",
        minWidth: "auto",
        gap: hasLabel ? 1 : 0,
        transition: "all .18s ease",

        ...(isIconOnly
          ? {
          width: 28,        // was 34
      height: 28,       // was 34
      minWidth: 28,     // was 34
              borderRadius: "50%",
              padding: 0,
              color: action.bg,
              "&:hover": {
                backgroundColor: `${action.bg}18`,
              },
            }
          : {
              px: { xs: 1.5, sm: 2.5 },
              height: { xs: 34, sm: 34 },
              borderRadius: "20px",
              backgroundColor: action.bg,
              color: "#fff",

              "&:hover": {
                backgroundColor: action.hover,
                boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                transform: "translateY(-1px)",
              },
            }),

        "&:active": {
          transform: "translateY(0px)",
          boxShadow: "none",
        },

        "& .MuiSvgIcon-root": {
          fontSize: 16,
        },

        "&.Mui-disabled": {
          opacity: 0.45,
        },

        ...sx,
      }}
    >
      {icon}

      {hasLabel && (
        <ResponsiveLabel hideOnMobile={hasIcon}>
          {label}
        </ResponsiveLabel>
      )}
    </Button>
  );

  if (!tooltip && !isIconOnly) return buttonContent;

return (
  <Tooltip title={tooltip || label}>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: 0,
        margin: 0,
        lineHeight: 0,
      }}
    >
      {buttonContent}
    </span>
  </Tooltip>
);
};

export default BaseButton;