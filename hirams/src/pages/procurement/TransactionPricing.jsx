import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  Grid,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  Inventory,
  Business,
  ReceiptLong,
  Save,
} from "@mui/icons-material";

import AlertBox from "../../components/common/AlertBox";
import PageLayout from "../../components/common/PageLayout";
import BaseButton from "../../components/common/BaseButton";
import CustomSearchField from "../../components/common/SearchField";
import CustomPagination from "../../components/common/Pagination";
import DotSpinner from "../../components/common/DotSpinner";

import api from "../../utils/api/api";
import {
  calculateItemTax,
  calculateTaxPerUnit,
  calculateProfitAfterTax,
} from "../../utils/formula/calculateTax";
import SetAEModal from "../../components/ui/modals/procurement/SetAEModal";
import DeleteVerificationModal from "../../components/ui/modals/procurement/DeleteVerificationModal";
import CostBreakdownModal from "../../components/ui/modals/procurement/CostBreakdownModal";

function PTransactionPricing() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const transactionFromState = state?.transaction;
  const clientNickName =
    state?.clientNickName || transactionFromState?.clientName;
  /* ---------------- State ---------------- */
  const [transaction, setTransaction] = useState(transactionFromState || null);
  const [loading, setLoading] = useState(false);
  const [setsLoading, setSetsLoading] = useState(false);
  const [pricingSets, setPricingSets] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ---------------- New State for Detail View ---------------- */
  const [selectedSet, setSelectedSet] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unitSellingPrices, setUnitSellingPrices] = useState({}); // Track selling prices by item id
  const [existingPricings, setExistingPricings] = useState({}); // Track existing pricing IDs

  /* ---------------- Modal State ---------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  /* ---------------- Cost Breakdown Modal State ---------------- */
  const [costModalOpen, setCostModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------------- Fetch Transaction ---------------- */
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionFromState && state?.transactionId) {
        setLoading(true);
        try {
          const res = await api.get(
            `transaction/procurement/${state.transactionId}`,
          );
          setTransaction(res.transaction || null);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTransaction();
  }, [transactionFromState, state?.transactionId]);

  /* ---------------- Fetch Pricing Sets ---------------- */
  const fetchPricingSets = async () => {
    if (!transaction?.nTransactionId) return;
    setSetsLoading(true);
    try {
      const res = await api.get(
        `pricing-sets?nTransactionId=${transaction.nTransactionId}`,
      );
      const formatted = (res.data || []).map((s) => ({
        id: s.nPricingSetId,
        name: s.strName,
        chosen: s.bChosen === 1,
        itemCount: s.item_pricings_count || 0,
        raw: s,
      }));
      setPricingSets(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setSetsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingSets();
  }, [transaction]);

  const fetchItemPricings = async (pricingSetId) => {
    try {
      const res = await api.get(`item-pricings?pricing_set_id=${pricingSetId}`);
      const pricings = res.itemPricings || [];

      const pricesMap = {};
      const existingMap = {};

      pricings.forEach((pricing) => {
        pricesMap[pricing.nTransactionItemId] = pricing.dUnitSellingPrice;
        existingMap[pricing.nTransactionItemId] = pricing.nItemPriceId;
      });

      setUnitSellingPrices(pricesMap);
      setExistingPricings(existingMap);
      // REMOVE: setHasChanges(false);
    } catch (err) {
      console.error("Error fetching item pricings:", err);
    }
  };
  /* ---------------- Fetch Transaction Items & Purchase Options (Included Only) ---------------- */
  const fetchTransactionItems = async () => {
    if (!transaction?.nTransactionId) return;

    // Don't set loading here if it's already set by handleRowClick
    // setItemsLoading(true); // REMOVE THIS LINE

    try {
      // Fetch transaction items
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );

      // Initialize items with empty purchaseOptions
      const itemsWithOptions = (res.items || []).map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        qty: item.qty,
        uom: item.uom,
        specs: item.specs,
        abc: item.abc,
        nItemNumber: item.nItemNumber,
        purchaseOptions: [],
        optionsLoaded: false,
        optionsLoading: true,
      }));

      setItems(itemsWithOptions);

      // Fetch purchase options for all items (only included ones)
      await Promise.all(
        itemsWithOptions.map(async (item) => {
          const resOptions = await api.get(
            `transaction-items/${item.id}/purchase-options`,
          );

          // Filter only included options (bIncluded === 1 or true)
          const includedOptions = (resOptions.purchaseOptions || []).filter(
            (opt) => opt.bIncluded === 1 || opt.bIncluded === true,
          );

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    purchaseOptions: includedOptions.map((opt) => ({
                      id: opt.id,
                      nPurchaseOptionId: opt.nPurchaseOptionId,
                      nSupplierId: opt.nSupplierId,
                      supplierName: opt.supplierName || opt.strSupplierName,
                      supplierNickName:
                        opt.supplierNickName || opt.strSupplierNickName,
                      nQuantity: opt.nQuantity,
                      strUOM: opt.strUOM,
                      strBrand: opt.strBrand,
                      strModel: opt.strModel,
                      dUnitPrice: opt.dUnitPrice,
                      strSpecs: opt.strSpecs,
                      dEWT: opt.dEWT,
                      bIncluded: opt.bIncluded,
                      bAddOn: opt.bAddOn,
                    })),
                    optionsLoaded: true,
                    optionsLoading: false,
                  }
                : it,
            ),
          );
        }),
      );
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    } finally {
      setItemsLoading(false);
    }
  };

  /* ---------------- Filtering & Pagination ---------------- */
  const filtered = pricingSets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const paged = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  /* ---------------- Actions ---------------- */
  const handleChoose = async (row, event) => {
    event.stopPropagation();

    // Toggle the chosen state optimistically
    const newChosenState = !row.chosen;

    setPricingSets((prev) =>
      prev.map((s) => ({
        ...s,
        chosen: s.id === row.id ? newChosenState : false,
      })),
    );

    try {
      await api.patch(`pricing-sets/${row.id}/choose`);
      fetchPricingSets();
    } catch (err) {
      console.error(err);
      fetchPricingSets();
    }
  };
  const handleDelete = (row, event) => {
    event.stopPropagation();
    setDeleteTarget({ type: "pricing-set", data: row });
    setDeleteModalOpen(true);
  };

  const handleEdit = (row, event) => {
    event.stopPropagation();
    setModalData(row);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    fetchPricingSets();
    setDeleteTarget(null);
    setDeleteModalOpen(false);
  };

  /* ---------------- Row Click Handler ---------------- */
  const handleRowClick = async (row) => {
    if (selectedSet?.id === row.id) {
      setSelectedSet(null);
      setItems([]);
      setUnitSellingPrices({});
      setExistingPricings({});
    } else {
      setSelectedSet(row);
      setUnitSellingPrices({});
      setExistingPricings({});

      // Set loading state
      setItemsLoading(true);

      // Fetch both items and prices
      await Promise.all([fetchTransactionItems(), fetchItemPricings(row.id)]);

      // Loading will be set to false by fetchTransactionItems
    }
  };
  const handleUnitSellingPriceChange = async (itemId, value) => {
    // Only allow valid numbers
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Update state immediately for responsive UI
    setUnitSellingPrices((prev) => ({
      ...prev,
      [itemId]: numericValue,
    }));

    // Debounce the API call (wait for user to stop typing)
    if (window.pricingTimeout) {
      clearTimeout(window.pricingTimeout);
    }

    window.pricingTimeout = setTimeout(async () => {
      if (!numericValue || !selectedSet) return;

      try {
        const price = parseFloat(numericValue);
        if (isNaN(price)) return;

        const existingId = existingPricings[itemId];

        if (existingId) {
          // Update existing pricing
          await api.put(`item-pricings/${existingId}`, {
            dUnitSellingPrice: price,
          });
        } else {
          // Create new pricing
          const res = await api.post("item-pricings", {
            nPricingSetId: selectedSet.id,
            nTransactionItemId: itemId,
            dUnitSellingPrice: price,
          });

          // Update existingPricings map with new ID
          setExistingPricings((prev) => ({
            ...prev,
            [itemId]: res.itemPricing.nItemPriceId,
          }));
        }
      } catch (err) {
        console.error("Error saving item pricing:", err);
      }
    }, 800); // Wait 800ms after user stops typing
  };
  /* ---------------- Computed Values ---------------- */
  /* ---------------- Computed Values ---------------- */
  const transactionHasABC =
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;

  // Check if all items have selling prices (non-zero and non-empty)
  const allItemsHavePrices =
    items.length > 0 &&
    items.every((item) => {
      const price = unitSellingPrices[item.id];
      return price && Number(price) > 0;
    });
  /* ---------------- UI ---------------- */
  return (
    <PageLayout
      title="Transaction Pricing"
      subtitle={`/ ${transaction?.strCode || transaction?.transactionId || ""}${selectedSet ? ` / ${selectedSet.name}` : ""}`}
      loading={loading}
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => {
              if (selectedSet) {
                setSelectedSet(null);
                setItems([]);
                setUnitSellingPrices({});
                setExistingPricings({});
              } else {
                navigate(-1);
              }
            }}
          />
          {selectedSet && (
            <BaseButton
              label="Cost Breakdown"
              icon={<ReceiptLong />}
              tooltip={
                allItemsHavePrices
                  ? ""
                  : "Please fill in all selling prices first"
              }
              variant="contained"
              color="primary"
              onClick={() => setCostModalOpen(true)}
              disabled={!allItemsHavePrices}
            />
          )}
        </Box>
      }
    >
      {!selectedSet ? (
        /* ---------------- LIST VIEW ---------------- */
        <>
          {/* Top Bar */}
          <section className="flex items-center gap-2 mb-3">
            <div className="flex-grow">
              <CustomSearchField
                label="Search Pricing Set"
                value={search}
                onChange={setSearch}
              />
            </div>

            <BaseButton
              label="Set"
              icon={<Add />}
              variant="contained"
              color="primary"
              onClick={() => {
                setModalData(null);
                setModalOpen(true);
              }}
            />
          </section>

          {/* Table */}
          <section className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Header */}
            <Box
              sx={{
                px: 1.2,
                py: 0.8,
                display: "flex",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#666",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <Box sx={{ width: 36 }} />
              <Box sx={{ flex: 3 }}>Pricing Set</Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>Action</Box>
            </Box>

            {setsLoading && (
              <Box
                sx={{
                  py: 2,
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <DotSpinner size={9} />
              </Box>
            )}

            {!setsLoading && paged.length === 0 && (
              <Typography sx={{ p: 2 }}>No data found.</Typography>
            )}

            {!setsLoading &&
              paged.map((row) => (
                <Paper
                  key={row.id}
                  elevation={0}
                  sx={{
                    px: 1.2,
                    py: 0.7,
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
                  }}
                  onClick={() => handleRowClick(row)}
                >
                  <Box sx={{ width: 36 }}>
                    <Checkbox
                      checked={row.chosen}
                      onChange={(e) => handleChoose(row, e)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ p: 0.5, color: "text.secondary" }}
                    />
                  </Box>
                  <Box sx={{ flex: 3 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                      {row.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      gap: 0.5,
                    }}
                  >
                    <BaseButton
                      icon={<Edit />}
                      tooltip="Edit Pricing Set"
                      size="small"
                      onClick={(e) => handleEdit(row, e)}
                      disabled={row.chosen}
                    />
                    <BaseButton
                      icon={<Delete sx={{ fontSize: "0.9rem" }} />}
                      tooltip="Delete Pricing Set"
                      size="small"
                      color="error"
                      onClick={(e) => handleDelete(row, e)}
                      disabled={row.chosen}
                    />
                  </Box>
                </Paper>
              ))}

            {/* Pagination */}
            <CustomPagination
              count={filtered.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(val) => {
                setRowsPerPage(val);
                setPage(0);
              }}
            />
          </section>
        </>
      ) : (
        /* ---------------- DETAIL VIEW ---------------- */
        <>
          {/* Transaction Info Header */}
          <Box sx={{ mb: 2 }}>
            <AlertBox>
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: "600px" }}>
                  <Grid container spacing={2} alignItems="center">
                    {/* LEFT SIDE - Set Name */}
                    <Grid item xs={3}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            backgroundColor: "#1976d2",
                            borderRadius: "8px",
                            p: 0.8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Inventory
                            sx={{ color: "white", fontSize: "1.2rem" }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "0.65rem",
                              color: "#666",
                              fontWeight: 500,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Pricing Set
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              fontSize: {
                                xs: "0.9rem",
                                sm: "1rem",
                                md: "1.1rem",
                              },
                              lineHeight: 1.2,
                              textAlign: "left ",
                            }}
                          >
                            {selectedSet.name}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* DIVIDER */}
                    <Grid item xs="auto">
                      <Box
                        sx={{
                          width: "2px",
                          height: "50px",
                          backgroundColor: "#e0e0e0",
                          mx: 1,
                        }}
                      />
                    </Grid>

                    {/* RIGHT SIDE - Transaction Details */}
                    <Grid item xs>
                      <Box
                        sx={{
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.75rem",
                            md: "0.8rem",
                          },
                        }}
                      >
                        {/* First Row - Client and Title */}
                        <Box
                          sx={{
                            mb: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Business sx={{ fontSize: "1rem", color: "#666" }} />
                          <Typography
                            component="span"
                            sx={{ fontWeight: 600, fontSize: "inherit" }}
                          >
                            {transaction?.client?.strClientNickName ||
                              transaction?.clientName ||
                              "—"}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontSize: "inherit", mx: 0.5 }}
                          >
                            :
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontStyle: "italic",
                              fontSize: "inherit",
                              color: "#555",
                            }}
                          >
                            {transaction?.strTitle ||
                              transaction?.transactionName ||
                              "—"}
                          </Typography>
                        </Box>

                        {/* Second Row - ABC and Doc Sub */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: { xs: 2, sm: 3, md: 4 },
                            flexWrap: "nowrap",
                            fontSize: "inherit",
                          }}
                        >
                          {/* ABC */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{ fontWeight: 600, fontSize: "inherit" }}
                            >
                              ABC:
                            </Typography>
                            <Typography
                              component="span"
                              sx={{
                                fontStyle: "italic",
                                fontSize: "inherit",
                                color: "#1976d2",
                                fontWeight: 500,
                              }}
                            >
                              {transaction?.dTotalABC
                                ? `₱ ${Number(
                                    transaction.dTotalABC,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : "—"}
                            </Typography>
                          </Box>
                          {/* Doc Sub */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{ fontWeight: 600, fontSize: "inherit" }}
                            >
                              Doc Sub:
                            </Typography>
                            <Typography
                              component="span"
                              sx={{
                                fontStyle: "italic",
                                fontSize: "inherit",
                                color: "#555",
                              }}
                            >
                              {transaction?.dtDocSubmission
                                ? new Date(
                                    transaction.dtDocSubmission,
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : "—"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </AlertBox>
          </Box>
          {/* Items Section */}
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
              }}
            >
              Transaction Items
            </Typography>
          </Box>

          {/* Items List */}
          <Box sx={{ width: "100%", mt: 1 }}>
            <Box sx={{ overflowX: "auto", pb: 1 }}>
              <Box sx={{ minWidth: "650px" }}>
                {/* Header */}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    background: "#f1f1f1",
                    fontWeight: "bold",
                    borderRadius: 1.5,
                  }}
                >
                  <Grid
                    container
                    alignItems="center"
                    sx={{
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                    }}
                  >
                    <Grid item xs={2.5} sx={{ textAlign: "center", pl: 1 }}>
                      Description
                    </Grid>
                    <Grid item xs={1}>
                      Qty
                    </Grid>
                    <Grid item xs={1}>
                      Capital
                    </Grid>
                    <Grid item xs={0.5}></Grid>
                    <Grid item xs={1.5}>
                      Unit Price
                    </Grid>
                    <Grid item xs={1.5}>
                      Total Price
                    </Grid>
                    <Grid item xs={1}>
                      ABC
                    </Grid>
                    <Grid item xs={1}>
                      Difference
                    </Grid>
                    <Grid item xs={1}>
                      Profit
                    </Grid>
                    <Grid item xs={1}>
                      Tax
                    </Grid>
                  </Grid>
                </Paper>

                {/* Loading State */}
                {itemsLoading && (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <DotSpinner size={9} />
                  </Box>
                )}

                {/* Empty State */}
                {!itemsLoading && items.length === 0 && (
                  <Box
                    sx={{
                      height: 100,
                      border: "1px dashed #bbb",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                      mt: 1,
                    }}
                  >
                    <Typography>No items available.</Typography>
                  </Box>
                )}

                {/* Items */}
                {!itemsLoading &&
                  items.map((item) => {
                    const includedTotal = item.purchaseOptions
                      .filter((opt) => opt.bIncluded)
                      .reduce(
                        (sum, opt) =>
                          sum +
                          Number(opt.nQuantity || 0) *
                            Number(opt.dUnitPrice || 0),
                        0,
                      );

                    const getEffectiveABC = (item) => {
                      const itemABC = Number(item.abc || 0);

                      // If item ABC is explicitly 0, keep it as 0 (don't distribute)
                      if (itemABC === 0) {
                        return 0;
                      }

                      // If transaction has ABC and item ABC is not set, distribute proportionally
                      if (transactionHasABC && !item.abc) {
                        const totalItemQty = items.reduce(
                          (sum, i) => sum + Number(i.qty || 0),
                          0,
                        );
                        const itemQty = Number(item.qty || 0);
                        const transABC = Number(transaction.dTotalABC || 0);

                        return totalItemQty > 0
                          ? (itemQty / totalItemQty) * transABC
                          : 0;
                      }

                      return itemABC;
                    };

                    const effectiveABC = getEffectiveABC(item);
                    const hasABC = effectiveABC > 0;
                    // Calculate Capital: Canvas (includedTotal) / quantity
                    const capital =
                      Number(item.qty || 0) > 0
                        ? includedTotal / Number(item.qty || 0)
                        : 0;

                    // Get unit selling price (from state or default to 0)
                    const unitSellingPrice = Number(
                      unitSellingPrices[item.id] || 0,
                    );

                    // Calculate Total Selling Price: Unit Selling Price * Quantity
                    const totalSellingPrice =
                      unitSellingPrice * Number(item.qty || 0);

                    // Calculate Difference: ABC - Total Selling Price
                    // If no ABC, treat as 0 - Total Selling Price (which results in negative total selling price)
                    const difference = effectiveABC - totalSellingPrice;

                    // Calculate Tax using utility function
                    const tax = calculateItemTax(
                      unitSellingPrice,
                      item.qty,
                      includedTotal,
                    );

                    // Calculate Profit after Tax using utility function
                    const profit = calculateProfitAfterTax(
                      unitSellingPrice,
                      capital,
                      item.qty,
                      includedTotal,
                    );
                    return (
                      <Box key={item.id} sx={{ mt: 1 }}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: "#ffffff",
                            borderLeft: "4px solid #1565c0",
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                          }}
                        >
                          <Grid
                            container
                            alignItems="center"
                            sx={{ textAlign: "center" }}
                          >
                            {/* Description */}
                            <Grid
                              item
                              xs={2.5}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "left",
                                textAlign: "left",
                                pl: 1,
                                overflow: "hidden",
                              }}
                            >
                              <Typography
                                fontWeight="500"
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  width: "100%",
                                }}
                              >
                                {item.nItemNumber}. {item.name || "—"}
                              </Typography>
                            </Grid>

                            {/* Qty */}
                            <Grid item xs={1}>
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.qty}
                                <br />
                                <span
                                  style={{
                                    fontSize: "0.55rem",
                                    color: "#666",
                                  }}
                                >
                                  {item.uom}
                                </span>
                              </Typography>
                            </Grid>

                            {/* Capital */}
                            <Grid
                              item
                              xs={1}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ₱{" "}
                                {Number(capital).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>

                            {/* Empty spacer */}
                            <Grid
                              item
                              xs={0.5}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: ".65rem",
                                  lineHeight: 1.2,
                                }}
                              ></Typography>
                            </Grid>

                            {/* Unit Selling Price - EDITABLE (read-only when chosen) */}
                            <Grid
                              item
                              xs={1.5}
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <TextField
                                size="small"
                                value={unitSellingPrices[item.id] || ""}
                                onChange={(e) =>
                                  handleUnitSellingPriceChange(
                                    item.id,
                                    e.target.value,
                                  )
                                }
                                disabled={selectedSet?.chosen}
                                placeholder="0.00"
                                sx={{
                                  "& .MuiInputBase-root": {
                                    fontSize: {
                                      xs: ".55rem",
                                      sm: ".6rem",
                                      md: ".65rem",
                                    },
                                    height: "26px",
                                    backgroundColor: selectedSet?.chosen
                                      ? "#f5f5f5"
                                      : "white",
                                  },
                                  "& .MuiInputBase-input": {
                                    padding: "3px 6px",
                                    textAlign: "right",
                                  },
                                  "& .Mui-disabled": {
                                    WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
                                  },
                                  width: "95%",
                                }}
                                InputProps={{
                                  startAdornment: (
                                    <span
                                      style={{
                                        fontSize: "0.6rem",
                                        marginRight: "2px",
                                      }}
                                    >
                                      ₱
                                    </span>
                                  ),
                                }}
                              />
                            </Grid>

                            {/* Total Selling Price */}
                            <Grid
                              item
                              xs={1.5}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ₱{" "}
                                {Number(totalSellingPrice).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </Typography>
                            </Grid>
                            {/* ABC */}
                            <Grid
                              item
                              xs={1}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {hasABC ? (
                                  <>
                                    ₱{" "}
                                    {Number(effectiveABC).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </>
                                ) : (
                                  "—"
                                )}
                              </Typography>
                            </Grid>
                            {/* Difference */}
                            <Grid
                              item
                              xs={1}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                  color:
                                    difference < 0
                                      ? "#d32f2f"
                                      : difference > 0
                                        ? "#2e7d32"
                                        : "inherit",
                                  fontWeight: difference !== 0 ? 600 : 400,
                                }}
                              >
                                ₱{" "}
                                {Number(difference).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                            {/* Profit */}
                            <Grid
                              item
                              xs={1}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                  color:
                                    profit < 0
                                      ? "#d32f2f"
                                      : profit > 0
                                        ? "#2e7d32"
                                        : "inherit",
                                  fontWeight: profit !== 0 ? 600 : 400,
                                }}
                              >
                                ₱{" "}
                                {Number(profit).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                            {/* Tax */}
                            <Grid
                              item
                              xs={1}
                              sx={{ textAlign: "right", pr: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: ".55rem",
                                    sm: ".6rem",
                                    md: ".65rem",
                                  },
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ₱{" "}
                                {Number(tax).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Box>
                    );
                  })}

                {/* Summary Row */}
                {!itemsLoading && items.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        background: "#98FF98",
                        borderLeft: "4px solid #50C878",
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                      }}
                    >
                      <Grid
                        container
                        alignItems="center"
                        sx={{ textAlign: "center" }}
                      >
                        {/* Description - "TOTAL" label */}
                        <Grid
                          item
                          xs={2.5}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "left",
                            textAlign: "left",
                            pl: 1,
                          }}
                        >
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".6rem",
                                sm: ".65rem",
                                md: ".7rem",
                              },
                              lineHeight: 1.2,
                              textTransform: "uppercase",
                              color: "#2e7d32",
                            }}
                          >
                            TOTAL
                          </Typography>
                        </Grid>

                        {/* Qty - Empty */}
                        <Grid item xs={1}></Grid>

                        {/* Total Capital (Capital * Qty for each item) */}
                        <Grid item xs={1} sx={{ textAlign: "right", pr: 1 }}>
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".55rem",
                                sm: ".6rem",
                                md: ".65rem",
                              },
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₱{" "}
                            {items
                              .reduce((sum, item) => {
                                const includedTotal = item.purchaseOptions
                                  .filter((opt) => opt.bIncluded)
                                  .reduce(
                                    (optSum, opt) =>
                                      optSum +
                                      Number(opt.nQuantity || 0) *
                                        Number(opt.dUnitPrice || 0),
                                    0,
                                  );
                                return sum + includedTotal;
                              }, 0)
                              .toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                          </Typography>
                        </Grid>

                        {/* Empty spacer */}
                        <Grid item xs={0.5}></Grid>

                        {/* Unit Price - Empty */}
                        <Grid item xs={1.5}></Grid>

                        {/* Total Selling Price */}
                        <Grid item xs={1.5} sx={{ textAlign: "right", pr: 1 }}>
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".55rem",
                                sm: ".6rem",
                                md: ".65rem",
                              },
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₱{" "}
                            {items
                              .reduce((sum, item) => {
                                const unitSellingPrice = Number(
                                  unitSellingPrices[item.id] || 0,
                                );
                                const totalSellingPrice =
                                  unitSellingPrice * Number(item.qty || 0);
                                return sum + totalSellingPrice;
                              }, 0)
                              .toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                          </Typography>
                        </Grid>

                        {/* Total ABC */}
                        <Grid item xs={1} sx={{ textAlign: "right", pr: 1 }}>
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".55rem",
                                sm: ".6rem",
                                md: ".65rem",
                              },
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(() => {
                              const totalABC = items.reduce((sum, item) => {
                                const getEffectiveABC = (item) => {
                                  const itemABC = Number(item.abc || 0);
                                  if (itemABC === 0) return 0;
                                  if (transactionHasABC && !item.abc) {
                                    const totalItemQty = items.reduce(
                                      (s, i) => s + Number(i.qty || 0),
                                      0,
                                    );
                                    const itemQty = Number(item.qty || 0);
                                    const transABC = Number(
                                      transaction.dTotalABC || 0,
                                    );
                                    return totalItemQty > 0
                                      ? (itemQty / totalItemQty) * transABC
                                      : 0;
                                  }
                                  return itemABC;
                                };
                                return sum + getEffectiveABC(item);
                              }, 0);

                              return totalABC > 0
                                ? `₱ ${totalABC.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : "—";
                            })()}
                          </Typography>
                        </Grid>

                        {/* Total Difference */}
                        <Grid item xs={1} sx={{ textAlign: "right", pr: 1 }}>
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".55rem",
                                sm: ".6rem",
                                md: ".65rem",
                              },
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(() => {
                              const totalDiff = items.reduce((sum, item) => {
                                const getEffectiveABC = (item) => {
                                  const itemABC = Number(item.abc || 0);
                                  if (itemABC === 0) return 0;
                                  if (transactionHasABC && !item.abc) {
                                    const totalItemQty = items.reduce(
                                      (s, i) => s + Number(i.qty || 0),
                                      0,
                                    );
                                    const itemQty = Number(item.qty || 0);
                                    const transABC = Number(
                                      transaction.dTotalABC || 0,
                                    );
                                    return totalItemQty > 0
                                      ? (itemQty / totalItemQty) * transABC
                                      : 0;
                                  }
                                  return itemABC;
                                };

                                const effectiveABC = getEffectiveABC(item);
                                const unitSellingPrice = Number(
                                  unitSellingPrices[item.id] || 0,
                                );
                                const totalSellingPrice =
                                  unitSellingPrice * Number(item.qty || 0);

                                return sum + (effectiveABC - totalSellingPrice);
                              }, 0);

                              return (
                                <span
                                  style={{
                                    color:
                                      totalDiff < 0
                                        ? "#d32f2f"
                                        : totalDiff > 0
                                          ? "#2e7d32"
                                          : "inherit",
                                  }}
                                >
                                  ₱{" "}
                                  {totalDiff.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              );
                            })()}
                          </Typography>
                        </Grid>
                        {/* Total Profit */}
                        <Grid item xs={1} sx={{ textAlign: "right", pr: 1 }}>
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".55rem",
                                sm: ".6rem",
                                md: ".65rem",
                              },
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(() => {
                              const totalProfit = items.reduce((sum, item) => {
                                const includedTotal = item.purchaseOptions
                                  .filter((opt) => opt.bIncluded)
                                  .reduce(
                                    (optSum, opt) =>
                                      optSum +
                                      Number(opt.nQuantity || 0) *
                                        Number(opt.dUnitPrice || 0),
                                    0,
                                  );
                                const capital =
                                  Number(item.qty || 0) > 0
                                    ? includedTotal / Number(item.qty || 0)
                                    : 0;
                                const unitSellingPrice = Number(
                                  unitSellingPrices[item.id] || 0,
                                );

                                const profitAfterTax = calculateProfitAfterTax(
                                  unitSellingPrice,
                                  capital,
                                  item.qty,
                                  includedTotal,
                                );

                                return (
                                  sum + profitAfterTax * Number(item.qty || 0)
                                );
                              }, 0);

                              return (
                                <span
                                  style={{
                                    color:
                                      totalProfit < 0
                                        ? "#d32f2f"
                                        : totalProfit > 0
                                          ? "#2e7d32"
                                          : "inherit",
                                  }}
                                >
                                  ₱{" "}
                                  {totalProfit.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              );
                            })()}
                          </Typography>
                        </Grid>
                        {/* Total Tax */}
                        <Grid item xs={1} sx={{ textAlign: "right", pr: 1 }}>
                          <Typography
                            fontWeight="700"
                            sx={{
                              fontSize: {
                                xs: ".55rem",
                                sm: ".6rem",
                                md: ".65rem",
                              },
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₱{" "}
                            {(() => {
                              const totalTax = items.reduce((sum, item) => {
                                const includedTotal = item.purchaseOptions
                                  .filter((opt) => opt.bIncluded)
                                  .reduce(
                                    (optSum, opt) =>
                                      optSum +
                                      Number(opt.nQuantity || 0) *
                                        Number(opt.dUnitPrice || 0),
                                    0,
                                  );
                                const unitSellingPrice = Number(
                                  unitSellingPrices[item.id] || 0,
                                );
                                const totalSellingPrice =
                                  unitSellingPrice * Number(item.qty || 0);
                                const tax =
                                  ((totalSellingPrice - includedTotal) / 1.12) *
                                  (0.12 + 0.3);
                                return sum + tax;
                              }, 0);
                              return totalTax.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                            })()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Add/Edit Modal */}
      <SetAEModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={modalData}
        onSaved={fetchPricingSets}
        transactionId={transaction?.nTransactionId}
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

      {/* Delete Verification Modal */}
      <DeleteVerificationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        entityToDelete={deleteTarget}
        onSuccess={confirmDelete}
      />
    </PageLayout>
  );
}

export default PTransactionPricing;
