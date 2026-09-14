import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";

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
  cartKey,
  forApprovalKey,
  forPaymentKey,
  pendingReceiptKey,
  forDeliveryKey,
  deliveredKey,
  removedFromCartKey,
  currentUserId,
  nPurchaseOrderId,
  onRemoved,
  poStatus,
  onArrivedViewChange,
  onFooterActionsChange,
  onSavingChange,
  poNumber,
  anyOptionArrived,
  initialArrivedOptionId,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const patchOption = (nPurchaseItemId, patch) => {
    onPatchOption?.(nPurchaseItemId, patch);
  };
  const [removingOptionId, setRemovingOptionId] = useState(null);
  const [activeOptionId, setActiveOptionId] = useState(null); // which row's modals/history are active
  const [receivedHistoryByOption, setReceivedHistoryByOption] = useState({});
  const [deliveredHistoryByOption, setDeliveredHistoryByOption] = useState({});
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

  const activeOption = useMemo(() => {
    if (activeOptionId == null) return null;
    const opt = options.find(
      (o) => o.purchase_option?.nPurchaseItemId === activeOptionId,
    );
    return opt ? { opt, p: opt.purchase_option } : null;
  }, [activeOptionId, options]);

  const fetchInventoryHistory = async (nPurchaseItemId) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await InventoryAPI.getHistory(nPurchaseItemId);
      const rows = res?.rows || res?.inventory || [];
      const received = rows
        .filter((r) => Number(r.nQuantity) > 0)
        .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog));
      const delivered = rows
        .filter((r) => Number(r.nQuantity) < 0)
        .map((r) => ({ ...r, nQuantity: Math.abs(Number(r.nQuantity)) }))
        .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog));
      setReceivedHistoryByOption((prev) => ({
        ...prev,
        [nPurchaseItemId]: received,
      }));
      setDeliveredHistoryByOption((prev) => ({
        ...prev,
        [nPurchaseItemId]: delivered,
      }));
    } catch (err) {
      console.error("Failed to fetch inventory history:", err);
      setHistoryError("Failed to load history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleRowStatus = async (
    row,
    nPurchaseItemId,
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
      await fetchInventoryHistory(nPurchaseItemId);
      const currentOpt = options.find(
        (o) => o.purchase_option?.nPurchaseItemId === nPurchaseItemId,
      );
      const currentP = currentOpt?.purchase_option;
      const delta =
        (newStatus === activeStatus ? 1 : -1) *
        Math.abs(Number(row.nQuantity) || 0);
      patchOption(nPurchaseItemId, {
        [isReceivedRow ? "nInventoryQty" : "nDeliveredQty"]:
          Math.max(
            0,
            (isReceivedRow
              ? currentP?.nInventoryQty
              : currentP?.nDeliveredQty) ?? 0,
          ) + delta,
      });
      await PurchaseOrderAPI.syncStatus({
        nPurchaseOrderId,
        nPurchaseItemId,
        nUserId: currentUserId,
        nReceivedStatus: forDeliveryKey,
        nDeliveredStatus: deliveredKey,
        nPaidStatus: pendingReceiptKey,
      });
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    } catch (err) {
      console.error("Failed to update inventory status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

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
    if (!deliveredModalOpen) return;
    const supplierId = activeOption?.p?.supplier?.nSupplierId;
    InventoryAPI.getLatestDeliveredReceipt(
      supplierId ? { nSupplierId: supplierId } : {},
    )
      .then((res) => setGlobalLatestReceipt(res?.strReceiptNumber ?? null))
      .catch((err) => {
        console.error("Failed to fetch latest delivered receipt:", err);
        setGlobalLatestReceipt(null);
      });
  }, [deliveredModalOpen, activeOption?.p?.supplier?.nSupplierId]);

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

  useEffect(() => {
    const handler = () => {
      if (activeOptionId) fetchInventoryHistory(activeOptionId);
    };
    window.addEventListener("inventory_data_updated", handler);
    return () => window.removeEventListener("inventory_data_updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOptionId]);

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
    <>
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
                .reduce(
                  (sum, r) => sum + Math.abs(Number(r.nQuantity) || 0),
                  0,
                );
            const pendingRcvd = sumBy(
              (r) =>
                Number(r.nQuantity) > 0 &&
                String(r.cStatus || "").trim() === "P",
            );
            const approvedRcvdSum = sumBy(
              (r) =>
                Number(r.nQuantity) > 0 &&
                String(r.cStatus || "").trim() === "A",
            );
            const pendingDlvd = sumBy(
              (r) =>
                Number(r.nQuantity) < 0 &&
                String(r.cStatus || "").trim() === "P",
            );
            const approvedDlvdSum = sumBy(
              (r) =>
                Number(r.nQuantity) < 0 &&
                String(r.cStatus || "").trim() === "A",
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
              receivedHistoryRows={
                receivedHistoryByOption[nPurchaseItemId] || []
              }
              deliveredHistoryRows={
                deliveredHistoryByOption[nPurchaseItemId] || []
              }
              onViewArrived={
                showArrived
                  ? () => {
                      if (activeOptionId !== nPurchaseItemId) {
                        setActiveOptionId(nPurchaseItemId);
                        fetchInventoryHistory(nPurchaseItemId);
                      }
                    }
                  : null
              }
              onStartReceived={() => {
                setActiveOptionId(nPurchaseItemId);
                setReceivedModalOpen(true);
              }}
              onStartDelivered={() => {
                if ((p?.nInventoryQty || 0) === 0) return;
                setActiveOptionId(nPurchaseItemId);
                setDeliveredModalOpen(true);
              }}
              onOpenReceivedHistory={() => {
                setActiveOptionId(nPurchaseItemId);
                setHistoryModalTone("received");
                setHistoryModalOpen(true);
                fetchInventoryHistory(nPurchaseItemId);
              }}
              onOpenDeliveredHistory={() => {
                setActiveOptionId(nPurchaseItemId);
                setHistoryModalTone("delivered");
                setHistoryModalOpen(true);
                fetchInventoryHistory(nPurchaseItemId);
              }}
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

      {/* Modals operate on whichever row's Add/View button was last clicked */}
      <UpdateReceivedModal
        open={receivedModalOpen}
        onClose={() => setReceivedModalOpen(false)}
        p={activeOption?.p}
        patchOption={patchOption}
        nPurchaseOrderId={nPurchaseOrderId}
        currentUserId={currentUserId}
        forDeliveryKey={forDeliveryKey}
        deliveredKey={deliveredKey}
        pendingReceiptKey={pendingReceiptKey}
      />
      <UpdateDeliveredModal
        open={deliveredModalOpen}
        onClose={() => setDeliveredModalOpen(false)}
        p={activeOption?.p}
        patchOption={patchOption}
        nPurchaseOrderId={nPurchaseOrderId}
        currentUserId={currentUserId}
        forDeliveryKey={forDeliveryKey}
        deliveredKey={deliveredKey}
        pendingReceiptKey={pendingReceiptKey}
        latestDeliveredReceipt={globalLatestReceipt}
      />
      <QuantityHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        tone={historyModalTone}
        title={
          historyModalTone === "received"
            ? "Received Quantity History"
            : "Delivered Quantity History"
        }
        rows={
          historyModalTone === "received"
            ? receivedHistoryByOption[activeOptionId] || []
            : deliveredHistoryByOption[activeOptionId] || []
        }
        qtyDone={
          historyModalTone === "received"
            ? activeOption?.p?.nInventoryQty
            : activeOption?.p?.nDeliveredQty
        }
        qtyTotal={activeOption?.p?.nQuantity}
        p={activeOption?.p}
        toggleRowStatus={toggleRowStatus}
        statusUpdatingId={statusUpdatingId}
        statusError={statusError}
        historyLoading={historyLoading}
        historyError={historyError}
        isReceivedRow={historyModalTone === "received"}
        deliveredQtyForOption={
          historyModalTone === "received" ? activeOption?.p?.nDeliveredQty : 0
        }
      />
    </>
  );
}
