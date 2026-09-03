import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import PurchaseItemHistoriesAPI from "../../../../../api/endpoints/purchase-item-histories.api.js";
import LineItemPanel from "./LineItemPanel.jsx";
import UpdateReceivedModal from "../modal/UpdateReceivedModal.jsx";
import UpdateDeliveredModal from "../modal/UpdateDeliveredModal.jsx";
import QuantityHistoryModal from "../modal/QuantityHistoryModal.jsx";
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
  onPatchOption,
  total,
  openCartKey,
  closeCartKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  currentUserId,
  nPurchaseOrderId,
  onRemoved,
  poStatus,
  optionHistories,
  onArrivedViewChange,
  onFooterActionsChange,
  onSavingChange,
  purchaseOrderKey,
  addToCartKey,
  poNumber,
  anyOptionArrived,
  initialArrivedOptionId,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const patchOption = (nPurchaseOptionId, patch) => {
    onPatchOption?.(nPurchaseOptionId, patch);
  };
  const [removingOptionId, setRemovingOptionId] = useState(null);
  const [arrivedOptionId, setArrivedOptionId] = useState(null);
  const [receivedHistoryRows, setReceivedHistoryRows] = useState([]);
  const [deliveredHistoryRows, setDeliveredHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [inventoryRows, setInventoryRows] = useState({});
  const [receivedModalOpen, setReceivedModalOpen] = useState(false);
  const [deliveredModalOpen, setDeliveredModalOpen] = useState(false);
  const [globalLatestReceipt, setGlobalLatestReceipt] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalTone, setHistoryModalTone] = useState("received");

  const arrivedItem = useMemo(() => {
    if (arrivedOptionId == null) return null;
    const opt = options.find(
      (o) => o.purchase_option?.nPurchaseOptionId === arrivedOptionId,
    );
    return opt ? { opt, p: opt.purchase_option } : null;
  }, [arrivedOptionId, options]);

  useEffect(() => {
    if (initialArrivedOptionId == null) return;
    const exists = options.some(
      (o) => o.purchase_option?.nPurchaseOptionId === initialArrivedOptionId,
    );
    if (exists) {
      setArrivedOptionId(initialArrivedOptionId);
      onArrivedViewChange?.(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArrivedOptionId, options]);

  const fetchInventoryHistory = async (nPurchaseOptionId) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await InventoryAPI.getHistory(nPurchaseOptionId);
      const rows = res?.rows || res?.inventory || [];
      const received = rows
        .filter((r) => Number(r.nQuantity) > 0)
        .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog));
      const delivered = rows
        .filter((r) => Number(r.nQuantity) < 0)
        .map((r) => ({ ...r, nQuantity: Math.abs(Number(r.nQuantity)) }))
        .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog));
      setReceivedHistoryRows(received);
      setDeliveredHistoryRows(delivered);
    } catch (err) {
      console.error("Failed to fetch inventory history:", err);
      setHistoryError("Failed to load history. Please try again.");
      setReceivedHistoryRows([]);
      setDeliveredHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (arrivedItem?.p?.nPurchaseOptionId)
      fetchInventoryHistory(arrivedItem.p.nPurchaseOptionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedItem?.p?.nPurchaseOptionId]);

  const toggleRowStatus = async (
    row,
    nPurchaseOptionId,
    isReceivedRow,
    deliveredQtyForOption,
    uom = "",
  ) => {
    const activeStatus = "A";
    const newStatus = row.cStatus === "C" ? activeStatus : "C";
    if (
      isReceivedRow &&
      newStatus === "C" &&
      (deliveredQtyForOption || 0) > 0
    ) {
      setStatusError(
        `${deliveredQtyForOption} ${uom} has been delivered. Please cancel the DR first if you need to.`,
      );
      return;
    }
    setStatusError("");
    setStatusUpdatingId(row.nInventoryId);
    try {
      await InventoryAPI.updateInventory(row.nInventoryId, {
        cStatus: newStatus,
      });
      await fetchInventoryHistory(nPurchaseOptionId);
      const delta =
        (newStatus === activeStatus ? 1 : -1) *
        Math.abs(Number(row.nQuantity) || 0);
      patchOption(nPurchaseOptionId, {
        [isReceivedRow ? "nInventoryQty" : "nDeliveredQty"]:
          Math.max(
            0,
            (isReceivedRow
              ? arrivedItem?.p?.nInventoryQty
              : arrivedItem?.p?.nDeliveredQty) ?? 0,
          ) + delta,
      });
      await PurchaseOrderAPI.syncStatus({
        nPurchaseOrderId,
        nPurchaseOptionId,
        nUserId: currentUserId,
        nReceivedStatus: receivedKey,
        nDeliveredStatus: deliveredKey,
        nPaidStatus: paidKey,
      });
      try {
        const histRes = await PurchaseItemHistoriesAPI.getLatest({
          nPurchaseOptionId: [nPurchaseOptionId],
        });
        if (histRes?.histories?.[0])
          window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      } catch (histErr) {
        console.error("Failed to refresh option history:", histErr);
      }
    } catch (err) {
      console.error("Failed to update inventory status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  useEffect(() => {
    const handler = () => {
      if (arrivedItem?.p?.nPurchaseOptionId)
        fetchInventoryHistory(arrivedItem.p.nPurchaseOptionId);
    };
    window.addEventListener("inventory_data_updated", handler);
    return () => window.removeEventListener("inventory_data_updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedItem?.p?.nPurchaseOptionId]);

  const handleRemoveOption = async (nPurchaseOptionId) => {
    setRemovingOptionId(nPurchaseOptionId);
    try {
      await PurchaseOrderAPI.removeFromCart({
        nPurchaseOptionId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement: true,
      });
      if (options.length <= 1) {
        window.dispatchEvent(new CustomEvent("cart_data_updated"));
        navigate("/cart");
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
    if (!deliveredModalOpen) return;
    const supplierId = arrivedItem?.p?.supplier?.nSupplierId;
    InventoryAPI.getLatestDeliveredReceipt(
      supplierId ? { nSupplierId: supplierId } : {},
    )
      .then((res) => setGlobalLatestReceipt(res?.strReceiptNumber ?? null))
      .catch((err) => {
        console.error("Failed to fetch latest delivered receipt:", err);
        setGlobalLatestReceipt(null);
      });
  }, [deliveredModalOpen, arrivedItem?.p?.supplier?.nSupplierId]);

  useEffect(() => {
    const arrivedOptionIds = options
      .filter((opt) => {
        const p = opt.purchase_option;
        const h = optionHistories[Number(p?.nPurchaseOptionId)];
        return (
          String(h?.nStatus) === String(paidKey) ||
          String(h?.nStatus) === String(receivedKey) ||
          String(h?.nStatus) === String(deliveredKey)
        );
      })
      .map((opt) => opt.purchase_option?.nPurchaseOptionId)
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
  }, [options, optionHistories, paidKey, receivedKey, deliveredKey]);

  const opt = arrivedItem?.opt;
  const p = arrivedItem?.p;
  const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
  const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
  const isReceivedEdit = (p?.nInventoryQty || 0) > 0;
  const isDeliveredEdit = (p?.nDeliveredQty || 0) > 0;
  const deliveredMax = Math.max(
    0,
    (p?.nInventoryQty || 0) - (p?.nDeliveredQty || 0),
  );
  const isReceivedFull =
    (p?.nQuantity || 0) > 0 && (p?.nInventoryQty || 0) >= (p?.nQuantity || 0);
  const isReceivedSingle = !isReceivedFull && maxQty === 1;
  const isDeliveredFull =
    (p?.nQuantity || 0) > 0 && (p?.nDeliveredQty || 0) >= (p?.nQuantity || 0);
  const isDeliveredSingle =
    !isDeliveredFull && (p?.nInventoryQty || 0) > 0 && deliveredMax === 1;
  const receivedSNRemaining = Math.max(
    0,
    (p?.nInventoryQty || 0) - (p?.receivedSerialNumbers?.length || 0),
  );
  const deliveredSNRemaining = Math.max(
    0,
    (p?.nDeliveredQty || 0) - (p?.deliveredSerialNumbers?.length || 0),
  );

  const startReceived = () => setReceivedModalOpen(true);
  const startDelivered = () => {
    if ((p?.nInventoryQty || 0) === 0) return;
    setDeliveredModalOpen(true);
  };
  const openReceivedHistory = () => {
    setHistoryModalTone("received");
    setHistoryModalOpen(true);
  };
  const openDeliveredHistory = () => {
    setHistoryModalTone("delivered");
    setHistoryModalOpen(true);
  };
  const closeHistoryModal = () => setHistoryModalOpen(false);
  const resetFormState = (clearAll = false) => {
    if (clearAll) {
      setArrivedOptionId(null);
      onArrivedViewChange?.(false);
    }
  };

  useEffect(() => {
    if (
      !arrivedItem ||
      receivedModalOpen ||
      deliveredModalOpen ||
      historyModalOpen
    ) {
      onFooterActionsChange?.(null);
      return;
    }
    onFooterActionsChange?.({
      backLabel: "Back",
      onBack: () => resetFormState(true),
      primary: null,
    });
  }, [arrivedItem, receivedModalOpen, deliveredModalOpen, historyModalOpen]);

  if (arrivedItem) {
    return (
      <>
        <LineItemPanel
          opt={opt}
          p={p}
          lineTotal={lineTotal}
          maxQty={maxQty}
          isReceivedEdit={isReceivedEdit}
          isDeliveredEdit={isDeliveredEdit}
          deliveredMax={deliveredMax}
          isReceivedFull={isReceivedFull}
          isReceivedSingle={isReceivedSingle}
          isDeliveredFull={isDeliveredFull}
          isDeliveredSingle={isDeliveredSingle}
          receivedSNRemaining={receivedSNRemaining}
          deliveredSNRemaining={deliveredSNRemaining}
          receivedHistoryRows={receivedHistoryRows}
          deliveredHistoryRows={deliveredHistoryRows}
          onStartReceived={startReceived}
          onStartDelivered={startDelivered}
          onOpenReceivedHistory={openReceivedHistory}
          onOpenDeliveredHistory={openDeliveredHistory}
        />
        <UpdateReceivedModal
          open={receivedModalOpen}
          onClose={() => setReceivedModalOpen(false)}
          p={p}
          patchOption={patchOption}
          nPurchaseOrderId={nPurchaseOrderId}
          currentUserId={currentUserId}
          receivedKey={receivedKey}
          deliveredKey={deliveredKey}
          paidKey={paidKey}
        />
        <UpdateDeliveredModal
          open={deliveredModalOpen}
          onClose={() => setDeliveredModalOpen(false)}
          p={p}
          patchOption={patchOption}
          nPurchaseOrderId={nPurchaseOrderId}
          currentUserId={currentUserId}
          receivedKey={receivedKey}
          deliveredKey={deliveredKey}
          paidKey={paidKey}
          latestDeliveredReceipt={globalLatestReceipt}
        />
        <QuantityHistoryModal
          open={historyModalOpen}
          onClose={closeHistoryModal}
          tone={historyModalTone}
          title={
            historyModalTone === "received"
              ? "Received Quantity History"
              : "Delivered Quantity History"
          }
          rows={
            historyModalTone === "received"
              ? receivedHistoryRows
              : deliveredHistoryRows
          }
          qtyDone={
            historyModalTone === "received"
              ? p?.nInventoryQty
              : p?.nDeliveredQty
          }
          qtyTotal={p?.nQuantity}
          p={p}
          toggleRowStatus={toggleRowStatus}
          statusUpdatingId={statusUpdatingId}
          statusError={statusError}
          historyLoading={historyLoading}
          historyError={historyError}
          isReceivedRow={historyModalTone === "received"}
          deliveredQtyForOption={
            historyModalTone === "received" ? p?.nDeliveredQty : 0
          }
        />
      </>
    );
  }

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
        const showRemove = poStatus === openCartKey;
        const itemHistory = optionHistories[Number(p?.nPurchaseOptionId)];
        const showArrived =
          String(itemHistory?.nStatus) === String(paidKey) ||
          String(itemHistory?.nStatus) === String(receivedKey) ||
          String(itemHistory?.nStatus) === String(deliveredKey);
        const isAtPurchaseOrderStage =
          String(itemHistory?.nStatus) === String(addToCartKey) ||
          String(itemHistory?.nStatus) === String(purchaseOrderKey);
        const showQty =
          poStatus === closeCartKey && !showArrived && isAtPurchaseOrderStage;
        const showPOPricing = isAtPurchaseOrderStage && !showArrived;

        let arrivedStats = null;
        if (showArrived) {
          const optId = p?.nPurchaseOptionId;
          const allRows = inventoryRows[optId] || [];
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
            key={optRow.nPurchaseOrder_OptionId ?? idx}
            variant="item"
            opt={optRow}
            idx={idx}
            totalCount={options.length}
            colors={base}
            showRemove={showRemove}
            isRemoving={removingOptionId === p?.nPurchaseOptionId}
            removingOptionId={removingOptionId}
            onRemove={handleRemoveOption}
            hasAnyEWT={hasAnyEWT}
            showQty={showQty}
            showPricing={showPOPricing}
            arrivedStats={arrivedStats}
            onViewArrived={
              showArrived
                ? () => {
                    setArrivedOptionId(p?.nPurchaseOptionId);
                    onArrivedViewChange?.(true);
                  }
                : null
            }
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
