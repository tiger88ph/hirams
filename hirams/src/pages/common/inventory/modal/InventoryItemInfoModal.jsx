import React, { useState, useEffect } from "react";
import { Box, Typography, Divider, Collapse } from "@mui/material";
import {
  Inventory2Outlined,
  LocalShippingOutlined,
  StoreOutlined,
  PersonOutlined,
  BusinessOutlined,
  QrCodeOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  TagOutlined,
  ScaleOutlined,
  AttachMoneyOutlined,
  CalendarTodayOutlined,
  MoveToInboxOutlined,
  OutputOutlined,
} from "@mui/icons-material";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import api from "../../../../utils/api/api.js";
import { fmtDateTime } from "../../../../utils/helpers/timeZone.js";

const fmtPHP = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ── Sub-components ────────────────────────────────────────────────────────────

const IconBox = ({
  children,
  bg = "#F3F4F6",
  border = "0.5px solid #E9EAEB",
  size = 32,
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: "8px",
      background: bg,
      border,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </Box>
);

const SectionLabel = ({ children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
    <Typography
      sx={{
        fontSize: "0.55rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color: "#9CA3AF",
      }}
    >
      {children}
    </Typography>
    <Box sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }} />
  </Box>
);

const InfoRow = ({ icon, label, value, valueColor = "#111827" }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1,
      py: 0.75,
      borderBottom: "0.5px solid #F3F4F6",
      "&:last-child": { borderBottom: "none" },
    }}
  >
    <Box sx={{ color: "#9CA3AF", mt: 0.1, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.52rem",
          fontWeight: 700,
          color: "#9CA3AF",
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
          color: valueColor,
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

const SerialChip = ({
  sn,
  color = "#1D4ED8",
  bg = "#EFF6FF",
  border = "#BFDBFE",
}) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.4,
      px: 0.75,
      py: 0.3,
      borderRadius: "5px",
      background: bg,
      border: `0.5px solid ${border}`,
    }}
  >
    <TagOutlined sx={{ fontSize: "0.55rem", color }} />
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 700,
        color,
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
  color,
  bg,
  border,
  emptyText,
  icon,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `0.5px solid ${border}`,
        overflow: "hidden",
        mb: 1,
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          background: bg,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { filter: "brightness(0.97)" },
        }}
      >
        <Box sx={{ color, display: "flex" }}>{icon}</Box>
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color,
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
            background: "rgba(255,255,255,0.6)",
            border: `0.5px solid ${border}`,
          }}
        >
          <Typography
            sx={{ fontSize: "0.55rem", fontWeight: 700, color, lineHeight: 1 }}
          >
            {serials.length}
          </Typography>
        </Box>
        {expanded ? (
          <ExpandLessOutlined sx={{ fontSize: "0.8rem", color }} />
        ) : (
          <ExpandMoreOutlined sx={{ fontSize: "0.8rem", color }} />
        )}
      </Box>

      {/* Serial list */}
      <Collapse in={expanded}>
        <Box
          sx={{
            px: 1.25,
            py: serials.length ? 1 : 0.75,
            background: "#fff",
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {serials.length > 0 ? (
            serials.map((sn) => (
              <SerialChip
                key={sn}
                sn={sn}
                color={color}
                bg={bg}
                border={border}
              />
            ))
          ) : (
            <Typography
              sx={{ fontSize: "0.6rem", color: "#9CA3AF", fontStyle: "italic" }}
            >
              {emptyText}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const DarkSummary = ({ item, isDelivered }) => {
  const p = item?.purchaseOption;
  const qty = Math.abs(item?.nQuantity ?? 0);
  const unitPrice = Number(p?.dUnitPrice ?? 0);
  const total = qty * unitPrice;

  const accent = isDelivered
    ? { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" }
    : { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" };

  return (
    <Box
      sx={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        p: 1.25,
        mb: 1.5,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "8px",
            background: "#f3f4f6",
            border: "0.5px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Inventory2Outlined sx={{ fontSize: "0.9rem", color: "#6b7280" }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}
          >
            {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ") || "—"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.6rem",
              color: "#6b7280",
              mt: 0.25,
              lineHeight: 1.2,
            }}
          >
            {p?.transaction_item?.strName ?? "—"}
          </Typography>
        </Box>

        {/* Status badge */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.75,
            py: 0.35,
            borderRadius: "99px",
            background: accent.bg,
            border: `0.5px solid ${accent.border}`,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 5,
              height: 5,
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
            {isDelivered ? "Delivered" : "Received"}
          </Typography>
        </Box>
      </Box>

      {/* Divider */}
      <Box sx={{ height: "0.5px", background: "#f3f4f6", mb: 1.25 }} />

      {/* Metrics row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75 }}>
        {[
          { label: "Qty", value: `${qty}`, unit: p?.strUOM ?? "units" },
          { label: "Unit Price", value: fmtPHP(unitPrice), unit: null },
          { label: "Total", value: fmtPHP(total), unit: null, highlight: true },
        ].map(({ label, value, unit, highlight }) => (
          <Box
            key={label}
            sx={{
              background: highlight && isDelivered ? "#fffbeb" : "#f9fafb",
              border: `0.5px solid ${highlight && isDelivered ? "#fde68a" : "#e5e7eb"}`,
              borderRadius: "7px",
              px: 0.75,
              py: 0.6,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "#9ca3af",
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
                color: highlight
                  ? isDelivered ? "#b45309" : "#1d4ed8"
                  : "#111827",
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
            {unit && (
              <Typography
                sx={{ fontSize: "0.5rem", color: "#9ca3af", mt: 0.2, lineHeight: 1 }}
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

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function InventoryItemInfoModal({
  open,
  onClose,
  item,
  inventoryStatus,
  deliveredKey,
  receivedKey,
}) {
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [snLoading, setSnLoading] = useState(false);

  const p = item?.purchaseOption;
  const nInventoryId = item?.nInventoryId;
  const deliveredCode = Object.entries(inventoryStatus ?? {}).find(([, v]) =>
    v?.toLowerCase().includes("deliver"),
  )?.[0];

  const isDelivered = item?.cStatus === deliveredCode;
  const statusLabel = inventoryStatus?.[item?.cStatus] ?? "";

  useEffect(() => {
    if (!open || !nInventoryId) {
      setSerialNumbers([]);
      return;
    }

    let cancelled = false;
    setSnLoading(true);

    api
      .get(`serial-numbers?nInventoryId=${nInventoryId}`)
      .then((res) => {
        if (cancelled) return;
        setSerialNumbers(
          (res.serial_numbers || []).map((s) => s.strSerialNumber),
        );
      })
      .catch((err) => console.error("fetchSerialNumbers error:", err))
      .finally(() => {
        if (!cancelled) setSnLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, nInventoryId]);

  if (!open || !item) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Inventory Item"
      subTitle={
        statusLabel
          ? `/ ${statusLabel}${p?.strBrand || p?.strModel ? ` / ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}` : ""}`
          : p?.strBrand || p?.strModel
            ? `/ ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}`
            : ""
      }
      showSave={false}
      showCancel
      cancelLabel="Close"
      onCancel={onClose}
      loading={snLoading}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* ── Summary header ──────────────────────────────────────────────── */}
        <DarkSummary item={item} isDelivered={isDelivered} />

        {/* ── Transaction context ─────────────────────────────────────────── */}
        <SectionLabel>Transaction</SectionLabel>
        <Box
          sx={{
            borderRadius: "8px",
            border: "0.5px solid #E5E7EB",
            px: 1.5,
            mb: 1.5,
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
            valueColor="#1D4ED8"
          />

          <TwoCol>
            <InfoRow
              icon={<StoreOutlined sx={{ fontSize: "0.75rem" }} />}
              label="Company"
              value={
                item?.strCompanyNickName ||
                p?.transaction_item?.transaction?.company?.strCompanyNickName
              }
            />
            <InfoRow
              icon={<PersonOutlined sx={{ fontSize: "0.75rem" }} />}
              label="Client"
              value={
                item?.strClientNickName ||
                p?.transaction_item?.transaction?.client?.strClientNickName
              }
            />
          </TwoCol>
          <TwoCol>
            <InfoRow
              icon={<StoreOutlined sx={{ fontSize: "0.75rem" }} />}
              label="Delivery Date"
              value={fmtDateTime(p?.transaction_item?.transaction?.dtDelivery)}
            />
            <InfoRow
              icon={<PersonOutlined sx={{ fontSize: "0.75rem" }} />}
              label="Supplier"
              value={
                item?.strSupplierNickName ||
                p?.supplier?.strSupplierNickName ||
                p?.supplier?.strSupplierName
              }
            />
          </TwoCol>
        </Box>

        {/* ── Serial Numbers ───────────────────────────────────────────────── */}
        <SectionLabel>Serial Numbers</SectionLabel>

        {snLoading ? (
          <Box sx={{ py: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.6rem", color: "#9CA3AF" }}>
              Loading serial numbers…
            </Typography>
          </Box>
        ) : (
          <SerialSection
            title={
              isDelivered
                ? "Delivered Serial Numbers"
                : "Received Serial Numbers"
            }
            serials={serialNumbers}
            color={isDelivered ? "#15803d" : "#1D4ED8"}
            bg={isDelivered ? "#f0fdf4" : "#EFF6FF"}
            border={isDelivered ? "#86efac" : "#BFDBFE"}
            emptyText="No serial numbers recorded."
            icon={
              isDelivered ? (
                <OutputOutlined sx={{ fontSize: "0.75rem" }} />
              ) : (
                <MoveToInboxOutlined sx={{ fontSize: "0.75rem" }} />
              )
            }
          />
        )}
      </Box>
    </ModalContainer>
  );
}