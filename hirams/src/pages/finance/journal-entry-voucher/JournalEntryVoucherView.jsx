import React from "react";
import { Box, Typography, IconButton, Collapse, useTheme } from "@mui/material";
import {
  BadgeOutlined,
  StoreOutlined,
  AccountBalanceOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CloseOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import PageLayout from "../../../layouts/page/content-page";
import { calcTotals } from "./useJournalEntryVoucher";
import { fmtDate, fmtPHP } from "../../../utils/formatters/formatter.js";

import VoucherAPI from "../../../api/endpoints/voucher.api.js";

const groupLogsByVoucherThenAccount = (logs = []) => {
  const byVoucher = new Map();

  logs.forEach((log) => {
    const vKey = log.nJEVId;
    if (!byVoucher.has(vKey)) {
      byVoucher.set(vKey, {
        nJEVId: log.nJEVId,
        strVoucherNumber: log.strVoucherNumber ?? log.strJevLink,
        cJevType: log.cJevType,
        cStatus: log.cStatus,
        dtOccur: log.dtOccur,
        strPayeeName: log.strPayeeName,
        bIsAssigneeType: log.bIsAssigneeType,
        // ── voucher-level details (sparse — only what the log carries) ──
        strPayeeNickName: log.strPayeeNickName ?? log.strPayeeName,
        strTIN: log.strTIN ?? null,
        strAddress: log.strAddress ?? null,
        cVoucherStatus: log.cVoucherStatus ?? null,
        dtCreated: log.dtCreated ?? log.dtOccur,
        // real voucher id so the detail panel can fetch full data reliably
        nVoucherId: log.nVoucherId ?? null,
        accounts: new Map(),
      });
    }

    const voucher = byVoucher.get(vKey);
    const aKey = log.nJournalAccountId;

    if (!voucher.accounts.has(aKey)) {
      voucher.accounts.set(aKey, {
        nJournalAccountId: aKey,
        accountName:
          log.journal_account?.strAccountName ?? log.strAccountName ?? "—",
        entries: [],
      });
    }
    voucher.accounts.get(aKey).entries.push(log);
  });

  return Array.from(byVoucher.values())
    .map((v) => ({ ...v, accounts: Array.from(v.accounts.values()) }))
    .sort((a, b) => new Date(b.dtOccur) - new Date(a.dtOccur));
};

// ── Sub-Components ──────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, logs, loading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const totals = calcTotals(logs);

  const bg = isDark ? "rgba(30,41,59,0.7)" : "#fff";
  const border = isDark ? "rgba(148,163,184,0.35)" : "#E5E7EB";
  const iconBg = isDark ? "rgba(83,74,183,0.25)" : "#EEEDFE";
  const iconColor = isDark ? "#A5B4FC" : "#534AB7";
  const labelColor = isDark ? "#E2E8F0" : "#374151";
  const mutedColor = isDark ? "#94A3B8" : "#9CA3AF";
  const fromColor = isDark ? "#FCA5A5" : "#DC2626";
  const toColor = isDark ? "#86EFAC" : "#16A34A";
  const countColor = labelColor;

  return (
    <Box
      sx={{
        flex: 1,
        px: 1.5,
        py: 1.25,
        borderRadius: "10px",
        background: bg,
        border: `0.5px solid ${border}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.75 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "6px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: "0.75rem", color: iconColor }} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 700,
            color: labelColor,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </Typography>
      </Box>

      {loading ? (
        <Typography sx={{ fontSize: "0.65rem", color: mutedColor }}>
          Loading…
        </Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontSize: "0.55rem", color: mutedColor }}>
              From
            </Typography>
            <Typography
              sx={{ fontSize: "0.72rem", fontWeight: 700, color: fromColor }}
            >
              {fmtPHP(totals.fromTotal)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.55rem", color: mutedColor }}>
              To
            </Typography>
            <Typography
              sx={{ fontSize: "0.72rem", fontWeight: 700, color: toColor }}
            >
              {fmtPHP(totals.toTotal)}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "0.55rem", color: mutedColor }}>
              Entries
            </Typography>
            <Typography
              sx={{ fontSize: "0.72rem", fontWeight: 700, color: countColor }}
            >
              {logs?.length ?? 0}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// A voucher (JEV) group — header + its accounts
const VoucherGroupRow = ({
  voucher,
  isLast,
  defaultOpen,
  jevTypeLabels,
  onSelectVoucher,
  isSelected,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = React.useState(defaultOpen);

  const borderColor = isDark ? "rgba(51,65,85,0.6)" : "#F3F4F6";
  const hoverBg = isDark ? "rgba(51,65,85,0.4)" : "#F3F4F6";
  const assigneeBg = isDark ? "rgba(83,74,183,0.2)" : "#EEEDFE";
  const assigneeBorder = isDark ? "rgba(165,180,252,0.4)" : "#AFA9EC";
  const supplierBg = isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF";
  const supplierBorder = isDark ? "rgba(96,165,250,0.4)" : "#BFDBFE";
  const assigneeIcon = isDark ? "#A5B4FC" : "#534AB7";
  const supplierIcon = isDark ? "#93C5FD" : "#3B82F6";
  const primaryText = isDark ? "#E2E8F0" : "#111827";
  const badgeBg = isDark ? "rgba(51,65,85,0.6)" : "#F3F4F6";
  const badgeBorder = isDark ? "rgba(71,85,105,0.4)" : "#E5E7EB";
  const badgeText = isDark ? "#CBD5E1" : "#6B7280";
  const mutedText = isDark ? "#94A3B8" : "#9CA3AF";
  const fromColor = isDark ? "#FCA5A5" : "#DC2626";
  const toColor = isDark ? "#86EFAC" : "#16A34A";
  const arrowColor = mutedText;
  const arrowBorder = isDark ? "rgba(71,85,105,0.4)" : "#E5E7EB";
  const treeBg = isDark ? "rgba(15,23,42,0.3)" : "#FAFAFA";
  const treeBorder = isDark ? "rgba(51,65,85,0.5)" : "#F3F4F6";
  const selectedRing = isDark ? "#A5B4FC" : "#534AB7";

  const allEntries = voucher.accounts.flatMap((a) => a.entries);
  const totals = calcTotals(allEntries);

  return (
    <Box
      sx={{
        mx: 1,
        my: 0.4,
        borderRadius: "8px",
        border: `0.5px solid ${isSelected ? selectedRing : borderColor}`,
        overflow: "hidden",
        background: isDark ? "rgba(30,41,59,0.6)" : "#fff",
        transition: "border-color 0.15s",
      }}
    >
      <Box
        onClick={() => onSelectVoucher?.(isSelected ? null : voucher)}
        sx={{
          px: 1.25,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexWrap: "nowrap",
          cursor: "pointer",
          background: isDark ? "rgba(83,74,183,0.18)" : "#EEEDFE",
          "&:hover": { background: hoverBg },
          transition: "background 0.15s",
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "6px",
            background: voucher.bIsAssigneeType ? assigneeBg : supplierBg,
            border: `0.5px solid ${voucher.bIsAssigneeType ? assigneeBorder : supplierBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {voucher.bIsAssigneeType ? (
            <BadgeOutlined sx={{ fontSize: "0.7rem", color: assigneeIcon }} />
          ) : (
            <StoreOutlined sx={{ fontSize: "0.7rem", color: supplierIcon }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.35,
            }}
          >
            <Box
              sx={{
                px: 0.4,
                py: 0.02,
                display: "inline-flex",
                borderRadius: "3px",
                background: badgeBg,
                border: `0.5px solid ${badgeBorder}`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.48rem",
                  fontWeight: 700,
                  color: badgeText,
                  lineHeight: 1.3,
                }}
              >
                {jevTypeLabels?.[voucher.cJevType] ?? voucher.cJevType ?? "—"}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 0.4,
                py: 0.02,
                display: "inline-flex",
                borderRadius: "3px",
                background: badgeBg,
                border: `0.5px solid ${badgeBorder}`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.48rem",
                  fontWeight: 700,
                  color: badgeText,
                  lineHeight: 1.3,
                }}
              >
                {voucher.strVoucherNumber ?? "—"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.1 }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: primaryText,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {voucher.strPayeeName ?? "—"}
            </Typography>
            {voucher.cStatus === "P" && (
              <Box
                sx={{
                  px: 0.4,
                  py: 0.02,
                  display: "inline-flex",
                  borderRadius: "3px",
                  background: isDark ? "rgba(251,191,36,0.15)" : "#FEF3C7",
                  border: `0.5px solid ${isDark ? "rgba(251,191,36,0.4)" : "#FDE68A"}`,
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.46rem",
                    fontWeight: 700,
                    color: isDark ? "#FCD34D" : "#B45309",
                    lineHeight: 1.3,
                  }}
                >
                  PENDING JEV
                </Typography>
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: "0.52rem",
              color: mutedText,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              mt: 0.1,
            }}
          >
            {fmtDate(voucher.dtOccur)} · {allEntries.length} entr
            {allEntries.length === 1 ? "y" : "ies"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mr: 1, flexShrink: 0 }}>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
              From
            </Typography>
            <Typography
              sx={{ fontSize: "0.62rem", fontWeight: 700, color: fromColor }}
            >
              {fmtPHP(totals.fromTotal)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
              To
            </Typography>
            <Typography
              sx={{ fontSize: "0.62rem", fontWeight: 700, color: toColor }}
            >
              {fmtPHP(totals.toTotal)}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelectVoucher?.(isSelected ? null : voucher);
          }}
          sx={{
            width: 22,
            height: 22,
            color: isSelected ? selectedRing : arrowColor,
            border: `0.5px solid ${isSelected ? selectedRing : arrowBorder}`,
            borderRadius: "50px",
            p: 0,
            flexShrink: 0,
          }}
        >
          {isSelected ? (
            <KeyboardArrowRight sx={{ fontSize: "0.85rem" }} />
          ) : (
            <KeyboardArrowLeft sx={{ fontSize: "0.85rem" }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

const CompanyTopGroup = ({
  companyName,
  logs,
  isExpanded,
  onToggle,
  jevTypeLabels,
  onSelectVoucher,
  selectedVoucherId,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const borderColor = isDark ? "rgba(51,65,85,0.5)" : "#F3F4F6";
  const hoverBg = isDark ? "rgba(30,41,59,0.4)" : "#F9FAFB";
  const iconBg = isDark ? "rgba(59,90,138,0.2)" : "#F0F4FA";
  const iconBorder = isDark ? "rgba(96,165,250,0.25)" : "#DDE3EE";
  const iconColor = isDark ? "#93C5FD" : "#3B5A8A";
  const titleColor = isDark ? "#E2E8F0" : "#111827";
  const mutedText = isDark ? "#94A3B8" : "#9CA3AF";
  const fromColor = isDark ? "#FCA5A5" : "#DC2626";
  const toColor = isDark ? "#86EFAC" : "#16A34A";
  const arrowBorder = isDark ? "rgba(71,85,105,0.4)" : "#E5E7EB";
  const arrowColor = mutedText;
  const treeBg = isDark ? "rgba(15,23,42,0.3)" : "#FAFAFA";
  const treeBorder = borderColor;

  const companyTotals = React.useMemo(() => calcTotals(logs), [logs]);

  const voucherGroups = React.useMemo(
    () => groupLogsByVoucherThenAccount(logs),
    [logs],
  );

  return (
    <Box
      sx={{
        borderBottom: `0.5px solid ${borderColor}`,
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          "&:hover": { background: hoverBg },
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: iconBg,
            border: `0.5px solid ${iconBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BusinessOutlined sx={{ fontSize: "0.85rem", color: iconColor }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{ fontSize: "0.75rem", fontWeight: 700, color: titleColor }}
          >
            {companyName}
          </Typography>
          <Typography sx={{ fontSize: "0.58rem", color: mutedText, mt: 0.2 }}>
            {isExpanded
              ? `${voucherGroups.length} JEV${voucherGroups.length === 1 ? "" : "s"}`
              : "Click to view entries"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mr: 1 }}>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
              From
            </Typography>
            <Typography
              sx={{ fontSize: "0.65rem", fontWeight: 700, color: fromColor }}
            >
              {fmtPHP(companyTotals.fromTotal)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
              To
            </Typography>
            <Typography
              sx={{ fontSize: "0.65rem", fontWeight: 700, color: toColor }}
            >
              {fmtPHP(companyTotals.toTotal)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          sx={{
            width: 22,
            height: 22,
            color: arrowColor,
            border: `0.5px solid ${arrowBorder}`,
            borderRadius: "50px",
            p: 0,
          }}
        >
          {isExpanded ? (
            <KeyboardArrowUp sx={{ fontSize: "0.85rem" }} />
          ) : (
            <KeyboardArrowDown sx={{ fontSize: "0.85rem" }} />
          )}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            background: treeBg,
            borderTop: `0.5px solid ${treeBorder}`,
            py: 0.5,
          }}
        >
          {logs.length === 0 ? (
            <Box sx={{ py: 2.5, textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.65rem", color: mutedText }}>
                No entries found.
              </Typography>
            </Box>
          ) : (
            voucherGroups.map((voucher, idx) => (
              <VoucherGroupRow
                key={voucher.nJEVId}
                voucher={voucher}
                isLast={idx === voucherGroups.length - 1}
                defaultOpen={idx === 0}
                jevTypeLabels={jevTypeLabels}
                onSelectVoucher={onSelectVoucher}
                isSelected={selectedVoucherId === voucher.nJEVId}
              />
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

/* ─────────────────────────────────────────────────────────────
   VOUCHER DETAIL PANEL — FIXED
   The `voucher` prop passed in here is the *sparse* log-derived
   group object (no strTIN / strAddress / real payee data). We
   already fetch the full voucher record below via VoucherAPI —
   the header card must read from THAT (`fullVoucher`), the same
   way useVoucherUpdate.js does for the main Voucher view, instead
   of reading the sparse `voucher` prop directly.
───────────────────────────────────────────────────────────── */
const DetailPanel = ({ voucher, jevTypeLabels, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const headerBg = isDark ? "rgba(83,74,183,0.18)" : "#EEEDFE";
  const headerInnerBg = isDark ? "rgba(15,23,42,0.4)" : "#F3F4F6";
  const borderColor = isDark ? "rgba(51,65,85,0.6)" : "#F3F4F6";
  const cardBorder = isDark ? "rgba(148,163,184,0.35)" : "#E5E7EB";
  const primaryText = isDark ? "#E2E8F0" : "#111827";
  const secondaryText = isDark ? "#94a3b8" : "#6B7280";
  const mutedText = isDark ? "#9ca3af" : "#9CA3AF";
  const iconColor = isDark ? "#A5B4FC" : "#534AB7";
  const arrowColor = mutedText;
  const arrowBorder = isDark ? "rgba(71,85,105,0.4)" : "#E5E7EB";

  const [fullVoucher, setFullVoucher] = React.useState(null);
  const [loadingVoucher, setLoadingVoucher] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setFullVoucher(null);

    const fetchFullVoucher = async () => {
      setLoadingVoucher(true);
      try {
        let data = null;
        // Prefer a direct lookup by JEV id if the API supports it
        if (typeof VoucherAPI.getVoucherByJevId === "function") {
          const res = await VoucherAPI.getVoucherByJevId(voucher.nJEVId);
          data = res?.data || res;
        } else {
          const res = await VoucherAPI.getVouchers();
          const list = Array.isArray(res) ? res : res.data || [];
          data = list.find((v) => String(v.nJEVId) === String(voucher.nJEVId));
        }
        if (active) setFullVoucher(data || null);
      } catch (err) {
        console.error("Failed to fetch voucher for JEV panel:", err);
        if (active) setFullVoucher(null);
      } finally {
        if (active) setLoadingVoucher(false);
      }
    };

    if (voucher?.nJEVId) fetchFullVoucher();

    return () => {
      active = false;
    };
  }, [voucher?.nJEVId]);

  // ── Derived from the REAL voucher record (fullVoucher), not the
  //    sparse log-derived `voucher` prop ──────────────────────────
  const isAssigneeType =
    (fullVoucher?.voucher_assignees?.length ?? 0) > 0 &&
    !(fullVoucher?.voucher_suppliers?.length ?? 0);

  const firstAssignee = fullVoucher?.voucher_assignees?.[0];

  const supplierLinks = fullVoucher?.voucher_suppliers || [];
  const assigneeLinks = fullVoucher?.voucher_assignees || [];

  const payeeNickName = isAssigneeType
    ? (firstAssignee?.assignee?.strAssigneeNickName ??
      fullVoucher?.assignee?.strAssigneeNickName ??
      "—")
    : (fullVoucher?.supplier?.strSupplierNickName ?? "—");

  const supplierTIN = isAssigneeType
    ? firstAssignee?.assignee?.strTIN
    : fullVoucher?.supplier?.strTIN;

  const supplierAddress = isAssigneeType
    ? firstAssignee?.assignee?.strAddress
    : fullVoucher?.supplier?.strAddress;

  // Voucher number / created date should also come from the real
  // record when available, falling back to the log-derived group
  // so something still shows while fullVoucher is loading.
  const displayVoucherNumber =
    fullVoucher?.strNumber ?? voucher.strVoucherNumber ?? "—";
  const displayCreatedDate = fullVoucher?.dtCreated ?? voucher.dtCreated;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Panel header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: headerBg,
          borderBottom: `0.5px solid ${borderColor}`,
        }}
      >
        <ReceiptLongOutlined sx={{ fontSize: "0.9rem", color: iconColor }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: primaryText,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {voucher.strVoucherNumber ?? "—"}
          </Typography>
          <Typography sx={{ fontSize: "0.55rem", color: mutedText }}>
            {jevTypeLabels?.[voucher.cJevType] ?? voucher.cJevType ?? "—"} JEV
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            width: 22,
            height: 22,
            color: arrowColor,
            border: `0.5px solid ${arrowBorder}`,
            borderRadius: "50px",
            p: 0,
            flexShrink: 0,
          }}
        >
          <CloseOutlined sx={{ fontSize: "0.75rem" }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.5, overflowY: "auto", flex: 1 }}>
        {/* Payee + voucher info cards */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "stretch", mb: 1.5 }}>
          <Box
            sx={{
              flex: 1,
              px: 1,
              py: 0.75,
              borderRadius: "8px",
              background: headerInnerBg,
              border: `0.5px solid ${cardBorder}`,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}
            >
              {isAssigneeType ? (
                <BadgeOutlined sx={{ fontSize: "0.6rem", color: mutedText }} />
              ) : (
                <StoreOutlined sx={{ fontSize: "0.6rem", color: mutedText }} />
              )}
              <Typography
                sx={{ fontSize: "0.6rem", fontWeight: 700, color: mutedText }}
              >
                {isAssigneeType ? "Assignee" : "Supplier"}
              </Typography>
            </Box>

            {loadingVoucher ? (
              <Typography sx={{ fontSize: "0.65rem", color: mutedText }}>
                Loading…
              </Typography>
            ) : (
              <>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: primaryText,
                    mb: 0.2,
                  }}
                >
                  {payeeNickName}
                </Typography>
                {supplierAddress && (
                  <Typography
                    sx={{ fontSize: "0.55rem", color: secondaryText }}
                  >
                    {supplierAddress}
                  </Typography>
                )}
                {supplierTIN && (
                  <Typography
                    sx={{ fontSize: "0.55rem", color: mutedText, mt: 0.2 }}
                  >
                    TIN: {supplierTIN}
                  </Typography>
                )}
              </>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              px: 1,
              py: 0.75,
              borderRadius: "8px",
              background: headerInnerBg,
              border: `0.5px solid ${cardBorder}`,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}
            >
              <ReceiptLongOutlined
                sx={{ fontSize: "0.6rem", color: mutedText }}
              />
              <Typography
                sx={{ fontSize: "0.6rem", fontWeight: 700, color: mutedText }}
              >
                No. HDV
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: primaryText,
                mb: 0.2,
              }}
            >
              {displayVoucherNumber}
            </Typography>
            <Typography sx={{ fontSize: "0.55rem", color: secondaryText }}>
              Created {fmtDate(displayCreatedDate)}
            </Typography>
          </Box>
        </Box>

        {/* Section label */}
        <Box sx={{ pb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: "0.58rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: mutedText,
              whiteSpace: "nowrap",
            }}
          >
            Particulars
          </Typography>
        </Box>

        {loadingVoucher ? (
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: mutedText,
              textAlign: "center",
              py: 3,
            }}
          >
            Loading particulars…
          </Typography>
        ) : isAssigneeType ? (
          <AssigneeList assigneeLinks={assigneeLinks} />
        ) : (
          <POList supplierLinks={supplierLinks} isJEVPage={true} />
        )}

        {/* Journal Entry Voucher section */}
        <Box
          sx={{
            pb: 1,
            pt: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.58rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: mutedText,
              whiteSpace: "nowrap",
            }}
          >
            Journal Entry Voucher
          </Typography>
        </Box>

        {(() => {
          const accentBg = isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF";
          const accentBorder = isDark ? "rgba(96,165,250,0.35)" : "#BFDBFE";
          const accentText = isDark ? "#93c5fd" : "#3B82F6";
          const rowDivider = isDark ? "rgba(30,41,59,0.6)" : "#F3F4F6";
          const rowHover = isDark ? "rgba(30,41,59,0.8)" : "#F9FAFB";
          const totalBg = isDark ? "rgba(30,41,59,0.9)" : "#F3F4F6";
          const totalBorder = isDark ? "rgba(148,163,184,0.45)" : "#DDE3EE";
          const fromColor = isDark ? "#FCA5A5" : "#DC2626";
          const toColor = isDark ? "#86EFAC" : "#16A34A";
          const allEntries = voucher.accounts.flatMap((a) => a.entries);
          const totals = calcTotals(allEntries);

          return (
            <Box
              sx={{
                borderRadius: "10px",
                border: `0.5px solid ${cardBorder}`,
                overflow: "hidden",
              }}
            >
              {voucher.accounts.map((account, idx) => {
                const accTotals = calcTotals(account.entries);
                return (
                  <Box
                    key={account.nJournalAccountId ?? idx}
                    sx={{
                      px: 1.5,
                      py: 0.875,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      borderBottom:
                        idx < voucher.accounts.length - 1
                          ? `0.5px solid ${rowDivider}`
                          : "none",
                      "&:hover": { background: rowHover },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: mutedText,
                        width: 16,
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}
                    </Typography>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "7px",
                        background: accentBg,
                        border: `0.5px solid ${accentBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AccountBalanceOutlined
                        sx={{ fontSize: "0.85rem", color: accentText }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: primaryText,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {account.accountName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", minWidth: 60 }}>
                      <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
                        From
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          color: fromColor,
                        }}
                      >
                        {accTotals.fromTotal
                          ? fmtPHP(accTotals.fromTotal)
                          : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", minWidth: 60 }}>
                      <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
                        To
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          color: toColor,
                        }}
                      >
                        {accTotals.toTotal ? fmtPHP(accTotals.toTotal) : "—"}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              <Box
                sx={{
                  px: 1.5,
                  py: 0.875,
                  display: "flex",
                  alignItems: "center",
                  background: totalBg,
                  borderTop: `1px solid ${totalBorder}`,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "7px",
                    background: accentBg,
                    border: `0.5px solid ${accentBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 1,
                  }}
                >
                  <ReceiptLongOutlined
                    sx={{ fontSize: "0.85rem", color: accentText }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.67rem",
                      fontWeight: 700,
                      color: primaryText,
                    }}
                  >
                    Grand Total
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.54rem", color: secondaryText }}
                  >
                    {allEntries.length}{" "}
                    {allEntries.length === 1 ? "entry" : "entries"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
                      From
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: fromColor,
                      }}
                    >
                      {fmtPHP(totals.fromTotal)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.5rem", color: mutedText }}>
                      To
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: toColor,
                      }}
                    >
                      {fmtPHP(totals.toTotal)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Box>
    </Box>
  );
};

// ── Main View ──────────────────────────────────────────────────────────
export default function JournalEntryVoucherView({
  companyGroups,
  expandedCompany,
  setExpandedCompany,
  loading,
  jev_types,
  allLogs,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const sectionBg = isDark ? "rgba(15,23,42,0.4)" : "#fff";
  const sectionBorder = isDark ? "rgba(51,65,85,0.5)" : "rgba(0,0,0,0.05)";
  const loadingText = isDark ? "#94A3B8" : "#9CA3AF";

  const [selectedVoucher, setSelectedVoucher] = React.useState(null);

  // ── Filter logs for "This Year" / "This Month" metric cards ──────────
  const { thisYearLogs, thisMonthLogs } = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const yearLogs = [];
    const monthLogs = [];

    (allLogs || []).forEach((log) => {
      const d = new Date(log.dtOccur);
      if (isNaN(d)) return;
      if (d.getFullYear() === year) {
        yearLogs.push(log);
        if (d.getMonth() === month) monthLogs.push(log);
      }
    });

    return { thisYearLogs: yearLogs, thisMonthLogs: monthLogs };
  }, [allLogs]);

  return (
    <PageLayout title="Journal Entry Voucher">
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "stretch",
          maxHeight: "calc(100vh - 100px)", // adjust to match your header/footer/page padding
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexShrink: 0 }}>
            <MetricCard
              icon={CalendarMonthOutlined}
              label="This Year"
              logs={thisYearLogs}
              loading={loading}
            />
            <MetricCard
              icon={CalendarMonthOutlined}
              label="This Month"
              logs={thisMonthLogs}
              loading={loading}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              background: sectionBg,
              border: `0.5px solid ${sectionBorder}`,
              borderRadius: "0.5rem",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.7rem", color: loadingText }}>
                  Loading entries…
                </Typography>
              </Box>
            ) : (
              companyGroups.map((group) => (
                <CompanyTopGroup
                  key={group.id}
                  companyName={group.name}
                  logs={group.logs}
                  isExpanded={expandedCompany === group.id}
                  onToggle={() =>
                    setExpandedCompany((p) => {
                      const isClosing = p === group.id;
                      if (isClosing) setSelectedVoucher(null);
                      return isClosing ? null : group.id;
                    })
                  }
                  jevTypeLabels={jev_types}
                  onSelectVoucher={setSelectedVoucher}
                  selectedVoucherId={selectedVoucher?.nJEVId}
                />
              ))
            )}
          </Box>
        </Box>

        {selectedVoucher && (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              background: sectionBg,
              border: `0.5px solid ${sectionBorder}`,
              borderRadius: "0.5rem",
              overflow: "hidden",
            }}
          >
            <DetailPanel
              voucher={selectedVoucher}
              jevTypeLabels={jev_types}
              onClose={() => setSelectedVoucher(null)}
            />
          </Box>
        )}
      </Box>
    </PageLayout>
  );
}
