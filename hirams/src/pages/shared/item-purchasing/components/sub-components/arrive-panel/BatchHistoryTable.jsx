import React from "react";
import { Box, Typography } from "@mui/material";
import { fmtPHP } from "../../../../../../utils/formatters/formatter";
export default function BatchHistoryTable({
  batches,
  uom,
  c,
  onToggleStatus,
  statusUpdatingId,
  allowActions = true,
  actionableWhenPending = false,
  showStatus = false,
  unitPrice = 0,
  sellingPrice = 0,
  errorMessage = "",
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
  const profitColor = (v) =>
    v < 0 ? c.errorText : v > 0 ? c.greenText : c.textMuted;
  const COLS = {
    no: { width: 28, flexShrink: 0 },
    receipt: { flex: 1, minWidth: 80 },
    qty: { flex: 1, minWidth: 60 },
    sn: { flex: 1, minWidth: 80 },
    status: { flex: 1, minWidth: 70 },
    date: { flex: 1, minWidth: 70 },
    equivalent: { flex: 1, minWidth: 80 },
    profit: { flex: 1, minWidth: 80 },
    action: { flex: 1, minWidth: 70 },
  };
  // Row has a real action only when it's not Active and not a locked Pending row
  const hasAction = (b) =>
    b.cStatus !== "A" && !(b.cStatus === "P" && !actionableWhenPending);

  // Action column only shows if at least one row has a button
  const showActionCol = allowActions && batches.some(hasAction);
  const headerCellSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const bodyCellSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  return (
    <>
      {errorMessage && (
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 600,
            color: c.errorText,
            background: c.errorBg,
            borderRadius: "6px",
            px: 1,
            py: 0.5,
            mb: 0.75,
          }}
        >
          {errorMessage}
        </Typography>
      )}

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
          <Box sx={{ ...COLS.no, ...headerCellSx }}>
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
          <Box sx={{ ...COLS.receipt, ...headerCellSx }}>
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
          <Box sx={{ ...COLS.qty, ...headerCellSx }}>
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
          <Box sx={{ ...COLS.equivalent, ...headerCellSx }}>
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textMuted,
                textTransform: "uppercase",
              }}
            >
              Equivalent
            </Typography>
          </Box>
          <Box sx={{ ...COLS.profit, ...headerCellSx }}>
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textMuted,
                textTransform: "uppercase",
              }}
            >
              Profit
            </Typography>
          </Box>
          <Box sx={{ ...COLS.sn, ...headerCellSx }}>
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
          <Box sx={{ ...COLS.status, ...headerCellSx }}>
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
          <Box sx={{ ...COLS.date, ...headerCellSx }}>
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

          {showActionCol && (
            <Box sx={{ ...COLS.action, ...headerCellSx }}>
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
              <Box sx={{ ...COLS.no, ...bodyCellSx }}>
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: c.textFaint,
                  }}
                >
                  {i + 1}
                </Typography>
              </Box>

              <Box sx={{ ...COLS.receipt, ...bodyCellSx }}>
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
                  ...COLS.qty,
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
              <Box sx={{ ...COLS.equivalent, ...bodyCellSx }}>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: c.textPrimary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {(Number(b.qty || 0) * Number(unitPrice || 0)).toLocaleString(
                    "en-US",
                    { style: "currency", currency: "PHP" },
                  )}
                </Typography>
              </Box>
              <Box sx={{ ...COLS.profit, ...bodyCellSx }}>
                {(() => {
                  const profit =
                    (Number(sellingPrice || 0) - Number(unitPrice || 0)) *
                    Number(b.qty || 0);
                  return (
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: profitColor(profit),
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtPHP(profit)}
                    </Typography>
                  );
                })()}
              </Box>
              <Box sx={{ ...COLS.sn, ...bodyCellSx }}>
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

              <Box sx={{ ...COLS.status, ...bodyCellSx }}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    px: 0.7,
                    py: 0.2,
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

              <Box sx={{ ...COLS.date, ...bodyCellSx }}>
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

              {showActionCol && (
                <Box sx={{ ...COLS.action, ...bodyCellSx }}>
                  {hasAction(b) && (
                    <Box
                      component="button"
                      onClick={() => onToggleStatus?.(b)}
                      disabled={statusUpdatingId === b.nInventoryId}
                      sx={{
                        width: "fit-content",
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        py: 0.35,
                        px: 0.6,
                        borderRadius: "6px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        color: c.pendingText,
                        background: c.pendingBg,
                        border: `1px solid ${c.pendingBorder}`,
                        opacity: statusUpdatingId === b.nInventoryId ? 0.6 : 1,
                        transition: "all 0.15s ease",
                        "&:hover": {
                          background: c.pendingBg,
                          borderColor: c.pendingBorder,
                        },
                        "&:disabled": { cursor: "not-allowed" },
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
    </>
  );
}
