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
} from "@mui/icons-material";
import ModalContainer from "../../../../layouts/modal/ModalContainer.jsx";
import { fmtDate, fmtPHP } from "../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../utils/style/getThemeColors.js";


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
  // gray — text hierarchy
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  // blue — transaction link
  blueTextDark: c.blue.textDark,
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


const SerialSection = ({ title, serials = [], accent, emptyText, icon, colors }) => {
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
          sx={{ fontSize: "0.6rem", fontWeight: 700, color: accent.color, flex: 1, lineHeight: 1 }}
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
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: accent.color, lineHeight: 1 }}>
            {serials.length}
          </Typography>
        </Box>
        {expanded ? (
          <ExpandLessOutlined sx={{ fontSize: "0.8rem", color: accent.color }} />
        ) : (
          <ExpandMoreOutlined sx={{ fontSize: "0.8rem", color: accent.color }} />
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
            <Typography sx={{ fontSize: "0.6rem", color: colors.textMuted, fontStyle: "italic" }}>
              {emptyText}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};


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
          <Inventory2Outlined sx={{ fontSize: "0.9rem", color: colors.textMuted }} />
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
          <Typography sx={{ fontSize: "0.6rem", color: colors.textSecondary, mt: 0.25, lineHeight: 1.2 }}>
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
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: accent.dot, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: accent.color, letterSpacing: "0.04em", lineHeight: 1 }}>
            {accent.label}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: "1px", background: colors.divider, mb: 1.25 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75 }}>
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
              sx={{ fontSize: "0.5rem", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1, mb: 0.35 }}
            >
              {label}
            </Typography>
            <Typography sx={{ fontSize: "0.67rem", fontWeight: 700, color: highlight ? accent.color : colors.textPrimary, lineHeight: 1.2 }}>
              {value}
            </Typography>
            {unit && (
              <Typography sx={{ fontSize: "0.5rem", color: colors.textMuted, mt: 0.2, lineHeight: 1 }}>
                {unit}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};


// ── Main Modal ───────────────────────────────────────────────────────────────
export default function InventoryItemInfoModal({
  open,
  onClose,
  item,
  inventoryReceivedKey,
  inventoryDeliveredKey,
  inventoryPendingKey,
  inventoryCancelledKey,
  inventoryReceivedLabel,
  inventoryDeliveredLabel,
  inventoryPendingLabel,
  inventoryCancelledLabel,
}) {
  // ✅ YOUR EXACT PATTERN
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [serialNumbers, setSerialNumbers] = useState([]);
  const [snLoading, setSnLoading] = useState(false);

  const p = item?.purchaseOption;

  // ✅ Determine status → pick accent from local map
  const statusKind =
    item?.cStatus === inventoryDeliveredKey ? "delivered" :
    item?.cStatus === inventoryPendingKey   ? "pending" :
    item?.cStatus === inventoryCancelledKey ? "cancelled" : "received";

  const STATUS_LABELS = {
    received: inventoryReceivedLabel,
    delivered: inventoryDeliveredLabel,
    pending: inventoryPendingLabel,
    cancelled: inventoryCancelledLabel,
  };
  const accent = useMemo(() => ({
    ...colors[statusKind],
    label: STATUS_LABELS[statusKind] || "",
  }), [statusKind, colors]);

  useEffect(() => {
    if (!open || !item) {
      setSerialNumbers([]);
      return;
    }
    setSerialNumbers((item.serialNumbers || []).filter(Boolean));
  }, [open, item]);

  if (!open || !item) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Inventory Item"
      subTitle={
        accent.label
          ? `${accent.label}${p?.strBrand || p?.strModel ? ` / ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}` : ""}`
          : p?.strBrand || p?.strModel
            ? `${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}`
            : ""
      }
      showSave={false}
      showCancel
      cancelLabel="Close"
      onCancel={onClose}
      loading={snLoading}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
              p?.transaction_item?.transaction?.strCode + " | " +
              p?.transaction_item?.transaction?.strTitle
            }
            valueColor={colors.blueTextDark}
            colors={colors}
          />

          <TwoCol>
            <InfoRow
              icon={<StoreOutlined sx={{ fontSize: "0.75rem" }} />}
              label="Company"
              value={item?.strCompanyNickName || p?.transaction_item?.transaction?.company?.strCompanyNickName}
              colors={colors}
            />
            <InfoRow
              icon={<PersonOutlined sx={{ fontSize: "0.75rem" }} />}
              label="Client"
              value={item?.strClientNickName || p?.transaction_item?.transaction?.client?.strClientNickName}
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
              value={item?.strSupplierNickName || p?.supplier?.strSupplierNickName || p?.supplier?.strSupplierName}
              colors={colors}
            />
          </TwoCol>
        </Box>

        <SectionLabel colors={colors}>Serial Numbers</SectionLabel>
        {snLoading ? (
          <Box sx={{ py: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.6rem", color: colors.textMuted }}>
              Loading serial numbers…
            </Typography>
          </Box>
        ) : (
          <SerialSection
            title={`${accent.label} Serial Numbers`}
            serials={serialNumbers}
            accent={accent}
            emptyText="No serial numbers recorded."
            icon={
              statusKind === "delivered"
                ? <OutputOutlined sx={{ fontSize: "0.75rem" }} />
                : <MoveToInboxOutlined sx={{ fontSize: "0.75rem" }} />
            }
            colors={colors}
          />
        )}
      </Box>
    </ModalContainer>
  );
}