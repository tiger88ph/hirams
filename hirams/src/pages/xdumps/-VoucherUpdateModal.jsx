// import { useState, useEffect } from "react";
// import ModalContainer from "../../../../../../layouts/modal/ModalContainer.jsx";
// import { Box, Typography, CircularProgress } from "@mui/material";
// import JevViewPanel from "../../components/JevViewPanel.jsx";
// import {
//   ReceiptLongOutlined,
//   BadgeOutlined,
//   LocationOnOutlined,
//   AccessTimeOutlined,
//   DeleteOutlineOutlined,
//   StoreOutlined,
//   Inventory2Outlined,
//   ArrowBackOutlined,
//   PersonOutlined,
//   EditOutlined,
//   PrintOutlined,
//   LockOutlined,
//   CloseOutlined,
// } from "@mui/icons-material";
// import PurchaseItemHistoriesAPI from "../../../../../../api/endpoints/purchase-item-histories.api.js";
// import DirectCostAPI from "../../../../../../api/endpoints/direct-cost.api.js";
// import DirectCostOptionAPI from "../../../../../../api/endpoints/direct-cost-option.api.js";
// import VoucherAPI from "../../../../../../api/endpoints/voucher.api.js";
// import PurchaseOrderAPI from "../../../../../../api/endpoints/purchase-order.api.js";
// import VoucherSupplierAPI from "../../../../../../api/endpoints/voucher-supplier.api.js";
// import VoucherAssigneeAPI from "../../../../../../api/endpoints/voucher-assignee.api.js";
// import BaseButton from "../../../../../../components/common/BaseButton.jsx";
// import MiniBaseButton from "../../../../../../components/common/MiniBaseButton.jsx";
// import ConfirmationDialog from "../../../../../../components/common/ConfirmationDialog.jsx";
// import {
//   showSwal,
//   withSpinner,
// } from "../../../../../../utils/helpers/swal.jsx";
// import { VoucherUpdateSkeleton } from "../../../../../../components/helper/Skeleton.jsx";
// import { printRoute } from "../../../../../../utils/helpers/printRoute.js";
// import {
//   fmtDate,
//   fmtPHP,
// } from "../../../../../../utils/formatters/formatter.js";
// import SectionLabel from "../../components/SectionLabel.jsx";
// import AddItemView from "../../components/AddItemView.jsx";
// import DarkHeader from "../../components/DarkHeader.jsx";
// import PORow from "../../components/PORow.jsx";
// import POList from "../../components/POList.jsx";
// import AssigneeList from "../../components/AssigneeList.jsx";
// import { VOUCHER_CONFIRM_STYLES } from "../../../../../../utils/style/sharedConfirmStyles.jsx";

// // ── Main Modal ────────────────────────────────────────────────────────────────
// export default function VoucherUpdateModal({
//   open,
//   onClose,
//   voucher,
//   onVoucherUpdated,
//   voucherAssigneeTypeKey,
//   voucherActiveKey,
//   voucherClosedKey,
//   voucherCancelledKey,
//   voucherStatus,
//   paidKey,
//   receivedKey,
//   deliveredKey,
//   currentUserId,
//   isManagement,
//   isFinanceOfficer,
//   chequeKey,
//   forPurchaseKey,
//   dvTypeKey,
// }) {
//   // ── State ──────────────────────────────────────────────────────────────
//   const [loading, setLoading] = useState(true);
//   const [showAddItem, setShowAddItem] = useState(false);
//   const [editingAssignee, setEditingAssignee] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [formData, setFormData] = useState({ particular: "", amount: "" });
//   const [formErrors, setFormErrors] = useState({});
//   const [confirmAction, setConfirmAction] = useState(null);
//   const [confirmLoading, setConfirmLoading] = useState(false);
//   const [optionHistories, setOptionHistories] = useState({});
//   const [historiesLoading, setHistoriesLoading] = useState(false);
//   const [ewtAmount, setEwtAmount] = useState(0);
//   const [ewtLoading, setEwtLoading] = useState(false);

