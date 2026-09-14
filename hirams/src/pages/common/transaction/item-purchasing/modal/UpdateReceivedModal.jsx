import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Inventory2Outlined,
  CheckCircleOutlined,
  PhotoCameraOutlined,
} from "@mui/icons-material";
import FormGrid from "../../../../../components/form/FormGrid.jsx";
import { BrowserMultiFormatReader } from "@zxing/browser";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import SerialNumberAPI from "../../../../../api/endpoints/serial-number.api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import { fmtDate } from "../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

// ── ✅ INLINE COLOR MAPPER — ONLY TOKENS THIS COMPONENT ACTUALLY USES ─────────
const useColors = (c) => ({
  // Container / backgrounds
  cardBg: c.slate.outerBg,
  cardBorder: c.slate.border,
  inputBg: c.gray.inputBg,
  inputBorder: c.slate.btnBorder,
  inputFocusBorder: c.blue.text,
  // Text
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  // Blue / Primary
  blueText: c.blue.text,
  blueTextAlt: c.blue.textStrong,
  blueBg: c.blue.bg,
  blueBgSoft: c.blue.bgSoft,
  blueBorder: c.blue.border,
  // Green / To Receive
  greenText: c.green.text,
  // Deep Blue / Received status
  deepBlueText: c.teal.text,
  // Orange / Warning
  orangeText: c.orange.text,
  orangeBorder: c.orange.border,
  // Red / Error
  errorText: c.red.text,
  errorBg: c.red.bg,
  // Divider
  divider: c.slate.divider,
  // Button states
  btnBgDisabled: c.slate.btnBg,
});

