import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
} from "react";
import { Box, Typography, TextField, Tooltip, useTheme } from "@mui/material";
import {
  TrendingUp,
  ReceiptLong,
  Save,
  Lock,
  LockOpen,
  MonetizationOnOutlined,
  EventOutlined,
  ListAlt,
  Business,
} from "@mui/icons-material";
import ContentHeaderStructure from "../../../../../components/structure/ContentHeaderStructure.jsx";
import DataTable from "../../../../../components/form/DataTable.jsx";
import CostBreakdownModal from "../modal/CostBreakdownModal.jsx";
import PricingPercentageModal from "../modal/PricingPercentageModal.jsx";
import PricingAPI from "../../../../../api/endpoints/pricing.api.js";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import echo from "../../../../../lib/echo.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import { fmtPHP } from "../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import CardStructure from "../../../../../components/structure/CardStructure.jsx";
/* ──────────────────────────────────────────────────────────── */
/* 🔧 LOCAL COLOR MAP — Prompt 1 pattern, only used tokens       */
/* ──────────────────────────────────────────────────────────── */
const useColors = (c) => ({
  // slate — surfaces / borders / inputs
  slateBorder: c.slate.border,
  slateBorderLight: c.slate.borderLight,
  slateHover: c.slate.hover,
  slateItemHover: c.slate.itemHover,
  slateItemHeaderBg: c.slate.itemHeaderBg,
  slateExpandedBg: c.slate.expandedBg,
  slateOuterBg: c.slate.outerBg,
  slateInnerBg: c.slate.innerBg,
  slateTotalBg: c.slate.totalBg,
  slateTotalBorder: c.slate.totalBorder,
  slateStripeBg: c.slate.stripeBg,
  slateStripeAltBg: c.slate.stripeAltBg,
  slateMutedBg: c.slate.mutedBg,
  slateMutedBorder: c.slate.mutedBorder,
  slateMutedColor: c.slate.mutedColor,
  slateSummaryBg: c.slate.summaryBg,
  slateSummaryBorder: c.slate.summaryBorder,
  slateBtnBg: c.slate.btnBg,
  slateBtnBorder: c.slate.btnBorder,
  slateBtnText: c.slate.btnText,
  slateBtnHoverBg: c.slate.btnHoverBg,
  slateScrollbarThumb: c.slate.scrollbarThumb,
  // gray — text hierarchy
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textDisabled: c.gray.textDisabled,
  textHeading: c.gray.textHeading,
  grayLabel: c.gray.label,
  inputBg: c.gray.inputBg,
  inputFocusBg: c.gray.inputFocusBg,
  // blue — Selling column / info variant
  blueBg: c.blue.bg,
  blueBgSoft: c.blue.bgSoft,
  blueBorder: c.blue.border,
  blueBorderStrong: c.blue.borderStrong,
  blueText: c.blue.text,
  blueStrong: c.blue.textStrong,
  blueHover: c.blue.hover,
  blueActive: c.blue.active,
  // teal/cyan — Budget / info variant
  tealBg: c.teal.bg,
  tealText: c.teal.text,
  tealStrong: c.teal.textStrong,
  cyanBg: c.cyan.bg,
  cyanText: c.cyan.text,
  cyanStrong: c.cyan.textStrong,
  // amber — Cost & Return / warn variant
  amberBg: c.amber.bg,
  amberBgSoft: c.amber.bgSoft,
  amberBorder: c.amber.border,
  amberStrong: c.amber.textStrong,
  amberTextDark: c.amber.textDark,
  amberWarnBg: c.amber.warnBg,
  amberWarnBorder: c.amber.warnBorder,
  amberWarnText: c.amber.warnText,
  amberWarnHover: c.amber.warnHoverBg,
  amberValue: c.amber.value,
  // green — profit positive
  greenBg: c.green.bg,
  greenText: c.green.text,
  greenStrong: c.green.textStrong,
  greenTextDark: c.green.textDark,
  greenHoverBorder: c.green.hoverBorder,
  greenActiveBg: c.green.activeBg,
  greenPaid: c.green.paid,
  greenPaidBorder: c.green.paidBorder,
  // red — loss / danger
  redBg: c.red.bg,
  redBorder: c.red.border,
  redText: c.red.text,
  redStrong: c.red.textStrong,
  redTextDark: c.red.textDark,
  redHoverBorder: c.red.hoverBorder,
  redDanger: c.red.danger,
  // badge shortcuts
  badgeBlue: c.badge.blueBg,
  badgeOrange: c.badge.orangeBg,
  badgeAmber: c.badge.amberBg,
  badgeRed: c.badge.redBg,
  badgeGold: c.badge.goldBg,
});

