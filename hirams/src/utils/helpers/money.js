// ── Money helpers ───────────────────────────────────────────────────────
// Peso amounts are summed as IEEE-754 doubles (0.1 + 0.2 !== 0.3), so two
// sides that both display ₱3,403,434.87 can hold 3403434.8700000005 and
// 3403434.87. Any "are these totals equal?" decision must therefore run in
// WHOLE CENTS, where integers compare exactly.

/**
 * Whole cents of a money value (absolute value, rounded to 2 dp).
 * Non-finite input → 0 so a bad row can never poison a total with NaN.
 */
export const toCents = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(Math.abs(n) * 100) : 0;
};

/** Whole cents → "1,234.56" for use inside messages/tooltips. */
export const centsLabel = (cents) =>
  (Number(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
