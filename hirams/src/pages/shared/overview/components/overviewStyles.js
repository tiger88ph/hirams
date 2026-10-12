// ─── Shared card styles for the overview / dashboard views ──────────────────
// Kept in one module so the welcome banner (Dashboard.jsx) and every role view
// render cards that look identical.
export const cardSx = (theme, accentColor) => ({
  borderRadius: 1.5,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 1px 6px rgba(0,0,0,0.4)"
      : "0 1px 6px rgba(0,0,0,0.07)",
  border: `1px solid ${theme.palette.divider}`,
  ...(accentColor && { borderLeft: `3px solid ${accentColor}` }),
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 4px 12px rgba(0,0,0,0.5)"
        : "0 4px 12px rgba(0,0,0,0.1)",
  },
});

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
  }),
};

export default cardSx;
