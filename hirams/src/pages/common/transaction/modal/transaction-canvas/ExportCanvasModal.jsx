import React, { useState, useEffect, useRef } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Percent,
  TrendingUp,
  FileDownload,
} from "@mui/icons-material";
import api from "../../../../../utils/api/api";
import ExportDialogSpinner from "../../../../../components/common/ExportDialogSpinner";

function ExportCanvasModal({
  open,
  onClose,
  items = [],
  transaction = null,
  selectedSet = null,
  clientName,
  lockedPricings = {},
}) {
  const [percentage, setPercentage] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

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

  useEffect(() => {
    if (open) {
      setPercentage("");
      setError("");
      setExporting(false);
      setExportDone(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const totalCapital = items.reduce(
    (sum, item) =>
      sum +
      item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce(
          (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
          0,
        ),
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
          .reduce(
            (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
            0,
          );
        return qty > 0 && inc > 0;
      })
      .map((item) => {
        const qty = Number(item.qty || 0);
        const includedTotal = item.purchaseOptions
          .filter((o) => o.bIncluded)
          .reduce(
            (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
            0,
          );
        const isLocked = !!lockedPricings[item.id];
        const itemABC = getItemABC(item);

        let sellingTotal;
        if (isLocked) {
          const existingPrice = Number(item.currentSellingPrice || 0);
          sellingTotal = existingPrice * qty;
        } else {
          const unitSelling = Math.round(
            (includedTotal / qty) * (1 + Number(percentage) / 100),
          );
          sellingTotal = unitSelling * qty;
        }

        return { item, sellingTotal, itemABC, isLocked };
      });
  })();

  const previewTotal = previewItems
    ? previewItems.reduce((s, r) => s + r.sellingTotal, 0)
    : null;

  const buildUnitSellingPrices = () => {
    const pct = Number(percentage);
    const newPrices = {};
    items.forEach((item) => {
      if (lockedPricings[item.id]) return;
      const qty = Number(item.qty || 0);
      const includedTotal = item.purchaseOptions
        .filter((o) => o.bIncluded)
        .reduce(
          (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
          0,
        );
      if (qty > 0 && includedTotal > 0) {
        const unitSellingPrice = Math.round(
          (includedTotal / qty) * (1 + pct / 100),
        );
        newPrices[item.id] = unitSellingPrice;
      }
    });
    return newPrices;
  };

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

    if (!percentage || isNaN(pct) || pct <= 0) {
      setError("Enter a valid percentage greater than 0");
      return;
    }

    const unitSellingPrices = buildUnitSellingPrices();

    abortRef.current = new AbortController();
    setExporting(true);
    setExportDone(false);

    try {
      const blob = await api.postBlob(
        "export-pricing-report",
        {
          transaction,
          unitSellingPrices,
          items,
        },
        { signal: abortRef.current.signal },
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${transaction?.strCode || "canvas"}_${clientName || "export"}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => {
        setExporting(false);
        setExportDone(false);
        handleClose();
      }, 1600);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Export canvas failed:", err);
      setExporting(false);
      setExportDone(false);
    }
  };

  if (!open) return null;

  const accentColor = "#1976d2";
  const accentLight = "#e3f2fd";
  const accentBorder = "#90caf9";

  const eligibleCount = items.filter((i) => {
    if (lockedPricings[i.id]) return false;
    const qty = Number(i.qty || 0);
    const inc = i.purchaseOptions
      .filter((o) => o.bIncluded)
      .reduce(
        (s, o) => s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
        0,
      );
    return qty > 0 && inc > 0;
  }).length;

  const lockedCount = items.filter((i) => !!lockedPricings[i.id]).length;

  return (
    <>
      <ExportDialogSpinner
        open={exporting}
        done={exportDone}
        fileName={
          transaction?.strCode && clientName
            ? `${transaction.strCode}_${clientName}.xlsx`
            : ""
        }
        onCancel={() => {
          abortRef.current?.abort();
          setExporting(false);
          setExportDone(false);
        }}
      />

      <ModalContainer
        open={open}
        handleClose={handleClose}
        title="Export Canvas"
        subTitle={
          transaction?.strCode
            ? `/ ${transaction.strCode}${selectedSet?.name ? ` / ${selectedSet.name}` : ""}`
            : ""
        }
        onSave={handleApply}
        showSave
        saveLabel="Export"
        saveIcon={<FileDownload />}
        disableSave={exporting}
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
              <Percent sx={{ color: "white", fontSize: "1rem" }} />
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
              Markup Percentage
            </Typography>
          </Box>

          {/* Input */}
          <TextField
            fullWidth
            size="small"
            label="Markup Percentage"
            value={percentage}
            onChange={handleChange}
            error={!!error}
            helperText={error}
            placeholder="e.g. 45"
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
              "& .MuiInputBase-input": {
                fontWeight: 600,
                fontSize: "0.85rem",
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                { borderColor: accentColor },
              "& .MuiInputLabel-root.Mui-focused": { color: accentColor },
            }}
          />

          {/* Preview */}
          {previewTotal !== null && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: accentLight,
                border: `1px solid ${accentBorder}`,
                borderLeft: `4px solid ${accentColor}`,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: "0.85rem", color: accentColor }} />
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: accentColor,
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
                  label: `Total Selling Price (${percentage}% markup)`,
                  value: fmt(previewTotal),
                  color: accentColor,
                  fontWeight: 700,
                  borderTop: false,
                },
                {
                  label: "Gross Profit",
                  value: fmt(previewTotal - totalCapital),
                  color: "#16A34A",
                  fontWeight: 700,
                  borderTop: false,
                },
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
                  <Box
                    sx={{
                      display: "flex",
                      minWidth: "90px",
                      justifyContent: "flex-end",
                    }}
                  >
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
                    .map(({ item, sellingTotal, itemABC, isLocked }) => (
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
                            color: "#555",
                            maxWidth: "55%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name || `Item ${item.id}`}
                          {isLocked && (
                            <span style={{ color: "#94A3B8", marginLeft: 3 }}>
                              🔒
                            </span>
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "#16A34A",
                          }}
                        >
                          ✓ ₱{fmt(sellingTotal)}
                          {" → "}₱{fmt(itemABC)}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              )}
            </Box>
          )}

          {/* Items count note */}
          <Typography sx={{ fontSize: "0.65rem", color: "#999", mt: 0.5 }}>
            Will export {eligibleCount} of {items.length} item
            {items.length !== 1 ? "s" : ""} with purchase data.
            {lockedCount > 0 && (
              <span style={{ color: "#94A3B8", marginLeft: 4 }}>
                ({lockedCount} locked — included at existing price.)
              </span>
            )}
          </Typography>
        </Box>
      </ModalContainer>
    </>
  );
}

export default ExportCanvasModal;