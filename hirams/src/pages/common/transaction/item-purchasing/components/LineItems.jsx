import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";

import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import CartRowPanel from "./CartRowPanel.jsx";

const useColors = (c) => ({
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  border: c.slate.border,
  scrollbarThumb: c.slate.scrollbarThumb,
});

export const IconBox = ({
  size = 34,
  bg,
  border,
  radius = "8px",
  mr = 1,
  children,
  sx = {},
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg || c.mutedBg,
        border: border || `0.5px solid ${c.mutedBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        mr,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default function LineItems({
  options,
  cartKey,
  forApprovalKey,
  forPaymentKey,
  pendingReceiptKey,
  forDeliveryKey,
  deliveredKey,
  removedFromCartKey,
  currentUserId,
  onRemoved,
  poStatus,
  anyOptionArrived,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const [removingOptionId, setRemovingOptionId] = useState(null);
  const [inventoryRows, setInventoryRows] = useState({});

  const handleRemoveOption = async (nPurchaseItemId) => {
    setRemovingOptionId(nPurchaseItemId);
    try {
      await PurchaseOrderAPI.removeFromCart({
        nPurchaseItemId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement: true,
      });
      if (options.length <= 1) {
        window.dispatchEvent(new CustomEvent("cart_data_updated"));
        navigate("/item-purchasing");
        return;
      }
      await onRemoved?.();
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    } finally {
      setRemovingOptionId(null);
    }
  };

  useEffect(() => {
    const isArrivedStatus = [
      forPaymentKey,
      pendingReceiptKey,
      forDeliveryKey,
      deliveredKey,
    ]
      .map(String)
      .includes(String(poStatus));
    if (!isArrivedStatus) return;

    const arrivedOptionIds = options
      .map((opt) => opt.purchase_option?.nPurchaseItemId)
      .filter(Boolean);
    if (arrivedOptionIds.length === 0) return;
    const fetchAll = async () => {
      const results = {};
      for (const id of arrivedOptionIds) {
        try {
          const res = await InventoryAPI.getHistory(id);
          results[id] = res?.rows || res?.inventory || [];
        } catch (e) {
          results[id] = [];
        }
      }
      setInventoryRows(results);
    };
    fetchAll();
  }, [
    options,
    poStatus,
    forPaymentKey,
    pendingReceiptKey,
    forDeliveryKey,
    deliveredKey,
  ]);

  const localTotal = options.reduce(
    (sum, o) =>
      sum +
      (o.purchase_option?.nQuantity || 0) *
        (o.purchase_option?.dUnitPrice || 0),
    0,
  );
  const localEwtTotal = options.reduce(
    (sum, o) => sum + Number(o.purchase_option?.dEWT || 0),
    0,
  );
  const hasAnyEWT = options.some((o) => o.purchase_option?.dEWT);

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: "10px",
        border: `0.5px solid ${c.border}`,
        overflowY: "auto",
        maxHeight: "50vh",
        "&::-webkit-scrollbar": { height: 5, width: 3 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: c.scrollbarThumb,
          borderRadius: 2,
        },
      }}
    >
      {options.map((optRow, idx) => {
        const p = optRow.purchase_option;
        const nPurchaseItemId = p?.nPurchaseItemId;
        const showRemove = String(poStatus) === String(cartKey);
        const showArrived = [pendingReceiptKey, forDeliveryKey, deliveredKey]
          .map(String)
          .includes(String(poStatus));
        const isAtPurchaseOrderStage =
          String(poStatus) === String(cartKey) ||
          String(poStatus) === String(forApprovalKey) ||
          String(poStatus) === String(forPaymentKey);
        const showQty = true;

        const showPOPricing = isAtPurchaseOrderStage && !showArrived;
        let arrivedStats = null;
        if (showArrived) {
          const allRows = inventoryRows[nPurchaseItemId] || [];
          const sumBy = (test) =>
            allRows
              .filter(test)
              .reduce((sum, r) => sum + Math.abs(Number(r.nQuantity) || 0), 0);
          const pendingRcvd = sumBy(
            (r) =>
              Number(r.nQuantity) > 0 && String(r.cStatus || "").trim() === "P",
          );
          const approvedRcvdSum = sumBy(
            (r) =>
              Number(r.nQuantity) > 0 && String(r.cStatus || "").trim() === "A",
          );
          const pendingDlvd = sumBy(
            (r) =>
              Number(r.nQuantity) < 0 && String(r.cStatus || "").trim() === "P",
          );
          const approvedDlvdSum = sumBy(
            (r) =>
              Number(r.nQuantity) < 0 && String(r.cStatus || "").trim() === "A",
          );
          arrivedStats = {
            totalQty: p?.nQuantity || 0,
            approvedRcvd: p?.nInventoryQty || approvedRcvdSum,
            pendingRcvd,
            approvedDlvd: p?.nDeliveredQty || approvedDlvdSum,
            pendingDlvd,
          };
        }

        return (
          <CartRowPanel
            key={optRow.nPurchaseOrder_ItemId ?? idx}
            variant="item"
            opt={optRow}
            idx={idx}
            totalCount={options.length}
            colors={base}
            showRemove={showRemove}
            isRemoving={removingOptionId === nPurchaseItemId}
            removingOptionId={removingOptionId}
            onRemove={handleRemoveOption}
            hasAnyEWT={hasAnyEWT}
            showQty={showQty}
            showPricing={showPOPricing}
            poIsPaidRcvdDvrd={showArrived}
            arrivedStats={arrivedStats}
          />
        );
      })}
      {!anyOptionArrived && (
        <CartRowPanel
          variant="total"
          colors={base}
          itemCount={options.length}
          totalAmount={localTotal}
          ewtAmount={localEwtTotal}
        />
      )}
    </Box>
  );
}
