import React, { useState, useEffect } from "react";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AccountOfficerIcons } from "../../components/common/Buttons";

import ATransactionInfoModal from "../../components/ui/modals/account-officer/TransactionInfoModal";
import ARevertModal from "../../components/ui/modals/account-officer/RevertModal";
import SyncMenu from "../../components/common/Syncmenu";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";
import { useNavigate } from "react-router-dom";

function ATransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const navigate = useNavigate();
  const {
    ao_status,
    aotl_status,
    userTypes,
    itemType,
    procMode,
    procSource,
    statusTransaction,
    vaGoSeValue,
    loading: mappingLoading,
  } = useMapping();

  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;
  const userId = user?.nUserId;
  const keys = Object.keys(userTypes);

  // Determine if user is a Team Leader (AOTL)
  const accountOfficerKey = [keys[5]];
  const isAOTL = Array.isArray(accountOfficerKey)
    ? accountOfficerKey.includes(userType)
    : accountOfficerKey === userType;

  // Choose the correct status map
  const statusMap = isAOTL ? aotl_status : ao_status;

  // Status keys
  const statusKeys = Object.keys(statusMap);
  const forAssignmentKey = statusKeys[0] || "";
  const itemsManagementKey = statusKeys[isAOTL ? 1 : 0] || "";
  const itemsFinalizeKey = statusKeys[isAOTL ? 2 : 1] || "";
  const itemsVerificationKey = statusKeys[isAOTL ? 3 : 2] || "";
  const forCanvasKey = statusKeys[isAOTL ? 4 : 3] || "";
  const canvasFinalizeKey = statusKeys[isAOTL ? 5 : 4] || "";
  const canvasVerificationKey = statusKeys[isAOTL ? 6 : 5] || "";

  // Modal states
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
    const forVerificationKey = forCanvasKey || "";
  const canvasVerificationLabel = statusKeys[canvasVerificationKey] || "";
  const itemsManagementLabel = statusKeys[itemsManagementKey] || "";
  const forCanvasLabel = statusKeys[forVerificationKey] || "";
  // Load default status filter from sessionStorage or first label
  useEffect(() => {
    if (!mappingLoading && Object.keys(statusMap).length > 0) {
      const savedStatusCode = sessionStorage.getItem("selectedAOStatusCode");
      if (savedStatusCode && statusMap[savedStatusCode]) {
        setSelectedStatus(statusMap[savedStatusCode]);
      } else {
        setSelectedStatus(Object.values(statusMap)[0]);
      }
    }
  }, [mappingLoading, statusMap]);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 🔥 Always fetch ALL transactions for count purposes
      const shouldFetchAll = isAOTL ? 1 : 0;
      const response = await api.get(
        `transaction/account_officer?nUserId=${userId}&isAOTL=${isAOTL ? 1 : 0}&fetchAll=${shouldFetchAll}`
      );
      const list = response.transactions || [];

      const formatted = list.map((txn) => {
        const statusCode = txn.latest_history?.nStatus;

        const formatDateTime = (dateStr) => {
          if (!dateStr) return "—";
          const d = new Date(dateStr);
          if (isNaN(d)) return "—";
          const options = { year: "numeric", month: "short", day: "2-digit" };
          const timeOptions = {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          };
          let formatted = d.toLocaleDateString("en-US", options);
          if (d.getHours() || d.getMinutes()) {
            formatted += `, ${d.toLocaleTimeString("en-US", timeOptions)}`;
          }
          return formatted;
        };

        return {
          ...txn,
          id: txn.nTransactionId,
          transactionId: txn.strCode,
          transactionName: txn.strTitle,
          date: formatDateTime(txn.dtDocSubmission),
          status: statusMap[statusCode],
          status_code: statusCode,
          companyName: txn.company?.strCompanyNickName || "",
          clientName: txn.client?.strClientNickName || "",
          aoDueDate: formatDateTime(txn.dtAODueDate),
          aoName: txn.user
            ? `${txn.user.strFName} ${txn.user.strLName}`.trim()
            : "",
          aoUserId: txn.user?.nUserId || txn.latest_history?.nUserId,
        };
      });

      setTransactions(formatted);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when mappingLoading changes
  useEffect(() => {
    if (!mappingLoading) {
      fetchTransactions();
    }
  }, [mappingLoading]);

  // Map label to code
  const labelToCode = Object.fromEntries(
    Object.entries(statusMap).map(([code, label]) => [label, code]),
  );
  const selectedStatusCode = labelToCode[selectedStatus];

  // Persist selected filter
  useEffect(() => {
    if (selectedStatusCode) {
      sessionStorage.setItem("selectedAOStatusCode", selectedStatusCode);
    }
  }, [selectedStatusCode]);

