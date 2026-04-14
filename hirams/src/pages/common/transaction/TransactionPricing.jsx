import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useBlocker } from "react-router-dom";
import { Box, Grid, Typography, TextField, Tooltip } from "@mui/material";
import {
  ArrowBack,
  Inventory,
  Business,
  ReceiptLong,
  TrendingUp,
  Save,
  Lock,
  LockOpen,
  MonetizationOnOutlined,
  EventOutlined,
  ListAlt,
} from "@mui/icons-material";
import AlertDialog from "../../../components/common/AlertDialog";
import InfoDialog from "../../../components/common/InfoDialog";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";
import DataTable from "../../../components/common/DataTable";
import CostBreakdownModal from "./modal/transaction-pricing/CostBreakdownModal";
import PricingPercentageModal from "./modal/transaction-pricing/PricingPercentageModal";
import api from "../../../utils/api/api";
import { showSwal, withSpinner } from "../../../utils/helpers/swal";
import echo from "../../../utils/echo";
import uiMessages from "../../../utils/helpers/uiMessages";

const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const colorPnL = (v) => (v < 0 ? "#DC2626" : v > 0 ? "#16A34A" : "#94A3B8");
const arrow = (v) => (v < 0 ? "▼ " : v > 0 ? "▲ " : "");
const isItemDirty = (id, unitSellingPrices, savedPrices) => {
  const toNum = (map) =>
    map[id] !== undefined && map[id] !== "" && map[id] !== null
      ? Number(map[id])
      : 0;
  return toNum(unitSellingPrices) !== toNum(savedPrices);
};
const COLUMN_GROUPS = [
  { label: "", span: 2.5 },
  { label: "", span: 1 },
  {
    label: "Selling",
    span: 3,
    color: "#2563EB",
    bgColor: "rgba(59,130,246,0.08)",
    borderLeft: "rgba(59,130,246,0.25)",
    borderRight: "rgba(59,130,246,0.25)",
  },
  {
    label: "Budget",
    span: 2,
    color: "#0F766E",
    bgColor: "rgba(20,184,166,0.08)",
    borderRight: "rgba(20,184,166,0.25)",
  },
  {
    label: "Cost & Return",
    span: 2,
    color: "#B45309",
    bgColor: "rgba(245,158,11,0.08)",
    borderRight: "rgba(245,158,11,0.25)",
  },
  { label: "", span: 1.5 },
];
const UspCell = React.memo(function UspCell({
  item,
  isPricingSetting,
  lockedPricings,
  existingPricings,
  unitSellingPrices,
  savedPrices,
  serverSuggestive,
  getUSP,
  getTxABCBalance,
  handleUnitSellingPriceChange,
  handleToggleLock,
}) {
  const itemId = item.id;
  const isLocked = !!lockedPricings[itemId];
  const rawValue = unitSellingPrices[itemId];
  const unitSellingPrice = getUSP(item);
  const qty = Number(item.qty || 0);

  const dSuggestivePrice =
    serverSuggestive[itemId] ??
    item.purchaseOptions?.[0]?.dSuggestivePrice ??
    0;

  const txABCBalance = getTxABCBalance(item);
  const usesTxABC = txABCBalance !== null;
  const maxUPforField =
    usesTxABC && qty > 0 ? txABCBalance / qty : dSuggestivePrice;
  const fieldIsAboveMax =
    maxUPforField > 0 &&
    unitSellingPrice > maxUPforField &&
    rawValue !== undefined &&
    rawValue !== "";
  const itemIsDirty = isItemDirty(itemId, unitSellingPrices, savedPrices);

  const fieldPlaceholder =
    (maxUPforField > 0 ? maxUPforField : dSuggestivePrice) > 0
      ? Number(
          maxUPforField > 0 ? maxUPforField : dSuggestivePrice,
        ).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
const displayValue =
  rawValue !== undefined && rawValue !== ""
    ? (() => {
        const strVal = String(rawValue);
        const [int, dec] = strVal.split(".");
        const formatted = Number(int || 0).toLocaleString("en-PH");
        if (dec === undefined) return formatted; // still typing, no decimal yet
        return `${formatted}.${dec.padEnd(2, "0")}`;
      })()
    : "";

  const borderColor = isLocked
    ? "rgba(0,0,0,0.15)"
    : fieldIsAboveMax
      ? "#FCA5A5"
      : itemIsDirty
        ? "rgba(217,119,6,0.4)"
        : "#BFDBFE";
  const hoverBorder = isLocked
    ? "rgba(0,0,0,0.25)"
    : fieldIsAboveMax
      ? "#F87171"
      : itemIsDirty
        ? "#D97706"
        : "#93C5FD";
  const inputBg = isLocked
    ? "rgba(0,0,0,0.04)"
    : fieldIsAboveMax
      ? "#FFF5F5"
      : itemIsDirty
        ? "rgba(234,179,8,0.06)"
        : "#fff";
  const inputColor = isLocked
    ? "#94A3B8"
    : fieldIsAboveMax
      ? "#DC2626"
      : "#1E40AF";
  const adornColor = isLocked
    ? "#CBD5E1"
    : fieldIsAboveMax
      ? "#FCA5A5"
      : "#93C5FD";

  return (
    <Box
      sx={{
        py: 0.5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", width: "95%", gap: 0.5 }}
      >
        <TextField
          size="small"
          value={displayValue}
          placeholder={fieldPlaceholder}
          error={fieldIsAboveMax}
          disabled={isPricingSetting === false || isLocked}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            if (usesTxABC && raw !== "" && !isNaN(Number(raw))) {
              if (Number(raw) * qty > txABCBalance + 0.001) {
                handleUnitSellingPriceChange(itemId, maxUPforField.toFixed(2));
                return;
              }
            }
            handleUnitSellingPriceChange(itemId, raw);
          }}
  onBlur={(e) => {
  const raw = e.target.value.replace(/,/g, "");
  if (raw === "" || isNaN(Number(raw))) return;
  let val = parseFloat(raw);
  if (maxUPforField > 0 && val > maxUPforField) val = maxUPforField;
  handleUnitSellingPriceChange(itemId, val.toFixed(2));
}}
          sx={{
            flex: 1,
            "& .MuiInputBase-root": {
              fontSize: "0.6rem",
              height: "22px",
              borderRadius: "5px",
              backgroundColor: inputBg,
            },
            "& .MuiOutlinedInput-notchedOutline": { borderColor },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: hoverBorder,
            },
            "& .MuiInputBase-input": {
              padding: "2px 4px",
              textAlign: "right",
              fontWeight: 600,
              fontSize: "0.6rem",
              color: inputColor,
            },
          }}
          InputProps={{
            startAdornment: (
              <span
                style={{
                  fontSize: "0.55rem",
                  color: adornColor,
                  marginRight: "1px",
                }}
              >
                ₱
              </span>
            ),
          }}
        />

        {existingPricings[itemId] ? (
          <Tooltip
            title={isLocked ? "Unlock price" : "Lock price"}
            placement="top"
            arrow
          >
            <Box
              onClick={() => handleToggleLock(item)}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: "4px",
                color: isLocked ? "#DC2626" : "#94A3B8",
                backgroundColor: isLocked
                  ? "rgba(220,38,38,0.08)"
                  : "rgba(148,163,184,0.08)",
                border: `1px solid ${isLocked ? "rgba(220,38,38,0.25)" : "rgba(148,163,184,0.2)"}`,
                "&:hover": {
                  color: isLocked ? "#B91C1C" : "#475569",
                  backgroundColor: isLocked
                    ? "rgba(220,38,38,0.15)"
                    : "rgba(148,163,184,0.15)",
                },
                transition: "all 0.15s ease",
              }}
            >
              {isLocked ? (
                <Lock sx={{ fontSize: "0.95rem" }} />
              ) : (
                <LockOpen sx={{ fontSize: "0.95rem" }} />
              )}
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ width: 18, flexShrink: 0 }} />
        )}
      </Box>

      {fieldIsAboveMax && (
        <Typography
          sx={{
            fontSize: "0.45rem",
            color: "#DC2626",
            mt: 0.2,
            textAlign: "center",
            lineHeight: 1.2,
            width: "95%",
          }}
        >
          Max: ₱
          {Number(maxUPforField).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      )}
    </Box>
  );
});
const STAT_STYLES = {
  default: {
    border: "rgba(3,105,161,0.15)",
    label: "#0369a1",
    value: "#0c4a6e",
    sub: "#0369a1",
  },
  warn: {
    border: "rgba(251,191,36,0.4)",
    label: "#b45309",
    value: "#92400e",
    sub: "#b45309",
  },
  danger: {
    border: "rgba(239,68,68,0.4)",
    label: "#dc2626",
    value: "#991b1b",
    sub: "#dc2626",
  },
  info: {
    border: "rgba(20,184,166,0.3)",
    label: "#0f766e",
    value: "#0f766e",
    sub: "#0f766e",
  },
};