//   // ✅ JEV State
//   const [showJevConfirm, setShowJevConfirm] = useState(false);
//   const [creatingJev, setCreatingJev] = useState(false);
//   const [showJevPanel, setShowJevPanel] = useState(false); // ✅ Show/hide JEV panel
//   // ── Derived Values ─────────────────────────────────────────────────────
//   const isAssigneeType =
//     voucher?.voucher_assignees?.length > 0 &&
//     !voucher?.voucher_suppliers?.length;

//   const assigneeLinks = voucher?.voucher_assignees || [];
//   const supplierLinks = voucher?.voucher_suppliers || [];
//   const hasJev = !!voucher?.nJEVId; // ✅ Check if JEV exists

//   const particularsGrandTotal = isAssigneeType
//     ? assigneeLinks.reduce((sum, a) => sum + Number(a.dAmount || 0), 0)
//     : supplierLinks.reduce((sum, link) => {
//         const opts = link.purchase_order?.purchase_order_options ?? [];
//         return opts.reduce((s, opt) => {
//           const p = opt.purchase_option;
//           return s + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
//         }, sum);
//       }, 0);

//   useEffect(() => {
//     if (open) {
//       setLoading(true);
//       setShowAddItem(false);
//       setEditingAssignee(null);
//       setSaving(false);
//       setFormData({ particular: "", amount: "" });
//       setFormErrors({});
//       setConfirmAction(null);
//       setConfirmLoading(false);
//       setShowJevConfirm(false);
//       setShowJevPanel(false); // ✅ Reset JEV panel on modal open
//       setOptionHistories({});
//       setHistoriesLoading(false);
//       const t = setTimeout(() => setLoading(false), 350);
//       return () => clearTimeout(t);
//     }
//   }, [open]);
//   useEffect(() => {
//     if (!open || isAssigneeType) {
//       setEwtAmount(0);
//       return;
//     }

//     const transactionIds = Array.from(
//       new Set(
//         supplierLinks
//           .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
//           .map(
//             (opt) =>
//               opt.purchase_option?.transaction_item?.transaction
//                 ?.nTransactionId,
//           )
//           .filter(Boolean),
//       ),
//     );

//     if (!transactionIds.length) return;

//     let active = true;
//     setEwtLoading(true);

//     const getCachedOptions = async () => {
//       const cached = sessionStorage.getItem("direct_cost_options_cache");
//       if (cached) return JSON.parse(cached);
//       const res = await DirectCostOptionAPI.getDirectCostOptions();
//       const opts = res.data || res || [];
//       sessionStorage.setItem("direct-cost-options_cache", JSON.stringify(opts));
//       return opts;
//     };

//     const fetchEwt = async () => {
//       try {
//         const [options, ...costsResults] = await Promise.all([
//           getCachedOptions(),
//           ...transactionIds.map((id) =>
//             DirectCostAPI.getDirectCosts({
//               nTransactionID: id,
//               withEWT: 1,
//             }).catch(() => null),
//           ),
//         ]);
//         if (!active) return;

//         const getOptionName = (optionId) =>
//           (
//             options.find((o) => (o.nDirectCostOptionID || o.id) === optionId)
//               ?.strName || ""
//           ).toLowerCase();

//         let totalEwt = 0;
//         costsResults.forEach((costsRes) => {
//           if (!costsRes) return;
//           const directCosts = costsRes.directCosts || costsRes.data || [];
//           let ewt = 0;
//           directCosts.forEach((cost) => {
//             if (getOptionName(cost.nDirectCostOptionID).includes("ewt"))
//               ewt += Number(cost.dAmount || 0);
//           });
//           totalEwt += ewt > 0 ? ewt : Number(costsRes.totalEWT || 0);
//         });
//         setEwtAmount(totalEwt);
//       } catch (err) {
//         console.error("EWT fetch error:", err);
//       } finally {
//         if (active) setEwtLoading(false);
//       }
//     };

