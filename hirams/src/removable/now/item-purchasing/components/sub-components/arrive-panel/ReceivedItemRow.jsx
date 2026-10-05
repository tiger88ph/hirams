import React from "react";
import { Box, Typography, Divider, Collapse } from "@mui/material";
import {
  Inventory2Outlined,
  HistoryOutlined,
  VisibilityOutlined,
  AddOutlined,
} from "@mui/icons-material";
import {
  fmtDate,
  fmtPHP,
} from "../../../../../../utils/formatters/formatter.js";

import BatchHistoryTable from "./BatchHistoryTable.jsx";

export default function ReceivedItemRow({
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
  showReceivedProgress = false,
  showDeliveredProgress = false,
  approvedProgressQty,
  pendingProgressQty = 0,
  showEqBadge = false,
  onViewJev,
  statusLabel = "Status",
  jevFlowType = "received",
  errorMessage = "",
  onCreateJev,
  creatingJev = false,
  disableCreateJev = false,
}) {
  const jevId = (batches || []).find((b) => b.nJEVId)?.nJEVId;
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
        {/* STATUS SUMMARY */}
        {(() => {
          const qty = (batches || []).reduce((sum, b) => sum + (b.qty || 0), 0);
          const unitPrice = p?.dUnitPrice ?? 0;
          const received = Number(p?.nInventoryQty ?? 0);
          const ordered = Number(p?.nQuantity || 0);
          const showProgress = showReceivedProgress || showDeliveredProgress;

          const progressQty = showProgress
            ? Number(
                approvedProgressQty ?? (showDeliveredProgress ? qty : received),
              )
            : qty;
          const pendingQty = Number(pendingProgressQty) || 0;

          const eqValue = qty * unitPrice;
          const eqApproved = progressQty * unitPrice;
          const eqPending = pendingQty * unitPrice;
          const eqOrdered = ordered * unitPrice;

          const badge = (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 0.2,
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
              {showProgress ? (
                <>
                  ₱{fmtPHP(eqApproved)}
                  {eqPending > 0 && (
                    <Box
                      component="span"
                      sx={{ color: c.errorText, fontWeight: 700 }}
                    >
                      (₱ {fmtPHP(eqPending)})
                    </Box>
                  )}
                  <Box component="span">/ ₱ {fmtPHP(eqOrdered)}</Box>
                </>
              ) : (
                <>₱ {fmtPHP(eqValue)}</>
              )}
            </Box>
          );

          return (
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
                {/* Stacked layout: badge on its own row above qty (progress tabs) */}
                {showEqBadge && showProgress && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mb: 0.25,
                    }}
                  >
                    {badge}
                  </Box>
                )}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.5,
                    flexWrap: "nowrap",
                  }}
                >
                  {/* Inline layout: badge beside qty (non-progress tabs, e.g. Pending JEV) */}
                  {showEqBadge && !showProgress && badge}

                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: c.blueText,
                      display: showProgress ? "flex" : undefined,
                      alignItems: "baseline",
                      gap: 0.25,
                      justifyContent: "flex-end",
                      lineHeight: 1.1,
                    }}
                  >
                    {showProgress ? progressQty : qty}
                    {showProgress && pendingQty > 0 && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: c.errorText,
                        }}
                      >
                        ({pendingQty} Pend)
                      </Box>
                    )}
                    {showProgress && (
                      <Box
                        component="span"
                        sx={{ fontSize: "0.55rem", fontWeight: 700 }}
                      >
                        / {ordered}
                      </Box>
                    )}
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
          );
        })()}
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
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
              mr: jevId || onCreateJev ? 0.25 : 0,
            }}
            title={expanded ? "Hide quantity history" : "Show quantity history"}
          >
            <HistoryOutlined sx={{ fontSize: "0.85rem" }} />
          </Box>

          {jevId && (
            <Box
              component="button"
              onClick={() => onViewJev?.(jevId, p, batches, jevFlowType)}
              sx={{
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.4,
                px: 1,
                flexShrink: 0,
                border: `0.5px solid ${c.blueBorder}`,
                borderRadius: "50px",
                background: c.blueBgSoft,
                color: c.blueText,
                cursor: "pointer",
                fontSize: "0.6rem",
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
              title="View JEV"
            >
              <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
              JEV
            </Box>
          )}
          {!jevId && onCreateJev && (
            <Box
              component="button"
              onClick={() => onCreateJev(p)}
              disabled={creatingJev || disableCreateJev}
              sx={{
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.4,
                px: 1,
                flexShrink: 0,
                border: `0.5px dashed ${c.blueBorder}`,
                borderRadius: "50px",
                background: c.blueBgSoft,
                color: c.blueText,
                cursor: "pointer",
                fontSize: "0.6rem",
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: "nowrap",
                "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
              }}
              title="Create JEV for this item"
            >
              <AddOutlined sx={{ fontSize: "0.85rem" }} />
              {creatingJev ? "Creating..." : "JEV"}
            </Box>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
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
            sellingPrice={p?.dUnitSellingPrice}
            errorMessage={errorMessage}
          />
        </Box>
      </Collapse>

      <Divider sx={{ borderColor: c.divider }} />
    </Box>
  );
}
