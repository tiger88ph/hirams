//
// Usage:
//   function useColors() {
//     const theme = useTheme();
//     const isDark = theme.palette.mode === "dark";
//     const c = getThemeColors(isDark);
//     return { isDark, theme: c, textareaBg: isDark ? "rgba(30,41,59,0.6)" : "#fafafa" };
//   }
//
// ─────────────────────────────────────────────────────────────────────────
// REUSABLE PROMPTS — paste these into a new chat to get the exact same
// result again, without re-explaining everything from scratch.
// ─────────────────────────────────────────────────────────────────────────
//
// GENERAL OUTPUT RULE — applies to EVERY prompt below:
//
//   When returning refactored code, optimize for fast copy/paste, not
//   maximum readability. Concretely:
//     - Minimize blank/break lines — don't insert an empty line between
//       every statement or JSX block "for air"; only break where it
//       genuinely improves scanability (e.g. between unrelated sections).
//     - Combine short, related lines instead of one-prop-per-line when it
//       doesn't hurt clarity (e.g. small useColors token groups, short sx
//       objects, one-line ternaries).
//     - Don't add extra explanatory comment lines inside the component
//       body unless something is genuinely non-obvious (the ⚠️ CRITICAL
//       token-safety rule below still always applies).
//     - Never sacrifice correctness or the token-safety rule for
//       brevity — shorter output is a tie-breaker, not a priority over
//       working code.
//
// ─────────────────────────────────────────────────────────────────────────
//
// PROMPT 1 — apply this color system to a component (per-file "useColors" map): remove other color s like themePalette only this useColor is the official coloring style helper
//
// Refactor this component to use getThemeColors.js for its colors.
// At the top of the file, add a local `useColors` map like this:

//  const useColors = (c) => ({
//    border: c.slate.border,
//    text: c.gray.textPrimary,
//    violet: { bg: c.violet.bg, text: c.violet.text },
//    blue: { bg: c.blue.bg, textDark: c.blue.textStrong },
//    green: { bg: c.green.bg, textDark: c.green.textDark },
//    amber: { bg: c.amber.bg, textDark: c.amber.textDark },
//  });

// Only include the tokens THIS component actually uses (add more keys
// from getThemeColors as needed, don't dump the whole palette).

// ⚠️ CRITICAL — before adding any `c.<group>.<token>` reference, open
// getThemeColors.js and confirm that exact token exists on that exact
// group. Do NOT invent, guess, or assume a token name because it "sounds
// right" or existed in a similar-looking file (e.g. c.slate.headerFooterBg,
// c.slate.overlayPanel — these do NOT exist and will silently resolve to
// undefined, breaking styles with no error). If the token you need doesn't
// exist, either:
//   (a) use the closest real token instead, or
//   (b) explicitly tell me it's missing so we add it to getThemeColors.js
//       via Prompt 2/3 — never fabricate it in the component's useColors map.

// In the component itself, wire it up like this:

//  const theme = useTheme();
//  const isDark = theme.palette.mode === "dark";
//  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
//  const colors = React.useMemo(() => useColors(base), [base]);

// Then replace every hardcoded color / theme.palette.* reference with
// the matching colors.xxx token. Do NOT create a separate useColors.js
// file — keep the useColors map inline at the top of this same file.
// ─────────────────────────────────────────────────────────────────────────
//
// PROMPT 2 — add a new accent color to getThemeColors.js:
//
//   "Add a new accent color called '<NAME>' to getThemeColors.js.
//    Add it to ACCENT_SEEDS as: <name>: ['<lightHex>', '<darkHex>'],
//    where lightHex reads well as text on a white background and darkHex
//    reads well as text on a dark background. Then expose it in the
//    returned object as `<name>: accents.<name>,` alongside the other
//    accent colors. Keep the same generated token shape (bg, bgSoft,
//    border, borderStrong, text, textStrong, hover, active) — don't
//    hand-write shades for it."
//
// ─────────────────────────────────────────────────────────────────────────
//
// PROMPT 3 — add a new token to EVERY accent color at once:
//
//   "Add a new token called '<tokenName>' to the makeAccent() function in
//    getThemeColors.js, following the same alpha-based recipe pattern as
//    the existing tokens (bg, border, text, hover, etc). It should appear
//    automatically on every accent color (blue, green, red, etc) without
//    editing each color individually."
//

// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// DESIGN
//
// Instead of hand-writing bg/border/text shades for every single color
// (which is how the old file drifted out of balance), every ACCENT color
// is generated from one hex value by `makeAccent()`. That function applies
// the exact same alpha/lightness recipe to every color, so dark and light
// mode are guaranteed to be visually balanced against each other, and
// every color exposes the exact same token set:
//
//    bg           — soft fill background (badges, panels)
//    bgSoft       — even softer fill (subtle highlight)
//    border       — default border
//    borderStrong — emphasized / focus border
//    text         — default text-on-light-fill color
//    textStrong   — stronger / heading variant of text
//    hover        — hover background
//    active       — active/selected background
//
// NEUTRAL scales (skeleton, slate, gray) are NOT accent colors — they're
// structural UI tokens (borders, surfaces, text hierarchy), so they stay
// explicit, but grouped clearly by purpose.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Convert a hex color to "r,g,b" for use inside rgba().
 */
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
};

