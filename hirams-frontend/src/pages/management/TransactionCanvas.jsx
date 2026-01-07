import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import api from "../../utils/api/api";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Paper,
  Alert,
  Checkbox,
  Link,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AssignAOModal from "../../components/ui/modals/admin/transaction/AssignAOModal";
import TransactionActionModal from "../../components/ui/modals/account-officer/TransactionActionModal";
import useMapping from "../../utils/mappings/useMapping";
import AlertBox from "../../components/common/AlertBox";
import FormGrid from "../../components/common/FormGrid";
import { SaveButton, BackButton } from "../../components/common/Buttons";
import {
  AssignAccountOfficerButton,
  ReassignAccountOfficerButton,
  VerifyButton,
  RevertButton1,
} from "../../components/common/Buttons";
// Add this import at the top
import { calculateEWT } from "../../utils/formula/calculateEWT";
const initialFormData = {
  nSupplierId: "",
  quantity: "",
  uom: "",
  brand: "",
  model: "",
  specs: "",
  unitPrice: "",
  ewt: "",
  bIncluded: false,
};
const buttonSm = {
  fontSize: "0.6rem",
  background: "#ffffff",
  border: "1px solid #cfd8dc",
  cursor: "pointer",
  color: "#1976d2",
  fontWeight: 600,
  borderRadius: "6px",
  padding: "2px 10px",
};