//     fetchEwt();
//     return () => {
//       active = false;
//     };
//   }, [open, isAssigneeType, voucher?.nVoucherId, supplierLinks.length]);

//   useEffect(() => {
//     if (!open || !voucher || isAssigneeType || !paidKey) return;

//     const ids = (voucher.voucher_suppliers ?? [])
//       .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
//       .map((o) => o.purchase_option?.nPurchaseOptionId)
//       .filter(Boolean);

//     if (!ids.length) return;

//     setHistoriesLoading(true);
//     PurchaseItemHistoriesAPI.getLatest({ nPurchaseOptionId: ids })
//       .then((res) => {
//         const map = {};
//         (res?.histories || []).forEach(
//           (h) => (map[Number(h.nPurchaseOptionId)] = h),
//         );
//         setOptionHistories(map);
//       })
//       .catch((err) => console.error("History fetch error:", err))
//       .finally(() => setHistoriesLoading(false));
//   }, [open, voucher, paidKey, isAssigneeType]);

//   if (!open || !voucher) return null;

//   // ── Helper Flags ───────────────────────────────────────────────────────
//   const firstAssignee = voucher.voucher_assignees?.[0];
//   const payeeName = isAssigneeType
//     ? (firstAssignee?.assignee?.strAssigneeName ??
//       voucher.assignee?.strAssigneeName ??
//       "—")
//     : (voucher.supplier?.strSupplierName ?? "—");
//   const payeeNickName = isAssigneeType
//     ? (firstAssignee?.assignee?.strAssigneeNickName ??
//       voucher.assignee?.strAssigneeNickName ??
//       "—")
//     : (voucher.supplier?.strSupplierNickName ?? "—");
//   const supplierTIN = isAssigneeType
//     ? firstAssignee?.assignee?.strTIN
//     : voucher.supplier?.strTIN;
//   const supplierAddress = isAssigneeType
//     ? firstAssignee?.assignee?.strAddress
//     : voucher.supplier?.strAddress;
//   const particularsCount = isAssigneeType
//     ? assigneeLinks.length
//     : supplierLinks.length;

//   const allOptionsEligibleForPaid =
//     !isAssigneeType &&
//     !historiesLoading &&
//     supplierLinks.length > 0 &&
//     supplierLinks
//       .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
//       .every((o) => {
//         const status = String(
//           optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
//             ?.nStatus ?? "",
//         );
//         return ![paidKey, receivedKey, deliveredKey].includes(status);
//       });

//   const allOptionsPaid =
//     !isAssigneeType &&
//     !historiesLoading &&
//     supplierLinks.length > 0 &&
//     supplierLinks
//       .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
//       .every((o) => {
//         const status = String(
//           optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
//             ?.nStatus ?? "",
//         );
//         return [paidKey, receivedKey, deliveredKey].includes(status);
//       });

//   const isEligibleForPaid = isAssigneeType
//     ? !voucher.bIsPaid
//     : allOptionsEligibleForPaid;
//   const isMarkedPaid = isAssigneeType ? !!voucher.bIsPaid : allOptionsPaid;
//   const cPaymentTerms =
//     voucher?.voucher_suppliers?.[0]?.purchase_order?.cPaymentTerms ?? null;

//   // ✅ JEV Handlers
//   const handleAddJev = () => setShowJevConfirm(true);
//   const handleViewJev = () => {
//     setShowJevPanel(true); // ✅ Show JEV panel, hide voucher content
//   };
//   const confirmCreateJev = async () => {
//     setCreatingJev(true);
//     try {
//       await VoucherAPI.createJev(voucher.nVoucherId, {
//         cJEVLinkType: dvTypeKey,
//       });
//       await onVoucherUpdated();
//     } catch (err) {
//       console.error("Create JEV failed:", err);
//     } finally {
//       setCreatingJev(false);
//       setShowJevConfirm(false);
//     }
//   };

