import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Collapse, useTheme } from "@mui/material";
import {
  Inventory2Outlined,
  StoreOutlined,
  PersonOutlined,
  BusinessOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  TagOutlined,
  MoveToInboxOutlined,
  OutputOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { fmtDate, fmtPHP } from "../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../utils/style/getThemeColors.js";
import JevAPI from "../../../../api/endpoints/jev.api.js";
import useKeysLabels from "../../../../hooks/useKeysLabels.js";
import JevEntriesViewModal from "../../jev/modal/JevEntriesViewModal.jsx";

// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — pulls ONLY tokens THIS component actually uses
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  // slate — structural surfaces
  border: c.slate.border,
  borderRow: c.slate.borderRow,
  divider: c.slate.divider,
  itemHover: c.slate.itemHover,
  outerBg: c.slate.outerBg,
  btnBg: c.slate.btnBg,
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  summaryBg: c.slate.summaryBg,
  summaryBorder: c.slate.summaryBorder,
  cardBg: c.slate.btnBg,
  shadow: "0 1px 2px rgba(0,0,0,0.05)",
  // gray — text hierarchy
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  // blue — transaction link
  blueTextDark: c.blue.textDark,
  // JEV strip — number / type / status chip
  purple: { bg: c.purple.bg, border: c.purple.border, text: c.purple.text },
  green: { bg: c.green.bg, border: c.green.border, text: c.green.text },
  red: { bg: c.red.bg, border: c.red.border, text: c.red.text },
  jevCardBg: c.slate.itemHeaderBg,
  // accents (kept functional for status)
  received: {
    color: c.blue.textDark,
    bg: c.blue.bg,
    border: c.blue.border,
    dot: c.blue.text,
  },
  delivered: {
    color: c.green.text,
    bg: c.green.bg,
    border: c.green.border,
    dot: c.green.paid,
  },
  pending: {
    color: c.amber.warnText,
    bg: c.amber.warnBg,
    border: c.amber.warnBorder,
    dot: c.amber.text,
  },
  cancelled: {
    color: c.red.textDark,
    bg: c.red.bg,
    border: c.red.border,
    dot: c.red.text,
  },
});

// ── Sub-components ──────────────────────────────────────────────────────────
const SectionLabel = ({ children, colors }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
    <Typography
      sx={{
        fontSize: "0.55rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color: colors.textMuted,
      }}
    >
      {children}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: colors.divider }} />
  </Box>
);

const InfoRow = ({ icon, label, value, valueColor, colors }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1,
      py: 0.75,
      borderBottom: `1px solid ${colors.borderRow}`,
      "&:last-child": { borderBottom: "none" },
    }}
  >
    <Box sx={{ color: colors.textMuted, mt: 0.1, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.52rem",
          fontWeight: 700,
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          lineHeight: 1,
          mb: 0.3,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.67rem",
          fontWeight: 600,
          color: valueColor || colors.textPrimary,
          lineHeight: 1.3,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const TwoCol = ({ children }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
    {children}
  </Box>
);

const SerialChip = ({ sn, accent }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.4,
      px: 0.75,
      py: 0.3,
      borderRadius: "6px",
      background: accent.bg,
      border: `1px solid ${accent.border}`,
    }}
  >
    <TagOutlined sx={{ fontSize: "0.55rem", color: accent.color }} />
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 700,
        color: accent.color,
        lineHeight: 1,
        fontFamily: "monospace",
        letterSpacing: "0.02em",
      }}
    >
      {sn}
    </Typography>
  </Box>
);

