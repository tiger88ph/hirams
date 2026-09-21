import React, { useState, useEffect } from "react";
import { Box, Typography, Divider, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Inventory2Outlined,
  CheckCircleOutlined,
  ExpandMore,
  ExpandLess,
  UnfoldMore,
  UnfoldLess,
} from "@mui/icons-material";
import FormGrid from "../../../../../../../components/form/FormGrid.jsx";
import ModalContainer from "../../../../../../../layouts/modal/ModalContainer.jsx";
import InventoryAPI from "../../../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../../../api/endpoints/purchase-order.api.js";
import SerialNumberAPI from "../../../../../../../api/endpoints/serial-number.api.js";
import {
  showSwal,
  withSpinner,
} from "../../../../../../../utils/helpers/swal.jsx";
import { fmtDate } from "../../../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  cardBg: c.slate.outerBg,
  cardBorder: c.slate.border,
  rowHover: c.slate.itemHover,
  divider: c.slate.divider,
  inputBg: c.gray.inputBg,
  inputBorder: c.slate.btnBorder,
  inputFocusBorder: c.blue.text,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  blueText: c.blue.text,
  blueTextAlt: c.blue.textStrong,
  blueBg: c.blue.bg,
  blueBgSoft: c.blue.bgSoft,
  blueBorder: c.blue.border,
  greenText: c.green.text,
  deepBlueText: c.teal.text,
  errorText: c.red.text,
  errorBg: c.red.bg,
  btnBgDisabled: c.slate.btnBg,
  iconMuted: c.slate.mutedColor,
});