// ── Shared Sub-components ──────────────────────────────────────────────────
export const IconBox = ({
  size = 34,
  bg,
  border,
  radius = "8px",
  mr = 1,
  children,
  sx = {},
  isDark = false,
}) => {
  const themePalette = getThemeColors(isDark);
  const c = useColors(themePalette);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg || c.btnBgDisabled,
        border: border || c.inputBorder,
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

// ── Main Component ──────────────────────────────────────────────────────────
export default function UpdateReceivedModal({
  open,
  onClose,
  p,
  patchOption,
  nPurchaseOrderId,
  currentUserId,
  forDeliveryKey,
  deliveredKey,
  pendingReceiptKey,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [receivedQty, setReceivedQty] = useState("");
  const [showReceivedSN, setShowReceivedSN] = useState(false);
  const [receivedSerials, setReceivedSerials] = useState([]);
  const [receivedError, setReceivedError] = useState("");
  const [receivedReceiptNo, setReceivedReceiptNo] = useState("");

  // ── Scanner ───────────────────────────────────────────────────────────────
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // ── Reset on open/close ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setReceivedQty("");
      setShowReceivedSN(false);
      setReceivedSerials([]);
      setReceivedError("");
      setReceivedReceiptNo("");
      setShowScanner(false);
      setScannerError("");
    }
  }, [open, p?.nPurchaseItemId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
  const isReceivedSingle =
    !((p?.nInventoryQty || 0) >= (p?.nQuantity || 0)) && maxQty === 1;
  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";
  const isFormValid =
    receivedQty !== "" &&
    Number(receivedQty) > 0 &&
    receivedReceiptNo.trim() !== "";

  // ── Scanner logic ──────────────────────────────────────────────────────────
  const handleScanResult = (text) => {
    const limit = Number(receivedQty) || 0;
    if (receivedSerials.includes(text)) return;
    if (receivedSerials.length >= limit) {
      setScannerError("Received quantity limit reached.");
      return;
    }
    setReceivedSerials((prev) => [...prev, text]);
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

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (receivedQty === "") return "Quantity is required.";
    const newReceived = Number(receivedQty);
    const currentDelivered = p?.nDeliveredQty || 0;
    if (!receivedReceiptNo.trim())
      return "Receipt No. is required for received items.";
    if (newReceived < currentDelivered)
      return `Received can't be less than Delivered (${currentDelivered}). Adjust Delivered first.`;
    if (receivedSerials.length > newReceived)
      return `You have ${receivedSerials.length} serial number(s) but only ${newReceived} received. Remove extra SNs first.`;
    return null;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) {
      setReceivedError(err);
      return;
    }
    setReceivedError("");
    const newReceived = Number(receivedQty);
    const receiptNo = receivedReceiptNo.trim();
    const nPurchaseItemId = p?.nPurchaseItemId;

    patchOption?.(nPurchaseItemId, {
      nInventoryQty: (p?.nInventoryQty || 0) + newReceived,
      receivedSerialNumbers: [
        ...(p?.receivedSerialNumbers || []),
        ...receivedSerials,
      ],
    });
    onClose?.();

    try {
      await withSpinner("Inventory", async () => {
        const res = await InventoryAPI.createInventory({
          nPurchaseItemId,
          nQuantity: newReceived,
          strReceiptNumber: receiptNo || null,
          cStatus: "A",
        });
        const newInventoryId = res.inventory?.nInventoryId ?? null;
        if (newInventoryId && receivedSerials.length > 0) {
          for (const sn of receivedSerials) {
            await SerialNumberAPI.createSerialNumber({
              nInventoryId: newInventoryId,
              strSerialNumber: sn,
            });
          }
        }
        if (nPurchaseOrderId && currentUserId != null) {
          await PurchaseOrderAPI.syncStatus({
            nPurchaseOrderId,
            nPurchaseItemId,
            nUserId: currentUserId,
            nReceivedStatus: forDeliveryKey,
            nDeliveredStatus: deliveredKey,
            nPaidStatus: pendingReceiptKey,
          });
        }
      });
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      window.dispatchEvent(new CustomEvent("cart_data_updated"));
      await showSwal(
        "SUCCESS",
        {},
        {
          entity: `${newReceived} ${p?.strUOM ?? ""} received`,
          action: "recorded",
        },
      );
    } catch (apiErr) {
      console.error("Failed to save received:", apiErr);
      patchOption?.(nPurchaseItemId, {
        nInventoryQty: p?.nInventoryQty,
        receivedSerialNumbers: p?.receivedSerialNumbers,
      });
      await showSwal("ERROR", {}, { entity: "Received items", action: "save" });
    }
  };
  // ── Sub-components ─────────────────────────────────────────────────────────
  const SNField = ({ name, value, onChange, max }) => (
    <FormGrid
      fields={[
        {
          name,
          label: "Serial Numbers",
          type: "serialNumber",
          xs: 12,
          placeholder: "Scan or type S/N and press Enter...",
          maxItems: max,
        },
      ]}
      switches={[]}
      formData={{ [name]: value }}
      errors={{}}
      handleChange={(e) => {
        if (e.target.name === name) onChange(e.target.value);
      }}
      autoFocus={false}
    />
  );

  // ── Scanner view ──────────────────────────────────────────────────────────
  if (showScanner) {
    return (
      <ModalContainer
        open={open}
        handleClose={stopScanner}
        title="Scan Barcode"
        subTitle={`Received — ${receivedSerials.length} / ${Number(receivedQty) || 0}`}
        showSave={false}
        cancelLabel="Done Scanning"
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            background: "#000",
            borderRadius: "8px",
            overflow: "hidden",
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
              fontSize: "0.75rem",
              fontWeight: 600,
              color: c.errorText,
              mt: 1.5,
              p: 1,
              background: c.errorBg,
              borderRadius: "6px",
            }}
          >
            {scannerError}
          </Typography>
        )}
        {receivedSerials.length > 0 && (
          <Box sx={{ mt: 1.5, maxHeight: 120, overflowY: "auto" }}>
            {receivedSerials.map((sn) => (
              <Typography
                key={sn}
                sx={{ fontSize: "0.75rem", color: c.textSecondary, py: 0.25 }}
              >
                ✓ {sn}
              </Typography>
            ))}
          </Box>
        )}
      </ModalContainer>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Update Received"
      subTitle={itemLabel || "/ Item"}
      onSave={handleSave}
      saveLabel="Confirm Received"
      onCancel={onClose}
      disableBackdropClick
      contentPadding={{ xs: 2, sm: 3 }}
      disabled={!isFormValid}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header Card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.25,
            background: c.cardBg,
            borderRadius: "8px",
            border: `0.5px solid ${c.cardBorder}`,
          }}
        >
          <IconBox
            bg={c.blueBg}
            border={`0.5px solid ${c.blueBorder}`}
            isDark={isDark}
          >
            <Inventory2Outlined
              sx={{ fontSize: "0.95rem", color: c.blueText }}
            />
          </IconBox>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: c.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {itemLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.6rem",
                color: c.textMuted,
                mt: 0.15,
                lineHeight: 1.2,
              }}
            >
              Delivery:{" "}
              {fmtDate(
                p?.transaction_item?.transaction?.dtDelivery ??
                  "No Delivery Date Attached.",
              )}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flexShrink: 0, px: 1, minWidth: 64 }}>
            <Typography
              sx={{
                fontSize: "0.5rem",
                color: c.blueText,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 700,
              }}
            >
              Ordered
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: c.blueText,
                lineHeight: 1.1,
                mt: 0.15,
              }}
            >
              {p?.nQuantity || 0}{" "}
              <Box
                component="span"
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: c.blueTextAlt,
                  textTransform: "uppercase",
                }}
              >
                {p?.strUOM ?? ""}
              </Box>
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: c.divider, my: 0.5 }}
          />
          <Box
            sx={{ textAlign: "center", flexShrink: 0, px: 0.75, minWidth: 56 }}
          >
            <Typography
              sx={{
                fontSize: "0.5rem",
                color: c.greenText,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 700,
              }}
            >
              To Rcv
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: c.greenText,
                lineHeight: 1.1,
                mt: 0.15,
              }}
            >
              {maxQty}
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: c.divider, my: 0.5 }}
          />
          <Box
            sx={{ textAlign: "center", flexShrink: 0, px: 0.75, minWidth: 56 }}
          >
            <Typography
              sx={{
                fontSize: "0.5rem",
                color: c.deepBlueText,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 700,
              }}
            >
              Rcvd
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: c.deepBlueText,
                lineHeight: 1.1,
                mt: 0.15,
              }}
            >
              {p?.nInventoryQty ?? 0}
            </Typography>
          </Box>
        </Box>

        {/* Quantity Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Quantity to Receive
          </Typography>
          {isReceivedSingle ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="button"
                onClick={() => setReceivedQty("1")}
                sx={{
                  flex: 1,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.75,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: receivedQty === "1" ? "#fff" : c.blueText,
                  background: receivedQty === "1" ? c.blueText : c.blueBgSoft,
                  border: `0.5px solid ${c.blueBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <CheckCircleOutlined sx={{ fontSize: "1rem" }} />
                {receivedQty === "1"
                  ? "Selected — 1 Received"
                  : `Mark 1 ${p?.strUOM ?? ""} Received`}
              </Box>
              <Box
                component="button"
                onClick={() => setShowReceivedSN((v) => !v)}
                disabled={receivedQty === "" || Number(receivedQty) <= 0}
                sx={{
                  height: 40,
                  px: 1.25,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: showReceivedSN ? c.blueText : c.textMuted,
                  background: showReceivedSN ? c.blueBgSoft : c.cardBg,
                  border: `0.5px solid ${showReceivedSN ? c.blueBorder : c.inputBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  "&:hover": {
                    background: c.blueBgSoft,
                    color: c.blueText,
                    borderColor: c.blueBorder,
                  },
                  "&:disabled": {
                    opacity: 0.5,
                    cursor: "not-allowed",
                    background: c.btnBgDisabled,
                    color: c.textFaint,
                    borderColor: c.inputBorder,
                  },
                }}
              >
                {showReceivedSN ? "− SN" : "+ SN"}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                <Box
                  component="input"
                  type="number"
                  min={0}
                  max={maxQty}
                  value={receivedQty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= maxQty) setReceivedQty(e.target.value);
                  }}
                  sx={{
                    flex: 1,
                    height: 40,
                    px: 1.25,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: c.textPrimary,
                    border: `0.5px solid ${c.inputBorder}`,
                    borderRight: "none",
                    borderRadius: "9px 0 0 9px",
                    outline: "none",
                    background: c.inputBg,
                    "&:focus": { borderColor: c.inputFocusBorder },
                    "&::-webkit-inner-spin-button": {
                      WebkitAppearance: "none",
                    },
                  }}
                />
                <Box
                  sx={{
                    height: 40,
                    px: 1.5,
                    display: "flex",
                    alignItems: "center",
                    background: c.btnBgDisabled,
                    border: `0.5px solid ${c.inputBorder}`,
                    borderRadius: "0 9px 9px 0",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: c.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      lineHeight: 1,
                    }}
                  >
                    {p?.strUOM ?? "—"}
                  </Typography>
                </Box>
              </Box>
              <Box
                component="button"
                onClick={() => setShowReceivedSN((v) => !v)}
                disabled={receivedQty === "" || Number(receivedQty) <= 0}
                sx={{
                  height: 40,
                  px: 1.25,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: showReceivedSN ? c.blueText : c.textMuted,
                  background: showReceivedSN ? c.blueBgSoft : c.cardBg,
                  border: `0.5px solid ${showReceivedSN ? c.blueBorder : c.inputBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  "&:hover": {
                    background: c.blueBgSoft,
                    color: c.blueText,
                    borderColor: c.blueBorder,
                  },
                  "&:disabled": {
                    opacity: 0.5,
                    cursor: "not-allowed",
                    background: c.btnBgDisabled,
                    color: c.textFaint,
                    borderColor: c.inputBorder,
                  },
                }}
              >
                {showReceivedSN ? "− SN" : "+ SN"}
              </Box>
            </Box>
          )}
        </Box>

        {/* Serial Numbers Section */}
        {showReceivedSN && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
              <Box sx={{ flex: 1 }}>
                <SNField
                  name="receivedSerials"
                  value={receivedSerials}
                  onChange={setReceivedSerials}
                  max={Number(receivedQty) || 0}
                />
              </Box>
              <Box
                component="button"
                onClick={() => {
                  setScannerError("");
                  setShowScanner(true);
                }}
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c.blueText,
                  background: c.blueBg,
                  border: `0.5px solid ${c.blueBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  flexShrink: 0,
                  mt: 0.25,
                  "&:hover": { background: c.blueBgSoft },
                  transition: "all 0.15s",
                }}
                title="Use camera to scan barcode"
              >
                <PhotoCameraOutlined sx={{ fontSize: "1rem" }} />
              </Box>
            </Box>
          </Box>
        )}

        {/* Receipt No. Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Receipt No.
          </Typography>
          <Box
            component="input"
            type="text"
            value={receivedReceiptNo}
            placeholder="e.g. RR-2025-0001"
            onChange={(e) => setReceivedReceiptNo(e.target.value)}
            sx={{
              height: 40,
              px: 1.25,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: c.textPrimary,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "9px",
              outline: "none",
              background: c.inputBg,
              "&:focus": { borderColor: c.inputFocusBorder },
            }}
          />
        </Box>

        {/* Error Bar */}
        {receivedError && (
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: c.errorText,
              p: 1,
              background: c.errorBg,
              borderRadius: "6px",
              mt: 0.5,
            }}
          >
            {receivedError}
          </Typography>
        )}
      </Box>
    </ModalContainer>
  );
}