const StatCard = ({ icon, label, value, sub, variant = "default" }) => {
  const s = STAT_STYLES[variant] ?? STAT_STYLES.default;
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "rgba(255,255,255,0.55)",
        border: `0.5px solid ${s.border}`,
        borderRadius: "7px",
        px: 1.25,
        py: 0.75,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      {/* Left: icon + label */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}
      >
        {React.cloneElement(icon, {
          sx: { fontSize: 12, color: s.label, flexShrink: 0 },
        })}
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 500,
            color: s.label,
            letterSpacing: "0.03em",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Right: value + sub */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: s.value,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {value || "—"}
        </Typography>
        {sub && (
          <Typography
            sx={{
              fontSize: "0.6rem",
              color: s.sub,
              opacity: 0.85,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </Typography>
        )}
      </Box>

      {/* Watermark */}
      <Box
        sx={{
          position: "absolute",
          right: -6,
          bottom: -6,
          width: 40,
          height: 40,
          opacity: 0.06,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 60, color: s.label } })}
      </Box>
    </Box>
  );
};
function TransactionPricing() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const transaction = state?.transaction || null;
  const clientNickName = state?.clientNickName || transaction?.clientName;
  const selectedSet = state?.selectedSet || null;
  const { isPricingSetting, currentStatusLabel } = state || {};
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [percentageModalOpen, setPercentageModalOpen] = useState(false);
  const [unitSellingPrices, setUnitSellingPrices] = useState({});
  const [savedPrices, setSavedPrices] = useState({});
  const [existingPricings, setExistingPricings] = useState({});
  const [lockedPricings, setLockedPricings] = useState({});
  const [serverTax, setServerTax] = useState({});
  const [serverSuggestive, setServerSuggestive] = useState({});
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [statusChangedAlert, setStatusChangedAlert] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = React.useRef(null);
  const localActionRef = React.useRef(false);
  const statusChangedTooltip = statusChangedAlert
    ? "This transaction has been moved to a different status by another user. All actions are disabled."
    : "";
  const transactionHasABC =
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;

  const hasUnsavedChanges = useMemo(() => {
    const allKeys = new Set([
      ...Object.keys(unitSellingPrices),
      ...Object.keys(savedPrices),
    ]);
    for (const key of allKeys)
      if (isItemDirty(key, unitSellingPrices, savedPrices)) return true;
    return false;
  }, [unitSellingPrices, savedPrices]);

  const getEffectiveABC = useCallback(
    (item) => {
      const itemABC = Number(item.abc || 0);
      if (itemABC > 0) return itemABC;
      if (transactionHasABC) {
        const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
        return totalQty > 0
          ? (Number(item.qty || 0) / totalQty) *
              Number(transaction.dTotalABC || 0)
          : 0;
      }
      return 0;
    },
    [items, transactionHasABC, transaction?.dTotalABC],
  );

  const getIncludedTotal = useCallback(
    (item) =>
      item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce(
          (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
          0,
        ),
    [],
  );

  const getUSP = useCallback(
    (item) => {
      const raw = unitSellingPrices[item.id];
      const effABC = getEffectiveABC(item);
      const maxUP =
        effABC > 0 && Number(item.qty || 0) > 0 ? effABC / Number(item.qty) : 0;
      return raw !== undefined && raw !== "" ? Number(raw) : maxUP;
    },
    [unitSellingPrices, getEffectiveABC],
  );

  const getTxABCBalance = useCallback(
    (targetItem) => {
      if (!transactionHasABC) return null;
      if (Number(targetItem.abc || 0) > 0) return null;
      const committed = items.reduce((s, item) => {
        if (item.id === targetItem.id || Number(item.abc || 0) > 0) return s;
        const raw = unitSellingPrices[item.id];
        if (raw === undefined || raw === "" || isNaN(Number(raw))) return s;
        return s + Number(raw) * Number(item.qty || 0);
      }, 0);
      return Math.max(0, Number(transaction.dTotalABC || 0) - committed);
    },
    [items, transactionHasABC, unitSellingPrices, transaction?.dTotalABC],
  );

  const getProfitForItem = useCallback(
    (item) => {
      const qty = Number(item.qty || 0);
      const capital = qty > 0 ? getIncludedTotal(item) / qty : 0;
      return (getUSP(item) - capital) * qty - (serverTax[item.id] ?? 0);
    },
    [getUSP, getIncludedTotal, serverTax],
  );

  const {
    totalSellingAll,
    totalPurchaseAll,
    totalDiffAll,
    totalABCAll,
    totalProfitAll,
    totalTaxAll,
  } = useMemo(
    () => ({
      totalSellingAll: items.reduce(
        (s, i) => s + getUSP(i) * Number(i.qty || 0),
        0,
      ),
      totalPurchaseAll: items.reduce((s, i) => s + getIncludedTotal(i), 0),
      totalDiffAll: items.reduce(
        (s, i) => s + (getEffectiveABC(i) - getUSP(i) * Number(i.qty || 0)),
        0,
      ),
      totalABCAll: items.reduce((s, i) => s + getEffectiveABC(i), 0),
      totalProfitAll: items.reduce((s, i) => s + getProfitForItem(i), 0),
      totalTaxAll: items.reduce((s, i) => s + (serverTax[i.id] ?? 0), 0),
    }),
    [
      items,
      getUSP,
      getEffectiveABC,
      getIncludedTotal,
      getProfitForItem,
      serverTax,
    ],
  );

  const allItemsHavePrices = useMemo(
    () =>
      items.length > 0 &&
      items.every((item) => {
        const p = unitSellingPrices[item.id];
        return p && Number(p) > 0;
      }),
    [items, unitSellingPrices],
  );

  const isUrgentDate = (d) =>
    d && (new Date(d) - new Date()) / (1000 * 60 * 60 * 24) <= 4;

  const fetchTransactionItems = async () => {
    if (!transaction?.nTransactionId) return;
    try {
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );
      setItems(
        (res.items || []).map((item) => ({
          ...item,
          purchaseOptions: (item.purchaseOptions || [])
            .filter((o) => o.bIncluded === 1 || o.bIncluded === true)
            .map((o) => ({
              id: o.id,
              nPurchaseOptionId: o.nPurchaseOptionId,
              nSupplierId: o.nSupplierId,
              supplierName: o.supplierName || o.strSupplierName,
              supplierNickName: o.supplierNickName || o.strSupplierNickName,
              nQuantity: o.nQuantity,
              strUOM: o.strUOM,
              strBrand: o.strBrand,
              strModel: o.strModel,
              dUnitPrice: o.dUnitPrice,
              strSpecs: o.strSpecs,
              dEWT: o.dEWT,
              bIncluded: o.bIncluded,
              bAddOn: o.bAddOn,
              dSuggestivePrice: o.dSuggestivePrice,
            })),
          optionsLoaded: true,
          optionsLoading: false,
        })),
      );
    } catch (err) {
      console.error("fetchTransactionItems error:", err);
    }
  };

  const fetchItemPricings = async (
    pricingSetId,
    { showLoading = false } = {},
  ) => {
    if (showLoading) setItemsLoading(true);
    try {
      const res = await api.get(`item-pricings?pricing_set_id=${pricingSetId}`);
      const pricesMap = {},
        existingMap = {},
        taxMap = {},
        suggestiveMap = {},
        lockedMap = {};
      (res.itemPricings || []).forEach((p) => {
        if (p.dUnitSellingPrice !== null && p.dUnitSellingPrice !== 0)
          pricesMap[p.nTransactionItemId] = p.dUnitSellingPrice;
        if (p.nItemPriceId !== null)
          existingMap[p.nTransactionItemId] = p.nItemPriceId;
        taxMap[p.nTransactionItemId] = p.tax ?? 0;
        if (p.suggestivePrice !== null && p.suggestivePrice !== 0)
          suggestiveMap[p.nTransactionItemId] = p.suggestivePrice;
        lockedMap[p.nTransactionItemId] =
          p.bPricingLocked === 1 || p.bPricingLocked === true;
      });
      setUnitSellingPrices(pricesMap);
      setSavedPrices(pricesMap);
      setExistingPricings(existingMap);
      setServerTax(taxMap);
      setServerSuggestive(suggestiveMap);
      setLockedPricings(lockedMap);
    } catch (err) {
      console.error("fetchItemPricings error:", err);
    } finally {
      if (showLoading) setItemsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSet) return;
    setItemsLoading(true);
    Promise.all([
      fetchTransactionItems(),
      fetchItemPricings(selectedSet.id, { showLoading: false }),
    ]).finally(() => setItemsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSet?.id) return;
    const channel = echo.channel(`pricing-set.${selectedSet.id}.item-pricings`);
    channel.listen(".item-pricing.updated", () => {
      fetchItemPricings(selectedSet.id);
    });
    channel.listen(".pricing-set.updated", () => {
      fetchItemPricings(selectedSet.id);
    });

    const txnChannel = echo.channel("transactions");
    txnChannel.listen(".transaction.updated", (event) => {
      if (String(event.transactionId) !== String(transaction?.nTransactionId))
        return;
      if (localActionRef.current) return;

      const statusChangingActions = [
        "status_changed",
        "assigned",
        "reverted",
        "verified",
        "finalized",
      ];
      if (!statusChangingActions.includes(event.action)) return;

      setStatusChangedAlert(true);
    });

    return () => {
      echo.leaveChannel(`pricing-set.${selectedSet.id}.item-pricings`);
      echo.leaveChannel("transactions");
    };
  }, [selectedSet?.id]);
  // ADD THIS after the echo useEffect:
  useEffect(() => {
    if (!statusChangedAlert) return;

    setCountdown(5);
    let current = 5;
    countdownRef.current = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 0) {
        clearInterval(countdownRef.current);
        navigate(-2);
      }
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [statusChangedAlert]);
  const handleUnitSellingPriceChange = useCallback(
    (itemId, value) =>
      setUnitSellingPrices((prev) => ({
        ...prev,
        [itemId]: value.replace(/[^0-9.]/g, ""),
      })),
    [],
  );

  const handleToggleLock = useCallback(
    async (item) => {
      const existingId = existingPricings[item.id];
      if (!existingId) return;
      const newLocked = !lockedPricings[item.id];
      setLockedPricings((prev) => ({ ...prev, [item.id]: newLocked }));
      try {
        await api.put(`item-pricings/${existingId}`, {
          bPricingLocked: newLocked ? 1 : 0,
        });
      } catch (err) {
        setLockedPricings((prev) => ({ ...prev, [item.id]: !newLocked }));
        console.error("handleToggleLock error:", err);
      }
    },
    [existingPricings, lockedPricings],
  );

  const handleApplyPercentage = useCallback(
    (newPrices) =>
      setUnitSellingPrices((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(newPrices).filter(([id]) => !lockedPricings[id]),
        ),
      })),
    [lockedPricings],
  );

  const handleSaveChanges = async () => {
    if (!selectedSet || !hasUnsavedChanges) return;
    const entity = selectedSet.name || "Pricings";
    try {
      await withSpinner(entity, async () => {
        const allKeys = new Set([
          ...Object.keys(unitSellingPrices),
          ...Object.keys(savedPrices),
        ]);
        const updates = [];
        for (const itemIdStr of allKeys) {
          if (!isItemDirty(itemIdStr, unitSellingPrices, savedPrices)) continue;
          const raw = unitSellingPrices[itemIdStr];
          const curVal =
            raw !== undefined && raw !== "" && raw !== null ? Number(raw) : 0;
          updates.push({
            nTransactionItemId: Number(itemIdStr),
            nItemPriceId: existingPricings[itemIdStr] ?? null,
            dUnitSellingPrice: curVal,
          });
        }
        const res = await api.post("item-pricings/bulkStore", {
          nPricingSetId: selectedSet.id,
          items: updates,
        });
        if (res.itemPricings) {
          setExistingPricings((prev) => {
            const updated = { ...prev };
            res.itemPricings.forEach((p) => {
              if (p.nItemPriceId)
                updated[p.nTransactionItemId] = p.nItemPriceId;
              else delete updated[p.nTransactionItemId];
            });
            return updated;
          });
        }
        setSavedPrices({ ...unitSellingPrices });
      });
      showSwal(
        "SUCCESS",
        {},
        { entity: `Changes on ${entity}`, action: "save" },
      );
    } catch (err) {
      console.error("handleSaveChanges error:", err);
      showSwal("ERROR", {}, { entity, action: "save" });
    }
  };

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  const itemsWithPrices = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        currentSellingPrice: unitSellingPrices[item.id]
          ? Number(unitSellingPrices[item.id])
          : 0,
      })),
    [items, unitSellingPrices],
  );

  const pricingColumns = useMemo(
    () => [
      {
        key: "desc",
        label: "Description",
        xs: 2.5,
        rowSpan: true,
        headerAlign: "center",
        summaryColSpan: 2,
        cellSxExtra: { pl: 1.5 },
        render: (item) => {
          const dirty = isItemDirty(item.id, unitSellingPrices, savedPrices);
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                color: "#1E293B",
                whiteSpace: "nowrap",
              }}
            >
              {item.nItemNumber}. {item.name || "—"}
              {dirty && (
                <span
                  style={{
                    color: "#D97706",
                    marginLeft: 4,
                    fontSize: "0.5rem",
                  }}
                >
                  ●
                </span>
              )}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#1D4ED8",
              whiteSpace: "nowrap",
              width: "100%",
              textAlign: "center",
            }}
          >
            TOTAL
          </Typography>
        ),
      },
      {
        key: "qty",
        label: "Qty",
        xs: 1,
        rowSpan: true,
        align: "center",
        render: (item) => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              lineHeight: 1.3,
              color: "#475569",
              textAlign: "center",
              width: "100%",
            }}
          >
            {item.qty}
            <br />
            <span style={{ fontSize: "0.5rem", color: "#94A3B8" }}>
              {item.uom}
            </span>
          </Typography>
        ),
      },
      {
        key: "usp",
        label: "Unit Price",
        labelColor: "#2563EB",
        xs: 1.5,
        band: "sell",
        borderLeft: true,
        cellSxExtra: { py: 0, alignItems: "stretch" },
        render: (item) => (
          <UspCell
            item={item}
            isPricingSetting={isPricingSetting}
            lockedPricings={lockedPricings}
            existingPricings={existingPricings}
            unitSellingPrices={unitSellingPrices}
            savedPrices={savedPrices}
            serverSuggestive={serverSuggestive}
            getUSP={getUSP}
            getTxABCBalance={getTxABCBalance}
            handleUnitSellingPriceChange={handleUnitSellingPriceChange}
            handleToggleLock={handleToggleLock}
          />
        ),
      },
      {
        key: "total",
        label: "Total Price",
        labelColor: "#2563EB",
        xs: 1.5,
        band: "sell",
        borderRight: true,
        align: "right",
        render: (item) => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 600,
              color: "#1D4ED8",
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmt(getUSP(item) * Number(item.qty || 0))}
          </Typography>
        ),
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#1D4ED8",
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmt(totalSellingAll)}
          </Typography>
        ),
      },
      {
        key: "abc",
        label: "ABC",
        labelColor: "#0F766E",
        xs: 1,
        band: "budget",
        align: "right",
        render: (item) => {
          const displayABC =
            Number(item.abc || 0) > 0 ? Number(item.abc) : null;
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#0F766E",
                whiteSpace: "nowrap",
              }}
            >
              {displayABC !== null ? `₱ ${fmt(displayABC)}` : "—"}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#0F766E",
              whiteSpace: "nowrap",
            }}
          >
            {transactionHasABC
              ? `₱ ${fmt(transaction.dTotalABC)}`
              : totalABCAll > 0
                ? `₱ ${fmt(totalABCAll)}`
                : "—"}
          </Typography>
        ),
      },
      {
        key: "diff",
        label: "Difference",
        labelColor: "#0F766E",
        xs: 1,
        band: "budget",
        borderRight: true,
        align: "right",
        render: (item) => {
          const hasABC = Number(item.abc || 0) > 0;
          const difference =
            getEffectiveABC(item) - getUSP(item) * Number(item.qty || 0);
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: colorPnL(difference),
                whiteSpace: "nowrap",
              }}
            >
              {hasABC ? `₱ ${fmt(difference)}` : "—"}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: colorPnL(totalDiffAll),
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmt(totalDiffAll)}
          </Typography>
        ),
      },
      {
        key: "purch",
        label: "Purchase",
        labelColor: "#B45309",
        xs: 1,
        band: "cost",
        align: "right",
        render: (item) => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#92400E",
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmt(getIncludedTotal(item))}
          </Typography>
        ),
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#92400E",
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmt(totalPurchaseAll)}
          </Typography>
        ),
      },
      {
        key: "profit",
        label: "Profit",
        labelColor: "#B45309",
        xs: 1,
        band: "cost",
        borderRight: true,
        align: "right",
        render: (item) => {
          const profit = getProfitForItem(item);
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  ml: 1,
                  color: colorPnL(profit),
                  lineHeight: 1,
                }}
              >
                {profit < 0 ? "▼" : profit > 0 ? "▲" : ""}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: colorPnL(profit),
                  whiteSpace: "nowrap",
                }}
              >
                ₱ {fmt(Math.abs(profit))}
              </Typography>
            </Box>
          );
        },
        summaryRender: () => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 800,
                ml: 1,
                color: colorPnL(totalProfitAll),
                lineHeight: 1,
              }}
            >
              {totalProfitAll < 0 ? "▼" : totalProfitAll > 0 ? "▲" : ""}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 800,
                color: colorPnL(totalProfitAll),
                whiteSpace: "nowrap",
              }}
            >
              ₱ {fmt(Math.abs(totalProfitAll))}
            </Typography>
          </Box>
        ),
      },
      {
        key: "tax",
        label: "Tax",
        xs: 1.5,
        rowSpan: true,
        hideBorder: true,
        align: "right",
        cellSxExtra: { borderLeft: "1px solid #DDE3EE" },
        render: (item) => {
          const tax = serverTax[item.id] ?? 0;
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: tax < 0 ? "#DC2626" : "#16A34A",
                whiteSpace: "nowrap",
              }}
            >
              ₱ {fmt(tax)}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#16A34A",
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmt(totalTaxAll)}
          </Typography>
        ),
      },
    ],
    [
      unitSellingPrices,
      savedPrices,
      lockedPricings,
      existingPricings,
      serverSuggestive,
      serverTax,
      totalSellingAll,
      totalPurchaseAll,
      totalDiffAll,
      totalABCAll,
      totalProfitAll,
      totalTaxAll,
      transactionHasABC,
      transaction,
      getUSP,
      getEffectiveABC,
      getIncludedTotal,
      getProfitForItem,
      getTxABCBalance,
      isPricingSetting,
      handleUnitSellingPriceChange,
      handleToggleLock,
    ],
  );

  return (
    <PageLayout
      title="Transaction"
      subtitle={`/ ${currentStatusLabel || ""} / ${transaction?.strCode || transaction?.transactionId || ""}${selectedSet ? ` / ${selectedSet.name}` : ""}`}
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => navigate(-1)}
            actionColor="back"
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <BaseButton
              label="Set Markup"
              icon={<TrendingUp />}
              variant="outlined"
              actionColor="markup"
              onClick={() => setPercentageModalOpen(true)}
              disabled={itemsLoading || statusChangedAlert}
              tooltip={
                statusChangedAlert
                  ? statusChangedTooltip
                  : itemsLoading
                    ? "Loading items, please wait..."
                    : ""
              }
            />

            <BaseButton
              label="Cost Breakdown"
              icon={<ReceiptLong />}
              variant="contained"
              actionColor="breakdown"
              onClick={() => setCostModalOpen(true)}
              disabled={
                itemsLoading || statusChangedAlert || !allItemsHavePrices
              }
              tooltip={
                statusChangedAlert
                  ? statusChangedTooltip
                  : itemsLoading
                    ? "Loading items, please wait..."
                    : !allItemsHavePrices
                      ? "All items must have selling prices before viewing cost breakdown"
                      : ""
              }
            />

            <BaseButton
              label={saving ? "Saving..." : "Save Changes"}
              icon={<Save />}
              variant="contained"
              actionColor="approve"
              onClick={handleSaveChanges}
              disabled={
                itemsLoading ||
                statusChangedAlert ||
                !hasUnsavedChanges ||
                saving
              }
              tooltip={
                statusChangedAlert
                  ? statusChangedTooltip
                  : itemsLoading
                    ? "Loading items, please wait..."
                    : saving
                      ? "Saving your changes..."
                      : !hasUnsavedChanges
                        ? "No unsaved changes to save"
                        : ""
              }
            />
          </Box>
        </Box>
      }
    >
      {/* ── Info header ── */}
      <Box sx={{ mb: 2 }}>
        <InfoDialog p={1.5} mb={1}>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: "520px" }}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  mb: 1.25,
                }}
              >
                <Box
                  sx={{
                    background: "#0369a1",
                    borderRadius: "7px",
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Business sx={{ color: "white", fontSize: "1rem" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.2,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: "0.65rem",
                        background: "#bae6fd",
                        color: "#0c4a6e",
                        border: "0.5px solid #7dd3fc",
                        borderRadius: "5px",
                        px: 1,
                        py: 0.3,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      # {transaction?.strCode || "--"}
                      {" - "}
                      {selectedSet?.name || "--"}
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      textAlign: "left",
                      fontSize: "0.7rem",
                      fontStyle: "italic",
                      color: "#0369a1",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        fontStyle: "normal",
                        color: "#0c4a6e",
                      }}
                    >
                      {transaction?.client?.strClientNickName ||
                        transaction?.clientName ||
                        "—"}
                    </Box>
                    <Box
                      component="span"
                      sx={{ mx: 0.5, color: "#7dd3fc", fontStyle: "normal" }}
                    >
                      :
                    </Box>
                    {transaction?.strTitle ||
                      transaction?.transactionName ||
                      "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Stat cards */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0,1fr))",
                  },
                  gap: "8px",
                }}
              >
                <StatCard
                  icon={<MonetizationOnOutlined />}
                  label={
                    transaction?.dTotalABC
                      ? "Transaction ABC"
                      : "Total ABC (per item)"
                  }
                  value={
                    transaction?.dTotalABC && totalABCAll > 0 ? (
                      <>
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 300,
                            fontStyle: "italic",
                            opacity: 0.75,
                            mr: 0.5,
                          }}
                        >
                          (Items ₱{fmt(totalABCAll)})
                        </Box>
                        ₱ {fmt(transaction.dTotalABC)}
                      </>
                    ) : transaction?.dTotalABC ? (
                      `₱ ${fmt(transaction.dTotalABC)}`
                    ) : totalABCAll > 0 ? (
                      `₱ ${fmt(totalABCAll)}`
                    ) : (
                      "—"
                    )
                  }
                  variant="info"
                />
                <StatCard
                  icon={<EventOutlined />}
                  label="Document Submission"
                  value={
                    transaction?.dtDocSubmission
                      ? `${new Date(
                          transaction.dtDocSubmission,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })} - ${new Date(
                          transaction.dtDocSubmission,
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}`
                      : "—"
                  }
                  variant={
                    isUrgentDate(transaction?.dtDocSubmission)
                      ? "warn"
                      : "default"
                  }
                />
              </Box>
            </Box>
          </Box>
        </InfoDialog>
      </Box>
      {statusChangedAlert && (
        <Box
          sx={{
            mb: 1.5,
            px: 1.5,
            py: 0.75,
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.35)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Save sx={{ fontSize: "0.9rem", color: "#B45309" }} />
            <Typography
              sx={{ fontSize: "0.65rem", color: "#92400E", fontWeight: 600 }}
            >
              Status update detected — this transaction has been moved to a
              different status. All actions are disabled. Redirecting you back
              shortly.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2px solid #B45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#B45309",
                  lineHeight: 1,
                }}
              >
                {countdown ?? 5}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Unsaved changes banner ── */}
      {hasUnsavedChanges && !statusChangedAlert && (
        <Box
          sx={{
            mb: 1,
            px: 1.5,
            py: 0.75,
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.35)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Save sx={{ fontSize: "0.8rem", color: "#B45309" }} />
          <Typography
            sx={{ fontSize: "0.65rem", color: "#92400E", fontWeight: 600 }}
          >
            You have unsaved changes. Click "Save Changes" to persist your
            pricing.
          </Typography>
        </Box>
      )}
      {/* ── Section label ── */}
      <Box
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <ListAlt sx={{ fontSize: "1rem" }} />
          Transaction Items
        </Typography>
      </Box>

      <DataTable
        minWidth="1000px"
        loading={itemsLoading}
        rows={items}
        rowKey={(row) => row.id}
        rowSx={(item) =>
          isItemDirty(item.id, unitSellingPrices, savedPrices)
            ? { background: "rgba(234,179,8,0.03)" }
            : {}
        }
        columnGroups={COLUMN_GROUPS}
        columns={pricingColumns}
        summaryRow={{}}
      />

      <CostBreakdownModal
        open={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        transaction={transaction}
        selectedSet={selectedSet}
        items={items}
        unitSellingPrices={unitSellingPrices}
        clientName={clientNickName}
      />
      <PricingPercentageModal
        open={percentageModalOpen}
        onClose={() => setPercentageModalOpen(false)}
        items={itemsWithPrices}
        onApply={handleApplyPercentage}
        transaction={transaction}
        selectedSet={selectedSet}
        lockedPricings={lockedPricings}
      />
      <AlertDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset()}
        title="Unsaved Changes"
        message={uiMessages.common.unsavedChanges}
        type="warning"
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={() => blocker.proceed()}
      />
    </PageLayout>
  );
}

export default TransactionPricing;