const IconBox = ({
  size = 34,
  bg,
  border,
  radius = "8px",
  mr = 1,
  children,
  c,
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg || c.btnBgDisabled,
      border: border || `0.5px solid ${c.inputBorder}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      mr,
    }}
  >
    {children}
  </Box>
);

const StatBox = ({ label, value, delta, deltaColor, color, c }) => (
  <Box sx={{ textAlign: "center", flexShrink: 0, px: 1 }}>
    <Typography
      sx={{
        fontSize: "0.5rem",
        color,
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.8rem",
        fontWeight: 800,
        color,
        display: "flex",
        alignItems: "baseline",
        gap: 0.25,
        justifyContent: "center",
      }}
    >
      {value}
      {delta != null && (
        <Box
          component="span"
          sx={{ fontSize: "0.55rem", fontWeight: 700, color: deltaColor }}
        >
          {delta}
        </Box>
      )}
    </Typography>
  </Box>
);

// ── One item's row (header + collapsible form) ─────────────────────────────
function ItemReceiveRow({
  idx,
  p,
  value,
  onChange,
  expanded,
  onToggleExpand,
  receiptNumber,
  c,
}) {
  const maxQty = Math.max(0, (p?.nQuantity || 0) - (p?.nInventoryQty || 0));
  const isSingle =
    !((p?.nInventoryQty || 0) >= (p?.nQuantity || 0)) && maxQty === 1;
  const itemLabel =
    [p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item";
  const isFullyReceived = maxQty <= 0;

  const setQty = (qty) => onChange({ ...value, qty });
  const setReceiptNo = (receiptNo) => onChange({ ...value, receiptNo });
  const setSerials = (serials) => onChange({ ...value, serials });
  const toggleSN = () => onChange({ ...value, showSN: !value.showSN });

  return (
    <Box>
      {idx > 0 && <Divider sx={{ borderColor: c.divider }} />}

      {/* Row header — always visible */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1,
          opacity: isFullyReceived ? 0.85 : 1,
        }}
      >
        <IconBox bg={c.blueBg} border={`0.5px solid ${c.blueBorder}`} c={c}>
          <Inventory2Outlined sx={{ fontSize: "0.95rem", color: c.blueText }} />
        </IconBox>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: c.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {itemLabel}
            </Typography>
            {receiptNumber && (
              <Box
                sx={{
                  px: 0.6,
                  py: 0.15,
                  borderRadius: "50px",
                  background: c.blueBg,
                  border: `0.5px solid ${c.blueBorder}`,
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.52rem",
                    fontWeight: 700,
                    color: c.blueTextAlt,
                    lineHeight: 1,
                  }}
                >
                  {receiptNumber}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: "0.6rem", color: c.textMuted, mt: 0.15 }}>
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        <StatBox
          label="Ordered"
          value={p?.nQuantity || 0}
          color={c.blueText}
          c={c}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: c.divider, my: 0.5 }}
        />
        <StatBox
          label="To Rcv"
          value={maxQty}
          delta={
            !isFullyReceived && Number(value.qty) > 0
              ? `(-${Number(value.qty)})`
              : null
          }
          deltaColor={c.errorText}
          color={c.greenText}
          c={c}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: c.divider, my: 0.5 }}
        />
        <StatBox
          label="Rcvd"
          value={p?.nInventoryQty ?? 0}
          delta={
            !isFullyReceived && Number(value.qty) > 0
              ? `(+${Number(value.qty)})`
              : null
          }
          deltaColor={c.greenText}
          color={c.deepBlueText}
          c={c}
        />

        {!isFullyReceived && (
          <Box
            component="button"
            onClick={onToggleExpand}
            sx={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `0.5px solid ${c.inputBorder}`,
              borderRadius: "6px",
              background: expanded ? c.blueBgSoft : "transparent",
              color: expanded ? c.blueText : c.iconMuted,
              cursor: "pointer",
              ml: 0.5,
            }}
            title={expanded ? "Hide receive form" : "Show receive form"}
          >
            {expanded ? (
              <ExpandLess sx={{ fontSize: "1rem" }} />
            ) : (
              <ExpandMore sx={{ fontSize: "1rem" }} />
            )}
          </Box>
        )}
      </Box>

      {/* Collapsible receive form */}
      {!isFullyReceived && (
        <Collapse in={expanded}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              pb: 1.5,
            }}
          >
            {/* Qty + SN toggle */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Quantity to Receive
              </Typography>
              {isSingle ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    component="button"
                    onClick={() => setQty(value.qty === "1" ? "" : "1")}
                    sx={{
                      flex: 1,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.75,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: value.qty === "1" ? "#fff" : c.blueText,
                      background: value.qty === "1" ? c.blueText : c.blueBgSoft,
                      border: `0.5px solid ${c.blueBorder}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircleOutlined sx={{ fontSize: "0.95rem" }} />
                    {value.qty === "1"
                      ? "Selected — 1 Received"
                      : `Mark 1 ${p?.strUOM ?? ""} Received`}
                  </Box>
                  <Box
                    component="button"
                    onClick={toggleSN}
                    disabled={!value.qty}
                    sx={{
                      height: 38,
                      px: 1.1,
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: value.showSN ? c.blueText : c.textMuted,
                      background: value.showSN ? c.blueBgSoft : c.cardBg,
                      border: `0.5px solid ${value.showSN ? c.blueBorder : c.inputBorder}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                    }}
                  >
                    {value.showSN ? "− SN" : "+ SN"}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ display: "flex", flex: 1 }}>
                    <Box
                      component="input"
                      type="number"
                      min={0}
                      max={maxQty}
                      value={value.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= maxQty) setQty(e.target.value);
                      }}
                      sx={{
                        flex: 1,
                        height: 38,
                        px: 1.1,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: c.textPrimary,
                        border: `0.5px solid ${c.inputBorder}`,
                        borderRight: "none",
                        borderRadius: "8px 0 0 8px",
                        outline: "none",
                        background: c.inputBg,
                      }}
                    />
                    <Box
                      sx={{
                        height: 38,
                        px: 1.25,
                        display: "flex",
                        alignItems: "center",
                        background: c.btnBgDisabled,
                        border: `0.5px solid ${c.inputBorder}`,
                        borderRadius: "0 8px 8px 0",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: c.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {p?.strUOM ?? "—"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    component="button"
                    onClick={toggleSN}
                    disabled={!value.qty || Number(value.qty) <= 0}
                    sx={{
                      height: 38,
                      px: 1.1,
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: value.showSN ? c.blueText : c.textMuted,
                      background: value.showSN ? c.blueBgSoft : c.cardBg,
                      border: `0.5px solid ${value.showSN ? c.blueBorder : c.inputBorder}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                    }}
                  >
                    {value.showSN ? "− SN" : "+ SN"}
                  </Box>
                </Box>
              )}
            </Box>

            {value.showSN && (
              <FormGrid
                fields={[
                  {
                    name: "serials",
                    label: "Serial Numbers",
                    type: "serialNumber",
                    xs: 12,
                    placeholder: "Scan or type S/N and press Enter...",
                    maxItems: Number(value.qty) || 0,
                  },
                ]}
                switches={[]}
                formData={{ serials: value.serials }}
                errors={{}}
                handleChange={(e) => {
                  if (e.target.name === "serials") setSerials(e.target.value);
                }}
                autoFocus={false}
              />
            )}

            {/* Receipt No */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Receipt No.
              </Typography>
              <Box
                component="input"
                type="text"
                value={value.receiptNo}
                placeholder="e.g. RR-2025-0001"
                onChange={(e) => setReceiptNo(e.target.value)}
                sx={{
                  height: 38,
                  px: 1.1,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                  border: `0.5px solid ${c.inputBorder}`,
                  borderRadius: "8px",
                  outline: "none",
                  background: c.inputBg,
                }}
              />
            </Box>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

// ── Reusable section wrapper (header + list) ────────────────────────────────
function ItemsSection({ title, count, collapsedControl, children, c }) {
  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `0.5px solid ${c.cardBorder}`,
        background: c.cardBg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderBottom: `0.5px solid ${c.divider}`,
        }}
      >
        <Typography
          sx={{ fontSize: "0.7rem", fontWeight: 700, color: c.textPrimary }}
        >
          {title} ({count})
        </Typography>
        {collapsedControl}
      </Box>
      <Box sx={{ px: 1.5 }}>{children}</Box>
    </Box>
  );
}