function MTransactionCanvas() {
  const { state } = useLocation();

  const { transactionId, transactionCode,selectedStatusCode, transaction, nUserId } = state || {};

  const [actionModal, setActionModal] = useState(null);
  // "verified" | "reverted" | "finalized" | null
  const handleAfterAction = () => {
    setActionModal(null);
    navigate(-1);
  };
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [assignMode, setAssignMode] = useState(null); // "assign" | "reassign"
  const [accountOfficers, setAccountOfficers] = useState([]);

  const [addingNewItem, setAddingNewItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    specs: "",
    qty: "",
    uom: "",
    abc: "",
    purchasePrice: "",
  });
  const [compareData, setCompareData] = useState(null);
  const [isCompareActive, setIsCompareActive] = useState(false);

  const [newItemErrors, setNewItemErrors] = useState({});
  const [purchaseOptionErrors, setPurchaseOptionErrors] = useState({});
  // States for verify/revert/finalize modals
  const [cItemType, setCItemType] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [optionErrors, setOptionErrors] = React.useState({});
  const errorTimeoutsRef = React.useRef({});
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();
  const hasAssignedAO = Number(transaction?.nAssignedAO) > 0;

  const [itemsLoading, setItemsLoading] = useState(true);
  const { itemType, clientstatus, transacstatus, userTypes, vaGoSeValue } =
    useMapping();
  // --- Finalize Visibility Logic ---
  const statusCode = String(transaction.current_status);
   const status_code = selectedStatusCode;
  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const draftKey = Object.keys(transacstatus)[0] || "";
  const finalizeKey = Object.keys(transacstatus)[1] || "";
  const forAssignmentKey = Object.keys(transacstatus)[2] || "";
  const itemsManagementKey = Object.keys(transacstatus)[3] || "";
  const itemsVerificationKey = Object.keys(transacstatus)[4] || "";
  const forCanvasKey = Object.keys(transacstatus)[5] || "";
  const canvasVerificationKey = Object.keys(transacstatus)[6] || "";
  const priceVerificationKey = Object.keys(transacstatus)[8] || "";
  const managementKey =
    Object.keys(userTypes)[1] || Object.keys(userTypes)[4] || "";

  const showPurchaseOptions =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const checkboxOptionsEnabled =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const coloredItemRowEnabled =
    forCanvasKey.includes(statusCode) ||
    canvasVerificationKey.includes(statusCode);
  const showRevert = !draftKey.includes(statusCode); //showing revert button
  const showVerify = finalizeKey.includes(statusCode); //show verify button
  const showVerifyItems = itemsVerificationKey.includes(statusCode);
  const showVerifyCanvas =
    canvasVerificationKey.includes(statusCode) && !isCompareActive;
  const showVerifyPrice = priceVerificationKey.includes(statusCode);
  const showForAssignment = forAssignmentKey.includes(status_code);
  const forVerificationKey = forCanvasKey || "";
  const canvasVerificationLabel = transacstatus[canvasVerificationKey] || "";
  const forCanvasLabel = transacstatus[forVerificationKey] || "";

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("suppliers/all");
        const options = res.suppliers.map((s) => ({
          label: s.strSupplierName,
          value: s.nSupplierId,
          bEWT: s.bEWT,
          bVAT: s.bVAT,
          nickName: s.strSupplierNickName,
        }));
        setSuppliers(options);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;
    try {
      setItemsLoading(true); // start loading
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`
      );
      setItems(res.items || []);

      // Extract only the key like "G"
      const itemTypeKey =
        res.cItemType && typeof res.cItemType === "object"
          ? Object.keys(res.cItemType)[0]
          : res.cItemType;
      setCItemType(itemTypeKey);
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    } finally {
      setItemsLoading(false); // finish loading
    }
  };

  useEffect(() => {
    fetchItems();
  }, [transaction]);

  if (!transaction) return null;

  useEffect(() => {
    const selectedSupplier = suppliers.find(
      (s) => s.value === Number(formData.nSupplierId)
    );
    setFormData((prev) => ({
      ...prev,
      ewt: calculateEWT(
        prev.quantity,
        prev.unitPrice,
        selectedSupplier,
        cItemType,
        itemType, // pass the mapping here
        vaGoSeValue
      ),
    }));
  }, [
    formData.nSupplierId,
    formData.quantity,
    formData.unitPrice,
    cItemType,
    suppliers,
    itemType,
    vaGoSeValue,
  ]);

  useEffect(() => {
    const fetchAOs = async () => {
      const res = await api.get("users");
      const activeKey = Object.keys(userTypes)[0];
      const users = res.users || [];
      setAccountOfficers(
        users
          .filter((u) => u.cUserType === activeKey && u.cStatus === activeKey)
          .map((u) => ({
            label: `${u.strFName} ${u.strLName}`,
            value: u.nUserId,
          }))
      );
    };
    fetchAOs();
  }, [userTypes]);

  const handleSupplierChange = (value) => {
    const selectedSupplier = suppliers.find((s) => s.value === Number(value));

    setFormData((prev) => ({
      ...prev,
      nSupplierId: selectedSupplier?.value || "",
      ewt: calculateEWT(
        prev.quantity,
        prev.unitPrice,
        selectedSupplier,
        cItemType,
        itemType,
        vaGoSeValue
      ),
    }));
  };
  // VERIFY / REVERT / FINALIZE HANDLERS
  const handleVerifyClick = () => setActionModal("verified");
  const handleRevertClick = () => setActionModal("reverted");
  const handleFinalizeClick = () => setActionModal("finalized");

  const fields = [
    { name: "brand", label: "Brand", xs: 6 },
    { name: "model", label: "Model", xs: 6 },
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      options: suppliers,
      xs: 12,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      xs: 6,
      numberOnly: true,
    },
    { name: "uom", label: "UOM", xs: 6 },

    {
      name: "specs",
      label: "Specifications",
      placeholder: "Type here the specifications...",
      type: "textarea",
      xs: 12,
      multiline: true,
      minRows: 4,
      showHighlighter: false, // 👈 hide highlighter
      showAllFormatting: true, // 👈 show all other formatting
      sx: { "& textarea": { resize: "vertical" } },
    },
    {
      name: "unitPrice",
      label: "Unit Price",
      type: "number",
      xs: 6,
      numberOnly: true,
    },
    {
      name: "ewt",
      label: "EWT",
      type: "number",
      xs: 6,
      InputProps: { readOnly: true },
      numberOnly: true,
    },
  ];
  const handleCompareClick = (item, selectedOption) => {
    // Clear previous compare data
    setCompareData(null);

    // Prepare new compare data
    const data = {
      itemId: item.id,
      itemName: item.name,
      quantity: item.qty,
      specs: item.specs,
      uom: item.uom,
      abc: item.abc,
      // Only include the selected option
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
    };
    // Set new compare data
    setCompareData(data);
    setIsCompareActive(true);
  };
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});
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
  const onEdit = (item) => {
    setEditingItem(item);
    setAddingNewItem(true);
    setNewItemForm({
      name: item.name,
      specs: item.specs,
      qty: item.qty,
      uom: item.uom,
      abc: item.abc,
    });

    setNewItemErrors({}); // clear validation errors
  };
  const totalCanvas = items.reduce((sum, item) => {
    const includedTotal = item.purchaseOptions
      .filter((opt) => opt.bIncluded)
      .reduce(
        (sub, opt) =>
          sub + Number(opt.nQuantity || 0) * Number(opt.dUnitPrice || 0),
        0
      );
    return sum + includedTotal;
  }, 0);
  const isAnythingExpanded = Object.values(expandedRows).some(
    (row) => row?.specs || row?.options
  );
  const handleCollapseAllToggle = () => {
    const isAnythingExpanded = Object.values(expandedRows).some((row) => {
      if (!row) return false;
      if (typeof row === "string") return true;
      if (typeof row === "object") return row.specs || row.options;
      return false;
    });

    if (isAnythingExpanded) {
      // Hide all
      setExpandedRows({});
    } else {
      // Expand all
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
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data; // or true if you just want success
    } catch (error) {
      return false; // or throw error if you want caller to handle it
    }
  };
  const updateSpecsT = async (itemId, newSpecs) => {
    try {
      // Ensure specs is always a string
      const safeSpecs = newSpecs ?? "";

      const response = await api.put(
        `transaction-item/${itemId}/update-specs`,
        { specs: safeSpecs },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data; // optional: return the updated item
    } catch (error) {
      return false; // indicate failure
    }
  };
  const handleBackFromCompare = async () => {
    setIsCompareActive(false); // exit compare view
    await fetchItems(); // 🔄 sync from backend
  };
  const setOptionErrorWithAutoHide = (optionId, message, duration = 3000) => {
    // Clear existing timeout if any
    if (errorTimeoutsRef.current[optionId]) {
      clearTimeout(errorTimeoutsRef.current[optionId]);
    }

    // Set error
    setOptionErrors((prev) => ({
      ...prev,
      [optionId]: message,
    }));

    // Auto-hide after duration
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

    // 1️⃣ Current included qty (BEFORE toggle)
    const currentIncludedQty = item.purchaseOptions.reduce((sum, o) => {
      if (!o.bIncluded) return sum;
      return sum + num(o.nQuantity ?? o.quantity);
    }, 0);

    const isFullyAllocated = currentIncludedQty === itemQty;

    const quantityStatus = `${currentIncludedQty} / ${itemQty}`;
    const fullMessage = isFullyAllocated
      ? "The quantity is currently fully allocated."
      : "";

    // 2️⃣ Option itself exceeds item quantity
    if (value && optionQty > itemQty) {
      setOptionErrorWithAutoHide(
        optionId,
        `Option quantity (${optionQty}) exceeds item quantity (${itemQty}). ${fullMessage} (${quantityStatus})`
      );
      return;
    }

    // 3️⃣ Next included qty (AFTER toggle)
    const nextIncludedQty = value
      ? currentIncludedQty + optionQty
      : currentIncludedQty - optionQty;
    if (nextIncludedQty > itemQty) {
      setOptionErrorWithAutoHide(
        optionId,
        isFullyAllocated
          ? `Cannot add more options. The quantity is already fully allocated (${quantityStatus}).`
          : `Cannot include this option. Adding ${optionQty} would exceed the item limit. Current allocation: ${quantityStatus}.`
      );
      return;
    }

    // ✅ Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              purchaseOptions: i.purchaseOptions.map((o) =>
                o.id === optionId ? { ...o, bIncluded: value } : o
              ),
            }
          : i
      )
    );

    try {
      await api.put(`purchase-options/${optionId}`, {
        bIncluded: value ? 1 : 0,
      });
    } catch (err) {
      console.error(err);
      setOptionErrorWithAutoHide(
        optionId,
        `Failed to update. Current: ${quantityStatus}`
      );
    }
  };

  return (
    <PageLayout
      title={`Transaction • ${transactionCode}`}
      loading={itemsLoading}
      footer={
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Left side */}
          <Box>
            {isCompareActive ? (
              <BackButton label="Back" onClick={handleBackFromCompare} />
            ) : (
              <BackButton label="Back" onClick={() => navigate(-1)} />
            )}
          </Box>

          {/* Right side */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {showRevert && !isCompareActive && <RevertButton1 onClick={handleRevertClick} />}
            {(showVerify ||
              showVerifyItems ||
              showVerifyCanvas ||
              showVerifyPrice) && <VerifyButton onClick={handleVerifyClick} />}
            {/* REASSIGN → only when AO exists */}
            {(showForAssignment && hasAssignedAO) && (
              <ReassignAccountOfficerButton
                onClick={() => setAssignMode("reassign")}
              />
            )}

            {/* ASSIGN → only when NO AO */}
            {(showForAssignment && !hasAssignedAO) && (
              <AssignAccountOfficerButton
                onClick={() => setAssignMode("assign")}
              />
            )}
          </Box>
        </Box>
      }
    >
      <Box>
        <TransactionActionModal
          open={Boolean(actionModal)}
          actionType={actionModal}
          transaction={transaction}
          canvasVerificationLabel={canvasVerificationLabel}
          forCanvasLabel={forCanvasLabel}
          onClose={() => setActionModal(null)}
          onVerified={handleAfterAction}
          onReverted={handleAfterAction}
          onFinalized={handleAfterAction}
        />
        <AssignAOModal
          open={!!assignMode}
          mode={assignMode}
          transaction={transaction}
          accountOfficers={accountOfficers}
          onClose={() => setAssignMode(null)}
          onSuccess={() => navigate(-1)}
        />

        {!verifying && !reverting && !confirming && (
          <>
            {/* AlertBox below the toast */}
            <Box sx={{ mt: toast.open ? 1 : 0 }}>
              {!isCompareActive && (
                <AlertBox>
                  {/* SCROLL WRAPPER */}
                  <Box
                    sx={{
                      overflowX: "auto",
                      pb: 1,
                    }}
                  >
                    {/* MIN WIDTH CONTENT */}
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
                        {/* TOP ROW */}
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
                        {/* HR LINE */}
                        <Grid item xs={12}>
                          <hr style={{ margin: "4px 0" }} />
                        </Grid>
                        {/* LEFT COLUMN */}
                        <Grid
                          item
                          xs={6}
                          sx={{
                            borderRight: "1px solid #ccc",
                            paddingRight: 1,
                            textAlign: "left",
                          }}
                        >
                          {/* CODE ROW */}
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
                          {/* ABC ROW */}
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
                              }}
                            >
                              {transaction.dTotalABC
                                ? `₱ ${Number(
                                    transaction.dTotalABC
                                  ).toLocaleString()}`
                                : "—"}
                            </Grid>
                          </Grid>

                          {/* ABC ROW */}
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

                        {/* RIGHT COLUMN */}
                        <Grid
                          item
                          xs={6}
                          sx={{
                            paddingLeft: 1,
                            textAlign: "left",
                          }}
                        >
                          {/* AO DUE ROW */}
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
                                    transaction.dtAODueDate
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

                          {/* DOC SUB ROW */}
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
                                    transaction.dtDocSubmission
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

                  {/* RIGHT ACTIONS */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {/* COLLAPSE / HIDE ALL */}
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
                      }}
                      onClick={handleCollapseAllToggle}
                    >
                      {/* Fixed: Check if any specs or options are actually expanded */}
                      {Object.values(expandedRows).some(
                        (row) => row.specs || row.options
                      )
                        ? "Hide all"
                        : "Collapse all"}
                    </button>
                  </Box>
                </Box>
              )}
              {!isCompareActive && (
                <Box sx={{ width: "100%", mt: 1 }}>
                  {/* Scroll Container */}
                  <Box sx={{ overflowX: "auto", pb: 1 }}>
                    <Box sx={{ minWidth: "650px" }}>
                      {/* HEADER */}
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
                      {/* BODY ROWS */}
                      {items.map((item) => {
                        const includedQty = item.purchaseOptions
                          .filter((opt) => opt.bIncluded)
                          .reduce(
                            (sum, opt) => sum + Number(opt.nQuantity || 0),
                            0
                          );

                        const includedTotal = item.purchaseOptions
                          .filter((opt) => opt.bIncluded)
                          .reduce(
                            (sum, opt) =>
                              sum +
                              Number(opt.nQuantity || 0) *
                                Number(opt.dUnitPrice || 0),
                            0
                          );

                        const balanceQty =
                          Number(item.abc || 0) - includedTotal;

                        const totalCanvas = items.reduce((sum, item) => {
                          const includedTotal = item.purchaseOptions
                            .filter((opt) => opt.bIncluded)
                            .reduce(
                              (sub, opt) =>
                                sub +
                                Number(opt.nQuantity || 0) *
                                  Number(opt.dUnitPrice || 0),
                              0
                            );
                          return sum + includedTotal;
                        }, 0);

                        const isItemExpanded =
                          expandedRows[item.id]?.specs ||
                          expandedRows[item.id]?.options;
                        const isSpecsOpen = expandedRows[item.id]?.specs;
                        const isOptionsOpen = expandedRows[item.id]?.options;

                        const isOverABC = includedTotal > Number(item.abc || 0);
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
                                        xs: 5, // small screens (mobile)
                                        lg: 0, // large screens
                                      },
                                    }}
                                  >
                                    <ArrowDropDownIcon
                                      sx={{
                                        transform:
                                          expandedRows[item.id] === "specs"
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                      }}
                                    />
                                  </IconButton>
                                </Grid>

                                {/* Quantity */}
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
                                    {includedQty} / {item.qty}
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

                                {/* Canvas */}
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
                                        }
                                      )}
                                    </Typography>
                                  </Grid>
                                )}
                                {/* ABC */}
                                <Grid
                                  item
                                  xs={showPurchaseOptions ? 2 : 3}
                                  sx={{ textAlign: "right", pr: 4 }} // mr = margin-right
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
                                      }
                                    )}
                                  </Typography>
                                </Grid>

                                {/* Balance */}
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
                                        }
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
                                              transform:
                                                expandedRows[item.id] ===
                                                "options"
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
                                      }}
                                      onClick={() => toggleSpecsRow(item.id)}
                                    >
                                      Hide
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
                                    <button
                                      style={buttonSm}
                                      onClick={() => toggleOptionsRow(item.id)}
                                    >
                                      Hide
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
                                  item.purchaseOptions.map((option, index) => {
                                    const isLastOption =
                                      index === item.purchaseOptions.length - 1;
                                    return (
                                      <React.Fragment key={option.id}>
                                        <Paper
                                          elevation={0}
                                          sx={{
                                            position: "relative", // 👈 REQUIRED for overlay
                                            px: 1.2,
                                            py: 0.7,
                                            display: "flex",
                                            flexDirection: "column",
                                            borderBottom:
                                              "1px solid rgba(0,0,0,0.08)",
                                            transition: "background 0.2s",
                                            backgroundColor:
                                              "rgba(255, 255, 255, 0.7)",

                                            "&:hover": {
                                              backgroundColor:
                                                "rgba(255, 255, 255, 0.85)",
                                            },
                                          }}
                                        >
                                          {/* Row content */}
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                          >
                                            {/* DESCRIPTION + EXPAND ICON */}
                                            <Box
                                              sx={{
                                                flex: 2.5,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    position: "relative", // anchor for tooltip
                                                  }}
                                                >
                                                  <Checkbox
                                                    checked={!!option.bIncluded}
                                                    disabled={
                                                      !checkboxOptionsEnabled
                                                    }
                                                    onChange={(e) =>
                                                      handleToggleInclude(
                                                        item.id,
                                                        option.id,
                                                        e.target.checked
                                                      )
                                                    }
                                                    sx={{
                                                      p: 0.5,
                                                      color: optionErrors[
                                                        option.id
                                                      ]
                                                        ? "error.main"
                                                        : "text.secondary",
                                                      transition:
                                                        "color 0.2s ease",
                                                    }}
                                                  />

                                                  {optionErrors[option.id] && (
                                                    <Box
                                                      sx={{
                                                        position: "absolute",
                                                        left: "calc(100% + 6px)", // 🔥 more robust than magic number
                                                        top: "50%",
                                                        transform:
                                                          "translateY(-50%)",
                                                        zIndex: 10,

                                                        backgroundColor:
                                                          "rgba(255,255,255,0.94)",
                                                        color: "error.main",
                                                        fontSize: "0.65rem",
                                                        lineHeight: 1.2,
                                                        px: 0.75,
                                                        py: 0.3,
                                                        borderRadius: 1,
                                                        boxShadow:
                                                          "0 2px 6px rgba(0,0,0,0.18)",
                                                        pointerEvents: "none",
                                                        whiteSpace: "nowrap",

                                                        /* animation */
                                                        animation:
                                                          "optionErrorFade 0.18s ease-out",

                                                        /* arrow */
                                                        "&::before": {
                                                          content: '""',
                                                          position: "absolute",
                                                          left: -4,
                                                          top: "50%",
                                                          transform:
                                                            "translateY(-50%)",
                                                          borderWidth: 4,
                                                          borderStyle: "solid",
                                                          borderColor:
                                                            "transparent rgba(255,255,255,0.94) transparent transparent",
                                                        },

                                                        /* keyframes */
                                                        "@keyframes optionErrorFade":
                                                          {
                                                            from: {
                                                              opacity: 0,
                                                              transform:
                                                                "translateY(-50%) scale(0.95)",
                                                            },
                                                            to: {
                                                              opacity: 1,
                                                              transform:
                                                                "translateY(-50%) scale(1)",
                                                            },
                                                          },
                                                      }}
                                                    >
                                                      {optionErrors[option.id]}
                                                    </Box>
                                                  )}
                                                </Box>

                                                <Typography
                                                  sx={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 500,
                                                  }}
                                                >
                                                  {index + 1}.{" "}
                                                  {option.supplierNickName ||
                                                    option.strSupplierNickName}
                                                </Typography>
                                              </Box>

                                              <ArrowDropDownIcon
                                                sx={{
                                                  fontSize: 22,
                                                  transform: expandedOptions[
                                                    option.id
                                                  ]
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                  transition: "0.25s",
                                                  cursor: "pointer",
                                                  mr: { xs: 0, lg: 4 },
                                                }}
                                                onClick={() =>
                                                  toggleOptionSpecs(option.id)
                                                }
                                              />
                                            </Box>

                                            {/* BRAND / MODEL */}
                                            <Box
                                              sx={{
                                                flex: 2,
                                                textAlign: "left",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "0.7rem",
                                                }}
                                              >
                                                {option.strBrand} |{" "}
                                                {option.strModel}
                                              </Typography>
                                            </Box>

                                            {/* QUANTITY */}
                                            <Box
                                              sx={{
                                                flex: 1,
                                                textAlign: "center",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "0.7rem",
                                                  color: optionErrors[option.id]
                                                    ? "red"
                                                    : "text.primary",
                                                  fontWeight: 400,
                                                }}
                                              >
                                                {option.nQuantity}
                                                <br />
                                                <span
                                                  style={{
                                                    fontSize: "0.75rem",
                                                    color: optionErrors[
                                                      option.id
                                                    ]
                                                      ? "red"
                                                      : "#666",
                                                  }}
                                                >
                                                  {option.strUOM}
                                                </span>
                                              </Typography>
                                            </Box>

                                            {/* UNIT PRICE */}
                                            <Box
                                              sx={{
                                                flex: 1.5,
                                                textAlign: "right",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "0.7rem",
                                                }}
                                              >
                                                ₱{" "}
                                                {Number(
                                                  option.dUnitPrice
                                                ).toLocaleString(undefined, {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </Typography>
                                            </Box>

                                            {/* EWT */}
                                            <Box
                                              sx={{
                                                flex: 1.5,
                                                textAlign: "right",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "0.7rem",
                                                }}
                                              >
                                                ₱{" "}
                                                {Number(
                                                  option.dEWT
                                                ).toLocaleString(undefined, {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </Typography>
                                            </Box>

                                            {/* TOTAL */}
                                            <Box
                                              sx={{
                                                flex: 1.5,
                                                textAlign: "right",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "0.7rem",
                                                  color: "text.primary",
                                                  fontWeight: 400,
                                                }}
                                              >
                                                ₱{" "}
                                                {(
                                                  option.nQuantity *
                                                  option.dUnitPrice
                                                ).toLocaleString(undefined, {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Paper>

                                        {/* SPECS DROPDOWN */}
                                        {expandedOptions[option.id] && (
                                          <Paper
                                            elevation={1}
                                            sx={{
                                              mt: 0,
                                              mb: isLastOption ? 0 : 1.5,
                                              background: "#f9f9f9",
                                              overflow: "hidden",
                                              borderTopLeftRadius: 0,
                                              borderTopRightRadius: 0,
                                              borderBottomLeftRadius: 8,
                                              borderBottomRightRadius: 8,
                                            }}
                                          >
                                            {/* SPECS HEADER + BODY */}
                                            <Box
                                              sx={{
                                                px: 2,
                                                py: 0.5,
                                                backgroundColor: "#e3f2fd",
                                                borderBottom:
                                                  "1px solid #cfd8dc",
                                                fontWeight: 400,
                                                color: "#1976d2",
                                                fontSize: "0.75rem",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                position: "relative",
                                                pl: 5, // indent the specs
                                              }}
                                            >
                                              {/* L connector */}
                                              <Box
                                                sx={{
                                                  position: "absolute",
                                                  left: 8, // horizontal offset from left
                                                  top: 0,
                                                  bottom: 0,
                                                  width: 16, // length of horizontal line
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                              >
                                                {/* vertical line */}
                                                <Box
                                                  sx={{
                                                    width: 1,
                                                    height: "100%",
                                                    backgroundColor: "#90caf9",
                                                  }}
                                                />
                                                {/* horizontal line */}
                                                <Box
                                                  sx={{
                                                    width: 16,
                                                    height: 1,
                                                    backgroundColor: "#90caf9",
                                                    ml: 0.5,
                                                  }}
                                                />
                                              </Box>

                                              <span>Specifications:</span>

                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  gap: 1,
                                                }}
                                              >
                                                <button
                                                  style={{
                                                    fontSize: "0.6rem",
                                                    background: "#fff",
                                                    border: "1px solid #cfd8dc",
                                                    cursor: "pointer",
                                                    color: "#1976d2",
                                                    fontWeight: 500,
                                                    borderRadius: "6px",
                                                    padding: "1px 8px",
                                                  }}
                                                  onClick={() =>
                                                    handleCompareClick(
                                                      item,
                                                      option
                                                    )
                                                  }
                                                >
                                                  Compare
                                                </button>
                                                <button
                                                  style={{
                                                    fontSize: "0.6rem",
                                                    background: "#fff",
                                                    border: "1px solid #cfd8dc",
                                                    cursor: "pointer",
                                                    color: "#1976d2",
                                                    fontWeight: 500,
                                                    borderRadius: "6px",
                                                    padding: "1px 8px",
                                                  }}
                                                  onClick={() =>
                                                    toggleOptionSpecs(option.id)
                                                  }
                                                >
                                                  Hide
                                                </button>
                                              </Box>
                                            </Box>

                                            <Box
                                              sx={{
                                                px: 2,
                                                pl: 7,
                                                py: 1,
                                                maxHeight: 140,
                                                overflowY: "auto",
                                                backgroundColor: "#f4faff",
                                                color: "text.secondary",
                                                fontSize: "0.8rem",
                                                "& *": {
                                                  backgroundColor:
                                                    "transparent !important",
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
                                                "& li": {
                                                  marginBottom: 0.25,
                                                },
                                                wordBreak: "break-word",
                                              }}
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  option.strSpecs ||
                                                  "No specifications available.",
                                              }}
                                            />
                                          </Paper>
                                        )}
                                      </React.Fragment>
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
              <>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-start",
                    overflowX: { xs: "auto", md: "visible" }, // scroll only on small screens
                  }}
                >
                  {/* ------------------- PARENT: ITEM INFO ------------------- */}
                  <Paper
                    sx={{
                      position: "relative",
                      flex: { xs: "0 0 300px", md: 1 }, // min-width 300px on small screens, full flex on large
                      minWidth: 300,
                      p: 1.5,
                      borderRadius: 3,
                      backgroundColor: "#F0F8FF",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      borderTop: "3px solid #115293",
                      borderBottom: "2px solid #ADD8E6",
                    }}
                  >
                    {/* Badge at top-right */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "#115293",
                        color: "#fff",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 3,
                        fontSize: "0.50rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Transaction Item
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Name:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {compareData.itemName}
                      </Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quantity:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {compareData.quantity}
                      </Box>{" "}
                      {compareData.uom}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      ABC:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        ₱{Number(compareData.abc).toLocaleString()}
                      </Box>
                    </Typography>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Specifications:
                      </Typography>

                      <FormGrid
                        fields={[
                          {
                            name: "specs",
                            label: "",
                            type: "textarea",
                            xs: 12,
                            multiline: true,
                            minRows: 2,
                            showOnlyHighlighter: true,
                            sx: {
                              "& textarea": {
                                resize: "vertical",
                                userSelect: "text",
                                pointerEvents: "auto",
                                backgroundColor: "#fafafa",
                                borderRadius: 2,
                              },
                            },
                          },
                        ]}
                        formData={{ specs: compareData.specs }}
                        handleChange={(e) => {
                          const newSpecs = e.target.value;

                          setCompareData((prev) => ({
                            ...prev,
                            specs: newSpecs, // update transaction item specs
                          }));

                          updateSpecsT(compareData.itemId, newSpecs);
                        }}
                        errors={{}}
                      />
                    </Box>
                  </Paper>

                  {/* ------------------- CHILD: PURCHASE OPTIONS ------------------- */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      flex: { xs: "0 0 300px", md: 1 }, // same as parent
                      minWidth: 300,
                    }}
                  >
                    {compareData.purchaseOptions.length > 0 ? (
                      compareData.purchaseOptions.map((option) => (
                        <Paper
                          key={option.supplierId}
                          sx={{
                            position: "relative",
                            flex: "1",
                            p: 1.5,
                            borderRadius: 3,
                            backgroundColor: "#F0FFF0",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0,
                            borderTop: "3px solid #28a745",
                            borderBottom: "2px solid #90EE90",
                          }}
                        >
                          {/* Badge at top-right */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              backgroundColor: "#28a745",
                              color: "#fff",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 3,
                              fontSize: "0.50rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            Purchase Option
                          </Box>
                          {/* Quantity, Unit Price */}
                          <Typography
                            variant="caption" // smaller than body2
                            color="text.secondary"
                          >
                            Model | Brand:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              {compareData.purchaseOptions[0].model}
                              {" | "}
                              {compareData.purchaseOptions[0].brand}
                            </Box>
                          </Typography>
                          {/* Quantity, Unit Price */}
                          <Typography
                            variant="caption" // smaller than body2
                            color="text.secondary"
                          >
                            Quantity:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              {option.quantity}
                            </Box>{" "}
                            {option.uom} | Unit Price:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              ₱{option.unitPrice.toLocaleString()}
                            </Box>
                          </Typography>

                          {/* Total Price, EWT */}
                          <Typography variant="caption" color="text.secondary">
                            Total Price:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              ₱
                              {(
                                option.quantity * option.unitPrice
                              ).toLocaleString()}
                            </Box>{" "}
                            | EWT:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              ₱{option.ewt?.toLocaleString() || 0}
                            </Box>
                          </Typography>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              Specifications:
                            </Typography>

                            <FormGrid
                              fields={[
                                {
                                  name: "specs",
                                  label: "",
                                  type: "textarea",
                                  xs: 12,
                                  multiline: true,
                                  minRows: 2,
                                  showOnlyHighlighter: true,
                                  sx: {
                                    "& textarea": {
                                      resize: "vertical",
                                      userSelect: "text",
                                      pointerEvents: "auto",
                                      backgroundColor: "#fafafa",
                                      borderRadius: 2,
                                    },
                                  },
                                },
                              ]}
                              formData={{ specs: option.specs }}
                              handleChange={(e) => {
                                const newSpecs = e.target.value;
                                // Update local compareData state
                                setCompareData((prev) => ({
                                  ...prev,
                                  purchaseOptions: prev.purchaseOptions.map(
                                    (po) =>
                                      po.nPurchaseOptionId ===
                                      option.nPurchaseOptionId
                                        ? { ...po, specs: newSpecs }
                                        : po
                                  ),
                                }));
                                // Call API to persist the change
                                updateSpecs(option.nPurchaseOptionId, newSpecs);
                              }}
                              errors={{}}
                              readonly
                            />
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#fff",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No purchase options available
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    </PageLayout>
  );
}

export default MTransactionCanvas;
