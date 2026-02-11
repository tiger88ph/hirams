import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import api from "../../utils/api/api";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Paper,
  Checkbox,
  Alert, // ✅ ADD THIS
} from "@mui/material";

import TransactionDetails from "../../components/common/TransactionDetails";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AssignAOModal from "../../components/ui/modals/admin/transaction/AssignAOModal";
import MTransactionActionModal from "../../components/ui/modals/admin/transaction/TransactionActionModal";
import AlertBox from "../../components/common/AlertBox";
import FormGrid from "../../components/common/FormGrid";
import BaseButton from "../../components/common/BaseButton";
import CompareView from "../account-officer/CompareView";
import PurchaseOptionRow from "../account-officer/PurchaseOptionRow";
import {
  ExpandLess,
  ExpandMore,
  CompareArrows,
  ArrowBack,
  Replay,
  CheckCircle,
  AssignmentInd,
} from "@mui/icons-material";

function MTransactionCanvas() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    transactionId,
    transactionCode,
    selectedStatusCode,
    transaction,
    nUserId,
    transacstatus,
    itemType,
    userTypes,
    statusTransaction,
    procMode,
    procSource,
    draftKey,
    finalizeKey,
    forAssignmentKey,
    forCanvasKey,
    canvasVerificationKey,
    itemsManagementKey,
    itemsVerificationKey,
    forPricingKey,
    priceVerificationKey,
  } = state || {};

  const [actionModal, setActionModal] = useState(null);
  const [items, setItems] = useState([]);
  const [assignMode, setAssignMode] = useState(null);
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [isCompareActive, setIsCompareActive] = useState(false);
  const [optionErrors, setOptionErrors] = useState({});
  const errorTimeoutsRef = React.useRef({});
  const [itemsLoading, setItemsLoading] = useState(true);

  const hasAssignedAO = Number(transaction?.nAssignedAO) > 0;
  const statusCode = String(transaction.current_status);
  const status_code = selectedStatusCode;
  const limitedContent =
    draftKey.includes(status_code) ||
    finalizeKey.includes(status_code) ||
    (forAssignmentKey.includes(status_code) && !hasAssignedAO) ||
    forPricingKey.includes(status_code);
  const isManagement = true;
  const showPurchaseOptions =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);

  const checkboxOptionsEnabled =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);

  const coloredItemRowEnabled =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const transactionHasABC =
    transaction?.dTotalABC && Number(transaction.dTotalABC) > 0;

  const totalItemsABC = items.reduce(
    (sum, item) => sum + Number(item.abc || 0),
    0,
  );

  const isABCValid = transactionHasABC
    ? true // Always valid when transaction has ABC
    : items.every((item) => item.abc && Number(item.abc) > 0);

  const abcValidationMessage = transactionHasABC
    ? null // No validation message when transaction has ABC
    : items.some((item) => !item.abc || Number(item.abc) === 0)
      ? "All items must have ABC values when transaction has no ABC"
      : null;
  const showRevert = !draftKey.includes(statusCode);

  const showVerify =
    finalizeKey.includes(status_code) ||
    itemsVerificationKey.includes(status_code) ||
    (canvasVerificationKey.includes(statusCode) && !isCompareActive) ||
    (priceVerificationKey.includes(statusCode) && !isCompareActive) ||
    priceVerificationKey.includes(status_code);

  const showForAssignment = forAssignmentKey.includes(status_code);
  const forVerificationKey = forCanvasKey || "";
  const canvasVerificationLabel = transacstatus[canvasVerificationKey] || "";
  const forCanvasLabel = transacstatus[forVerificationKey] || "";
  const procSourceLabel =
    procSource?.[transaction?.cProcSource] || transaction?.cProcSource;

  const [expandedRows, setExpandedRows] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});

  const handleAfterAction = (newStatusCode) => {
    setActionModal(null);

    if (newStatusCode) {
      sessionStorage.setItem("selectedStatusCode", newStatusCode);
    }

    navigate(-1);
  };

  const handleVerifyClick = () => setActionModal("verified");
  const handleRevertClick = () => setActionModal("reverted");

  // ✅ UPDATED: Fetch items AND their options upfront
  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;

    setItemsLoading(true);
    try {
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );

      // Initialize items with empty purchaseOptions
      const itemsWithOptions = (res.items || []).map((item) => ({
        ...item,
        purchaseOptions: [],
        optionsLoaded: false,
        optionsLoading: true, // will be fetching options
      }));

      setItems(itemsWithOptions);

      // Fetch purchase options for all items in parallel
      await Promise.all(
        itemsWithOptions.map(async (item) => {
          const resOptions = await api.get(
            `transaction-items/${item.id}/purchase-options`,
          );

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    purchaseOptions: resOptions.purchaseOptions || [],
                    optionsLoaded: true,
                    optionsLoading: false,
                  }
                : it,
            ),
          );
        }),
      );
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [transaction]);

  useEffect(() => {
    const fetchAOs = async () => {
      try {
        const res = await api.get("users");
        const users = res.users || [];

        // Get the first and sixth keys from userTypes
        const keys = Object.keys(userTypes);
        const activeKeys = [keys[0], keys[5]]; // adjust if keys[5] might be undefined

        setAccountOfficers(
          users
            .filter(
              (u) =>
                activeKeys.includes(u.cUserType) &&
                activeKeys.includes(u.cStatus),
            )
            .map((u) => ({
              label: `${u.strFName} ${u.strLName}`,
              value: u.nUserId,
            })),
        );
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAOs();
  }, [userTypes]);

  const handleCompareClick = (item, selectedOption) => {
    setCompareData({
      itemId: item.id,
      itemName: item.name,
      quantity: item.qty,
      specs: item.specs,
      uom: item.uom,
      abc: item.abc,
      purchaseOptions: [
        {
          nPurchaseOptionId: selectedOption.id,
          supplierId: selectedOption.nSupplierId,
          supplierName:
            selectedOption.supplierName || selectedOption.strSupplierName,
          supplierNickName:
            selectedOption.supplierNickName ||
            selectedOption.strSupplierNickName,
          quantity: selectedOption.nQuantity,
          uom: selectedOption.strUOM,
          brand: selectedOption.strBrand,
          model: selectedOption.strModel,
          unitPrice: selectedOption.dUnitPrice,
          specs: selectedOption.strSpecs,
          ewt: selectedOption.dEWT,
          included: !!selectedOption.bIncluded,
        },
      ],
    });
    setIsCompareActive(true);
  };

  const toggleSpecsRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: {
        specs: !prev[id]?.specs,
        options: prev[id]?.options || false,
      },
    }));
  };

  const toggleOptionsRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: {
        specs: prev[id]?.specs || false,
        options: !prev[id]?.options,
      },
    }));
  };

  const toggleOptionSpecs = (optionId) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const totalCanvas = items.reduce((sum, item) => {
    const includedTotal = item.purchaseOptions
      .filter((opt) => opt.bIncluded)
      .reduce(
        (sub, opt) =>
          sub + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
        0,
      );
    return sum + includedTotal;
  }, 0);
  // Add this near the other computed values (around line 300-350)

  const totalIncludedQty = items.reduce((sum, item) => {
    const includedQty = item.purchaseOptions
      .filter((opt) => opt.bIncluded && Number(opt.bAddOn) !== 1)
      .reduce((sub, opt) => sub + Number(opt.nQuantity || 0), 0);
    return sum + includedQty;
  }, 0);

  const totalItemQty = items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );

  // Check if canvas exceeds ABC at transaction or item level
  const canvasABCValidation = () => {
    if (transactionHasABC) {
      // Transaction has ABC: check if total canvas exceeds transaction ABC
      return {
        isValid: totalCanvas <= Number(transaction.dTotalABC || 0),
        message:
          totalCanvas > Number(transaction.dTotalABC || 0)
            ? `Total Canvas (₱${totalCanvas.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) exceeds Transaction ABC (₱${Number(transaction.dTotalABC).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Please adjust the included purchase options.`
            : null,
      };
    } else {
      // No transaction ABC: check each item's canvas against its ABC
      const itemsOverABC = items.filter((item) => {
        const includedTotal = item.purchaseOptions
          .filter((opt) => opt.bIncluded)
          .reduce(
            (sum, opt) =>
              sum + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
            0,
          );
        return includedTotal > Number(item.abc || 0);
      });

      if (itemsOverABC.length > 0) {
        const itemNames = itemsOverABC
          .map((item) => `"${item.name}"`)
          .join(", ");
        return {
          isValid: false,
          message: `The following item(s) have canvas totals exceeding their ABC: ${itemNames}. Please adjust the included purchase options.`,
        };
      }

      return { isValid: true, message: null };
    }
  };

  const abcValidationResult = canvasABCValidation();
  const isCanvasOverABC = !abcValidationResult.isValid;
  const handleCollapseAllToggle = () => {
    const isAnythingExpanded = Object.values(expandedRows).some(
      (row) => row?.specs || row?.options,
    );

    if (isAnythingExpanded) {
      setExpandedRows({});
    } else {
      const allExpanded = items.reduce((acc, item) => {
        acc[item.id] = {
          specs: true,
          options: showPurchaseOptions ? true : false,
        };
        return acc;
      }, {});
      setExpandedRows(allExpanded);
    }
  };

  const updateSpecs = async (nPurchaseOptionId, newSpecs) => {
    try {
      const response = await api.put(
        `purchase-options/${nPurchaseOptionId}/update-specs`,
        { specs: newSpecs ?? "" },
        { headers: { "Content-Type": "application/json" } },
      );
      return response.data;
    } catch (error) {
      return false;
    }
  };

  const updateSpecsT = async (itemId, newSpecs) => {
    try {
      const safeSpecs = newSpecs ?? "";
      const response = await api.put(
        `transaction-item/${itemId}/update-specs`,
        { specs: safeSpecs },
        { headers: { "Content-Type": "application/json" } },
      );
      return response.data;
    } catch (error) {
      return false;
    }
  };
  const handleBackFromCompare = async () => {
    setIsCompareActive(false);

    if (!compareData?.itemId) {
      setCompareData(null);
      return;
    }

    try {
      // 1️⃣ Fetch fresh items
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`,
      );
      const updatedItems = (res.items || []).map((item) => ({
        ...item,
        purchaseOptions: [],
        optionsLoaded: false,
        optionsLoading: true, // start loading
      }));

      setItems(updatedItems);

      // 2️⃣ Fetch purchase options for **all items in parallel**
      await Promise.all(
        updatedItems.map(async (item) => {
          const optionRes = await api.get(
            `transaction-items/${item.id}/purchase-options`,
          );
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    purchaseOptions: optionRes.purchaseOptions || [],
                    optionsLoaded: true,
                    optionsLoading: false,
                  }
                : it,
            ),
          );
        }),
      );

      // 3️⃣ Expand the row for the item you compared
      const itemId = compareData.itemId;
      setExpandedRows((prev) => ({
        ...prev,
        [itemId]: {
          specs: prev[itemId]?.specs || false,
          options: true,
        },
      }));
    } catch (err) {
      console.error("Failed to reload items and options:", err);
    }

    setCompareData(null);
  };

  const setOptionErrorWithAutoHide = (optionId, message, duration = 3000) => {
    if (errorTimeoutsRef.current[optionId]) {
      clearTimeout(errorTimeoutsRef.current[optionId]);
    }

    setOptionErrors((prev) => ({
      ...prev,
      [optionId]: message,
    }));

    errorTimeoutsRef.current[optionId] = setTimeout(() => {
      setOptionErrors((prev) => {
        const copy = { ...prev };
        delete copy[optionId];
        return copy;
      });
      delete errorTimeoutsRef.current[optionId];
    }, duration);
  };

  const handleToggleInclude = async (itemId, optionId, value) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const option = item.purchaseOptions.find((o) => o.id === optionId);
    if (!option) return;

    const num = (v) => Number(v ?? 0);
    const itemQty = num(item.nQuantity ?? item.qty);
    const optionQty = num(option.nQuantity ?? option.quantity);

    // ✅ CHECK IF THIS IS AN ADD-ON - skip validation if it is
    const isAddOn = Number(option.bAddOn) === 1;

    if (!isAddOn) {
      // Only perform quantity validation for non-add-on options
      const currentIncludedQty = item.purchaseOptions.reduce((sum, o) => {
        if (!o.bIncluded || Number(o.bAddOn) === 1) return sum;
        return sum + num(o.nQuantity ?? o.quantity);
      }, 0);

      const isFullyAllocated = currentIncludedQty === itemQty;
      const quantityStatus = `${currentIncludedQty} / ${itemQty}`;
      const fullMessage = isFullyAllocated
        ? "The quantity is currently fully allocated."
        : "";

      if (value && optionQty > itemQty) {
        setOptionErrorWithAutoHide(
          optionId,
          `Option quantity (${optionQty}) exceeds item quantity (${itemQty}). ${fullMessage} (${quantityStatus})`,
        );
        return;
      }

      const nextIncludedQty = value
        ? currentIncludedQty + optionQty
        : currentIncludedQty - optionQty;

      if (nextIncludedQty > itemQty) {
        setOptionErrorWithAutoHide(
          optionId,
          isFullyAllocated
            ? `Cannot add more options. The quantity is already fully allocated (${quantityStatus}).`
            : `Cannot include this option. Adding ${optionQty} would exceed the item limit. Current allocation: ${quantityStatus}.`,
        );
        return;
      }
    }

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              purchaseOptions: i.purchaseOptions.map((o) =>
                o.id === optionId ? { ...o, bIncluded: value } : o,
              ),
            }
          : i,
      ),
    );

    try {
      await api.put(`purchase-options/${optionId}`, {
        bIncluded: value ? 1 : 0,
      });
    } catch (err) {
      console.error(err);
      setOptionErrorWithAutoHide(optionId, `Failed to update.`);
    }
  };
  if (!transaction) return null;

  return (
    <PageLayout
      title={`Transaction`}
      subtitle={`/ ${transactionCode}`}

      loading={itemsLoading}
      footer={
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* LEFT SIDE */}
          <Box>
            <BaseButton
              label="Back"
              icon={<ArrowBack />}
              onClick={
                isCompareActive ? handleBackFromCompare : () => navigate(-1)
              }
              disabled={itemsLoading}
              variant="outlined"
              color="primary"
            />
          </Box>

          {/* RIGHT SIDE */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {showRevert && !isCompareActive && (
              <BaseButton
                label="Revert"
                icon={<Replay />}
                onClick={handleRevertClick}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#E53935",
                  "&:hover": { bgcolor: "#D32F2F" },
                }}
              />
            )}

            {showVerify && (
              <BaseButton
                label="Verify"
                icon={<CheckCircle />}
                onClick={handleVerifyClick}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#034FA5",
                  "&:hover": { bgcolor: "#336FBF" },
                }}
              />
            )}

            {showForAssignment && hasAssignedAO && (
              <BaseButton
                label="Reassign AO"
                icon={<AssignmentInd />}
                onClick={() => setAssignMode("reassign")}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#FFA726",
                  "&:hover": { bgcolor: "#FB8C00" },
                }}
              />
            )}

            {showForAssignment && !hasAssignedAO && (
              <BaseButton
                label="Assign AO"
                icon={<AssignmentInd />}
                onClick={() => setAssignMode("assign")}
                disabled={itemsLoading}
                sx={{
                  bgcolor: "#29B6F6",
                  "&:hover": { bgcolor: "#0288D1" },
                }}
              />
            )}
          </Box>
        </Box>
      }
    >
      <Box>
        <MTransactionActionModal
          open={Boolean(actionModal)}
          actionType={actionModal}
          transaction={transaction}
          canvasVerificationLabel={canvasVerificationLabel}
          forCanvasLabel={forCanvasLabel}
          onClose={() => setActionModal(null)}
          transacstatus={transacstatus}
          onVerified={handleAfterAction}
          onReverted={handleAfterAction}
        />

        <AssignAOModal
          open={!!assignMode}
          mode={assignMode}
          transaction={transaction}
          accountOfficers={accountOfficers}
          onClose={() => setAssignMode(null)}
          onSuccess={() => navigate(-1)}
        />

        {limitedContent && (
          <TransactionDetails
            details={transaction}
            statusTransaction={statusTransaction}
            itemType={itemType}
            procMode={procMode}
            procSourceLabel={procSourceLabel}
            showTransactionDetails={
              itemsManagementKey.includes(statusCode) ||
              itemsVerificationKey.includes(statusCode) ||
              forCanvasKey.includes(statusCode) ||
              canvasVerificationKey.includes(statusCode)
            }
          />
        )}

        {!limitedContent && (
          <>
            <Box sx={{ mt: 0 }}>
              {!isCompareActive && (
                <AlertBox>
                  <Box sx={{ overflowX: "auto", pb: 1 }}>
                    <Box sx={{ minWidth: "500px" }}>
                      <Grid
                        container
                        spacing={1}
                        sx={{
                          display: "flex",
                          alignItems: "stretch",
                          textAlign: "left",
                          fontSize: { xs: "0.75rem", sm: "0.8rem" },
                        }}
                      >
                        <Grid
                          item
                          xs={12}
                          sx={{ fontWeight: "bold", textAlign: "left" }}
                        >
                          {transaction.clientName || "—"} :{" "}
                          <span style={{ fontStyle: "italic" }}>
                            {transaction.strTitle ||
                              transaction.transactionName ||
                              "—"}
                          </span>
                        </Grid>

                        <Grid item xs={12}>
                          <hr style={{ margin: "4px 0" }} />
                        </Grid>

                        <Grid
                          item
                          xs={6}
                          sx={{
                            borderRight: "1px solid #ccc",
                            paddingRight: 1,
                            textAlign: "left",
                          }}
                        >
                          <Grid container>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>Code:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "right",
                                pr: 5,
                              }}
                            >
                              {transaction.strCode ||
                                transaction.transactionId ||
                                "—"}
                            </Grid>
                          </Grid>

                          <Grid container sx={{ mt: "6px" }}>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>ABC:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "right",
                                pr: 5,
                                color:
                                  transactionHasABC &&
                                  totalItemsABC > 0 &&
                                  totalItemsABC !==
                                    Number(transaction.dTotalABC)
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              {transaction.dTotalABC
                                ? `₱ ${Number(
                                    transaction.dTotalABC,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : "—"}
                              {transactionHasABC && totalItemsABC > 0 && (
                                <Box
                                  component="span"
                                  sx={{ ml: 1, fontSize: "0.7rem" }}
                                >
                                  (Items: ₱
                                  {totalItemsABC.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  )
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                          {showPurchaseOptions && (
                            <Grid container sx={{ mt: "6px" }}>
                              <Grid item xs={5} sx={{ textAlign: "left" }}>
                                <strong>Total Canvas:</strong>
                              </Grid>
                              <Grid
                                item
                                xs={7}
                                sx={{
                                  fontStyle: "italic",
                                  textAlign: "right",
                                  pr: 5,
                                }}
                              >
                                ₱{" "}
                                {totalCanvas.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Grid>
                            </Grid>
                          )}
                        </Grid>

                        <Grid
                          item
                          xs={6}
                          sx={{
                            paddingLeft: 1,
                            textAlign: "left",
                          }}
                        >
                          <Grid container>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>AO Due:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "left",
                                color:
                                  transaction.dtAODueDate &&
                                  (new Date(transaction.dtAODueDate) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24) <=
                                    4
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              {transaction.dtAODueDate
                                ? new Date(
                                    transaction.dtAODueDate,
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : "—"}
                            </Grid>
                          </Grid>

                          <Grid container sx={{ mt: "6px" }}>
                            <Grid item xs={3} sx={{ textAlign: "left" }}>
                              <strong>Doc Sub:</strong>
                            </Grid>
                            <Grid
                              item
                              xs={9}
                              sx={{
                                fontStyle: "italic",
                                textAlign: "left",
                                color:
                                  transaction.dtDocSubmission &&
                                  (new Date(transaction.dtDocSubmission) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24) <=
                                    4
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              {transaction.dtDocSubmission
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
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </AlertBox>
              )}
              {!isCompareActive &&
                isCanvasOverABC &&
                abcValidationResult.message && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {abcValidationResult.message}
                  </Alert>
                )}
              {!isCompareActive && abcValidationMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {abcValidationMessage}
                </Alert>
              )}
            </Box>

            <Grid item xs={12} md={6}>
              {!isCompareActive && (
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

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <button
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "#f7fbff",
                        border: "1px solid #cfd8dc",
                        cursor: "pointer",
                        color: "#1976d2",
                        fontWeight: 500,
                        borderRadius: "6px",
                        padding: "1px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={handleCollapseAllToggle}
                    >
                      {Object.values(expandedRows).some(
                        (row) => row?.specs || row?.options,
                      )
                        ? "Hide all"
                        : "Collapse all"}
                      {Object.values(expandedRows).some(
                        (row) => row?.specs || row?.options,
                      ) ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </button>
                  </Box>
                </Box>
              )}

              {!isCompareActive && (
                <Box sx={{ width: "100%", mt: 1 }}>
                  <Box sx={{ overflowX: "auto", pb: 1 }}>
                    <Box sx={{ minWidth: "650px" }}>
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
                            fontSize: {
                              xs: "0.7rem",
                              sm: "0.75rem",
                              md: "0.8rem",
                            },
                          }}
                        >
                          <Grid
                            item
                            xs={showPurchaseOptions ? 3 : 5}
                            sx={{ textAlign: "center" }}
                          >
                            Description
                          </Grid>
                          <Grid
                            item
                            xs={
                              !showPurchaseOptions
                                ? 3
                                : showPurchaseOptions
                                  ? 2
                                  : 4
                            }
                          >
                            Quantity
                          </Grid>
                          {showPurchaseOptions && (
                            <Grid item xs={2}>
                              Canvas
                            </Grid>
                          )}
                          <Grid item xs={showPurchaseOptions ? 2 : 3}>
                            ABC
                          </Grid>
                          {showPurchaseOptions && (
                            <Grid item xs={2}>
                              Balance
                            </Grid>
                          )}
                          {showPurchaseOptions && (
                            <Grid item xs={1}>
                              Action
                            </Grid>
                          )}
                        </Grid>
                      </Paper>

                      {items.map((item) => {
                        const getEffectiveABC = (item) => {
                          const itemABC = Number(item.abc || 0);

                          // If transaction has ABC and item ABC is empty, distribute transaction ABC
                          if (transactionHasABC && itemABC === 0) {
                            const totalItemQty = items.reduce(
                              (sum, i) => sum + Number(i.qty || 0),
                              0,
                            );
                            const itemQty = Number(item.qty || 0);
                            const transABC = Number(transaction.dTotalABC || 0);

                            // Proportionally distribute transaction ABC based on quantity
                            return totalItemQty > 0
                              ? (itemQty / totalItemQty) * transABC
                              : 0;
                          }

                          // Otherwise use item's own ABC
                          return itemABC;
                        };
                        const includedQty = item.purchaseOptions
                          .filter(
                            (opt) => opt.bIncluded && Number(opt.bAddOn) !== 1,
                          )
                          .reduce(
                            (sum, opt) => sum + Number(opt.nQuantity || 0),
                            0,
                          );

                        const includedTotal = item.purchaseOptions
                          .filter((opt) => opt.bIncluded)
                          .reduce(
                            (sum, opt) =>
                              sum +
                              Number(opt.nQuantity || 0) *
                                Number(opt.dUnitPrice || 0),
                            0,
                          );

                        // ✅ USE EFFECTIVE ABC
                        const effectiveABC = getEffectiveABC(item);
                        const balanceQty = effectiveABC - includedTotal;

                        const isItemExpanded =
                          expandedRows[item.id]?.specs ||
                          expandedRows[item.id]?.options;
                        const isOptionsOpen = expandedRows[item.id]?.options;

                        // ✅ COMPARE AGAINST EFFECTIVE ABC
                        const isOverABC = includedTotal > effectiveABC;
                        const isQuantityEqual =
                          Number(includedQty || 0) === Number(item.qty || 0);

                        return (
                          <Box key={item.id} sx={{ mt: 1 }}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                background: coloredItemRowEnabled
                                  ? isQuantityEqual
                                    ? !isOverABC
                                      ? "rgba(0, 255, 0, 0.1)"
                                      : "rgba(255, 0, 0, 0.1)"
                                    : "#ffffff"
                                  : "#ffffff",
                                borderLeft: "4px solid #1565c0",
                                borderTopLeftRadius: 8,
                                borderTopRightRadius: 8,
                                borderBottomLeftRadius: isItemExpanded ? 0 : 8,
                                borderBottomRightRadius: isItemExpanded ? 0 : 8,
                              }}
                            >
                              <Grid
                                container
                                alignItems="center"
                                sx={{ textAlign: "center" }}
                              >
                                <Grid
                                  item
                                  xs={showPurchaseOptions ? 3 : 5}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    textAlign: "left",
                                  }}
                                >
                                  <Typography
                                    fontWeight="500"
                                    sx={{
                                      fontSize: ".7rem",
                                      lineHeight: 1.2,
                                      wordBreak: "break-word",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {item.nItemNumber}. {item.name || "—"}
                                  </Typography>

                                  <IconButton
                                    onClick={() => toggleSpecsRow(item.id)}
                                    size="small"
                                    sx={{
                                      mr: {
                                        xs: 5,
                                        lg: 0,
                                      },
                                    }}
                                  >
                                    <ArrowDropDownIcon
                                      sx={{
                                        transform: expandedRows[item.id]?.specs
                                          ? "rotate(180deg)"
                                          : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                      }}
                                    />
                                  </IconButton>
                                </Grid>

                                <Grid
                                  item
                                  xs={
                                    !showPurchaseOptions
                                      ? 3
                                      : showPurchaseOptions
                                        ? 2
                                        : 4
                                  }
                                >
                                  <Typography
                                    sx={{
                                      fontSize: ".7rem",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {showPurchaseOptions && `${includedQty} / `}
                                    {item.qty}
                                    <br />
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#666",
                                      }}
                                    >
                                      {item.uom}
                                    </span>
                                  </Typography>
                                </Grid>

                                {showPurchaseOptions && (
                                  <Grid item xs={2}>
                                    <Typography
                                      sx={{
                                        fontSize: ".7rem",
                                        lineHeight: 1.2,
                                        textAlign: "right",
                                        pr: 4,
                                      }}
                                    >
                                      ₱{" "}
                                      {Number(includedTotal).toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                        },
                                      )}
                                    </Typography>
                                  </Grid>
                                )}

                                <Grid
                                  item
                                  xs={showPurchaseOptions ? 2 : 3}
                                  sx={{ textAlign: "right", pr: 4 }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: ".7rem",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    ₱{" "}
                                    {Number(item.abc).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                      },
                                    )}
                                  </Typography>
                                </Grid>

                                {showPurchaseOptions && (
                                  <Grid item xs={2} sx={{ textAlign: "right" }}>
                                    <Typography
                                      sx={{
                                        fontSize: ".7rem",
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      ₱{" "}
                                      {Number(balanceQty).toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                        },
                                      )}
                                    </Typography>
                                  </Grid>
                                )}
                                {showPurchaseOptions && (
                                  <>
                                    {/* Right-side icons container */}
                                    <Grid
                                      item
                                      xs={1}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "flex-end", //showPurchaseOptions ? "flex-end" : "flex-center"
                                        alignItems: "center",
                                        position: "relative", // <-- needed for overlap
                                      }}
                                    >
                                      {/* Arrow Dropdown */}
                                      {showPurchaseOptions && (
                                        <IconButton
                                          size="small"
                                          sx={{
                                            position: "relative",
                                            marginRight: 2,
                                          }}
                                          onClick={() =>
                                            toggleOptionsRow(item.id)
                                          }
                                        >
                                          <ArrowDropDownIcon
                                            sx={{
                                              transform: expandedRows[item.id]
                                                ?.options
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                              transition: "transform 0.2s",
                                              fontSize: "1.4rem",
                                            }}
                                          />

                                          {/* Badge visible only if item has purchase options */}
                                          {item.purchaseOptions.length > 0 &&
                                            expandedRows[item.id] !==
                                              "options" && (
                                              <Box
                                                sx={{
                                                  position: "absolute",
                                                  top: "1px",
                                                  right: "-3px",
                                                  backgroundColor: "#d9ecff", // light blue
                                                  color: "#1976d2",
                                                  width: "14px",
                                                  height: "14px",
                                                  fontSize: "0.50rem",
                                                  borderRadius: "50%", // <-- perfect circle
                                                  border: "1px solid #90caf9",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center", // center text
                                                  zIndex: 2,
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {item.purchaseOptions.length}
                                              </Box>
                                            )}
                                        </IconButton>
                                      )}
                                    </Grid>
                                  </>
                                )}
                              </Grid>
                            </Paper>

                            {/* Specs */}
                            {expandedRows[item.id]?.specs && (
                              <Paper
                                elevation={1}
                                sx={{
                                  mt: "-1px",
                                  borderRadius: 2,
                                  background: "#f3f8ff",
                                  borderLeft: "4px solid #1e88e5",

                                  overflow: "hidden",
                                  // 👇 CONNECT to item
                                  borderTopLeftRadius: 0,
                                  borderTopRightRadius: 0,
                                  borderBottomLeftRadius: isOptionsOpen ? 0 : 8,
                                  borderBottomRightRadius: isOptionsOpen
                                    ? 0
                                    : 8,
                                }}
                              >
                                {/* Top Header */}
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 0.5,
                                    backgroundColor: "#e1efff",
                                    borderBottom: "1px solid #c7dcf5",
                                    color: "#1e88e5",

                                    fontWeight: 400,

                                    fontSize: "0.75rem",

                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span>Specifications:</span>

                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    {/* Hide Button */}
                                    <button
                                      style={{
                                        fontSize: "0.6rem",
                                        backgroundColor: "#f7fbff",
                                        border: "1px solid #cfd8dc",
                                        cursor: "pointer",
                                        color: "#1976d2",
                                        fontWeight: 500,
                                        borderRadius: "6px",
                                        padding: "1px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px", // spacing between text and icon
                                      }}
                                      onClick={() => toggleSpecsRow(item.id)}
                                    >
                                      Hide
                                      <ExpandLess fontSize="small" />
                                    </button>
                                  </Box>
                                </Box>
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    maxHeight: 120,
                                    overflowY: "auto",
                                    backgroundColor: "#f4faff",

                                    color: "text.secondary",
                                    fontSize: "0.8rem",
                                    "& *": {
                                      backgroundColor: "transparent !important",
                                    },
                                    "& ul": {
                                      paddingLeft: 2,
                                      margin: 0,
                                      listStyleType: "disc",
                                    },
                                    "& ol": {
                                      paddingLeft: 2,
                                      margin: 0,
                                      listStyleType: "decimal",
                                    },
                                    "& li": { marginBottom: 0.25 },
                                    wordBreak: "break-word",
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: item.specs || "No data available.",
                                  }}
                                />
                              </Paper>
                            )}

                            {/* OPTIONS */}
                            {expandedRows[item.id]?.options && (
                              <Paper
                                elevation={2}
                                sx={{
                                  mt: "-1px",
                                  background: "#fafbfd",
                                  borderLeft: "4px solid #90caf9",

                                  borderRadius: 2.5,
                                  overflow: "hidden",

                                  // 👇 CONNECT to item
                                  borderTopLeftRadius: 0,
                                  borderTopRightRadius: 0,
                                  borderBottomLeftRadius: 10,
                                  borderBottomRightRadius: 10,
                                }}
                              >
                                {/* HEADER */}
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 0.5,
                                    backgroundColor: "#eef4fb",
                                    borderBottom: "1px solid #d6e2f0",
                                    color: "#1565c0",
                                    fontSize: "0.75rem",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span>Purchase Options</span>

                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    {/* Hide Button */}
                                    <button
                                      style={{
                                        fontSize: "0.6rem",
                                        backgroundColor: "#f7fbff",
                                        border: "1px solid #cfd8dc",
                                        cursor: "pointer",
                                        color: "#1976d2",
                                        fontWeight: 500,
                                        borderRadius: "6px",
                                        padding: "1px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px", // spacing between text and icon
                                      }}
                                      onClick={() => toggleOptionsRow(item.id)}
                                    >
                                      Hide
                                      <ExpandLess fontSize="small" />
                                    </button>
                                  </Box>
                                </Box>
                                {/* TABLE HEADER */}
                                <Box
                                  sx={{
                                    px: 1.2,
                                    py: 0.7,
                                    display: "flex",
                                    background: "#f3f3f3",
                                    fontSize: "0.72rem",
                                    borderBottom: "1px solid #ddd",
                                    fontWeight: 600,
                                    color: "#555",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      flex: 2.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Description
                                  </Box>
                                  <Box
                                    sx={{
                                      flex: 2,
                                      textAlign: "center",
                                    }}
                                  >
                                    Brand | Model
                                  </Box>
                                  <Box
                                    sx={{
                                      flex: 1,
                                      textAlign: "center",
                                    }}
                                  >
                                    Quantity
                                  </Box>
                                  <Box
                                    sx={{
                                      flex: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Unit Price
                                  </Box>
                                  <Box
                                    sx={{
                                      flex: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    EWT
                                  </Box>
                                  <Box
                                    sx={{
                                      flex: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Total
                                  </Box>
                                </Box>
                                {/* OPTION ROWS */}

                                {item.purchaseOptions.length === 0 ? (
                                  <Box
                                    sx={{
                                      py: 1,
                                      textAlign: "center",
                                      fontSize: "0.75rem",
                                      color: "text.secondary",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No options available.
                                  </Box>
                                ) : (
                                  // Inside the mapping of item.purchaseOptions
                                  item.purchaseOptions.map((option, index) => {
                                    // Check if there are any regular (non-add-on) options
                                    const hasNoRegularOptions =
                                      item.purchaseOptions.every(
                                        (opt) => Number(opt.bAddOn) === 1,
                                      );

                                    // Determine if this is the first add-on
                                    const isFirstAddOn =
                                      Number(option.bAddOn) === 1 &&
                                      (index === 0 ||
                                        Number(
                                          item.purchaseOptions[index - 1]
                                            .bAddOn,
                                        ) !== 1);

                                    // Calculate display index based on whether it's an add-on or regular option
                                    let displayIndex;
                                    if (Number(option.bAddOn) === 1) {
                                      // For add-ons, count only add-ons before this one
                                      displayIndex =
                                        item.purchaseOptions
                                          .slice(0, index)
                                          .filter(
                                            (opt) => Number(opt.bAddOn) === 1,
                                          ).length + 1;
                                    } else {
                                      // For regular options, count only regular options before this one
                                      displayIndex =
                                        item.purchaseOptions
                                          .slice(0, index)
                                          .filter(
                                            (opt) => Number(opt.bAddOn) !== 1,
                                          ).length + 1;
                                    }

                                    return (
                                      <PurchaseOptionRow
                                        key={option.id}
                                        option={option}
                                        index={index}
                                        displayIndex={displayIndex} // Pass the calculated display index
                                        isLastOption={
                                          index ===
                                          item.purchaseOptions.length - 1
                                        }
                                        itemId={item.id}
                                        item={item}
                                        checkboxOptionsEnabled={
                                          checkboxOptionsEnabled
                                        }
                                        expandedOptions={expandedOptions}
                                        optionErrors={optionErrors}
                                        onToggleInclude={handleToggleInclude}
                                        onToggleOptionSpecs={toggleOptionSpecs}
                               
                                        onCompareClick={handleCompareClick}
                                        isManagement={isManagement}
                                        isFirstAddOn={isFirstAddOn}
                                        hasNoRegularOptions={
                                          hasNoRegularOptions
                                        }
                                      />
                                    );
                                  })
                                )}
                              </Paper>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              )}
              {items.length === 0 && (
                <Box
                  sx={{
                    height: 100,
                    border: "1px dashed #bbb",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography>No items available.</Typography>
                </Box>
              )}
            </Grid>
            {isCompareActive && compareData && (
              <CompareView
                compareData={compareData}
                onSpecsChange={(newSpecs) => {
                  setCompareData((prev) => ({
                    ...prev,
                    specs: newSpecs,
                  }));
                  updateSpecsT(compareData.itemId, newSpecs);
                }}
                onOptionSpecsChange={(optionId, newSpecs) => {
                  setCompareData((prev) => ({
                    ...prev,
                    purchaseOptions: prev.purchaseOptions.map((po) =>
                      po.nPurchaseOptionId === optionId
                        ? { ...po, specs: newSpecs }
                        : po,
                    ),
                  }));
                  updateSpecs(optionId, newSpecs);
                }}
              />
            )}
          </>
        )}
      </Box>
    </PageLayout>
  );
}

export default MTransactionCanvas;
