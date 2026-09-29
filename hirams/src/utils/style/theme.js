// src/utils/style/theme.js
import getThemeColors from "./getThemeColors";

// Brand navy — single source of truth is the "navy" accent in getThemeColors.
// Uses the LIGHT seed (#0D47A1) in BOTH modes so MUI's default controls
// (Checkbox, Switch, Button, focus rings…) keep the exact navy they had
// before this refactor — no visual drift in either mode.
const brandNavy = getThemeColors(false).navy.textStrong;

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: { main: brandNavy },
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