import React, { useMemo } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────────
// 🎨 CENTRALIZED COLOR MAP — per-file useColors pattern
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  // Disabled states
  disabledBg: c.slate.mutedBg, // disabled button background
  disabledBorder: c.slate.border, // disabled border
  disabledText: c.gray.textMuted, // disabled icon & label

  // Variants — Dark Mode (auto-mapped from palette)
  green: {
    color: c.green.text,
    bg: c.green.bg,
    border: c.green.border,
    hoverBg: c.green.hoverBg,
    hoverBorder: c.green.hoverBorder,
  },
  blue: {
    color: c.blue.text,
    bg: c.blue.bg,
    border: c.blue.border,
    hoverBg: c.blue.hoverBg,
    hoverBorder: c.blue.hoverBorder,
  },
  red: {
    color: c.red.text,
    bg: c.red.bg,
    border: c.red.border,
    hoverBg: c.red.hoverBg,
    hoverBorder: c.red.hoverBorder,
  },
  amber: {
    color: c.amber.text,
    bg: c.amber.bg,
    border: c.amber.border,
    hoverBg: c.amber.hoverBg,
    hoverBorder: c.amber.hoverBorder,
  },
  purple: {
    color: c.violet.text,
    bg: c.violet.bg,
    border: c.violet.border,
    hoverBg: c.violet.hoverBg,
    hoverBorder: c.violet.hoverBorder,
  },
});

// ── MiniBaseButton ────────────────────────────────────────────────────
/**
 * Compact icon+label button — auto theme-aware, responsive layout.
 *
 * Layout:
 *   • sm+ → icon + label side-by-side
 *   • xs  → icon only, label as tooltip
 *
 * Props:
 *   icon, label, onClick, variant, disabled, tooltip, sx
 *   lightMode → optional: force light/dark palette; else auto from theme
 *   color, bg, border, hoverBg, hoverBorder → per-call overrides
 */
const MiniBaseButton = ({
  icon,
  label,
  onClick,
  variant = "blue",
  disabled = false,
  tooltip,
  sx = {},
  lightMode,

  // Raw color overrides
  color: colorProp,
  bg: bgProp,
  border: borderProp,
  hoverBg: hoverBgProp,
  hoverBorder: hoverBorderProp,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Explicit prop wins; otherwise follow app theme mode
  const resolvedLightMode = lightMode ?? !isDark;

  // 🎨 Get theme colors ONCE and map — auto light/dark switch
  const baseColors = useMemo(() => getThemeColors(isDark), [isDark]);
  const clr = useMemo(() => useColors(baseColors), [baseColors]);

  // Select variant preset
  const preset = clr[variant] ?? clr.blue;

  // Merge preset + overrides
  const {
    color = preset.color,
    bg = preset.bg,
    border = preset.border,
    hoverBg = preset.hoverBg,
    hoverBorder = preset.hoverBorder,
  } = {
    color: colorProp,
    bg: bgProp,
    border: borderProp,
    hoverBg: hoverBgProp,
    hoverBorder: hoverBorderProp,
  };

  // Disabled states — from palette
  const disabledBg = clr.disabledBg;
  const disabledBorder = clr.disabledBorder;
  const disabledFg = clr.disabledText;

  const baseBoxSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0.4,
    px: 0.75,
    py: 0.3,
    borderRadius: "6px",
    background: disabled ? disabledBg : bg,
    border: `0.5px solid ${disabled ? disabledBorder : border}`,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "all 0.15s",
    userSelect: "none",

    ...(!disabled && {
      "&:hover": { background: hoverBg, borderColor: hoverBorder },
      "&:active": { opacity: 0.75 },
    }),
    ...sx,
  };

  // Icon
  const iconEl = React.cloneElement(icon, {
    sx: { fontSize: "0.65rem", color: disabled ? disabledFg : color },
  });

  // Label
  const labelEl = (
    <Typography
      sx={{
        fontSize: "0.5rem",
        fontWeight: 700,
        color: disabled ? disabledFg : color,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Typography>
  );

  // ── Mobile: icon only + tooltip ───────────────────────────────────
  const mobileBtn = (
    <Box sx={{ display: { xs: "inline-flex", sm: "none" } }}>
      <Tooltip title={tooltip ?? label} placement="top">
        <Box onClick={disabled ? undefined : onClick} sx={baseBoxSx}>
          {iconEl}
        </Box>
      </Tooltip>
    </Box>
  );

  // ── Desktop: icon + label ──────────────────────────────────────────
  const desktopBtnContent = (
    <Box onClick={disabled ? undefined : onClick} sx={baseBoxSx}>
      {iconEl}
      {labelEl}
    </Box>
  );

  const desktopBtn = (
    <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
      {disabled ? (
        <Tooltip title={tooltip ?? label} placement="top">
          <span style={{ display: "inline-flex" }}>{desktopBtnContent}</span>
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

// ── Preset shorthands ─────────────────────────────────────────────────
MiniBaseButton.Green = (props) => <MiniBaseButton variant="green" {...props} />;
MiniBaseButton.Blue = (props) => <MiniBaseButton variant="blue" {...props} />;
MiniBaseButton.Red = (props) => <MiniBaseButton variant="red" {...props} />;
MiniBaseButton.Amber = (props) => <MiniBaseButton variant="amber" {...props} />;
MiniBaseButton.Purple = (props) => (
  <MiniBaseButton variant="purple" {...props} />
);

export default MiniBaseButton;
