import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer";
import { Box, Typography, TextField, InputAdornment, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { Percent, TrendingUp, TrendingDown } from "@mui/icons-material";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal";

function PricingPercentageModal({
  open,
  onClose,
  items,
  onApply,
  transaction,
  selectedSet,
  lockedPricings = {},
}) {
  const [percentage, setPercentage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("markup");

  const fmt = (n) =>
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const transactionABC = Number(transaction?.dTotalABC || 0);

  const getItemABC = (item) => {
    const v = Number(item.abc || 0);
    return v > 0 ? v : null;
  };

  const itemsWithOwnABC = items.filter((i) => getItemABC(i) !== null);
  const totalItemABC = itemsWithOwnABC.reduce((s, i) => s + getItemABC(i), 0);
  const someItemsLackABC = items.some((i) => getItemABC(i) === null);
  const hasABCForMarkdown = totalItemABC > 0;

  const averageMarkup = (() => {
    const eligible = items.filter((item) => {
      const qty = Number(item.qty || 0);
      const includedTotal = item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0);
      const selling = Number(item.currentSellingPrice || 0);
      return qty > 0 && includedTotal > 0 && selling > 0;
    });
    if (eligible.length === 0) return null;
    const totalPct = eligible.reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const includedTotal = item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0);
      const capital = includedTotal / qty;
      const selling = Number(item.currentSellingPrice || 0);
      return sum + (selling / capital - 1) * 100;
    }, 0);
    return (totalPct / eligible.length).toFixed(2);
  })();

  const inputRef = React.useRef(null);

  useEffect(() => {
    if (open) {
      setPercentage("");
      setError("");
      setMode("markup");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const totalCapital = items.reduce(
    (sum, item) =>
      sum +
      item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0),
    0,
  );

  const previewItems = (() => {
    const pct = Number(percentage);
    if (!percentage || isNaN(pct) || pct <= 0) return null;

    return items
      .filter((i) => {
        const qty = Number(i.qty || 0);
        const inc = i.purchaseOptions
          .filter((o) => o.bIncluded)
          .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0);
        return qty > 0 && inc > 0;
      })
      .map((item) => {
        const qty = Number(item.qty || 0);
        const includedTotal = item.purchaseOptions
          .filter((o) => o.bIncluded)
          .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0);
        const isLocked = !!lockedPricings[item.id];
        const itemABC = getItemABC(item);

        let sellingTotal;
        if (isLocked) {
          const existingPrice = Number(item.currentSellingPrice || 0);
          sellingTotal = existingPrice * qty;
        } else if (mode === "markdown") {
          const baseABC = itemABC !== null
            ? itemABC
            : transactionABC > 0
              ? (() => {
                  const tQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
                  return tQty > 0 ? (qty / tQty) * transactionABC : 0;
                })()
              : 0;
          if (baseABC > 0) {
            sellingTotal = Math.round(baseABC * (1 - pct / 100));
          } else {
            const unitSelling = Math.round((includedTotal / qty) * (1 + pct / 100));
            sellingTotal = unitSelling * qty;
          }
        } else {
          const unitSelling = Math.round((includedTotal / qty) * (1 + pct / 100));
          sellingTotal = unitSelling * qty;
        }

        return { item, sellingTotal, itemABC, isLocked };
      });
  })();

  const previewTotal = previewItems
    ? previewItems.reduce((s, r) => s + r.sellingTotal, 0)
    : null;

  const abcViolation = (() => {
    if (!previewItems) return null;
    if (mode === "markdown") return null;

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
      setError("Enter a valid percentage greater than 0");
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
        const newPrices = {};
        items.forEach((item) => {
          if (lockedPricings[item.id]) return;
          const qty = Number(item.qty || 0);
          const includedTotal = item.purchaseOptions
            .filter((o) => o.bIncluded)
            .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0);
          if (qty > 0 && includedTotal > 0) {
            let unitSellingPrice;
            if (mode === "markdown") {
              const itemABC = getItemABC(item);
              const baseABC = itemABC !== null
                ? itemABC
                : transactionABC > 0
                  ? (() => {
                      const tQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
                      return tQty > 0 ? (qty / tQty) * transactionABC : 0;
                    })()
                  : 0;
              if (baseABC > 0) {
                unitSellingPrice = Math.round((baseABC * (1 - pct / 100)) / qty);
              } else {
                unitSellingPrice = Math.round((includedTotal / qty) * (1 + pct / 100));
              }
            } else {
              unitSellingPrice = Math.round((includedTotal / qty) * (1 + pct / 100));
            }
            newPrices[item.id] = String(unitSellingPrice);
          }
        });
        onApply(newPrices);
      });

      showSwal("SUCCESS", {}, {
        entity: `${mode === "markup" ? "Markup" : "Markdown"} Pricing for set ${selectedSet?.name || ""}`,
        action: "apply",
      });
    } catch (err) {
      console.error("handleApply error:", err);
      showSwal("ERROR", {}, {
        entity: `${mode === "markup" ? "Markup" : "Markdown"} Pricing for set ${selectedSet?.name || ""}`,
        action: "apply error",
      });
    }
  };

  if (!open) return null;

  const eligibleCount = items.filter((i) => {
    if (lockedPricings[i.id]) return false;
    const qty = Number(i.qty || 0);
    const inc = i.purchaseOptions
      .filter((o) => o.bIncluded)
      .reduce((s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0), 0);
    return qty > 0 && inc > 0;
  }).length;

  const lockedCount = items.filter((i) => !!lockedPricings[i.id]).length;
  const isMarkdown = mode === "markdown";
  const accentColor = isMarkdown ? "#b45309" : "#1976d2";
  const accentLight = isMarkdown ? "#fef3c7" : "#e3f2fd";
  const accentBorder = isMarkdown ? "#fcd34d" : "#90caf9";

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isMarkdown ? "Set Markdown" : "Set Markup"}
      subTitle={selectedSet ? `/ ${selectedSet.name}` : ""}
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
            {isMarkdown
              ? <TrendingDown sx={{ color: "white", fontSize: "1rem" }} />
              : <Percent sx={{ color: "white", fontSize: "1rem" }} />
            }
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

        {/* Mode toggle — only visible when totalItemABC > 0 */}
        {hasABCForMarkdown && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              borderRadius: 1.5,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#475569",
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
              }}
            >
              <FormControlLabel
                value="markup"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#1976d2", "&.Mui-checked": { color: "#1976d2" } }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: "0.85rem", color: "#1976d2" }} />
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: mode === "markup" ? "#1976d2" : "#64748b",
                      }}
                    >
                      Markup
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8" }}>
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
                    sx={{ color: "#b45309", "&.Mui-checked": { color: "#b45309" } }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TrendingDown sx={{ fontSize: "0.85rem", color: "#b45309" }} />
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: mode === "markdown" ? "#b45309" : "#64748b",
                      }}
                    >
                      Markdown
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                      (below ABC)
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
            {isMarkdown && (
              <Typography
                sx={{ fontSize: "0.65rem", color: "#b45309", mt: 0.5, fontStyle: "italic" }}
              >
                Markdown reduces the ABC by the entered percentage. e.g. 1% markdown on ₱100 ABC = ₱99 selling price.
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
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: accentColor,
            },
            "& .MuiInputLabel-root.Mui-focused": { color: accentColor },
          }}
        />

        {/* Preview */}
        {previewTotal !== null && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: abcViolation ? "#fff5f5" : accentLight,
              border: `1px solid ${abcViolation ? "#fca5a5" : accentBorder}`,
              borderLeft: `4px solid ${abcViolation ? "#dc2626" : accentColor}`,
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {isMarkdown
                ? <TrendingDown sx={{ fontSize: "0.85rem", color: abcViolation ? "#dc2626" : accentColor }} />
                : <TrendingUp sx={{ fontSize: "0.85rem", color: abcViolation ? "#dc2626" : accentColor }} />
              }
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: abcViolation ? "#dc2626" : accentColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Preview
              </Typography>
            </Box>

            {[
              {
                label: "Total Purchase Cost",
                value: fmt(totalCapital),
                color: "#333",
                fontWeight: 600,
                borderTop: true,
              },
              {
                label: `Total Selling Price (${percentage}% ${isMarkdown ? "markdown" : "markup"})`,
                value: fmt(previewTotal),
                color: abcViolation ? "#dc2626" : accentColor,
                fontWeight: 700,
                borderTop: false,
              },
              ...(!isMarkdown
                ? [{
                    label: "Gross Profit",
                    value: fmt(previewTotal - totalCapital),
                    color: "#16A34A",
                    fontWeight: 700,
                    borderTop: false,
                  }]
                : []
              ),
              {
                label: "ABC Total",
                value: fmt(
                  totalItemABC > 0
                    ? totalItemABC
                    : transactionABC > 0
                      ? transactionABC
                      : 0,
                ),
                color: "#0F766E",
                fontWeight: 700,
                borderTop: true,
              },
              ...(isMarkdown
                ? [{
                    label: "Markdown Savings",
                    value: fmt(
                      (totalItemABC > 0 ? totalItemABC : transactionABC) - previewTotal
                    ),
                    color: "#b45309",
                    fontWeight: 700,
                    borderTop: false,
                  }]
                : []
              ),
            ].map(({ label, value, color, fontWeight, borderTop }) => (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  ...(borderTop && {
                    borderTop: "1px solid #BFDBFE",
                    pt: 0.7,
                    mt: 0.25,
                  }),
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: "#555" }}>
                  {label}
                </Typography>
                <Box sx={{ display: "flex", minWidth: "90px", justifyContent: "flex-end" }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight, color, mr: "2px" }}>
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
            ))}

            {/* Per-item ABC breakdown */}
            {itemsWithOwnABC.length > 0 && previewItems && (
              <Box
                sx={{
                  borderTop: "1px solid #BFDBFE",
                  pt: 0.5,
                  mt: 0.25,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.4,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Per-item ABC check
                </Typography>
                {previewItems
                  .filter(({ itemABC }) => itemABC !== null)
                  .map(({ item, sellingTotal, itemABC, isLocked }) => {
                    const over = !isMarkdown && sellingTotal > itemABC + 0.001;
                    const diff = itemABC - sellingTotal;
                    return (
                      <Box
                        key={item.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            color: over ? "#dc2626" : "#555",
                            maxWidth: "55%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name || `Item ${item.id}`}
                          {isLocked && (
                            <span style={{ color: "#94A3B8", marginLeft: 3 }}>🔒</span>
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: over ? "#dc2626" : isMarkdown ? "#b45309" : "#16A34A",
                          }}
                        >
                          {over ? "▼ Dive" : isMarkdown ? `▼ -${percentage}%` : "✓"}{" "}
                          ₱{fmt(sellingTotal)}{" → "}₱{fmt(itemABC)}
                          {isMarkdown && (
                            <span style={{ color: "#94a3b8", marginLeft: 3 }}>
                              (save ₱{fmt(diff)})
                            </span>
                          )}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>
            )}

            {/* Transaction ABC fallback check */}
            {someItemsLackABC &&
              transactionABC > 0 &&
              (() => {
                const noABCTotal = previewItems
                  .filter(({ itemABC }) => itemABC === null)
                  .reduce((s, { sellingTotal }) => s + sellingTotal, 0);
                const over = !isMarkdown && noABCTotal > transactionABC + 0.001;
                const color = over ? "#DC2626" : isMarkdown ? "#b45309" : "#16A34A";
                const remaining = transactionABC - noABCTotal;
                const divePercent = ((remaining / transactionABC) * 100).toFixed(2);
                return (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.72rem", color: "#555" }}>
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
                        sx={{ fontSize: "0.72rem", fontWeight: 700, color, mr: "2px" }}
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
        <Typography sx={{ fontSize: "0.65rem", color: "#999", mt: 0.5 }}>
          Will apply to {eligibleCount} of {items.length} item
          {items.length !== 1 ? "s" : ""} with purchase data.
          {lockedCount > 0 && (
            <span style={{ color: "#94A3B8", marginLeft: 4 }}>
              ({lockedCount} locked — included in preview at existing price.)
            </span>
          )}
        </Typography>
      </Box>
    </ModalContainer>
  );
}

export default PricingPercentageModal;