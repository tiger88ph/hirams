import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  RemoveShoppingCart,
  Inventory2Outlined,
  ReceiptLongOutlined,
  VisibilityOutlined,
  AddOutlined,
  LocalShippingOutlined,
} from "@mui/icons-material";
import { fmtPHP, fmtDate } from "../../../../../utils/formatters/formatter";
import { IconBox } from "./LineItems.jsx";
import ProgressBar from "../../../../../components/form/ProgressBar.jsx";
const useColors = (c) => ({
  border: c.slate.border,
  divider: c.slate.divider,
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  mutedColor: c.slate.mutedColor,
  mutedText: c.slate.mutedText,
  itemHeaderBg: c.slate.itemHeaderBg,
  itemHover: c.slate.itemHover,
  innerBg: c.slate.innerBg,
  totalBg: c.slate.totalBg,
  totalBorder: c.slate.totalBorder,
  outerBg: c.slate.outerBg,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textHeading: c.gray.textHeading,
  textMuted: c.gray.textMuted,
  labelMuted: c.gray.textMuted,
  blueText: c.blue.text,
  blueTextStrong: c.blue.textStrong,
  blueBg: c.blue.bg,
  blueBorder: c.blue.border,
  redText: c.red.text,
  redBg: c.red.bg,
  redBorder: c.red.border,
  orangeText: c.orange.text,
  greenText: c.green.text,
  amberWarnText: c.amber.warnText,
  // Received colors
  receivedBadgeBg: c.blue.bg,
  receivedBadgeBorder: c.blue.border,
  receivedBadgeText: c.blue.text,
  receivedButtonColor: c.blue.textStrong,
  snText: c.blue.text,
  // Delivered colors
  deliveredBadgeBg: c.green.bg,
  deliveredBadgeBorder: c.green.border,
  deliveredBadgeText: c.green.text,
  deliveredButtonColor: c.green.text,
});

