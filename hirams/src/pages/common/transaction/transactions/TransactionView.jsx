import React, { useCallback, useMemo } from "react";
import PageLayout from "../../../../layouts/page/content-page";
import CustomTable from "../../../../components/form/Table";
import CustomSearchField from "../../../../components/form/SearchField";
import BaseButton from "../../../../components/form/BaseButton";
import ProgressBar from "../../../../components/form/ProgressBar";
import RevertModal from "./modal/RevertModal";
import TransactionHistoryModal from "./modal/TransactionHistoryModal";
import TransactionAEModal from "./modal/TransactionAEModal";
import DeleteVerificationModal from "./modal/DeleteVerificationModal";
import DirectCostModal from "./modal/DirectCostModal";
import ATransactionInfoModal from "./modal/TransactionInfoModal";
import ArchiveModal from "../archive/modal/ArchiveModal";
import SyncMenu from "../../../../components/form/SyncMenu";
import { getDueDateColor } from "../../../../utils/helpers/dueDateColor";
import { Box, Typography, useTheme } from "@mui/material";
import getThemeColors from "../../../../utils/style/getThemeColors";
import {
  Add,
  Edit,
  Delete,
  Undo,
  RequestQuote,
  Replay,
  History,
  Visibility,
  GppGood,
  Description,
  ListAlt,
  CheckCircleOutline,
  AssignmentInd,
  ContactPage,
  PriceCheck,
  Sell,
  Archive,
  ShoppingCart,
  Security,
  EmojiEvents,
} from "@mui/icons-material";

// ── Theme map — only tokens this component actually uses ──────────────────
const useColors = (c) => ({
  cardBg: c.slate.outerBg,
  textMuted: c.gray.textMuted,
  textPrimary: c.gray.textPrimary,
  green: {
    paid: c.green.paid,
    paidBorder: c.green.paidBorder,
  },
  amber: {
    warnText: c.amber.warnText,
  },
});

