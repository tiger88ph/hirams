import React, { useState, useEffect, useCallback } from "react";
import ModalContainer from "../../../../../layouts/modal/ModalContainer";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
  useTheme,
} from "@mui/material";
import { Percent, TrendingUp, TrendingDown } from "@mui/icons-material";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal";
import uiMessages from "../../../../../utils/helpers/uiMessages";

function PricingPercentageModal({
  open,
  onClose,
  items,
  onApply,
  transaction,
  selectedSet,
  lockedPricings = {},
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ─── CENTRALIZED THEME COLORS ──────────────────────────────────────────
  const colors = {
    markup: {
      accent: isDark ? "#93c5fd" : "#2563eb",
      accentLight: isDark ? "rgba(96,165,250,0.08)" : "#e3f2fd",
      accentBorder: isDark ? "rgba(96,165,250,0.35)" : "#90caf9",
      radio: isDark ? "#60a5fa" : "#1976d2",
    },
    markdown: {
      accent: isDark ? "#fcd34d" : "#b45309",
      accentLight: isDark ? "rgba(251,191,36,0.08)" : "#fef3c7",
      accentBorder: isDark ? "rgba(251,191,36,0.35)" : "#fcd34d",
      radio: isDark ? "#fcd34d" : "#b45309",
    },
    base: {
      modeBoxBg: isDark ? "rgba(30,41,59,0.6)" : "#f8fafc",
      modeBoxBorder: isDark ? "rgba(148,163,184,0.25)" : "#e2e8f0",
      modeLabel: isDark ? "#cbd5e1" : "#475569",
      radioInactive: isDark ? "#94a3b8" : "#64748b",
      helperSub: isDark ? "#94a3b8" : "#94a3b8",
      previewLabel: isDark ? "#cbd5e1" : "#555",
      previewDivider: isDark ? "rgba(96,165,250,0.2)" : "#BFDBFE",
      violationRed: isDark ? "#f87171" : "#dc2626",
      violationRedLight: isDark ? "rgba(248,113,113,0.08)" : "#fff5f5",
      violationRedBorder: isDark ? "rgba(248,113,113,0.4)" : "#fca5a5",
      profitGreen: isDark ? "#4ade80" : "#16A34A",
      abcTeal: isDark ? "#5eead4" : "#0F766E",
      costAmber: isDark ? "#fcd34d" : "#b45309",
      costAmberDeep: isDark ? "#fef08a" : "#92400e",
      capitalText: isDark ? "#e2e8f0" : "#333",
      noteMuted: isDark ? "#64748b" : "#999",
      noteMuted2: isDark ? "#94a3b8" : "#94A3B8",
      iconBgContrast: isDark ? "#0f172a" : "#ffffff",
    },
  };
  // ──────────────────────────────────────────────────────────────────────

  const [percentage, setPercentage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("markup");
  const inputRef = React.useRef(null);

  const fmt = useCallback(
    (n) =>
      Number(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  // ─── SHARED HELPERS ───────────────────────────────────────────────────
  const transactionABC = Number(transaction?.dTotalABC || 0);
  const hasABCForMarkdown = transactionABC > 0;

  const getItemABC = useCallback((item) => {
    const v = Number(item.abc || 0);
    return v > 0 ? v : null;
  }, []);

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

  const getTotalQty = useCallback(
    () => items.reduce((s, i) => s + Number(i.qty || 0), 0),
    [items],
  );

  const getTotalCost = useCallback(
    () => items.reduce((sum, i) => sum + getIncludedTotal(i), 0),
    [items, getIncludedTotal],
  );

  const someItemsLackABC = items.some((i) => getItemABC(i) === null);

  // Compute ABC budget for an item (with pro-rata fallback)
  const computeBaseABCTotal = useCallback(
    (item, totalQty, totalCost) => {
      const itemABC = getItemABC(item);
      if (itemABC !== null) return itemABC;
      if (transactionABC > 0 && totalQty > 0) {
        const includedTotal = getIncludedTotal(item);
        return totalCost > 0
          ? (includedTotal / totalCost) * transactionABC
          : (Number(item.qty || 0) / totalQty) * transactionABC;
      }
      return 0;
    },
    [getItemABC, transactionABC, getIncludedTotal],
  );

  const computeUnitPrice = useCallback(
    (item, pct, modeVal, totalQty, totalCost) => {
      const qty = Number(item.qty || 0);
      if (qty <= 0) return null;
      const includedTotal = getIncludedTotal(item);
      if (includedTotal <= 0) return null;

      if (modeVal === "markdown") {
        const baseABCTotal = computeBaseABCTotal(item, totalQty, totalCost);
        if (baseABCTotal > 0) {
          // round to nearest whole peso, same as the sheet's ROUND(x,0)
          return Math.round((baseABCTotal * (1 - pct / 100)) / qty);
        }
      }
      // Markup OR no ABC fallback: cost × (1 + pct), rounded to whole peso
      return Math.round((includedTotal / qty) * (1 + pct / 100));
    },
    [getIncludedTotal, computeBaseABCTotal],
  );
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setPercentage("");
      setError("");
      setMode("markup");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const totalCapital = getTotalCost();

  // ─── PREVIEW ───────────────────────────────────────────────────────────
  const previewItems = (() => {
    const pct = Number(percentage);
    if (!percentage || isNaN(pct) || pct <= 0) return null;

    const totalQty = getTotalQty();
    const totalCost = getTotalCost();

    return items
      .filter((i) => {
        const qty = Number(i.qty || 0);
        return qty > 0 && getIncludedTotal(i) > 0;
      })
      .map((item) => {
        const qty = Number(item.qty || 0);
        const isLocked = !!lockedPricings[item.id];
        const itemABC = getItemABC(item);
        let sellingTotal;

        if (isLocked) {
          sellingTotal = Number(item.currentSellingPrice || 0) * qty;
        } else {
          const unitPrice = computeUnitPrice(
            item,
            pct,
            mode,
            totalQty,
            totalCost,
          );
          sellingTotal =
            unitPrice !== null ? parseFloat((unitPrice * qty).toFixed(2)) : 0;
        }
        return { item, sellingTotal, itemABC, isLocked };
      });
  })();

  const previewTotal = previewItems
    ? previewItems.reduce((s, r) => s + r.sellingTotal, 0)
    : null;

  // ABC Savings = ABC - Selling Price
  const abcForSavings = (() => {
    if (!previewItems) return 0;
    const itemsABCTotal = previewItems.reduce(
      (s, { itemABC }) => s + (itemABC !== null ? itemABC : 0),
      0,
    );
    const noABCItemsQty = previewItems
      .filter(({ itemABC }) => itemABC === null)
      .reduce((s, { item }) => s + Number(item.qty || 0), 0);
    const totalQty = getTotalQty();
    const proRataABC =
      transactionABC > 0 && totalQty > 0
        ? (noABCItemsQty / totalQty) * transactionABC
        : 0;
    return itemsABCTotal + proRataABC;
  })();

  // ─── ABC VIOLATION CHECK ──────────────────────────────────────────────
  const abcViolation = (() => {
    if (!previewItems || mode === "markdown") return null;

    // Per-item ABC cap check
    for (const { item, sellingTotal, itemABC, isLocked } of previewItems) {
      if (isLocked) continue;
      if (itemABC !== null && sellingTotal > itemABC + 0.001) {
        return {
          type: "item",
          name: item.name || `Item ${item.id}`,
          sellingTotal,
          cap: itemABC,
        };
      }
    }

    // Transaction-level ABC cap for items without their own ABC
    if (someItemsLackABC && transactionABC > 0) {
      const sellingTotalForNoABCItems = previewItems
        .filter(({ itemABC, isLocked }) => itemABC === null && !isLocked)
        .reduce((s, { sellingTotal }) => s + sellingTotal, 0);
      if (sellingTotalForNoABCItems > transactionABC + 0.001) {
        return {
          type: "transaction",
          sellingTotal: sellingTotalForNoABCItems,
          cap: transactionABC,
        };
      }
    }
    return null;
  })();

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    setPercentage(val);
    if (error) setError("");
  };

  const handleClose = () => {
    setPercentage("");
    setError("");
    onClose();
  };

  const handleApply = async () => {
    const pct = Number(percentage);
    const entity = selectedSet
      ? `${selectedSet.name}`
      : `${mode === "markup" ? "Markup" : "Markdown"} Pricing`;

    if (!percentage || isNaN(pct) || pct <= 0) {
      setError(uiMessages.common.greaterThanZero);
      return;
    }

    if (abcViolation) {
      if (abcViolation.type === "item") {
        setError(
          `"${abcViolation.name}" selling total ₱${fmt(abcViolation.sellingTotal)} exceeds its ABC of ₱${fmt(abcViolation.cap)}. Lower the markup.`,
        );
      } else {
        setError(
          `Selling total (₱${fmt(abcViolation.sellingTotal)}) exceeds transaction ABC ₱${fmt(abcViolation.cap)}. Lower the markup.`,
        );
      }
      return;
    }

    try {
      handleClose();
      await withSpinner(entity, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const totalQty = getTotalQty();
        const totalCost = getTotalCost();
        const newPrices = {};

        items.forEach((item) => {
          if (lockedPricings[item.id]) return;
          const unitPrice = computeUnitPrice(
            item,
            pct,
            mode,
            totalQty,
            totalCost,
          );
          if (unitPrice !== null) {
            newPrices[item.id] = String(unitPrice);
          }
        });

        onApply(newPrices);
      });

      showSwal(
        "SUCCESS",
        {},
        {
          entity: `${mode === "markup" ? "Markup" : "Markdown"} Pricing for set ${selectedSet?.name || ""}`,
          action: "apply",
        },
      );
    } catch (err) {
      console.error("handleApply error:", err);
      showSwal(
        "ERROR",
        {},
        {
          entity: `${mode === "markup" ? "Markup" : "Markdown"} Pricing for set ${selectedSet?.name || ""}`,
          action: "apply error",
        },
      );
    }
  };

  if (!open) return null;

  // ─── UI DERIVED VALUES ───────────────────────────────────────────────
  const eligibleCount = items.filter((i) => {
    if (lockedPricings[i.id]) return false;
    const qty = Number(i.qty || 0);
    return qty > 0 && getIncludedTotal(i) > 0;
  }).length;
  const lockedCount = items.filter((i) => !!lockedPricings[i.id]).length;
  const isMarkdown = mode === "markdown";

  // Active theme palette based on mode
  const accentColor = isMarkdown
    ? colors.markdown.accent
    : colors.markup.accent;
  const accentLight = isMarkdown
    ? colors.markdown.accentLight
    : colors.markup.accentLight;
  const accentBorder = isMarkdown
    ? colors.markdown.accentBorder
    : colors.markup.accentBorder;
  const radioColor = isMarkdown ? colors.markdown.radio : colors.markup.radio;

  // Preview metrics
  const grossProfit =
    previewTotal !== null ? previewTotal - totalCapital : null;
  const abcTotal = abcForSavings > 0 ? abcForSavings : null;
  const abcSavings =
    previewTotal !== null && abcForSavings > 0
      ? abcForSavings - previewTotal
      : null;
  const grossProfitPct =
    grossProfit !== null && totalCapital > 0
      ? ((grossProfit / totalCapital) * 100).toFixed(2)
      : null;
  const abcSavingsPct =
    abcSavings !== null && abcForSavings > 0
      ? ((abcSavings / abcForSavings) * 100).toFixed(2)
      : null;

  const previewRows =
    previewTotal !== null
      ? [
          {
            label: "Total Selling Price",
            value: fmt(previewTotal),
            color: abcViolation ? colors.base.violationRed : accentColor,
            fontWeight: 700,
            borderTop: false,
            pct: null,
          },
          {
            label: "Total Purchase Cost",
            value: fmt(totalCapital),
            color: colors.base.capitalText,
            fontWeight: 600,
            borderTop: false,
            pct: null,
          },
          {
            label: "Gross Profit",
            value: fmt(grossProfit),
            color: colors.base.profitGreen,
            fontWeight: 700,
            borderTop: true,
            pct: grossProfitPct,
          },
          ...(abcTotal !== null
            ? [
                {
                  label: "ABC Total",
                  value: fmt(abcTotal),
                  color: colors.base.abcTeal,
                  fontWeight: 700,
                  borderTop: true,
                  pct: null,
                },
                {
                  label: "ABC Savings",
                  value: fmt(abcSavings),
                  color: colors.base.costAmber,
                  fontWeight: 700,
                  borderTop: false,
                  pct: abcSavingsPct,
                },
              ]
            : []),
        ]
      : [];

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isMarkdown ? "Set Markdown" : "Set Markup"}
      subTitle={selectedSet ? `${selectedSet.name}` : ""}
      onSave={handleApply}
      showSave
      saveLabel="Apply"
      disableSave={!!abcViolation}
      showCancel
      cancelLabel="Cancel"
      onCancel={handleClose}
    >
      <Box sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
            pb: 1,
            borderBottom: `2px solid ${accentColor}`,
          }}
        >
          <Box
            sx={{
              backgroundColor: accentColor,
              borderRadius: "6px",
              p: 0.6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isMarkdown ? (
              <TrendingDown
                sx={{ color: colors.base.iconBgContrast, fontSize: "1rem" }}
              />
            ) : (
              <Percent
                sx={{ color: colors.base.iconBgContrast, fontSize: "1rem" }}
              />
            )}
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: accentColor,
            }}
          >
            {isMarkdown ? "Markdown Percentage" : "Markup Percentage"}
          </Typography>
        </Box>

        {/* Mode toggle — only visible when ABC data is available */}
        {hasABCForMarkdown && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              borderRadius: 1.5,
              backgroundColor: colors.base.modeBoxBg,
              border: `1px solid ${colors.base.modeBoxBorder}`,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: colors.base.modeLabel,
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              Pricing Mode
            </Typography>
            <RadioGroup
              row
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setPercentage("");
                setError("");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            >
              <FormControlLabel
                value="markup"
                control={
                  <Radio
                    size="small"
                    sx={{
                      color: colors.markup.radio,
                      "&.Mui-checked": { color: colors.markup.radio },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TrendingUp
                      sx={{ fontSize: "0.85rem", color: colors.markup.radio }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color:
                          mode === "markup"
                            ? colors.markup.radio
                            : colors.base.radioInactive,
                      }}
                    >
                      Markup
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.65rem", color: colors.base.helperSub }}
                    >
                      (above cost)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="markdown"
                control={
                  <Radio
                    size="small"
                    sx={{
                      color: colors.markdown.radio,
                      "&.Mui-checked": { color: colors.markdown.radio },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TrendingDown
                      sx={{ fontSize: "0.85rem", color: colors.markdown.radio }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color:
                          mode === "markdown"
                            ? colors.markdown.radio
                            : colors.base.radioInactive,
                      }}
                    >
                      Markdown
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.65rem", color: colors.base.helperSub }}
                    >
                      (below ABC)
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
            {isMarkdown && (
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: colors.base.costAmber,
                  mt: 0.5,
                  fontStyle: "italic",
                }}
              >
                Markdown reduces the ABC by the entered percentage. e.g. 1%
                markdown on ₱100 ABC = ₱99 selling price.
              </Typography>
            )}
          </Box>
        )}

        {/* Input */}
        <TextField
          fullWidth
          size="small"
          label={isMarkdown ? "Markdown Percentage" : "Markup Percentage"}
          value={percentage}
          onChange={handleChange}
          error={!!error}
          helperText={error}
          placeholder="e.g. 1"
          inputRef={inputRef}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Percent sx={{ fontSize: "0.85rem", color: accentColor }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            "& .MuiInputBase-input": { fontWeight: 600, fontSize: "0.85rem" },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              { borderColor: accentColor },
            "& .MuiInputLabel-root.Mui-focused": { color: accentColor },
          }}
        />

        {/* Preview Card */}
        {previewTotal !== null && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: abcViolation
                ? colors.base.violationRedLight
                : accentLight,
              border: `1px solid ${abcViolation ? colors.base.violationRedBorder : accentBorder}`,
              borderLeft: `4px solid ${abcViolation ? colors.base.violationRed : accentColor}`,
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {isMarkdown ? (
                <TrendingDown
                  sx={{
                    fontSize: "0.85rem",
                    color: abcViolation
                      ? colors.base.violationRed
                      : accentColor,
                  }}
                />
              ) : (
                <TrendingUp
                  sx={{
                    fontSize: "0.85rem",
                    color: abcViolation
                      ? colors.base.violationRed
                      : accentColor,
                  }}
                />
              )}
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: abcViolation ? colors.base.violationRed : accentColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Preview
              </Typography>
            </Box>

            {previewRows.map(
              ({ label, value, color, fontWeight, borderTop, pct }) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    ...(borderTop && {
                      borderTop: `1px solid ${colors.base.previewDivider}`,
                      pt: 0.7,
                      mt: 0.25,
                    }),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: colors.base.previewLabel,
                    }}
                  >
                    {label}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      minWidth: "120px",
                      justifyContent: "flex-end",
                    }}
                  >
                    {pct !== null && (
                      <Typography
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          color,
                          opacity: 0.75,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pct}%
                      </Typography>
                    )}
                    <Typography
                      sx={{ fontSize: "0.72rem", fontWeight, color, mr: "2px" }}
                    >
                      ₱
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight,
                        color,
                        textAlign: "right",
                        minWidth: "72px",
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                </Box>
              ),
            )}

            {/* ABC Balance / Fallback Info */}
            {someItemsLackABC &&
              transactionABC > 0 &&
              (() => {
                const noABCTotal = previewItems
                  .filter(({ itemABC }) => itemABC === null)
                  .reduce((s, { sellingTotal }) => s + sellingTotal, 0);
                const over = !isMarkdown && noABCTotal > transactionABC + 0.001;
                const color = over
                  ? colors.base.violationRed
                  : isMarkdown
                    ? colors.base.costAmber
                    : colors.base.profitGreen;
                const remaining = transactionABC - noABCTotal;
                const divePercent = (
                  (remaining / transactionABC) *
                  100
                ).toFixed(2);
                return (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        color: colors.base.previewLabel,
                      }}
                    >
                      ABC Balance
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        minWidth: "90px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color,
                          mr: "2px",
                        }}
                      >
                        {over ? "▲ Over by" : `▼ Dive (${divePercent}%) by`} ₱
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color,
                          textAlign: "right",
                          minWidth: "72px",
                        }}
                      >
                        {fmt(Math.abs(noABCTotal - transactionABC))}
                      </Typography>
                    </Box>
                  </Box>
                );
              })()}
          </Box>
        )}

        {/* Items count note */}
        <Typography
          sx={{ fontSize: "0.65rem", color: colors.base.noteMuted, mt: 0.5 }}
        >
          Will apply to {eligibleCount} of {items.length} item
          {items.length !== 1 ? "s" : ""} with purchase data.
          {lockedCount > 0 && (
            <span style={{ color: colors.base.noteMuted2, marginLeft: 4 }}>
              ({lockedCount} locked — included in preview at existing price.)
            </span>
          )}
        </Typography>
      </Box>
    </ModalContainer>
  );
}

export default PricingPercentageModal;
