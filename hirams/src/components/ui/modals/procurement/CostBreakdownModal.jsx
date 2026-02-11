import React, { useState, useMemo } from "react";
import ModalContainer from "../../../common/ModalContainer";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Grid,
  Collapse,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  ReceiptLong,
  AccountBalance,
  TrendingUp,
  ExpandMore,
  Download,
} from "@mui/icons-material";
import api from "../../../../utils/api/api";
/* -------------------------------------------------------
   Professional Input Field Component
------------------------------------------------------- */
const FinancialField = ({
  label,
  value,
  editable = false,
  onChange,
  highlight,
  bold,
  variant = "normal",
  disabled = false,
}) => {
  const isTotal = variant === "total";
  const isSubtotal = variant === "subtotal";

  const bgColor = isTotal
    ? "#e8f5e9"
    : isSubtotal
      ? "#f5f5f5"
      : highlight
        ? "#e3f2fd"
        : disabled || !editable
          ? "#f5f5f5"
          : "#fafafa";

  const borderColor = isTotal
    ? "#4caf50"
    : isSubtotal
      ? "#757575"
      : highlight
        ? "#2196f3"
        : "#e0e0e0";

  const textColor =
    highlight && value < 0
      ? "#d32f2f"
      : highlight && value > 0
        ? "#2e7d32"
        : "text.primary";

  // For editable fields, show empty string or the raw value
  // For readonly fields, show formatted currency
  const displayValue =
    editable && !disabled
      ? value === 0 || value === ""
        ? ""
        : String(value)
      : typeof value === "number"
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : value || "0.00";

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "#666",
          mb: 0.3,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        value={displayValue}
        onChange={
          editable && !disabled ? (e) => onChange(e.target.value) : undefined
        }
        disabled={!editable || disabled}
        placeholder={editable && !disabled ? "0.00" : ""}
        sx={{
          "& .MuiInputBase-root": {
            backgroundColor: bgColor,
            borderLeft: `4px solid ${borderColor}`,
            fontWeight: isTotal ? 700 : bold ? 600 : 500,
            fontSize: isTotal ? "0.9rem" : "0.8rem",
          },
          "& .MuiInputBase-input": {
            textAlign: "right",
            padding: "8px 12px",
            color: textColor,
          },
          "& .Mui-disabled": {
            WebkitTextFillColor: textColor,
            color: textColor,
          },
        }}
        InputProps={{
          startAdornment: (
            <Typography
              component="span"
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#666",
                mr: 0.5,
              }}
            >
              ₱
            </Typography>
          ),
        }}
      />
    </Box>
  );
};

/* -------------------------------------------------------
   Collapsible Section Header Component
------------------------------------------------------- */
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
      mb: 2,
      pb: 1,
      borderBottom: `2px solid ${color}`,
      cursor: "pointer",
      "&:hover": {
        opacity: 0.8,
      },
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
          color: color,
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
        color: color,
      }}
    >
      <ExpandMore />
    </IconButton>
  </Box>
);

/* -------------------------------------------------------
   Exporting Animation Component
------------------------------------------------------- */
const ExportingAnimation = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "400px",
      gap: 3,
    }}
  >
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress
        size={80}
        thickness={4}
        sx={{
          color: "#1976d2",
        }}
      />
      <Download
        sx={{
          position: "absolute",
          fontSize: "2rem",
          color: "#1976d2",
        }}
      />
    </Box>
    
    <Box sx={{ textAlign: "center" }}>
      <Typography
        sx={{
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "#1976d2",
          mb: 1,
        }}
      >
        Exporting Cost Breakdown
      </Typography>
      <Typography
        sx={{
          fontSize: "0.85rem",
          color: "#666",
        }}
      >
        Please wait while we prepare your file...
      </Typography>
    </Box>
  </Box>
);