const rgba = (hex, alpha) => `rgba(${hexToRgb(hex)},${alpha})`;

/**
 * Generate a full, balanced token set for one accent color from a single
 * "seed" hue, given as a light-mode-friendly hex and a dark-mode-friendly
 * hex (dark mode wants a lighter/more saturated hue so it reads on dark
 * backgrounds).
 *
 * @param {string} lightHex - hex used to derive LIGHT-mode text/tint colors
 * @param {string} darkHex  - hex used to derive DARK-mode text/tint colors
 */
const makeAccent = (lightHex, darkHex) => (isDark) => {
  const hex = isDark ? darkHex : lightHex;
  return isDark
    ? { 
        bg: rgba(hex, 0.15),
        bgSoft: rgba(hex, 0.1),
        border: rgba(hex, 0.35),
        borderStrong: rgba(hex, 0.55),
        text: hex,
        textStrong: hex,
        hover: rgba(hex, 0.22),
        active: rgba(hex, 0.32),
      }
    : {
        // ✅ Balanced for light mode — visible but not muddy
        bg: rgba(hex, 0.12),
        bgSoft: rgba(hex, 0.07),
        border: rgba(hex, 0.35),
        borderStrong: rgba(hex, 0.55),
        text: hex,
        textStrong: hex,
        hover: rgba(hex, 0.2),
        active: rgba(hex, 0.28),
      };
};
// Seed hues: [lightModeHex, darkModeHex]
// lightModeHex should read well as TEXT on a white bg.
// darkModeHex should read well as TEXT on a dark bg (usually lighter/more saturated).
const ACCENT_SEEDS = {
  blue: ["#2563EB", "#93C5FD"], // slightly darker for better contrast in light mode
  indigo: ["#4338CA", "#A5B4FC"],
  purple: ["#5B21B6", "#A5B4FC"],
  violet: ["#7C3AED", "#C4B5FD"],
  orange: ["#C2410C", "#FB923C"],
  amber: ["#B45309", "#FBBF24"],
  yellow: ["#A16207", "#FDE68A"],
  green: ["#16A34A", "#4ADE80"],
  red: ["#DC2626", "#F87171"],
  teal: ["#0D9488", "#5EEAD4"],
  cyan: ["#0891B2", "#67E8F9"],
  pink: ["#BE185D", "#F9A8D4"],
};

/**
 * Build every accent color's token set for the given mode.
 */
const buildAccents = (isDark) => {
  const accents = {};
  for (const [name, [lightHex, darkHex]] of Object.entries(ACCENT_SEEDS)) {
    accents[name] = makeAccent(lightHex, darkHex)(isDark);
  }
  return accents;
};