const HeaderCell = ({ label, width, c }) => (
  <Box sx={{ minWidth: width, textAlign: "center" }}>
    <Typography
      sx={{
        fontSize: "0.55rem",
        fontWeight: 700,
        color: c.textSecondary,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const StatRow = ({ label, value, total, pending, activeColor, c }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "baseline",
      gap: 0.2,
      justifyContent: "flex-end",
      whiteSpace: "nowrap",
    }}
  >
    {pending > 0 && (
      <Typography
        sx={{
          textTransform: "uppercase",
          fontSize: "0.45rem",
          fontWeight: 700,
          color: c.amberWarnText,
          lineHeight: 1,
        }}
      >
        Pending {pending} -
      </Typography>
    )}
    <Typography
      sx={{
        fontSize: "0.48rem",
        fontWeight: 700,
        color: c.textSecondary,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.62rem",
        fontWeight: 700,
        color: value > 0 ? activeColor : c.textSecondary,
        lineHeight: 1,
      }}
    >
      {value}/{total}
    </Typography>
  </Box>
);

// Same total width for every action slot — split into two equal halves.
// Left half triggers the action (receive/deliver), right half opens the view/history.
// Neither half is ever hidden — they're disabled instead when unavailable.
const SplitActionButton = ({
  actionIcon,
  actionLabel,
  onAction,
  actionDisabled,
  viewIcon,
  viewLabel = "VIEW",
  onView,
  viewDisabled,
  bg,
  border,
  color,
}) => (
  <Box
    sx={{
      display: "flex",
      width: { xs: "100%", sm: 250 },
      borderRadius: "6px",
      border: `1px solid ${border}`,
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <Box
      onClick={actionDisabled ? undefined : onAction}
      sx={{
        flex: 1, // left half — RECEIVE / DELIVER
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.35,
        py: 0.15, // less vertical padding
        cursor: actionDisabled ? "not-allowed" : "pointer",
        opacity: actionDisabled ? 0.5 : 1,
        background: bg,
        borderRight: `1px solid ${border}`,
        transition: "background 0.15s",
        "&:hover": actionDisabled ? {} : { background: border },
      }}
    >
      {React.cloneElement(actionIcon, { sx: { fontSize: "0.9rem", color } })}
      <Typography
        sx={{
          fontSize: "0.58rem", // bigger label
          fontWeight: 700,
          letterSpacing: "0.02em",
          color,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {actionLabel}
      </Typography>
    </Box>
    <Box
      onClick={viewDisabled ? undefined : onView}
      sx={{
        flex: 1, // right half — VIEW
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.35,
        py: 0.15, // less vertical padding
        cursor: viewDisabled ? "not-allowed" : "pointer",
        opacity: viewDisabled ? 0.5 : 1,
        background: bg,
        transition: "background 0.15s",
        "&:hover": viewDisabled ? {} : { background: border },
      }}
    >
      {React.cloneElement(viewIcon, { sx: { fontSize: "0.9rem", color } })}
      <Typography
        sx={{
          fontSize: "0.58rem", // bigger label
          fontWeight: 700,
          letterSpacing: "0.02em",
          color,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {viewLabel}
      </Typography>
    </Box>
  </Box>
);
export default function CartRowPanel({
  opt,
  idx,
  totalCount,
  colors,
  isRemoving,
  showRemove,
  onRemove,
  removingOptionId,
  hasAnyEWT,
  showQty = true,
  poIsPaidRcvdDvrd,
  arrivedStats = null,
  onViewArrived = null,
  onStartReceived = null,
  onStartDelivered = null,
  onOpenReceivedHistory = null,
  onOpenDeliveredHistory = null,
  receivedHistoryRows = [],
  deliveredHistoryRows = [],
  variant = "item",
  itemCount,
  totalAmount,
  ewtAmount = 0,
}) {
  const c = React.useMemo(() => useColors(colors), [colors]);

  // ── TOTAL ROW VARIANT ──
  if (variant === "total") {
    return (
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: c.totalBg,
          borderRadius: 1,
          position: "sticky",
          bottom: 0,
          zIndex: 5,
          borderTop: `0.5px solid ${c.totalBorder}`,
        }}
      >
        <IconBox>
          <ReceiptLongOutlined
            sx={{ fontSize: "0.85rem", color: c.textSecondary }}
          />
        </IconBox>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: c.textHeading,
              lineHeight: 1.2,
            }}
          >
            Order Total
          </Typography>
          <Typography
            sx={{ fontSize: "0.54rem", color: c.textMuted, lineHeight: 1.2 }}
          >
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ width: 44, flexShrink: 0 }} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            flexShrink: 0,
            mr: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: c.orangeText,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              textAlign: "right",
            }}
          >
            {fmtPHP(totalAmount)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.57rem",
              fontWeight: 500,
              fontStyle: "italic",
              color: c.textSecondary,
              textAlign: "right",
              lineHeight: 1.4,
            }}
          >
            {ewtAmount > 0 ? `EWT: ${fmtPHP(ewtAmount)}` : "No EWT"}
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── ITEM ROW VARIANT ──
  const p = opt.purchase_option;
  const tx = p?.transaction_item?.transaction;
  const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
  const txnCode = tx?.strCode ?? "—";
  const deliveryDate = fmtDate(tx?.dtDelivery) || "—";
  const ewtValue = p?.dEWT;

  const isReceivedEdit = (p?.nInventoryQty || 0) > 0;
  const isDeliveredEdit = (p?.nDeliveredQty || 0) > 0;
  const isReceivedFull =
    (p?.nQuantity || 0) > 0 && (p?.nInventoryQty || 0) >= (p?.nQuantity || 0);
  const isDeliveredFull =
    (p?.nQuantity || 0) > 0 && (p?.nDeliveredQty || 0) >= (p?.nQuantity || 0);
  const noReceivedYet = (p?.nInventoryQty || 0) === 0;

  const removeSpinner = (
    <Box
      sx={{
        width: 22,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          border: `1.5px solid ${c.redText}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
    </Box>
  );

  const removeButton = (
    <IconButton
      size="small"
      disabled={removingOptionId !== null}
      onClick={() => onRemove(p?.nPurchaseItemId)}
      sx={{
        width: { xs: 18, sm: 20 },
        height: { xs: 18, sm: 20 },
        color: c.redText,
        opacity: removingOptionId ? 0.4 : 0.6,
        "&:hover": { background: c.redBg, opacity: 1 },
        border: `0.5px solid ${c.redBorder}`,
        borderRadius: "50px",
        p: 0,
        m: 1,
      }}
      title="Remove from cart"
    >
      <RemoveShoppingCart sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }} />
    </IconButton>
  );

  const removeBtn = showRemove
    ? isRemoving
      ? removeSpinner
      : removeButton
    : null;
  const receivedHasView = isReceivedEdit || receivedHistoryRows.length > 0;
  const receivedActions = (
    <SplitActionButton
      actionIcon={<AddOutlined />}
      actionLabel="RECEIVE"
      onAction={onStartReceived}
      actionDisabled={isReceivedFull}
      viewIcon={<VisibilityOutlined />}
      viewLabel={`VIEW (${p?.nInventoryQty ?? 0}/${p?.nQuantity || 0})`}
      onView={onOpenReceivedHistory}
      viewDisabled={!receivedHasView}
      bg={c.receivedBadgeBg}
      border={c.receivedBadgeBorder}
      color={c.receivedButtonColor}
    />
  );

  const deliveredHasView = isDeliveredEdit || deliveredHistoryRows.length > 0;

  const deliveredActions = (p?.nInventoryQty || 0) > 0 && (
    <SplitActionButton
      actionIcon={<LocalShippingOutlined />}
      actionLabel="DELIVER"
      onAction={onStartDelivered}
      actionDisabled={noReceivedYet || isDeliveredFull}
      viewIcon={<VisibilityOutlined />}
      viewLabel={`VIEW (${p?.nDeliveredQty ?? 0}/${p?.nQuantity || 0})`}
      onView={onOpenDeliveredHistory}
      viewDisabled={!deliveredHasView}
      bg={c.deliveredBadgeBg}
      border={c.deliveredBadgeBorder}
      color={c.deliveredButtonColor}
    />
  );
  return (
    <>
      {/* Sticky header — first row only, hidden once PO is paid/received/delivered */}
      {idx === 0 && !poIsPaidRcvdDvrd && (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            justifyContent: "space-between",
            background: c.itemHeaderBg,
            borderBottom: `0.5px solid ${c.divider}`,
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}
          >
            <Box sx={{ width: 26, flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: c.textSecondary,
                letterSpacing: "0.03em",
              }}
            >
              ITEMS
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2.2,
              flexShrink: 0,
            }}
          >
            {hasAnyEWT && !poIsPaidRcvdDvrd && (
              <HeaderCell label="EWT" width={60} c={c} />
            )}
            {arrivedStats || poIsPaidRcvdDvrd ? (
              <HeaderCell label="STATUS" width={100} c={c} />
            ) : (
              <>
                {showQty && <HeaderCell label="QTY" width={50} c={c} />}
                <HeaderCell label="UNIT PRICE" width={75} c={c} />
                <HeaderCell label="TOTAL" width={70} c={c} />
              </>
            )}
            {showRemove && <Box sx={{ width: 28, flexShrink: 0 }} />}
            {onViewArrived && <Box sx={{ width: 150, flexShrink: 0 }} />}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          borderBottom:
            idx < totalCount - 1 ? `0.5px solid ${c.divider}` : "none",
          "&:hover": { background: c.itemHover },
          transition: "background 0.15s",
        }}
      >
        <Box
          sx={{
            position: "relative",
            px: 2,
            py: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 0.75, sm: 2 },
            justifyContent: "space-between",
          }}
        >
          {/* Mobile-only remove button */}
          {showRemove && (
            <Box
              sx={{
                display: { xs: "flex", sm: "none" },
                position: "absolute",
                top: 4,
                right: 4,
                zIndex: 1,
              }}
            >
              {removeBtn}
            </Box>
          )}

          {/* COLUMN 1 — Item Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: { sm: "1 1 0" },
              minWidth: 0,
              pr: { xs: showRemove ? 3.5 : 0, sm: 0 },
            }}
          >
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                  background: c.mutedBg,
                  border: `0.5px solid ${c.mutedBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Inventory2Outlined
                  sx={{ fontSize: "0.75rem", color: c.mutedColor }}
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
                  background: c.textSecondary,
                  border: `1.5px solid ${c.outerBg}`,
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
                      fontSize: { xs: "0.38rem", sm: "0.45rem" },
                      fontWeight: 500,
                      color: c.blueTextStrong,
                      lineHeight: 1,
                    }}
                  >
                    {txnCode}
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
                  color: c.mutedColor,
                  lineHeight: 1,
                  mt: 0.15,
                }}
              >
                Delivery: {deliveryDate}
              </Typography>
            </Box>
          </Box>

          {/* COLUMN 2 — Progress bars (received / delivered), only when tracked */}
          {onViewArrived && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                flex: { sm: "1 1 0" },
                width: { xs: "100%", sm: "auto" },
                minWidth: { sm: 160 },
              }}
            >
              <ProgressBar
                value={
                  p?.nQuantity
                    ? Math.round(((p?.nInventoryQty || 0) / p.nQuantity) * 100)
                    : 0
                }
                height={14}
                tone="blue"
              />
              <ProgressBar
                value={
                  p?.nQuantity
                    ? Math.round(((p?.nDeliveredQty || 0) / p.nQuantity) * 100)
                    : 0
                }
                height={14}
                tone="green"
              />
            </Box>
          )}

          <Box
            sx={{
              display: { xs: "grid", sm: "flex" },
              gridTemplateColumns: { xs: "repeat(4, 1fr)" },
              gap: { xs: 0.5, sm: 2 },
              alignItems: "center",
              justifyContent: { xs: "space-between", sm: "flex-end" },
              width: { xs: "100%", sm: "auto" },
              flexShrink: 0,
            }}
          >
            {hasAnyEWT && !poIsPaidRcvdDvrd && (
              <Box sx={{ minWidth: { sm: 60 }, textAlign: "right" }}>
                <Typography
                  sx={{
                    display: { xs: "block", sm: "none" },
                    fontSize: "0.45rem",
                    color: c.textSecondary,
                    lineHeight: 1,
                    mb: 0.1,
                  }}
                >
                  EWT
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: c.textSecondary,
                    lineHeight: 1,
                  }}
                >
                  {ewtValue ? fmtPHP(ewtValue) : "—"}
                </Typography>
              </Box>
            )}

            {!poIsPaidRcvdDvrd && (
              <>
                <Box sx={{ minWidth: { sm: 50 }, textAlign: "right" }}>
                  <Typography
                    sx={{
                      display: { xs: "block", sm: "none" },
                      fontSize: "0.45rem",
                      color: c.textSecondary,
                      lineHeight: 1,
                      mb: 0.1,
                    }}
                  >
                    QTY
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: c.textSecondary,
                      lineHeight: 1,
                    }}
                  >
                    {p?.nQuantity}{" "}
                    <Typography
                      component="span"
                      sx={{ fontSize: "0.50rem", color: c.textSecondary }}
                    >
                      {p?.strUOM}
                    </Typography>
                  </Typography>
                </Box>

                <Box sx={{ minWidth: { sm: 70 }, textAlign: "right" }}>
                  <Typography
                    sx={{
                      display: { xs: "block", sm: "none" },
                      fontSize: "0.45rem",
                      color: c.textSecondary,
                      lineHeight: 1,
                      mb: 0.1,
                    }}
                  >
                    Unit Price
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: c.textSecondary,
                      lineHeight: 1,
                    }}
                  >
                    {fmtPHP(p?.dUnitPrice)}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: { sm: 70 }, textAlign: "right" }}>
                  <Typography
                    sx={{
                      display: { xs: "block", sm: "none" },
                      fontSize: "0.45rem",
                      color: c.textSecondary,
                      lineHeight: 1,
                      mb: 0.1,
                    }}
                  >
                    Total
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: c.orangeText,
                      lineHeight: 1,
                    }}
                  >
                    {fmtPHP(lineTotal)}
                  </Typography>
                </Box>
              </>
            )}

            {!onViewArrived && arrivedStats ? (
              <Box
                sx={{
                  minWidth: { sm: 100 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                }}
              >
                <StatRow
                  label="RECEIVED"
                  value={arrivedStats.approvedRcvd}
                  pending={arrivedStats.pendingRcvd}
                  total={arrivedStats.totalQty}
                  activeColor={c.blueTextStrong}
                  c={c}
                />
                <StatRow
                  label="DELIVERED"
                  value={arrivedStats.approvedDlvd}
                  pending={arrivedStats.pendingDlvd}
                  total={arrivedStats.totalQty}
                  activeColor={c.greenText}
                  c={c}
                />
              </Box>
            ) : (
              !onViewArrived &&
              poIsPaidRcvdDvrd && (
                <Box
                  sx={{
                    minWidth: { sm: 100 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                  }}
                >
                  <StatRow
                    label="RECEIVED"
                    value={p?.nInventoryQty || 0}
                    pending={0}
                    total={p?.nQuantity || 0}
                    activeColor={c.blueTextStrong}
                    c={c}
                  />
                  <StatRow
                    label="DELIVERED"
                    value={p?.nDeliveredQty || 0}
                    pending={0}
                    total={p?.nQuantity || 0}
                    activeColor={c.greenText}
                    c={c}
                  />
                </Box>
              )
            )}

            {showRemove && (
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  width: 28,
                  justifyContent: "center",
                }}
              >
                {removeBtn}
              </Box>
            )}

            {onViewArrived && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.4,
                  alignItems: { xs: "stretch", sm: "flex-end" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {receivedActions}
                {deliveredActions}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