const SerialSection = ({
  title,
  serials = [],
  accent,
  emptyText,
  icon,
  colors,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `1px solid ${accent.border}`,
        overflow: "hidden",
        mb: 1,
      }}
    >
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          background: accent.bg,
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.15s ease",
          "&:hover": { bgcolor: colors.itemHover },
        }}
      >
        <Box sx={{ color: accent.color, display: "flex" }}>{icon}</Box>
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: accent.color,
            flex: 1,
            lineHeight: 1,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            px: 0.5,
            py: 0.15,
            borderRadius: "4px",
            background: colors.outerBg,
            border: `1px solid ${accent.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 700,
              color: accent.color,
              lineHeight: 1,
            }}
          >
            {serials.length}
          </Typography>
        </Box>
        {expanded ? (
          <ExpandLessOutlined
            sx={{ fontSize: "0.8rem", color: accent.color }}
          />
        ) : (
          <ExpandMoreOutlined
            sx={{ fontSize: "0.8rem", color: accent.color }}
          />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            px: 1.25,
            py: serials.length ? 1 : 0.75,
            background: colors.btnBg,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {serials.length > 0 ? (
            serials.map((sn) => <SerialChip key={sn} sn={sn} accent={accent} />)
          ) : (
            <Typography
              sx={{
                fontSize: "0.6rem",
                color: colors.textMuted,
                fontStyle: "italic",
              }}
            >
              {emptyText}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

// Status chip of the JEV strip — same pill the Pending group view and the
// voucher page use for a JEV row.
const JevStatusChip = ({ label, tint }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 0.75,
      py: 0.35,
      borderRadius: "99px",
      background: tint.bg,
      border: `1px solid ${tint.border}`,
      flexShrink: 0,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.55rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: tint.text,
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>
  </Box>
);

// ── JEV header strip ────────────────────────────────────────────────
// Receipt icon · clickable JEV number · type label · status chip — the
// IDENTITY of the Journal Entry Voucher (JV2026-0059 / Received Purchases
// / Active), without the entries panel below it. The number opens the
// same JEV viewer the Account Report's "JEV No." column opens.
const JevHeader = ({ jev, jev_types, jev_status, tint, colors, onOpen }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 1,
      borderRadius: "10px",
      border: `0.5px solid ${colors.border}`,
      background: colors.jevCardBg,
    }}
  >
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "7px",
        background: colors.purple.bg,
        border: `0.5px solid ${colors.purple.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ReceiptLongOutlined
        sx={{ fontSize: "0.85rem", color: colors.purple.text }}
      />
    </Box>

    <Box sx={{ flex: 1, minWidth: 0 }}>
      {jev?.strJEVNumber ? (
        <Box
          component="button"
          type="button"
          onClick={() => onOpen?.(jev)}
          title={`Open JEV ${jev.strJEVNumber}`}
          aria-label={`View entries of JEV ${jev.strJEVNumber}`}
          sx={{
            p: 0,
            m: 0,
            display: "block",
            textAlign: "left",
            width: "100%",
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: "0.7rem",
            fontWeight: 700,
            lineHeight: 1.3,
            color: colors.blueTextDark,
            wordBreak: "break-word",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
            "&:focus-visible": {
              outline: "none",
              textDecoration: "underline",
            },
          }}
        >
          {jev.strJEVNumber}
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: colors.textPrimary,
            lineHeight: 1.3,
          }}
        >
          —
        </Typography>
      )}
      <Typography
        sx={{
          fontSize: "0.56rem",
          color: colors.textMuted,
          mt: 0.1,
          lineHeight: 1.3,
        }}
      >
        {jev_types?.[jev?.cJEVLinkType] ?? jev?.cJEVLinkType ?? "—"}
      </Typography>
    </Box>

    <JevStatusChip
      tint={tint}
      label={jev_status?.[jev?.cStatus] ?? jev?.cStatus ?? "—"}
    />
  </Box>
);

// Dashed fallback under the "Journal Entry Voucher" label — same shell the
// Pending group view uses when there is no JEV to show yet.
const JevEmptyBox = ({ colors, message }) => (
  <Box
    sx={{
      mb: 1.5,
      py: 2,
      textAlign: "center",
      fontSize: "0.65rem",
      fontStyle: "italic",
      color: colors.textSecondary,
      border: `1px dashed ${colors.border}`,
      borderRadius: "10px",
    }}
  >
    {message}
  </Box>
);