/* -------------------------------------------------------
   Main Modal
------------------------------------------------------- */
function CostBreakdownModal({
  open,
  onClose,
  transaction = null,
  selectedSet = null,
  items = [],
  unitSellingPrices = {},
  clientName
}) {
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    costSummary: true,
    profitAnalysis: true,
    otherDirectCost: true,
  });

  // Editable fields state - start with empty values (0 or "")
  const [editableValues, setEditableValues] = useState({
    ld: "",
    retention: "",
    bidDocs: "",
    feesBonds: "",
    freightIn: "",
    delivery: "",
    warehouse: "",
    manpower: "",
    rebates: "",
  });

  // Check if the pricing set is chosen (locked)
  const isLocked = selectedSet?.chosen === true;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

// Calculate all financial values
const calculations = useMemo(() => {
  if (!items || items.length === 0) {
    return {
      budget: 0,
      purchases: 0,
      tax: 0,
      totalCost: 0,
      grossProfit: 0,
      ewt: 0,
      otherDirectCost: 0,
      retention: 0,
      finalTotal: 0,
    };
  }

  let totalPurchases = 0;
  let totalTax = 0;
  let totalEWT = 0;
  let totalSellingPrice = 0;

  items.forEach((item) => {
    // Calculate purchases (capital × quantity)
    const includedTotal = item.purchaseOptions
      .filter((opt) => opt.bIncluded)
      .reduce(
        (sum, opt) =>
          sum + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
        0,
      );
    totalPurchases += includedTotal;

    // Calculate selling price
    const unitSellingPrice = Number(unitSellingPrices[item.id] || 0);
    const itemSellingPrice = unitSellingPrice * Number(item.qty || 0);
    totalSellingPrice += itemSellingPrice;

    // Calculate tax: ((Selling - Purchases) / 1.12) × (0.12 + 0.30)
    const taxableAmount = (itemSellingPrice - includedTotal) / 1.12;
    const itemTax = taxableAmount * 0.42; // 12% VAT + 30% Income Tax
    totalTax += itemTax;

    // Calculate EWT for this item (sum of all included purchase options' EWT)
    const itemEWT = item.purchaseOptions
      .filter((opt) => opt.bIncluded)
      .reduce((sum, opt) => {
        return sum + Number(opt.dEWT || 0);
      }, 0);

    // Add this item's total EWT to the grand total
    totalEWT += itemEWT;
  });

  // Budget = Total Selling Price
  const budget = totalSellingPrice;

  // Convert editable values to numbers (empty string becomes 0)
  const ldValue = Number(editableValues.ld) || 0;
  const retentionValue = Number(editableValues.retention) || 0;
  const bidDocsValue = Number(editableValues.bidDocs) || 0;
  const feesBondsValue = Number(editableValues.feesBonds) || 0;
  const freightInValue = Number(editableValues.freightIn) || 0;
  const deliveryValue = Number(editableValues.delivery) || 0;
  const warehouseValue = Number(editableValues.warehouse) || 0;
  const manpowerValue = Number(editableValues.manpower) || 0;
  const rebatesValue = Number(editableValues.rebates) || 0;

  // Other Direct Cost = EWT + editable fields
  const otherDirectCost =
    totalEWT +
    bidDocsValue +
    feesBondsValue +
    freightInValue +
    deliveryValue +
    warehouseValue +
    manpowerValue +
    rebatesValue;

  // Total Cost = Purchases + Tax + LD + Other Direct Cost
  const totalCost = totalPurchases + totalTax + ldValue + otherDirectCost;

  // Gross Profit = Budget - Total Cost
  const grossProfit = budget - totalCost;

  // Final Total = Gross Profit - Retention
  const finalTotal = grossProfit - retentionValue;

  return {
    budget,
    purchases: totalPurchases,
    tax: totalTax,
    totalCost,
    grossProfit,
    ewt: totalEWT,
    otherDirectCost,
    retention: retentionValue,
    finalTotal,
  };
}, [items, unitSellingPrices, editableValues]);

  const handleEditableChange = (field, value) => {
    // Only allow valid numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    setEditableValues((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  if (!open) return null;

const handleSave = async () => {
  if (!transaction?.strCode) return;

  try {
    setLoading(true);
    setIsExporting(true);

    // Calculate if transaction has ABC
    const transactionHasABC = transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;

    // Send all necessary data to backend
    const blob = await api.postBlob("export-breakdown", {
      transaction: transaction.strTotalABC,
      items: items,
      unitSellingPrices: unitSellingPrices,
      transactionHasABC: transactionHasABC,
      transactionABC: transactionHasABC ? Number(transaction.dTotalABC) : 0,
    });

    // download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${transaction.strCode}_${clientName}.xlsx`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    onClose();
  } catch (err) {
    console.error("Export breakdown failed:", err);
  } finally {
    setLoading(false);
    setIsExporting(false);
  }
};

  return (
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
      loading={loading}
      disableSave={isExporting}
    >
      {isExporting ? (
        <ExportingAnimation />
      ) : (
        <Box sx={{ px: 2, py: 1 }}>
          {/* ================= COST SUMMARY SECTION ================= */}
          <CollapsibleSectionHeader
            icon={ReceiptLong}
            title="Cost Summary"
            color="#1976d2"
            expanded={expandedSections.costSummary}
            onToggle={() => toggleSection("costSummary")}
          />

          <Collapse in={expandedSections.costSummary}>
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <FinancialField
                    label="Budget (Total Selling Price)"
                    value={calculations.budget}
                    bold
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Purchases"
                    value={calculations.purchases}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField label="Tax" value={calculations.tax} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Late Delivery"
                    value={editableValues.ld}
                    editable
                    onChange={(val) => handleEditableChange("ld", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Other Direct Cost"
                    value={calculations.otherDirectCost}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <FinancialField
                label="TOTAL COST"
                value={calculations.totalCost}
                variant="subtotal"
                bold
              />
            </Box>
          </Collapse>

          {/* ================= PROFIT SECTION ================= */}
          <CollapsibleSectionHeader
            icon={TrendingUp}
            title="Profit Analysis"
            color="#2e7d32"
            expanded={expandedSections.profitAnalysis}
            onToggle={() => toggleSection("profitAnalysis")}
          />

          <Collapse in={expandedSections.profitAnalysis}>
            <Box sx={{ mb: 2 }}>
              <FinancialField
                label="Gross Profit"
                value={calculations.grossProfit}
                highlight
                bold
              />

              <Divider sx={{ my: 2 }} />

              <FinancialField
                label="Retention"
                value={editableValues.retention}
                editable
                onChange={(val) => handleEditableChange("retention", val)}
                disabled={isLocked}
              />

              <Divider sx={{ my: 2 }} />

              <FinancialField
                label="NET PROFIT"
                value={calculations.finalTotal}
                variant="total"
                highlight
              />
            </Box>
          </Collapse>

          {/* ================= OTHER DIRECT COST BREAKDOWN ================= */}
          <CollapsibleSectionHeader
            icon={AccountBalance}
            title="Other Direct Cost Breakdown"
            color="#f57c00"
            expanded={expandedSections.otherDirectCost}
            onToggle={() => toggleSection("otherDirectCost")}
          />

          <Collapse in={expandedSections.otherDirectCost}>
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Expanded Withholding Tax (EWT)"
                    value={calculations.ewt}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Bid Documents"
                    value={editableValues.bidDocs}
                    editable
                    onChange={(val) => handleEditableChange("bidDocs", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Fees & Bonds"
                    value={editableValues.feesBonds}
                    editable
                    onChange={(val) => handleEditableChange("feesBonds", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Freight In"
                    value={editableValues.freightIn}
                    editable
                    onChange={(val) => handleEditableChange("freightIn", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Delivery"
                    value={editableValues.delivery}
                    editable
                    onChange={(val) => handleEditableChange("delivery", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Warehouse"
                    value={editableValues.warehouse}
                    editable
                    onChange={(val) => handleEditableChange("warehouse", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Manpower"
                    value={editableValues.manpower}
                    editable
                    onChange={(val) => handleEditableChange("manpower", val)}
                    disabled={isLocked}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FinancialField
                    label="Rebates"
                    value={editableValues.rebates}
                    editable
                    onChange={(val) => handleEditableChange("rebates", val)}
                    disabled={isLocked}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <FinancialField
                label="TOTAL OTHER DIRECT COST"
                value={calculations.otherDirectCost}
                variant="subtotal"
                bold
              />
            </Box>
          </Collapse>
        </Box>
      )}
    </ModalContainer>
  );
}

export default CostBreakdownModal;