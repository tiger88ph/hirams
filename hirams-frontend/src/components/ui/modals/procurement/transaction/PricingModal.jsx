import React, { useState, useEffect } from "react";
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
import api from "../../../../../utils/api/api";

const PricingModal = ({ open, onClose, transactionId }) => {
  const [transactionData, setTransactionData] = useState(null); // store entire transaction
  const [items, setItems] = useState([]); // store only items
  const [globalRate, setGlobalRate] = useState("");
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transactionId || !open) return;

    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const response = await api.get(`transactions/${transactionId}/pricing`);

        console.log("Full Response:", response); // This is your actual data
        console.log("Transaction:", response.transaction); // Correct path

        // Set state correctly
        setTransactionData(response.transaction || null);
        setItems(response.transaction?.items || []);
      } catch (error) {
        console.error("Error fetching transaction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, open]);

  // ====== Calculations ======
  const calculateTotals = (item) => {
    const purchasePerItem = item.purchasePrice;
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
        const purchasePerItem = item.purchasePrice;
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
        const purchasePerItem = item.purchasePrice;
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
    try {
      // Example finalize API (update backend)
      await api.post(`/transactions/${transactionId}/finalize`, { items });
      alert("✅ Transaction finalized successfully!");
      onClose();
    } catch (error) {
      console.error("❌ Error finalizing transaction:", error);
    } finally {
      setLoading(false);
    }
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
  if (loading)
    return (
      <ModalContainer
        open={open}
        handleClose={onClose}
        title="Transaction Pricing"
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading transaction data...</Typography>
        </Box>
      </ModalContainer>
    );

  if (!transactionData)
    return (
      <ModalContainer
        open={open}
        handleClose={onClose}
        title="Transaction Pricing"
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography>No transaction data found.</Typography>
        </Box>
      </ModalContainer>
    );

  // ==============================
  // ======= UI Starts Here =======
  // ==============================
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Pricing"
      width={800}
      showSave={false}
    >
      {confirmFinalize ? (
        <Box sx={{ textAlign: "center", py: 3, px: 2 }}>
          <CheckCircleRoundedIcon
            color="success"
            sx={{ fontSize: 48, mb: 1 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Finalize Transaction?
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            You are about to <strong>finalize</strong> the transaction{" "}
            <span style={{ fontWeight: 600, color: "#4f46e5" }}>
              {transactionData.transactionName}
            </span>{" "}
            ({transactionData.transactionId}). Once finalized, further edits may
            be restricted.
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
                {transactionData.transactionName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transaction ID: {transactionData.transactionId}
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

          {/* Global Pricing Adjustment */}
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

          {/* Items Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Items & Pricing
          </Typography>

          {items.map((item, index) => {
            const purchasePerItem = item.purchasePrice;
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

                <Grid container spacing={1.5}>
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
                      InputProps={{
                        startAdornment: <Typography>₱</Typography>,
                      }}
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

                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      ABC (per item)
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      ₱ {item.abc.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}

          {/* Summary */}
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
              onClick={() => setConfirmFinalize(true)}
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