export const getThemeColors = (isDark) => {
  const accents = buildAccents(isDark);

  return {
    // ═══════════════════════════════════════════════════════════════════
    // SKELETON — plain neutral shades for loading states
    // ═══════════════════════════════════════════════════════════════════
    skeleton: {
      strong: isDark ? "rgba(148,163,184,0.5)" : "#6B7280",
      base: isDark ? "rgba(100,116,139,0.4)" : "#9CA3AF",
      soft: isDark ? "rgba(71,85,105,0.3)" : "#E5E7EB",
      overlay: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      skelLight: isDark ? "rgba(51,65,85,0.9)" : "#E5E7EB",
      skelMed: isDark ? "rgba(71,85,105,0.9)" : "#D1D5DB",
      skelFaint: isDark ? "rgba(84,102,125,0.8)" : "#E5E7EB",
    },

    // ═══════════════════════════════════════════════════════════════════
    // SLATE — structural surfaces: borders, dividers, cards, panels, hovers
    // ═══════════════════════════════════════════════════════════════════
    slate: {
      // borders / dividers
      border: isDark ? "rgba(148,163,184,0.15)" : "#D1D5DB",
      borderLight: isDark ? "rgba(148,163,184,0.2)" : "#E5E7EB",
      borderRow: isDark ? "rgba(148,163,184,0.1)" : "#E5E7EB",
      divider: isDark ? "rgba(148,163,184,0.1)" : "#E5E7EB",

      // hovers
      hover: isDark ? "rgba(30,41,59,0.5)" : "#F3F4F6",
      itemHover: isDark ? "rgba(30,41,59,0.5)" : "#E5E7EB",

      // card / panel surfaces
      itemHeaderBg: isDark ? "rgba(30,41,59,0.5)" : "#F8FAFC",
      expandedBg: isDark ? "rgba(30,41,59,0.4)" : "#F1F5F9",
      outerBg: isDark ? "rgba(15,23,42,0.5)" : "#FFFFFF",
      innerBg: isDark ? "rgba(30,41,59,0.4)" : "#F1F5F9",
      totalBg: isDark ? "rgba(30,41,59,0.3)" : "#F8FAFC",
      totalBorder: isDark ? "rgba(148,163,184,0.45)" : "#CBD5E1",
      stripeBg: isDark ? "rgba(148,163,184,0.06)" : "#F1F5F9",
      stripeAltBg: isDark ? "rgba(148,163,184,0.04)" : "#F8FAFC",

      // muted chips
      mutedBg: isDark ? "rgba(51,65,85,0.6)" : "#F1F5F9",
      mutedBorder: isDark ? "rgba(71,85,105,0.4)" : "#E2E8F0",
      mutedColor: isDark ? "#94A3B8" : "#64748B",
      mutedText: isDark ? "#94A3B8" : "#64748B",

      // summary block
      summaryBg: isDark ? "rgba(51,65,85,0.55)" : "#EFF2F7",
      summaryBorder: isDark ? "rgba(148,163,184,0.3)" : "#E2E8F0",

      // buttons
      btnBg: isDark ? "rgba(30,41,59,0.8)" : "#FFFFFF",
      btnBorder: isDark ? "rgba(148,163,184,0.35)" : "#CBD5E1",
      btnText: isDark ? "#E2E8F0" : "#1E293B",
      btnHoverBg: isDark ? "rgba(30,41,59,0.95)" : "#F1F5F9",

      // misc
      scrollbarThumb: isDark ? "#475569" : "#CBD5E1",
    },

    // ═══════════════════════════════════════════════════════════════════
    // GRAY — text hierarchy + plain inputs
    // ═══════════════════════════════════════════════════════════════════
    gray: {
      textPrimary: isDark ? "#E2E8F0" : "#1E293B",
      textSecondary: isDark ? "#94A3B8" : "#64748B",
      textMuted: isDark ? "#9CA3AF" : "#94A3B8",
      textDisabled: isDark ? "#78889F" : "#94A3B8",
      textHeading: isDark ? "#CBD5E1" : "#1E293B",
      label: isDark ? "#CBD5E1" : "#334155",
      inputBg: isDark ? "rgba(30,41,59,0.6)" : "#F8FAFC",
      inputFocusBg: isDark ? "rgba(51,65,85,0.5)" : "#FFFFFF",
    },

    // ═══════════════════════════════════════════════════════════════════
    // BADGES — quick accent fills, derived from the same accent set
    // ═══════════════════════════════════════════════════════════════════
    badge: {
      orangeBg: accents.orange.bg,
      amberBg: accents.amber.bg,
      blueBg: accents.blue.bg,
      redBg: accents.red.bg,
      goldBg: isDark ? "rgba(251,191,36,0.25)" : "#FDE68A",
      amberAltBg: isDark ? "rgba(251,191,36,0.18)" : "#FEF3C7",
    },

    // ═══════════════════════════════════════════════════════════════════
    // ACCENT COLORS — fully generated, same token shape for every color:
    //   bg, bgSoft, border, borderStrong, text, textStrong, hover, active
    // ═══════════════════════════════════════════════════════════════════
    blue: accents.blue,
    indigo: accents.indigo,
    purple: accents.purple,
    violet: accents.violet,
    orange: accents.orange,
    amber: {
      ...accents.amber,
      // extra semantic aliases kept for backwards compatibility
      textDark: isDark ? "#FEF08A" : "#78350F",
      value: isDark ? "#FEF08A" : "#78350F",
      warnBg: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
      warnBorder: isDark ? "rgba(251,191,36,0.35)" : "#F59E0B",
      warnText: isDark ? "#FCD34D" : "#92400E",
      warnHoverBg: isDark ? "rgba(245,158,11,0.2)" : "#FED7AA",
    },
    yellow: accents.yellow,
    green: {
      ...accents.green,
      textDark: isDark ? "#BBF7D0" : "#166534",
      hoverBorder: isDark ? "rgba(74,222,128,0.6)" : "#22C55E",
      activeBg: isDark ? "rgba(22,163,74,0.35)" : "#BBF7D0",
      paid: isDark ? "#4ADE80" : "#16A34A",
      paidBorder: isDark ? "rgba(74,222,128,0.5)" : "#16A34A",
      badgeBg: isDark ? "rgba(34,197,94,0.16)" : "rgba(22,163,74,0.15)",
      badgeText: isDark ? "#86EFAC" : "#15803D",
    },
    red: {
      ...accents.red,
      textDark: isDark ? "#FCA5A5" : "#B91C1C",
      hoverBorder: isDark ? "rgba(248,113,113,0.45)" : "#FCA5A5",
      danger: isDark ? "#F87171" : "#DC2626",
    },
    teal: accents.teal,
    cyan: accents.cyan,
    pink: accents.pink,
  };
};

export default getThemeColors;
