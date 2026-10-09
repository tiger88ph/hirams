import { useMemo, useState } from "react";
import { Box, Collapse, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  NotificationsOutlined,
  HelpOutline,
  Fullscreen,
  AccountCircleOutlined,
  ArrowForwardOutlined,
  ChevronRightOutlined,
  MailOutline,
  MenuBookOutlined,
  PointOfSaleOutlined,
  LocalShippingOutlined,
  Inventory2Outlined,
  PaymentsOutlined,
  AccountBalanceWalletOutlined,
  GroupsOutlined,
} from "@mui/icons-material";
import PageLayout from "../../components/layouts/page/content-page";
import ContentHeaderStructure from "../../components/ui/structure/ContentHeaderStructure";
import CustomSearchField from "../../components/ui/form/SearchField";
import BaseButton from "../../components/ui/form/BaseButton";
import getThemeColors from "../../utils/style/getThemeColors";
import icons from "../../utils/style/iconFormatStyles";

// ── Local Color Map — only tokens used in this component ──────────────
const useColors = (c) => ({
  border: c.slate.border,
  surface: c.slate.itemHeaderBg,
  blue: { bg: c.blue.bg, border: c.blue.border, text: c.blue.text },
  amber: { bg: c.amber.bg, text: c.amber.text },
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
});

