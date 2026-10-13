// ─── Shared card styles for the overview / dashboard views ───────────────
// Kept in one module so the welcome banner (Dashboard.jsx) and every role view
// render cards that look identical.
import getThemeColors from "../../../../utils/style/getThemeColors";

// NOT named `useColors`: cardSx is a plain helper, not a component, so a
// `use*` call inside it trips react-hooks/rules-of-hooks. The map shape is
// the same on purpose.
const cardColors = (c) => ({
  // colour only — the offset/blur geometry stays with the call site
  cardSm: c.shadow.cardSm,
  cardLg: c.shadow.cardLg,
});

export const cardSx = (theme, accentColor) => {
  const colors = cardColors(getThemeColors(theme.palette.mode === "dark"));
  return {
    borderRadius: 1.5,
    boxShadow: `0 1px 6px ${colors.cardSm}`,
    border: `1px solid ${theme.palette.divider}`,
    ...(accentColor && { borderLeft: `3px solid ${accentColor}` }),
    transition: "transform 0.2s, box-shadow 0.2s",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: `0 4px 12px ${colors.cardLg}`,
    },
  };
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
  }),
};

export default cardSx;
