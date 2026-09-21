import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LocalShippingOutlined,
  CheckCircleOutlined,
  PhotoCameraOutlined,
} from "@mui/icons-material";
import FormGrid from "../../../../../../../components/form/FormGrid.jsx";
import { BrowserMultiFormatReader } from "@zxing/browser";
import ModalContainer from "../../../../../../../layouts/modal/ModalContainer.jsx";
import InventoryAPI from "../../../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../../../api/endpoints/purchase-order.api.js";
import SerialNumberAPI from "../../../../../../../api/endpoints/serial-number.api.js";
import {
  showSwal,
  withSpinner,
} from "../../../../../../../utils/helpers/swal.jsx";
import getThemeColors from "../../../../../../../utils/style/getThemeColors.js";
import { fmtDate } from "../../../../../../../utils/formatters/formatter.js";

// ── ✅ Inline color map — ONLY tokens this component uses ──────────────────
const useColors = (c) => ({
  // Container / backgrounds
  cardBg: c.slate.outerBg,
  cardBorder: c.slate.border,
  inputBg: c.gray.inputBg,
  inputBorder: c.slate.btnBorder,
  inputFocusBorder: c.green.text,
  // Text
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  // Green / Success
  greenText: c.green.text,
  greenTextAlt: c.green.textDark,
  greenBg: c.green.bg,
  greenBorder: c.green.border,
  greenBgSoft: c.green.bgSoft,
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

// ── Shared Sub-components ────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────
const incrementReceiptNo = (str) => {
  if (!str) return "";
  const match = String(str).match(/(\d+)(\D*)$/);
  if (!match) return "";
  const numStr = match[1],
    suffix = match[2] || "";
  return (
    str.slice(0, match.index) +
    String(Number(numStr) + 1).padStart(numStr.length, "0") +
    suffix
  );
};

export default function UpdateDeliveredModal({
  open,
  onClose,
  p,
  patchOption,
  nPurchaseOrderId,
  currentUserId,
  forDeliveryKey,
  deliveredKey,
  pendingReceiptKey,
  latestDeliveredReceipt,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  // ── Form state ──────────────────────────────────────────────────────────
  const [deliveredQty, setDeliveredQty] = useState("");
  const [showDeliveredSN, setShowDeliveredSN] = useState(false);
  const [deliveredSerials, setDeliveredSerials] = useState([]);
  const [deliveredError, setDeliveredError] = useState("");
  const [deliveredReceiptNo, setDeliveredReceiptNo] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // ── Reset on open/close ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setDeliveredQty("");
      setShowDeliveredSN(false);
      setDeliveredSerials([]);
      setDeliveredError("");
      setDeliveredReceiptNo("");
      setShowScanner(false);
      setScannerError("");
    }
  }, [open, p?.nPurchaseItemId]);

  // ── Derived values ──────────────────────────────────────────────────────
  const deliveredMax = Math.max(
    0,
    (p?.nInventoryQty || 0) - (p?.nDeliveredQty || 0),
  );
  const isDeliveredSingle =
    !((p?.nDeliveredQty || 0) >= (p?.nQuantity || 0)) &&
    (p?.nInventoryQty || 0) > 0 &&
    deliveredMax === 1;
  const undeliveredSerials = (p?.receivedSerialNumbers || []).filter(
    (sn) => !(p?.deliveredSerialNumbers || []).includes(sn),
  );
  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" · ") ||
    p?.transaction_item?.strName ||
    "Item";
  const deliveredReceiptPlaceholder =
    incrementReceiptNo(latestDeliveredReceipt) || "e.g. RN-00XXX";
  const isFormValid =
    deliveredQty !== "" &&
    Number(deliveredQty) > 0 &&
    deliveredReceiptNo.trim() !== "";

  // ── Scanner logic ───────────────────────────────────────────────────────
  const handleScanResult = (text) => {
    const limit = Number(deliveredQty) || 0;
    if (deliveredSerials.includes(text)) return;
    if (deliveredSerials.length >= limit)
      return setScannerError("Delivered quantity limit reached.");
    if (p?.receivedSerialNumbers && !p.receivedSerialNumbers.includes(text)) {
      return setScannerError("This S/N was not part of the received items.");
    }
    setDeliveredSerials((prev) => [...prev, text]);
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
      } catch {}
    };
  }, [showScanner]);

  const stopScanner = () => {
    try {
      codeReaderRef.current?.reset();
    } catch {}
    codeReaderRef.current = null;
    setShowScanner(false);
    setScannerError("");
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    if (deliveredQty === "") return "Quantity is required.";
    if (!deliveredReceiptNo.trim())
      return "Receipt No. is required for delivered items.";
    if (deliveredSerials.length > Number(deliveredQty))
      return `You have ${deliveredSerials.length} serial number(s) but only ${deliveredQty} delivered. Remove extra SNs first.`;
    const requiredSerials = Math.min(
      Number(deliveredQty),
      undeliveredSerials.length,
    );
    if (requiredSerials > 0 && deliveredSerials.length < requiredSerials) {
      return `Please add ${requiredSerials} serial number(s) to match the delivered quantity (only ${undeliveredSerials.length} available).`;
    }
    return null;
  };

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) return setDeliveredError(err);
    setDeliveredError("");
    const newDelivered = Number(deliveredQty),
      receiptNo = deliveredReceiptNo.trim();
    const nPurchaseItemId = p?.nPurchaseItemId;

    // Optimistic patch
    patchOption?.(nPurchaseItemId, {
      nDeliveredQty: (p?.nDeliveredQty || 0) + newDelivered,
      deliveredSerialNumbers: [
        ...(p?.deliveredSerialNumbers || []),
        ...deliveredSerials,
      ],
    });
    onClose?.();

    try {
      await withSpinner("Inventory", async () => {
        const res = await InventoryAPI.createInventory({
          nPurchaseItemId,
          nQuantity: -newDelivered,
          strReceiptNumber: receiptNo || null,
          cStatus: "A",
        });
        const newInventoryId = res?.inventory?.nInventoryId ?? null;
        if (newInventoryId && deliveredSerials.length > 0) {
          for (const sn of deliveredSerials) {
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
          entity: `${newDelivered} ${p?.strUOM ?? ""} delivered`,
          action: "recorded",
        },
      );
    } catch (apiErr) {
      console.error("Failed to save delivered:", apiErr);
      patchOption?.(nPurchaseItemId, {
        nDeliveredQty: p?.nDeliveredQty,
        deliveredSerialNumbers: p?.deliveredSerialNumbers,
      });
      await showSwal(
        "ERROR",
        {},
        { entity: "Delivered items", action: "save" },
      );
    }
  };

  // ── Serial Number Field ──────────────────────────────────────────────────
  const SNField = ({ name, value, onChange, max, allowedValues }) => (
    <FormGrid
      fields={[
        {
          name,
          label: "Serial Numbers",
          type: "serialNumber",
          xs: 12,
          placeholder: "Scan or type S/N and press Enter...",
          maxItems: max,
          ...(allowedValues ? { allowedValues } : {}),
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

  // ── Scanner view ────────────────────────────────────────────────────────
  if (showScanner)
    return (
      <ModalContainer
        open={open}
        handleClose={stopScanner}
        title="Scan Barcode"
        subTitle={`Delivered — ${deliveredSerials.length} / ${Number(deliveredQty) || 0}`}
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
        {deliveredSerials.length > 0 && (
          <Box sx={{ mt: 1.5, maxHeight: 120, overflowY: "auto" }}>
            {deliveredSerials.map((sn) => (
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

  // ── Main form ───────────────────────────────────────────────────────────
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Update Delivered"
      subTitle={itemLabel}
      onSave={handleSave}
      saveLabel="Confirm Delivered"
      onCancel={onClose}
      cancelLabel="Back"
      disableBackdropClick
      contentPadding={{ xs: 2, sm: 3 }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header Card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            p: 1.25,
            background: c.cardBg,
            borderRadius: "8px",
            border: `0.5px solid ${c.cardBorder}`,
          }}
        >
          <IconBox
            bg={c.greenBg}
            border={`0.5px solid ${c.greenBorder}`}
            isDark={isDark}
          >
            <LocalShippingOutlined
              sx={{ fontSize: "0.95rem", color: c.greenText }}
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
          <Box
            sx={{ textAlign: "right", flexShrink: 0, px: 0.75, minWidth: 56 }}
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
              Order
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
              {p?.nQuantity || 0}{" "}
              <Box
                component="span"
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: c.greenTextAlt,
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
            sx={{ textAlign: "center", flexShrink: 0, px: 0.75, minWidth: 52 }}
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
              Delivered
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
              {p?.nDeliveredQty ?? 0}
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: c.divider, my: 0.5 }}
          />
          <Box
            sx={{ textAlign: "center", flexShrink: 0, px: 0.75, minWidth: 52 }}
          >
            <Typography
              sx={{
                fontSize: "0.5rem",
                color: c.orangeText,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 700,
              }}
            >
              Available
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: c.orangeText,
                lineHeight: 1.1,
                mt: 0.15,
              }}
            >
              {deliveredMax}
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
            Quantity to Deliver
          </Typography>
          {isDeliveredSingle ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="button"
                onClick={() => setDeliveredQty("1")}
                sx={{
                  flex: 1,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.75,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: deliveredQty === "1" ? "#fff" : c.greenText,
                  background:
                    deliveredQty === "1" ? c.greenText : c.greenBgSoft,
                  border: `0.5px solid ${c.greenBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <LocalShippingOutlined sx={{ fontSize: "1rem" }} />
                {deliveredQty === "1"
                  ? "Selected — 1 Delivered"
                  : `Mark 1 ${p?.strUOM ?? ""} Delivered`}
              </Box>
              <Box
                component="button"
                onClick={() => setShowDeliveredSN((v) => !v)}
                disabled={deliveredQty === "" || Number(deliveredQty) <= 0}
                sx={{
                  height: 40,
                  px: 1.25,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: showDeliveredSN ? c.greenText : c.textMuted,
                  background: showDeliveredSN ? c.greenBgSoft : c.cardBg,
                  border: `0.5px solid ${showDeliveredSN ? c.greenBorder : c.inputBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  "&:hover": {
                    background: c.greenBgSoft,
                    color: c.greenText,
                    borderColor: c.greenBorder,
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
                {showDeliveredSN ? "− SN" : "+ SN"}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                <Box
                  component="input"
                  type="number"
                  min={0}
                  max={deliveredMax}
                  value={deliveredQty}
                  placeholder="0"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v <= deliveredMax) setDeliveredQty(e.target.value);
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
                onClick={() => setShowDeliveredSN((v) => !v)}
                disabled={deliveredQty === "" || Number(deliveredQty) <= 0}
                sx={{
                  height: 40,
                  px: 1.25,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: showDeliveredSN ? c.greenText : c.textMuted,
                  background: showDeliveredSN ? c.greenBgSoft : c.cardBg,
                  border: `0.5px solid ${showDeliveredSN ? c.greenBorder : c.inputBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  "&:hover": {
                    background: c.greenBgSoft,
                    color: c.greenText,
                    borderColor: c.greenBorder,
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
                {showDeliveredSN ? "− SN" : "+ SN"}
              </Box>
            </Box>
          )}
        </Box>

        {/* Serial Numbers Section */}
        {showDeliveredSN && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
              <Box sx={{ flex: 1 }}>
                <SNField
                  name="deliveredSerials"
                  value={deliveredSerials}
                  onChange={setDeliveredSerials}
                  max={Number(deliveredQty) || 0}
                  allowedValues={undeliveredSerials}
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
                  color: c.greenText,
                  background: c.greenBg,
                  border: `0.5px solid ${c.greenBorder}`,
                  borderRadius: "9px",
                  cursor: "pointer",
                  flexShrink: 0,
                  mt: 0.25,
                  "&:hover": { background: c.greenBgSoft },
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
            <span
              style={{
                fontSize: "0.55rem",
                color: c.textFaint,
                fontWeight: 400,
                marginLeft: "0.5rem",
                textTransform: "none",
                letterSpacing: "normal",
              }}
            >
              (Press Enter to apply suggestion)
            </span>
          </Typography>
          <Box
            component="input"
            type="text"
            value={deliveredReceiptNo}
            placeholder={deliveredReceiptPlaceholder}
            onChange={(e) => setDeliveredReceiptNo(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !deliveredReceiptNo.trim() &&
                deliveredReceiptPlaceholder &&
                deliveredReceiptPlaceholder !== "e.g. RN-00XXX"
              ) {
                e.preventDefault();
                setDeliveredReceiptNo(deliveredReceiptPlaceholder);
              }
            }}
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
        {deliveredError && (
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
            {deliveredError}
          </Typography>
        )}
      </Box>
    </ModalContainer>
  );
}
