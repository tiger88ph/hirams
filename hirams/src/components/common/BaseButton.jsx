import React from "react";
import { Button, Tooltip, Box } from "@mui/material";

export const ResponsiveLabel = ({ children, hasIcon }) => (
  <Box
    component="span"
    sx={{
      display: hasIcon ? { xs: "none", sm: "inline" } : "inline",
    }}
  >
    {children}
  </Box>
);

const BaseButton = ({
  label,
  onClick,
  disabled = false,
  tooltip,
  variant,
  color,
  icon,
  size = "medium",
  sx = {},
}) => {
  const hasIcon = Boolean(icon);
  const hasLabel = Boolean(label);
  const isIconOnly = hasIcon && !hasLabel;
  
  // Show tooltip wrapper if: truly icon-only OR has responsive label OR has explicit tooltip
  const needsTooltip = isIconOnly || (hasIcon && hasLabel) || Boolean(tooltip);
  
  const button = (
    <Button
      variant={isIconOnly ? "text" : variant || "contained"}
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabled}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        minWidth: "auto",
        ...(isIconOnly
          ? {
              padding: 0,
              minHeight: "unset",
              height: 23,
              width: 23,
              lineHeight: 0,
              borderRadius: "50%",
              "& .MuiSvgIcon-root": {
                fontSize: 20,
                display: "block",
              },
            }
          : {
              px: { xs: 1.5, sm: 2.5 },
              py: 0.75,
              height: { xs: 30, sm: 35 },
              borderRadius: "9999px",
            }),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: hasLabel ? 1 : 0,
        backgroundColor: isIconOnly ? "transparent" : undefined,
        opacity: disabled ? 0.5 : 1,
        ...sx,
      }}
    >
      {icon}
      {hasLabel && (
        <ResponsiveLabel hasIcon={hasIcon}>{label}</ResponsiveLabel>
      )}
    </Button>
  );

  return needsTooltip ? (
    <Tooltip 
      title={tooltip || label || ""}
      // Hide tooltip on sm+ screens when label is visible (but always show if explicit tooltip)
      componentsProps={{
        tooltip: {
          sx: hasIcon && hasLabel && !tooltip ? {
            display: { xs: "block", sm: "none" }
          } : {}
        }
      }}
    >
      {/* Wrap in span to ensure tooltip works with disabled buttons */}
      <span style={{ display: 'inline-block', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {button}
      </span>
    </Tooltip>
  ) : (
    button
  );
};

export default BaseButton;