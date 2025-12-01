import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, Button, Divider } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import {
  AssignAccountOfficerButton,
  ReassignAccountOfficerButton,
  VerifyButton,
  RevertButton1,
} from "../../../../common/Buttons";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import AssignModalCard from "../../../../common/AssignModalCard";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import TransactionDetails from "../../../../common/TransactionDetails";
import AlertBox from "../../../../common/AlertBox";
import messages from "../../../../../utils/messages/messages";
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

  const fields = [];
  const showAddButton = false;
  const isNotVisibleCanvasVerification = false;

  // -------------------------
  // Mapping / Constants
  // -------------------------
  const {
    draftCode,
    finalizeCode,
    forAssignmentCode,
    itemsManagementCode,
    itemsVerificationCode,
    forCanvasCode,
    canvasVerificationCode,
    priceVerificationCode,
    priceApprovalCode,
    procMode,
    procSource,
    itemType,
    statusTransaction,
  } = useMapping();

  const status_code = String(transaction?.current_status);
  const statusCode = selectedStatusCode;

  const showRevert = !Object.keys(draftCode).includes(statusCode);
  const showVerify = Object.keys(finalizeCode).includes(statusCode);
  const showVerifyItems = Object.keys(itemsVerificationCode).includes(
    statusCode
  );
  const showVerifyCanvas = Object.keys(canvasVerificationCode).includes(
    statusCode
  );
  const showVerifyPrice = Object.keys(priceVerificationCode).includes(
    statusCode
  );
  const showCanvassing =
    Object.keys(itemsVerificationCode).includes(statusCode) ||
    Object.keys(forCanvasCode).includes(statusCode) ||
    Object.keys(canvasVerificationCode).includes(statusCode);
  const showForAssignment = Object.keys(forAssignmentCode).includes(statusCode);
  const showTransactionDetails =
    Object.keys(itemsManagementCode).includes(status_code) ||
    Object.keys(itemsVerificationCode).includes(status_code) ||
    Object.keys(forCanvasCode).includes(status_code) ||
    Object.keys(canvasVerificationCode).includes(status_code);
  const showPurchaseOptions = Object.keys(canvasVerificationCode).includes(
    statusCode
  );

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
    if (!open) return;
    fetchItems();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchAccountOfficers = async () => {
      try {
        const res = await api.get("users");
        const users = res?.users || res?.data?.users || res?.data || [];
        const formatted = users
          .filter((u) => u.cUserType === "A")
          .map((u) => ({
            label: `${u.strFName} ${u.strLName}`,
            value: u.nUserId,
          }));
        setAccountOfficers(formatted);
      } catch (err) {
        console.error("Error fetching Account Officers:", err);
      }
    };
    fetchAccountOfficers();
  }, [open]);

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
        if (Object.keys(itemsVerificationCode).includes(statusCode)) {
          endpoint = `transactions/${transaction.nTransactionId}/verify-ao`;
        } else if (Object.keys(canvasVerificationCode).includes(statusCode)) {
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
      width={850}
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
            onBack={() => setShowVerifyConfirm(false)}
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
            onBack={() => setShowRevertConfirm(false)}
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
              {showCanvassing && (
                <>
                  <AlertBox>
                    <Grid container spacing={2}>
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
                              savePurchaseOption={savePurchaseOption}
                              handleEditOption={handleEditOption}
                              handleDeleteOption={handleDeleteOption}
                              handleToggleInclude={handleToggleInclude}
                              onEdit={(item) => {
                                setEditingItem(item);
                                setAddingNewItem(true);
                                setNewItemForm({
                                  name: item.name,
                                  specs: item.specs,
                                  qty: item.qty,
                                  uom: item.uom,
                                  abc: item.abc,
                                });
                              }}
                              setExpandedItemId={setExpandedItemId}
                              fields={fields}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </Grid>
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
                  Object.keys(forAssignmentCode).includes(
                    selectedStatusCode
                  ) && (
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
