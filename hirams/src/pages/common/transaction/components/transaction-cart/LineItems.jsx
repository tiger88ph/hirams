import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ReceiptLongOutlined,
  Inventory2Outlined,
  RemoveShoppingCart,
  EditOutlined,
  ArrowBackOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  LocalShippingOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import api from "../../../../../utils/api/api.js";
import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog.jsx";
import MiniBaseButton from "../../../../../components/common/MiniBaseButton.jsx";
import BaseButton from "../../../../../components/common/BaseButton.jsx";
import {
  IconBox,
  fmtDateTime,
  fmtPHP,
} from "../../modal/transaction-cart/PurchaseOrderCartModal.jsx";
import { BrowserMultiFormatReader } from "@zxing/browser";

const RECEIVED_CONFIRM_STYLE = {
  color: "#1D4ED8",
  bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
  border: "#BFDBFE",
  dotColor: "#3B82F6",
  icon: <Inventory2Outlined sx={{ fontSize: "1.4rem", color: "#1D4ED8" }} />,
  title: "Confirm Received Quantity?",
  desc: "This will update the received inventory count for this item.",
  confirmLabel: "Yes, Confirm Received",
  confirmBg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)",
};

const DELIVERED_CONFIRM_STYLE = {
  color: "#15803d",
  bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
  border: "#86efac",
  dotColor: "#22c55e",
  icon: <Inventory2Outlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
  title: "Confirm Delivered Quantity?",
  desc: "This will update the delivered inventory count for this item.",
  confirmLabel: "Yes, Confirm Delivered",
  confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
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
  nPurchaseOrderId, // ← ADD
  onRemoved,
  onMarkReceived,
  poStatus,
  optionHistories,
  onArrivedViewChange,
  onSavingChange,
}) {
  // Patch bubbles up to modal's liveOptions — no local state needed
  const patchOption = (nPurchaseOptionId, patch) => {
    onPatchOption?.(nPurchaseOptionId, patch);
  };
  // ── Auto-increment the numeric tail of a receipt number ─────────────────────
  // e.g. "DR-2025-0041" -> "DR-2025-0042". Falls back to "" if no digits found
  // so the field stays blank (forcing manual entry) instead of guessing wrong.
  const incrementReceiptNo = (str) => {
    if (!str) return "";
    const match = String(str).match(/(\d+)(\D*)$/);
    if (!match) return "";
    const numStr = match[1];
    const suffix = match[2] || "";
    const nextNum = String(Number(numStr) + 1).padStart(numStr.length, "0");
    return str.slice(0, match.index) + nextNum + suffix;
  };
  const [removingOptionId, setRemovingOptionId] = useState(null);
  const [arrivedOptionId, setArrivedOptionId] = useState(null);
  const [receivedQty, setReceivedQty] = useState("");
  const [deliveredQty, setDeliveredQty] = useState("");
  const [showReceivedField, setShowReceivedField] = useState(false);
  const [showDeliveredField, setShowDeliveredField] = useState(false);
  const [showReceivedSN, setShowReceivedSN] = useState(false);
  const [showDeliveredSN, setShowDeliveredSN] = useState(false);
  const [receivedSerials, setReceivedSerials] = useState([]);
  const [deliveredSerials, setDeliveredSerials] = useState([]);
  const [receivedError, setReceivedError] = useState("");
  const [deliveredError, setDeliveredError] = useState("");
  const [receivedReceiptNo, setReceivedReceiptNo] = useState("");
  const [deliveredReceiptNo, setDeliveredReceiptNo] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [savingReceived, setSavingReceived] = useState(false);
  const [savingDelivered, setSavingDelivered] = useState(false);
  const [confirmReceived, setConfirmReceived] = useState(false);
  const [confirmDelivered, setConfirmDelivered] = useState(false);
  const [savingConfirm, setSavingConfirm] = useState(false);
  const [showReceivedSNOnly, setShowReceivedSNOnly] = useState(false);
  const [showDeliveredSNOnly, setShowDeliveredSNOnly] = useState(false);
  const [confirmReceivedSN, setConfirmReceivedSN] = useState(false);
  const [confirmDeliveredSN, setConfirmDeliveredSN] = useState(false);
  const [showReceivedView, setShowReceivedView] = useState(false);
  const [showDeliveredView, setShowDeliveredView] = useState(false);
  const [receivedHistoryRows, setReceivedHistoryRows] = useState([]);
  const [deliveredHistoryRows, setDeliveredHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  // arrivedItem reads from options (which is now liveOptions from modal)
  const arrivedItem = useMemo(() => {
    if (arrivedOptionId == null) return null;
    const opt = options.find(
      (o) => o.purchase_option?.nPurchaseOptionId === arrivedOptionId,
    );
    return opt ? { opt, p: opt.purchase_option } : null;
  }, [arrivedOptionId, options]);

  // ── Fetch per-batch inventory history (qty + serials) for the View panels ──
  // NOTE: assumes an endpoint that returns every inventory row for this
  // option — positive nQuantity = received batch, negative = delivered batch,
  // matching how rows are created elsewhere in this file via api.post("inventory", ...).
  // Swap the endpoint name/response mapping below if your backend differs.
  const fetchInventoryHistory = async (nPurchaseOptionId) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await api.get(
        `inventory/history?nPurchaseOptionId=${nPurchaseOptionId}`,
      );
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
    if (arrivedItem?.p?.nPurchaseOptionId) {
      fetchInventoryHistory(arrivedItem.p.nPurchaseOptionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedItem?.p?.nPurchaseOptionId]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [statusError, setStatusError] = useState("");
  const toggleRowStatus = async (
    row,
    nPurchaseOptionId,
    isReceivedRow,
    deliveredQtyForOption,
    uom = "",
  ) => {
    const newStatus = row.cStatus === "C" ? "A" : "C";

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
      await api.put(`inventory/${row.nInventoryId}`, { cStatus: newStatus });
      await fetchInventoryHistory(nPurchaseOptionId);

      // ── Optimistically patch the qty this row contributes ────────────
      // Cancelling removes this row's qty from the active sum; reactivating adds it back.
      const delta =
        (newStatus === "A" ? 1 : -1) * Math.abs(Number(row.nQuantity) || 0);
      patchOption(nPurchaseOptionId, {
        [isReceivedRow ? "nInventoryQty" : "nDeliveredQty"]:
          Math.max(
            0,
            (isReceivedRow
              ? arrivedItem?.p?.nInventoryQty
              : arrivedItem?.p?.nDeliveredQty) ?? 0,
          ) + delta,
      });

      // ── This is the missing piece: recompute nStatus + broadcast ────
      await api.post("purchase-order/sync-status", {
        nPurchaseOrderId,
        nPurchaseOptionId,
        nUserId: currentUserId,
        nReceivedStatus: receivedKey,
        nDeliveredStatus: deliveredKey,
        nPaidStatus: paidKey,
      });

      // Refresh THIS option's history locally so the stepper updates immediately
      try {
        const histRes = await api.post("purchase-item-histories/latest", {
          nPurchaseOptionId: [nPurchaseOptionId],
        });
        const updated = histRes?.histories?.[0];
        if (updated) {
          window.dispatchEvent(new CustomEvent("inventory_data_updated"));
        }
      } catch (histErr) {
        console.error("Failed to refresh option history:", histErr);
      }
    } catch (err) {
      console.error("Failed to update inventory status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };
  // ── Keep history in sync with saves ─────────────────────────────────────
  // Received/Delivered saves only optimistically patch liveOptions (qty +
  // serials) — they never touch receivedHistoryRows/deliveredHistoryRows,
  // which power the View panels AND the delivered receipt-no. placeholder.
  // The modal already dispatches "inventory_data_updated" after every
  // successful insert; listen for it here and refetch so both stay correct
  // without waiting for the user to leave and reopen the item.
  useEffect(() => {
    const handler = () => {
      if (arrivedItem?.p?.nPurchaseOptionId) {
        fetchInventoryHistory(arrivedItem.p.nPurchaseOptionId);
      }
    };
    window.addEventListener("inventory_data_updated", handler);
    return () => window.removeEventListener("inventory_data_updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedItem?.p?.nPurchaseOptionId]);
  const stateRef = useRef();
  stateRef.current = {
    showReceivedField,
    showDeliveredField,
    showReceivedSNOnly,
    showDeliveredSNOnly,
    receivedQty,
    deliveredQty,
    receivedSerials,
    deliveredSerials,
    p: arrivedItem?.p,
  };

  const handleScanResult = (text) => {
    const {
      showReceivedField,
      showDeliveredField,
      showReceivedSNOnly,
      showDeliveredSNOnly,
      receivedQty,
      deliveredQty,
      receivedSerials,
      deliveredSerials,
      p,
    } = stateRef.current;

    const isReceivedMode = showReceivedField || showReceivedSNOnly;
    const isDeliveredMode = showDeliveredField || showDeliveredSNOnly;

    const receivedLimit = showReceivedSNOnly
      ? Math.max(
          0,
          (p?.nInventoryQty || 0) - (p?.receivedSerialNumbers?.length || 0),
        )
      : Number(receivedQty) || 0;

    const deliveredLimit = showDeliveredSNOnly
      ? Math.max(
          0,
          (p?.nDeliveredQty || 0) - (p?.deliveredSerialNumbers?.length || 0),
        )
      : Number(deliveredQty) || 0;

    if (isReceivedMode) {
      if (receivedSerials.includes(text)) return;
      if (receivedSerials.length >= receivedLimit) {
        setScannerError("Received quantity limit reached.");
        return;
      }
      setReceivedSerials((prev) => [...prev, text]);
    } else if (isDeliveredMode) {
      if (deliveredSerials.includes(text)) return;
      if (deliveredSerials.length >= deliveredLimit) {
        setScannerError("Delivered quantity limit reached.");
        return;
      }
      if (p?.receivedSerialNumbers && !p.receivedSerialNumbers.includes(text)) {
        setScannerError("This S/N was not part of the received items.");
        return;
      }
      setDeliveredSerials((prev) => [...prev, text]);
    }
  };
  useEffect(() => {
    if (!showScanner) return;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    codeReader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result) => {
          if (result) handleScanResult(result.getText());
        },
      )
      .catch(() =>
        setScannerError(
          "Could not access the camera. Check permissions and try again.",
        ),
      );
    return () => {
      try {
        codeReader.reset();
      } catch {
        /* no-op */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  const stopScanner = () => {
    try {
      codeReaderRef.current?.reset();
    } catch {
      /* no-op */
    }
    codeReaderRef.current = null;
    setShowScanner(false);
    setScannerError("");
  };

  const handleRemoveOption = async (nPurchaseOptionId) => {
    setRemovingOptionId(nPurchaseOptionId);
    try {
      await api.post("purchase-order/remove-from-cart", {
        nPurchaseOptionId,
        nUserId: currentUserId,
        nStatus: removedFromCartKey,
        isManagement: true,
      });
      await onRemoved?.();
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    } finally {
      setRemovingOptionId(null);
    }
  };

  // ── Arrived / Received form view ──────────────────────────────────────────
  if (arrivedItem) {
    const { opt, p } = arrivedItem;
    const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
    const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
    const isReceivedEdit = (p?.nInventoryQty || 0) > 0;
    const isDeliveredEdit = (p?.nDeliveredQty || 0) > 0;
    const deliveredMax = Math.max(
      0,
      (p?.nInventoryQty || 0) - (p?.nDeliveredQty || 0),
    );
    // ── Full / single-remaining helpers ─────────────────────────────────────
    const isReceivedFull =
      (p?.nQuantity || 0) > 0 && (p?.nInventoryQty || 0) >= (p?.nQuantity || 0);
    const isReceivedSingle = !isReceivedFull && maxQty === 1;
    const isDeliveredFull =
      (p?.nQuantity || 0) > 0 && (p?.nDeliveredQty || 0) >= (p?.nQuantity || 0);
    const isDeliveredSingle =
      !isDeliveredFull && (p?.nInventoryQty || 0) > 0 && deliveredMax === 1;
    // Item is serial-tracked if it has any received serials — delivered
    // must then also capture serials (matched against the received pool).
    const isSerialized = (p?.receivedSerialNumbers?.length || 0) > 0;
    const undeliveredSerials = (p?.receivedSerialNumbers || []).filter(
      (sn) => !(p?.deliveredSerialNumbers || []).includes(sn),
    );
    // How many serials can still be attached to already-received / already-delivered qty.
    const receivedSNRemaining = Math.max(
      0,
      (p?.nInventoryQty || 0) - (p?.receivedSerialNumbers?.length || 0),
    );
    const deliveredSNRemaining = Math.max(
      0,
      (p?.nDeliveredQty || 0) - (p?.deliveredSerialNumbers?.length || 0),
    );
    // Suggested next receipt no., derived from the latest delivered batch's
    // strReceiptNumber (e.g. "RN0002" -> "RN0003"). Shown as a placeholder
    // only — never auto-filled into the field.
    const deliveredReceiptPlaceholder =
      incrementReceiptNo(deliveredHistoryRows[0]?.strReceiptNumber) ||
      "e.g. RN0001";
    const handleReceivedSave = async () => {
      if (receivedQty === "") return;
      const newReceived = Number(receivedQty);
      const currentDelivered = p?.nDeliveredQty || 0;
      if (newReceived < currentDelivered) {
        setReceivedError(
          `Received can't be less than Delivered (${currentDelivered}). Adjust Delivered first.`,
        );
        return;
      }
      if (receivedSerials.length > newReceived) {
        setReceivedError(
          `You have ${receivedSerials.length} serial number(s) but only ${newReceived} received. Remove extra SNs first.`,
        );
        return;
      }
      setReceivedError("");
      setConfirmReceived(true);
    };

    const executeReceivedSave = async () => {
      const newReceived = Number(receivedQty);
      const receiptNo = receivedReceiptNo;
      setSavingConfirm(true);
      onSavingChange?.(true);

      // ── OPTIMISTIC PATCH — bubbles to modal's liveOptions ─────────────────
      patchOption(p?.nPurchaseOptionId, {
        nInventoryQty: (p?.nInventoryQty || 0) + newReceived,
        receivedSerialNumbers: [
          ...(p?.receivedSerialNumbers || []),
          ...receivedSerials,
        ],
      });
      setConfirmReceived(false);
      setShowReceivedField(false);
      setShowReceivedSN(false);
      setReceivedQty("");
      setReceivedSerials([]);
      setReceivedReceiptNo("");
      // ─────────────────────────────────────────────────────────────────────

      try {
        await onMarkReceived?.(
          p?.nPurchaseOptionId,
          receivedQty,
          "",
          p?.nInventoryId,
          p?.nDeliveredInventoryId,
          receivedSerials,
          p?.deliveredSerialNumbers || [],
          receiptNo,
          "",
        );
      } catch (err) {
        console.error("Failed to save received:", err);
        // Roll back
        patchOption(p?.nPurchaseOptionId, {
          nInventoryQty: p?.nInventoryQty,
          receivedSerialNumbers: p?.receivedSerialNumbers,
        });
        setReceivedError("Save failed. Please try again.");
      } finally {
        setSavingConfirm(false);
        onSavingChange?.(false);
      }
    };

    const handleReceivedSNOnlySave = () => {
      if (!receivedSerials.length) {
        setReceivedError("Add at least one serial number.");
        return;
      }
      if (receivedSerials.length > receivedSNRemaining) {
        setReceivedError(
          `You can only add up to ${receivedSNRemaining} serial number(s).`,
        );
        return;
      }
      setReceivedError("");
      setConfirmReceivedSN(true);
    };

    const executeReceivedSNOnlySave = async () => {
      const addedSerials = receivedSerials;
      setSavingConfirm(true);
      onSavingChange?.(true);

      patchOption(p?.nPurchaseOptionId, {
        receivedSerialNumbers: [
          ...(p?.receivedSerialNumbers || []),
          ...addedSerials,
        ],
      });
      setConfirmReceivedSN(false);
      setShowReceivedSNOnly(false);
      setReceivedSerials([]);

      try {
        const targetInventoryId = p?.nInventoryId;
        if (targetInventoryId) {
          for (const sn of addedSerials) {
            await api.post("serial-numbers", {
              nInventoryId: targetInventoryId,
              strSerialNumber: sn,
            });
          }
        }
        window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      } catch (err) {
        console.error("Failed to save received serial numbers:", err);
        patchOption(p?.nPurchaseOptionId, {
          receivedSerialNumbers: p?.receivedSerialNumbers,
        });
        setReceivedError("Save failed. Please try again.");
      } finally {
        setSavingConfirm(false);
        onSavingChange?.(false);
      }
    };

    const handleDeliveredSave = async () => {
      if (deliveredQty === "") return;
      const newDelivered = Number(deliveredQty);
      if (!deliveredReceiptNo.trim()) {
        setDeliveredError("Receipt No. is required for delivered items.");
        return;
      }
      if (deliveredSerials.length > newDelivered) {
        setDeliveredError(
          `You have ${deliveredSerials.length} serial number(s) but only ${newDelivered} delivered. Remove extra SNs first.`,
        );
        return;
      }
      // Only require as many SNs as are actually available/undelivered —
      // not the full delivered qty, since some units may have no SN at all.
      const requiredSerials = Math.min(newDelivered, undeliveredSerials.length);
      if (requiredSerials > 0 && deliveredSerials.length < requiredSerials) {
        setDeliveredError(
          `Please add ${requiredSerials} serial number(s) to match the delivered quantity (only ${undeliveredSerials.length} serial number(s) available).`,
        );
        return;
      }
      setDeliveredError("");
      setConfirmDelivered(true);
    };
    const handleDeliveredSNOnlySave = () => {
      if (!deliveredSerials.length) {
        setDeliveredError("Add at least one serial number.");
        return;
      }
      if (deliveredSerials.length > deliveredSNRemaining) {
        setDeliveredError(
          `You can only add up to ${deliveredSNRemaining} serial number(s).`,
        );
        return;
      }
      setDeliveredError("");
      setConfirmDeliveredSN(true);
    };

    const executeDeliveredSNOnlySave = async () => {
      const addedSerials = deliveredSerials;
      setSavingConfirm(true);
      onSavingChange?.(true);

      patchOption(p?.nPurchaseOptionId, {
        deliveredSerialNumbers: [
          ...(p?.deliveredSerialNumbers || []),
          ...addedSerials,
        ],
      });
      setConfirmDeliveredSN(false);
      setShowDeliveredSNOnly(false);
      setDeliveredSerials([]);

      try {
        const targetInventoryId = p?.nDeliveredInventoryId;
        if (targetInventoryId) {
          for (const sn of addedSerials) {
            await api.post("serial-numbers", {
              nInventoryId: targetInventoryId,
              strSerialNumber: sn,
            });
          }
        }
        window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      } catch (err) {
        console.error("Failed to save delivered serial numbers:", err);
        patchOption(p?.nPurchaseOptionId, {
          deliveredSerialNumbers: p?.deliveredSerialNumbers,
        });
        setDeliveredError("Save failed. Please try again.");
      } finally {
        setSavingConfirm(false);
        onSavingChange?.(false);
      }
    };

    const executeDeliveredSave = async () => {
      const newDelivered = Number(deliveredQty);
      const receiptNo = deliveredReceiptNo;
      setSavingConfirm(true);
      onSavingChange?.(true);

      // ── OPTIMISTIC PATCH — bubbles to modal's liveOptions ─────────────────
      patchOption(p?.nPurchaseOptionId, {
        nDeliveredQty: (p?.nDeliveredQty || 0) + newDelivered,
        deliveredSerialNumbers: [
          ...(p?.deliveredSerialNumbers || []),
          ...deliveredSerials,
        ],
      });
      setConfirmDelivered(false);
      setShowDeliveredField(false);
      setShowDeliveredSN(false);
      setDeliveredQty("");
      setDeliveredSerials([]);
      setDeliveredReceiptNo("");
      // ─────────────────────────────────────────────────────────────────────

      try {
        await onMarkReceived?.(
          p?.nPurchaseOptionId,
          "",
          deliveredQty,
          null,
          p?.nDeliveredInventoryId,
          [],
          deliveredSerials,
          "",
          receiptNo,
        );
      } catch (err) {
        console.error("Failed to save delivered:", err);
        // Roll back
        patchOption(p?.nPurchaseOptionId, {
          nDeliveredQty: p?.nDeliveredQty,
          deliveredSerialNumbers: p?.deliveredSerialNumbers,
        });
        setDeliveredError("Save failed. Please try again.");
      } finally {
        setSavingConfirm(false);
        onSavingChange?.(false);
      }
    };

    if (showScanner) {
      return (
        <Box
          sx={{
            mx: 1.5,
            mb: 1.5,
            borderRadius: "10px",
            border: "0.5px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "0.5px solid #F3F4F6",
              background: "#F8FAFC",
            }}
          >
            <Typography
              sx={{ fontSize: "0.67rem", fontWeight: 700, color: "#111827" }}
            >
              Scan Barcode —{" "}
              {showReceivedField || showReceivedSNOnly
                ? "Received"
                : "Delivered"}
            </Typography>
            <Typography
              sx={{ fontSize: "0.6rem", fontWeight: 600, color: "#3B82F6" }}
            >
              {showReceivedField || showReceivedSNOnly
                ? receivedSerials.length
                : deliveredSerials.length}{" "}
              /{" "}
              {showReceivedField
                ? Number(receivedQty) || 0
                : showReceivedSNOnly
                  ? receivedSNRemaining
                  : showDeliveredSNOnly
                    ? deliveredSNRemaining
                    : Number(deliveredQty) || 0}
            </Typography>
          </Box>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              background: "#000",
            }}
          >
            <Box
              component="video"
              ref={videoRef}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              muted
              playsInline
            />
            <Box
              sx={{
                position: "absolute",
                inset: "15% 10%",
                border: "2px solid rgba(255,255,255,0.7)",
                borderRadius: "10px",
                pointerEvents: "none",
              }}
            />
          </Box>
          {scannerError && (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 600,
                color: "#dc2626",
                px: 1.5,
                py: 0.75,
                background: "#FEF2F2",
              }}
            >
              {scannerError}
            </Typography>
          )}
          {(showReceivedField || showReceivedSNOnly
            ? receivedSerials
            : deliveredSerials
          ).length > 0 && (
            <Box sx={{ px: 1.5, py: 1, maxHeight: 100, overflowY: "auto" }}>
              {(showReceivedField || showReceivedSNOnly
                ? receivedSerials
                : deliveredSerials
              ).map((sn) => (
                <Typography
                  key={sn}
                  sx={{ fontSize: "0.6rem", color: "#374151", py: 0.2 }}
                >
                  ✓ {sn}
                </Typography>
              ))}
            </Box>
          )}
          <Box
            component="button"
            onClick={stopScanner}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              py: 0.875,
              fontSize: "0.6rem",
              fontWeight: 600,
              color: "#6B7280",
              background: "#F8FAFC",
              border: "none",
              borderTop: "0.5px solid #F3F4F6",
              cursor: "pointer",
              "&:hover": { background: "#F3F4F6", color: "#374151" },
            }}
          >
            ← Done Scanning
          </Box>
        </Box>
      );
    }

    if (confirmReceived) {
      return (
        <Box sx={{ mx: 1.5, mb: 1.5 }}>
          <ConfirmationDialog
            style={RECEIVED_CONFIRM_STYLE}
            voucherNumber={`${p?.nQuantity || 0} ${p?.strUOM ?? ""} — ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ") || p?.transaction_item?.strName || "Item"}`}
            loading={savingConfirm}
            onConfirm={executeReceivedSave}
            onBack={() => setConfirmReceived(false)}
          />
        </Box>
      );
    }

    if (confirmDelivered) {
      return (
        <Box sx={{ mx: 1.5, mb: 1.5 }}>
          <ConfirmationDialog
            style={DELIVERED_CONFIRM_STYLE}
            voucherNumber={`${p?.nQuantity || 0} ${p?.strUOM ?? ""} — ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ") || p?.transaction_item?.strName || "Item"}`}
            loading={savingConfirm}
            onConfirm={executeDeliveredSave}
            onBack={() => setConfirmDelivered(false)}
          />
        </Box>
      );
    }

    if (confirmReceivedSN) {
      return (
        <Box sx={{ mx: 1.5, mb: 1.5 }}>
          <ConfirmationDialog
            style={RECEIVED_CONFIRM_STYLE}
            voucherNumber={`${receivedSerials.length} S/N — ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ") || p?.transaction_item?.strName || "Item"}`}
            loading={savingConfirm}
            onConfirm={executeReceivedSNOnlySave}
            onBack={() => setConfirmReceivedSN(false)}
          />
        </Box>
      );
    }

    if (confirmDeliveredSN) {
      return (
        <Box sx={{ mx: 1.5, mb: 1.5 }}>
          <ConfirmationDialog
            style={DELIVERED_CONFIRM_STYLE}
            voucherNumber={`${deliveredSerials.length} S/N — ${[p?.strBrand, p?.strModel].filter(Boolean).join(" · ") || p?.transaction_item?.strName || "Item"}`}
            loading={savingConfirm}
            onConfirm={executeDeliveredSNOnlySave}
            onBack={() => setConfirmDeliveredSN(false)}
          />
        </Box>
      );
    }

    const resetFormState = (clearAll = false) => {
      setShowReceivedField(false);
      setShowDeliveredField(false);
      setShowReceivedSN(false);
      setShowDeliveredSN(false);
      setShowReceivedSNOnly(false);
      setShowDeliveredSNOnly(false);
      setShowReceivedView(false);
      setShowDeliveredView(false);
      setReceivedQty("");
      setDeliveredQty("");
      setReceivedSerials([]);
      setDeliveredSerials([]);
      setReceivedError("");
      setDeliveredError("");
      setReceivedReceiptNo("");
      setDeliveredReceiptNo("");
      if (clearAll) {
        setArrivedOptionId(null);
        onArrivedViewChange?.(false);
      }
    };
    return (
      <Box
        sx={{
          mx: 1.5,
          mb: 1.5,
          borderRadius: "10px",
          border: "0.5px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        {/* Selected item info */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "stretch",
            borderBottom: "0.5px solid #F3F4F6",
            background: "#F8FAFC",
          }}
        >
          <IconBox sx={{ alignSelf: "center" }}>
            <Inventory2Outlined
              sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}
            />
          </IconBox>
          <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 0.4,
                  py: 0.1,
                  borderRadius: "3px",
                  background: "#EFF6FF",
                  border: "0.5px solid #BFDBFE",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    color: "#3B82F6",
                    lineHeight: 1,
                  }}
                >
                  {p?.transaction_item?.transaction?.strCode ?? "—"}
                </Typography>
              </Box>
              {(p?.strBrand || p?.strModel) && (
                <Typography
                  sx={{
                    fontSize: "0.67rem",
                    fontWeight: 600,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                  }}
                >
                  {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
                </Typography>
              )}
            </Box>
            <Typography
              sx={{
                fontSize: "0.58rem",
                color: "#6B7280",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {p?.transaction_item?.strName ?? "—"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.54rem",
                color: "#C4C9D4",
                lineHeight: 1,
                mt: 0.25,
              }}
            >
              Item Delivery:{" "}
              {fmtDateTime(
                p?.transaction_item?.transaction?.dtDelivery ??
                  "No Delivery Date Attached.",
              )}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 80,
              flexShrink: 0,
              textAlign: "right",
              alignSelf: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.67rem",
                fontWeight: 700,
                color: "#D85A30",
                lineHeight: 1.2,
              }}
            >
              {fmtPHP(lineTotal)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 2, pt: 1.5, pb: 0 }}>
          {!showDeliveredField &&
            !showReceivedSNOnly &&
            !showDeliveredSNOnly &&
            !showReceivedView &&
            !showDeliveredView && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  mb: showReceivedField ? 1.25 : 0,
                  py: showReceivedField ? 0 : 0.5,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    py: 0.6,
                    borderRadius: "7px",
                    background: "#F8FAFC",
                    border: "0.5px solid #E5E7EB",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      flex: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "text.disabled",
                      }}
                    >
                      Received
                    </Typography>
                    <Box
                      sx={{
                        px: 0.5,
                        py: 0.15,
                        borderRadius: "4px",
                        background: isReceivedEdit ? "#EFF6FF" : "#F3F4F6",
                        border: `0.5px solid ${isReceivedEdit ? "#BFDBFE" : "#E5E7EB"}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: isReceivedEdit ? "#3B82F6" : "#9CA3AF",
                          lineHeight: 1,
                        }}
                      >
                        {p?.nInventoryQty ?? 0} / {p?.nQuantity || 0}
                        {p?.receivedSerialNumbers?.length > 0 && (
                          <Box
                            component="span"
                            sx={{ color: "#93C5FD", ml: 0.4 }}
                          >
                            · {p.receivedSerialNumbers.length} SN
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  {isReceivedFull ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          px: 1,
                          py: 0.5,
                          borderRadius: "6px",
                          background: "#EFF6FF",
                          border: "0.5px solid #BFDBFE",
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircleOutlined
                          sx={{ fontSize: "0.75rem", color: "#1D4ED8" }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            color: "#1D4ED8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Items Received
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setShowReceivedView(true)}
                        sx={{
                          width: 26,
                          height: 26,
                          color: "#1D4ED8",
                          border: "0.5px solid rgba(59,130,246,0.3)",
                          borderRadius: "6px",
                          flexShrink: 0,
                          "&:hover": { background: "rgba(59,130,246,0.10)" },
                        }}
                      >
                        <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <MiniBaseButton
                        icon={<EditOutlined />}
                        label="Add"
                        variant="green"
                        lightMode
                        disabled={showReceivedField}
                        tooltip={
                          showReceivedField
                            ? "Received form is active"
                            : undefined
                        }
                        onClick={() => {
                          const next = !showReceivedField;
                          setShowReceivedField(next);
                          setShowDeliveredField(false);
                          setShowDeliveredSN(false);
                          setDeliveredQty("");
                          setReceivedError("");
                          setDeliveredError("");
                          setReceivedQty(""); // always insert-only, never prefilled
                          setShowReceivedSN(false);
                          setReceivedSerials([]); // new insert = new serials only
                          setReceivedReceiptNo(""); // optional field, always starts blank
                        }}
                        sx={{ flexShrink: 0 }}
                      />
                      {(isReceivedEdit || receivedHistoryRows.length > 0) && (
                        <IconButton
                          size="small"
                          onClick={() => setShowReceivedView(true)}
                          sx={{
                            width: 26,
                            height: 26,
                            color: "#1D4ED8",
                            border: "0.5px solid rgba(59,130,246,0.3)",
                            borderRadius: "6px",
                            flexShrink: 0,
                            "&:hover": { background: "rgba(59,130,246,0.10)" },
                          }}
                        >
                          <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}

          {showReceivedView && (
            <Box
              sx={{
                mb: 1.25,
                borderRadius: "8px",
                border: "0.5px solid #BFDBFE",
                background: "#EFF6FF",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.75,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "0.5px solid rgba(59,130,246,0.2)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#1D4ED8",
                  }}
                >
                  Received Quantity History
                </Typography>
                <Typography
                  sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#1D4ED8" }}
                >
                  {p?.nInventoryQty ?? 0} / {p?.nQuantity || 0}{" "}
                  {p?.strUOM ?? ""}
                </Typography>
              </Box>

              {historyLoading ? (
                <Box sx={{ px: 1.25, py: 1.25 }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#9CA3AF" }}>
                    Loading history...
                  </Typography>
                </Box>
              ) : historyError ? (
                <Box sx={{ px: 1.25, py: 1.25 }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#dc2626" }}>
                    {historyError}
                  </Typography>
                </Box>
              ) : receivedHistoryRows.length === 0 ? (
                <Box sx={{ px: 1.25, py: 1.25 }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#9CA3AF" }}>
                    No received batches recorded.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 220, overflowY: "auto" }}>
                  {receivedHistoryRows.map((row, rowIdx) => {
                    const rowSerials = (row.serialNumbers || []).filter(
                      Boolean,
                    );
                    return (
                      <Box
                        key={row.nInventoryId ?? rowIdx}
                        sx={{
                          borderBottom:
                            rowIdx === receivedHistoryRows.length - 1
                              ? "none"
                              : "0.5px solid rgba(59,130,246,0.15)",
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.6,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              width: 18,
                              flexShrink: 0,
                              fontSize: "0.55rem",
                              fontWeight: 600,
                              color: "#93C5FD",
                              textAlign: "center",
                            }}
                          >
                            {rowIdx + 1}
                          </Typography>
                          <Typography
                            sx={{
                              minWidth: 60,
                              flexShrink: 0,
                              fontSize: "0.58rem",
                              fontWeight: 600,
                              color: "#1D4ED8",
                              wordBreak: "break-word",
                            }}
                          >
                            {row.strReceiptNumber || "—"}
                          </Typography>
                          <Box
                            sx={{
                              flex: 1,
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 0.4,
                                background: "#fff",
                                border: "0.5px solid #BFDBFE",
                                borderRadius: "5px",
                                px: 0.75,
                                py: 0.2,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: "#1D4ED8",
                                  lineHeight: 1.2,
                                }}
                              >
                                {row.nQuantity}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.48rem",
                                  color: "#1D4ED8",
                                  textTransform: "uppercase",
                                  lineHeight: 1,
                                }}
                              >
                                {p?.strUOM ?? ""}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.58rem",
                              color: "#6B7280",
                              flexShrink: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.dtLog
                              ? new Date(row.dtLog).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </Typography>
                          <Box
                            component="button"
                            onClick={() =>
                              toggleRowStatus(
                                row,
                                p?.nPurchaseOptionId,
                                true,
                                p?.nDeliveredQty,
                                p?.strUOM,
                              )
                            }
                            disabled={statusUpdatingId === row.nInventoryId}
                            sx={{
                              ml: 0.75,
                              flexShrink: 0,
                              fontSize: "0.52rem",
                              fontWeight: 700,
                              px: 0.75,
                              py: 0.3,
                              borderRadius: "5px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              color:
                                row.cStatus === "C" ? "#15803d" : "#dc2626",
                              background:
                                row.cStatus === "C" ? "#F0FDF4" : "#FEF2F2",
                              border: `0.5px solid ${row.cStatus === "C" ? "#86EFAC" : "#fecaca"}`,
                              opacity:
                                statusUpdatingId === row.nInventoryId ? 0.6 : 1,
                            }}
                          >
                            {statusUpdatingId === row.nInventoryId
                              ? "..."
                              : row.cStatus === "C"
                                ? "Re-activate"
                                : "Cancel"}
                          </Box>
                        </Box>
                        {rowSerials.length > 0 && (
                          <Box
                            sx={{
                              px: 1.25,
                              pb: 0.6,
                              pl: 3.5,
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.54rem",
                                fontWeight: 700,
                                color: "#1D4ED8",
                                flexShrink: 0,
                                lineHeight: 1.5,
                              }}
                            >
                              S/N:
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.54rem",
                                color: "#374151",
                                lineHeight: 1.5,
                                wordBreak: "break-all",
                              }}
                            >
                              {rowSerials.join(", ")}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
              {statusError && (
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    px: 1.25,
                    py: 0.6,
                    background: "#FEF2F2",
                    borderTop: "0.5px solid rgba(220,38,38,0.15)",
                  }}
                >
                  {statusError}
                </Typography>
              )}
            </Box>
          )}
          {showReceivedSNOnly && (
            <Box sx={{ mb: 1.25 }}>
              <Typography
                sx={{
                  fontSize: "0.54rem",
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  mb: 0.5,
                  lineHeight: 1,
                }}
              >
                Serial Numbers ({receivedSerials.length}/{receivedSNRemaining})
              </Typography>
              <FormGrid
                fields={[
                  {
                    name: "receivedSerials",
                    label: "Serial Numbers",
                    type: "serialNumber",
                    xs: 12,
                    placeholder: "Scan or type S/N and press Enter...",
                    maxItems: receivedSNRemaining,
                  },
                ]}
                switches={[]}
                formData={{ receivedSerials }}
                errors={{}}
                handleChange={(e) => {
                  if (e.target.name === "receivedSerials")
                    setReceivedSerials(e.target.value);
                }}
                autoFocus={false}
              />
              {receivedError && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    mt: 0.5,
                  }}
                >
                  {receivedError}
                </Typography>
              )}
              <Box
                component="button"
                onClick={() => {
                  setScannerError("");
                  setShowScanner(true);
                }}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  py: 0.7,
                  mt: 0.6,
                  fontSize: "0.58rem",
                  fontWeight: 600,
                  color: "#1D4ED8",
                  background: "#EFF6FF",
                  border: "0.5px solid rgba(59,130,246,0.25)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  "&:hover": { background: "#DBEAFE" },
                  transition: "all 0.12s",
                }}
              >
                Use camera to scan barcode
              </Box>
            </Box>
          )}

          {showReceivedField && (
            <Box sx={{ mb: 1.25 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: showReceivedSN ? 1 : 0,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.54rem",
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      mb: 0.4,
                      lineHeight: 1,
                    }}
                  >
                    Quantity
                  </Typography>
                  {isReceivedSingle ? (
                    <Box
                      component="button"
                      onClick={() => {
                        setReceivedQty("1");
                        setReceivedError("");
                      }}
                      sx={{
                        width: "100%",
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: receivedQty === "1" ? "#fff" : "#1D4ED8",
                        background: receivedQty === "1" ? "#1D4ED8" : "#EFF6FF",
                        border: "0.5px solid #BFDBFE",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      <CheckCircleOutlined sx={{ fontSize: "0.85rem" }} />
                      {receivedQty === "1"
                        ? "Selected — 1 Received"
                        : `Mark 1 ${p?.strUOM ?? ""} Received`}
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        component="input"
                        type="number"
                        min={0}
                        max={maxQty}
                        value={receivedQty}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > maxQty) return;
                          setReceivedQty(e.target.value);
                          setReceivedError("");
                        }}
                        sx={{
                          flex: 1,
                          height: 32,
                          px: 1,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "#111827",
                          border: "0.5px solid #E5E7EB",
                          borderRight: "none",
                          borderRadius: "6px 0 0 6px",
                          outline: "none",
                          background: "#fff",
                          "&:focus": { borderColor: "#93c5fd" },
                          "&::-webkit-inner-spin-button": {
                            WebkitAppearance: "none",
                          },
                        }}
                      />
                      <Box
                        sx={{
                          height: 32,
                          px: 1,
                          display: "flex",
                          alignItems: "center",
                          background: "#F3F4F6",
                          border: "0.5px solid #E5E7EB",
                          borderRadius: "0 6px 6px 0",
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            color: "#6B7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            lineHeight: 1,
                          }}
                        >
                          {p?.strUOM ?? "—"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box
                  component="button"
                  onClick={() => setShowReceivedSN((v) => !v)}
                  sx={{
                    alignSelf: "flex-end",
                    height: 32,
                    px: 1,
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    color: showReceivedSN ? "#1D4ED8" : "#6B7280",
                    background: showReceivedSN
                      ? "rgba(59,130,246,0.08)"
                      : "#F3F4F6",
                    border: `0.5px solid ${showReceivedSN ? "rgba(59,130,246,0.3)" : "#E5E7EB"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      background: "rgba(59,130,246,0.10)",
                      color: "#1D4ED8",
                      borderColor: "rgba(59,130,246,0.3)",
                    },
                  }}
                >
                  Scan SN
                </Box>
              </Box>

              {/* Receipt No. — optional for Received */}
              <Box sx={{ mb: 0.75, mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.54rem",
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    mb: 0.4,
                    lineHeight: 1,
                  }}
                >
                  Receipt No. (optional)
                </Typography>
                <Box
                  component="input"
                  type="text"
                  value={receivedReceiptNo}
                  placeholder="e.g. RR-2025-0001"
                  onChange={(e) => setReceivedReceiptNo(e.target.value)}
                  sx={{
                    width: "100%",
                    height: 32,
                    px: 1,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#111827",
                    border: "0.5px solid #E5E7EB",
                    borderRadius: "6px",
                    outline: "none",
                    background: "#fff",
                    "&:focus": { borderColor: "#93c5fd" },
                  }}
                />
              </Box>

              {receivedError && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    mb: 0.75,
                    mt: -0.5,
                  }}
                >
                  {receivedError}
                </Typography>
              )}
              {showReceivedSN && (
                <Box sx={{ mt: 0.75 }}>
                  <FormGrid
                    fields={[
                      {
                        name: "receivedSerials",
                        label: "Serial Numbers",
                        type: "serialNumber",
                        xs: 12,
                        placeholder: "Scan or type S/N and press Enter...",
                        maxItems: Number(receivedQty) || 0,
                      },
                    ]}
                    switches={[]}
                    formData={{ receivedSerials }}
                    errors={{}}
                    handleChange={(e) => {
                      if (e.target.name === "receivedSerials")
                        setReceivedSerials(e.target.value);
                    }}
                    autoFocus={false}
                  />
                  <Box
                    component="button"
                    onClick={() => {
                      setScannerError("");
                      setShowScanner(true);
                    }}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      py: 0.7,
                      mt: 0.6,
                      fontSize: "0.58rem",
                      fontWeight: 600,
                      color: "#1D4ED8",
                      background: "#EFF6FF",
                      border: "0.5px solid rgba(59,130,246,0.25)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      "&:hover": { background: "#DBEAFE" },
                      transition: "all 0.12s",
                    }}
                  >
                    Use camera to scan barcode
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {(p?.nInventoryQty || 0) > 0 &&
            !showReceivedField &&
            !showReceivedSNOnly &&
            !showDeliveredSNOnly &&
            !showReceivedView &&
            !showDeliveredView && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  mb: showDeliveredField ? 1.25 : 0,
                  py: showDeliveredField ? 0 : 0.5,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    py: 0.6,
                    borderRadius: "7px",
                    background: "#F8FAFC",
                    border: "0.5px solid #E5E7EB",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      flex: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "text.disabled",
                      }}
                    >
                      Delivered
                    </Typography>
                    <Box
                      sx={{
                        px: 0.5,
                        py: 0.15,
                        borderRadius: "4px",
                        background: isDeliveredEdit ? "#F0FDF4" : "#F3F4F6",
                        border: `0.5px solid ${isDeliveredEdit ? "#86EFAC" : "#E5E7EB"}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: isDeliveredEdit ? "#15803d" : "#9CA3AF",
                          lineHeight: 1,
                        }}
                      >
                        {p?.nDeliveredQty ?? 0} / {p?.nQuantity || 0}
                      </Typography>
                    </Box>
                  </Box>
                  {isDeliveredFull ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          px: 1,
                          py: 0.5,
                          borderRadius: "6px",
                          background: "#F0FDF4",
                          border: "0.5px solid #86EFAC",
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircleOutlined
                          sx={{ fontSize: "0.75rem", color: "#15803d" }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            color: "#15803d",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Items Delivered
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setShowDeliveredView(true)}
                        sx={{
                          width: 26,
                          height: 26,
                          color: "#15803d",
                          border: "0.5px solid rgba(34,197,94,0.3)",
                          borderRadius: "6px",
                          flexShrink: 0,
                          "&:hover": { background: "rgba(34,197,94,0.10)" },
                        }}
                      >
                        <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <MiniBaseButton
                        icon={<EditOutlined />}
                        label="Add"
                        variant="green"
                        lightMode
                        disabled={
                          (p?.nInventoryQty || 0) === 0 || showDeliveredField
                        }
                        tooltip={
                          (p?.nInventoryQty || 0) === 0
                            ? "No received inventory yet"
                            : showDeliveredField
                              ? "Delivered form is active"
                              : undefined
                        }
                        onClick={() => {
                          if ((p?.nInventoryQty || 0) === 0) return;
                          const next = !showDeliveredField;
                          setShowDeliveredField(next);
                          setShowReceivedField(false);
                          setShowReceivedSN(false);
                          setReceivedQty("");
                          setReceivedError("");
                          setDeliveredError("");
                          setDeliveredQty(""); // always insert-only, never prefilled
                          setShowDeliveredSN(false);
                          setDeliveredSerials([]); // new insert = new serials only
                          setDeliveredReceiptNo(""); // required field, always starts blank — placeholder shows the suggestion
                        }}
                        sx={{ flexShrink: 0 }}
                      />
                      {(isDeliveredEdit || deliveredHistoryRows.length > 0) && (
                        <IconButton
                          size="small"
                          onClick={() => setShowDeliveredView(true)}
                          sx={{
                            width: 26,
                            height: 26,
                            color: "#15803d",
                            border: "0.5px solid rgba(34,197,94,0.3)",
                            borderRadius: "6px",
                            flexShrink: 0,
                            "&:hover": { background: "rgba(34,197,94,0.10)" },
                          }}
                        >
                          <VisibilityOutlined sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}

          {showDeliveredView && (
            <Box
              sx={{
                mb: 1.25,
                borderRadius: "8px",
                border: "0.5px solid #86EFAC",
                background: "#F0FDF4",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.75,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "0.5px solid rgba(34,197,94,0.2)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#15803d",
                  }}
                >
                  Delivered Quantity History
                </Typography>
                <Typography
                  sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#15803d" }}
                >
                  {p?.nDeliveredQty ?? 0} / {p?.nQuantity || 0}{" "}
                  {p?.strUOM ?? ""}
                </Typography>
              </Box>

              {historyLoading ? (
                <Box sx={{ px: 1.25, py: 1.25 }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#9CA3AF" }}>
                    Loading history...
                  </Typography>
                </Box>
              ) : historyError ? (
                <Box sx={{ px: 1.25, py: 1.25 }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#dc2626" }}>
                    {historyError}
                  </Typography>
                </Box>
              ) : deliveredHistoryRows.length === 0 ? (
                <Box sx={{ px: 1.25, py: 1.25 }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#9CA3AF" }}>
                    No delivered batches recorded.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 220, overflowY: "auto" }}>
                  {deliveredHistoryRows.map((row, rowIdx) => {
                    const rowSerials = (row.serialNumbers || []).filter(
                      Boolean,
                    );
                    return (
                      <Box
                        key={row.nInventoryId ?? rowIdx}
                        sx={{
                          borderBottom:
                            rowIdx === deliveredHistoryRows.length - 1
                              ? "none"
                              : "0.5px solid rgba(34,197,94,0.15)",
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.6,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              width: 18,
                              flexShrink: 0,
                              fontSize: "0.55rem",
                              fontWeight: 600,
                              color: "#86EFAC",
                              textAlign: "center",
                            }}
                          >
                            {rowIdx + 1}
                          </Typography>
                          <Typography
                            sx={{
                              minWidth: 60,
                              flexShrink: 0,
                              fontSize: "0.58rem",
                              fontWeight: 600,
                              color: "#15803d",
                              wordBreak: "break-word",
                            }}
                          >
                            {row.strReceiptNumber || "—"}
                          </Typography>
                          <Box
                            sx={{
                              flex: 1,
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 0.4,
                                background: "#fff",
                                border: "0.5px solid #86EFAC",
                                borderRadius: "5px",
                                px: 0.75,
                                py: 0.2,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: "#15803d",
                                  lineHeight: 1.2,
                                }}
                              >
                                {row.nQuantity}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.48rem",
                                  color: "#15803d",
                                  textTransform: "uppercase",
                                  lineHeight: 1,
                                }}
                              >
                                {p?.strUOM ?? ""}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.58rem",
                              color: "#6B7280",
                              flexShrink: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.dtLog
                              ? new Date(row.dtLog).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </Typography>
                          <Box
                            component="button"
                            onClick={() =>
                              toggleRowStatus(row, p?.nPurchaseOptionId, false)
                            }
                            disabled={statusUpdatingId === row.nInventoryId}
                            sx={{
                              ml: 0.75,
                              flexShrink: 0,
                              fontSize: "0.52rem",
                              fontWeight: 700,
                              px: 0.75,
                              py: 0.3,
                              borderRadius: "5px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              color:
                                row.cStatus === "C" ? "#15803d" : "#dc2626",
                              background:
                                row.cStatus === "C" ? "#F0FDF4" : "#FEF2F2",
                              border: `0.5px solid ${row.cStatus === "C" ? "#86EFAC" : "#fecaca"}`,
                              opacity:
                                statusUpdatingId === row.nInventoryId ? 0.6 : 1,
                            }}
                          >
                            {statusUpdatingId === row.nInventoryId
                              ? "..."
                              : row.cStatus === "C"
                                ? "Re-activate"
                                : "Cancel"}
                          </Box>
                        </Box>
                        {rowSerials.length > 0 && (
                          <Box
                            sx={{
                              px: 1.25,
                              pb: 0.6,
                              pl: 3.5,
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.54rem",
                                fontWeight: 700,
                                color: "#15803d",
                                flexShrink: 0,
                                lineHeight: 1.5,
                              }}
                            >
                              S/N:
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.54rem",
                                color: "#374151",
                                lineHeight: 1.5,
                                wordBreak: "break-all",
                              }}
                            >
                              {rowSerials.join(", ")}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {showDeliveredSNOnly && (p?.nInventoryQty || 0) > 0 && (
            <Box sx={{ mb: 1.25 }}>
              <Typography
                sx={{
                  fontSize: "0.54rem",
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  mb: 0.5,
                  lineHeight: 1,
                }}
              >
                Serial Numbers ({deliveredSerials.length}/{deliveredSNRemaining}
                )
              </Typography>
              <FormGrid
                fields={[
                  {
                    name: "deliveredSerials",
                    label: "Serial Numbers",
                    type: "serialNumber",
                    xs: 12,
                    placeholder: "Scan or type S/N and press Enter...",
                    maxItems: deliveredSNRemaining,
                    allowedValues: p?.receivedSerialNumbers || [],
                  },
                ]}
                switches={[]}
                formData={{ deliveredSerials }}
                errors={{}}
                handleChange={(e) => {
                  if (e.target.name === "deliveredSerials")
                    setDeliveredSerials(e.target.value);
                }}
                autoFocus={false}
              />
              {deliveredError && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    mt: 0.5,
                  }}
                >
                  {deliveredError}
                </Typography>
              )}
              <Box
                component="button"
                onClick={() => {
                  setScannerError("");
                  setShowScanner(true);
                }}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  py: 0.7,
                  mt: 0.6,
                  fontSize: "0.58rem",
                  fontWeight: 600,
                  color: "#15803d",
                  background: "rgba(34,197,94,0.06)",
                  border: "0.5px solid rgba(34,197,94,0.25)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  "&:hover": { background: "rgba(34,197,94,0.12)" },
                  transition: "all 0.12s",
                }}
              >
                Use camera to scan barcode
              </Box>
            </Box>
          )}

          {showDeliveredField && (p?.nInventoryQty || 0) > 0 && (
            <Box sx={{ mb: 1.25 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: showDeliveredSN ? 1 : 0,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.54rem",
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      mb: 0.4,
                      lineHeight: 1,
                    }}
                  >
                    Quantity
                  </Typography>
                  {isDeliveredSingle ? (
                    <Box
                      component="button"
                      onClick={() => {
                        setDeliveredQty("1");
                        setDeliveredError("");
                      }}
                      sx={{
                        width: "100%",
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: deliveredQty === "1" ? "#fff" : "#15803d",
                        background:
                          deliveredQty === "1"
                            ? "#15803d"
                            : "rgba(34,197,94,0.08)",
                        border: "0.5px solid #86EFAC",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      <LocalShippingOutlined sx={{ fontSize: "0.85rem" }} />
                      {deliveredQty === "1"
                        ? "Selected — 1 Delivered"
                        : `Mark 1 ${p?.strUOM ?? ""} Delivered`}
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        component="input"
                        type="number"
                        min={0}
                        max={deliveredMax}
                        value={deliveredQty}
                        placeholder="0"
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > deliveredMax) return;
                          setDeliveredQty(e.target.value);
                          setDeliveredError("");
                        }}
                        sx={{
                          flex: 1,
                          height: 32,
                          px: 1,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "#111827",
                          border: "0.5px solid #E5E7EB",
                          borderRight: "none",
                          borderRadius: "6px 0 0 6px",
                          outline: "none",
                          background: "#fff",
                          "&:focus": { borderColor: "#93c5fd" },
                          "&::-webkit-inner-spin-button": {
                            WebkitAppearance: "none",
                          },
                        }}
                      />
                      <Box
                        sx={{
                          height: 32,
                          px: 1,
                          display: "flex",
                          alignItems: "center",
                          background: "#F3F4F6",
                          border: "0.5px solid #E5E7EB",
                          borderRadius: "0 6px 6px 0",
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            color: "#6B7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            lineHeight: 1,
                          }}
                        >
                          {p?.strUOM ?? "—"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box
                  component="button"
                  onClick={() => setShowDeliveredSN((v) => !v)}
                  sx={{
                    alignSelf: "flex-end",
                    height: 32,
                    px: 1,
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    color: showDeliveredSN ? "#15803d" : "#6B7280",
                    background: showDeliveredSN
                      ? "rgba(34,197,94,0.08)"
                      : "#F3F4F6",
                    border: `0.5px solid ${showDeliveredSN ? "rgba(34,197,94,0.3)" : "#E5E7EB"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      background: "rgba(34,197,94,0.10)",
                      color: "#15803d",
                      borderColor: "rgba(34,197,94,0.3)",
                    },
                  }}
                >
                  Scan SN
                </Box>
              </Box>

              {/* Receipt No. — required for Delivered, auto-suggested from
                  the latest delivered batch's receipt number */}
              <Box sx={{ mb: 0.75, mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.54rem",
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    mb: 0.4,
                    lineHeight: 1,
                  }}
                >
                  Receipt No. (Press enter to apply suggestion)
                </Typography>
                <Box
                  component="input"
                  type="text"
                  value={deliveredReceiptNo}
                  placeholder={deliveredReceiptPlaceholder}
                  onChange={(e) => setDeliveredReceiptNo(e.target.value)}
                  onKeyDown={(e) => {
                    // Pressing Enter on an empty field accepts the suggested
                    // placeholder value instead of just leaving it as a hint.
                    if (
                      e.key === "Enter" &&
                      !deliveredReceiptNo.trim() &&
                      deliveredReceiptPlaceholder &&
                      deliveredReceiptPlaceholder !== "e.g. RN0001"
                    ) {
                      e.preventDefault();
                      setDeliveredReceiptNo(deliveredReceiptPlaceholder);
                    }
                  }}
                  sx={{
                    width: "100%",
                    height: 32,
                    px: 1,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#111827",
                    border: `0.5px solid ${!deliveredReceiptNo.trim() ? "#fca5a5" : "#E5E7EB"}`,
                    borderRadius: "6px",
                    outline: "none",
                    background: "#fff",
                    "&:focus": { borderColor: "#86efac" },
                  }}
                />
              </Box>

              {deliveredError && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    mb: 0.75,
                    mt: -0.5,
                  }}
                >
                  {deliveredError}
                </Typography>
              )}
              {showDeliveredSN && (
                <Box sx={{ mt: 0.75 }}>
                  <FormGrid
                    fields={[
                      {
                        name: "deliveredSerials",
                        label: "Serial Numbers",
                        type: "serialNumber",
                        xs: 12,
                        placeholder: "Scan or type S/N and press Enter...",
                        maxItems: Number(deliveredQty) || 0,
                        allowedValues: p?.receivedSerialNumbers || [],
                      },
                    ]}
                    switches={[]}
                    formData={{ deliveredSerials }}
                    errors={{}}
                    handleChange={(e) => {
                      if (e.target.name === "deliveredSerials")
                        setDeliveredSerials(e.target.value);
                    }}
                    autoFocus={false}
                  />
                  <Box
                    component="button"
                    onClick={() => {
                      setScannerError("");
                      setShowScanner(true);
                    }}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      py: 0.7,
                      mt: 0.6,
                      fontSize: "0.58rem",
                      fontWeight: 600,
                      color: "#15803d",
                      background: "rgba(34,197,94,0.06)",
                      border: "0.5px solid rgba(34,197,94,0.25)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      "&:hover": { background: "rgba(34,197,94,0.12)" },
                      transition: "all 0.12s",
                    }}
                  >
                    Use camera to scan barcode
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Footer buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.75,
            mt: 0.5,
            background: "#F8FAFC",
            borderTop: "0.5px solid #F3F4F6",
          }}
        >
          <Box
            sx={{
              flex:
                showReceivedField ||
                showDeliveredField ||
                showReceivedSNOnly ||
                showDeliveredSNOnly ||
                showReceivedView ||
                showDeliveredView
                  ? 1
                  : "1 1 100%",
              display: "flex",
              "& > *, & > * > *, & button": {
                flex: 1,
                width: "100% !important",
              },
            }}
          >
            <BaseButton
              label="Back"
              icon={<ArrowBackOutlined />}
              actionColor="back"
              onClick={() => {
                if (
                  showReceivedField ||
                  showDeliveredField ||
                  showReceivedSNOnly ||
                  showDeliveredSNOnly ||
                  showReceivedView ||
                  showDeliveredView
                ) {
                  resetFormState(false);
                } else {
                  resetFormState(true);
                }
              }}
            />
          </Box>
          {showReceivedField && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                "& > *, & > * > *, & button": {
                  flex: 1,
                  width: "100% !important",
                },
              }}
            >
              <BaseButton
                label={savingReceived ? "Saving..." : "Confirm Received"}
                icon={<CheckCircleOutlined />}
                actionColor="confirm"
                disabled={savingReceived || receivedQty === ""}
                onClick={handleReceivedSave}
              />
            </Box>
          )}
          {showDeliveredField && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                "& > *, & > * > *, & button": {
                  flex: 1,
                  width: "100% !important",
                },
              }}
            >
              <BaseButton
                label={savingDelivered ? "Saving..." : "Confirm Delivered"}
                icon={<LocalShippingOutlined />}
                actionColor="confirm"
                disabled={
                  savingDelivered ||
                  deliveredQty === "" ||
                  !deliveredReceiptNo.trim()
                }
                onClick={handleDeliveredSave}
              />
            </Box>
          )}
          {showReceivedSNOnly && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                "& > *, & > * > *, & button": {
                  flex: 1,
                  width: "100% !important",
                },
              }}
            >
              <BaseButton
                label={savingConfirm ? "Saving..." : "Save Serial Numbers"}
                icon={<CheckCircleOutlined />}
                actionColor="confirm"
                disabled={savingConfirm || receivedSerials.length === 0}
                onClick={handleReceivedSNOnlySave}
              />
            </Box>
          )}
          {showDeliveredSNOnly && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                "& > *, & > * > *, & button": {
                  flex: 1,
                  width: "100% !important",
                },
              }}
            >
              <BaseButton
                label={savingConfirm ? "Saving..." : "Save Serial Numbers"}
                icon={<LocalShippingOutlined />}
                actionColor="confirm"
                disabled={savingConfirm || deliveredSerials.length === 0}
                onClick={handleDeliveredSNOnlySave}
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ── Normal list view ──────────────────────────────────────────────────────
  const localTotal = options.reduce(
    (sum, o) =>
      sum +
      (o.purchase_option?.nQuantity || 0) *
        (o.purchase_option?.dUnitPrice || 0),
    0,
  );

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        borderRadius: "10px",
        border: "0.5px solid #E5E7EB",
        overflowY: "auto",
        maxHeight: 300,
        "&::-webkit-scrollbar": { height: 5, width: 3 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "#D1D5DB",
          borderRadius: 2,
        },
        "&::-webkit-scrollbar-thumb:hover": { background: "#9CA3AF" },
      }}
    >
      {options.map((opt, idx) => {
        const p = opt.purchase_option;
        const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
        const showRemove = poStatus === openCartKey;

        const itemHistory = optionHistories[Number(p?.nPurchaseOptionId)];
        const showArrived =
          String(itemHistory?.nStatus) === String(paidKey) ||
          String(itemHistory?.nStatus) === String(receivedKey) ||
          String(itemHistory?.nStatus) === String(deliveredKey);
        const showQty = poStatus === closeCartKey && !showArrived;
        return (
          <Box
            key={opt.nPurchaseOrder_OptionId ?? idx}
            sx={{
              px: 1.5,
              py: 0.875,
              display: "flex",
              alignItems: "stretch",
              borderBottom: "0.5px solid #F3F4F6",
              "&:hover": { background: "#F8FAFC" },
              transition: "background 0.12s",
            }}
          >
            <Box
              sx={{
                width: 18,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 0.75,
                alignSelf: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#9CA3AF",
                  lineHeight: 1,
                }}
              >
                {idx + 1}
              </Typography>
            </Box>
            <IconBox sx={{ alignSelf: "center" }}>
              <Inventory2Outlined
                sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}
              />
            </IconBox>
            <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  mb: 0.2,
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 0.4,
                    py: 0.1,
                    borderRadius: "3px",
                    background: "#EFF6FF",
                    border: "0.5px solid #BFDBFE",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.5rem",
                      fontWeight: 700,
                      color: "#3B82F6",
                      lineHeight: 1,
                    }}
                  >
                    {p?.transaction_item?.transaction?.strCode ?? "—"}
                  </Typography>
                </Box>
                {(p?.strBrand || p?.strModel) && (
                  <Typography
                    sx={{
                      fontSize: "0.67rem",
                      fontWeight: 600,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}
                  >
                    {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
                  </Typography>
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  color: "#6B7280",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                }}
              >
                {p?.transaction_item?.strName ?? "—"}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.54rem",
                  color: "#C4C9D4",
                  lineHeight: 1,
                  mt: 0.25,
                }}
              >
                Item Delivery:{" "}
                {fmtDateTime(
                  p?.transaction_item?.transaction?.dtDelivery ??
                    "No Delivery Date Attached.",
                )}
              </Typography>
            </Box>
            {showArrived && (
              <Box
                sx={{
                  width: 92,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: 0.3,
                  ml: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                  <Typography
                    sx={{
                      fontSize: "0.5rem",
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Rcvd
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color:
                        Number(p?.nInventoryQty) > 0 ? "#1D4ED8" : "#D1D5DB",
                      lineHeight: 1,
                    }}
                  >
                    {p?.nInventoryQty ?? 0}/{p?.nQuantity ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                  <Typography
                    sx={{
                      fontSize: "0.5rem",
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Dlvd
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color:
                        Number(p?.nDeliveredQty) > 0 ? "#15803d" : "#D1D5DB",
                      lineHeight: 1,
                    }}
                  >
                    {p?.nDeliveredQty ?? 0}/{p?.nQuantity ?? 0}
                  </Typography>
                </Box>
              </Box>
            )}
            {showQty && (
              <Box
                sx={{
                  width: 44,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  ml: showArrived ? 1 : 4,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#374151",
                    lineHeight: 1,
                  }}
                >
                  {p?.nQuantity}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.52rem",
                    color: "#9CA3AF",
                    lineHeight: 1,
                    mt: 0.2,
                    textTransform: "uppercase",
                  }}
                >
                  {p?.strUOM}
                </Typography>
              </Box>
            )}
            {showRemove && (
              <Box
                sx={{
                  width: 28,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ml: 1,
                }}
              >
                {removingOptionId === p?.nPurchaseOptionId ? (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fecaca",
                        borderTopColor: "#ef4444",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                  </Box>
                ) : (
                  <IconButton
                    size="small"
                    disabled={removingOptionId !== null}
                    onClick={() => handleRemoveOption(p?.nPurchaseOptionId)}
                    sx={{
                      width: 22,
                      height: 22,
                      color: "#ef4444",
                      border: "0.5px solid rgba(239,68,68,0.3)",
                      borderRadius: "6px",
                      "&:hover": { background: "rgba(239,68,68,0.08)" },
                      p: 0,
                    }}
                  >
                    <RemoveShoppingCart sx={{ fontSize: "0.8rem" }} />
                  </IconButton>
                )}
              </Box>
            )}
            {showArrived && (
              <Box
                sx={{
                  width: 52,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ml: 1,
                }}
              >
                <MiniBaseButton.Green
                  icon={<Inventory2Outlined />}
                  lightMode
                  onClick={() => {
                    setArrivedOptionId(p?.nPurchaseOptionId);
                    setReceivedQty("");
                    setDeliveredQty("");
                    setReceivedSerials([]);
                    setDeliveredSerials([]);
                    setShowReceivedSNOnly(false);
                    setShowDeliveredSNOnly(false);
                    setShowReceivedView(false);
                    setShowDeliveredView(false);
                    onArrivedViewChange?.(true);
                  }}
                />
              </Box>
            )}
          </Box>
        );
      })}

      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)",
        }}
      >
        <IconBox
          bg="rgba(255,255,255,0.08)"
          border="0.5px solid rgba(255,255,255,0.12)"
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#90caf9" }} />
        </IconBox>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.2,
            }}
          >
            Order Total
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.2,
            }}
          >
            {options.length} item{options.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ width: 44, flexShrink: 0 }} />
        <Box sx={{ width: 80, flexShrink: 0, textAlign: "right", pl: 1 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#FAC775",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {fmtPHP(localTotal)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
