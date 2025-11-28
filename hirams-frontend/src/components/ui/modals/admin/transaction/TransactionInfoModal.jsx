import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, Button, Divider } from "@mui/material";
import ModalContainer from "../../../../common/ModalContainer";
import {
  AssignAccountOfficerButton,
  ReassignAccountOfficerButton,
  VerifyButton,
  RevertButton1,
} from "../../../../common/Buttons";
import FormGrid from "../../../../common/FormGrid";
import RemarksModalCard from "../../../../common/RemarksModalCard";
import api from "../../../../../utils/api/api";
import useMapping from "../../../../../utils/mappings/useMapping";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { showSwal, withSpinner } from "../../../../../utils/swal";
import TransactionDetails from "../../../../common/TransactionDetails";
import AlertBox from "../../../../common/AlertBox";
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
  // ---------------------------------------------------------
  // FETCH ITEMS
  // ---------------------------------------------------------
  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;
    try {
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`
      );
      setItems(res.items || []);
      setCItemType(res.cItemType); // ⬅️ SAVE IT HERE
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    }
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open, transaction]);

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
  // --- Finalize Visibility Logic ---
  const statusCode = String(details.current_status);
  // A transaction is FINALIZABLE if its status code exists inside finalizeCode object
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
    // Object.keys(itemsManagementCode).includes(statusCode) ||
    Object.keys(itemsVerificationCode).includes(statusCode) ||
     Object.keys(forCanvasCode).includes(statusCode) ||
    Object.keys(canvasVerificationCode).includes(statusCode);
  const showForAssignment = Object.keys(forAssignmentCode).includes(statusCode);
  const showTransactionDetails =
    Object.keys(itemsManagementCode).includes(statusCode) ||
    Object.keys(itemsVerificationCode).includes(statusCode) ||
    Object.keys(forCanvasCode).includes(statusCode) ||
    Object.keys(canvasVerificationCode).includes(statusCode);
  const showPurchaseOptions = Object.keys(canvasVerificationCode).includes(
    statusCode
  );
  const confirmVerifyTransaction = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();

      await withSpinner("Verifying Transaction...", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        let endpoint = `transactions/${transaction.nTransactionId}/verify`;
        let payload = {
          userId: user?.nUserId,
          remarks: remarksVerify.trim() || null,
        };

        // Check if statusCode exists in mapping objects
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
    } finally {
      setLoading(false);
    }
  };

  const submissionMax = details.dtDocSubmission
    ? new Date(details.dtDocSubmission).toISOString().slice(0, 16)
    : null;
  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Drag handler (optional if you want drag-sortable)
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  // These are placeholders; replace with actual implementations if needed
  const showAddButton = false;
  const isNotVisibleCanvasVerification = false;
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);
  const [formData, setFormData] = useState({});
  const handleChange = () => {};
  const savePurchaseOption = () => {};
  const handleEditOption = () => {};
  const handleDeleteOption = () => {};
  const handleToggleInclude = () => {};
  const [editingItem, setEditingItem] = useState(null);
  const [newItemForm, setNewItemForm] = useState({});
  const fields = [];
  const togglePurchaseOptions = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    setAddingOptionItemId(null);
  };
  // Add this state
  const [selectedAOName, setSelectedAOName] = useState("");
  // Update handleAssignChange to also store the AO name
  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));

    if (name === "nAssignedAO") {
      const selected = accountOfficers.find((ao) => ao.value === value);
      setSelectedAOName(selected ? selected.label : "");
    }
  };
  const handleAssignClick = () => {
    // set current date/time in proper format
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    setAssignForm({ nAssignedAO: "", dtAODueDate: formattedNow });

    // Keep remarks empty
    setRemarksAssign("");

    setShowAssignAO(true);
  };
  const handleVerifyClick = () => {
    setRemarksVerify("");
    setShowVerifyConfirm(true);
  };
  const handleRevertClick = () => {
    setRemarksRevert("");
    setShowRevertConfirm(true);
  };
  const handleReassignClick = () => {
    const now = new Date();
    const submissionDate = details.dtDocSubmission
      ? new Date(details.dtDocSubmission)
      : null;

    let dueDateToUse = now;

    // If now > submission date → use submission date instead
    if (submissionDate && now > submissionDate) {
      dueDateToUse = submissionDate;
    }

    // Format to yyyy-MM-ddTHH:mm for input[type=datetime-local]
    const formattedDueDate = dueDateToUse.toISOString().slice(0, 16);

    setAssignForm({
      nAssignedAO: details.nAssignedAO || "",
      dtAODueDate: formattedDueDate,
    });

    const selectedAO = accountOfficers.find(
      (ao) => ao.value === details.nAssignedAO
    );
    setSelectedAOName(selectedAO ? selectedAO.label : "");

    setRemarksReassign("");
    setShowReassignAO(true);
  };

  const handleBackReassign = () => {
    setShowReassignAO(false);
    setShowReassignConfirm(false);
    setRemarksReassign("");
  };
  const confirmReassignAO = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();
      await withSpinner("Reassigning Account Officer...", async () => {
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
    } finally {
      setLoading(false);
    }
  };
  const handleBackClick = () => {
    setShowAssignAO(false);
    setShowConfirm(false);
    setRemarksAssign("");
  };
  const handleSaveAO = () => {
    const { nAssignedAO, dtAODueDate } = assignForm;
    if (!nAssignedAO || !dtAODueDate) return;

    if (details.dtDocSubmission) {
      const submissionDate = new Date(details.dtDocSubmission);
      const aoDueDate = new Date(dtAODueDate);

      // Calculate 4 days before submission
      const maxDueDate = new Date(submissionDate);
      maxDueDate.setDate(submissionDate.getDate());

      if (aoDueDate > maxDueDate) {
        setAssignErrors({
          dtAODueDate: `AO Due Date must not greater than Document Submission Date`,
        });
        return;
      }
    }

    setAssignErrors({});
    setShowConfirm(true);
  };
  const handleSaveReassign = () => {
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
    setShowReassignConfirm(true);
  };

  const confirmAssignAO = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";

    try {
      setLoading(true);
      onClose();
      await withSpinner("Assigning Account Officer...", async () => {
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
    } finally {
      setLoading(false);
    }
  };
  const confirmRevertTransaction = async () => {
    const entity = details.strTitle || details.transactionName || "Transaction";
    try {
      setLoading(true);
      onClose();
      await withSpinner("Reverting Transaction...", async () => {
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
    } finally {
      setLoading(false);
    }
  };
  const getHeaderTitle = () => {
    if (showVerifyConfirm) return "Verify Transaction";
    if (showRevertConfirm) return "Revert Transaction";
    if (showConfirm || showAssignAO) return "Assign Account Officer";
    return "Transaction Details";
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
      max: submissionMax, // ← ADD THIS
      xs: 12,
    },
  ];
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={getHeaderTitle()}
      subTitle={details.strCode?.trim() || ""}
      showSave={false}
      loading={loading}
    >
      <Box>
        {showReassignConfirm && (
          <RemarksModalCard
            remarks={remarksReassign}
            setRemarks={setRemarksReassign}
            onBack={handleBackReassign}
            onSave={confirmReassignAO}
            title={`Remarks for reassigning "${details.strTitle || details.transactionName}" to "${selectedAOName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="success"
            saveButtonText="Confirm Reassignment"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {/* REASSIGN FORM */}
        {showReassignAO && !showReassignConfirm && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
              Reassign an Account Officer
            </Typography>

            {/* Submission Date */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 100,
                fontSize: "0.675rem",
                lineHeight: 0.8,
                fontStyle: "italic",
                color: "text.primary",
                mb: 3,
              }}
            >
              {" "}
              Doc. Submission:{" "}
              {details.dtDocSubmission
                ? new Date(details.dtDocSubmission).toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "No submission date"}
            </Typography>
            <FormGrid
              fields={assignAOFields}
              formData={assignForm}
              errors={assignErrors}
              handleChange={handleAssignChange}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
                gap: 1.5,
              }}
            >
              <Button variant="outlined" onClick={handleBackReassign}>
                Back
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSaveReassign}
                disabled={!assignForm.nAssignedAO || !assignForm.dtAODueDate}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}
        {/* REMARKS MODALS */}
        {showVerifyConfirm && (
          <RemarksModalCard
            remarks={remarksVerify}
            setRemarks={setRemarksVerify}
            onBack={() => setShowVerifyConfirm(false)}
            onSave={confirmVerifyTransaction}
            title={`Remarks for verifying "${details.strTitle || details.transactionName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="success"
            saveButtonText="Confirm Verification"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {showRevertConfirm && (
          <RemarksModalCard
            remarks={remarksRevert}
            setRemarks={setRemarksRevert}
            onBack={() => setShowRevertConfirm(false)}
            onSave={confirmRevertTransaction}
            title={`Remarks for reverting "${details.strTitle || details.transactionName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="error"
            saveButtonText="Confirm Revert"
            icon={
              <WarningAmberRoundedIcon color="error" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {showConfirm && (
          <RemarksModalCard
            remarks={remarksAssign}
            setRemarks={setRemarksAssign}
            onBack={() => setShowConfirm(false)}
            onSave={confirmAssignAO}
            title={`Remarks for assigning "${details.strTitle || details.transactionName}" to "${selectedAOName}"`}
            placeholder="Optional: Add Remarks"
            saveButtonColor="success"
            saveButtonText="Confirm Assignment"
            icon={
              <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48 }} />
            }
          />
        )}
        {/* ASSIGN AO FORM */}
        {showAssignAO &&
          !showConfirm &&
          !showVerifyConfirm &&
          !showRevertConfirm && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                Assign an Account Officer
              </Typography>

              {/* Submission Date */}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 100,
                  fontSize: "0.675rem",
                  lineHeight: 0.8,
                  fontStyle: "italic",
                  color: "text.primary",
                  mb: 3,
                }}
              >
                {" "}
                Doc. Submission:{" "}
                {details.dtDocSubmission
                  ? new Date(details.dtDocSubmission).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "No submission date"}
              </Typography>

              <FormGrid
                fields={assignAOFields}
                formData={assignForm}
                errors={assignErrors}
                handleChange={handleAssignChange}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 3,
                  gap: 1.5,
                }}
              >
                <Button variant="outlined" onClick={handleBackClick}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveAO}
                  disabled={!assignForm.nAssignedAO || !assignForm.dtAODueDate}
                >
                  Save
                </Button>
              </Box>
            </Box>
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

export default TransactionInfoModal;
