import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";

// ── Preset color tokens ───────────────────────────────────────────────────────
const MINI_ACTION_COLORS = {
  green: {
    color:             "#86efac",
    bg:                "rgba(134,239,172,0.15)",
    border:            "rgba(134,239,172,0.3)",
    hoverBg:           "rgba(134,239,172,0.25)",
    hoverBorder:       "rgba(134,239,172,0.5)",
  },
  blue: {
    color:             "#93c5fd",
    bg:                "rgba(147,197,253,0.15)",
    border:            "rgba(147,197,253,0.3)",
    hoverBg:           "rgba(147,197,253,0.25)",
    hoverBorder:       "rgba(147,197,253,0.5)",
  },
  red: {
    color:             "#fca5a5",
    bg:                "rgba(239,68,68,0.12)",
    border:            "rgba(239,68,68,0.25)",
    hoverBg:           "rgba(239,68,68,0.22)",
    hoverBorder:       "rgba(239,68,68,0.4)",
  },
  amber: {
    color:             "#fcd34d",
    bg:                "rgba(252,211,77,0.12)",
    border:            "rgba(252,211,77,0.25)",
    hoverBg:           "rgba(252,211,77,0.22)",
    hoverBorder:       "rgba(252,211,77,0.4)",
  },
  purple: {
    color:             "#c4b5fd",
    bg:                "rgba(196,181,253,0.12)",
    border:            "rgba(196,181,253,0.25)",
    hoverBg:           "rgba(196,181,253,0.22)",
    hoverBorder:       "rgba(196,181,253,0.4)",
  },
};

// ── MiniBaseButton ────────────────────────────────────────────────────────────
/**
 * A compact icon+label button designed for dark header cards.
 *
 * Behavior (mirrors BaseButton):
 *   • Desktop (sm+): shows icon + label side-by-side
 *   • Mobile  (xs):  shows icon only, label appears as a Tooltip
 *
 * Props:
 *   icon        — MUI SvgIcon element (required)
 *   label       — string label (required)
 *   onClick     — click handler
 *   variant     — color preset key: 'green' | 'blue' | 'red' | 'amber' | 'purple'
 *   disabled    — boolean
 *   tooltip     — override tooltip text (defaults to label)
 *   sx          — extra sx overrides on the outer Box
 *
 *   — or pass raw color overrides:
 *   color, bg, border, hoverBg, hoverBorder
 */
const MiniBaseButton = ({
  icon,
  label,
  onClick,
  variant = "blue",
  disabled = false,
  tooltip,
  sx = {},
  // raw overrides
  color: colorProp,
  bg: bgProp,
  border: borderProp,
  hoverBg: hoverBgProp,
  hoverBorder: hoverBorderProp,
}) => {
  const preset  = MINI_ACTION_COLORS[variant] ?? MINI_ACTION_COLORS.blue;
  const color   = colorProp       ?? preset.color;
  const bg      = bgProp          ?? preset.bg;
  const border  = borderProp      ?? preset.border;
  const hoverBg = hoverBgProp     ?? preset.hoverBg;
  const hoverBorder = hoverBorderProp ?? preset.hoverBorder;

  const baseBoxSx = {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            0.4,
    px:             0.75,
    py:             0.45,
    borderRadius:   "6px",
    background:     disabled ? "rgba(255,255,255,0.05)" : bg,
    border:         `0.5px solid ${disabled ? "rgba(255,255,255,0.1)" : border}`,
    cursor:         disabled ? "not-allowed" : "pointer",
    opacity:        disabled ? 0.45 : 1,
    transition:     "all 0.15s",
    userSelect:     "none",
    ...(!disabled && {
      "&:hover": {
        background:   hoverBg,
        borderColor:  hoverBorder,
      },
      "&:active": {
        opacity: 0.75,
      },
    }),
    ...sx,
  };

  const iconEl = React.cloneElement(icon, {
    sx: { fontSize: "0.65rem", color: disabled ? "rgba(255,255,255,0.3)" : color },
  });

  const labelEl = (
    <Typography
      sx={{
        fontSize:      "0.5rem",
        fontWeight:    700,
        color:         disabled ? "rgba(255,255,255,0.3)" : color,
        lineHeight:    1,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace:    "nowrap",
      }}
    >
      {label}
    </Typography>
  );

  // ── Mobile view: icon only + tooltip ─────────────────────────────────────
  const mobileBtn = (
    <Box sx={{ display: { xs: "inline-flex", sm: "none" } }}>
      <Tooltip title={tooltip ?? label} placement="top">
        <Box
          onClick={disabled ? undefined : onClick}
          sx={baseBoxSx}
        >
          {iconEl}
        </Box>
      </Tooltip>
    </Box>
  );

  // ── Desktop view: icon + label, tooltip only when disabled ────────────────
  const desktopBtnContent = (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={baseBoxSx}
    >
      {iconEl}
      {labelEl}
    </Box>
  );

  const desktopBtn = (
    <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
      {disabled ? (
        <Tooltip title={tooltip ?? label} placement="top">
          <span style={{ display: "inline-flex" }}>
            {desktopBtnContent}
          </span>
        </Tooltip>
      ) : (
        desktopBtnContent
      )}
    </Box>
  );

  return (
    <>
      {mobileBtn}
      {desktopBtn}
    </>
  );
};

// ── Preset shorthands ─────────────────────────────────────────────────────────
MiniBaseButton.Green  = (props) => <MiniBaseButton variant="green"  {...props} />;
MiniBaseButton.Blue   = (props) => <MiniBaseButton variant="blue"   {...props} />;
MiniBaseButton.Red    = (props) => <MiniBaseButton variant="red"    {...props} />;
MiniBaseButton.Amber  = (props) => <MiniBaseButton variant="amber"  {...props} />;
MiniBaseButton.Purple = (props) => <MiniBaseButton variant="purple" {...props} />;

export default MiniBaseButton;