import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  TextField,
  Grid,
  Paper,
} from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";

const sampleTransaction = {
  transactionName: "Flash Drive Purchase",
  transactionId: "TXN-001",
  items: [
    { id: 1, name: "Flash Drive", qty: 10, purchasePrice: 3800, sellingPrice: 450, abc: 5000 },
  ],
};

const PricingModal = ({ open, onClose }) => {
  const [items, setItems] = useState(sampleTransaction.items);
  const [globalRate, setGlobalRate] = useState("");
  const [globalGrossRate, setGlobalGrossRate] = useState("");

  const calculateTotals = (item) => {
    const totalSelling = item.sellingPrice * item.qty;
    const grossProfit = totalSelling - item.purchasePrice;
    const grossProfitRate = item.purchasePrice
      ? (grossProfit / item.purchasePrice) * 100
      : 0;
    const balance = item.abc - totalSelling;
    const exceedsABC = totalSelling > item.abc;
    return { totalSelling, grossProfit, grossProfitRate, balance, exceedsABC };
  };

  const handlePriceChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, sellingPrice: Number(value) || 0 }
          : item
      )
    );
  };

  const handleRateChange = (id, rate) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              sellingPrice: Math.round(item.purchasePrice * (1 + (Number(rate) || 0) / 100)),
            }
          : item
      )
    );
  };

  const handleGlobalRateChange = (rate) => {
    setGlobalRate(rate);
    setGlobalGrossRate("");
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        sellingPrice: Math.round(item.purchasePrice * (1 + (Number(rate) || 0) / 100)),
      }))
    );
  };

  const handleGlobalGrossRateChange = (rate) => {
    setGlobalGrossRate(rate);
    setGlobalRate("");
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        sellingPrice: Math.round(item.purchasePrice * (1 + (Number(rate) || 0) / 100)),
      }))
    );
  };

  const grandTotals = items.reduce(
    (acc, item) => {
      const { totalSelling, grossProfit, balance } = calculateTotals(item);
      return {
        totalSelling: acc.totalSelling + totalSelling,
        grossProfit: acc.grossProfit + grossProfit,
        balance: acc.balance + balance,
      };
    },
    { totalSelling: 0, grossProfit: 0, balance: 0 }
  );

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Pricing"
      width={750}
      showFooter={false}
    >
      <Box sx={{ p: 2, maxHeight: "70vh", overflowY: "auto" }}>
        {/* Transaction Header */}
        <Paper sx={{ p: 2, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {sampleTransaction.transactionName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {sampleTransaction.transactionId}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="subtitle2">Items: {items.length}</Typography>
            <Typography variant="subtitle2">
              Total ABC: ₱ {items.reduce((sum, i) => sum + i.abc, 0).toLocaleString()}
            </Typography>
          </Box>
        </Paper>

        {/* Global Rates Inputs */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Global Selling Price Rate (%)"
              type="number"
              size="small"
              fullWidth
              value={globalRate}
              onChange={(e) => handleGlobalRateChange(e.target.value)}
              InputProps={{ endAdornment: <Typography>%</Typography> }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Global Gross Profit Rate (%)"
              type="number"
              size="small"
              fullWidth
              value={globalGrossRate}
              onChange={(e) => handleGlobalGrossRateChange(e.target.value)}
              InputProps={{ endAdornment: <Typography>%</Typography> }}
            />
          </Grid>
        </Grid>

        {/* Items & Pricing */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Items & Pricing
        </Typography>

        <Grid container spacing={2}>
          {items.map((item, index) => {
            const { totalSelling, grossProfit, grossProfitRate, balance, exceedsABC } = calculateTotals(item);
            return (
              <Box key={item.id} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {index + 1}. {item.name} (x{item.qty})
                </Typography>

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={4}><Typography>Purchase Price (per item):</Typography></Grid>
                  <Grid item xs={8}><Typography>₱ {(item.purchasePrice / item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography></Grid>

                  <Grid item xs={4}><Typography>Selling Price (per item):</Typography></Grid>
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.sellingPrice}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      InputProps={{ startAdornment: <Typography>₱ </Typography> }}
                      error={exceedsABC}
                      helperText={exceedsABC ? "Exceeds ABC!" : ""}
                    />
                  </Grid>

                  <Grid item xs={4}><Typography>Selling Price Rate (%):</Typography></Grid>
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={Math.round(((item.sellingPrice / (item.purchasePrice / item.qty) - 1) * 100) || 0)}
                      onChange={(e) => handleRateChange(item.id, e.target.value)}
                      InputProps={{ endAdornment: <Typography>%</Typography> }}
                      error={exceedsABC}
                    />
                  </Grid>

                  <Grid item xs={4}><Typography>Total Selling:</Typography></Grid>
                  <Grid item xs={8}><Typography sx={{ color: exceedsABC ? "red" : "inherit" }}>₱ {totalSelling.toLocaleString()}</Typography></Grid>

                  <Grid item xs={4}><Typography>Gross Profit:</Typography></Grid>
                  <Grid item xs={8}>
                    <Typography sx={{ color: exceedsABC ? "red" : "inherit" }}>
                      ₱ {grossProfit.toLocaleString()} ({grossProfitRate.toFixed(2)}%)
                    </Typography>
                  </Grid>

                  <Grid item xs={4}><Typography>ABC:</Typography></Grid>
                  <Grid item xs={8}><Typography>₱ {item.abc.toLocaleString()}</Typography></Grid>

                  <Grid item xs={4}><Typography>Balance:</Typography></Grid>
                  <Grid item xs={8}><Typography sx={{ color: exceedsABC ? "red" : "inherit" }}>₱ {balance.toLocaleString()}</Typography></Grid>
                </Grid>
              </Box>
            );
          })}
        </Grid>

        {/* Grand Totals */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 600, mb: 2 }}>
          <Typography>Grand Total Selling: ₱ {grandTotals.totalSelling.toLocaleString()}</Typography>
          <Typography>Grand Gross Profit: ₱ {grandTotals.grossProfit.toLocaleString()}</Typography>
          <Typography>Grand Balance: ₱ {grandTotals.balance.toLocaleString()}</Typography>
        </Box>

        {/* Footer Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={items.some(item => calculateTotals(item).exceedsABC)}
            onClick={() => alert("Pricing saved!")}
          >
            Save
          </Button>
        </Box>
      </Box>
    </ModalContainer>
  );
};

export default PricingModal;
