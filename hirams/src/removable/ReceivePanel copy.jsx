import React, { useState, useEffect } from "react";
import { Box, Typography, Divider, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Inventory2Outlined,
  CheckCircleOutlined,
  ExpandMore,
  ExpandLess,
  UnfoldMore,
  UnfoldLess,
  HistoryOutlined,
} from "@mui/icons-material";
import FormGrid from "../../../../../../../components/form/FormGrid.jsx";
import InventoryAPI from "../../../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../../../api/endpoints/purchase-order.api.js";
import SerialNumberAPI from "../../../../../../../api/endpoints/serial-number.api.js";
import {
  showSwal,
  withSpinner,
} from "../../../../../../../utils/helpers/swal.jsx";
import { fmtDate } from "../../../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  cardBg: c.slate.outerBg,
  cardBorder: c.slate.border,
  rowHover: c.slate.itemHover,
  rowBgDisabled: c.slate.hover,
  divider: c.slate.divider,
  rowDivider: c.slate.borderRow,
  inputBg: c.gray.inputBg,
  inputBorder: c.slate.btnBorder,
  inputFocusBorder: c.blue.text,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  blueText: c.blue.text,
  blueTextAlt: c.blue.textStrong,
  blueBg: c.blue.bg,
  blueBgSoft: c.blue.bgSoft,
  blueBorder: c.blue.border,
  greenText: c.green.text,
  deepBlueText: c.teal.text,
  errorText: c.red.text,
  errorBg: c.red.bg,
  btnBgDisabled: c.slate.btnBg,
  iconMuted: c.slate.mutedColor,
});

