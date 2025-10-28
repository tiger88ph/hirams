import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  TextField,
  Grid,
  Paper,
  Chip,
  CircularProgress,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ModalContainer from "../../../../common/ModalContainer";

const sampleTransaction = {
  transactionName: "Flash Drive Purchase",
  transactionId: "TXN-001",
  items: [
    {
      id: 1,
      name: "Flash Drive",
      qty: 10,
      purchasePrice: 3800,
      sellingPrice: 450,
      abc: 5000,
    },
  ],
};

const PricingModal = ({ open, onClose }) => {
  const [items, setItems] = useState(sampleTransaction.items);
  const [globalRate, setGlobalRate] = useState("");
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [loading, setLoading] = useState(false);

  const transaction = sampleTransaction;

  // ====== Calculations ======
  const calculateTotals = (item) => {
    const purchasePerItem = item.purchasePrice / item.qty;
    const totalSelling = item.sellingPrice * item.qty;
    const totalPurchase = purchasePerItem * item.qty;
    const grossProfit = totalSelling - totalPurchase;
    const grossProfitRate = totalPurchase
      ? (grossProfit / totalPurchase) * 100
      : 0;
    const balance = item.abc - totalSelling;
    const exceedsABC = totalSelling > item.abc;
    return { totalSelling, grossProfit, grossProfitRate, balance, exceedsABC };
  };

  // ====== Handlers ======
  const handlePriceChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, sellingPrice: Number(value) || 0 } : item
      )
    );
  };

  const handleRateChange = (id, rate) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const purchasePerItem = item.purchasePrice / item.qty;
        const newSellingPrice =
          purchasePerItem * (1 + (Number(rate) || 0) / 100);
        return {
          ...item,
          sellingPrice: Math.round(newSellingPrice * 100) / 100,
        };
      })
    );
  };

  const handleGlobalRateChange = (rate) => {
    setGlobalRate(rate);
    setItems((prev) =>
      prev.map((item) => {
        const purchasePerItem = item.purchasePrice / item.qty;
        const newSellingPrice =
          purchasePerItem * (1 + (Number(rate) || 0) / 100);
        return {
          ...item,
          sellingPrice: Math.round(newSellingPrice * 100) / 100,
        };
      })
    );
  };

  const handleFinalize = async () => {
    setLoading(true);
    // Simulate async save/finalize
    setTimeout(() => {
      setLoading(false);
      alert("✅ Transaction finalized successfully!");
      onClose();
    }, 1200);
  };

  // ====== Totals ======
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
      width={800}
      showSave={false}
    >
      {/* ========================== */}
      {/* CONFIRM FINALIZE VIEW */}
      {/* ========================== */}
      {confirmFinalize ? (
        <Box sx={{ textAlign: "center", py: 3, px: 2 }}>
          <CheckCircleRoundedIcon color="success" sx={{ fontSize: 48, mb: 1 }} />

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Finalize Transaction?
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            You are about to <strong>finalize</strong> the transaction{" "}
            <span style={{ fontWeight: 600, color: "#4f46e5" }}>
              {transaction.transactionName}
            </span>{" "}
            ({transaction.transactionId}). Once finalized, further edits may be
            restricted.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setConfirmFinalize(false)}
              sx={{ borderRadius: 8 }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleFinalize}
              disabled={loading}
              sx={{ borderRadius: 8, px: 3 }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Finalize"
              )}
            </Button>
          </Box>
        </Box>
      ) : (
        // ==========================
        // MAIN MODAL VIEW
        // ==========================
        <Box sx={{ p: 2.5, maxHeight: "70vh", overflowY: "auto" }}>
          {/* Header */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {transaction.transactionName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transaction ID: {transaction.transactionId}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="subtitle2">Items: {items.length}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Total ABC: ₱{" "}
                {items.reduce((sum, i) => sum + i.abc, 0).toLocaleString()}
              </Typography>
            </Box>
          </Paper>

          {/* Global Selling Rate */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: "1px solid #e5e7eb",
              backgroundColor: "#fefefe",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Global Pricing Adjustment
            </Typography>
            <TextField
              label="Apply Global Selling Price Rate (%)"
              type="text"
              size="small"
              fullWidth
              value={globalRate}
              onChange={(e) => {
                const value = e.target.value;
                // ✅ Only numbers, 2 digits max
                if (
                  value === "" ||
                  (/^\d{0,2}$/.test(value) && Number(value) <= 99)
                ) {
                  handleGlobalRateChange(value);
                }
              }}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 2,
              }}
              InputProps={{
                endAdornment: (
                  <Typography sx={{ color: "text.secondary" }}>%</Typography>
                ),
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Apply a uniform selling rate to all items.
            </Typography>
          </Paper>

          {/* Items */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Items & Pricing
          </Typography>

          {items.map((item, index) => {
            const purchasePerItem = item.purchasePrice / item.qty;
            const {
              totalSelling,
              grossProfit,
              grossProfitRate,
              balance,
              exceedsABC,
            } = calculateTotals(item);
            const sellingRate = (
              (item.sellingPrice / purchasePerItem - 1) *
              100
            ).toFixed(2);

            return (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  mb: 2.5,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                  backgroundColor: exceedsABC ? "#fff7f7" : "#fff",
                  transition: "0.2s ease",
                  "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    {index + 1}. {item.name} (x{item.qty})
                  </Typography>
                  {exceedsABC && (
                    <Chip
                      label="Exceeds ABC"
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>

                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Purchase Price (per item)
                    </Typography>
                    <Typography sx={{ fontWeight: 500 }}>
                      ₱{" "}
                      {purchasePerItem.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Selling Price (per item)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.sellingPrice}
                      onChange={(e) =>
                        handlePriceChange(item.id, e.target.value)
                      }
                      InputProps={{ startAdornment: <Typography>₱</Typography> }}
                      error={exceedsABC}
                    />
                  </Grid>

                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Selling Price Rate (%)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={Number.isFinite(+sellingRate) ? sellingRate : 0}
                      onChange={(e) =>
                        handleRateChange(item.id, e.target.value)
                      }
                      InputProps={{ endAdornment: <Typography>%</Typography> }}
                      error={exceedsABC}
                    />
                  </Grid>

                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Selling
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: exceedsABC ? "error.main" : "text.primary",
                      }}
                    >
                      ₱ {totalSelling.toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Gross Profit
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      ₱ {grossProfit.toLocaleString()} (
                      {grossProfitRate.toFixed(2)}%)
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Balance
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: exceedsABC ? "error.main" : "success.main",
                      }}
                    >
                      ₱ {balance.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}

          {/* Totals */}
          <Divider sx={{ my: 3 }} />
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Grand Total Selling
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  ₱ {grandTotals.totalSelling.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Grand Gross Profit
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  ₱ {grandTotals.grossProfit.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Total Balance
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  ₱ {grandTotals.balance.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 3,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: 8 }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ borderRadius: 8 }}
              disabled={items.some((item) => calculateTotals(item).exceedsABC)}
              onClick={() => setConfirmFinalize(true)} // 👈 triggers confirmation
            >
              Finalize
            </Button>
          </Box>
        </Box>
      )}
    </ModalContainer>
  );
};

export default PricingModal;
