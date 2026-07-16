import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ReceiptLongOutlined,
  Inventory2Outlined,
  RemoveShoppingCart,
  EditOutlined,
  ArrowBackOutlined,
  CheckCircleOutlined,
  LocalShippingOutlined,
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
  desc: "This will add to the received inventory count for this item.",
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
  desc: "This will add to the delivered inventory count for this item.",
  confirmLabel: "Yes, Confirm Delivered",
  confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
};

export default function LineItems({
  options, // ← now liveOptions from modal
  onPatchOption, // ← new prop — bubbles patch up to modal
  total,
  openCartKey,
  closeCartKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  currentUserId,
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
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [savingReceived, setSavingReceived] = useState(false);
  const [savingDelivered, setSavingDelivered] = useState(false);
  const [confirmReceived, setConfirmReceived] = useState(false);
  const [confirmDelivered, setConfirmDelivered] = useState(false);
  const [savingConfirm, setSavingConfirm] = useState(false);

  // arrivedItem reads from options (which is now liveOptions from modal)
  const arrivedItem = useMemo(() => {
    if (arrivedOptionId == null) return null;
    const opt = options.find(
      (o) => o.purchase_option?.nPurchaseOptionId === arrivedOptionId,
    );
    return opt ? { opt, p: opt.purchase_option } : null;
  }, [arrivedOptionId, options]);

  const stateRef = useRef();
  stateRef.current = {
    showReceivedField,
    showDeliveredField,
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
      receivedQty,
      deliveredQty,
      receivedSerials,
      deliveredSerials,
      p,
    } = stateRef.current;

    if (showReceivedField) {
      if (receivedSerials.includes(text)) return;
      if (receivedSerials.length >= (Number(receivedQty) || 0)) {
        setScannerError("Received quantity limit reached.");
        return;
      }
      setReceivedSerials((prev) => [...prev, text]);
    } else if (showDeliveredField) {
      if (deliveredSerials.includes(text)) return;
      if (deliveredSerials.length >= (Number(deliveredQty) || 0)) {
        setScannerError("Delivered quantity limit reached.");
        return;
      }
      const alreadyDelivered = p?.deliveredSerialNumbers || [];
      const availableSerials = (p?.receivedSerialNumbers || []).filter(
        (sn) => !alreadyDelivered.includes(sn),
      );
      if (p?.receivedSerialNumbers && !availableSerials.includes(text)) {
        setScannerError(
          "This S/N was not part of the received items, or was already delivered.",
        );
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

    // Serials already received but not yet marked delivered — only these are
    // eligible to be scanned/typed into the "delivered" S/N list.
    const availableForDelivery = (p?.receivedSerialNumbers || []).filter(
      (sn) => !(p?.deliveredSerialNumbers || []).includes(sn),
    );

    // ── Always additive: the number typed is how many MORE units are being
    // added on top of whatever is already received/delivered. ─────────────
    const handleReceivedSave = async () => {
      if (receivedQty === "" || Number(receivedQty) <= 0) return;
      const addQty = Number(receivedQty);
      const newReceived = (p?.nInventoryQty || 0) + addQty;
      const currentDelivered = p?.nDeliveredQty || 0;
      if (newReceived < currentDelivered) {
        setReceivedError(
          `Received can't be less than Delivered (${currentDelivered}).`,
        );
        return;
      }
      if (receivedSerials.length > addQty) {
        setReceivedError(
          `You have ${receivedSerials.length} serial number(s) but only ${addQty} being added. Remove extra SNs first.`,
        );
        return;
      }
      setReceivedError("");
      setConfirmReceived(true);
    };

    const executeReceivedSave = async () => {
      const addQty = Number(receivedQty);
      const newReceived = (p?.nInventoryQty || 0) + addQty;
      const combinedSerials = [
        ...(p?.receivedSerialNumbers || []),
        ...receivedSerials,
      ];
      const prevInventoryQty = p?.nInventoryQty;
      const prevReceivedSerials = p?.receivedSerialNumbers;
      setSavingConfirm(true);
      onSavingChange?.(true);

      // ── OPTIMISTIC PATCH — bubbles to modal's liveOptions ─────────────────
      patchOption(p?.nPurchaseOptionId, {
        nInventoryQty: newReceived,
        receivedSerialNumbers: combinedSerials,
      });
      setConfirmReceived(false);
      setShowReceivedField(false);
      setShowReceivedSN(false);
      setReceivedQty("");
      setReceivedSerials([]);
      // ─────────────────────────────────────────────────────────────────────

      try {
        await onMarkReceived?.(
          p?.nPurchaseOptionId,
          newReceived,
          "",
          p?.nInventoryId,
          p?.nDeliveredInventoryId,
          combinedSerials,
          p?.deliveredSerialNumbers || [],
        );
      } catch (err) {
        console.error("Failed to save received:", err);
        // Roll back
        patchOption(p?.nPurchaseOptionId, {
          nInventoryQty: prevInventoryQty,
          receivedSerialNumbers: prevReceivedSerials,
        });
        setReceivedError("Save failed. Please try again.");
      } finally {
        setSavingConfirm(false);
        onSavingChange?.(false);
      }
    };

    const handleDeliveredSave = async () => {
      if (deliveredQty === "" || Number(deliveredQty) <= 0) return;
      const addQty = Number(deliveredQty);
      if (deliveredSerials.length > addQty) {
        setDeliveredError(
          `You have ${deliveredSerials.length} serial number(s) but only ${addQty} being added. Remove extra SNs first.`,
        );
        return;
      }
      setDeliveredError("");
      setConfirmDelivered(true);
    };

    const executeDeliveredSave = async () => {
      const addQty = Number(deliveredQty);
      const newDelivered = (p?.nDeliveredQty || 0) + addQty;
      const combinedSerials = [
        ...(p?.deliveredSerialNumbers || []),
        ...deliveredSerials,
      ];
      const prevDeliveredQty = p?.nDeliveredQty;
      const prevDeliveredSerials = p?.deliveredSerialNumbers;
      setSavingConfirm(true);
      onSavingChange?.(true);

      // ── OPTIMISTIC PATCH — bubbles to modal's liveOptions ─────────────────
      patchOption(p?.nPurchaseOptionId, {
        nDeliveredQty: newDelivered,
        deliveredSerialNumbers: combinedSerials,
      });
      setConfirmDelivered(false);
      setShowDeliveredField(false);
      setShowDeliveredSN(false);
      setDeliveredQty("");
      setDeliveredSerials([]);
      // ─────────────────────────────────────────────────────────────────────

      try {
        await onMarkReceived?.(
          p?.nPurchaseOptionId,
          "",
          newDelivered,
          null,
          p?.nDeliveredInventoryId,
          [],
          combinedSerials,
        );
      } catch (err) {
        console.error("Failed to save delivered:", err);
        // Roll back
        patchOption(p?.nPurchaseOptionId, {
          nDeliveredQty: prevDeliveredQty,
          deliveredSerialNumbers: prevDeliveredSerials,
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
              Scan Barcode — {showReceivedField ? "Received" : "Delivered"}
            </Typography>
            <Typography
              sx={{ fontSize: "0.6rem", fontWeight: 600, color: "#3B82F6" }}
            >
              {showReceivedField
                ? receivedSerials.length
                : deliveredSerials.length}{" "}
              /{" "}
              {showReceivedField
                ? Number(receivedQty) || 0
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
          {(showReceivedField ? receivedSerials : deliveredSerials).length >
            0 && (
            <Box sx={{ px: 1.5, py: 1, maxHeight: 100, overflowY: "auto" }}>
              {(showReceivedField ? receivedSerials : deliveredSerials).map(
                (sn) => (
                  <Typography
                    key={sn}
                    sx={{ fontSize: "0.6rem", color: "#374151", py: 0.2 }}
                  >
                    ✓ {sn}
                  </Typography>
                ),
              )}
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

    const resetFormState = (clearAll = false) => {
      setShowReceivedField(false);
      setShowDeliveredField(false);
      setShowReceivedSN(false);
      setShowDeliveredSN(false);
      setReceivedQty("");
      setDeliveredQty("");
      setReceivedSerials([]);
      setDeliveredSerials([]);
      setReceivedError("");
      setDeliveredError("");
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
          {!showDeliveredField && (
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
                <MiniBaseButton
                  icon={<EditOutlined />}
                  label={"Add Received"}
                  variant="green"
                  disabled={showReceivedField || maxQty <= 0}
                  lightMode
                  tooltip={maxQty <= 0 ? "Fully received" : undefined}
                  onClick={() => {
                    const next = !showReceivedField;
                    setShowReceivedField(next);
                    setShowDeliveredField(false);
                    setShowDeliveredSN(false);
                    setDeliveredQty("");
                    setReceivedError("");
                    setDeliveredError("");
                    // Always start at 0 — this field is always an addition,
                    // never a pre-filled edit of the existing total.
                    setReceivedQty(next ? "" : "");
                    setShowReceivedSN(false);
                    setReceivedSerials([]);
                  }}
                  sx={{ flexShrink: 0 }}
                />
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
                    Quantity to Add
                  </Typography>
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

          {(p?.nInventoryQty || 0) > 0 && !showReceivedField && (
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
                <MiniBaseButton
                  icon={<EditOutlined />}
                  label={"Add Delivered"}
                  variant="green"
                  // Fixed: this used to also require showDeliveredField to be
                  // true before the "nothing received yet" check applied,
                  // which meant it could look enabled/disabled inconsistently
                  // depending on whether the form was open. Now it simply
                  // reflects whether there's anything available to deliver.
                  disabled={(p?.nInventoryQty || 0) === 0 || deliveredMax <= 0}
                  lightMode
                  tooltip={
                    (p?.nInventoryQty || 0) === 0
                      ? "No received inventory yet"
                      : deliveredMax <= 0
                        ? "Fully delivered"
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
                    // Always start at 0 — always an addition, never a
                    // pre-filled edit of the existing total.
                    setDeliveredQty(next ? "" : "");
                    setShowDeliveredSN(false);
                    setDeliveredSerials([]);
                  }}
                  sx={{ flexShrink: 0 }}
                />
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
                    Quantity to Add
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      component="input"
                      type="number"
                      min={0}
                      max={deliveredMax}
                      value={deliveredQty}
                      placeholder=" "
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
                        allowedValues: availableForDelivery,
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
              flex: showReceivedField || showDeliveredField ? 1 : "1 1 100%",
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
                if (showReceivedField || showDeliveredField) {
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
                disabled={
                  savingReceived ||
                  receivedQty === "" ||
                  Number(receivedQty) <= 0
                }
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
                  Number(deliveredQty) <= 0
                }
                onClick={handleDeliveredSave}
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
