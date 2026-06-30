// timeZone.js
// This module provides current date and time in Philippines Time (PHT, UTC+8)

const PHT_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8 in milliseconds

// Returns a Date object adjusted to Philippines Time
export const getPhilippinesTime = () => {
  const utcDate = new Date();
  return new Date(
    utcDate.getTime() +
      PHT_OFFSET_MS +
      utcDate.getTimezoneOffset() * 60 * 1000,
  );
};

// Returns a formatted PHT string
// Example: "February 12, 2026, 10:15:30 PM"
export const getPhilippinesTimeString = (options = {}) => {
  return getPhilippinesTime().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    ...options,
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Converts any date value to a PHT-adjusted Date object.
// Handles UTC strings from the server (e.g. "2026-02-12T14:15:00Z") correctly.
const toPHT = (val) => {
  const d = new Date(val);
  if (isNaN(d)) return null;
  return new Date(
    d.getTime() + PHT_OFFSET_MS + d.getTimezoneOffset() * 60 * 1000,
  );
};

// Formats a date value as a short PHT datetime string.
// Example: "Feb 12, 2026, 10:15 PM"
export const fmtDateTime = (val) => {
  if (!val) return "—";
  const pht = toPHT(val);
  return pht
    ? pht.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : val;
};

// Example usage:
// import { getPhilippinesTime, getPhilippinesTimeString, fmtDateTime } from './timeZone'; inside utils/helpers folder
// console.log(getPhilippinesTime());              // Date object in PHT
// console.log(getPhilippinesTimeString());        // "February 12, 2026, 10:15:30 PM"
// console.log(fmtDateTime("2026-02-12T02:15:00Z")); // "Feb 12, 2026, 10:15 AM"

// Formats a date value as a short PHT date string (no time).
// Example: "Feb 12, 2026"
export const fmtDate = (val) => {
  if (!val) return "—";
  const pht = toPHT(val);
  return pht
    ? pht.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : val;
};