//   const handleRemovePO = async (id) => {
//     await VoucherSupplierAPI.delete(id);
//     onVoucherUpdated();
//   };
//   const handleEditAssignee = (assignee) => {
//     setEditingAssignee(assignee);
//     setShowAddItem(true);
//   };

//   const handleDeleteAssignee = async (id) => {
//     const res = await VoucherAssigneeAPI.delete(id);
//     res.voucher_deleted ? (onVoucherUpdated(), onClose()) : onVoucherUpdated();
//   };
//   const handleSaveAssignee = async () => {
//     const errs = {};
//     if (!formData.particular?.trim())
//       errs.particular = "Particular is required";
//     if (!formData.amount || Number(formData.amount) <= 0)
//       errs.amount = "Amount must be > 0";
//     setFormErrors(errs);
//     if (Object.keys(errs).length) return;

//     setSaving(true);
//     try {
//       editingAssignee
//         ? await VoucherAssigneeAPI.update(editingAssignee.nVoucherAssigneeId, {
//             strParticular: formData.particular,
//             dAmount: Number(formData.amount),
//           })
//         : await VoucherAssigneeAPI.create({
//             nVoucherId: voucher.nVoucherId,
//             nAssigneeId: firstAssignee.nAssigneeId,
//             strParticular: formData.particular,
//             dAmount: Number(formData.amount),
//           });
//       await onVoucherUpdated();
//       setShowAddItem(false);
//       setEditingAssignee(null);
//       setFormData({ particular: "", amount: "" });
//     } catch (err) {
//       console.error("Save error:", err);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handlePrintVoucher = async () => {
//     const particulars = isAssigneeType
//       ? assigneeLinks.map((a) => ({
//           particular: a.strParticular,
//           amount: Number(a.dAmount || 0),
//         }))
//       : supplierLinks.map((vs) => ({
//           particular:
//             vs.purchase_order?.strPurchaseOrderNo ??
//             `PO #${vs.nPurchaseOrderId}`,
//           amount: (vs.purchase_order?.purchase_order_options ?? []).reduce(
//             (sum, o) =>
//               sum +
//               (o.purchase_option?.nQuantity || 0) *
//                 (o.purchase_option?.dUnitPrice || 0),
//             0,
//           ),
//         }));

//     sessionStorage.setItem(
//       "printVoucher_data",
//       JSON.stringify({
//         voucher,
//         isAssigneeType,
//         payeeName,
//         payeeNickName,
//         supplierTIN,
//         supplierAddress,
//         particulars,
//         cPaymentTerms,
//         ewtAmount: isAssigneeType ? 0 : ewtAmount,
//       }),
//     );

//     if (String(voucher.cStatus) === String(voucherActiveKey)) {
//       await VoucherAPI.updateVoucherStatus(
//         voucher.nVoucherId,
//         voucherClosedKey,
//       );
//       await onVoucherUpdated();
//     }

//     printRoute("/print-voucher");
//   };
//   const ACTION_LABELS = {
//     cancel: "cancelled",
//     reopen: "reopened",
//     paid: "marked as paid",
//     unpaid: "marked as unpaid",
//     close: "closed",
//   };

//   const handleConfirmAction = useCallback(async () => {
//     if (!confirmAction) return;
//     const action = confirmAction;

//     // ❌ REMOVED: navigate("/voucher") — DO NOT leave yet!