/* ─── Helpers ────────────────────────────────────────────────── */
const colorPnL = (v, colors) => {
  if (v < 0) return colors.redTextDark;
  if (v > 0) return colors.greenTextDark;
  return colors.slateMutedColor;
};
const isItemDirty = (id, mapA, mapB) => {
  const toNum = (m) =>
    m[id] !== undefined && m[id] !== "" && m[id] !== null ? Number(m[id]) : 0;
  return toNum(mapA) !== toNum(mapB);
};
const isUrgentDate = (d) =>
  d && (new Date(d) - new Date()) / (1000 * 60 * 60 * 24) <= 4;

/* ─── Stat card styles — now tokenized ──────────────────────── */
const STAT_STYLES = (c) => ({
  default: {
    border: c.blueBorder,
    label: c.blueText,
    value: c.blueStrong,
    sub: c.blueText,
  },
  warn: {
    border: c.amberWarnBorder,
    label: c.amberWarnText,
    value: c.amberTextDark,
    sub: c.amberWarnText,
  },
  danger: {
    border: c.redTextDark,
    label: c.redTextDark,
    value: c.redTextDark,
    sub: c.redTextDark,
  },
  info: {
    border: c.tealBorder,
    label: c.tealText,
    value: c.tealStrong,
    sub: c.tealText,
  },
});