// ── Topics ────────────────────────────────────────────────────────────
// Every section is data, not markup, so the search bar can filter the
// items and the section headers can collapse them without re-plumbing
// the page. `kind` picks the layout — "blocks" renders typed items
// (para / cap / step / role) as blocks in the order they appear, while
// "cards" and "links" render panels — and `text`/`title`/`code` are what
// the search matches against.
const SECTIONS = [
  {
    id: "start",
    title: "Getting started",
    kind: "blocks",
    // Three kinds of item, rendered as blocks in the order they appear:
    //   para — what the system is and why it exists
    //   cap  — a capability, shown as a card under "What it can do"
    //   step — a numbered action under "Where to start"
    // The search filters this one list, so a topic can be narrowed down to
    // just its paragraphs, just its capabilities, or just its steps.
    items: [
      {
        type: "para",
        text: "The Hirams Supply Wholesaling System is the web-based system Hirams Supply runs its wholesale operation on — sales, purchasing, inventory and the accounting behind them, held together in one place instead of scattered spreadsheets, paper vouchers and a separate ledger.",
      },
      {
        type: "para",
        text: "Its purpose is one traceable record from quote to ledger. A price agreed on a transaction becomes a purchase order; the purchase becomes stock and a disbursement voucher; that voucher posts a Journal Entry Voucher into the books. Every step carries who did it and when, so a number can be audited later instead of argued about.",
      },
      {
        type: "para",
        text: "Everyone works from the same data but only sees what their role allows: Management configures the system and reports on it, Finance handles vouchers and payments, Procurement handles purchasing and stock, and Account Officers work their own transactions.",
      },

      {
        type: "cap",
        icon: <PointOfSaleOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Sell and price",
        text: "Quote and price orders on the transaction canvas, reuse saved price sets, add items in bulk, and carry a transaction on to purchase.",
      },
      {
        type: "cap",
        icon: <LocalShippingOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Purchase",
        text: "Order from suppliers, work the purchase and item-purchasing queues, and print the purchase order, delivery receipt and sales invoice.",
      },
      {
        type: "cap",
        icon: <Inventory2Outlined sx={{ fontSize: "0.95rem" }} />,
        title: "Hold stock",
        text: "Receive batches in, deliver them out, and follow quantities as they move from pending to received to delivered.",
      },
      {
        type: "cap",
        icon: <PaymentsOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Pay",
        text: "Raise disbursement vouchers for suppliers and assignees, close or cancel them, mark them paid or unpaid, and print the voucher or the cheque.",
      },
      {
        type: "cap",
        icon: <AccountBalanceWalletOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Keep the books",
        text: "Maintain the chart of accounts, raise, balance and finalize Journal Entry Vouchers, and read the balance of any account.",
      },
      {
        type: "cap",
        icon: <GroupsOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Manage people and setup",
        text: "Clients, suppliers, assignees, users and roles, companies and direct-cost options — with an archive holding everything that has been closed.",
      },

      {
        type: "step",
        text: "Start on the Dashboard — it shows what changed since your last visit.",
      },
      {
        type: "step",
        text: "Pick a module from the sidebar; your role decides which ones you can open.",
      },
      {
        type: "step",
        text: "In any list, use the status tabs and the search field to narrow it down, then click a row to open the full record.",
      },
      {
        type: "step",
        text: "Work from the footer — the buttons follow the record's status: an Active voucher can be Closed or Cancelled, a Closed one can be Marked Paid.",
      },
    ],
  },
  {
    id: "users",
    title: "System users",
    kind: "blocks",
    // `role` items render as a ranked ladder, highest to lowest — the rank
    // is simply the order they appear in. `code` is the role's letter from
    // `user_types` in apiHirams/config/mappings.php; `level` is the short
    // tag on the right of each rung; `sees` is the sidebar/record scope,
    // which is what actually differs between roles.
    items: [
      {
        type: "para",
        text: "Every account carries exactly one role, picked when Management creates the user under Users. It decides which sections of the sidebar open, how far the lists reach (only your own records, your team's, or the whole company) and which footer buttons work — the same record can be read-only for one role and fully actionable for another.",
      },

      {
        type: "role",
        title: "Management",
        code: "M",
        level: "Highest",
        text: "Runs the system. Creates and edits users and roles, companies, direct-cost options and statuses, and works every module like a specialist would: create, close or cancel vouchers, mark them paid, balance and finalize Journal Entry Vouchers. It also holds the override actions nobody else gets — force-finalize and revert a transaction the normal rules would lock.",
        sees: "Every sidebar section — Users, Clients, Suppliers, Assignees, Company, Direct Cost Options, Transactions, Item Purchasing, Archives, Inventory, Vouchers, Journal Entry Vouchers and Journal Accounts — every record in the company, and the System Config entry in the sidebar footer, which appears for Management alone.",
      },
      {
        type: "role",
        title: "General Manager",
        code: "G",
        level: "Oversight",
        text: "Sits in the Management group, so it opens the same menu and sees the whole company's data — every transaction, voucher and JEV — and can review, approve and act on any of them. The one line it does not cross is system setup: the System Config link is Management only, so the General Manager supervises the books rather than configuring the system behind them.",
        sees: "The full Management menu and all records company-wide — everything except System Config.",
      },
      {
        type: "role",
        title: "Finance Officer",
        code: "F",
        level: "Money & ledger",
        text: "Holds the money. Raises disbursement vouchers for suppliers and assignees, closes or cancels them, marks them paid or unpaid and prints the cheque; raises and balances Journal Entry Vouchers and finalizes them into the books; and reads every journal-account balance. Like Management, it is one of only two roles that sees every voucher and every purchase order instead of only its own.",
        sees: "Suppliers, Assignees, Transactions, Item Purchasing, Vouchers, Journal Entry Vouchers and Journal Accounts — company-wide, with no assignment filter.",
      },
      {
        type: "role",
        title: "Procurement Officer TL",
        code: "Y",
        level: "Team leader",
        text: "Leads the procurement team. Does everything a Procurement Officer does, but the queues open to the officers it supervises instead of only its own work, so it can pick up, check and hand back anything the team is buying.",
        sees: "Clients, Transactions, Archives and Inventory — across the whole procurement team, not just its own assignments.",
      },
      {
        type: "role",
        title: "Procurement Officer",
        code: "P",
        level: "Officer",
        text: "Buys. Sets up the draft, the items and the pricing, finalizes a transaction to send it on its way, works the purchase options behind an award, and prints purchase orders, delivery receipts and sales invoices. Money never leaves through this role — the payment paperwork belongs to Finance.",
        sees: "Clients, Transactions, Archives and Inventory — the transactions assigned to it only.",
      },
      {
        type: "role",
        title: "Account Officer TL",
        code: "X",
        level: "Team leader",
        text: "Leads the account officers. On a transaction sitting at For Assignment it is the one that picks the Account Officer, and its archive and hand-off queues open to the whole account-officer team instead of just its own records. Its voucher list shows supplier-type vouchers only — assignee-type vouchers stay with Finance.",
        sees: "Suppliers, Transactions, Item Purchasing, Archives, Inventory and Vouchers — its own work plus the team's archives and hand-offs.",
      },
      {
        type: "role",
        title: "Account Officer",
        code: "A",
        level: "Lowest",
        text: "Works its own book of clients: builds and prices the canvas for their orders, finalizes the stages it owns, follows each transaction through to purchase, and keeps the vouchers assigned to it up to date. It is the narrowest scope in the system — nothing outside what has been handed to it.",
        sees: "Suppliers, Transactions, Item Purchasing, Archives, Inventory and Vouchers — records assigned to it only.",
      },

      {
        type: "para",
        text: "Whatever the role, everyone shares the Dashboard, the header — notifications, help and full screen — the account menu and this Help page. A role can be changed later from Users, and the change takes effect the next time that person logs in.",
      },
    ],
  },
  {
    id: "header",
    title: "The header bar",
    kind: "cards",
    items: [
      {
        icon: <NotificationsOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Notifications",
        text: "The bell shows how many items are unread. Open it to mark items read, clear them, or jump to the full list.",
      },
      {
        icon: <HelpOutline sx={{ fontSize: "0.95rem" }} />,
        title: "Help ( ? )",
        text: "Opens this page from anywhere in the system — no need to hunt through the sidebar.",
      },
      {
        icon: <Fullscreen sx={{ fontSize: "0.95rem" }} />,
        title: "Full screen",
        text: "Fills the whole browser window with the system and hides the browser chrome. Click it again (or press Esc) to come back.",
      },
      {
        icon: <AccountCircleOutlined sx={{ fontSize: "0.95rem" }} />,
        title: "Account menu",
        text: "Your photo and role on the right. Click it for Account Profile, or to log out.",
      },
    ],
  },

  {
    id: "links",
    title: "Where things live",
    kind: "links",
    items: [
      { title: "Dashboard", to: "/dashboard", text: "Activity at a glance." },
      {
        title: "Transactions",
        to: "/transaction",
        text: "Create and track orders.",
      },
      {
        title: "Vouchers",
        to: "/voucher",
        text: "Disbursement vouchers by status.",
      },
      {
        title: "Journal Entry Vouchers",
        to: "/jev",
        text: "Review and finalize JEVs.",
      },
      {
        title: "Inventory",
        to: "/inventory",
        text: "Stock, receipts and deliveries.",
      },
      {
        title: "Journal Accounts",
        to: "/journal-account",
        text: "Chart of accounts and balances.",
      },
    ],
  },
  {
    id: "support",
    title: "Need more help?",
    kind: "links",
    items: [
      {
        title: "System documentation",
        to: "/documentation",
        icon: <MenuBookOutlined sx={{ fontSize: "0.95rem" }} />,
        text: "The long-form guide: what each module is for and how the pieces fit together.",
      },
      {
        title: "Contact the IT team",
        href: "mailto:support@hiramswholesale.com",
        icon: <MailOutline sx={{ fontSize: "0.95rem" }} />,
        text: "Something broken, or a number that looks wrong? Email support@hiramswholesale.com with the page and the record number.",
      },
    ],
  },
];