//     if (action === "print_only") {
//       try {
//         await showSwal("LOADING", { title: "Processing..." }); // ✅ Show spinner FIRST
//         await withSpinner("Voucher", handlePrintVoucher);
//         Swal.close(); // ✅ Close spinner when done
//         await showSwal(
//           "SUCCESS",
//           {},
//           { entity: "Voucher", action: ACTION_LABELS[action] },
//         );
//       } catch (err) {
//         console.error("Print voucher error:", err);
//         Swal.close();
//         await showSwal("ERROR", {}, { entity: "Voucher" });
//       } finally {
//         navigate("/voucher"); // ✅ Leave ONLY when fully done
//         setConfirmAction(null);
//       }
//       return;
//     }

//     if (action === "print_cheque") {
//       try {
//         await showSwal("LOADING", { title: "Processing..." });
//         await withSpinner("Voucher", async () => {
//           sessionStorage.setItem(
//             "printCheque_data",
//             JSON.stringify({
//               voucher,
//               payeeName,
//               particulars: buildParticulars(),
//               isAssigneeType,
//               ewtAmount: isAssigneeType ? 0 : ewtAmount,
//             }),
//           );
//           printRoute("/print-cheque");
//         });
//         Swal.close();
//         await showSwal(
//           "SUCCESS",
//           {},
//           { entity: "Voucher", action: ACTION_LABELS[action] },
//         );
//       } catch (err) {
//         console.error("Print cheque error:", err);
//         Swal.close();
//         await showSwal("ERROR", {}, { entity: "Voucher" });
//       } finally {
//         navigate("/voucher");
//         setConfirmAction(null);
//       }
//       return;
//     }

//     try {
//       await showSwal("LOADING", { title: "Updating voucher..." }); // ✅ Spinner FIRST
//       await (async () => {
//         switch (action) {
//           case "cancel":
//             await VoucherAPI.updateVoucherStatus(
//               voucher.nVoucherId,
//               voucherCancelledKey,
//             );
//             break;
//           case "reopen":
//             await VoucherAPI.updateVoucherStatus(
//               voucher.nVoucherId,
//               voucherActiveKey,
//             );
//             break;
//           case "paid":
//             isAssigneeType
//               ? await VoucherAPI.updateVoucherPaidStatus(voucher.nVoucherId, 1)
//               : await Promise.all([
//                   PurchaseOrderAPI.updateCartStatusBulk({
//                     nPurchaseOrderIds: supplierLinks.map(
//                       (vs) => vs.nPurchaseOrderId,
//                     ),
//                     nStatus: paidKey,
//                     nUserId: currentUserId,
//                   }),
//                   VoucherAPI.updateVoucherPaidStatus(voucher.nVoucherId, 1),
//                 ]);
//             break;
//           case "unpaid":
//             isAssigneeType
//               ? await VoucherAPI.updateVoucherPaidStatus(voucher.nVoucherId, 0)
//               : await Promise.all([
//                   PurchaseOrderAPI.updateCartStatusBulk({
//                     nPurchaseOrderIds: supplierLinks.map(
//                       (vs) => vs.nPurchaseOrderId,
//                     ),
//                     nStatus: forPurchaseKey,
//                     nUserId: currentUserId,
//                   }),
//                   VoucherAPI.updateVoucherPaidStatus(voucher.nVoucherId, 0),
//                 ]);
//             break;
//           case "close":
//             await VoucherAPI.updateVoucherStatus(
//               voucher.nVoucherId,
//               voucherClosedKey,
//             );
//             break;
//         }
//       })();

//       Swal.close(); // ✅ Spinner closes ONLY after API fully finishes
//       await showSwal(
//         "SUCCESS",
//         {},
//         { entity: "Voucher", action: ACTION_LABELS[action] },
//       );

//       notifyUpdated();
//       await fetchVoucher();
//     } catch (err) {
//       console.error(`Failed to ${action} voucher:`, err);
//       Swal.close();
//       await showSwal("ERROR", {}, { entity: "Voucher" });
//     } finally {
//       navigate("/voucher"); // ✅ Navigate AWAY LAST — after Swal success seen
//       setConfirmAction(null);
//     }
//   }, [
//     confirmAction,
//     voucher,
//     isAssigneeType,
//     supplierLinks,
//     paidKey,
//     forPurchaseKey,
//     voucherActiveKey,
//     voucherClosedKey,
//     voucherCancelledKey,
//     currentUserId,
//     navigate,
//     notifyUpdated,
//     fetchVoucher,
//     handlePrintVoucher,
//     buildParticulars,
//   ]);

