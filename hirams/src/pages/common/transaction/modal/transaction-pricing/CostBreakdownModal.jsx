import React, { useState, useMemo, useEffect, useRef } from "react"; // ← add useRef
import ModalContainer from "../../../../../components/common/ModalContainer";
import { Box, Typography, Divider, Collapse, IconButton } from "@mui/material";
import {
  ReceiptLong,
  AccountBalance,
  TrendingUp,
  ExpandMore,
} from "@mui/icons-material";
import api from "../../../../../utils/api/api";
import ExportDialogSpinner from "../../../../../components/common/ExportDialogSpinner";

const FinancialRow = ({
  label,
  value,
  highlight,
  bold,
  variant = "normal",
}) => {
  const isTotal = variant === "total";
  const isSubtotal = variant === "subtotal";
  const valueColor =
    highlight && value < 0
      ? "#d32f2f"
      : highlight && value > 0
        ? "#2e7d32"
        : isTotal
          ? "#2e7d32"
          : isSubtotal
            ? "#37474f"
            : "#1a237e";

  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : value || "0.00";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: isTotal ? 1.2 : isSubtotal ? 1 : 0.75,
        px: 0.5,
        mb: 0.5,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: isTotal ? 800 : isSubtotal ? 700 : bold ? 600 : 500,
          color: isTotal ? "#2e7d32" : isSubtotal ? "#37474f" : "#555",
          textTransform: isTotal || isSubtotal ? "uppercase" : "none",
          letterSpacing: isTotal || isSubtotal ? "0.5px" : "normal",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: isTotal ? "0.9rem" : isSubtotal ? "0.82rem" : "0.78rem",
          fontWeight: isTotal ? 800 : isSubtotal ? 700 : bold ? 600 : 500,
          color: valueColor,
        }}
      >
        ₱ {formattedValue}
      </Typography>
    </Box>
  );
};
const CollapsibleSectionHeader = ({
  icon: Icon,
  title,
  color = "#1976d2",
  expanded,
  onToggle,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 1.5,
      pb: 1,
      borderBottom: `2px solid ${color}`,
      cursor: "pointer",
      "&:hover": { opacity: 0.8 },
    }}
    onClick={onToggle}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          backgroundColor: color,
          borderRadius: "6px",
          p: 0.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ color: "white", fontSize: "1rem" }} />
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color,
        }}
      >
        {title}
      </Typography>
    </Box>
    <IconButton
      size="small"
      sx={{
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s",
        color,
      }}
    >
      <ExpandMore />
    </IconButton>
  </Box>
);