// What the search bar matches on, per item.
const haystack = (item) =>
  `${item.title ?? ""} ${item.text ?? ""} ${item.sees ?? ""} ${(item.keys ?? []).join(" ")}`.toLowerCase();

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── Match highlight ───────────────────────────────────────────────────
function Highlight({ text, query, colors }) {
  if (!query) return <>{text}</>;
  const parts = String(text).split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Box
            key={i}
            component="mark"
            sx={{
              bgcolor: colors.amber.bg,
              color: colors.amber.text,
              borderRadius: "3px",
              px: 0.25,
            }}
          >
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Content card ──────────────────────────────────────────────────────
function Panel({ icon, title, children, colors, onClick, query }) {
  const body = (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
        {icon && (
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              bgcolor: colors.blue.bg,
              border: `0.5px solid ${colors.blue.border}`,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: colors.gray.textPrimary,
          }}
        >
          <Highlight text={title} query={query} colors={colors} />
        </Typography>
        {onClick && (
          <ArrowForwardOutlined
            sx={{
              fontSize: "0.85rem",
              color: colors.gray.textMuted,
              ml: "auto",
            }}
          />
        )}
      </Box>
      <Typography
        sx={{
          fontSize: "0.68rem",
          lineHeight: 1.55,
          color: colors.gray.textSecondary,
        }}
      >
        <Highlight text={children} query={query} colors={colors} />
      </Typography>
    </>
  );

  const sx = {
    position: "relative",
    display: "block",
    width: "100%",
    textAlign: "left",
    fontFamily: "inherit",
    // A <button> resets these — put the panel's own look back.
    background: colors.surface,
    border: `0.5px solid ${colors.border}`,
    borderLeft: `3px solid ${colors.blue.border}`,
    borderRadius: "8px",
    p: 1.5,
    cursor: onClick ? "pointer" : "default",
    transition: "border-color 0.15s, background 0.15s",
    ...(onClick
      ? { "&:hover": { bgcolor: colors.blue.bg, borderColor: colors.blue.text } }
      : {}),
  };

  return onClick ? (
    <Box component="button" onClick={onClick} sx={sx}>
      {body}
    </Box>
  ) : (
    <Box sx={sx}>{body}</Box>
  );
}


// ── Sub-heading inside a topic ────────────────────────────────────────
function BlockLabel({ children, colors }) {
  return (
    <Typography
      sx={{
        display: "block",
        fontSize: "0.58rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: colors.gray.textMuted,
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

export default function Help() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  // ── Search + open/closed state ───────────────────────────────────────
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({ start: true });

  const q = query.trim().toLowerCase();

  // While searching, every section that still has a hit is forced open and
  // the rest are hidden entirely; with an empty box the hand-picked
  // open/closed state takes over again.
  const sections = useMemo(() => {
    const list = SECTIONS.map((section) => {
      if (!q) return { ...section, hidden: false, hits: section.items.length };
      const titleMatches = section.title.toLowerCase().includes(q);
      const items = section.items.filter(
        (item) => titleMatches || haystack(item).includes(q),
      );
      return { ...section, items, hidden: items.length === 0, hits: items.length };
    });
    return list.filter((section) => !section.hidden);
  }, [q]);

  // While searching, every section that still has a hit opens itself and
  // the rest are hidden entirely. A section the reader has explicitly
  // opened or closed keeps that choice — the search never fights them.
  const isOpen = (id) => {
    const saved = open[id];
    if (saved !== undefined) return saved;
    return q ? true : id === "start" || id === "users";
  };
  const toggle = (id) =>
    setOpen((prev) => ({ ...prev, [id]: !(id in prev ? prev[id] : isOpen(id)) }));

  const handleBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/dashboard");

  // ── Body of a section, by kind ───────────────────────────────────────
  const renderItems = (section) => {
    const { kind, items } = section;

    if (kind === "blocks") {
      // Consecutive items of the same type become one block, so the
      // paragraphs, capability cards, steps and role rungs each keep their
      // own layout — and a search that leaves only one kind behind still
      // reads correctly (its sub-heading comes with it).
      const blocks = [];
      items.forEach((item) => {
        const last = blocks[blocks.length - 1];
        if (last && last.type === item.type) last.items.push(item);
        else blocks.push({ type: item.type, items: [item] });
      });

      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {blocks.map((block, b) => {
            if (block.type === "para") {
              return (
                <Box
                  key={b}
                  sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                >
                  {block.items.map((item, i) => (
                    <Typography
                      key={i}
                      sx={{
                        fontSize: "0.7rem",
                        lineHeight: 1.7,
                        color: colors.gray.textSecondary,
                      }}
                    >
                      <Highlight text={item.text} query={q} colors={colors} />
                    </Typography>
                  ))}
                </Box>
              );
            }

            if (block.type === "cap") {
              return (
                <Box key={b}>
                  <BlockLabel colors={colors}>What it can do</BlockLabel>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 1.5,
                    }}
                  >
                    {block.items.map((item, i) => (
                      <Panel
                        key={i}
                        icon={item.icon}
                        title={item.title}
                        colors={colors}
                        query={q}
                      >
                        {item.text}
                      </Panel>
                    ))}
                  </Box>
                </Box>
              );
            }

            if (block.type === "role") {
              return (
                <Box key={b}>
                  <BlockLabel colors={colors}>Highest to lowest</BlockLabel>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {block.items.map((item, i) => (
                      <Box
                        key={i}
                        sx={{
                          background: colors.surface,
                          border: `0.5px solid ${colors.border}`,
                          borderLeft: `3px solid ${colors.blue.border}`,
                          borderRadius: "8px",
                          p: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            mb: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "99px",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: colors.blue.bg,
                              border: `0.5px solid ${colors.blue.border}`,
                              color: colors.blue.text,
                              fontSize: "0.62rem",
                              fontWeight: 700,
                            }}
                          >
                            {i + 1}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: colors.gray.textPrimary,
                            }}
                          >
                            <Highlight
                              text={item.title}
                              query={q}
                              colors={colors}
                            />
                          </Typography>
                          <Typography
                            sx={{
                              px: 0.5,
                              py: 0.1,
                              borderRadius: "4px",
                              border: `0.5px solid ${colors.border}`,
                              color: colors.gray.textMuted,
                              fontSize: "0.56rem",
                              fontWeight: 700,
                              lineHeight: 1.5,
                            }}
                          >
                            {item.code}
                          </Typography>
                          <Typography
                            sx={{
                              ml: "auto",
                              fontSize: "0.56rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: colors.gray.textMuted,
                            }}
                          >
                            {item.level}
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            lineHeight: 1.6,
                            color: colors.gray.textSecondary,
                            mb: item.sees ? 0.6 : 0,
                          }}
                        >
                          <Highlight text={item.text} query={q} colors={colors} />
                        </Typography>

                        {item.sees && (
                          <Typography
                            sx={{
                              fontSize: "0.64rem",
                              lineHeight: 1.55,
                              color: colors.gray.textMuted,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ fontWeight: 700, mr: 0.5 }}
                            >
                              Sees:
                            </Box>
                            <Highlight
                              text={item.sees}
                              query={q}
                              colors={colors}
                            />
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            }

            if (block.type !== "step") return null;

            return (
              <Box key={b}>
                <BlockLabel colors={colors}>Where to start</BlockLabel>
                <Box
                  component="ol"
                  sx={{
                    pl: 2.2,
                    m: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                  }}
                >
                  {block.items.map((item, i) => (
                    <li key={i}>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          lineHeight: 1.6,
                          color: colors.gray.textSecondary,
                        }}
                      >
                        <Highlight text={item.text} query={q} colors={colors} />
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      );
    }

    // cards + links both render as panels; links just get a target.
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            ...(kind === "links" ? { md: "1fr 1fr 1fr" } : {}),
          },
          gap: 1.5,
        }}
      >
        {items.map((item, i) => (
          <Panel
            key={i}
            icon={item.icon ?? <ArrowForwardOutlined sx={{ fontSize: "0.85rem" }} />}
            title={item.title}
            colors={colors}
            query={q}
            onClick={
              item.to
                ? () => navigate(item.to)
                : item.href
                  ? () => (window.location.href = item.href)
                  : undefined
            }
          >
            {item.text}
          </Panel>
        ))}
      </Box>
    );
  };

  return (
    <PageLayout
      title="Help & Support"
      subtitle="Search it, or open a topic below"
      footerLActions={
        <BaseButton
          label="Back"
          icon={icons.back}
          onClick={handleBack}
          actionColor="cancel"
        />
      }
    >


      {/* ── Search bar ────────────────────────────────────────────── */}
      <Box sx={{ mt: 0.5, mb: 1.25 }}>
        <CustomSearchField
          label="Search help"
          placeholder="e.g. voucher, fullscreen, Enter"
          value={query}
          onChange={setQuery}
        />
      </Box>

      {/* ── Clear search (only while a search is active) ─────────── */}
      {q && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 1.25,
          }}
        >
          <BaseButton
            label="Clear search"
            icon={icons.close}
            size="small"
            actionColor="cancel"
            onClick={() => setQuery("")}
          />
        </Box>
      )}

      {/* ── Topics ────────────────────────────────────────────────── */}
      {sections.length === 0 ? (
        <Box
          sx={{
            py: 4,
            px: 2,
            textAlign: "center",
            border: `1px dashed ${colors.border}`,
            borderRadius: "10px",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: colors.gray.textPrimary,
              mb: 0.5,
            }}
          >
            No results for "{query.trim()}"
          </Typography>
          <Typography
            sx={{ fontSize: "0.68rem", color: colors.gray.textSecondary, mb: 1.5 }}
          >
            Try "voucher", "fullscreen", "Enter" or "inventory".
          </Typography>
          <BaseButton
            label="Clear search"
            icon={icons.close}
            size="small"
            actionColor="cancel"
            onClick={() => setQuery("")}
          />
        </Box>
      ) : (
        // One container: the topic rows sit flush against each other and the
        // outer box draws the only border, so there's no gap between rows.
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            border: `0.5px solid ${colors.border}`,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {sections.map((section, idx) => {
            const expanded = isOpen(section.id);
            return (
              <Box
                key={section.id}
                sx={{
                  borderTop: idx
                    ? `0.5px solid ${colors.border}`
                    : "none",
                }}
              >
                {/* Topic header — click to hide / show its content */}
                <Box
                  component="button"
                  onClick={() => toggle(section.id)}
                  aria-expanded={expanded}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 1,
                    fontFamily: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    bgcolor: colors.surface,
                    border: "none",
                    borderRadius: 0,
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: colors.blue.bg },
                  }}
                >
                  <ChevronRightOutlined
                    sx={{
                      fontSize: 18,
                      color: colors.gray.textMuted,
                      transform: expanded ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: colors.gray.textPrimary,
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Box
                    sx={{
                      ml: "auto",
                      px: 0.75,
                      py: 0.25,
                      borderRadius: "99px",
                      bgcolor: q ? colors.blue.bg : "transparent",
                      border: q ? `1px solid ${colors.blue.border}` : "none",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      color: q ? colors.blue.text : colors.gray.textMuted,
                      lineHeight: 1.4,
                    }}
                  >
                    {q ? `${section.hits} hit${section.hits === 1 ? "" : "s"}` : ""}
                  </Box>
                </Box>

                {/* Content */}
                <Collapse in={expanded} timeout="auto">
                  <Box sx={{ p: 1.5 }}>{renderItems(section)}</Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}
    </PageLayout>
  );
}
