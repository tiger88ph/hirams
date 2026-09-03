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
import { CartSkeleton } from "./components/Skeleton.jsx";
import CartCardPanel from "./components/CartCardPanel.jsx";
import {
  TIME_PERIOD_ORDER,
  TIME_PERIOD_LABELS,
  buildStatusSections,
  buildOpenSection,
  buildCancelledSection,
} from "./usePurchaseCart.js";
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

function SectionGroup({
  title,
  count,
  color,
  bg,
  border,
  children,
  forceOpen,
  isFirst,
  isLast,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen !== undefined) setOpen(forceOpen);
  }, [forceOpen]);

  const headerBg = isDark ? c.bgHeader : bg;

  return (
    <Box
      sx={{
        borderBottom: isLast ? "none" : `1px solid ${c.border}`,
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1.5,
          background: headerBg,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": {
            filter: isDark ? "brightness(1.15)" : "brightness(0.97)",
          },
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: isDark ? c.textBody : color,
            flex: 1,
            lineHeight: 1,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            px: 0.75,
            py: 0.2,
            borderRadius: "5px",
            background: c.bgBadgeLight,
            border: `0.5px solid ${border || c.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: isDark ? c.textBody : color,
              lineHeight: 1,
            }}
          >
            {count}
          </Typography>
        </Box>
        {open ? (
          <ExpandLess
            sx={{ fontSize: "0.9rem", color: isDark ? c.textMuted : color }}
          />
        ) : (
          <ExpandMore
            sx={{ fontSize: "0.9rem", color: isDark ? c.textMuted : color }}
          />
        )}
      </Box>
      <Collapse in={open}>
        <Box sx={{ p: 1, background: c.bgCard }}>
          {Children.toArray(children)
            .filter(Boolean)
            .map((child) =>
              child.type === TimePeriodGroup
                ? cloneElement(child, { forceOpen: open })
                : child,
            )}
        </Box>
      </Collapse>
    </Box>
  );
}

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

export default function PurchaseCartView({
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
  cartStatus,
  selectedStatusCode,
  cancelPoKey,
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  openCartKey,
  closeCartKey,
  cancelCartKey,
  voucherActiveKey,
  voucherClosedKey,
  fetchAllPurchaseOrders,
  groupedClosedPOs,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const sharedCardProps = (po) => ({
    po,
    cartStatus,
    addToCartKey,
    cancelCartKey,
    cancelPoKey: cancelPoKey ?? "",
    purchaseOrderKey: purchaseOrderKey ?? "",
    paidKey: paidKey ?? "",
    receivedKey: receivedKey ?? "",
    deliveredKey: deliveredKey ?? "",
    removedFromCartKey,
    currentUserId,
    openCartKey: openCartKey ?? "",
    closeCartKey: closeCartKey ?? "",
    onUpdateClick: handleUpdateClick,
    collapsed: allCollapsed,
    onRemoved: () => fetchAllPurchaseOrders({ bustCache: true }),
    optionHistories: allOptionHistories,
    voucherStatus: vouchersByPO[po.nPurchaseOrderId] ?? null,
    voucherActiveKey: voucherActiveKey ?? "",
    voucherClosedKey: voucherClosedKey ?? "",
  });

  const renderSectionTimePeriods = (byPeriod) => {
    const renderedPeriods = TIME_PERIOD_ORDER.filter(
      (p) => (byPeriod[p] || []).length > 0,
    );
    return TIME_PERIOD_ORDER.map((period) => {
      const pos = byPeriod[period] || [];
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
    });
  };

  const renderGroupedClosedCart = () => {
    if (!groupedClosedPOs) return null;
    if (selectedStatusCode === openCartKey) {
      const section = buildOpenSection(addToCartKey);
      const byPeriod = groupedClosedPOs[section.key] || {};
      const totalCount = Object.values(byPeriod).reduce(
        (s, arr) => s + arr.length,
        0,
      );
      return (
        <Box
          sx={{
            border: `1px solid ${c.border}`,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionGroup
            title={section.label}
            count={totalCount}
            color={section.color}
            bg={section.bg}
            border={section.border}
            isFirst
            isLast
            forceOpen={search.trim() ? true : totalCount > 0}
          >
            {renderSectionTimePeriods(byPeriod)}
          </SectionGroup>
        </Box>
      );
    }
    if (selectedStatusCode === cancelCartKey) {
      const section = buildCancelledSection(cancelPoKey);
      const byPeriod = groupedClosedPOs[section.key] || {};
      const totalCount = Object.values(byPeriod).reduce(
        (s, arr) => s + arr.length,
        0,
      );
      return (
        <Box
          sx={{
            border: `1px solid ${c.border}`,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionGroup
            title={section.label}
            count={totalCount}
            color={section.color}
            bg={section.bg}
            border={section.border}
            isFirst
            isLast
            forceOpen={search.trim() ? true : totalCount > 0}
          >
            {renderSectionTimePeriods(byPeriod)}
          </SectionGroup>
        </Box>
      );
    }
    const statusSections = buildStatusSections(
      addToCartKey,
      purchaseOrderKey,
      paidKey,
      receivedKey,
      deliveredKey,
    );
    return (
      <Box
        sx={{
          border: `1px solid ${c.border}`,
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {statusSections.map((section, idx) => {
          const periods = groupedClosedPOs[section.key] || {};
          const totalCount = Object.values(periods).reduce(
            (s, arr) => s + arr.length,
            0,
          );
          const isFirst = idx === 0;
          const isLast = idx === statusSections.length - 1;
          return (
            <SectionGroup
              key={section.key}
              title={section.label}
              count={totalCount}
              color={section.color}
              bg={section.bg}
              border={section.border}
              isFirst={isFirst}
              isLast={isLast}
              forceOpen={search.trim() ? true : totalCount > 0}
            >
              {totalCount === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: c.textMutedAlt,
                      fontWeight: 500,
                    }}
                  >
                    No Cart Available
                  </Typography>
                </Box>
              ) : (
                renderSectionTimePeriods(periods)
              )}
            </SectionGroup>
          );
        })}
      </Box>
    );
  };

  const renderRegularList = () => (
    <>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 0.5,
          width: "100%",
        }}
      >
        {filteredPurchaseOrders.map((po) => (
          <CartCardPanel key={po.nPurchaseOrderId} {...sharedCardProps(po)} />
        ))}
      </Box>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          gap: 0.5,
          width: "100%",
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
            {filteredPurchaseOrders
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

  const isGroupedView =
    selectedStatusCode === closeCartKey ||
    selectedStatusCode === openCartKey ||
    selectedStatusCode === cancelCartKey;

  return (
    <PageLayout
      title="Purchase Cart"
      subtitle={
        selectedStatusCode && cartStatus?.[selectedStatusCode]
          ? `${cartStatus[selectedStatusCode]}`
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
      ) : isGroupedView ? (
        renderGroupedClosedCart()
      ) : (
        renderRegularList()
      )}
    </PageLayout>
  );
}
