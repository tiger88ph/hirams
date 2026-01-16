import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, Button, Divider } from "@mui/material";
import ModalContainer from "../hirams-frontend/src/components/common/ModalContainer";
import {
  AssignAccountOfficerButton,
  ReassignAccountOfficerButton,
  VerifyButton,
  RevertButton1,
  BackButton,
} from "../hirams-frontend/src/components/common/Buttons";
import RemarksModalCard from "../hirams-frontend/src/components/common/RemarksModalCard";
import AssignModalCard from "../hirams-frontend/src/components/common/AssignModalCard";
import api from "../hirams-frontend/src/utils/api/api";
import useMapping from "../hirams-frontend/src/utils/mappings/useMapping";
import { showSwal, withSpinner } from "../hirams-frontend/src/utils/swal";
import TransactionDetails from "../hirams-frontend/src/components/common/TransactionDetails";
import AlertBox from "../hirams-frontend/src/components/common/AlertBox";
import messages from "../hirams-frontend/src/utils/messages/messages";
import FormGrid from "../hirams-frontend/src/components/common/FormGrid";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTransactionItem from "../../../account-officer/SortableTransactionItem";

function TransactionInfoModal({
  open,
  onClose,
  transaction,
  onUpdated,
  selectedStatusCode,
}) {
  // -------------------------
  // State Declarations
  // -------------------------
  const [showAssignAO, setShowAssignAO] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    nAssignedAO: "",
    dtAODueDate: "",
  });
  const [assignErrors, setAssignErrors] = useState({});
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [remarksAssign, setRemarksAssign] = useState("");
  const [remarksVerify, setRemarksVerify] = useState("");
  const [remarksRevert, setRemarksRevert] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReassignAO, setShowReassignAO] = useState(false);
  const [showReassignConfirm, setShowReassignConfirm] = useState(false);
  const [remarksReassign, setRemarksReassign] = useState("");
  const [items, setItems] = useState([]);
  const [cItemType, setCItemType] = useState("");
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [newItemForm, setNewItemForm] = useState({});
  const [selectedAOName, setSelectedAOName] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [isCompareActive, setIsCompareActive] = useState(false);

  const fields = [];
  const showAddButton = false;
  const isNotVisibleCanvasVerification = false;

  // -------------------------
  // Mapping / Constants
  // -------------------------
  const {
    procMode,
    procSource,
    itemType,
    transacstatus, //filter
    statusTransaction, //real
    clientstatus,
    userTypes,
  } = useMapping();

  const status_code = String(transaction?.current_status);
  const statusCode = selectedStatusCode;
  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const draftKey = Object.keys(transacstatus)[0] || "";
  const finalizeKey = Object.keys(transacstatus)[1] || "";
  const forAssignmentKey = Object.keys(transacstatus)[2] || "";
  const itemsManagementKey = Object.keys(transacstatus)[3] || "";
  const itemsVerificationKey = Object.keys(transacstatus)[4] || "";
  const forCanvasKey = Object.keys(transacstatus)[5] || "";
  const canvasVerificationKey = Object.keys(transacstatus)[6] || "";
  const priceVerificationKey = Object.keys(transacstatus)[8] || "";
  const managementKey = (Object.keys(userTypes)[1] || Object.keys(userTypes)[4]) || "";


  const showRevert = !draftKey.includes(statusCode); //showing revert button
  const showVerify = finalizeKey.includes(statusCode); //show verify button
  const showVerifyItems = itemsVerificationKey.includes(statusCode);
  const showVerifyCanvas =
    canvasVerificationKey.includes(statusCode) && !isCompareActive;
  const showVerifyPrice = priceVerificationKey.includes(statusCode);
  const showCanvassing =
    itemsVerificationKey.includes(statusCode) ||
    canvasVerificationKey.includes(status_code) ||
    priceVerificationKey.includes(statusCode);
  const showForAssignment = forAssignmentKey.includes(statusCode);
  const showTransactionDetails =
    itemsManagementKey.includes(status_code) ||
    itemsVerificationKey.includes(status_code) ||
    forCanvasKey.includes(status_code) ||
    canvasVerificationKey.includes(status_code);
  const showPurchaseOptions = canvasVerificationKey.includes(statusCode);
  const checkboxOptionsEnabled = !forCanvasKey.includes(statusCode);
  const crudOptionsEnabled = forCanvasKey.includes(statusCode);

  const procSourceLabel =
    procSource?.[transaction?.cProcSource] || transaction?.cProcSource;

  // -------------------------
  // Fetchers
  // -------------------------
  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;
    try {
      setLoading(true);
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`
      );
      setItems(res.items || []);
      setCItemType(res.cItemType);
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isCompareActive) {
      fetchItems();
    }
  }, [isCompareActive]);

  useEffect(() => {
    if (!open) return;
    fetchItems();
  }, [open]);
  useEffect(() => {
    if (!open) return;

    const fetchAccountOfficers = async () => {
      try {
        const res = await api.get("users");
        const users = res?.users || res?.data?.users || res?.data || [];

        const filtered = users.filter(
          (u) => u.cUserType === activeKey && u.cStatus === activeKey
        );
        const formatted = filtered.map((u) => ({
          label: `${u.strFName} ${u.strLName}`,
          value: u.nUserId,
        }));

        setAccountOfficers(formatted);
      } catch (err) {
        console.error("Error fetching Account Officers:", err);
      }
    };

    fetchAccountOfficers();
  }, [open, activeKey]); // <-- IMPORTANT

  if (!open || !transaction) return null;
  const details = transaction;

  // -------------------------
  // Date / Formatting Utils
  // -------------------------
  const pad = (n) => (n < 10 ? "0" + n : n);
  const formatLocalDateTime = (date) => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const submissionMax = details.dtDocSubmission
    ? new Date(details.dtDocSubmission).toISOString().slice(0, 16)
    : null;

  // -------------------------
  // DnD Setup
  // -------------------------
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const togglePurchaseOptions = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    setAddingOptionItemId(null);
  };

  // -------------------------
  // Assign / Reassign Handlers
  // -------------------------
  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    if (name === "nAssignedAO") {
      setAssignForm((prev) => ({ ...prev, nAssignedAO: value }));
      const selected = accountOfficers.find((ao) => ao.value === value);
      setSelectedAOName(selected ? selected.label : "");
      return;
    }
    if (name === "dtAODueDate") {
      const picked = new Date(value);
      const submissionDate = details.dtDocSubmission
        ? new Date(details.dtDocSubmission)
        : null;
      if (submissionDate && picked >= submissionDate) {
        setAssignErrors({
          dtAODueDate: "AO Due Date cannot exceed Document Submission Date",
        });
        setAssignForm((prev) => ({
          ...prev,
          dtAODueDate: formatLocalDateTime(submissionDate),
        }));
        return;
      }
      setAssignErrors({});
      setAssignForm((prev) => ({ ...prev, dtAODueDate: value }));
      return;
    }
  };

  const handleAssignClick = () => {
    const now = new Date();
    const submissionDate = details.dtDocSubmission
      ? new Date(details.dtDocSubmission)
      : null;
    let initialDueDate = now;
    if (submissionDate && now > submissionDate) initialDueDate = submissionDate;
    setAssignForm({
      nAssignedAO: "",
      dtAODueDate: formatLocalDateTime(initialDueDate),
    });
    setRemarksAssign("");
    setShowAssignAO(true);
  };

  const handleReassignClick = () => {
    const submissionDate = details.dtDocSubmission
      ? new Date(details.dtDocSubmission)
      : null;
    const currentDueDate = details.dtAODueDate
      ? new Date(details.dtAODueDate)
      : null;
    let initialDueDate = currentDueDate;
    if (
      !currentDueDate ||
      (submissionDate && currentDueDate >= submissionDate)
    ) {
      const now = new Date();
      initialDueDate =
        submissionDate && now >= submissionDate ? submissionDate : now;
    }
    setAssignForm({
      nAssignedAO: details.nAssignedAO || "",
      dtAODueDate: formatLocalDateTime(initialDueDate),
    });
    const selectedAO = accountOfficers.find(
      (ao) => ao.value === details.nAssignedAO
    );
    setSelectedAOName(selectedAO ? selectedAO.label : "");
    setRemarksReassign("");
    setShowReassignAO(true);
  };

  const handleBackClick = () => {
    setShowAssignAO(false);
    setShowConfirm(false);
    setRemarksAssign("");
  };

  const handleBackReassign = () => {
    setShowReassignAO(false);
    setShowReassignConfirm(false);
    setRemarksReassign("");
  };
  // Handle quantity/unitPrice changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      const selectedSupplier = suppliers.find(
        (s) => s.value === Number(newData.nSupplierId)
      );
      newData.ewt = calculateEWT(
        newData.quantity,
        newData.unitPrice,
        selectedSupplier,
        cItemType,
        itemTypeGoods,
        goodsValue,
        serviceValue,
        vatValue
      );

      return newData;
    });
  };
  const handleSaveAOCommon = (isReassign = false) => {
    const { nAssignedAO, dtAODueDate } = assignForm;
    if (!nAssignedAO || !dtAODueDate) return;

    if (details.dtDocSubmission) {
      const submissionDate = new Date(details.dtDocSubmission);
      const aoDueDate = new Date(dtAODueDate);

      if (aoDueDate > submissionDate) {
        setAssignErrors({
          dtAODueDate: `AO Due Date must not be greater than Document Submission Date`,
        });
        return;
      }
    }

    setAssignErrors({});
    isReassign ? setShowReassignConfirm(true) : setShowConfirm(true);
  };

  const assignAOFields = [
    {
      name: "nAssignedAO",
      label: "Account Officer",
      type: "select",
      xs: 12,
      options: accountOfficers,
    },
    {
      name: "dtAODueDate",
      label: `AO DueDate`,
      type: "datetime-local",
      max: submissionMax,
      xs: 12,
    },
  ];
  // -------------------------
  // Verify / Revert Handlers
  // -------------------------
  const handleVerifyClick = () => {
    setRemarksVerify("");
    setShowVerifyConfirm(true);
  };

  const handleRevertClick = () => {
    setRemarksRevert("");
    setShowRevertConfirm(true);
  };

  const confirmAssignAO = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";
    try {
      onClose();
      await withSpinner(entity, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/assign`, {
          nAssignedAO: assignForm.nAssignedAO,
          dtAODueDate: assignForm.dtAODueDate,
          user_id: user?.nUserId,
          remarks: remarksAssign.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "assigned" });
      onUpdated?.();
      setShowAssignAO(false);
      setShowConfirm(false);
      setRemarksAssign("");
    } catch (error) {
      console.error("❌ Error assigning AO:", error);
      await showSwal("ERROR", {}, { entity });
    }
  };

  const confirmReassignAO = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";
    try {
      onClose();
      await withSpinner(entity, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/assign`, {
          nAssignedAO: assignForm.nAssignedAO,
          dtAODueDate: assignForm.dtAODueDate,
          user_id: user?.nUserId,
          remarks: remarksReassign.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "reassigned" });
      onUpdated?.();
      setShowReassignAO(false);
      setShowReassignConfirm(false);
      setRemarksReassign("");
    } catch (error) {
      console.error("❌ Error reassigning AO:", error);
      await showSwal("ERROR", {}, { entity });
    }
  };

  const confirmVerifyTransaction = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";
    try {
      onClose();
      await withSpinner(entity, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        let endpoint = `transactions/${transaction.nTransactionId}/verify`;
        let payload = {
          userId: user?.nUserId,
          remarks: remarksVerify.trim() || null,
        };
        if (itemsVerificationKey.includes(statusCode)) {
          endpoint = `transactions/${transaction.nTransactionId}/verify-ao`;
        } else if (canvasVerificationKey.includes(statusCode)) {
          endpoint = `transactions/${transaction.nTransactionId}/verify-ao-canvas`;
        }
        await api.put(endpoint, payload);
      });
      await showSwal("SUCCESS", {}, { entity, action: "verified" });
      onUpdated?.();
      setShowVerifyConfirm(false);
      setRemarksVerify("");
    } catch (error) {
      console.error("❌ Error verifying transaction:", error);
      await showSwal("ERROR", {}, { entity });
    }
  };

  const confirmRevertTransaction = async () => {
    const entity = details.strTitle || details.transactionName;
    try {
      onClose();
      await withSpinner(entity, async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        await api.put(`transactions/${transaction.nTransactionId}/revert`, {
          userId: user?.nUserId,
          remarks: remarksRevert.trim() || null,
        });
      });
      await showSwal("SUCCESS", {}, { entity, action: "reverted" });
      onUpdated?.();
      setShowRevertConfirm(false);
      setRemarksRevert("");
    } catch (error) {
      console.error("❌ Error reverting transaction:", error);
      await showSwal("ERROR", {}, { entity });
    }
  };

  const getHeaderTitle = () => {
    if (showVerifyConfirm) return "Verify Transaction";
    if (showRevertConfirm) return "Revert Transaction";
    if (showConfirm || showAssignAO) return "Assign Account Officer";
    return "Transaction Details";
  };
  const handleCompareClick = (item, selectedOption) => {
    setCompareData(null);

    const data = {
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
    setCompareData(data);
    setIsCompareActive(true);
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

  // -------------------------
  // Return JSX
  // -------------------------
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={getHeaderTitle()}
      subTitle={details.strCode?.trim() || ""}
      showSave={false}
      customLoading={loading}
      width={isCompareActive ? 950 : 800}
    >
      <Box>
        {showReassignConfirm && (
          <RemarksModalCard
            remarks={remarksReassign}
            setRemarks={setRemarksReassign}
            onBack={handleBackReassign}
            onSave={confirmReassignAO}
            actionWord="reassingning"
            entityName={details.strTitle || details.transactionName}
            selectedAOName={selectedAOName}
            saveButtonColor="success"
            saveButtonText="Confirm Reassign"
          />
        )}
        {/* REASSIGN FORM */}
        {showReassignAO && !showReassignConfirm && (
          <AssignModalCard
            mode="Reassign"
            details={details}
            assignForm={assignForm}
            assignErrors={assignErrors}
            assignAOFields={assignAOFields}
            handleAssignChange={handleAssignChange}
            onBack={handleBackReassign}
            onSave={() => handleSaveAOCommon(true)}
          />
        )}
        {/* REMARKS MODALS */}
        {showVerifyConfirm && (
          <RemarksModalCard
            remarks={remarksVerify}
            setRemarks={setRemarksVerify}
            onBack={() => {
              setShowVerifyConfirm(false);
            }}
            onSave={confirmVerifyTransaction}
            actionWord="verifying"
            entityName={transaction.strTitle}
            saveButtonColor="success"
            saveButtonText="Confirm Verify"
          />
        )}
        {showRevertConfirm && (
          <RemarksModalCard
            remarks={remarksRevert}
            setRemarks={setRemarksRevert}
            onBack={() => {
              setShowRevertConfirm(false);
            }}
            onSave={confirmRevertTransaction}
            actionWord="reverting"
            entityName={details.transactionName}
            saveButtonColor="success"
            saveButtonText="Confirm Revert"
          />
        )}
        {showConfirm && (
          <RemarksModalCard
            remarks={remarksAssign}
            setRemarks={setRemarksAssign}
            onBack={() => setShowConfirm(false)}
            onSave={confirmAssignAO}
            actionWord="assigning"
            entityName={details.transactionName}
            selectedAOName={selectedAOName}
            saveButtonColor="success"
            saveButtonText="Confirm Assignment"
          />
        )}
        {/* ASSIGN AO FORM */}
        {showAssignAO &&
          !showConfirm &&
          !showVerifyConfirm &&
          !showRevertConfirm && (
            <AssignModalCard
              mode="Assign"
              details={details}
              assignForm={assignForm}
              assignErrors={assignErrors}
              assignAOFields={assignAOFields}
              handleAssignChange={handleAssignChange}
              onBack={handleBackClick}
              onSave={() => handleSaveAOCommon(false)}
            />
          )}
        {/* MAIN DETAILS VIEW */}
        {!showAssignAO &&
          !showConfirm &&
          !showVerifyConfirm &&
          !showRevertConfirm &&
          !showReassignAO &&
          !showReassignConfirm && (
            <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
              {!showCanvassing && (
                <TransactionDetails
                  details={details}
                  statusTransaction={statusTransaction}
                  itemType={itemType}
                  procMode={procMode}
                  procSourceLabel={procSourceLabel}
                  showTransactionDetails={showTransactionDetails}
                />
              )}
              {showCanvassing && !isCompareActive && (
                <>
                  <AlertBox>
                    <Grid container spacing={0.5}>
                      {/* Row 1: Transaction Code | ABC */}
                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>Transaction Code:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{ textAlign: "left", fontStyle: "italic" }}
                      >
                        {transaction.strCode ||
                          transaction.transactionId ||
                          "—"}
                      </Grid>

                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>ABC:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{ textAlign: "left", fontStyle: "italic" }}
                      >
                        {transaction.dTotalABC
                          ? `₱${Number(transaction.dTotalABC).toLocaleString()}`
                          : "—"}
                      </Grid>

                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>Title:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{
                          textAlign: "left",
                          fontStyle: "italic",
                          wordBreak: "break-word",
                          lineHeight: 1.2,
                          whiteSpace: "normal",
                          overflowWrap: "break-word", // ensures long words wrap
                        }}
                      >
                        {transaction.strTitle ||
                          transaction.transactionName ||
                          "—"}
                      </Grid>

                      {/* Row 3: AO DueDate | Doc Submission */}
                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>AO DueDate:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{
                          textAlign: "left",
                          fontStyle: "italic",
                          color:
                            transaction.dtAODueDate &&
                            (new Date(transaction.dtAODueDate) - new Date()) /
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

                      <Grid item xs={5} sx={{ textAlign: "left" }}>
                        <strong>Doc Submission:</strong>
                      </Grid>
                      <Grid
                        item
                        xs={7}
                        sx={{
                          textAlign: "left",
                          fontStyle: "italic",
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
                  </AlertBox>
                  <Grid item xs={12} md={6}>
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

                    {items.length === 0 ? (
                      <Box
                        sx={{
                          height: 200,
                          border: "1px dashed #bbb",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "text.secondary",
                        }}
                      >
                        <Typography>No items added yet</Typography>
                      </Box>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.map((item) => (
                            <SortableTransactionItem
                              key={item.id}
                              item={item}
                              showAddButton={showAddButton}
                              showPurchaseOptions={showPurchaseOptions}
                              isNotVisibleCanvasVerification={
                                isNotVisibleCanvasVerification
                              }
                              expandedItemId={expandedItemId}
                              togglePurchaseOptions={togglePurchaseOptions}
                              addingOptionItemId={addingOptionItemId}
                              setAddingOptionItemId={setAddingOptionItemId}
                              formData={formData}
                              handleChange={handleChange}
                              handleCompareClick={handleCompareClick}
                              setExpandedItemId={setExpandedItemId}
                              fields={fields}
                              crudOptionsEnabled={crudOptionsEnabled}
                              checkboxOptionsEnabled={checkboxOptionsEnabled}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </Grid>
                </>
              )}
              {isCompareActive && compareData && (
                <>
                  <AlertBox>
                    Comparison of the transaction{" "}
                    <strong>
                      <em>"{compareData.itemName}"</em>
                    </strong>{" "}
                    with the offer model{" ("}
                    <strong>
                      <em>{compareData.purchaseOptions[0].model}</em>
                    </strong>{") "}
                    and brand{" ("}
                    <strong>
                      <em>{compareData.purchaseOptions[0].brand}</em>
                    </strong>{") "}
                    from{" "}
                    <strong>
                      <em>"{compareData.purchaseOptions[0]?.supplierName}"</em>
                    </strong>
                    .
                  </AlertBox>
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
                                backgroundColor: "#28a745 ",
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
                              Quantity:{" "}
                              <Box component="span" sx={{ fontWeight: 600 }}>
                                {option.quantity}
                              </Box>{" "}
                              {option.uom} • Unit Price:{" "}
                              <Box component="span" sx={{ fontWeight: 600 }}>
                                ₱{option.unitPrice.toLocaleString()}
                              </Box>
                            </Typography>

                            {/* Total Price, EWT */}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Total Price:{" "}
                              <Box component="span" sx={{ fontWeight: 600 }}>
                                ₱
                                {(
                                  option.quantity * option.unitPrice
                                ).toLocaleString()}
                              </Box>{" "}
                              • EWT:{" "}
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
                                  updateSpecs(
                                    option.nPurchaseOptionId,
                                    newSpecs
                                  );
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
              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 2,
                  gap: 2,
                }}
              >
                {isCompareActive && (
                  <BackButton
                    label="Back"
                    onClick={() => {
                      setIsCompareActive(false); // hide after
                    }}
                  />
                )}
                {(showVerify ||
                  showVerifyItems ||
                  showVerifyCanvas ||
                  showVerifyPrice) && (
                  <VerifyButton onClick={handleVerifyClick} />
                )}
                {/* Assign / Reassign AO buttons */}
                {showForAssignment && !details.nAssignedAO && (
                  <AssignAccountOfficerButton onClick={handleAssignClick} />
                )}

                {/* Show Reassign button only if assigned AO exists AND selected filter is For Assignment */}
                {details.nAssignedAO &&
                  forAssignmentKey.includes(selectedStatusCode) && (
                    <ReassignAccountOfficerButton
                      onClick={handleReassignClick}
                    />
                  )}

                {showRevert && <RevertButton1 onClick={handleRevertClick} />}
              </Box>
            </Paper>
          )}
      </Box>
    </ModalContainer>
  );
}

export default React.memo(TransactionInfoModal);
