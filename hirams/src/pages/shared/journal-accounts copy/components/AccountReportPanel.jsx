import React, { useMemo, useState } from "react";
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
import FilterDate from "../../../../components/ui/form/FilterDate";

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

  // REPLACE the JevEntryLine grid section (Col 2 and Col 3 swapped: amount now
  // in the middle, date now on the right)
  return (
    <Box
      sx={{
        // 3 columns: accounts (wide, left) · amount (centre) · dtOccur (right)
        display: "grid",
        gridTemplateColumns: "2fr minmax(90px, auto) minmax(96px, auto)",
        alignItems: "center",
        gap: 0.5,
        py: 0.45,
        px: 0.5,
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

      {/* Col 2 — amount */}
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

      {/* Col 3 — dtOccur, right aligned */}
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 500,
          color: colors.gray.sec,
          textAlign: "right",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={String(entry?.jev?.dtOccur ?? "")}
      >
        {formatDay(entry?.jev?.dtOccur)}
      </Typography>
    </Box>
  );
};

// Entries hanging beneath an account. Each row starts with a tree dash
// (├── / └──) whose stem sits on the centre of that account's icon and
// points right toward the entry — there is no vertical rule on the left.
// REPLACE EntryBranch — add a separator between entries and fix row margins
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
            gap: 0.5,
            pl: 0.5,
            borderBottom: isLast ? "none" : `1px dashed ${colors.divider}`,
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

function AccountReportPanel({
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

  // ── Date filter — driven by <FilterDate /> in the list header, which
  // reports the resolved inclusive window used to filter jev.dtOccur ──────
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const dateFilterActive = !!(dateRange.from || dateRange.to);

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
  // Net balance per account = sum of its own filtered entries + all descendants'.
  // Cached bottom-up so each id is computed once regardless of how many rows ask for it.
  const balanceById = useMemo(() => {
    const cache = {};
    const compute = (node) => {
      if (cache[node.id] !== undefined) return cache[node.id];
      let net = (entriesByAccount[node.id] || []).reduce(
        (sum, e) => sum + (Number(e.dAmount) || 0),
        0,
      );
      (node.children || []).forEach((c) => {
        net += compute(c);
      });
      cache[node.id] = net;
      return net;
    };
    if (account) compute({ id: account.id, children });
    flat.forEach((x) => compute(x.node));
    return cache;
  }, [account, children, flat, entriesByAccount]);
  // A node counts as "fund" if it or any ancestor has bIsFund true.
  const fundIds = useMemo(() => {
    const ids = new Set();
    const walk = (node, inherited) => {
      const isFund = inherited || !!node.bIsFund;
      if (isFund) ids.add(node.id);
      (node.children || []).forEach((c) => walk(c, isFund));
    };
    if (account) walk({ ...account, children }, false);
    return ids;
  }, [account, children]);
  const formatBalance = (net) => {
    const isNeg = net < 0;
    const value = Math.abs(net).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    });
    return { text: `${isNeg ? "-" : ""}${value}`, isNeg };
  };
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

  // NOTE: filters/collapse state start fresh on mount — the parent unmounts
  // this panel whenever the report is closed, so no reset effect is needed.

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

  // Shown inside <FilterDate />'s row when the chosen window matches nothing
  const rangeHint =
    dateFilterActive && reportEntryCount === 0 ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <LinkOutlined sx={{ fontSize: "0.75rem", color: colors.gray.muted }} />
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: colors.red.text,
            whiteSpace: "nowrap",
          }}
        >
          No JEV entries in range
        </Typography>
      </Box>
    ) : null;

  return (
    <>
      {/* ── Report body ──────────────────────────────────────────── */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {/* ── Account being reported ──────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 1.25,
            py: 0.9,
            borderRadius: "8px",
            border: `1px solid ${colors.violet.border}`,
            background: colors.violet.bg,
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
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
                  {account?.accountName ?? "—"}
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
            </Box>
          </Box>

          {fundIds.has(account?.id) &&
            (() => {
              const { text, isNeg } = formatBalance(
                balanceById[account.id] ?? 0,
              );
              return (
                <Box
                  component="span"
                  sx={{
                    px: 0.8,
                    py: 0.3,
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.9)",
                    border: "0.5px solid rgba(255,255,255,0.5)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    color: isNeg ? colors.red.text : colors.green.text,
                  }}
                >
                  {`Balance: ${text}`}
                </Box>
              );
            })()}
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
            {/* ── Search + date filter ─────────────────────────── */}
            <Box
              sx={{
                px: 1.25,
                py: 1,
                bgcolor: colors.headerBg,
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.75,
              }}
            >
              <Box
                sx={{
                  flex: "1 1 160px",
                  minWidth: 160,
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

              <FilterDate onChange={setDateRange} hint={rangeHint} />

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
              <Box sx={{ maxHeight: "65vh", overflowY: "auto" }}>
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
                        {fundIds.has(node.id) &&
                          (() => {
                            const { text, isNeg } = formatBalance(
                              balanceById[node.id] ?? 0,
                            );
                            return (
                              <Typography
                                sx={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: isNeg
                                    ? colors.red.text
                                    : colors.green.text,
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                  mr: 0.5,
                                }}
                              >
                                {text}
                              </Typography>
                            );
                          })()}

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
    </>
  );
}

export default AccountReportPanel;