const IconBox = ({
  size = 34,
  bg,
  border,
  radius = "8px",
  mr = 1,
  children,
  c,
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg || c.btnBgDisabled,
      border: border || `0.5px solid ${c.inputBorder}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      mr,
    }}
  >
    {children}
  </Box>
);

const StatBox = ({ label, value, delta, deltaColor, color, c }) => (
  <Box sx={{ textAlign: "center", flexShrink: 0, px: 1 }}>
    <Typography
      sx={{
        fontSize: "0.5rem",
        color,
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.8rem",
        fontWeight: 800,
        color,
        display: "flex",
        alignItems: "baseline",
        gap: 0.25,
        justifyContent: "center",
      }}
    >
      {value}
      {delta != null && (
        <Box
          component="span"
          sx={{ fontSize: "0.55rem", fontWeight: 700, color: deltaColor }}
        >
          {delta}
        </Box>
      )}
    </Typography>
  </Box>
);

function BatchHistoryTable({
  batches,
  uom,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false, // adds a read-only Status column
}) {
  if (!batches || batches.length === 0) {
    return (
      <Typography sx={{ fontSize: "0.65rem", color: c.textFaint, py: 1 }}>
        No batches recorded yet.
      </Typography>
    );
  }

  const statusLabel = (status) => {
    if (status === "A") return "Active";
    if (status === "P") return "Pending";
    if (status === "C") return "Cancelled";
    return "—";
  };
  const statusColors = (status) => {
    if (status === "A")
      return { color: c.greenText, bg: c.blueBgSoft, border: c.blueBorder };
    if (status === "P")
      return {
        color: c.pendingText ?? "#b45309",
        bg: c.blueBgSoft,
        border: c.blueBorder,
      };
    if (status === "C")
      return { color: c.errorText, bg: c.errorBg, border: c.errorText };
    return { color: c.textFaint, bg: c.rowBgDisabled, border: c.divider };
  };

  return (
    <Box
      sx={{
        borderRadius: "6px",
        border: `0.5px solid ${c.divider}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 0.5,
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          gap: 1,
          background: c.rowBgDisabled,
          borderBottom: `0.5px solid ${c.divider}`,
        }}
      >
        <Box sx={{ width: 28, flexShrink: 0, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            No.
          </Typography>
        </Box>
        <Box sx={{ width: 100, flexShrink: 0, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Receipt No.
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Quantity
          </Typography>
        </Box>
        <Box sx={{ width: 130, flexShrink: 0, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            S/N
          </Typography>
        </Box>
        <Box sx={{ width: 90, flexShrink: 0, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            Date
          </Typography>
        </Box>
        {showStatus && (
          <Box sx={{ width: 90, flexShrink: 0, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textMuted,
                textTransform: "uppercase",
              }}
            >
              Status
            </Typography>
          </Box>
        )}
        {allowActions && (
          <Box sx={{ width: 90, flexShrink: 0, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textMuted,
                textTransform: "uppercase",
              }}
            >
              Action
            </Typography>
          </Box>
        )}
      </Box>

      {batches.map((b, i) => {
        const serials = (b.serialNumbers || []).filter(Boolean);
        const isPending = b.cStatus === "P" && !actionableWhenPending;
        const isCancelled = b.cStatus === "C";
        const statusStyle = statusColors(b.cStatus);
        return (
          <Box
            key={b.nInventoryId ?? `${b.receiptNumber}-${i}`}
            sx={{
              px: 1,
              py: 0.6,
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: { xs: "wrap", sm: "nowrap" },
              borderBottom:
                i === batches.length - 1
                  ? "none"
                  : `0.5px solid ${c.rowDivider}`,
            }}
          >
            <Box sx={{ width: 28, flexShrink: 0, textAlign: "center" }}>
              <Typography
                sx={{ fontSize: "0.6rem", fontWeight: 600, color: c.textFaint }}
              >
                {i + 1}
              </Typography>
            </Box>
            <Box sx={{ width: 100, flexShrink: 0, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: c.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.receiptNumber || "—"}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 0.3,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: c.textPrimary,
                  lineHeight: 1,
                }}
              >
                {b.qty}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.52rem",
                  color: c.textMuted,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {uom}
              </Typography>
            </Box>
            <Box sx={{ width: 130, flexShrink: 0, textAlign: "center" }}>
              {serials.length ? (
                <Typography
                  title={serials.join(", ")}
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: c.blueText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {serials.length > 1
                    ? `${serials[0]} +${serials.length - 1}`
                    : serials[0]}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: "0.6rem", color: c.textFaint }}>
                  —
                </Typography>
              )}
            </Box>
            <Box sx={{ width: 90, flexShrink: 0, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: c.textMuted,
                  whiteSpace: "nowrap",
                }}
              >
                {b.dtLog
                  ? new Date(b.dtLog).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </Typography>
            </Box>

            {showStatus && (
              <Box sx={{ width: 90, flexShrink: 0, textAlign: "center" }}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    px: 0.7,
                    py: 0.25,
                    borderRadius: "6px",
                    color: statusStyle.color,
                    background: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusLabel(b.cStatus)}
                </Box>
              </Box>
            )}

            {allowActions && (
              <Box sx={{ width: 90, flexShrink: 0, textAlign: "center" }}>
                {isPending ? (
                  <Box
                    sx={{
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      py: 0.35,
                      borderRadius: "6px",
                      color: c.pendingText ?? "#b45309",
                      background: c.blueBgSoft,
                      border: `1px solid ${c.blueBorder}`,
                    }}
                  >
                    Pending
                  </Box>
                ) : (
                  <Box
                    component="button"
                    onClick={() => onToggleStatus?.(b)}
                    disabled={statusUpdatingId === b.nInventoryId}
                    sx={{
                      width: "100%",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      py: 0.35,
                      borderRadius: "6px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      color: isCancelled ? c.greenText : c.errorText,
                      background: isCancelled ? c.blueBgSoft : c.errorBg,
                      border: `1px solid ${isCancelled ? c.blueBorder : c.errorText}33`,
                      opacity: statusUpdatingId === b.nInventoryId ? 0.6 : 1,
                    }}
                  >
                    {statusUpdatingId === b.nInventoryId
                      ? "Updating..."
                      : isCancelled
                        ? "Re-activate"
                        : "Cancel"}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function ReceivedItemRow({
  idx,
  p,
  batches,
  expanded,
  onToggleExpand,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
}) {
  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

  return (
    <Box>
      {idx > 0 && <Divider sx={{ borderColor: c.divider }} />}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <IconBox bg={c.blueBg} border={`0.5px solid ${c.blueBorder}`} c={c}>
          <Inventory2Outlined sx={{ fontSize: "0.95rem", color: c.blueText }} />
        </IconBox>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: c.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {itemLabel}
          </Typography>
          <Typography sx={{ fontSize: "0.6rem", color: c.textMuted, mt: 0.15 }}>
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        <StatBox
          label="Ordered"
          value={p?.nQuantity || 0}
          color={c.blueText}
          c={c}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: c.divider, my: 0.5 }}
        />
        <StatBox
          label="To Rcv"
          value={Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0))}
          color={c.greenText}
          c={c}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: c.divider, my: 0.5 }}
        />
        <StatBox
          label="Rcvd"
          value={p?.nInventoryQty ?? 0}
          color={c.deepBlueText}
          c={c}
        />

        <Box
          component="button"
          onClick={onToggleExpand}
          sx={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `0.5px solid ${c.inputBorder}`,
            borderRadius: "6px",
            background: expanded ? c.blueBgSoft : "transparent",
            color: expanded ? c.blueText : c.iconMuted,
            cursor: "pointer",
            ml: 0.5,
          }}
          title={expanded ? "Hide quantity history" : "Show quantity history"}
        >
          <HistoryOutlined sx={{ fontSize: "0.85rem" }} />
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ pb: 1.25, pl: 1.5 }}>
          <BatchHistoryTable
            batches={batches}
            uom={p?.strUOM ?? ""}
            c={c}
            onToggleStatus={onToggleStatus}
            statusUpdatingId={statusUpdatingId}
            allowActions={allowActions}
            actionableWhenPending={actionableWhenPending}
            showStatus={showStatus}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

// ── One item's row (header + collapsible receive form) ─────────────────────
function ItemReceiveRow({
  idx,
  p,
  value,
  onChange,
  expanded,
  onToggleExpand,
  c,
}) {
  const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
  const isSingle =
    !((p?.nInventoryQty || 0) >= (p?.nQuantity || 0)) && maxQty === 1;
  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

  const setQty = (qty) => onChange({ ...value, qty });
  const setReceiptNo = (receiptNo) => onChange({ ...value, receiptNo });
  const setSerials = (serials) => onChange({ ...value, serials });
  const toggleSN = () => onChange({ ...value, showSN: !value.showSN });

  return (
    <Box>
      {idx > 0 && <Divider sx={{ borderColor: c.divider }} />}

      {/* Row header — always visible */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <IconBox bg={c.blueBg} border={`0.5px solid ${c.blueBorder}`} c={c}>
          <Inventory2Outlined sx={{ fontSize: "0.95rem", color: c.blueText }} />
        </IconBox>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: c.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {itemLabel}
          </Typography>
          <Typography sx={{ fontSize: "0.6rem", color: c.textMuted, mt: 0.15 }}>
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        <StatBox
          label="Ordered"
          value={p?.nQuantity || 0}
          color={c.blueText}
          c={c}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: c.divider, my: 0.5 }}
        />
        <StatBox
          label="To Rcv"
          value={maxQty}
          delta={Number(value.qty) > 0 ? `(-${Number(value.qty)})` : null}
          deltaColor={c.errorText}
          color={c.greenText}
          c={c}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: c.divider, my: 0.5 }}
        />
        <StatBox
          label="Rcvd"
          value={p?.nInventoryQty ?? 0}
          delta={Number(value.qty) > 0 ? `(+${Number(value.qty)})` : null}
          deltaColor={c.greenText}
          color={c.deepBlueText}
          c={c}
        />

        <Box
          component="button"
          onClick={onToggleExpand}
          sx={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `0.5px solid ${c.inputBorder}`,
            borderRadius: "6px",
            background: expanded ? c.blueBgSoft : "transparent",
            color: expanded ? c.blueText : c.iconMuted,
            cursor: "pointer",
            ml: 0.5,
          }}
          title={expanded ? "Hide receive form" : "Show receive form"}
        >
          {expanded ? (
            <ExpandLess sx={{ fontSize: "1rem" }} />
          ) : (
            <ExpandMore sx={{ fontSize: "1rem" }} />
          )}
        </Box>
      </Box>

      {/* Collapsible receive form */}
      <Collapse in={expanded}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pb: 1.25,
            pl: 1.5,
          }}
        >
          {/* Qty + SN toggle + Receipt No — single row */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Typography
                sx={{
                  flex: isSingle ? 1.4 : 1,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Quantity to Receive
              </Typography>
              <Typography
                sx={{
                  width: 55,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Receipt No.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              {isSingle ? (
                <Box
                  component="button"
                  onClick={() => setQty(value.qty === "1" ? "" : "1")}
                  sx={{
                    flex: 1.4,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: value.qty === "1" ? "#fff" : c.blueText,
                    background: value.qty === "1" ? c.blueText : c.blueBgSoft,
                    border: `0.5px solid ${c.blueBorder}`,
                    borderRadius: "7px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <CheckCircleOutlined
                    sx={{ fontSize: "0.85rem", flexShrink: 0 }}
                  />
                  {value.qty === "1"
                    ? "1 Received"
                    : `Mark 1 ${p?.strUOM ?? ""}`}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flex: 1 }}>
                  <Box
                    component="input"
                    type="number"
                    min={0}
                    max={maxQty}
                    value={value.qty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= maxQty) setQty(e.target.value);
                    }}
                    sx={{
                      flex: 1,
                      height: 32,
                      px: 0.9,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: c.textPrimary,
                      border: `0.5px solid ${c.inputBorder}`,
                      borderRight: "none",
                      borderRadius: "7px 0 0 7px",
                      outline: "none",
                      background: c.inputBg,
                    }}
                  />
                  <Box
                    sx={{
                      height: 32,
                      px: 1,
                      display: "flex",
                      alignItems: "center",
                      background: c.btnBgDisabled,
                      border: `0.5px solid ${c.inputBorder}`,
                      borderRadius: "0 7px 7px 0",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: c.textMuted,
                        textTransform: "uppercase",
                      }}
                    >
                      {p?.strUOM ?? "—"}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box
                component="button"
                onClick={toggleSN}
                disabled={!value.qty || Number(value.qty) <= 0}
                sx={{
                  width: 78,
                  height: 32,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.3,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: value.showSN ? c.blueText : c.textMuted,
                  background: value.showSN ? c.blueBgSoft : c.cardBg,
                  border: `0.5px solid ${value.showSN ? c.blueBorder : c.inputBorder}`,
                  borderRadius: "7px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                }}
                title={
                  value.showSN ? "Hide serial numbers" : "Add serial numbers"
                }
              >
                {value.showSN ? "− SN" : "+ SN"}
              </Box>

              <Box
                component="input"
                type="text"
                value={value.receiptNo}
                placeholder="e.g. RR-2025-0001"
                onChange={(e) => setReceiptNo(e.target.value)}
                sx={{
                  flex: 1,
                  height: 32,
                  px: 0.9,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  border: `0.5px solid ${c.inputBorder}`,
                  borderRadius: "7px",
                  outline: "none",
                  background: c.inputBg,
                }}
              />
            </Box>
          </Box>

          {value.showSN && (
            <FormGrid
              fields={[
                {
                  name: "serials",
                  label: "Serial Numbers",
                  type: "serialNumber",
                  xs: 12,
                  placeholder: "Scan or type S/N and press Enter...",
                  maxItems: Number(value.qty) || 0,
                },
              ]}
              switches={[]}
              formData={{ serials: value.serials }}
              errors={{}}
              handleChange={(e) => {
                if (e.target.name === "serials") setSerials(e.target.value);
              }}
              autoFocus={false}
            />
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Reusable section wrapper (header + list) ───────────────────────────────
function ItemsSection({ title, count, extraControl, children, c }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `0.5px solid ${c.cardBorder}`,
        background: c.cardBg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderBottom: collapsed ? "none" : `0.5px solid ${c.divider}`,
        }}
      >
        <Typography
          sx={{ fontSize: "0.7rem", fontWeight: 700, color: c.textPrimary }}
        >
          {title} ({count})
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          {!collapsed && extraControl}
          <Box
            component="button"
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "6px",
              background: "transparent",
              color: c.iconMuted,
              cursor: "pointer",
              "&:hover": { background: c.rowHover },
            }}
            title={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {collapsed ? (
              <ExpandMore sx={{ fontSize: "1rem" }} />
            ) : (
              <ExpandLess sx={{ fontSize: "1rem" }} />
            )}
          </Box>
        </Box>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ px: 1.5 }}>
          {count === 0 ? (
            <Typography
              sx={{
                fontSize: "0.65rem",
                color: c.textFaint,
                py: 1.5,
                textAlign: "center",
              }}
            >
              No data available.
            </Typography>
          ) : (
            children
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

const ExpandAllButton = ({ expanded, onClick, c }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.4,
      px: 1,
      py: 0.4,
      borderRadius: "6px",
      border: `0.5px solid ${c.inputBorder}`,
      background: "transparent",
      color: c.textMuted,
      fontSize: "0.62rem",
      fontWeight: 600,
      cursor: "pointer",
      "&:hover": { background: c.rowHover },
    }}
  >
    {expanded ? (
      <UnfoldLess sx={{ fontSize: "0.85rem" }} />
    ) : (
      <UnfoldMore sx={{ fontSize: "0.85rem" }} />
    )}
    {expanded ? "Collapse All" : "Expand All"}
  </Box>
);

const TAB_OPTIONS = [
  { key: "ALL", label: "All" },
  { key: "TO_RECEIVE", label: "To Receive" },
  { key: "PENDING", label: "Pending JEV" },
  { key: "RECEIVED", label: "Received" },
];

function SectionTabs({ active, onChange, counts, c }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        p: 0.4,
        borderRadius: "10px",
        border: `0.5px solid ${c.cardBorder}`,
        background: c.rowBgDisabled,
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {TAB_OPTIONS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts[tab.key];
        return (
          <Box
            key={tab.key}
            component="button"
            onClick={() => onChange(tab.key)}
            sx={{
              flex: { xs: "1 0 auto", sm: "0 0 auto" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.4,
              px: 1.25,
              py: 0.55,
              borderRadius: "8px",
              border: "none",
              background: isActive ? c.cardBg : "transparent",
              color: isActive ? c.blueText : c.textMuted,
              fontSize: "0.65rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
              boxShadow: isActive ? `0 0 0 0.5px ${c.blueBorder}` : "none",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
            {count != null && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: isActive ? c.blueText : c.textFaint,
                  opacity: 0.85,
                }}
              >
                ({count})
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function ReceivePanel({
  options = [],
  patchOption,
  nPurchaseOrderId,
  currentUserId,
  forDeliveryKey,
  deliveredKey,
  pendingReceiptKey,
  onDone,
  onStateChange,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const [formByItem, setFormByItem] = useState({});
  const [expandedByItem, setExpandedByItem] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [allExpandedReceived, setAllExpandedReceived] = useState(false);
  const [allExpandedPending, setAllExpandedPending] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "TO_RECEIVE" | "PENDING" | "RECEIVED"
  // Split batches by status
  const [approvedBatchesByItem, setApprovedBatchesByItem] = useState({});
  const [pendingBatchesByItem, setPendingBatchesByItem] = useState({});
  const [allBatchesByItem, setAllBatchesByItem] = useState({}); // full history, any cStatus — used for "To Receive" read-only view on the ALL tab
  const [historyExpandedByItem, setHistoryExpandedByItem] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const loadBatches = React.useCallback(async () => {
    const approved = {};
    const pending = {};
    const all = {};
    await Promise.all(
      options.map(async (o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id == null) return;
        try {
          const res = await InventoryAPI.getHistory(id);
          const rows = res?.rows || res?.inventory || [];
          const mapRow = (r) => ({
            nInventoryId: r.nInventoryId,
            receiptNumber: r.strReceiptNumber || null,
            qty: Number(r.nQuantity) || 0,
            dtLog: r.dtLog,
            serialNumbers: r.serialNumbers || [],
            cStatus: String(r.cStatus || "").trim(),
          });
          const receivedRows = rows.filter((r) => Number(r.nQuantity) > 0);
          approved[id] = receivedRows
            .filter((r) => String(r.cStatus || "").trim() === "A")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          pending[id] = receivedRows
            .filter((r) => String(r.cStatus || "").trim() === "P")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          all[id] = receivedRows
            .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog))
            .map(mapRow);
        } catch (e) {
          approved[id] = [];
          pending[id] = [];
          all[id] = [];
        }
      }),
    );
    setApprovedBatchesByItem(approved);
    setPendingBatchesByItem(pending);
    setAllBatchesByItem(all);
  }, [options]);

  useEffect(() => {
    const initialForm = {};
    const initialExpanded = {};
    options.forEach((o) => {
      const id = o.purchase_option?.nPurchaseItemId;
      if (id != null) {
        initialForm[id] = {
          qty: "",
          receiptNo: "",
          serials: [],
          showSN: false,
        };
        initialExpanded[id] = false;
      }
    });
    setFormByItem(initialForm);
    setExpandedByItem(initialExpanded);
    setHistoryExpandedByItem({});
    setAllExpanded(false);
    setError("");
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Re-fetch whenever an inventory row status changes elsewhere too
  useEffect(() => {
    const handler = () => loadBatches();
    window.addEventListener("inventory_data_updated", handler);
    return () => window.removeEventListener("inventory_data_updated", handler);
  }, [loadBatches]);

  const setItemValue = (id, value) =>
    setFormByItem((prev) => ({ ...prev, [id]: value }));

  const toggleExpand = (id) =>
    setExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleHistoryExpand = (id) =>
    setHistoryExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

  // Expand all — receive-form rows (To Receive, TO_RECEIVE tab)
  const toggleExpandAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpandedByItem((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllReceived = () => {
    const next = !allExpandedReceived;
    setAllExpandedReceived(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      receivedItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[id] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllPending = () => {
    const next = !allExpandedPending;
    setAllExpandedPending(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      pendingJevItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`p-${id}`] = next;
      });
      return updated;
    });
  };

  // Expand all — history rows in "To Receive" when tab is ALL
  const toggleExpandAllToReceiveHistory = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      toReceiveItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`t-${id}`] = next;
      });
      return updated;
    });
  };

  // ── Approve/Cancel/Re-activate a batch row
  const toggleBatchStatus = async (id, batch) => {
    const newStatus = batch.cStatus === "C" ? "A" : "C";
    setStatusUpdatingId(batch.nInventoryId);
    try {
      await InventoryAPI.updateInventory(batch.nInventoryId, {
        cStatus: newStatus,
      });

      const option = options.find(
        (o) => o.purchase_option?.nPurchaseItemId === id,
      );
      const p = option?.purchase_option;
      const delta =
        (newStatus === "A" ? 1 : -1) * Math.abs(Number(batch.qty) || 0);
      patchOption?.(id, {
        nInventoryQty: Math.max(0, (p?.nInventoryQty || 0) + delta),
      });

      if (nPurchaseOrderId && currentUserId != null) {
        await PurchaseOrderAPI.syncStatus({
          nPurchaseOrderId,
          nPurchaseItemId: id,
          nUserId: currentUserId,
          nReceivedStatus: forDeliveryKey,
          nDeliveredStatus: deliveredKey,
          nPaidStatus: pendingReceiptKey,
        });
      }

      await loadBatches();
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    } catch (err) {
      console.error("Failed to update batch status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const itemsToSave = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    const v = formByItem[id];
    return v && v.qty !== "" && Number(v.qty) > 0 && v.receiptNo.trim() !== "";
  });

  const isFormValid = itemsToSave.length > 0;

  const handleSave = async () => {
    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = formByItem[id];
      const newReceived = Number(v.qty);
      const currentDelivered = p?.nDeliveredQty || 0;
      if (newReceived < currentDelivered) {
        setError(
          `${[p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item"}: Received can't be less than Delivered (${currentDelivered}).`,
        );
        return;
      }
      if (v.serials.length > newReceived) {
        setError(
          `${[p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item"}: too many serial numbers for the quantity entered.`,
        );
        return;
      }
    }
    setError("");
    setSaving(true);

    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = formByItem[id];
      const newReceived = Number(v.qty);

      patchOption?.(id, {
        nInventoryQty: (p?.nInventoryQty || 0) + newReceived,
        receivedSerialNumbers: [
          ...(p?.receivedSerialNumbers || []),
          ...v.serials,
        ],
      });

      try {
        await withSpinner("Inventory", async () => {
          const res = await InventoryAPI.createInventory({
            nPurchaseItemId: id,
            nQuantity: newReceived,
            strReceiptNumber: v.receiptNo.trim() || null,
            cStatus: "P",
          });
          const newInventoryId = res.inventory?.nInventoryId ?? null;
          if (newInventoryId && v.serials.length > 0) {
            for (const sn of v.serials) {
              await SerialNumberAPI.createSerialNumber({
                nInventoryId: newInventoryId,
                strSerialNumber: sn,
              });
            }
          }
          if (nPurchaseOrderId && currentUserId != null) {
            await PurchaseOrderAPI.syncStatus({
              nPurchaseOrderId,
              nPurchaseItemId: id,
              nUserId: currentUserId,
              nReceivedStatus: forDeliveryKey,
              nDeliveredStatus: deliveredKey,
              nPaidStatus: pendingReceiptKey,
            });
          }
        });
      } catch (apiErr) {
        console.error("Failed to save received for item", id, apiErr);
      }
    }

    setSaving(false);
    window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    window.dispatchEvent(new CustomEvent("cart_data_updated"));
    await showSwal(
      "SUCCESS",
      {},
      { entity: `${itemsToSave.length} item(s) received`, action: "recorded" },
    );
    onDone?.();
  };

  // ── Sections ─────────────────────────────────────────────────
  // Received Items — has at least one APPROVED (cStatus = A) batch
  const receivedItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (approvedBatchesByItem[id] || []).length > 0;
  });
  // Pending JEV — has at least one PENDING (cStatus = P) batch
  const pendingJevItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (pendingBatchesByItem[id] || []).length > 0;
  });
  // To Receive — still needs receiving (partial or not started)
  const toReceiveItems = options.filter((o) => {
    const p = o.purchase_option;
    return Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0)) > 0;
  });

  useEffect(() => {
    onStateChange?.({ onConfirm: handleSave, canConfirm: isFormValid, saving });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormValid, saving, formByItem]);

  // On the ALL tab, "To Receive" shows history (read-only) instead of the form.
  const showToReceiveAsHistory = activeTab === "ALL";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <SectionTabs
        active={activeTab}
        onChange={setActiveTab}
        counts={{
          ALL: options.length,
          TO_RECEIVE: toReceiveItems.length,
          PENDING: pendingJevItems.length,
          RECEIVED: receivedItems.length,
        }}
        c={c}
      />

      {(activeTab === "ALL" || activeTab === "RECEIVED") && (
        <ItemsSection
          title="Received Items"
          count={receivedItems.length}
          c={c}
          extraControl={
            receivedItems.length > 0 && (
              <ExpandAllButton
                expanded={allExpandedReceived}
                onClick={toggleExpandAllReceived}
                c={c}
              />
            )
          }
        >
          {receivedItems.map((o, idx) => {
            const p = o.purchase_option;
            const id = p?.nPurchaseItemId;
            if (id == null) return null;
            return (
              <ReceivedItemRow
                key={id}
                idx={idx}
                p={p}
                batches={approvedBatchesByItem[id] || []}
                expanded={!!historyExpandedByItem[id]}
                onToggleExpand={() => toggleHistoryExpand(id)}
                c={c}
                onToggleStatus={(batch) => toggleBatchStatus(id, batch)}
                statusUpdatingId={statusUpdatingId}
                allowActions
              />
            );
          })}
        </ItemsSection>
      )}

      {(activeTab === "ALL" || activeTab === "PENDING") && (
        <ItemsSection
          title="Pending JEV"
          count={pendingJevItems.length}
          c={c}
          extraControl={
            pendingJevItems.length > 0 && (
              <ExpandAllButton
                expanded={allExpandedPending}
                onClick={toggleExpandAllPending}
                c={c}
              />
            )
          }
        >
          {pendingJevItems.map((o, idx) => {
            const p = o.purchase_option;
            const id = p?.nPurchaseItemId;
            if (id == null) return null;
            return (
              <ReceivedItemRow
                key={id}
                idx={idx}
                p={p}
                batches={pendingBatchesByItem[id] || []}
                expanded={!!historyExpandedByItem[`p-${id}`]}
                onToggleExpand={() => toggleHistoryExpand(`p-${id}`)}
                c={c}
                onToggleStatus={(batch) => toggleBatchStatus(id, batch)}
                statusUpdatingId={statusUpdatingId}
                allowActions
                actionableWhenPending
              />
            );
          })}
        </ItemsSection>
      )}

      {(activeTab === "ALL" || activeTab === "TO_RECEIVE") && (
        <ItemsSection
          title="To Receive"
          count={toReceiveItems.length}
          c={c}
          extraControl={
            toReceiveItems.length > 0 && (
              <ExpandAllButton
                expanded={showToReceiveAsHistory ? allExpanded : allExpanded}
                onClick={
                  showToReceiveAsHistory
                    ? toggleExpandAllToReceiveHistory
                    : toggleExpandAll
                }
                c={c}
              />
            )
          }
        >
          {toReceiveItems.map((o, idx) => {
            const p = o.purchase_option;
            const id = p?.nPurchaseItemId;
            if (id == null) return null;

            // ALL tab → read-only history view (full history, any cStatus)
            if (showToReceiveAsHistory) {
              return (
                <ReceivedItemRow
                  key={id}
                  idx={idx}
                  p={p}
                  batches={allBatchesByItem[id] || []}
                  expanded={!!historyExpandedByItem[`t-${id}`]}
                  onToggleExpand={() => toggleHistoryExpand(`t-${id}`)}
                  c={c}
                  allowActions={false}
                  showStatus
                />
              );
            }

            // TO_RECEIVE tab → receive form
            const value = formByItem[id] || {
              qty: "",
              receiptNo: "",
              serials: [],
              showSN: false,
            };
            return (
              <ItemReceiveRow
                key={id}
                idx={idx}
                p={p}
                value={value}
                onChange={(v) => setItemValue(id, v)}
                expanded={!!expandedByItem[id]}
                onToggleExpand={() => toggleExpand(id)}
                c={c}
              />
            );
          })}
        </ItemsSection>
      )}

      {error && (
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: c.errorText,
            p: 1,
            background: c.errorBg,
            borderRadius: "6px",
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
