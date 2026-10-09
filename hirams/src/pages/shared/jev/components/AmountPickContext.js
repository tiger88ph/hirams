import { createContext } from "react";

// ── Click-to-fill channel for the entry modal's Amount field ─────────────
// Provided by JevEntryAEModal around ITS OWN panel + form, so a money cell
// only becomes a click target inside that modal: every other host of these
// tables (the voucher page's particulars, the inventory group drill-down,
// the shared JEV viewer) has no provider above it and keeps behaving — and
// looking — exactly as it always did.
//
// Kept in its own file so AmountPick.jsx exports nothing but its component
// (react-refresh/only-export-components).
export const AmountPickContext = createContext(null);
