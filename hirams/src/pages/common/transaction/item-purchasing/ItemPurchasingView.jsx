import React, { Children, cloneElement, useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Collapse } from "@mui/material";
import {
  ShoppingCartOutlined,
  UnfoldLess,
  UnfoldMore,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import CustomSearchField from "../../../../components/form/SearchField.jsx";
import PageLayout from "../../../../layouts/page/content-page";
import BaseButton from "../../../../components/form/BaseButton.jsx";
import SyncMenu from "../../../../components/form/SyncMenu.jsx";
import {CartSkeleton} from "../../transaction/purchase-cart/components/Skeleton.jsx";
import CartCardPanel from "../../transaction/purchase-cart/components/CartCardPanel.jsx";
import { TIME_PERIOD_ORDER, TIME_PERIOD_LABELS } from "./useItemPurchasing.js";
import getThemeColors from "../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  borderFaint: c.slate.divider,
  bgCard: c.slate.outerBg,
  bgHeader: c.slate.itemHeaderBg,
  bgHover: c.slate.itemHover,
  bgBadge: c.slate.mutedBg,
  bgBadgeLight: c.slate.summaryBg,
  textMuted: c.gray.textSecondary,
  textMutedAlt: c.gray.textDisabled,
  textBody: c.gray.textHeading,
  iconMuted: c.slate.mutedColor,
  emptyStateBg: c.slate.expandedBg,
  emptyStateIcon: c.skeleton.soft,
});

function TimePeriodGroup({
  period,
  count,
  children,
  defaultOpen = true,
  forceOpen,
  cardsCollapsed,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen !== undefined) setOpen(forceOpen ? defaultOpen : false);
  }, [forceOpen]);

  return (
    <Box
      sx={{
        mb: 0.75,
        borderRadius: "7px",
        border: `0.5px solid ${c.border}`,
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.75,
          py: 1.25,
          background: c.bgHeader,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { background: c.bgHover },
        }}
      >
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: c.textMuted,
            flex: 1,
            lineHeight: 1,
          }}
        >
          {TIME_PERIOD_LABELS[period]}
        </Typography>
        <Box
          sx={{ px: 0.6, py: 0.15, borderRadius: "4px", background: c.bgBadge }}
        >
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 700,
              color: c.textMuted,
              lineHeight: 1,
            }}
          >
            {count}
          </Typography>
        </Box>
        {open ? (
          <ExpandLess sx={{ fontSize: "0.75rem", color: c.iconMuted }} />
        ) : (
          <ExpandMore sx={{ fontSize: "0.75rem", color: c.iconMuted }} />
        )}
      </Box>
      <Collapse in={open}>
        <Box sx={{ p: 0.75 }}>
          {Children.map(children, (child) =>
            child ? cloneElement(child, { collapsed: cardsCollapsed }) : child,
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function renderTimePeriodCards(pos, sharedCardProps) {
  return (
    <>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {pos.map((po) => (
          <CartCardPanel key={po.nPurchaseOrderId} {...sharedCardProps(po)} />
        ))}
      </Box>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          gap: 0.5,
          alignItems: "flex-start",
        }}
      >
        {[0, 1].map((col) => (
          <Box
            key={col}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            {pos
              .filter((_, i) => i % 2 === col)
              .map((po) => (
                <CartCardPanel
                  key={po.nPurchaseOrderId}
                  {...sharedCardProps(po)}
                />
              ))}
          </Box>
        ))}
      </Box>
    </>
  );
}

export default function ItemPurchasingView({
  itemsLoading,
  purchaseOrders,
  filteredPurchaseOrders,
  handleUpdateClick,
  search,
  setSearch,
  allCollapsed,
  setAllCollapsed,
  allOptionHistories,
  vouchersByPO,
  currentUserId,
  itemPurchasingStatus,
  selectedStatusCode,
  cancelPoKey,
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  voucherActiveKey,
  voucherClosedKey,
  fetchAllPurchaseOrders,
  groupedByPeriod,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const sharedCardProps = (po) => ({
    po,
    cartStatus: itemPurchasingStatus,
    addToCartKey,
    cancelPoKey: cancelPoKey ?? "",
    purchaseOrderKey: purchaseOrderKey ?? "",
    paidKey: paidKey ?? "",
    receivedKey: receivedKey ?? "",
    deliveredKey: deliveredKey ?? "",
    removedFromCartKey,
    currentUserId,
    onUpdateClick: handleUpdateClick,
    collapsed: allCollapsed,
    onRemoved: () => fetchAllPurchaseOrders({ bustCache: true }),
    optionHistories: allOptionHistories,
    voucherStatus: vouchersByPO[po.nPurchaseOrderId] ?? null,
    voucherActiveKey: voucherActiveKey ?? "",
    voucherClosedKey: voucherClosedKey ?? "",
  });

  // Simple: filteredPurchaseOrders is already filtered by the selected
  // itemPurchasingStatus code — just render it, grouped by time period.
  const renderTimeGroupedList = () => {
    const renderedPeriods = TIME_PERIOD_ORDER.filter(
      (p) => (groupedByPeriod[p] || []).length > 0,
    );
    return (
      <Box>
        {TIME_PERIOD_ORDER.map((period) => {
          const pos = groupedByPeriod[period] || [];
          if (!pos.length) return null;
          const isFirstPeriod = period === renderedPeriods[0];
          return (
            <TimePeriodGroup
              key={period}
              period={period}
              count={pos.length}
              defaultOpen={isFirstPeriod}
              forceOpen={search.trim() ? true : undefined}
              cardsCollapsed={allCollapsed}
            >
              {renderTimePeriodCards(pos, sharedCardProps)}
            </TimePeriodGroup>
          );
        })}
      </Box>
    );
  };

  return (
    <PageLayout
      title="Item Purchasing"
      subtitle={
        selectedStatusCode && itemPurchasingStatus?.[selectedStatusCode]
          ? `${itemPurchasingStatus[selectedStatusCode]}`
          : ""
      }
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <CustomSearchField
            label="Search PO / Supplier / Item"
            value={search}
            onChange={setSearch}
          />
        </Box>
        <SyncMenu onSync={() => fetchAllPurchaseOrders({ bustCache: true })} />
        <BaseButton
          label={allCollapsed ? "Expand All" : "Collapse All"}
          icon={allCollapsed ? <UnfoldMore /> : <UnfoldLess />}
          actionColor="default"
          onClick={() => setAllCollapsed((v) => !v)}
        />
      </Box>
      {itemsLoading ? (
        <CartSkeleton />
      ) : filteredPurchaseOrders.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "60vh",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: c.emptyStateBg,
              border: `0.5px solid ${c.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCartOutlined
              sx={{ fontSize: "1.5rem", color: c.emptyStateIcon }}
            />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: c.textBody,
                lineHeight: 1.4,
              }}
            >
              No purchase orders found
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: c.textMutedAlt,
                mt: 0.4,
                lineHeight: 1.4,
              }}
            >
              {selectedStatusCode
                ? "No orders match the selected status filter."
                : "Items added to cart will appear here."}
            </Typography>
          </Box>
        </Box>
      ) : (
        renderTimeGroupedList()
      )}
    </PageLayout>
  );
}
