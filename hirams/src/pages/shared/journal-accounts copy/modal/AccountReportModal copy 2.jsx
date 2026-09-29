import React, { useEffect, useMemo, useState } from "react";
import ModalContainer from "../../../../components/layouts/modal/ModalContainer.jsx";
import { Box, Typography, useTheme } from "@mui/material";
import {
  AccountBalanceOutlined,
  ExpandLess,
  ExpandMore,
  FolderOffOutlined,
  LinkOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import getThemeColors from "../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  divider: c.slate.divider,
  headerBg: c.slate.itemHeaderBg ?? c.slate.mutedBg,
  hoverBg: c.slate.hover,
  mutedBg: c.slate.mutedBg,
  violet: { bg: c.violet.bg, border: c.violet.border, text: c.violet.text },
  blue: { bg: c.blue.bg, border: c.blue.border, text: c.blue.text },
  amber: { bg: c.amber.bg, border: c.amber.border, text: c.amber.text },
  teal: { bg: c.teal.bg, border: c.teal.border, text: c.teal.text },
  red: { bg: c.red.bg, text: c.red.text },
  green: { bg: c.green.bg, text: c.green.text },
  gray: {
    pri: c.gray.textPrimary,
    sec: c.gray.textSecondary,
    muted: c.gray.textMuted,
    text: c.gray.textSecondary,
    bg: c.slate.mutedBg,
    border: c.slate.border,
  },
  inputBg: c.gray.inputBg,
});

// cAccountType "C" = clients, "P" = suppliers — same labels as the tree row
const TYPE_META = {
  C: { label: "CT", tone: "amber" },
  P: { label: "ST", tone: "teal" },
};

// Depth of each linked account relative to the account being reported on
const flatten = (nodes, depth = 0, out = []) => {
  nodes.forEach((n) => {
    out.push({ node: n, depth });
    flatten(n.children || [], depth + 1, out);
  });
  return out;
};

// Stable identity for a row — used as the React key and as the id of the
// collapse state, so it still works when a node has no database id.
const rowKeyOf = ({ node, depth }) => node.id ?? `${depth}-${node.accountName}`;

// Date filter modes shown at the top of the report
const DATE_MODES = [
  { value: "all", label: "All" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

// jev.dtOccur is a MySQL datetime ("2026-09-15 14:30:00") — parse the
// "YYYY-MM-DD" prefix by hand so no timezone shift can move the date.
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatDay = (raw) => {
  const s = String(raw ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s ? s.slice(0, 10) : "—";
  return `${MONTH_SHORT[Number(m[2]) - 1] ?? m[2]} ${Number(m[3])}, ${m[1]}`;
};

// Index JEV entries by JEV and by journal account
const groupEntries = (entries = []) => {
  const byJev = {};
  const byAccount = {};
  entries.forEach((e) => {
    (byJev[e.nJEVId] ||= []).push(e);
    (byAccount[e.nJournalAccountId] ||= []).push(e);
  });
  return { byJev, byAccount };
};

const Chip = ({ tone, colors, icon, children }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.3,
      px: 0.6,
      py: 0.1,
      borderRadius: "50px",
      fontSize: "0.55rem",
      fontWeight: 600,
      lineHeight: 1.4,
      whiteSpace: "nowrap",
      color: colors[tone].text,
      background: colors[tone].bg,
      border: `0.5px solid ${colors[tone].border ?? colors[tone].text}`,
    }}
  >
    {icon}
    {children}
  </Box>
);

// One JEV line: [type] counterpart account(s) .... dtOccur .... amount.
// No From/To badge — direction is carried by the amount's colour and sign:
//   money leaving the account (dAmount < 0) → RED  "-1,000.00"
//   money entering the account (dAmount > 0) → GREEN "+1,000.00"
const JevEntryLine = ({
  entry,
  byJev,
  nameById,
  colors,
  jevTypeOptions = [],
}) => {
  const amt = Number(entry.dAmount) || 0;
  const isOut = amt < 0;
  const hasValue = amt !== 0;

  // jev.jev.cJEVLinkType → label, e.g. "V" → "Disbursement Voucher"
  const linkType = entry?.jev?.cJEVLinkType;
  const typeLabel =
    linkType == null || linkType === ""
      ? ""
      : (jevTypeOptions.find((t) => String(t.key) === String(linkType))
          ?.label ?? "");

  const counterparts = (byJev[entry.nJEVId] || [])
    .filter((s) => s !== entry && Number(s.dAmount) < 0 !== isOut)
    .map((s) => nameById[s.nJournalAccountId] ?? "—");

  const tone = !hasValue
    ? colors.gray.sec
    : isOut
      ? colors.red.text
      : colors.green.text;
  const sign = !hasValue ? "" : isOut ? "-" : "+";
  const value = Math.abs(amt).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  });

  return (
    <Box
      sx={{
        // 3 columns: accounts (wide, left) · dtOccur (centre, text left) · amount
        display: "grid",
        gridTemplateColumns: "2fr 1fr minmax(96px, auto)",
        alignItems: "center",
        gap: 0.5,
        py: 0.3,
        fontSize: "0.62rem",
        color: tone,
      }}
    >
      {/* Col 1 — type + counterpart account(s) */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
      >
        {typeLabel && (
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <Chip tone="blue" colors={colors}>
              {typeLabel}
            </Chip>
          </Box>
        )}
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 600,
            color: tone,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {counterparts.join(", ") || "—"}
        </Typography>
      </Box>

      {/* Col 2 — dtOccur, sits in the centre of the row, text aligned left */}
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 500,
          color: colors.gray.sec,
          textAlign: "left",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={String(entry?.jev?.dtOccur ?? "")}
      >
        {formatDay(entry?.jev?.dtOccur)}
      </Typography>

      {/* Col 3 — amount, right aligned */}
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: tone,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {sign}
        {value}
      </Typography>
    </Box>
  );
};