const DarkSummary = ({ item, accent, colors }) => {
  const p = item?.purchaseOption;
  const qty = Math.abs(item?.nQuantity ?? 0);
  const unitPrice = Number(p?.dUnitPrice ?? 0);
  const total = qty * unitPrice;

  return (
    <Box
      sx={{
        background: colors.summaryBg,
        border: `1px solid ${colors.summaryBorder}`,
        borderRadius: "10px",
        p: 1.25,
        mb: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "8px",
            background: colors.mutedBg,
            border: `1px solid ${colors.mutedBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Inventory2Outlined
            sx={{ fontSize: "0.9rem", color: colors.textMuted }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: colors.textPrimary,
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}
          >
            {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ") || "—"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.6rem",
              color: colors.textSecondary,
              mt: 0.25,
              lineHeight: 1.2,
            }}
          >
            {p?.transaction_item?.strName ?? "—"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.75,
            py: 0.35,
            borderRadius: "99px",
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent.dot,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 700,
              color: accent.color,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {accent.label}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: "1px", background: colors.divider, mb: 1.25 }} />

      <Box
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75 }}
      >
        {[
          { label: "Qty", value: `${qty}`, unit: p?.strUOM ?? "units" },
          { label: "Unit Price", value: fmtPHP(unitPrice), unit: null },
          { label: "Total", value: fmtPHP(total), unit: null, highlight: true },
        ].map(({ label, value, unit, highlight }) => (
          <Box
            key={label}
            sx={{
              background: highlight ? accent.bg : colors.mutedBg,
              border: `1px solid ${highlight ? accent.border : colors.mutedBorder}`,
              borderRadius: "7px",
              px: 0.75,
              py: 0.6,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                lineHeight: 1,
                mb: 0.35,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.67rem",
                fontWeight: 700,
                color: highlight ? accent.color : colors.textPrimary,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
            {unit && (
              <Typography
                sx={{
                  fontSize: "0.5rem",
                  color: colors.textMuted,
                  mt: 0.2,
                  lineHeight: 1,
                }}
              >
                {unit}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ── Main Panel ──────────────────────────────────────────────────────────────
export default function InventoryDetailsPanel({
  item,
  inventoryDeliveredKey,
  inventoryPendingKey,
  inventoryCancelledKey,
  inventoryReceivedLabel,
  inventoryDeliveredLabel,
  inventoryPendingLabel,
  inventoryCancelledLabel,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  // Label maps for the JEV header strip (type + status come from the
  // shared mappings, not from this page's inventory statuses).
  const { jev_types, jev_status, jevPendingKey, jevCancelledKey } =
    useKeysLabels();

  const [serialNumbers, setSerialNumbers] = useState([]);

  // ── The item's Journal Entry Voucher(s) ────────────────────────────
  // nJEVId is stamped on each inventory row when its JEV is created —
  // 'R' (Received Purchases) for received batches, 'D' (Delivered Items)
  // for delivered ones. A Delivered row also came in through the
  // purchase's 'R' JEV, so the API lists EVERY distinct JEV of the whole
  // purchase item in nJEVIds (received first, delivered after); nJEVId
  // stays the first row's own id as a fallback. Only the headers are
  // shown here; the entries panel stays on the Pending group view.
  const jevIdsKey = useMemo(() => {
    const ids = Array.isArray(item?.nJEVIds) ? item.nJEVIds : [];
    const list = ids.length ? ids : item?.nJEVId != null ? [item.nJEVId] : [];
    return [
      ...new Set(list.filter((id) => id != null).map(String)),
    ].join(",");
  }, [item]);

  const [jevs, setJevs] = useState([]);
  const [jevLoading, setJevLoading] = useState(false);

  useEffect(() => {
    if (!jevIdsKey) {
      setJevs([]);
      setJevLoading(false);
      return;
    }
    const ids = jevIdsKey.split(",");
    let alive = true;
    setJevs([]); // never show the previous item's JEVs
    setJevLoading(true);
    Promise.all(
      ids.map((id) =>
        JevAPI.getById(id).catch((err) => {
          console.error(`Failed to fetch JEV ${id}:`, err);
          return null;
        }),
      ),
    )
      .then((list) => {
        if (alive)
          setJevs(list.filter((j) => j && typeof j === "object" && !j.message));
      })
      .finally(() => {
        if (alive) setJevLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [jevIdsKey]);

  const p = item?.purchaseOption;

  // ✅ Determine status → pick accent from local map
  const statusKind =
    item?.cStatus === inventoryDeliveredKey
      ? "delivered"
      : item?.cStatus === inventoryPendingKey
        ? "pending"
        : item?.cStatus === inventoryCancelledKey
          ? "cancelled"
          : "received";

  const STATUS_LABELS = {
    received: inventoryReceivedLabel,
    delivered: inventoryDeliveredLabel,
    pending: inventoryPendingLabel,
    cancelled: inventoryCancelledLabel,
  };
  const accent = {
    ...colors[statusKind],
    label: STATUS_LABELS[statusKind] || "",
  };

  useEffect(() => {
    if (!item) {
      setSerialNumbers([]);
      return;
    }
    setSerialNumbers((item.serialNumbers || []).filter(Boolean));
  }, [item]);

  // Strip tint — Pending is purple, Cancelled red, everything else
  // (Active) green: same rule the JEV rows elsewhere in the app use.
  // Per JEV: a Delivered row can hold one Active and one Pending voucher.
  const jevTintOf = (j) =>
    String(j?.cStatus) === String(jevPendingKey)
      ? colors.purple
      : String(j?.cStatus) === String(jevCancelledKey)
        ? colors.red
        : colors.green;

  // ── JEV viewer ─────────────────────────────────────────────────────
  // Clicking a JEV number opens the same viewer the Account Report's
  // "JEV No." column opens — every entry of that JEV, both sides, plus
  // whichever block its type has (the Items table for R / D). `jevModal`
  // survives closing so the fade-out never blanks the content; only
  // `jevModalOpen` drives visibility.
  const [jevModal, setJevModal] = useState(null);
  const [jevModalOpen, setJevModalOpen] = useState(false);

  const openJevModal = (j) => {
    if (!j?.nJEVId) return;
    setJevModal({
      // Rebuilt WITHOUT `entries` → JevViewPanel fetches them fresh with
      // their journal_account data (same trick the report page uses).
      nJEVId: j.nJEVId,
      strJEVNumber: j.strJEVNumber ?? "",
      dtOccur: j.dtOccur ?? "",
      cStatus: j.cStatus ?? "",
      cJEVLinkType: j.cJEVLinkType ?? "",
    });
    setJevModalOpen(true);
  };

  // "Received Purchases · Sep 15, 2026" — the JEV's type plus its day.
  const jevSubTitle = useMemo(() => {
    if (!jevModal) return "";
    const typeLabel = jev_types?.[jevModal.cJEVLinkType] ?? "";
    const day = jevModal.dtOccur ? fmtDate(jevModal.dtOccur) : "";
    return [typeLabel, day].filter(Boolean).join(" · ");
  }, [jevModal, jev_types]);

  if (!item) return null;

  // No frame / header of its own — the page layout header (title + subtitle)
  // carries the context, and the content runs full width like every other
  // section of the page (no card inset, no centering).
  return (
    <Box>
      <DarkSummary item={item} accent={accent} colors={colors} />

      <SectionLabel colors={colors}>Transaction</SectionLabel>
      <Box
        sx={{
          borderRadius: "8px",
          border: `1px solid ${colors.border}`,
          px: 1.5,
          py: 1,
          mb: 1.5,
          background: colors.mutedBg,
        }}
      >
        <InfoRow
          icon={<BusinessOutlined sx={{ fontSize: "0.75rem" }} />}
          label="Transaction Code"
          value={
            p?.transaction_item?.transaction?.strCode +
            " | " +
            p?.transaction_item?.transaction?.strTitle
          }
          valueColor={colors.blueTextDark}
          colors={colors}
        />

        <TwoCol>
          <InfoRow
            icon={<StoreOutlined sx={{ fontSize: "0.75rem" }} />}
            label="Company"
            value={
              item?.strCompanyNickName ||
              p?.transaction_item?.transaction?.company?.strCompanyNickName
            }
            colors={colors}
          />
          <InfoRow
            icon={<PersonOutlined sx={{ fontSize: "0.75rem" }} />}
            label="Client"
            value={
              item?.strClientNickName ||
              p?.transaction_item?.transaction?.client?.strClientNickName
            }
            colors={colors}
          />
        </TwoCol>
        <TwoCol>
          <InfoRow
            icon={<StoreOutlined sx={{ fontSize: "0.75rem" }} />}
            label="Delivery Date"
            value={fmtDate(p?.transaction_item?.transaction?.dtDelivery)}
            colors={colors}
          />
          <InfoRow
            icon={<PersonOutlined sx={{ fontSize: "0.75rem" }} />}
            label="Supplier"
            value={
              item?.strSupplierNickName ||
              p?.supplier?.strSupplierNickName ||
              p?.supplier?.strSupplierName
            }
            colors={colors}
          />
        </TwoCol>
      </Box>

      <SectionLabel colors={colors}>Serial Numbers</SectionLabel>
      <SerialSection
        title={`${accent.label} Serial Numbers`}
        serials={serialNumbers}
        accent={accent}
        emptyText="No serial numbers recorded."
        icon={
          statusKind === "delivered" ? (
            <OutputOutlined sx={{ fontSize: "0.75rem" }} />
          ) : (
            <MoveToInboxOutlined sx={{ fontSize: "0.75rem" }} />
          )
        }
        colors={colors}
      />

      {/* JOURNAL ENTRY VOUCHER — header rows only (number / type /
          status), never the entries panel: that one stays on the group
          view. A Delivered item lists its Received Purchases JEV AND its
          Delivered Items JEV, one strip each. */}
      <SectionLabel colors={colors}>Journal Entry Voucher</SectionLabel>
      {jevs.length > 0 ? (
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.5 }}
        >
          {jevs.map((j) => (
            <JevHeader
              key={j.nJEVId ?? j.strJEVNumber}
              jev={j}
              jev_types={jev_types}
              jev_status={jev_status}
              tint={jevTintOf(j)}
              colors={colors}
              onOpen={openJevModal}
            />
          ))}
        </Box>
      ) : (
        <JevEmptyBox
          colors={colors}
          message={
            jevLoading
              ? "Loading Journal Entry Voucher…"
              : "No Journal Entry Voucher linked to this item."
          }
        />
      )}

      {/* The whole JEV — the same viewer the Account Report's "JEV No."
          column opens (Items block for R / D, From/To entries always). */}
      <JevEntriesViewModal
        open={jevModalOpen}
        onClose={() => setJevModalOpen(false)}
        jev={jevModal}
        subTitle={jevSubTitle}
      />
    </Box>
  );
}