// ── Main modal ──────────────────────────────────────────────────────────────
export default function ReceiveItemsModal({
  open,
  onClose,
  options = [],
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

  const [formByItem, setFormByItem] = useState({});
  const [expandedByItem, setExpandedByItem] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [receiptByItem, setReceiptByItem] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const initialForm = {};
    const initialExpanded = {};
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
      }
    });
    setFormByItem(initialForm);
    setExpandedByItem(initialExpanded);
    setAllExpanded(false);
    setError("");

    // ── Receipt numbers live on inventory rows, not on purchase_option.
    // Fetch each item's history and grab the latest active "received" row's receipt no.
    (async () => {
      const results = {};
      await Promise.all(
        options.map(async (o) => {
          const id = o.purchase_option?.nPurchaseItemId;
          if (id == null) return;
          try {
            const res = await InventoryAPI.getHistory(id);
            const rows = res?.rows || res?.inventory || [];
            const received = rows
              .filter(
                (r) =>
                  Number(r.nQuantity) > 0 &&
                  String(r.cStatus || "").trim() !== "C",
              )
              .sort((a, b) => new Date(b.dtLog) - new Date(a.dtLog));
            results[id] = received[0]?.strReceiptNumber || null;
          } catch (e) {
            results[id] = null;
          }
        }),
      );
      setReceiptByItem(results);
    })();
  }, [open, options]);

  const setItemValue = (id, value) =>
    setFormByItem((prev) => ({ ...prev, [id]: value }));

  const toggleExpand = (id) =>
    setExpandedByItem((prev) => ({ ...prev, [id]: !prev[id] }));

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

  const itemsToSave = options.filter((o) => {
    const id = o.purchase_option?.nPurchaseItemId;
    const v = formByItem[id];
    return v && v.qty !== "" && Number(v.qty) > 0 && v.receiptNo.trim() !== "";
  });

  const isFormValid = itemsToSave.length > 0;

  const handleSave = async () => {
    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = formByItem[id];
      const newReceived = Number(v.qty);
      const currentDelivered = p?.nDeliveredQty || 0;
      if (newReceived < currentDelivered) {
        setError(
          `${[p?.strBrand, p?.strModel].filter(Boolean).join(" | ") || "Item"}: Received can't be less than Delivered (${currentDelivered}).`,
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
    onClose?.();

    for (const o of itemsToSave) {
      const p = o.purchase_option;
      const id = p?.nPurchaseItemId;
      const v = formByItem[id];
      const newReceived = Number(v.qty);

      patchOption?.(id, {
        nInventoryQty: (p?.nInventoryQty || 0) + newReceived,
        receivedSerialNumbers: [
          ...(p?.receivedSerialNumbers || []),
          ...v.serials,
        ],
      });

      try {
        await withSpinner("Inventory", async () => {
          const res = await InventoryAPI.createInventory({
            nPurchaseItemId: id,
            nQuantity: newReceived,
            strReceiptNumber: v.receiptNo.trim() || null,
            cStatus: "A",
          });
          const newInventoryId = res.inventory?.nInventoryId ?? null;
          if (newInventoryId && v.serials.length > 0) {
            for (const sn of v.serials) {
              await SerialNumberAPI.createSerialNumber({
                nInventoryId: newInventoryId,
                strSerialNumber: sn,
              });
            }
          }
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
        });
      } catch (apiErr) {
        console.error("Failed to save received for item", id, apiErr);
      }
    }

    window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    window.dispatchEvent(new CustomEvent("cart_data_updated"));
    await showSwal(
      "SUCCESS",
      {},
      { entity: `${itemsToSave.length} item(s) received`, action: "recorded" },
    );
  };

  const receivedItems = options.filter((o) => {
    const p = o.purchase_option;
    return (
      (p?.nQuantity || 0) > 0 && (p?.nInventoryQty || 0) >= (p?.nQuantity || 0)
    );
  });
  const pendingItems = options.filter((o) => {
    const p = o.purchase_option;
    return !(
      (p?.nQuantity || 0) > 0 && (p?.nInventoryQty || 0) >= (p?.nQuantity || 0)
    );
  });

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Receive Items"
      subTitle="All offered items"
      onSave={handleSave}
      saveLabel="Confirm Received"
      onCancel={onClose}
      disableBackdropClick
      contentPadding={{ xs: 2, sm: 3 }}
      disabled={!isFormValid}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {receivedItems.length > 0 && (
          <ItemsSection
            title="Received Items"
            count={receivedItems.length}
            c={c}
          >
            {receivedItems.map((o, idx) => {
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
                  value={value}
                  onChange={(v) => setItemValue(id, v)}
                  expanded={!!expandedByItem[id]}
                  onToggleExpand={() => toggleExpand(id)}
                  receiptNumber={receiptByItem[id]}
                  c={c}
                />
              );
            })}
          </ItemsSection>
        )}

        {pendingItems.length > 0 && (
          <ItemsSection
            title="Items"
            count={pendingItems.length}
            c={c}
            collapsedControl={
              <Box
                component="button"
                onClick={toggleExpandAll}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 1,
                  py: 0.4,
                  borderRadius: "6px",
                  border: `0.5px solid ${c.inputBorder}`,
                  background: "transparent",
                  color: c.textMuted,
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  "&:hover": { background: c.rowHover },
                }}
              >
                {allExpanded ? (
                  <UnfoldLess sx={{ fontSize: "0.85rem" }} />
                ) : (
                  <UnfoldMore sx={{ fontSize: "0.85rem" }} />
                )}
                {allExpanded ? "Collapse All" : "Expand All"}
              </Box>
            }
          >
            {pendingItems.map((o, idx) => {
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
                  value={value}
                  onChange={(v) => setItemValue(id, v)}
                  expanded={!!expandedByItem[id]}
                  onToggleExpand={() => toggleExpand(id)}
                  receiptNumber={receiptByItem[id]}
                  c={c}
                />
              );
            })}
          </ItemsSection>
        )}
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
            mt: 1.5,
          }}
        >
          {error}
        </Typography>
      )}
    </ModalContainer>
  );
}