//   return (
//     <ModalContainer
//       open={open}
//       handleClose={onClose}
//       title={
//         showJevPanel ? "Journal Entry Voucher" : "Disbursement Voucher Details"
//       }
//       subTitle={
//         showJevPanel
//           ? ""
//           : `${voucherStatus?.[voucher.cStatus] || ""} / ${voucher.strNumber || ""}`
//       }
//       contentPadding={0}
//       saveLabel={editingAssignee ? "Update Entry" : "Save Entry"}
//       onSave={handleSaveAssignee}
//       isSaving={saving}
//       showSave={!showJevPanel && showAddItem && isAssigneeType && !saving}
//       cancelLabel={showJevPanel ? "Back" : showAddItem ? "Back" : "Close"}
//       onCancel={
//         showJevPanel
//           ? () => setShowJevPanel(false)
//           : showAddItem
//             ? () => {
//                 setShowAddItem(false);
//                 setEditingAssignee(null);
//               }
//             : onClose
//       }
//       disabled={confirmLoading || saving || creatingJev}
//       // ✅ Hide ALL extra buttons when JEV panel is open
//       extraActions={
//         !showJevPanel && (
//           <>
//             {!loading &&
//               !confirmAction &&
//               !showAddItem &&
//               (!hasJev && !showJevConfirm ? (
//                 <BaseButton
//                   label={creatingJev ? "Creating…" : "Add JEV"}
//                   onClick={handleAddJev}
//                   disabled={creatingJev}
//                   actionColor="approve"
//                 />
//               ) : !showJevConfirm ? (
//                 <BaseButton
//                   label="View JEV"
//                   onClick={handleViewJev}
//                   actionColor="default"
//                 />
//               ) : null)}