// ── Pure action renderer ───────────────────────────────────────────────────
function buildActions(row, opts) {
  const {
    userId,
    isManagement,
    isProcurement,
    isProcurementTL,
    isAccountOfficer,
    selectedStatusCode: statusCode,
    draftKey = "",
    finalizeKey = "",
    forAssignmentKey = "",
    itemsManagementKey = "",
    itemsFinalizeKey = "",
    itemsVerificationKey = "",
    forCanvasKey = "",
    canvasFinalizeKey = "",
    canvasVerificationKey = "",
    forPricingKey = "",
    priceVerificationKey = "",
    priceApprovalKey = "",
    priceApprovedKey = "",
    finalizeVerificationKey = "",
    priceSettingKey = "",
    priceFinalizeKey = "",
    priceFinalizeVerificationKey = "",
    procPriceApprovalKey = "",
    procPriceApprovedKey = "",
    isPricingSetting,
    filterStatus,
    proc_status,
    transacstatus,
    itemType,
    procMode,
    procSource,
    statusTransaction,
    userTypes,
    vaGoSeValue,
    buildCanvasState,
    navigate,
    setSelectedTransaction,
    setIsAEModalOpen,
    setIsHistoryModalOpen,
    setIsRevertModalOpen,
    setIsDirectCostModalOpen,
    setIsDeleteModalOpen,
    setEntityToDelete,
    setIsArchiveModalOpen,
    setArchiveModalTransaction,
    forPurchaseKey,
    forCollectionKey,
    cancelPoKey,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    removedFromCartKey,
    isFinanceOfficer,
    openCartKey,
    closeCartKey,
    cancelCartKey,
    crTypeKey,
  } = opts;

  // ── Management ──────────────────────────────────────────────────────────
  if (isManagement || isFinanceOfficer) {
    const isDraft = draftKey.includes(statusCode);
    const isFinalize = finalizeKey.includes(statusCode);
    const isForAssignment = forAssignmentKey.includes(statusCode);
    const isItemsManagement = itemsManagementKey.includes(statusCode);
    const isItemsVerification = itemsVerificationKey.includes(statusCode);
    const isForCanvas = forCanvasKey.includes(statusCode);
    const isCanvasVerification = canvasVerificationKey.includes(statusCode);
    const isPriceVerification = priceVerificationKey.includes(statusCode);
    const isPricing =
      forPricingKey.includes(statusCode) ||
      priceVerificationKey.includes(statusCode) ||
      priceApprovalKey.includes(statusCode);
    const isForCollection = forCollectionKey?.includes(statusCode);
    const isForPurchase = forPurchaseKey?.includes(statusCode);

    const isRevertHidden =
      isDraft ||
      forAssignmentKey.includes(statusCode) ||
      forPurchaseKey?.includes(statusCode) ||
      forCollectionKey?.includes(statusCode);

    const viewIcon = isDraft ? (
      <Description />
    ) : isFinalize ||
      isItemsVerification ||
      isCanvasVerification ||
      isPriceVerification ? (
      <GppGood />
    ) : isForAssignment ? (
      <AssignmentInd />
    ) : isItemsManagement ? (
      <ListAlt />
    ) : isForCanvas ? (
      <ContactPage />
    ) : forPricingKey.includes(statusCode) ? (
      <PriceCheck />
    ) : priceApprovalKey.includes(statusCode) ? (
      <Security />
    ) : priceApprovedKey.includes(statusCode) ? (
      <EmojiEvents />
    ) : forPurchaseKey?.includes(statusCode) ? (
      <ShoppingCart />
    ) : forCollectionKey?.includes(statusCode) ? (
      <PriceCheck />
    ) : (
      <Visibility />
    );

    const viewTooltip = isDraft
      ? "Draft"
      : isFinalize
        ? "Transaction"
        : isForAssignment
          ? "Assign/Reassign"
          : isItemsManagement
            ? "Item Management"
            : isItemsVerification
              ? "Verify Transaction Item"
              : isForCanvas
                ? "For Canvas"
                : isCanvasVerification
                  ? "Verify Canvas"
                  : forPricingKey.includes(statusCode)
                    ? "Pricing"
                    : isPriceVerification
                      ? "Verify Pricing"
                      : priceApprovalKey.includes(statusCode)
                        ? "Approve Pricing"
                        : priceApprovedKey.includes(statusCode)
                          ? "View Approved Pricing"
                          : forPurchaseKey?.includes(statusCode)
                            ? "For Purchase"
                            : forCollectionKey?.includes(statusCode)
                              ? "For Collection"
                              : "View Transaction";

    const handleView = (e) => {
      e.stopPropagation();
      if (
        (forPurchaseKey && forPurchaseKey.includes(statusCode)) ||
        (forCollectionKey && forCollectionKey.includes(statusCode))
      ) {
        return navigate("/transaction-for-purchase", {
          state: {
            transaction: row,
            selectedStatusCode: statusCode,
            currentStatusLabel: filterStatus,
            transactionCode: row.transactionId,
            forPurchaseKey,
            currentUserId: userId,
            cancelPoKey,
            addToCartKey,
            purchaseOrderKey,
            paidKey,
            receivedKey,
            deliveredKey,
            removedFromCartKey,
            forCollectionKey,
            isManagement,
            openCartKey,
            closeCartKey,
            cancelCartKey,
            crTypeKey,
          },
        });
      }
      navigate(isPricing ? "/transaction-pricing-set" : "/transaction-canvas", {
        state: isPricing
          ? {
              transaction: row,
              selectedStatusCode: statusCode,
              isManagement,
              isProcurementTL,
              transacstatus,
              forPricingKey,
              priceSettingKey: forPricingKey,
              priceVerificationKey,
              priceApprovalKey,
              priceApprovedKey,
              isPricingSetting,
              currentStatusLabel: filterStatus,
              currentUserId: userId,
              itemType,
              procMode,
              procSource,
              statusTransaction,
            }
          : {
              ...buildCanvasState(row),
              selectedStatusCode: statusCode,
              transacstatus,
              itemType,
              userTypes,
              statusTransaction,
              procMode,
              procSource,
              draftKey,
              finalizeKey,
              forPricingKey,
              priceVerificationKey,
              currentStatusLabel: filterStatus,
            },
      });
    };

    return (
      <div className="flex justify-center gap-0">
        {(isDraft || isManagement) && (
          <BaseButton
            icon={<Edit />}
            tooltip="Edit Transaction"
            size="small"
            actionColor="edit"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsAEModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={viewIcon}
          tooltip={viewTooltip}
          size="small"
          actionColor="view"
          onClick={handleView}
        />
        {(isPricing ||
          isForCanvas ||
          isCanvasVerification ||
          isForCollection ||
          isForPurchase) && (
          <BaseButton
            icon={<RequestQuote />}
            tooltip="Direct Cost"
            size="small"
            actionColor="breakdown"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsDirectCostModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={<History />}
          tooltip="View Transaction History"
          size="small"
          actionColor="deactivate"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTransaction(row);
            setIsHistoryModalOpen(true);
          }}
        />
        {!isRevertHidden && (
          <BaseButton
            icon={<Replay />}
            tooltip="Revert Transaction"
            size="small"
            actionColor="revert"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsRevertModalOpen(true);
            }}
          />
        )}
        {!isDraft && !forAssignmentKey.includes(statusCode) && (
          <BaseButton
            icon={<Archive />}
            tooltip="Archive Transaction"
            size="small"
            actionColor="deactivate"
            onClick={(e) => {
              e.stopPropagation();
              setArchiveModalTransaction(row);
              setIsArchiveModalOpen(true);
            }}
          />
        )}
        {isDraft && (
          <BaseButton
            icon={<Delete />}
            tooltip="Delete Transaction"
            size="small"
            actionColor="delete"
            onClick={(e) => {
              e.stopPropagation();
              setEntityToDelete({
                type: "transaction",
                data: { id: row.id, code: row.transactionName },
              });
              setIsDeleteModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  // ── Procurement ──────────────────────────────────────────────────────────
  if (isProcurement) {
    const isDraft = draftKey.includes(statusCode);
    const isFinalize = finalizeKey.includes(statusCode);
    const isFinalizeVerification = finalizeVerificationKey.includes(statusCode);
    const isPriceSet = priceSettingKey.includes(statusCode);
    const isPriceFinalize = priceFinalizeKey.includes(statusCode);
    const isPriceFinalizeVerification =
      priceFinalizeVerificationKey.includes(statusCode);
    const isPriceApproval = procPriceApprovalKey.includes(statusCode);
    const isForCollection = forCollectionKey?.includes(statusCode);
    const isPricing =
      isPriceSet ||
      isPriceFinalize ||
      isPriceFinalizeVerification ||
      isPriceApproval;
    const isRevertVisible =
      !draftKey.includes(statusCode) &&
      !priceSettingKey.includes(statusCode) &&
      !forPurchaseKey?.includes(statusCode);

    const viewIcon = isDraft ? (
      <Description />
    ) : isFinalize ? (
      <CheckCircleOutline />
    ) : isFinalizeVerification ? (
      <GppGood />
    ) : isPriceSet ? (
      <Sell />
    ) : isPriceFinalize ? (
      <PriceCheck />
    ) : isPriceFinalizeVerification ? (
      <GppGood />
    ) : isPriceApproval ? (
      <Security />
    ) : procPriceApprovedKey?.includes(statusCode) ? (
      <EmojiEvents />
    ) : forPurchaseKey?.includes(statusCode) ? (
      <ShoppingCart />
    ) : (
      <Visibility />
    );

    const viewTooltip = isDraft
      ? "View Draft"
      : isFinalize
        ? "View Transaction"
        : isFinalizeVerification
          ? "Verify Transaction"
          : isPriceSet
            ? "Set Pricing"
            : isPriceFinalize
              ? "Finalize Pricing"
              : isPriceFinalizeVerification
                ? "Verify Pricing"
                : isPriceApproval
                  ? "Approve Pricing"
                  : procPriceApprovedKey?.includes(statusCode)
                    ? "View Approved Pricing"
                    : forPurchaseKey?.includes(statusCode)
                      ? "For Purchase"
                      : "View Transaction";

    const handleView = (e) => {
      e.stopPropagation();
      if (forPurchaseKey && forPurchaseKey.includes(statusCode)) {
        return navigate("/transaction-for-purchase", {
          state: {
            transaction: row,
            selectedStatusCode: statusCode,
            currentStatusLabel: filterStatus,
            transactionCode: row.transactionId,
            forPurchaseKey,
            currentUserId: userId,
            cancelPoKey,
            addToCartKey,
            purchaseOrderKey,
            paidKey,
            receivedKey,
            deliveredKey,
            removedFromCartKey,
            isManagement,
            isProcurement,
            openCartKey,
            closeCartKey,
            cancelCartKey,
            forCollectionKey,
            crTypeKey,
          },
        });
      }
      navigate(isPricing ? "/transaction-pricing-set" : "/transaction-canvas", {
        state: isPricing
          ? {
              transaction: row,
              selectedStatusCode: statusCode,
              clientNickName: row.clientName,
              currentUserId: userId,
              proc_status,
              priceSettingKey,
              priceFinalizeKey,
              priceFinalizeVerificationKey,
              priceApprovalKey: procPriceApprovalKey,
              isPricingSetting,
              isManagement,
              isProcurementTL,
              currentStatusLabel: filterStatus,
              itemType,
              procMode,
              procSource,
              statusTransaction,
            }
          : {
              ...buildCanvasState(row),
              selectedStatusCode: statusCode,
              isProcurement,
              proc_status,
              draftKey,
              finalizeKey,
              priceSettingKey,
              finalizeVerificationKey,
              priceFinalizeVerificationKey,
              currentStatusLabel: filterStatus,
              itemType,
              procMode,
              procSource,
              statusTransaction,
            },
      });
    };

    return (
      <div className="flex justify-center gap-0">
        {isDraft && (
          <BaseButton
            icon={<Edit />}
            tooltip="Edit Transaction"
            size="small"
            actionColor="edit"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsAEModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={viewIcon}
          tooltip={viewTooltip}
          size="small"
          actionColor="view"
          onClick={handleView}
        />
        {isDraft && (
          <BaseButton
            icon={<Delete />}
            tooltip="Delete Transaction"
            size="small"
            actionColor="delete"
            onClick={(e) => {
              e.stopPropagation();
              setEntityToDelete({
                type: "transaction",
                data: { id: row.id, code: row.transactionName },
              });
              setIsDeleteModalOpen(true);
            }}
          />
        )}
        {(isPricing || isForCollection) && (
          <BaseButton
            icon={<RequestQuote />}
            tooltip="Direct Cost"
            size="small"
            actionColor="breakdown"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsDirectCostModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={<History />}
          tooltip="View Transaction History"
          size="small"
          actionColor="deactivate"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTransaction(row);
            setIsHistoryModalOpen(true);
          }}
        />
        {isRevertVisible && (
          <BaseButton
            icon={<Undo />}
            tooltip="Revert Transaction"
            size="small"
            actionColor="revert"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsRevertModalOpen(true);
            }}
          />
        )}
        {!isDraft && (
          <BaseButton
            icon={<Archive />}
            tooltip="Archive Transaction"
            size="small"
            actionColor="deactivate"
            onClick={(e) => {
              e.stopPropagation();
              setArchiveModalTransaction(row);
              setIsArchiveModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  // ── Account Officer ──────────────────────────────────────────────────────
  if (isAccountOfficer) {
    const isItemsManagement = itemsManagementKey.includes(statusCode);
    const isItemsFinalize = itemsFinalizeKey.includes(statusCode);
    const isItemsVerification = itemsVerificationKey.includes(statusCode);
    const isForCanvas = forCanvasKey.includes(statusCode);
    const isCanvasFinalize = canvasFinalizeKey.includes(statusCode);
    const isCanvasVerification = canvasVerificationKey.includes(statusCode);
    const isForAssignment = forAssignmentKey.includes(statusCode);
    const hideRevert =
      isItemsManagement ||
      isForAssignment ||
      forPurchaseKey?.includes(statusCode);

    const viewIcon = isItemsManagement ? (
      <ListAlt />
    ) : isItemsFinalize || isCanvasFinalize ? (
      <CheckCircleOutline />
    ) : isItemsVerification || isCanvasVerification ? (
      <GppGood />
    ) : isForCanvas ? (
      <ContactPage />
    ) : isForAssignment ? (
      <AssignmentInd />
    ) : forPurchaseKey?.includes(statusCode) ? (
      <ShoppingCart />
    ) : (
      <Visibility />
    );

    const viewTooltip = isForAssignment
      ? "For Assignment"
      : isItemsManagement
        ? "Manage Items"
        : isItemsFinalize
          ? "Finalize Items"
          : isItemsVerification
            ? "Verify Items"
            : isForCanvas
              ? "Canvas"
              : isCanvasFinalize
                ? "Finalize Canvas"
                : isCanvasVerification
                  ? "Verify Canvas"
                  : forPurchaseKey?.includes(statusCode)
                    ? "For Purchase"
                    : "View Transaction";

    return (
      <div className="flex justify-center gap-0">
        <BaseButton
          icon={viewIcon}
          tooltip={viewTooltip}
          size="small"
          actionColor="view"
          onClick={(e) => {
            e.stopPropagation();
            if (forPurchaseKey && forPurchaseKey.includes(statusCode)) {
              return navigate("/transaction-for-purchase", {
                state: {
                  transaction: row,
                  selectedStatusCode: statusCode,
                  currentStatusLabel: filterStatus,
                  transactionCode: row.transactionId,
                  forPurchaseKey,
                  currentUserId: userId,
                  cancelPoKey,
                  addToCartKey,
                  purchaseOrderKey,
                  paidKey,
                  receivedKey,
                  deliveredKey,
                  removedFromCartKey,
                  forCollectionKey,
                  isManagement,
                  itemType,
                  procMode,
                  procSource,
                  statusTransaction,
                  openCartKey,
                  closeCartKey,
                  cancelCartKey,
                  crTypeKey,
                },
              });
            }
            navigate("/transaction-canvas", { state: buildCanvasState(row) });
          }}
        />
        {(isCanvasFinalize || isForCanvas || isCanvasVerification) && (
          <BaseButton
            icon={<RequestQuote />}
            tooltip="Direct Cost"
            size="small"
            actionColor="breakdown"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsDirectCostModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={<History />}
          tooltip="View Transaction History"
          size="small"
          actionColor="deactivate"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTransaction(row);
            setIsHistoryModalOpen(true);
          }}
        />
        {!hideRevert && (
          <BaseButton
            icon={<Replay />}
            tooltip="Revert Transaction"
            size="small"
            actionColor="revert"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsRevertModalOpen(true);
            }}
          />
        )}
        {!forAssignmentKey.includes(statusCode) && (
          <BaseButton
            icon={<Archive />}
            tooltip="Archive Transaction"
            size="small"
            actionColor="deactivate"
            onClick={(e) => {
              e.stopPropagation();
              setArchiveModalTransaction(row);
              setIsArchiveModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

// ===========================================================================
function TransactionView(props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const {
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    filteredTransactions,
    loading,
    initialLoading,
    filterLoading,
    filterStatus,
    selectedStatusCode,
    statusMap,
    selectedTransaction,
    setSelectedTransaction,
    isRevertModalOpen,
    setIsRevertModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isDirectCostModalOpen,
    setIsDirectCostModalOpen,
    isAEModalOpen,
    setIsAEModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    entityToDelete,
    setEntityToDelete,
    isInfoModalOpen,
    setIsInfoModalOpen,
    isArchiveModalOpen,
    setIsArchiveModalOpen,
    archiveModalTransaction,
    setArchiveModalTransaction,
    archiveStatus,
    itemType,
    procMode,
    procSource,
    isManagement,
    isProcurement,
    isAccountOfficer,
    userId,
    forCanvasKey,
    forCollectionKey,
    isPricingSetting,
    txnProgressMap,
    txnBalanceMap,
    isAssignedToColumnVisible,
    isCreatedByColumnVisible,
    showAOActionColumn,
    showSubmissionDate,
    aoDueDateVisible,
    fetchTransactions,
    handleAddTransactionSaved,
    handleRowClick,
    actionOpts,
  } = props;

  const renderActions = useCallback(
    (_, row) => buildActions(row, actionOpts),
    [actionOpts],
  );

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { key: "transactionId", label: "Code", xs: 1 },
      { key: "transactionName", label: "Transaction", xs: 2 },
      ...(showSubmissionDate ? [{ key: "clientName", label: "Client" }] : []),
      { key: "companyName", label: "Company" },
      ...(showSubmissionDate
        ? [
            {
              key: "date",
              label: "Submission",
              align: "center",
              xs: 1.5,
              render: (_, row) => {
                const color = getDueDateColor(row.dtDocSubmission);
                return (
                  <span
                    style={{
                      color: color ?? "inherit",
                      fontWeight: color ? 600 : 400,
                    }}
                  >
                    {row.date}
                  </span>
                );
              },
            },
          ]
        : []),
      ...(isAssignedToColumnVisible
        ? [{ key: "aoName", label: "Assigned AO" }]
        : []),
      ...(aoDueDateVisible
        ? [
            {
              key: "aoDueDate",
              label: "AO Due Date",
              align: "center",
              xs: 1.5,
              render: (_, row) => {
                const color = getDueDateColor(row.dtAODueDate);
                return (
                  <span
                    style={{
                      color: color ?? "inherit",
                      fontWeight: color ? 600 : 400,
                    }}
                  >
                    {row.aoDueDate}
                  </span>
                );
              },
            },
          ]
        : []),
      ...(!showSubmissionDate
        ? [
            {
              key: "deliveryDate",
              label: "Delivery",
              align: "center",
              xs: 1.5,
              render: (_, row) => {
                const color = getDueDateColor(row.dtDelivery);
                return (
                  <span
                    style={{
                      color: color ?? "inherit",
                      fontWeight: color ? 600 : 400,
                    }}
                  >
                    {row.deliveryDate}
                  </span>
                );
              },
            },
            {
              key: "progress",
              label: "Progress",
              align: "center",
              xs: 2,
              render: (_, row) => (
                <ProgressBar value={txnProgressMap[row.id] ?? 0} />
              ),
            },
            {
              key: "balance",
              label: "Balance",
              align: "right",
              xs: 1.5,
              render: (_, row) => {
                const unpaid = txnBalanceMap[row.id];
                if (unpaid == null)
                  return (
                    <span
                      style={{ color: colors.textMuted, fontSize: "0.7rem" }}
                    >
                      —
                    </span>
                  );
                return (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color:
                        unpaid === 0
                          ? colors.green.paid
                          : colors.amber.warnText,
                    }}
                  >
                    {unpaid === 0
                      ? "₱ 00.00"
                      : `₱ ${Number(unpaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                );
              },
            },
          ]
        : []),
      ...(isCreatedByColumnVisible
        ? [{ key: "createdBy", label: "Created by", xs: 1 }]
        : []),
      ...(!isAccountOfficer || showAOActionColumn
        ? [
            {
              key: "actions",
              xs: isManagement ? 1 : 1,
              label: "Actions",
              align: "center",
              render: renderActions,
            },
          ]
        : []),
    ],
    [
      isAssignedToColumnVisible,
      isCreatedByColumnVisible,
      isAccountOfficer,
      isManagement,
      showAOActionColumn,
      showSubmissionDate,
      aoDueDateVisible,
      renderActions,
      txnProgressMap,
      txnBalanceMap,
      colors,
    ],
  );

  return (
    <PageLayout title="Transaction" subtitle={filterStatus || ""}>
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchTransactions({ bustCache: true })} />
        {(isProcurement || isManagement) && (
          <BaseButton
            label="Transaction"
            tooltip="Add Transaction"
            icon={<Add />}
            actionColor="approve"
            variant="contained"
            onClick={() => {
              setSelectedTransaction(null);
              setIsAEModalOpen(true);
            }}
          />
        )}
      </section>

      <section
        style={{
          backgroundColor: colors.cardBg,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          borderRadius: "0.5rem",
          overflow: "hidden",
        }}
      >
        <CustomTable
          columns={columns}
          rows={filteredTransactions}
          page={page}
          loading={initialLoading || filterLoading || loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {isRevertModalOpen && selectedTransaction && (
        <RevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionCode={selectedTransaction.transactionId}
          transactionId={selectedTransaction.id}
          statusMapping={statusMap}
          isManagement={isManagement}
          saveButtonColor={isAccountOfficer ? "error" : "success"}
          onReverted={() => {
            fetchTransactions({ bustCache: true });
          }}
        />
      )}

      {isHistoryModalOpen && selectedTransaction && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction.id}
          transactionCode={selectedTransaction.transactionId}
          isManagement={isManagement}
          currentUserId={userId}
        />
      )}

      {isDirectCostModalOpen && selectedTransaction && (
        <DirectCostModal
          open={isDirectCostModalOpen}
          onClose={() => {
            setIsDirectCostModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          isPricingSetting={
            isPricingSetting ||
            forCanvasKey.includes(selectedStatusCode) ||
            forCollectionKey.includes(selectedStatusCode)
          }
        />
      )}

      {isAEModalOpen && (
        <TransactionAEModal
          open={isAEModalOpen}
          onClose={() => {
            setIsAEModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onSaved={
            selectedTransaction ? fetchTransactions : handleAddTransactionSaved
          }
          itemType={itemType}
          procMode={procMode}
          procSource={procSource}
          currentUserId={userId}
        />
      )}

      {(isManagement || isProcurement) &&
        isDeleteModalOpen &&
        entityToDelete && (
          <DeleteVerificationModal
            open={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setEntityToDelete(null);
            }}
            entityToDelete={entityToDelete}
            onSuccess={() => fetchTransactions({ bustCache: true })}
          />
        )}

      {isAccountOfficer && isInfoModalOpen && selectedTransaction && (
        <ATransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transactionId={selectedTransaction.id}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
        />
      )}

      {isArchiveModalOpen && archiveModalTransaction && (
        <ArchiveModal
          open={isArchiveModalOpen}
          onClose={() => {
            setIsArchiveModalOpen(false);
            setArchiveModalTransaction(null);
          }}
          transaction={archiveModalTransaction}
          transactionId={archiveModalTransaction.id}
          transactionCode={archiveModalTransaction.transactionId}
          mode="archive"
          archiveStatus={archiveStatus}
          onSuccess={() => {
            setIsArchiveModalOpen(false);
            setArchiveModalTransaction(null);
            fetchTransactions({ bustCache: true });
            window.dispatchEvent(new CustomEvent("txn_data_updated"));
          }}
        />
      )}
    </PageLayout>
  );
}

export default TransactionView;