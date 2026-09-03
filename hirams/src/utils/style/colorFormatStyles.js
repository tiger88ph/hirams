// Usage structure to all 
// function useColors() {
//   const theme = useTheme();
//   const isDark = theme.palette.mode === "dark";
//   const c = getThemeColors(theme);

//   return {
//     isDark,
//     theme: c,
//     textareaBg: isDark ? "rgba(30,41,59,0.6)" : "#fafafa",
//     ......
//   };
// }
export const getThemeColors = (isDark) => ({
  // ── SKELETON — plain neutral shades for loading states ──
  skeleton: {
    strong: isDark ? "rgba(148,163,184,0.5)" : "#9CA3AF",
    base: isDark ? "rgba(100,116,139,0.4)" : "#D1D5DB",
    soft: isDark ? "rgba(71,85,105,0.3)" : "#E5E7EB",
    overlay: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    // ✅ YOUR NEW SKELETON SHADES
    skelLight: isDark ? "rgba(51,65,85,0.9)" : "#E5E7EB",
    skelMed: isDark ? "rgba(71,85,105,0.9)" : "#D1D5DB",
    skelFaint: isDark ? "rgba(84,102,125,0.8)" : "#F0F0F0",
  },

  // ── SLATE — borders, dividers, hovers, muted surfaces ──
  slate: {
    border: isDark ? "rgba(148,163,184,0.15)" : "#E5E7EB",       // ✅ YOURS
    borderLight: isDark ? "rgba(148,163,184,0.2)" : "#E5E7EB",
    borderRow: isDark ? "rgba(148,163,184,0.1)" : "#F3F4F6",
    divider: isDark ? "rgba(148,163,184,0.1)" : "#F3F4F6",         // ✅ borderFaint
    hover: isDark ? "rgba(30,41,59,0.5)" : "#F9FAFB",
    itemHover: isDark ? "rgba(30,41,59,0.5)" : "#F3F4F6",
    // ✅ YOUR CARD/PANEL BACKGROUNDS — balanced
    itemHeaderBg: isDark ? "rgba(30,41,59,0.5)" : "#F9FAFB",       // cardHeaderBg
    expandedBg: isDark ? "rgba(30,41,59,0.4)" : "#F8FAFC",         // cardFooterBg
    outerBg: isDark ? "rgba(15,23,42,0.5)" : "#FFFFFF",            // cardBg ✅
    innerBg: isDark ? "rgba(30,41,59,0.4)" : "#F3F4F6",            // panelBg ✅
    totalBg: isDark ? "rgba(30,41,59,0.3)" : "#F9FAFB",            // panelAltBg ✅
    stripeBg: isDark ? "rgba(148,163,184,0.06)" : "#F3F4F6",       // ✅ YOURS
    stripeAltBg: isDark ? "rgba(148,163,184,0.04)" : "#F0F4F8",    // ✅ YOURS
    totalBorder: isDark ? "rgba(148,163,184,0.45)" : "#DDE3EE",
    mutedBg: isDark ? "rgba(51,65,85,0.6)" : "#F3F4F6",
    mutedBorder: isDark ? "rgba(71,85,105,0.4)" : "#E5E7EB",
    mutedColor: isDark ? "#94a3b8" : "#9CA3AF",
    mutedText: isDark ? "#94a3b8" : "#9CA3AF",
    scrollbarThumb: isDark ? "#475569" : "#D1D5DB",
    summaryBg: isDark ? "rgba(51,65,85,0.55)" : "#EFF2F7",
    summaryBorder: isDark ? "rgba(148,163,184,0.3)" : "#DDE3EE",
    btnBg: isDark ? "rgba(30,41,59,0.8)" : "#FFFFFF",
    btnBorder: isDark ? "rgba(148,163,184,0.35)" : "#D1D5DB",
    btnText: isDark ? "#e2e8f0" : "#374151",
    btnHoverBg: isDark ? "rgba(30,41,59,0.95)" : "#F9FAFB",
  },

  // ── GRAY — primary/secondary/muted text ──
  gray: {
    textPrimary: isDark ? "#e2e8f0" : "#111827",
    textSecondary: isDark ? "#94a3b8" : "#6B7280",
    textMuted: isDark ? "#9ca3af" : "#9CA3AF",
    textDisabled: isDark ? "#78889f" : "#9CA3AF",
    textHeading: isDark ? "#cbd5e1" : "#374151",
    label: isDark ? "#cbd5e1" : "#334155",
    inputBg: isDark ? "rgba(30,41,59,0.6)" : "#FAFAFA",
    inputFocusBg: isDark ? "rgba(51,65,85,0.5)" : "#FFFFFF",
  },

  // ── BADGES — YOUR NEW ACCENT BADGE COLORS ──
  badge: {
    orangeBg: isDark ? "rgba(251,146,60,0.15)" : "#FFEDD5",
    amberBg: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
    blueBg: isDark ? "rgba(96,165,250,0.15)" : "#DBEAFE",
    redBg: isDark ? "rgba(248,113,113,0.15)" : "#FEE2E2",
    goldBg: isDark ? "rgba(251,191,36,0.25)" : "#FCD34D",
    amberAltBg: isDark ? "rgba(251,191,36,0.18)" : "#FED7AA",
  },

  // ── BLUE — accents, links, info ──
  blue: {
    bg: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    bgSoft: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)",
    border: isDark ? "rgba(96,165,250,0.35)" : "#BFDBFE",
    borderDashed: isDark ? "rgba(96,165,250,0.4)" : "#93C5FD",
    text: isDark ? "#93c5fd" : "#3B82F6",
    textDark: isDark ? "#bfdbfe" : "#1D4ED8",
    textMid: isDark ? "#93c5fd" : "#3B82F6",
    hoverBg: isDark ? "rgba(59,130,246,0.2)" : "#DBEAFE",
  },

  // ── INDIGO / PURPLE ──
  purple: {
    bg: isDark ? "rgba(99,102,241,0.15)" : "#EEEDFE",
    border: isDark ? "rgba(129,140,248,0.35)" : "#AFA9EC",
    text: isDark ? "#a5b4fc" : "#534AB7",
  },
  indigo: {
    bg: isDark ? "rgba(99,102,241,0.15)" : "#EEF2FF",
    border: isDark ? "rgba(129,140,248,0.35)" : "#C7D2FE",
    text: isDark ? "#a5b4fc" : "#4F46E5",
  },

  // ── ORANGE ──
  orange: {
    text: isDark ? "#fb923c" : "#D85A30",
    bg: isDark ? "rgba(251,146,60,0.15)" : "#FFF1EC",
    border: isDark ? "rgba(251,146,60,0.35)" : "#FBD3C3",
  },

  // ── AMBER ──
  amber: {
    bg: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
    text: isDark ? "#fbbf24" : "#92400E",
    textDark: isDark ? "#FEF08A" : "#78350F",
    value: isDark ? "#fef08a" : "#78350F",
    border: isDark ? "rgba(251,191,36,0.35)" : "#FDE68A",
    warnBg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    warnBorder: isDark ? "rgba(251,191,36,0.35)" : "#FDE68A",
    warnText: isDark ? "#fcd34d" : "#92400E",
    warnHoverBg: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7",
  },

  // ── YELLOW ──
  yellow: {
    bg: isDark ? "rgba(234,179,8,0.16)" : "rgba(234,179,8,0.10)",
    text: isDark ? "#FDE68A" : "#92400E",
  },

// ── GREEN ──
green: {
  bg: isDark ? "rgba(22,163,74,0.12)" : "#F0FDF4",
  border: isDark ? "rgba(74,222,128,0.4)" : "#BBF7D0",
  text: isDark ? "#86efac" : "#15803D",
  textDark: isDark ? "#BBF7D0" : "#166534",
  hoverBg: isDark ? "rgba(22,163,74,0.22)" : "#DCFCE7",      // ✅ ADDED
  hoverBorder: isDark ? "rgba(74,222,128,0.6)" : "#22C55E",   // ✅ ADDED
  activeBg: isDark ? "rgba(22,163,74,0.35)" : "#BBF7D0",
  paid: isDark ? "#4ade80" : "#16A34A",
  paidBorder: isDark ? "rgba(74,222,128,0.5)" : "#16A34A",
  badgeBg: isDark ? "rgba(34,197,94,0.16)" : "rgba(34,197,94,0.10)",
  badgeText: isDark ? "#86EFAC" : "#15803D",
},

// ── RED ──
red: {
  text: isDark ? "#f87171" : "#EF4444",
  textDark: isDark ? "#fca5a5" : "#B91C1C",
  bg: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2",
  border: isDark ? "rgba(248,113,113,0.25)" : "rgba(239,68,68,0.3)",
  hoverBg: isDark ? "rgba(239,68,68,0.18)" : "#FEE2E2",       // ✅ ADDED
  hoverBorder: isDark ? "rgba(248,113,113,0.45)" : "#FCA5A5",  // ✅ ADDED
  danger: isDark ? "#f87171" : "#DC2626",
},

  // ── TEAL / CYAN ──
  teal: {
    bg: isDark ? "rgba(20,184,166,0.15)" : "#F0FDFA",
    border: isDark ? "rgba(45,212,191,0.35)" : "#99F6E4",
    text: isDark ? "#5eead4" : "#0F766E",
  },
  cyan: {
    bg: isDark ? "rgba(6,182,212,0.15)" : "#ECFEFF",
    border: isDark ? "rgba(34,211,238,0.35)" : "#A5F3FC",
    text: isDark ? "#67e8f9" : "#0E7490",
  },

  // ── PINK / ROSE ──
  pink: {
    bg: isDark ? "rgba(236,72,153,0.15)" : "#FDF2F8",
    border: isDark ? "rgba(244,114,182,0.35)" : "#FBCFE8",
    text: isDark ? "#f9a8d4" : "#BE185D",
  },

  violet: {
    bg: isDark ? "rgba(139,92,246,0.16)" : "rgba(139,92,246,0.10)",
    border: isDark ? "rgba(139,92,246,0.35)" : "rgba(167,139,250,0.35)",
    text: isDark ? "#C4B5FD" : "#6D28D9",
    textDark: isDark ? "#DDD6FE" : "#5B21B6",
  },
});

export default getThemeColors;