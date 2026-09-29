import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined,
  MoveToInboxOutlined,
  OutputOutlined,
} from "@mui/icons-material";
import JevAPI from "../../../../../api/endpoints/jev.api.js";
import useKeysLabels from "../../../../../hooks/useKeysLabels.js";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// Extracted hooks
import useColors from "../components/sub-components/arrive-panel/hooks/useArriveColors.js";
import useJevBalance from "../components/sub-components/arrive-panel/hooks/useJevBalance.js";

// Extracted components
import {
  ItemsSection,
  ExpandAllButton,
  TAB_OPTIONS,
  SectionTabs,
} from "../components/sub-components/arrive-panel/ArriveCommon.jsx";
import BatchHistoryTable from "../components/sub-components/arrive-panel/BatchHistoryTable.jsx";
import JevViewSection from "../components/sub-components/arrive-panel/JevViewSection.jsx";
import ReceivedItemRow from "../components/sub-components/arrive-panel/ReceivedItemRow.jsx";
import ItemReceiveRow from "../components/sub-components/arrive-panel/ItemReceiveRow.jsx";
import ItemDeliverRow from "../components/sub-components/arrive-panel/ItemDeliverRow.jsx";

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
  const [creatingJev, setCreatingJev] = useState(false);
  const [creatingJevItemId, setCreatingJevItemId] = useState(null);
  const { jevPendingKey, isFinanceOfficer, isManagement } = useKeysLabels();

  const [jevToggling, setJevToggling] = useState(false);
  const [formByItem, setFormByItem] = useState({});
  const [expandedByItem, setExpandedByItem] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [allExpandedReceived, setAllExpandedReceived] = useState(false);
  const [allExpandedPending, setAllExpandedPending] = useState(false);
  const [activeTab, setActiveTab] = useState("TO_RECEIVE");
  const [approvedBatchesByItem, setApprovedBatchesByItem] = useState({});
  const [pendingBatchesByItem, setPendingBatchesByItem] = useState({});
  const [allBatchesByItem, setAllBatchesByItem] = useState({});
  const [historyExpandedByItem, setHistoryExpandedByItem] = useState({});
  const [error, setError] = useState("");
  const [batchError, setBatchError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deliverFormByItem, setDeliverFormByItem] = useState({});
  const [deliverExpandedByItem, setDeliverExpandedByItem] = useState({});
  const [allExpandedForDelivery, setAllExpandedForDelivery] = useState(false);
  const [allExpandedPendingDelivered, setAllExpandedPendingDelivered] =
    useState(false);
  const [allExpandedDelivered, setAllExpandedDelivered] = useState(false);

  const [approvedDeliveredBatchesByItem, setApprovedDeliveredBatchesByItem] =
    useState({});
  const [pendingDeliveredBatchesByItem, setPendingDeliveredBatchesByItem] =
    useState({});
  const [allDeliveredBatchesByItem, setAllDeliveredBatchesByItem] = useState(
    {},
  );
  const [jevView, setJevView] = useState(null);
  const [jevData, setJevData] = useState(null);
  const [jevLoading, setJevLoading] = useState(false);
  const [jevError, setJevError] = useState("");
  const jevItemId = jevView?.p?.nPurchaseItemId;
  const jevRows = (() => {
    const liveAll = [
      ...(allBatchesByItem[jevItemId] || []),
      ...(allDeliveredBatchesByItem[jevItemId] || []),
    ];
    const linked = liveAll.filter(
      (b) => String(b.nJEVId) === String(jevView?.jevId),
    );
    return linked.length ? linked : jevView?.batches || [];
  })();
  const jevQty = jevRows.reduce((s, b) => s + (b.qty || 0), 0);
  const jevIds = (() => {
    const source =
      jevView?.flowType === "delivered"
        ? allDeliveredBatchesByItem[jevItemId]
        : allBatchesByItem[jevItemId];
    const ids = [
      ...new Set((source || []).map((b) => b.nJEVId).filter(Boolean)),
    ];
    return ids.sort((a, b) => Number(a) - Number(b));
  })();
  const showJevSelector = activeTab === "RECEIVED" || activeTab === "DELIVERED";
  const jevEqValue = jevQty * Number(jevView?.p?.dUnitPrice || 0);
  const jevBalance = useJevBalance(jevView?.jevId, jevEqValue);
  const canManageJev = isManagement || isFinanceOfficer;
  const jevIsPending = String(jevData?.cStatus) === String(jevPendingKey);

  const loadBatches = React.useCallback(async () => {
    const approved = {};
    const pending = {};
    const all = {};
    const deliveredApproved = {};
    const deliveredPending = {};
    const allDelivered = {};
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
            qty: Math.abs(Number(r.nQuantity)) || 0,
            dtLog: r.dtLog,
            serialNumbers: r.serialNumbers || [],
            cStatus: String(r.cStatus || "").trim(),
            nJEVId: r.nJEVId ?? null,
          });
          const receivedRows = rows.filter((r) => Number(r.nQuantity) > 0);
          const deliveredRows = rows.filter((r) => Number(r.nQuantity) < 0);

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

          deliveredApproved[id] = deliveredRows
            .filter((r) => String(r.cStatus || "").trim() === "A")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          deliveredPending[id] = deliveredRows
            .filter((r) => String(r.cStatus || "").trim() === "P")
            .sort((a, b) => new Date(a.dtLog) - new Date(b.dtLog))
            .map(mapRow);
          allDelivered[id] = deliveredRows
            .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog))
            .map(mapRow);
        } catch (e) {
          approved[id] = [];
          pending[id] = [];
          all[id] = [];
          deliveredApproved[id] = [];
          deliveredPending[id] = [];
          allDelivered[id] = [];
        }
      }),
    );
    setApprovedBatchesByItem(approved);
    setPendingBatchesByItem(pending);
    setAllBatchesByItem(all);
    setApprovedDeliveredBatchesByItem(deliveredApproved);
    setPendingDeliveredBatchesByItem(deliveredPending);
    setAllDeliveredBatchesByItem(allDelivered);
  }, [options]);

  useEffect(() => {
    const initialForm = {};
    const initialExpanded = {};
    const initialDeliverForm = {};
    const initialDeliverExpanded = {};
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
        initialDeliverForm[id] = {
          qty: "",
          receiptNo: "",
          serials: [],
          showSN: false,
        };
        initialDeliverExpanded[id] = false;
      }
    });
    setFormByItem(initialForm);
    setExpandedByItem(initialExpanded);
    setDeliverFormByItem(initialDeliverForm);
    setDeliverExpandedByItem(initialDeliverExpanded);
    setHistoryExpandedByItem({});
    setAllExpanded(false);
    setAllExpandedForDelivery(false);
    setError("");
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

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
        if (id != null) updated[`r-${id}`] = next;
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
  const setDeliverItemValue = (id, value) =>
    setDeliverFormByItem((prev) => ({ ...prev, [id]: value }));

  const toggleDeliverExpand = (id) =>
    setDeliverExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleExpandAllForDelivery = () => {
    const next = !allExpandedForDelivery;
    setAllExpandedForDelivery(next);
    setDeliverExpandedByItem((prev) => {
      const updated = { ...prev };
      forDeliveryItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[id] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllPendingDelivered = () => {
    const next = !allExpandedPendingDelivered;
    setAllExpandedPendingDelivered(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      pendingJevDeliveredItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`pd-${id}`] = next;
      });
      return updated;
    });
  };

  const toggleExpandAllDelivered = () => {
    const next = !allExpandedDelivered;
    setAllExpandedDelivered(next);
    setHistoryExpandedByItem((prev) => {
      const updated = { ...prev };
      deliveredItems.forEach((o) => {
        const id = o.purchase_option?.nPurchaseItemId;
        if (id != null) updated[`dl-${id}`] = next;
      });
      return updated;
    });
  };

  const toggleBatchStatus = async (id, batch, isDelivered = false) => {
    const wasCancelled = batch.cStatus === "C";
    const newStatus = wasCancelled ? "P" : "C";
    const batchQty = Math.abs(Number(batch.qty) || 0);

    const option = options.find(
      (o) => o.purchase_option?.nPurchaseItemId === id,
    );
    const p = option?.purchase_option;

    if (wasCancelled) {
      const itemName =
        [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

      if (isDelivered) {
        const remaining = getRemainingToDeliverQty(id);
        if (batchQty > remaining) {
          setBatchError({
            itemId: id,
            message: `${itemName}: can't re-activate ${batchQty}. Only ${remaining} left available to deliver.`,
          });
          return;
        }
      } else {
        const ordered = Number(p?.nQuantity || 0);
        const current = getApprovedReceivedQty(id) + getPendingReceivedQty(id);
        const remaining = Math.max(0, ordered - current);
        if (batchQty > remaining) {
          setBatchError({
            itemId: id,
            message: `${itemName}: can't re-activate ${batchQty}. Only ${remaining} left to receive (ordered ${ordered}).`,
          });
          return;
        }
      }
    }
    setBatchError(null);

    setStatusUpdatingId(batch.nInventoryId);
    try {
      await InventoryAPI.updateInventory(batch.nInventoryId, {
        cStatus: newStatus,
      });

      const delta = (wasCancelled ? 1 : -1) * batchQty;
      const field = isDelivered ? "nDeliveredQty" : "nInventoryQty";
      patchOption?.(id, {
        [field]: Math.max(0, (p?.[field] || 0) + delta),
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
  const fetchJev = async (id, silent = false) => {
    if (!silent) setJevLoading(true);
    try {
      const res = await JevAPI.getById(id);
      setJevData(res?.jev ?? res?.data ?? res ?? null);
    } catch (err) {
      console.error("Failed to load JEV:", err);
      if (!silent) setJevError("Failed to load JEV. Please try again.");
      else throw err;
    } finally {
      if (!silent) setJevLoading(false);
    }
  };

  const handleViewJev = (nJEVId, p, batches, flowType = "received") => {
    const fullOption = options.find(
      (o) => o.purchase_option?.nPurchaseItemId === p?.nPurchaseItemId,
    );
    const enrichedP = fullOption?.purchase_option ?? p;
    setJevView({ jevId: nJEVId, p: enrichedP, batches, flowType });
    setJevData(null);
    setJevError("");
    fetchJev(nJEVId);
  };
  const handleSelectJev = (nJEVId) => {
    setJevView((prev) => (prev ? { ...prev, jevId: nJEVId } : prev));
    setJevData(null);
    setJevError("");
    fetchJev(nJEVId);
  };
  const handleBackFromJev = () => {
    setJevView(null);
    setJevData(null);
    setJevError("");
  };

  const handleToggleJevFinalize = async (action) => {
    if (!jevView || jevToggling) return;
    const id = jevView.jevId;
    const itemId = jevView.p?.nPurchaseItemId;
    const finalizing = action === "finalize_jev";
    setJevToggling(true);
    try {
      await withSpinner("JEV", async () => {
        await JevAPI.update(id, { cStatus: "toggle" });

        if (itemId != null) {
          const res = await InventoryAPI.getHistory(itemId);
          const rows = res?.rows || res?.inventory || [];
          const fromStatus = finalizing ? "P" : "A";
          const toStatus = finalizing ? "A" : "P";

          const linked = rows.filter(
            (r) =>
              String(r.nJEVId) === String(id) &&
              String(r.cStatus || "").trim() === fromStatus,
          );

          for (const r of linked) {
            await InventoryAPI.updateInventory(r.nInventoryId, {
              cStatus: toStatus,
            });
          }

          if (linked.length && nPurchaseOrderId && currentUserId != null) {
            await PurchaseOrderAPI.syncStatus({
              nPurchaseOrderId,
              nPurchaseItemId: itemId,
              nUserId: currentUserId,
              nReceivedStatus: forDeliveryKey,
              nDeliveredStatus: deliveredKey,
              nPaidStatus: pendingReceiptKey,
            });
          }
        }

        await fetchJev(id, true);
        await loadBatches();
      });
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      await showSwal(
        "SUCCESS",
        {},
        {
          entity: "JEV",
          action: finalizing ? "finalized" : "status updated",
        },
      );
    } catch (err) {
      console.error("Toggle JEV status failed:", err);
      await showSwal("ERROR", {}, { entity: "JEV" });
    } finally {
      setJevToggling(false);
    }
  };
  const handleSave = async () => {
    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const itemName =
        [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";
      const v = formByItem[id];
      const newReceived = Number(v.qty);
      const currentDelivered = p?.nDeliveredQty || 0;
      const projectedTotalReceived = (p?.nInventoryQty || 0) + newReceived;

      if (projectedTotalReceived < currentDelivered) {
        setError(
          `${itemName}: Total received (${projectedTotalReceived}) can't be less than Delivered (${currentDelivered}).`,
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

    try {
      await withSpinner("Inventory", async () => {
        await InventoryAPI.bulkReceiveDeliver({
          mode: "receive",
          nPurchaseOrderId,
          nReceivedStatus: forDeliveryKey,
          nDeliveredStatus: deliveredKey,
          nPaidStatus: pendingReceiptKey,
          items: itemsToSave.map((o) => {
            const id = o.purchase_option.nPurchaseItemId;
            const v = formByItem[id];
            return {
              nPurchaseItemId: id,
              nQuantity: Number(v.qty),
              strReceiptNumber: v.receiptNo.trim(),
              serials: v.serials,
            };
          }),
        });
      });

      itemsToSave.forEach((o) => {
        const p = o.purchase_option;
        const v = formByItem[p.nPurchaseItemId];
        patchOption?.(p.nPurchaseItemId, {
          nInventoryQty: (p.nInventoryQty || 0) + Number(v.qty),
          receivedSerialNumbers: [
            ...(p.receivedSerialNumbers || []),
            ...v.serials,
          ],
        });
      });
    } catch (err) {
      console.error("Bulk receive failed:", err);
      setError(
        err?.response?.data?.errors?.items ??
          "Failed to record received items.",
      );
      setSaving(false);
      return;
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
  const deliverItemsToSave = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    const v = deliverFormByItem[id];
    return v && v.qty !== "" && Number(v.qty) > 0 && v.receiptNo.trim() !== "";
  });

  const isDeliverFormValid = deliverItemsToSave.length > 0;
  const handleSaveDelivered = async () => {
    for (const o of deliverItemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = deliverFormByItem[id];
      const newDelivered = Number(v.qty);
      const deliveredMax = getRemainingToDeliverQty(id);
      const itemName =
        [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";

      if (newDelivered > deliveredMax) {
        setError(
          `${itemName}: Delivered can't exceed available quantity (${deliveredMax}).`,
        );
        return;
      }
      if (v.serials.length > newDelivered) {
        setError(
          `${itemName}: too many serial numbers for the quantity entered.`,
        );
        return;
      }
      const undeliveredSerials = (p?.receivedSerialNumbers || []).filter(
        (sn) => !(p?.deliveredSerialNumbers || []).includes(sn),
      );
      const requiredSerials = Math.min(newDelivered, undeliveredSerials.length);
      if (requiredSerials > 0 && v.serials.length < requiredSerials) {
        setError(
          `${itemName}: please add ${requiredSerials} serial number(s) to match the delivered quantity.`,
        );
        return;
      }
    }

    setError("");
    setSaving(true);

    try {
      await withSpinner("Inventory", async () => {
        await InventoryAPI.bulkReceiveDeliver({
          mode: "deliver",
          nPurchaseOrderId,
          nReceivedStatus: forDeliveryKey,
          nDeliveredStatus: deliveredKey,
          nPaidStatus: pendingReceiptKey,
          items: deliverItemsToSave.map((o) => {
            const id = o.purchase_option.nPurchaseItemId;
            const v = deliverFormByItem[id];
            return {
              nPurchaseItemId: id,
              nQuantity: Number(v.qty),
              strReceiptNumber: v.receiptNo.trim(),
              serials: v.serials,
            };
          }),
        });
      });

      deliverItemsToSave.forEach((o) => {
        const p = o.purchase_option;
        const id = p.nPurchaseItemId;
        const v = deliverFormByItem[id];
        patchOption?.(id, {
          nDeliveredQty: (p.nDeliveredQty || 0) + Number(v.qty),
          deliveredSerialNumbers: [
            ...(p.deliveredSerialNumbers || []),
            ...v.serials,
          ],
        });
      });
    } catch (err) {
      console.error("Bulk deliver failed:", err);
      const apiErrors = err?.response?.data?.errors;
      setError(
        (Array.isArray(apiErrors?.items)
          ? apiErrors.items[0]
          : apiErrors?.items) ||
          err?.response?.data?.message ||
          "Failed to record delivered items. Please try again.",
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    window.dispatchEvent(new CustomEvent("cart_data_updated"));
    await showSwal(
      "SUCCESS",
      {},
      {
        entity: `${deliverItemsToSave.length} item(s) delivered`,
        action: "recorded",
      },
    );
    onDone?.();
  };

  // ── Sections ──
  const pendingJevItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (pendingBatchesByItem[id] || []).length > 0;
  });

  const pendingJevItemsWithoutJev = pendingJevItems.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return !(pendingBatchesByItem[id] || []).some((b) => b.nJEVId);
  });

  const isCreateJevValid = pendingJevItemsWithoutJev.length > 0;
  const createJevBulk = async (type, items) => {
    setCreatingJev(true);
    try {
      await InventoryAPI.bulkCreateJev(
        type,
        items
          .map((o) => o.purchase_option?.nPurchaseItemId)
          .filter((id) => id != null),
      );
      await loadBatches();
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    } catch (err) {
      console.error(`Failed to create JEV (${type}):`, err);
      setError("Failed to create JEV. Please try again.");
    } finally {
      setCreatingJev(false);
    }
  };

  const handleCreateJev = () =>
    createJevBulk("received", pendingJevItemsWithoutJev);
  const handleCreateJevDelivered = () =>
    createJevBulk("delivered", pendingJevDeliveredItemsWithoutJev);

  const createJevSingle = async (type, id) => {
    if (id == null) return;
    setCreatingJevItemId(id);
    try {
      await InventoryAPI.bulkCreateJev(type, [id]);
      await loadBatches();
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    } catch (err) {
      console.error(`Failed to create JEV (${type}) for item ${id}:`, err);
      setError("Failed to create JEV. Please try again.");
    } finally {
      setCreatingJevItemId(null);
    }
  };

  const handleCreateJevItem = (p) =>
    createJevSingle("received", p?.nPurchaseItemId);
  const handleCreateJevDeliveredItem = (p) =>
    createJevSingle("delivered", p?.nPurchaseItemId);

  const receivedItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (
      (approvedBatchesByItem[id] || []).length > 0 ||
      (pendingBatchesByItem[id] || []).length > 0
    );
  });

  const toReceiveItems = options.filter((o) => {
    const p = o.purchase_option;
    return Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0)) > 0;
  });

  const getApprovedReceivedQty = (id) =>
    (approvedBatchesByItem[id] || []).reduce((sum, b) => sum + (b.qty || 0), 0);

  const getPendingReceivedQty = (id) =>
    (pendingBatchesByItem[id] || []).reduce((sum, b) => sum + (b.qty || 0), 0);

  const getApprovedDeliveredQty = (id) =>
    (approvedDeliveredBatchesByItem[id] || []).reduce(
      (sum, b) => sum + (b.qty || 0),
      0,
    );

  const getPendingDeliveredQty = (id) =>
    (pendingDeliveredBatchesByItem[id] || []).reduce(
      (sum, b) => sum + (b.qty || 0),
      0,
    );

  const getRemainingToDeliverQty = (id) =>
    Math.max(
      0,
      getApprovedReceivedQty(id) -
        getApprovedDeliveredQty(id) -
        getPendingDeliveredQty(id),
    );

  const forDeliveryItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    if (id == null) return false;
    return getRemainingToDeliverQty(id) > 0;
  });

  const pendingJevDeliveredItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (pendingDeliveredBatchesByItem[id] || []).length > 0;
  });

  const pendingJevDeliveredItemsWithoutJev = pendingJevDeliveredItems.filter(
    (o) => {
      const id = o.purchase_option?.nPurchaseItemId;
      return !(pendingDeliveredBatchesByItem[id] || []).some((b) => b.nJEVId);
    },
  );

  const isCreateJevDeliveredValid =
    pendingJevDeliveredItemsWithoutJev.length > 0;

  const deliveredItems = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    return (
      (approvedDeliveredBatchesByItem[id] || []).length > 0 ||
      (pendingDeliveredBatchesByItem[id] || []).length > 0
    );
  });

  useEffect(() => {
    if (jevView) {
      onStateChange?.({
        label: null,
        onConfirm: null,
        canConfirm: false,
        saving: false,
        jevOpen: true,
        onJevBack: handleBackFromJev,
        jevAction:
          canManageJev && jevData && !jevLoading
            ? {
                kind: jevIsPending ? "finalize" : "undo",
                label: jevIsPending ? "Finalize" : "Undo Finalize",
                tooltip: jevBalance.loading
                  ? "Checking JEV balance…"
                  : jevIsPending && !jevBalance.balanced
                    ? jevBalance.message ||
                      "JEV totals must be equal before finalizing"
                    : jevIsPending
                      ? "Finalize this JEV"
                      : "Undo Finalize this JEV",
                disabled:
                  jevToggling ||
                  jevBalance.loading ||
                  (jevIsPending && !jevBalance.balanced),
                onClick: () =>
                  handleToggleJevFinalize(
                    jevIsPending ? "finalize_jev" : "undo_finalize_jev",
                  ),
              }
            : null,
      });
      return;
    }
    if (activeTab === "TO_RECEIVE") {
      onStateChange?.({
        label: "Confirm Received",
        onConfirm: handleSave,
        canConfirm: isFormValid,
        saving,
      });
    } else if (activeTab === "FOR_DELIVERY") {
      onStateChange?.({
        label: "Confirm Delivered",
        onConfirm: handleSaveDelivered,
        canConfirm: isDeliverFormValid,
        saving,
      });
    } else if (activeTab === "PENDING") {
      onStateChange?.({
        label: "Create JEV",
        onConfirm: handleCreateJev,
        canConfirm: isCreateJevValid,
        saving: creatingJev,
      });
    } else if (activeTab === "PENDING_DELIVERED") {
      onStateChange?.({
        label: "Create JEV",
        onConfirm: handleCreateJevDelivered,
        canConfirm: isCreateJevDeliveredValid,
        saving: creatingJev,
      });
    } else {
      onStateChange?.({
        label: null,
        onConfirm: null,
        canConfirm: false,
        saving: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jevView,
    jevData,
    jevLoading,
    jevToggling,
    jevIsPending,
    canManageJev,
    jevBalance.loading,
    jevBalance.balanced,
    jevBalance.message,
    activeTab,
    isFormValid,
    isDeliverFormValid,
    isCreateJevValid,
    isCreateJevDeliveredValid,
    saving,
    creatingJev,
    formByItem,
    deliverFormByItem,
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <SectionTabs
          hideExtra={!!jevView}
          active={activeTab}
          onChange={(key) => {
            if (jevView) handleBackFromJev();
            setActiveTab(key);
          }}
          counts={{
            TO_RECEIVE: toReceiveItems.length,
            PENDING: pendingJevItems.length,
            RECEIVED: receivedItems.length,
            FOR_DELIVERY: forDeliveryItems.length,
            PENDING_DELIVERED: pendingJevDeliveredItems.length,
            DELIVERED: deliveredItems.length,
          }}
          c={c}
          extraControl={
            activeTab === "DELIVERED" && deliveredItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedDelivered}
                onClick={toggleExpandAllDelivered}
                c={c}
                icon={OutputOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "PENDING_DELIVERED" &&
              pendingJevDeliveredItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedPendingDelivered}
                onClick={toggleExpandAllPendingDelivered}
                c={c}
              />
            ) : activeTab === "FOR_DELIVERY" && forDeliveryItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedForDelivery}
                onClick={toggleExpandAllForDelivery}
                c={c}
                icon={OutputOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "RECEIVED" && receivedItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedReceived}
                onClick={toggleExpandAllReceived}
                c={c}
                icon={MoveToInboxOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "PENDING" && pendingJevItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpandedPending}
                onClick={toggleExpandAllPending}
                c={c}
                icon={MoveToInboxOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : activeTab === "TO_RECEIVE" && toReceiveItems.length > 0 ? (
              <ExpandAllButton
                expanded={allExpanded}
                onClick={toggleExpandAll}
                c={c}
                icon={MoveToInboxOutlined}
                expandedIcon={CheckCircleOutlined}
              />
            ) : null
          }
        />
        {jevView && (
          <ItemsSection count={1} c={c}>
            <JevViewSection
              c={c}
              p={jevView.p}
              jevId={jevView.jevId}
              qty={jevQty}
              eqValue={jevEqValue}
              logs={jevRows}
              jev={jevData}
              loading={jevLoading}
              error={jevError}
              jevPendingKey={jevPendingKey}
              isFinanceOfficer={isFinanceOfficer}
              isManagement={isManagement}
              balance={jevBalance}
              flowType={jevView.flowType ?? "received"}
              jevIds={jevIds}
              onSelectJev={handleSelectJev}
              showJevSelector={showJevSelector}
            />
          </ItemsSection>
        )}

        <Box sx={{ display: jevView ? "none" : "block" }}>
          {activeTab === "RECEIVED" && (
            <ItemsSection count={receivedItems.length} c={c}>
              {receivedItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "RECEIVED").label
                    }
                    showReceivedProgress
                    showEqBadge
                    approvedProgressQty={getApprovedReceivedQty(id)}
                    pendingProgressQty={getPendingReceivedQty(id)}
                    batches={allBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`r-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`r-${id}`)}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, false)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    onViewJev={handleViewJev}
                    errorMessage={
                      batchError?.itemId === id ? batchError.message : ""
                    }
                  />
                );
              })}
            </ItemsSection>
          )}

          {activeTab === "PENDING_DELIVERED" && (
            <ItemsSection count={pendingJevDeliveredItems.length} c={c}>
              {pendingJevDeliveredItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "PENDING_DELIVERED")
                        .label
                    }
                    showEqBadge
                    batches={pendingDeliveredBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`pd-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`pd-${id}`)}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, true)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    actionableWhenPending
                    onViewJev={handleViewJev}
                    jevFlowType="delivered"
                    onCreateJev={handleCreateJevDeliveredItem}
                    creatingJev={creatingJevItemId === id}
                    disableCreateJev={creatingJev || creatingJevItemId != null}
                  />
                );
              })}
            </ItemsSection>
          )}
          {activeTab === "FOR_DELIVERY" && (
            <ItemsSection count={forDeliveryItems.length} c={c}>
              {forDeliveryItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;

                const value = deliverFormByItem[id] || {
                  qty: "",
                  receiptNo: "",
                  serials: [],
                  showSN: false,
                };
                return (
                  <ItemDeliverRow
                    key={id}
                    idx={idx}
                    p={p}
                    value={value}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "FOR_DELIVERY").label
                    }
                    showEqBadge
                    onChange={(v) => setDeliverItemValue(id, v)}
                    expanded={!!deliverExpandedByItem[id]}
                    onToggleExpand={() => toggleDeliverExpand(id)}
                    historyExpanded={!!historyExpandedByItem[`fd-${id}`]}
                    onToggleHistoryExpand={() =>
                      toggleHistoryExpand(`fd-${id}`)
                    }
                    batches={allDeliveredBatchesByItem[id] || []}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, true)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    showStatus
                    availableQty={getApprovedReceivedQty(id)}
                    deliveredQty={
                      getApprovedDeliveredQty(id) + getPendingDeliveredQty(id)
                    }
                    deliveredMaxOverride={getRemainingToDeliverQty(id)}
                    errorMessage={
                      batchError?.itemId === id ? batchError.message : ""
                    }
                  />
                );
              })}
            </ItemsSection>
          )}
          {activeTab === "PENDING" && (
            <ItemsSection count={pendingJevItems.length} c={c}>
              {pendingJevItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "PENDING").label
                    }
                    showEqBadge
                    batches={pendingBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`p-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`p-${id}`)}
                    c={c}
                    onToggleStatus={(batch) => toggleBatchStatus(id, batch)}
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    actionableWhenPending
                    onViewJev={handleViewJev}
                    onCreateJev={handleCreateJevItem}
                    creatingJev={creatingJevItemId === id}
                    disableCreateJev={creatingJev || creatingJevItemId != null}
                  />
                );
              })}
            </ItemsSection>
          )}

          {activeTab === "TO_RECEIVE" && (
            <ItemsSection count={toReceiveItems.length} c={c}>
              {toReceiveItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;

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
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "TO_RECEIVE").label
                    }
                    value={value}
                    onChange={(v) => setItemValue(id, v)}
                    expanded={!!expandedByItem[id]}
                    onToggleExpand={() => toggleExpand(id)}
                    historyExpanded={!!historyExpandedByItem[id]}
                    onToggleHistoryExpand={() => toggleHistoryExpand(id)}
                    batches={allBatchesByItem[id] || []}
                    c={c}
                    onToggleStatus={(batch) => toggleBatchStatus(id, batch)}
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    showStatus
                    errorMessage={
                      batchError?.itemId === id ? batchError.message : ""
                    }
                  />
                );
              })}
            </ItemsSection>
          )}
          {activeTab === "DELIVERED" && (
            <ItemsSection count={deliveredItems.length} c={c}>
              {deliveredItems.map((o, idx) => {
                const p = o.purchase_option;
                const id = p?.nPurchaseItemId;
                if (id == null) return null;
                return (
                  <ReceivedItemRow
                    key={id}
                    idx={idx}
                    p={p}
                    statusLabel={
                      TAB_OPTIONS.find((t) => t.key === "DELIVERED").label
                    }
                    showDeliveredProgress
                    showEqBadge
                    approvedProgressQty={getApprovedDeliveredQty(id)}
                    pendingProgressQty={getPendingDeliveredQty(id)}
                    batches={allDeliveredBatchesByItem[id] || []}
                    expanded={!!historyExpandedByItem[`dl-${id}`]}
                    onToggleExpand={() => toggleHistoryExpand(`dl-${id}`)}
                    c={c}
                    onToggleStatus={(batch) =>
                      toggleBatchStatus(id, batch, true)
                    }
                    statusUpdatingId={statusUpdatingId}
                    allowActions
                    onViewJev={handleViewJev}
                    jevFlowType="delivered"
                    errorMessage={
                      batchError?.itemId === id ? batchError.message : ""
                    }
                  />
                );
              })}
            </ItemsSection>
          )}
        </Box>
      </Box>

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