const StatCard = ({ icon, label, value, sub, variant = "default" }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  const s = STAT_STYLES(colors)[variant] ?? STAT_STYLES(colors).default;
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: colors.slateItemHeaderBg,
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
      <Box
        sx={{
          position: "absolute",
          right: -6,
          bottom: -6,
          width: 40,
          height: 40,
          opacity: isDark ? 0.12 : 0.06,
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

/* ─── USP Cell ───────────────────────────────────────────────── */
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
  handleChange,
  handleLock,
  isManagement,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
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
          const s = String(rawValue).split(".");
          return `${Number(s[0] || 0).toLocaleString("en-PH")}${s[1] ? `.${s[1].padEnd(2, "0")}` : ""}`;
        })()
      : "";

  // border chain
  const borderColor = isLocked
    ? colors.slateBorderLight
    : fieldIsAboveMax
      ? colors.redBorder
      : itemIsDirty
        ? colors.amberBorder
        : colors.blueBorder;
  const hoverBorder = isLocked
    ? colors.slateBtnBorder
    : fieldIsAboveMax
      ? colors.redStrong
      : itemIsDirty
        ? colors.amberStrong
        : colors.blueBorderStrong;
  const inputBg = isLocked
    ? colors.inputBg
    : fieldIsAboveMax
      ? colors.redBgSoft
      : itemIsDirty
        ? colors.amberBgSoft
        : colors.slateOuterBg;
  const inputColor = isLocked
    ? colors.textSecondary
    : fieldIsAboveMax
      ? colors.redTextDark
      : colors.blueText;
  const adornColor = isLocked
    ? colors.textDisabled
    : fieldIsAboveMax
      ? colors.redText
      : colors.blueText;

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
          // ✅ FIXED: was always disabled; now matches lock + permission logic
          disabled={isLocked || (!isManagement && !isPricingSetting)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            if (usesTxABC && raw !== "" && !isNaN(Number(raw))) {
              if (Number(raw) * qty > txABCBalance + 0.001) {
                handleChange(itemId, maxUPforField.toFixed(2));
                return;
              }
            }
            handleChange(itemId, raw);
          }}
          onBlur={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (raw === "" || isNaN(Number(raw))) return;
            let val = parseFloat(raw);
            if (maxUPforField > 0 && val > maxUPforField) val = maxUPforField;
            handleChange(itemId, val.toFixed(2));
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
          (() => {
            const isDisabled = !isManagement && !isPricingSetting;
            return (
              <Tooltip
                title={isLocked ? "Unlock price" : "Lock price"}
                placement="top"
                arrow
              >
                <Box
                  onClick={() => !isDisabled && handleLock(item)}
                  sx={{
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "4px",
                    color: isDisabled
                      ? colors.textDisabled
                      : isLocked
                        ? colors.redStrong
                        : colors.textMuted,
                    backgroundColor: isDisabled
                      ? colors.slateMutedBg
                      : isLocked
                        ? colors.redBg
                        : colors.slateStripeBg,
                    border: `1px solid ${
                      isDisabled
                        ? colors.slateBorderLight
                        : isLocked
                          ? colors.redBorder
                          : colors.slateBorder
                    }`,
                    opacity: isDisabled ? 0.5 : 1,
                    "&:hover": isDisabled
                      ? {}
                      : {
                          color: isLocked
                            ? colors.redTextDark
                            : colors.slateBtnText,
                          backgroundColor: isLocked
                            ? colors.redBgSoft
                            : colors.slateHover,
                        },
                    transition: "all 0.15s ease",
                    pointerEvents: isDisabled ? "none" : "auto",
                  }}
                >
                  {isLocked ? (
                    <Lock sx={{ fontSize: "0.95rem" }} />
                  ) : (
                    <LockOpen sx={{ fontSize: "0.95rem" }} />
                  )}
                </Box>
              </Tooltip>
            );
          })()
        ) : (
          <Box sx={{ width: 18, flexShrink: 0 }} />
        )}
      </Box>
      {fieldIsAboveMax && (
        <Typography
          sx={{
            fontSize: "0.45rem",
            color: colors.redTextDark,
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

const PricingPanel = React.forwardRef(function PricingPanel(
  {
    transaction,
    selectedStatusCode,
    isManagement,
    isProcurementTL,
    transacstatus,
    forPricingKey = "",
    priceVerificationKey = "",
    priceApprovalKey = "",
    priceSettingKey = "",
    priceFinalizeVerificationKey = "",
    isPricingSetting,
    currentStatusLabel,
    currentUserId,
    itemType,
    procMode,
    procSource,
    statusTransaction,
    clientNickName,
    onStatusChanged,
    statusChangedAlert,
    onStateChange,
    initialSet, // ⬅ NEW — the specific pricing set the user clicked into, e.g. from router state
  },
  ref,
) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  /* ── State ── */
  const [setsLoading, setSetsLoading] = useState(true);
  const [pricingSets, setPricingSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [noSetError, setNoSetError] = useState(false);
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
  const localActionRef = React.useRef(false);
  const taxDebounceRef = React.useRef(null);
  const statusChangedTooltip = statusChangedAlert
    ? "This transaction has been moved to a different status by another user. All actions are disabled."
    : "";
  const transactionHasABC = !!(
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0
  );
  const hasUnsavedChanges = useMemo(() => {
    const k = new Set([
      ...Object.keys(unitSellingPrices),
      ...Object.keys(savedPrices),
    ]);
    for (const id of k)
      if (isItemDirty(id, unitSellingPrices, savedPrices)) return true;
    return false;
  }, [unitSellingPrices, savedPrices]);

  /* ── Column groups — tokenized ── */
  const COLUMN_GROUPS = [
    { label: "", span: 2.5 },
    { label: "", span: 1 },
    {
      label: "Selling",
      span: 3,
      color: colors.blueText,
      bgColor: colors.blueBgSoft,
      borderLeft: colors.blueBorder,
      borderRight: colors.blueBorder,
    },
    {
      label: "Budget",
      span: 2,
      color: colors.tealText,
      bgColor: colors.tealBg,
      borderRight: colors.tealBorder,
    },
    {
      label: "Cost & Return",
      span: 2,
      color: colors.amberWarnText,
      bgColor: colors.amberWarnBg,
      borderRight: colors.amberWarnBorder,
    },
    { label: "", span: 1.5 },
  ];
  const infoBadgeBg = colors.cyanBg;
  const infoBadgeBorder = colors.cyanBorder;
  const infoBadgeText = colors.cyanStrong;
  const primaryMain = colors.blueStrong;

  const fetchChosenSet = useCallback(async () => {
    if (!transaction?.nTransactionId) return;
    setSetsLoading(true);
    setNoSetError(false);
    try {
      const res = await PricingAPI.getPricingSets(transaction.nTransactionId);
      const sets = res.data ?? [];
      setPricingSets(sets);
      // ⬅ NEW — honor the set the user explicitly clicked into, instead of
      // always falling back to whichever one the server marks as "chosen".
      if (initialSet?.id) {
        const match = sets.find((s) => s.nPricingSetId === initialSet.id);
        setSelectedSet({
          id: initialSet.id,
          name: match?.strName ?? initialSet.name,
          raw: match ?? initialSet.raw,
        });
        return;
      }
      const chosen = sets.find((s) => s.bChosen === 1 || s.bChosen === true);
      if (chosen)
        setSelectedSet({
          id: chosen.nPricingSetId,
          name: chosen.strName,
          raw: chosen,
        });
      else {
        setSelectedSet(null);
        setNoSetError(true);
      }
    } catch {
      setNoSetError(true);
    } finally {
      setSetsLoading(false);
    }
  }, [transaction?.nTransactionId, initialSet?.id]);
  useEffect(() => {
    fetchChosenSet();
  }, [fetchChosenSet]);

  /* ── Load items & pricings ── */
  const fetchTransactionItems = useCallback(async () => {
    if (!transaction?.nTransactionId) return;
    try {
      const res = await TransactionAPI.getItems(transaction.nTransactionId);
      setItems(
        (res.items || []).map((item) => ({
          ...item,
          purchaseOptions: (item.purchaseOptions || []).map((o) => ({
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
    } catch {}
  }, [transaction?.nTransactionId]);
  const fetchItemPricings = useCallback(
    async (pricingSetId, { showLoading = false } = {}) => {
      if (showLoading) setItemsLoading(true);
      try {
        const res = await PricingAPI.getItemPricings(pricingSetId);
        const pmap = {},
          xmap = {},
          tmap = {},
          smap = {},
          lmap = {};
        (res.itemPricings || []).forEach((p) => {
          if (p.dUnitSellingPrice !== null && p.dUnitSellingPrice !== 0)
            pmap[p.nTransactionItemId] = p.dUnitSellingPrice;
          if (p.nItemPriceId !== null)
            xmap[p.nTransactionItemId] = p.nItemPriceId;
          tmap[p.nTransactionItemId] = p.tax ?? 0;
          if (p.suggestivePrice !== null && p.suggestivePrice !== 0)
            smap[p.nTransactionItemId] = p.suggestivePrice;
          lmap[p.nTransactionItemId] =
            p.bPricingLocked === 1 || p.bPricingLocked === true;
        });
        setUnitSellingPrices(pmap);
        setSavedPrices(pmap);
        setExistingPricings(xmap);
        setServerTax(tmap);
        setServerSuggestive(smap);
        setLockedPricings(lmap);
      } catch {
      } finally {
        if (showLoading) setItemsLoading(false);
      }
    },
    [],
  );
  useEffect(() => {
    if (!selectedSet?.id) return;
    setItemsLoading(true);
    Promise.all([
      fetchTransactionItems(),
      fetchItemPricings(selectedSet.id, { showLoading: false }),
    ]).finally(() => setItemsLoading(false));
  }, [selectedSet?.id, fetchTransactionItems, fetchItemPricings]);

  /* ── Realtime broadcast ── */
  useEffect(() => {
    if (!selectedSet?.id) return;
    const ch1 = echo.channel(`pricing-set.${selectedSet.id}.item-pricings`);
    ch1.listen(".item-pricing.updated", () =>
      fetchItemPricings(selectedSet.id),
    );
    ch1.listen(".pricing-set.updated", () => fetchItemPricings(selectedSet.id));
    const ch2 = echo.channel(
      `transaction.${transaction?.nTransactionId}.pricing-sets`,
    );
    ch2.listen(".pricing-set.updated", () => {
      if (localActionRef.current) return;
      fetchChosenSet();
    });
    return () => {
      echo.leaveChannel(`pricing-set.${selectedSet.id}.item-pricings`);
      echo.leaveChannel(
        `transaction.${transaction?.nTransactionId}.pricing-sets`,
      );
    };
  }, [
    selectedSet?.id,
    transaction?.nTransactionId,
    fetchItemPricings,
    fetchChosenSet,
  ]);

  /* ── Debounced tax refresh ── */
  useEffect(() => {
    if (!selectedSet?.id || !Object.keys(unitSellingPrices).length) return;
    const chgd = Object.entries(unitSellingPrices).filter(
      ([id, v]) =>
        v !== undefined &&
        v !== "" &&
        Number(v) > 0 &&
        isItemDirty(id, unitSellingPrices, savedPrices),
    );
    if (!chgd.length) return;
    clearTimeout(taxDebounceRef.current);
    taxDebounceRef.current = setTimeout(async () => {
      try {
        const res = await Promise.all(
          chgd.map(([id, val]) =>
            PricingAPI.getItemPricingTax(
              `transaction_item_id=${id}&pricing_set_id=${selectedSet.id}&unit_selling_price=${Number(val)}`,
            )
              .then((r) => ({ id, tax: r.tax ?? 0 }))
              .catch(() => ({ id, tax: serverTax[id] ?? 0 })),
          ),
        );
        setServerTax((p) => {
          const u = { ...p };
          res.forEach(({ id, tax }) => (u[id] = tax));
          return u;
        });
      } catch {}
    }, 600);
    return () => clearTimeout(taxDebounceRef.current);
  }, [unitSellingPrices, savedPrices, selectedSet?.id]);
  useEffect(() => () => clearTimeout(taxDebounceRef.current), []);

  /* ── Derived totals ── */
  const getEffectiveABC = useCallback(
    (item) => {
      const abc = Number(item.abc || 0);
      if (abc > 0) return abc;
      if (transactionHasABC) {
        const qtyAll = items.reduce((s, i) => s + Number(i.qty || 0), 0);
        return qtyAll
          ? (Number(item.qty || 0) / qtyAll) *
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
      const abc = getEffectiveABC(item);
      const max =
        abc > 0 && Number(item.qty || 0) > 0 ? abc / Number(item.qty || 0) : 0;
      return raw !== undefined && raw !== "" ? Number(raw) : max;
    },
    [unitSellingPrices, getEffectiveABC],
  );
  const getTxABCBalance = useCallback(
    (target) => {
      if (!transactionHasABC) return null;
      if (Number(target.abc || 0) > 0) return null;
      const committed = items.reduce((sum, item) => {
        if (item.id === target.id || Number(item.abc || 0) > 0) return sum;
        const v = unitSellingPrices[item.id];
        return v !== undefined && v !== "" && !isNaN(Number(v))
          ? sum + Number(v) * Number(item.qty || 0)
          : sum;
      }, 0);
      return Math.max(0, Number(transaction.dTotalABC || 0) - committed);
    },
    [items, transactionHasABC, unitSellingPrices, transaction?.dTotalABC],
  );
  const getProfitForItem = useCallback(
    (item) => {
      const qty = Number(item.qty || 0);
      const capital = qty ? getIncludedTotal(item) / qty : 0;
      return (getUSP(item) - capital) * qty - (serverTax[item.id] ?? 0);
    },
    [getUSP, getIncludedTotal, serverTax],
  );
  const totals = useMemo(
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
      items.every((i) => {
        const p = unitSellingPrices[i.id];
        return p && Number(p) > 0;
      }),
    [items, unitSellingPrices],
  );

  /* ── Handlers ── */
  const handleUnitSellingPriceChange = useCallback(
    (id, v) =>
      setUnitSellingPrices((p) => ({ ...p, [id]: v.replace(/[^0-9.]/g, "") })),
    [],
  );
  const handleToggleLock = useCallback(
    async (item) => {
      const eid = existingPricings[item.id];
      if (!eid) return;
      const next = !lockedPricings[item.id];
      setLockedPricings((p) => ({ ...p, [item.id]: next }));
      try {
        await PricingAPI.updateItemPricing(eid, {
          bPricingLocked: next ? 1 : 0,
        });
      } catch {
        setLockedPricings((p) => ({ ...p, [item.id]: !next }));
      }
    },
    [existingPricings, lockedPricings],
  );
  const handleApplyPercentage = useCallback(
    (newPrices) =>
      setUnitSellingPrices((p) => ({
        ...p,
        ...Object.fromEntries(
          Object.entries(newPrices).filter(([id]) => !lockedPricings[id]),
        ),
      })),
    [lockedPricings],
  );
  const handleSaveChanges = useCallback(async () => {
    if (!selectedSet || !hasUnsavedChanges) return;
    const label = selectedSet.name || "Pricings";
    setSaving(true);
    try {
      await withSpinner(label, async () => {
        const ids = new Set([
          ...Object.keys(unitSellingPrices),
          ...Object.keys(savedPrices),
        ]);
        const updates = [];
        for (const id of ids) {
          if (!isItemDirty(id, unitSellingPrices, savedPrices)) continue;
          const v =
            unitSellingPrices[id] !== undefined &&
            unitSellingPrices[id] !== "" &&
            unitSellingPrices[id] !== null
              ? Number(unitSellingPrices[id])
              : 0;
          updates.push({
            nTransactionItemId: Number(id),
            nItemPriceId: existingPricings[id] ?? null,
            dUnitSellingPrice: v,
          });
        }
        const res = await PricingAPI.bulkStoreItemPricings({
          nPricingSetId: selectedSet.id,
          items: updates,
        });
        if (res.itemPricings) {
          setExistingPricings((p) => {
            const u = { ...p };
            res.itemPricings.forEach((x) => {
              if (x.nItemPriceId) u[x.nTransactionItemId] = x.nItemPriceId;
              else delete u[x.nTransactionItemId];
            });
            return u;
          });
        }
        setSavedPrices({ ...unitSellingPrices });
      });
      showSwal(
        "SUCCESS",
        {},
        { entity: `Changes on ${label}`, action: "save" },
      );
    } catch {
      showSwal("ERROR", {}, { entity: label, action: "save" });
    } finally {
      setSaving(false);
    }
  }, [
    selectedSet,
    hasUnsavedChanges,
    unitSellingPrices,
    savedPrices,
    existingPricings,
  ]);
  const itemsWithPrices = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        currentSellingPrice: unitSellingPrices[i.id]
          ? Number(unitSellingPrices[i.id])
          : 0,
      })),
    [items, unitSellingPrices],
  );

  /* ── Expose imperative controls + report state upward — additive, opt-in only ── */
  useImperativeHandle(
    ref,
    () => ({
      save: handleSaveChanges,
      openCostBreakdown: () => setCostModalOpen(true),
      openMarkupModal: () => setPercentageModalOpen(true),
    }),
    [handleSaveChanges],
  );
  useEffect(() => {
    onStateChange?.({
      saving,
      hasUnsavedChanges,
      allItemsHavePrices,
      itemsLoading: itemsLoading || setsLoading, // ← combine
      selectedSet,
    });
  }, [
    saving,
    hasUnsavedChanges,
    allItemsHavePrices,
    itemsLoading,
    setsLoading,
    selectedSet,
    onStateChange,
  ]);

  /* ── Table columns ── */
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
                color: colors.textPrimary,
                whiteSpace: "nowrap",
              }}
            >
              {item.nItemNumber}. {item.name || "—"}
              {dirty && (
                <span
                  style={{
                    color: colors.amberStrong,
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
              color: colors.blueText,
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
              color: colors.textPrimary,
              textAlign: "center",
              width: "100%",
            }}
          >
            {item.qty}
            <br />
            <span style={{ fontSize: "0.5rem", color: colors.textSecondary }}>
              {item.uom}
            </span>
          </Typography>
        ),
      },
      {
        key: "usp",
        label: "Unit Price",
        labelColor: colors.blueText,
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
            handleChange={handleUnitSellingPriceChange}
            handleLock={handleToggleLock}
            isManagement={isManagement}
          />
        ),
      },
      {
        key: "total",
        label: "Total Price",
        labelColor: colors.blueText,
        xs: 1.5,
        band: "sell",
        borderRight: true,
        align: "right",
        render: (item) => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 600,
              color: colors.blueText,
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmtPHP(getUSP(item) * Number(item.qty || 0))}
          </Typography>
        ),
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: colors.blueText,
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmtPHP(totals.totalSellingAll)}
          </Typography>
        ),
      },
      {
        key: "abc",
        label: "ABC",
        labelColor: colors.tealText,
        xs: 1,
        band: "budget",
        align: "right",
        render: (item) => {
          const display = Number(item.abc || 0) > 0 ? Number(item.abc) : null;
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: colors.tealText,
                whiteSpace: "nowrap",
              }}
            >
              {display !== null ? `₱ ${fmtPHP(display)}` : "—"}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: colors.tealText,
              whiteSpace: "nowrap",
            }}
          >
            {transactionHasABC
              ? `₱ ${fmtPHP(transaction.dTotalABC)}`
              : totals.totalABCAll > 0
                ? `₱ ${fmtPHP(totals.totalABCAll)}`
                : "—"}
          </Typography>
        ),
      },
      {
        key: "diff",
        label: "Difference",
        labelColor: colors.tealText,
        xs: 1,
        band: "budget",
        borderRight: true,
        align: "right",
        render: (item) => {
          const has = Number(item.abc || 0) > 0;
          const diff =
            getEffectiveABC(item) - getUSP(item) * Number(item.qty || 0);
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: colorPnL(diff, colors),
                whiteSpace: "nowrap",
              }}
            >
              {has ? `₱ ${fmtPHP(diff)}` : "—"}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: colorPnL(totals.totalDiffAll, colors),
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmtPHP(totals.totalDiffAll)}
          </Typography>
        ),
      },
      {
        key: "purch",
        label: "Purchase",
        labelColor: colors.amberWarnText,
        xs: 1,
        band: "cost",
        align: "right",
        render: (item) => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: colors.amberTextDark,
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmtPHP(getIncludedTotal(item))}
          </Typography>
        ),
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: colors.amberTextDark,
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmtPHP(totals.totalPurchaseAll)}
          </Typography>
        ),
      },
      {
        key: "profit",
        label: "Profit",
        labelColor: colors.amberWarnText,
        xs: 1,
        band: "cost",
        borderRight: true,
        align: "right",
        render: (item) => {
          const p = getProfitForItem(item);
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
                  color: colorPnL(p, colors),
                  lineHeight: 1,
                }}
              >
                {p < 0 ? "▼" : p > 0 ? "▲" : ""}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: colorPnL(p, colors),
                  whiteSpace: "nowrap",
                }}
              >
                ₱ {fmtPHP(Math.abs(p))}
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
                color: colorPnL(totals.totalProfitAll, colors),
                lineHeight: 1,
              }}
            >
              {totals.totalProfitAll < 0
                ? "▼"
                : totals.totalProfitAll > 0
                  ? "▲"
                  : ""}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 800,
                color: colorPnL(totals.totalProfitAll, colors),
                whiteSpace: "nowrap",
              }}
            >
              ₱ {fmtPHP(Math.abs(totals.totalProfitAll))}
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
        cellSxExtra: { borderLeft: `1px solid ${colors.slateBorderLight}` },
        render: (item) => {
          const t = serverTax[item.id] ?? 0;
          return (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: t < 0 ? colors.redTextDark : colors.greenTextDark,
                whiteSpace: "nowrap",
              }}
            >
              ₱ {fmtPHP(t)}
            </Typography>
          );
        },
        summaryRender: () => (
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: colors.greenTextDark,
              whiteSpace: "nowrap",
            }}
          >
            ₱ {fmtPHP(totals.totalTaxAll)}
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
      totals,
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
      isManagement,
      colors,
      isDark,
    ],
  );

  return (
    <>
      {hasUnsavedChanges && !statusChangedAlert && (
        <Box
          sx={{
            mb: 1,
            px: 1.5,
            py: 0.75,
            background: colors.amberWarnBg,
            border: `1px solid ${colors.amberWarnBorder}`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Save sx={{ fontSize: "0.8rem", color: colors.amberWarnText }} />
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: colors.amberTextDark,
              fontWeight: 600,
            }}
          >
            You have unsaved changes. Click "Save Changes" to persist your
            pricing.
          </Typography>
        </Box>
      )}
      <Box sx={{ mb: 2 }}>
        <ContentHeaderStructure p={1.5} mb={1}>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: "520px" }}>
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
                    background: primaryMain,
                    borderRadius: "7px",
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Business
                    sx={{
                      color: colors.slateOuterBg,
                      fontSize: "1rem",
                    }}
                  />
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
                        background: infoBadgeBg,
                        color: infoBadgeText,
                        border: `0.5px solid ${infoBadgeBorder}`,
                        borderRadius: "5px",
                        px: 1,
                        py: 0.3,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      # {transaction?.strCode || "—"} —{" "}
                      {selectedSet?.name || "—"}
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      textAlign: "left",
                      fontSize: "0.7rem",
                      mt: 0.5,
                      color: colors.textPrimary,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, color: colors.blueStrong }}
                    >
                      {transaction?.client?.strClientNickName ||
                        clientNickName ||
                        "—"}
                    </Box>
                    <Box
                      component="span"
                      sx={{ mx: 0.5, color: colors.tealText }}
                    >
                      :
                    </Box>{" "}
                    {transaction?.strTitle ||
                      transaction?.transactionName ||
                      "—"}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2,minmax(0,1fr))",
                  },
                  gap: "8px",
                }}
              >
                <CardStructure
                  orientation="row"
                  icon={<MonetizationOnOutlined />}
                  label={
                    transaction?.dTotalABC
                      ? "Transaction ABC"
                      : "Total ABC (per item)"
                  }
                  variant="info"
                  value={
                    transaction?.dTotalABC && totals.totalABCAll > 0 ? (
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
                          (Items ₱{fmtPHP(totals.totalABCAll)})
                        </Box>{" "}
                        ₱ {fmtPHP(transaction.dTotalABC)}
                      </>
                    ) : transaction?.dTotalABC ? (
                      `₱ ${fmtPHP(transaction.dTotalABC)}`
                    ) : totals.totalABCAll > 0 ? (
                      `₱ ${fmtPHP(totals.totalABCAll)}`
                    ) : (
                      "—"
                    )
                  }
                />
                <CardStructure
                  orientation="row"
                  icon={<EventOutlined />}
                  label="Document Submission"
                  variant={
                    isUrgentDate(transaction?.dtDocSubmission)
                      ? "warn"
                      : "default"
                  }
                  value={
                    transaction?.dtDocSubmission
                      ? `${new Date(transaction.dtDocSubmission).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} — ${new Date(transaction.dtDocSubmission).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                      : "—"
                  }
                />
              </Box>
            </Box>
          </Box>
        </ContentHeaderStructure>
      </Box>
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
            color: primaryMain,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <ListAlt sx={{ fontSize: "1rem" }} /> Transaction Items
        </Typography>
      </Box>
      <DataTable
        minWidth="1000px"
        loading={itemsLoading || setsLoading}
        rows={items}
        rowKey={(r) => r.id}
        rowSx={(i) =>
          isItemDirty(i.id, unitSellingPrices, savedPrices)
            ? { background: colors.amberWarnBg }
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
    </>
  );
});
export default PricingPanel;