function CostBreakdownModal({
  open,
  onClose,
  transaction = null,
  selectedSet = null,
  items = [],
  unitSellingPrices = {},
  clientName,
}) {
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [directCosts, setDirectCosts] = useState([]);
  const [directCostOptions, setDirectCostOptions] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    costSummary: true,
    profitAnalysis: true,
    otherDirectCost: true,
  });
  const abortRef = useRef(null); // ← add this near your other state

  const toggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  useEffect(() => {
    if (!open || !transaction?.nTransactionId) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [optionsRes, costsRes] = await Promise.all([
          api.get("direct-cost-options"),
          api.get(`direct-cost?nTransactionID=${transaction.nTransactionId}`),
        ]);

        const toArray = (res) => {
          if (Array.isArray(res)) return res;
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res?.directCosts)) return res.directCosts;
          if (Array.isArray(res?.directCostOptions))
            return res.directCostOptions;
          if (Array.isArray(res?.items)) return res.items;
          return [];
        };

        setDirectCostOptions(toArray(optionsRes));
        setDirectCosts(toArray(costsRes));
      } catch (err) {
        console.error("Error fetching direct costs:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [open, transaction?.nTransactionId]);
  /* ── Reset on close ── */
  useEffect(() => {
    if (!open) {
      setDirectCosts([]);
      setDirectCostOptions([]);
      setDataLoading(false);
      setExporting(false);
      setExportDone(false);
    }
  }, [open]);

  const getOptionLabel = (optionId) => {
    const found = directCostOptions.find(
      (o) => (o.nDirectCostOptionID || o.id) === optionId,
    );
    return found?.strName || found?.name || "Direct Cost";
  };

  const getOptionName = (optionId) => {
    const found = directCostOptions.find(
      (o) => (o.nDirectCostOptionID || o.id) === optionId,
    );
    return (found?.strName || found?.name || "").toLowerCase();
  };

  /* ── Calculations ── */
  const calculations = useMemo(() => {
    if (!items || items.length === 0)
      return {
        budget: 0,
        purchases: 0,
        tax: 0,
        totalCost: 0,
        grossProfit: 0,
        otherDirectCost: 0,
        lateDelivery: 0,
        retention: 0,
        finalTotal: 0,
        abcDivePercent: null,
      };

    let totalPurchases = 0,
      totalTax = 0,
      totalSellingPrice = 0;

    items.forEach((item) => {
      const includedTotal = item.purchaseOptions
        .filter((opt) => opt.bIncluded)
        .reduce(
          (sum, opt) =>
            sum + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
          0,
        );
      totalPurchases += includedTotal;
      const itemSellingPrice =
        Number(unitSellingPrices[item.id] || 0) * Number(item.qty || 0);
      totalSellingPrice += itemSellingPrice;
      totalTax += ((itemSellingPrice - includedTotal) / 1.12) * 0.42;
    });

    const budget = totalSellingPrice;
    let lateDelivery = 0,
      retention = 0,
      otherDirectCost = 0;

    directCosts.forEach((cost) => {
      const name = getOptionName(cost.nDirectCostOptionID);
      const amount = Number(cost.dAmount || 0);
      if (name.startsWith("lat")) lateDelivery += amount;
      else if (name.startsWith("ret")) retention += amount;
      else otherDirectCost += amount;
    });

    const totalCost =
      totalPurchases + totalTax + lateDelivery + otherDirectCost;
    const grossProfit = budget - totalCost;
    const finalTotal = grossProfit - retention;
    // REPLACE with:
    const itemsABC = items.reduce((sum, item) => {
      const hasIncluded = item.purchaseOptions?.some((opt) => opt.bIncluded);
      if (!hasIncluded) return sum;
      return sum + Number(item.abc || 0);
    }, 0);

    const abc = itemsABC > 0 ? itemsABC : Number(transaction?.dTotalABC || 0);
    const abcDivePercent = abc > 0 ? ((abc - budget) / abc) * 100 : null;
    return {
      budget,
      purchases: totalPurchases,
      tax: totalTax,
      totalCost,
      grossProfit,
      otherDirectCost,
      lateDelivery,
      retention,
      finalTotal,
      abcDivePercent,
    };
  }, [items, unitSellingPrices, directCosts, directCostOptions, transaction]);

  if (!open) return null;

  const displayedDirectCosts = directCosts.filter((cost) => {
    const name = getOptionName(cost.nDirectCostOptionID);
    return !name.startsWith("lat") && !name.startsWith("ret");
  });
  const handleSave = async () => {
    if (!transaction?.strCode) return;
    abortRef.current = new AbortController(); // ← create controller
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
      ); // ← pass signal

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${transaction.strCode}_${clientName}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => {
        setExporting(false);
        setExportDone(false);
      }, 1600);
    } catch (err) {
      if (err.name === "AbortError") return; // ← silently exit, spinner already closed by onCancel
      console.error("Export breakdown failed:", err);
      setExporting(false);
      setExportDone(false);
    }
  };
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
          abortRef.current?.abort(); // ← abort the fetch
          setExporting(false); // ← close the spinner
          setExportDone(false);
        }}
      />

      <ModalContainer
        open={open}
        handleClose={onClose}
        title="Cost Breakdown"
        subTitle={
          transaction?.strCode && selectedSet?.name
            ? `/ ${transaction.strCode} / ${selectedSet.name}`
            : transaction?.strCode
              ? `/ ${transaction.strCode}`
              : ""
        }
        onSave={handleSave}
        saveLabel="Export"
        loading={dataLoading || exporting}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <>
            {/* ══ COST SUMMARY ══ */}
            <CollapsibleSectionHeader
              icon={ReceiptLong}
              title="Cost Summary"
              color="#1976d2"
              expanded={expandedSections.costSummary}
              onToggle={() => toggleSection("costSummary")}
            />
            <Collapse in={expandedSections.costSummary}>
              <Box sx={{ mb: 2 }}>
                {/* Budget row with Dive chip */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                    px: 0.5,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#555",
                      }}
                    >
                      Budget (Total Selling Price)
                    </Typography>
                    {calculations.abcDivePercent !== null && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          px: 0.8,
                          py: 0.2,
                          borderRadius: "10px",
                          backgroundColor:
                            calculations.abcDivePercent >= 0
                              ? "#e8f5e9"
                              : "#fce4ec",
                          border: `1px solid ${
                            calculations.abcDivePercent >= 0
                              ? "#a5d6a7"
                              : "#f48fb1"
                          }`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            color:
                              calculations.abcDivePercent >= 0
                                ? "#2e7d32"
                                : "#c62828",
                          }}
                        >
                          {Math.abs(calculations.abcDivePercent).toFixed(2)}% of
                          Dive
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#1a237e",
                    }}
                  >
                    ₱{" "}
                    {calculations.budget.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex" }}>
                  <Box sx={{ flex: 1 }}>
                    <FinancialRow
                      label="Purchases"
                      value={calculations.purchases}
                    />
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Box sx={{ flex: 1 }}>
                    <FinancialRow label="Tax" value={calculations.tax} />
                  </Box>
                </Box>

                <Box sx={{ display: "flex" }}>
                  <Box sx={{ flex: 1 }}>
                    <FinancialRow
                      label="Late Delivery"
                      value={calculations.lateDelivery}
                    />
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Box sx={{ flex: 1 }}>
                    <FinancialRow
                      label="Other Direct Cost"
                      value={calculations.otherDirectCost}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />
                <FinancialRow
                  label="Total Cost"
                  value={calculations.totalCost}
                  variant="subtotal"
                  bold
                />
              </Box>
            </Collapse>

            {/* ══ PROFIT ANALYSIS ══ */}
            <CollapsibleSectionHeader
              icon={TrendingUp}
              title="Profit Analysis"
              color="#2e7d32"
              expanded={expandedSections.profitAnalysis}
              onToggle={() => toggleSection("profitAnalysis")}
            />
            <Collapse in={expandedSections.profitAnalysis}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                    px: 0.5,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#555",
                      }}
                    >
                      Gross Profit
                    </Typography>
                    {calculations.totalCost > 0 && (
                      <Box
                        sx={{
                          px: 0.8,
                          py: 0.2,
                          borderRadius: "10px",
                          backgroundColor:
                            calculations.grossProfit >= 0
                              ? "#e8f5e9"
                              : "#fce4ec",
                          border: `1px solid ${
                            calculations.grossProfit >= 0
                              ? "#a5d6a7"
                              : "#f48fb1"
                          }`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            color:
                              calculations.grossProfit >= 0
                                ? "#2e7d32"
                                : "#c62828",
                          }}
                        >
                          {(
                            (calculations.grossProfit /
                              calculations.totalCost) *
                            100
                          ).toFixed(1)}
                          %
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color:
                        calculations.grossProfit < 0
                          ? "#d32f2f"
                          : calculations.grossProfit > 0
                            ? "#2e7d32"
                            : "#1a237e",
                    }}
                  >
                    ₱{" "}
                    {calculations.grossProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />
                <FinancialRow
                  label="Retention"
                  value={calculations.retention}
                />
                <Divider sx={{ my: 1.5 }} />
                <FinancialRow
                  label="Net Profit"
                  value={calculations.finalTotal}
                  variant="total"
                  highlight
                />
              </Box>
            </Collapse>

            {/* ══ OTHER DIRECT COST BREAKDOWN ══ */}
            <CollapsibleSectionHeader
              icon={AccountBalance}
              title="Other Direct Cost"
              color="#f57c00"
              expanded={expandedSections.otherDirectCost}
              onToggle={() => toggleSection("otherDirectCost")}
            />
            <Collapse in={expandedSections.otherDirectCost}>
              <Box sx={{ mb: 2 }}>
                {displayedDirectCosts.length === 0 ? (
                  <Box
                    sx={{
                      py: 2,
                      textAlign: "center",
                      border: "1px dashed #e0e0e0",
                      borderRadius: 1.5,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.75rem", color: "#aaa" }}>
                      No direct costs recorded for this transaction.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      {displayedDirectCosts.map((cost, index) => {
                        const amount = Number(cost.dAmount || 0);
                        return (
                          <React.Fragment key={cost.nDirectCostID}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                py: 0.75,
                                px: 0.5,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.72rem",
                                  fontWeight: amount > 0 ? 600 : 500,
                                  color: "#555",
                                }}
                              >
                                {getOptionLabel(cost.nDirectCostOptionID)}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.78rem",
                                  fontWeight: amount > 0 ? 600 : 400,
                                  color: amount > 0 ? "#1a237e" : "#aaa",
                                }}
                              >
                                {amount > 0
                                  ? `₱ ${amount.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`
                                  : "₱ —"}
                              </Typography>
                            </Box>
                            {index < displayedDirectCosts.length - 1 && (
                              <Divider sx={{ my: 0.25 }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <FinancialRow
                      label="Total Other Direct Cost"
                      value={calculations.otherDirectCost}
                      variant="subtotal"
                      bold
                    />
                  </>
                )}
              </Box>
            </Collapse>
          </>
        </Box>
      </ModalContainer>
    </>
  );
}

export default CostBreakdownModal;