//             {(isManagement || isFinanceOfficer) &&
//             String(voucher.cStatus) === String(voucherClosedKey) &&
//             !loading &&
//             !confirmAction &&
//             !showAddItem ? (
//               isEligibleForPaid ? (
//                 <BaseButton
//                   label="Mark as Paid"
//                   onClick={() => setConfirmAction("paid")}
//                   actionColor="approve"
//                 />
//               ) : isMarkedPaid ? (
//                 <BaseButton
//                   label="Mark as Unpaid"
//                   onClick={() => setConfirmAction("unpaid")}
//                   actionColor="warn"
//                 />
//               ) : null
//             ) : null}
//           </>
//         )
//       }
//     >
//       {showJevPanel ? (
//         <JevViewPanel
//           jev={
//             voucher?.jev || { nJEVId: voucher?.nJEVId, cJEVLinkType: dvTypeKey }
//           }
//           onClose={() => setShowJevPanel(false)}
//         />
//       ) : loading ? (
//         <VoucherUpdateSkeleton />
//       ) : confirmAction ? (
//         <ConfirmationDialog
//           style={VOUCHER_CONFIRM_STYLES[confirmAction]}
//           voucherNumber={voucher.strNumber}
//           loading={confirmLoading}
//           onConfirm={handleConfirmAction}
//           onBack={() => setConfirmAction(null)}
//         />
//       ) : showJevConfirm ? (
//         <ConfirmationDialog
//           style={VOUCHER_CONFIRM_STYLES.add_jev}
//           voucherNumber={voucher.strNumber}
//           loading={creatingJev}
//           onConfirm={confirmCreateJev}
//           onBack={() => setShowJevConfirm(false)}
//         />
//       ) : showAddItem ? (
//         <Box sx={{ p: 2 }}>
//           {saving ? (
//             <Box sx={{ textAlign: "center", py: 6 }}>
//               <CircularProgress size={24} sx={{ mb: 2 }} />
//               <Typography fontSize="0.8rem">Saving entry…</Typography>
//             </Box>
//           ) : (
//             <AddItemView
//               isAssigneeType={isAssigneeType}
//               voucher={voucher}
//               firstAssignee={firstAssignee}
//               editingAssignee={editingAssignee}
//               formData={formData}
//               setFormData={setFormData}
//               formErrors={formErrors}
//               onSuccess={onVoucherUpdated}
//               onBack={() => {
//                 setShowAddItem(false);
//                 setEditingAssignee(null);
//               }}
//             />
//           )}
//         </Box>
//       ) : (
//         <Box>
//           <DarkHeader
//             voucher={voucher}
//             payeeNickName={payeeNickName}
//             supplierTIN={supplierTIN}
//             supplierAddress={supplierAddress}
//             isAssigneeType={isAssigneeType}
//             onCloseVoucher={() => setConfirmAction("close")}
//             onPrintOnly={() => setConfirmAction("print_only")}
//             onCancel={() => setConfirmAction("cancel")}
//             onReopen={() => setConfirmAction("reopen")}
//             voucherActiveKey={voucherActiveKey}
//             voucherClosedKey={voucherClosedKey}
//             voucherCancelledKey={voucherCancelledKey}
//             onPrintCheque={() => setConfirmAction("print_cheque")}
//             isFinanceOfficer={isFinanceOfficer}
//             isManagement={isManagement}
//             cPaymentTerms={cPaymentTerms}
//             chequeKey={chequeKey}
//             isMarkedPaid={isMarkedPaid}
//           />

//           {isAssigneeType ? (
//             <>
//               <SectionLabel
//                 onAddItem={
//                   String(voucher.cStatus) === String(voucherActiveKey)
//                     ? () => setShowAddItem(true)
//                     : undefined
//                 }
//               >
//                 Particulars ({particularsCount})
//               </SectionLabel>
//               <AssigneeList
//                 assigneeLinks={assigneeLinks}
//                 onEdit={
//                   String(voucher.cStatus) === String(voucherActiveKey)
//                     ? handleEditAssignee
//                     : undefined
//                 }
//                 onDelete={
//                   String(voucher.cStatus) === String(voucherActiveKey)
//                     ? handleDeleteAssignee
//                     : undefined
//                 }
//               />
//             </>
//           ) : (
//             <>
//               <SectionLabel
//                 onAddItem={
//                   String(voucher.cStatus) === String(voucherActiveKey)
//                     ? () => setShowAddItem(true)
//                     : undefined
//                 }
//                 badge={
//                   <Box
//                     sx={{
//                       display: "inline-flex",
//                       alignItems: "center",
//                       gap: 0.3,
//                       px: 0.75,
//                       py: 0.25,
//                       borderRadius: 50,
//                       background: "#FEF3C7",
//                     }}
//                   >
//                     <Typography
//                       fontSize="0.55rem"
//                       fontWeight={700}
//                       color="#92400E"
//                     >
//                       EWT:
//                     </Typography>
//                     <Typography
//                       fontSize="0.58rem"
//                       fontWeight={700}
//                       color="#78350F"
//                     >
//                       {ewtLoading ? "…" : fmtPHP(ewtAmount)}
//                     </Typography>
//                   </Box>
//                 }
//               >
//                 Particulars ({particularsCount})
//               </SectionLabel>
//               <POList
//                 supplierLinks={supplierLinks}
//                 onRemovePO={
//                   String(voucher.cStatus) === String(voucherActiveKey)
//                     ? handleRemovePO
//                     : undefined
//                 }
//               />
//             </>
//           )}
//         </Box>
//       )}
//     </ModalContainer>
//   );
// }