const filteredTransactions = transactions.filter((t) => {
  const searchValue = search.toLowerCase();
  const matchesSearch =
    t.transactionId?.toLowerCase().includes(searchValue) ||
    t.transactionName?.toLowerCase().includes(searchValue) ||
    t.clientName?.toLowerCase().includes(searchValue) ||
    t.companyName?.toLowerCase().includes(searchValue);

  const txnStatusCode = String(t.status_code);
  let matchesFilter = false;

  if (isAOTL && selectedStatusCode === forAssignmentKey) {
    // ✅ Only AOTL uses "For Assignment" grouping
    const allowedCodes = [
      String(forAssignmentKey),
      String(itemsManagementKey),
      String(itemsVerificationKey),
      String(forCanvasKey),
    ];
    matchesFilter = allowedCodes.includes(txnStatusCode);
  } else {
    // 🔥 FIXED: For verification statuses (220, 240), AOTL sees all
    const isItemsVerificationStatus = txnStatusCode === String(itemsVerificationKey);
    const isCanvasVerificationStatus = txnStatusCode === String(canvasVerificationKey);
    const isVerificationStatus = isItemsVerificationStatus || isCanvasVerificationStatus;

    const selectedIsItemsVerification = selectedStatusCode === String(itemsVerificationKey);
    const selectedIsCanvasVerification = selectedStatusCode === String(canvasVerificationKey);
    const selectedIsVerification = selectedIsItemsVerification || selectedIsCanvasVerification;

    if (isAOTL && selectedIsVerification && isVerificationStatus) {
      // ✅ AOTL viewing verification status: Show all relevant transactions
      matchesFilter = txnStatusCode === selectedStatusCode;
    } else if (isAOTL && t.aoUserId !== userId) {
      // 🔥 AOTL viewing non-verification status: hide unassigned
      matchesFilter = false;
    } else {
      // Regular AO: strict match only (no For Assignment grouping)
      matchesFilter = txnStatusCode === selectedStatusCode;
    }
  }

  return matchesSearch && matchesFilter;
});


  // Column visibility based on selected status
  const isCreatedByColumnVisible =
    selectedStatusCode &&
    (forAssignmentKey.includes(selectedStatusCode) ||
      itemsManagementKey.includes(selectedStatusCode) ||
      itemsVerificationKey.includes(selectedStatusCode) ||
      forCanvasKey.includes(selectedStatusCode) ||
      canvasVerificationKey.includes(selectedStatusCode));

  const showActionColumn =
    selectedStatusCode &&
    !itemsManagementKey.includes(selectedStatusCode) &&
    !forAssignmentKey.includes(selectedStatusCode);

  // Export transaction
  const handleExportTransaction = async (row) => {
    if (!row.nTransactionId) return;

    try {
      const res = await api.get(`transactions/${row.nTransactionId}/items`);
      const items = res.items || [];

      const blob = await api.postBlob("export-transaction", {
        items,
        title: row.strTitle,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transaction_${row.strCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting transaction:", error);
    }
  };

  return (
    <PageLayout title="Transactions">
      {/* Top controls */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        <SyncMenu onSync={fetchTransactions} />

        <TransactionFilterMenu
          statuses={statusMap}
          items={transactions}
          selectedStatus={selectedStatus}
          onSelect={setSelectedStatus}
          statusKey="status"
          forAssignmentCode={forAssignmentKey}
          itemsManagementCode={itemsManagementKey}
          itemsVerificationCode={itemsVerificationKey}
          forCanvasCode={forCanvasKey}
          isAOTL={isAOTL}
          currentUserId={userId}
        />
      </section>

      {/* Transactions Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "transactionId", label: "Code" },
            { key: "transactionName", label: "Transaction" },
            { key: "clientName", label: "Client" },
            { key: "companyName", label: "Company" },
            ...(isCreatedByColumnVisible
              ? [{ key: "aoName", label: "Assigned AO" }]
              : []),
            { key: "aoDueDate", label: "AO Due Date", align: "center" },
            { key: "date", label: "Submission", align: "center" },
            ...(showActionColumn
              ? [
                  {
                    key: "actions",
                    label: "Actions",
                    align: "center",
                    render: (_, row) => {
                      const statusCode = String(row.status_code);
                      const isExportVisible =
                        canvasFinalizeKey.includes(statusCode);

                      return (
                        <AccountOfficerIcons
                          onRevert={() => {
                            setSelectedTransaction(row);
                            setIsRevertModalOpen(true);
                          }}
                          onExport={
                            isExportVisible
                              ? () => handleExportTransaction(row)
                              : undefined
                          }
                        />
                      );
                    },
                  },
                ]
              : []),
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={(row) => {
            navigate("/transaction-canvas", {
              state: {
                transactionId: row.nTransactionId,
                transactionCode: row.strCode,
                transaction: row,
                ao_status: statusMap,
                nUserId: row?.user?.nUserId || row?.latest_history?.nUserId,
                itemsManagementKey,
                itemsFinalizeKey,
                itemsVerificationKey,
                forCanvasKey,
                canvasFinalizeKey,
                canvasVerificationKey,
                forAssignmentKey,
                procMode,
                itemType,
                procSource,
                statusTransaction,
                vaGoSeValue,
                userTypes,
                isAOTL,
                selectedStatusCode,
              },
            });
          }}
        />
        <CustomPagination
          count={filteredTransactions.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </section>

      {/* Modals */}
      {isInfoModalOpen && selectedTransaction && (
        <ATransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transactionId={selectedTransaction.nTransactionId}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
        />
      )}

      {isRevertModalOpen && selectedTransaction && (
        <ARevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionCode={selectedTransaction.strCode}
          transactionId={selectedTransaction.nTransactionId}
          aostatus={statusMap}
          onReverted={(newStatusCode) => {
            fetchTransactions();

            if (newStatusCode && statusMap[newStatusCode]) {
              const newLabel = statusMap[newStatusCode];
              setSelectedStatus(newLabel);
              sessionStorage.setItem("selectedAOStatusCode", newStatusCode);
            }
          }}
        />
      )}
    </PageLayout>
  );
}

export default ATransaction;