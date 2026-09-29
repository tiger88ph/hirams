import React from "react";
import { Box, Typography, Divider, Collapse } from "@mui/material";
import {
  Inventory2Outlined,
  CheckCircleOutlined,
  HistoryOutlined,
  MoveToInboxOutlined,
} from "@mui/icons-material";
import {
  fmtDate,
  fmtPHP,
} from "../../../../../../../utils/formatters/formatter.js";
import FormGrid from "../../../../../../../components/ui/form/FormGrid.jsx";
import BatchHistoryTable from "./BatchHistoryTable.jsx";

export default function ItemReceiveRow({
  idx,
  p,
  value,
  onChange,
  expanded,
  onToggleExpand,
  historyExpanded,
  onToggleHistoryExpand,
  batches,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
  statusLabel = "Status",
  errorMessage = "",
}) {
  const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
  const isSingle =
    !((p?.nInventoryQty || 0) >= (p?.nQuantity || 0)) && maxQty === 1;
  // const itemLabel =
  [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

  const setQty = (qty) => onChange({ ...value, qty });
  const setReceiptNo = (receiptNo) => onChange({ ...value, receiptNo });
  const setSerials = (serials) => onChange({ ...value, serials });
  const toggleSN = () => onChange({ ...value, showSN: !value.showSN });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: c.btnBgDisabled,
              border: `0.5px solid ${c.inputBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inventory2Outlined
              sx={{ fontSize: "0.75rem", color: c.iconMuted }}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: -5,
              left: -5,
              minWidth: 13,
              height: 13,
              px: 0.25,
              borderRadius: "50px",
              background: c.textMuted,
              border: `1.5px solid ${c.cardBg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.4rem",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {idx + 1}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.4,
              mb: 0.2,
              flexWrap: "wrap",
            }}
          >
            {(p?.strBrand || p?.strModel) && (
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
              </Typography>
            )}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 0.35,
                py: 0.08,
                borderRadius: "50px",
                background: c.blueBg,
                border: `0.5px solid ${c.blueBorder}`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.45rem",
                  fontWeight: 500,
                  color: c.blueTextAlt,
                  lineHeight: 1,
                }}
              >
                {p?.transaction_item?.transaction?.strCode ?? "—"}
              </Typography>
            </Box>
          </Box>
          <Typography
            sx={{
              fontSize: "0.58rem",
              color: c.textSecondary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p?.transaction_item?.strName ?? "—"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.48rem",
              color: c.iconMuted,
              lineHeight: 1,
              mt: 0.15,
            }}
          >
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        {/* TO RECEIVE summary */}
        <Box sx={{ textAlign: "right", flexShrink: 0, px: 1 }}>
          <Typography
            sx={{
              fontSize: "0.5rem",
              color: c.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {statusLabel}
          </Typography>
          <Box sx={{ textAlign: "right" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0.5,
                flexWrap: "nowrap",
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 0.6,
                  py: 0.18,
                  borderRadius: "6px",
                  fontSize: "0.45rem",

                  fontWeight: 600,
                  color: c.blueText,
                  background: c.blueBgSoft,
                  border: `1px solid ${c.blueBorder}`,
                  whiteSpace: "nowrap",
                  lineHeight: 1.1,
                }}
              >
                ₱ {fmtPHP(Number(maxQty || 0) * Number(p?.dUnitPrice || 0))}
              </Box>

              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: c.blueText,
                  lineHeight: 1.1,
                }}
              >
                {maxQty}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: "0.4rem",
                color: c.textMuted,
                fontWeight: 500,
                textTransform: "uppercase",
                mt: 0.15,
              }}
            >
              {p?.strUOM ?? ""}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <Box
            component="button"
            onClick={onToggleHistoryExpand}
            sx={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "50px",
              background: historyExpanded ? c.blueBgSoft : "transparent",
              color: historyExpanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
              mr: 0.25,
            }}
            title={
              historyExpanded
                ? "Hide quantity history"
                : "Show quantity history"
            }
          >
            <HistoryOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>

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
              borderRadius: "50px",
              background: expanded ? c.blueBgSoft : "transparent",
              color: expanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
            }}
            title={expanded ? "Hide receive form" : "Show receive form"}
          >
            <MoveToInboxOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>
        </Box>
      </Box>

      <Collapse in={historyExpanded}>
        <Box sx={{ pb: 1.25, pl: 0 }}>
          <Divider sx={{ borderColor: c.divider, mb: 1 }} />
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              mb: 0.75,
            }}
          >
            Logs
          </Typography>
          <BatchHistoryTable
            batches={batches}
            uom={p?.strUOM ?? ""}
            c={c}
            onToggleStatus={onToggleStatus}
            statusUpdatingId={statusUpdatingId}
            allowActions={allowActions}
            actionableWhenPending={actionableWhenPending}
            showStatus={showStatus}
            unitPrice={p?.dUnitPrice}
            errorMessage={errorMessage}
          />
        </Box>
      </Collapse>
      <Collapse in={expanded}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pb: 1.25,
            pl: 0,
          }}
        >
          <Divider sx={{ borderColor: c.divider }} />
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

      <Divider sx={{ borderColor: c.divider }} />
    </Box>
  );
}
