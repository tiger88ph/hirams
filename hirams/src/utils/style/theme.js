// src/utils/style/theme.js

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: { main: "#0d47a1" }, // your brand color
    secondary: { main: "#22c55e" },

    // ── Custom tokens for PricingSetPanel & shared usage ──
    dive: {
      positive: mode === "light" ? "#047857" : "#34d399",
      negative: mode === "light" ? "#dc2626" : "#f87171",
      neutral: mode === "light" ? "#9ca3af" : "#6b7280",
    },
    pricingSet: {
      chosenText: mode === "light" ? "#047857" : "#34d399",
      normalText: mode === "light" ? "#1f2937" : "#e5e7eb",
      chosenBg: mode === "light" ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.12)",
    },
    directCostCard: {
      bg: mode === "light" ? "#f0fdf4" : "rgba(22, 163, 74, 0.15)",
      border: mode === "light" ? "#bbf7d0" : "rgba(74, 222, 128, 0.3)",
      text: mode === "light" ? "#166534" : "#bbf7d0",
    },
    percentageBadge: {
      positiveBg: mode === "light" ? "#dcfce7" : "rgba(22, 163, 74, 0.25)",
      positiveText: mode === "light" ? "#15803d" : "#86efac",
      negativeBg: mode === "light" ? "#fee2e2" : "rgba(185, 28, 28, 0.25)",
      negativeText: mode === "light" ? "#b91c1c" : "#fca5a5",
      neutralBg: mode === "light" ? "#f3f4f6" : "rgba(75, 85, 99, 0.25)",
      neutralText: mode === "light" ? "#6b7280" : "#9ca3af",
    },
    sellingPrice: {
      positive: mode === "light" ? "#1d4ed8" : "#60a5fa",
      neutral: mode === "light" ? "#9ca3af" : "#6b7280",
    },
  },

  ...(mode === "light"
    ? {
        background: {
          default: "#f5f5f5",
          paper: "#ffffff",
        },
        text: {
          primary: "#1a1a1a",
          secondary: "#4b5563",
        },
      }
    : {
        background: {
          default: "#121212",
          paper: "#1e1e1e",
        },
        text: {
          primary: "#ffffff",
          secondary: "#b0b0b0",
        },
      }),

  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 500 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 300 },
  },
});