// Entries hanging beneath an account. Each row starts with a tree dash
// (├── / └──) whose stem sits on the centre of that account's icon and
// points right toward the entry — there is no vertical rule on the left.
const EntryBranch = ({
  entries,
  colors,
  byJev,
  nameById,
  jevTypeOptions = [],
  sx,
}) => (
  <Box sx={sx}>
    {entries.map((e, i) => {
      const isLast = i === entries.length - 1;
      return (
        <Box
          key={e.nJEVEntryId ?? i}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.4,
            pl: 0.5,
          }}
        >
          <Typography
            component="span"
            sx={{
              flexShrink: 0,
              fontSize: "0.62rem",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              color: colors.gray.muted,
              userSelect: "none",
            }}
          >
            {isLast ? "└──" : "├──"}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <JevEntryLine
              entry={e}
              byJev={byJev}
              nameById={nameById}
              colors={colors}
              jevTypeOptions={jevTypeOptions}
            />
          </Box>
        </Box>
      );
    })}
  </Box>
);

function AccountReportModal({
  open,
  onClose,
  account,
  allAccounts = [],
  jevEntries = [],
  jevTypeOptions = [],
  jevActiveKey = "A",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [search, setSearch] = useState("");

  // Row keys whose subtree (its entry block + the linked accounts under it)
  // is currently folded away.
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const toggleRow = (key) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // ── Date filter — applies to JEV entries via jev.dtOccur ───────────────
  const [dateMode, setDateMode] = useState("all"); // all | month | year | custom
  const [month, setMonth] = useState(""); // "YYYY-MM"
  const [year, setYear] = useState(""); // "YYYY"
  const [fromDate, setFromDate] = useState(""); // "YYYY-MM-DD"
  const [toDate, setToDate] = useState(""); // "YYYY-MM-DD"

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = String(now.getFullYear());

  // Resolve the chosen mode into an inclusive "YYYY-MM-DD" window
  const dateRange = useMemo(() => {
    if (dateMode === "month" && month) {
      const [y, m] = month.split("-");
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      return {
        from: `${month}-01`,
        to: `${month}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    if (dateMode === "year" && year) {
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
    if (dateMode === "custom" && (fromDate || toDate)) {
      return { from: fromDate || null, to: toDate || null };
    }
    return { from: null, to: null };
  }, [dateMode, month, year, fromDate, toDate]);

  const dateFilterActive = !!(dateRange.from || dateRange.to);

  const pickMode = (mode) => {
    setDateMode(mode);
    if (mode === "month" && !month) setMonth(currentMonth);
    if (mode === "year" && !year) setYear(currentYear);
  };

  // Rebuild the linked subtree from the FULL account list so an active search
  // on the page can't hide any of the account's links from this report.
  const children = useMemo(() => {
    if (!account) return [];
    if (!allAccounts.length) return account.children ?? [];

    const byParent = {};
    allAccounts.forEach((a) => {
      if (!a.nParentAccountId) return;
      (byParent[a.nParentAccountId] ||= []).push(a);
    });

    const seen = new Set();
    const walk = (parentId, depth) =>
      (byParent[parentId] ?? []).map((c) => {
        if (seen.has(c.id) || depth > 50) return { ...c, children: [] };
        seen.add(c.id);
        return { ...c, children: walk(c.id, depth + 1) };
      });

    return walk(account.id, 0);
  }, [account, allAccounts]);

  const flat = useMemo(() => flatten(children), [children]);
  const total = flat.length;

  // Only entries whose JEV is still ACTIVE (jevActiveKey, i.e. cStatus "A")
  // AND falls inside the chosen date window belong in the report — cancelled /
  // pending JEVs are excluded, including as counterpart lines.
  const { byJev, byAccount: entriesByAccount } = useMemo(() => {
    const activeStatus = String(jevActiveKey ?? "").trim() || "A";
    const { from, to } = dateRange;

    // jev.dtOccur is a MySQL datetime → compare its "YYYY-MM-DD" prefix, so
    // no timezone shifting can move an entry across the range edge.
    const dayOf = (e) => String(e?.jev?.dtOccur ?? "").slice(0, 10);
    const inRange = (day) => {
      if (!from && !to) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    };

    const activeEntries = (jevEntries || []).filter((e) => {
      if (String(e?.jev?.cStatus ?? "").trim() !== activeStatus) return false;
      return inRange(dayOf(e));
    });
    return groupEntries(activeEntries);
  }, [jevEntries, jevActiveKey, dateRange]);

  // Entries that actually belong to THIS report (the account + its links)
  const reportEntryCount = useMemo(() => {
    let n = entriesByAccount[account?.id]?.length ?? 0;
    flat.forEach((x) => {
      n += entriesByAccount[x.node.id]?.length ?? 0;
    });
    return n;
  }, [entriesByAccount, account, flat]);

  const nameById = useMemo(() => {
    const map = {};
    allAccounts.forEach((a) => {
      map[a.id] = a.accountName;
    });
    if (account) map[account.id] = account.accountName;
    return map;
  }, [allAccounts, account]);

  useEffect(() => {
    if (open) return;
    setSearch("");
    setCollapsedIds(new Set());
    setDateMode("all");
    setMonth("");
    setYear("");
    setFromDate("");
    setToDate("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // While a search is active every match stays visible — a folded branch
    // must never swallow a result.
    if (q) {
      return flat.filter((x) =>
        String(x.node.accountName ?? "")
          .toLowerCase()
          .includes(q),
      );
    }

    // Otherwise drop everything sitting beneath a collapsed row. `flat` is a
    // depth-first walk (parent before its children), so a stack of the still
    // open collapsed depths is enough to skip a whole subtree at once.
    const openBelow = [];
    return flat.filter((x) => {
      while (openBelow.length && x.depth <= openBelow[openBelow.length - 1])
        openBelow.pop();
      const visible = openBelow.length === 0;
      if (collapsedIds.has(rowKeyOf(x))) openBelow.push(x.depth);
      return visible;
    });
  }, [flat, search, collapsedIds]);

  // A row can fold only when something is drawn beneath it: linked accounts
  // and/or its own entry block.
  const isFoldable = ({ node }) =>
    (node.children?.length ?? 0) > 0 ||
    (entriesByAccount[node.id]?.length ?? 0) > 0;

  // Header toggle: "Collapse all" while anything is still showing beneath a
  // row, "Expand all" once every nested account and entry block is folded.
  const foldableRows = flat.filter(isFoldable);
  const somethingShown = filtered.some(
    (x) =>
      x.depth > 0 ||
      (!collapsedIds.has(rowKeyOf(x)) &&
        (entriesByAccount[x.node.id]?.length ?? 0) > 0),
  );
  const allCollapsed = foldableRows.length > 0 && !somethingShown;

  // Header controls: fold / unfold the whole tree at once. Marking every row
  // key is safe — rows with nothing beneath them simply don't render a toggle.
  const collapseAll = () => setCollapsedIds(new Set(flat.map(rowKeyOf)));
  const expandAll = () => setCollapsedIds(new Set());

  // Shared styling for the date-filter fields (matches the search input)
  const fieldSx = {
    height: 30,
    px: 0.9,
    borderRadius: "7px",
    border: `1px solid ${colors.border}`,
    background: colors.inputBg,
    color: colors.gray.pri,
    fontSize: "0.72rem",
    outline: "none",
    fontFamily: "inherit",
    "&:focus": { borderColor: colors.blue.text },
  };

  // Compact pills in the list header (Collapse all / Expand all)
  const headerBtnSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.2,
    px: 0.7,
    py: 0.3,
    borderRadius: "999px",
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.gray.sec,
    fontSize: "0.6rem",
    fontWeight: 600,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "inherit",
    "&:hover": {
      background: colors.hoverBg,
      borderColor: colors.blue.border,
      color: colors.blue.text,
    },
  };

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Account Report"
      subTitle={account?.accountName ? `${account.accountName}` : ""}
      showSave={false}
      cancelLabel="Close"
      width={{ xs: "90%", sm: 520, md: 640 }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {/* ── Account being reported ──────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.9,
            borderRadius: "8px",
            border: `1px solid ${colors.violet.border}`,
            background: colors.violet.bg,
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AccountBalanceOutlined
              sx={{ fontSize: "0.85rem", color: colors.violet.text }}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  color: colors.violet.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ACCOUNT
              </Typography>
              <Box
                component="span"
                title={`${total} linked account${total === 1 ? "" : "s"}`}
                sx={{
                  px: 0.6,
                  py: 0.1,
                  borderRadius: "50px",
                  background: "rgba(255,255,255,0.18)",
                  border: "0.5px solid rgba(255,255,255,0.28)",
                  color: colors.violet.text,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                }}
              >
                {`${total} Linked Account${total === 1 ? "" : "s"}`}
              </Box>
            </Box>
            <Typography
              title={account?.accountName}
              sx={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: colors.gray.pri,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {account?.accountName ?? "—"}
            </Typography>
          </Box>
        </Box>

        {/* ── Date filter (jev.dtOccur) ───────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "wrap",
            px: 1,
            py: 0.75,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            background: colors.mutedBg,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: colors.gray.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Filter Date
          </Typography>

          <Box sx={{ display: "flex", gap: 0.4 }}>
            {DATE_MODES.map((m) => {
              const active = dateMode === m.value;
              return (
                <Box
                  key={m.value}
                  component="button"
                  type="button"
                  onClick={() => pickMode(m.value)}
                  sx={{
                    px: 0.9,
                    py: 0.3,
                    borderRadius: "6px",
                    border: `1px solid ${active ? colors.blue.border : colors.border}`,
                    background: active ? colors.blue.bg : "transparent",
                    color: active ? colors.blue.text : colors.gray.sec,
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    lineHeight: 1.4,
                    cursor: "pointer",
                    "&:hover": {
                      background: active ? colors.blue.bg : colors.hoverBg,
                    },
                  }}
                >
                  {m.label}
                </Box>
              );
            })}
          </Box>

          {dateMode === "month" && (
            <Box
              component="input"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Month"
              sx={fieldSx}
            />
          )}

          {dateMode === "year" && (
            <Box
              component="input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              min="1900"
              max="2999"
              aria-label="Year"
              sx={{ ...fieldSx, width: 84 }}
            />
          )}

          {dateMode === "custom" && (
            <>
              <Box
                component="input"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
                sx={fieldSx}
              />
              <Typography
                sx={{ fontSize: "0.62rem", color: colors.gray.muted }}
              >
                to
              </Typography>
              <Box
                component="input"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
                sx={fieldSx}
              />
            </>
          )}

          <Box
            sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}
          >
            {dateFilterActive && reportEntryCount === 0 && (
              <>
                <LinkOutlined
                  sx={{ fontSize: "0.75rem", color: colors.gray.muted }}
                />
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: colors.red.text,
                  }}
                >
                  No JEV entries in range
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {entriesByAccount[account?.id]?.length > 0 && (
          <EntryBranch
            entries={entriesByAccount[account.id]}
            colors={colors}
            byJev={byJev}
            nameById={nameById}
            jevTypeOptions={jevTypeOptions}
            // left edge = centre of the 26px icon (1px border + 10px padding + 13px)
            sx={{ ml: "24px", pb: 0.5, pr: 1.25 }}
          />
        )}

        {total === 0 ? (
          <Box
            sx={{
              py: 5,
              px: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              textAlign: "center",
              border: `1px dashed ${colors.border}`,
              borderRadius: "10px",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: colors.mutedBg,
                border: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.gray.muted,
              }}
            >
              <FolderOffOutlined sx={{ fontSize: "1.1rem" }} />
            </Box>
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: colors.gray.pri,
              }}
            >
              No linked accounts
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: colors.gray.sec }}>
              {account?.accountName
                ? `“${account.accountName}” has no accounts linked to it yet.`
                : "This account has no accounts linked to it yet."}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* ── Search + count ────────────────────────────────── */}
            <Box
              sx={{
                px: 1.25,
                py: 1,
                bgcolor: colors.headerBg,
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "7px",
                  px: 1,
                  height: 32,
                }}
              >
                <SearchOutlined
                  sx={{ fontSize: "0.85rem", color: colors.gray.muted }}
                />
                <Box
                  component="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search linked accounts…"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "0.75rem",
                    color: colors.gray.pri,
                    "::placeholder": { color: colors.gray.muted },
                  }}
                />
              </Box>

              <Box
                component="button"
                type="button"
                onClick={allCollapsed ? expandAll : collapseAll}
                aria-label={allCollapsed ? "Expand all" : "Collapse all"}
                title={
                  allCollapsed
                    ? "Expand every linked account and show all entries"
                    : "Collapse every linked account and hide all entries"
                }
                sx={headerBtnSx}
              >
                {allCollapsed ? (
                  <ExpandMore sx={{ fontSize: "0.75rem" }} />
                ) : (
                  <ExpandLess sx={{ fontSize: "0.75rem" }} />
                )}
                {allCollapsed ? "Expand all" : "Collapse all"}
              </Box>
            </Box>

            {/* ── Linked accounts ───────────────────────────────── */}
            {filtered.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography
                  sx={{ fontSize: "0.72rem", color: colors.gray.muted }}
                >
                  No linked accounts match “{search.trim()}”
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 340, overflowY: "auto" }}>
                {filtered.map(({ node, depth }, i) => {
                  const typeMeta = TYPE_META[node.cAccountType];
                  const isSynced = !!(node.nClientId || node.nSupplierId);
                  const kidCount = node.children?.length ?? 0;
                  const rowKey = rowKeyOf({ node, depth });
                  const isCollapsed = collapsedIds.has(rowKey);
                  const entryCount = entriesByAccount[node.id]?.length ?? 0;
                  const foldable = isFoldable({ node, depth });
                  // Solid separator on top of this account row when the row
                  // above it ends with a VISIBLE entry block — keeps each
                  // account's entries closed before the next account starts,
                  // and never stacks a line under a folded row.
                  const prev = i > 0 ? filtered[i - 1] : null;
                  const prevHadEntries =
                    !!prev &&
                    !collapsedIds.has(rowKeyOf(prev)) &&
                    (entriesByAccount[prev.node.id]?.length ?? 0) > 0;
                  return (
                    <Box key={rowKey}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.25,
                          py: 0.75,
                          pl: 1.25 + depth * 2,
                          background: "transparent",
                          borderTop: prevHadEntries
                            ? `1px solid ${colors.divider}`
                            : "none",
                          borderBottom: `1px solid ${colors.divider}`,
                          transition: "background .15s",
                          "&:hover": { background: colors.hoverBg },
                        }}
                      >
                        <Box
                          sx={{
                            width: depth === 0 ? 26 : 22,
                            height: depth === 0 ? 26 : 22,
                            borderRadius: "6px",
                            background: colors.blue.bg,
                            border: `1px solid ${colors.blue.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <AccountBalanceOutlined
                            sx={{
                              fontSize: depth === 0 ? "0.75rem" : "0.68rem",
                              color: colors.blue.text,
                            }}
                          />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.6,
                              minWidth: 0,
                            }}
                          >
                            <Typography
                              title={node.accountName}
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: colors.gray.pri,
                                lineHeight: 1.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                              }}
                            >
                              {node.accountName}
                            </Typography>
                            {typeMeta && (
                              <Chip tone={typeMeta.tone} colors={colors}>
                                {typeMeta.label}
                              </Chip>
                            )}
                            {isSynced && (
                              <Chip
                                tone="blue"
                                colors={colors}
                                icon={
                                  <LinkOutlined sx={{ fontSize: "0.65rem" }} />
                                }
                              >
                                Synced
                              </Chip>
                            )}
                          </Box>
                          {(kidCount > 0 || entryCount > 0) && (
                            <Typography
                              sx={{
                                fontSize: "0.58rem",
                                color: colors.gray.sec,
                                mt: 0.15,
                              }}
                            >
                              {[
                                kidCount > 0
                                  ? `${kidCount} linked account${kidCount === 1 ? "" : "s"}`
                                  : "",
                                entryCount > 0
                                  ? `${entryCount} entr${entryCount === 1 ? "y" : "ies"}`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Typography>
                          )}
                        </Box>

                        {foldable && (
                          <Box
                            component="button"
                            type="button"
                            onClick={() => toggleRow(rowKey)}
                            aria-expanded={!isCollapsed}
                            aria-label={
                              isCollapsed
                                ? `Show accounts and entries under ${node.accountName}`
                                : `Hide accounts and entries under ${node.accountName}`
                            }
                            title={
                              isCollapsed
                                ? "Show linked accounts and entries"
                                : "Hide linked accounts and entries"
                            }
                            sx={{
                              flexShrink: 0,
                              width: 20,
                              height: 20,
                              p: 0,
                              lineHeight: 1,
                              borderRadius: "50%",
                              border: `1px solid ${isCollapsed ? colors.blue.border : colors.border}`,
                              background: isCollapsed
                                ? colors.blue.bg
                                : colors.mutedBg,
                              color: isCollapsed
                                ? colors.blue.text
                                : colors.gray.sec,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "background .15s",
                              "&:hover": {
                                background: colors.hoverBg,
                                borderColor: colors.blue.border,
                                color: colors.blue.text,
                              },
                            }}
                          >
                            {isCollapsed ? (
                              <ExpandLess sx={{ fontSize: "0.8rem" }} />
                            ) : (
                              <ExpandMore sx={{ fontSize: "0.8rem" }} />
                            )}
                          </Box>
                        )}
                      </Box>

                      {!isCollapsed && entryCount > 0 && (
                        <EntryBranch
                          entries={entriesByAccount[node.id]}
                          colors={colors}
                          byJev={byJev}
                          nameById={nameById}
                          jevTypeOptions={jevTypeOptions}
                          sx={{
                            // left edge = centre of the account icon:
                            // row padding (1.25 + depth*2 → 10 + 16d px) + half the icon
                            ml: `${10 + depth * 16 + (depth === 0 ? 13 : 11)}px`,
                            pb: 0.5,
                            pr: 1.25,
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ModalContainer>
  );
}

export default AccountReportModal;
