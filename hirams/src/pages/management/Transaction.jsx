import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";

import { HistoryButton, RevertButton } from "../../components/common/Buttons";
import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";
import { useNavigate, useLocation } from "react-router-dom";
import MRevertModal from "../../components/ui/modals/admin/transaction/RevertModal";
import TransactionHistoryModal from "../../components/ui/modals/admin/transaction/TransactionHistoryModal";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import SyncMenu from "../../components/common/Syncmenu";

function MTransaction() {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { transacstatus, clientstatus, loading: mappingLoading } = useMapping();
  const defaultStatus = Object.values(transacstatus)?.[0] || "";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);

  // Set default filter after mapping loads
  useEffect(() => {
    const values = Object.values(transacstatus);
    if (!mappingLoading && values.length > 0) {
      // Try to get saved status from sessionStorage
      const savedStatusCode = sessionStorage.getItem("selectedStatusCode");

      if (savedStatusCode && transacstatus[savedStatusCode]) {
        // Restore the saved status
        setFilterStatus(transacstatus[savedStatusCode]);
      } else {
        // Otherwise use default
        setFilterStatus(values[0]);
      }
    }
  }, [mappingLoading, transacstatus]);

  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const draftKey = Object.keys(transacstatus)[0] || "";
  const finalizeKey = Object.keys(transacstatus)[1] || "";
  const forAssignmentKey = Object.keys(transacstatus)[2] || "";
  const itemsManagementKey = Object.keys(transacstatus)[3] || "";
  const itemsVerificationKey = Object.keys(transacstatus)[4] || "";
  const forCanvasKey = Object.keys(transacstatus)[5] || "";
  const canvasVerificationKey = Object.keys(transacstatus)[6] || "";
  const priceVerificationKey = Object.keys(transacstatus)[8] || "";

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const response = await api.get("transactions");
      const transactionsArray = response.transactions || response.data || [];

      const formatted = transactionsArray.map((txn) => ({
        ...txn,
        id: txn.nTransactionId,
        transactionId: txn.strCode,
        transactionName: txn.strTitle,
        date: txn.dtDocSubmission
          ? new Date(txn.dtDocSubmission).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "",
        status:
          transacstatus[txn.latest_history?.nStatus] ||
          txn.latest_history?.nStatus,
        companyName: txn.company?.strCompanyNickName || "",
        clientName: txn.client?.strClientNickName || "",
        aoName: txn.user
          ? `${txn.user.strFName} ${txn.user.strLName}`.trim()
          : "",
      }));

      setTransactions(formatted);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchTransactions();
  }, [mappingLoading]);

  // Get the currently selected status code
  const selectedStatusCode = Object.keys(transacstatus).find(
    (key) => transacstatus[key] === filterStatus
  );

  // Save selectedStatusCode to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedStatusCode) {
      sessionStorage.setItem("selectedStatusCode", selectedStatusCode);
    }
  }, [selectedStatusCode]);

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.transactionName?.toLowerCase().includes(searchLower) ||
      t.clientName?.toLowerCase().includes(searchLower) ||
      t.companyName?.toLowerCase().includes(searchLower);

    // Determine if transaction passes the status filter
    let matchesFilter = false;

    if (selectedStatusCode === forAssignmentKey) {
      // If selected is "For Assignment", include related codes
      const allowedCodes = [
        String(forAssignmentKey),
        String(itemsManagementKey),
        String(itemsVerificationKey),
        String(forCanvasKey),
      ];

      matchesFilter = allowedCodes.includes(String(t.latest_history?.nStatus));
    } else {
      // Otherwise, normal exact match
      matchesFilter = String(t.latest_history?.nStatus) === selectedStatusCode;
    }

    return matchesSearch && matchesFilter;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const isCreatedByColumnVisible =
    (selectedStatusCode &&
      (forAssignmentKey.includes(selectedStatusCode) ||
        itemsManagementKey.includes(selectedStatusCode) ||
        itemsVerificationKey.includes(selectedStatusCode) ||
        forCanvasKey.includes(selectedStatusCode))) ||
    canvasVerificationKey.includes(selectedStatusCode);

  return (
    <PageLayout title="Transactions">
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchTransactions()} />
        <TransactionFilterMenu
          statuses={transacstatus}
          items={transactions}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          statusKey="status"
          forAssignmentCode={forAssignmentKey}
          itemsManagementCode={itemsManagementKey}
          itemsVerificationCode={itemsVerificationKey}
          forCanvasCode={forCanvasKey}
        />
      </section>

      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "transactionId", label: "Code" },
            { key: "transactionName", label: "Transaction" },
            { key: "clientName", label: "Client" },
            { key: "companyName", label: "Company" },
            { key: "date", label: "Submission", align: "center" },
            ...(isCreatedByColumnVisible
              ? [{ key: "aoName", label: "Assigned AO" }]
              : []),
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => {
                const isDraft = draftKey.includes(
                  String(row.latest_history?.nStatus)
                );
                const showRevert = !isDraft;
                return (
                  <div className="flex justify-center space-x-3 text-gray-600">
                    {showRevert && (
                      <RevertButton
                        onClick={() => {
                          setSelectedTransaction(row);
                          setIsRevertModalOpen(true);
                        }}
                      />
                    )}

                    <HistoryButton
                      onClick={() => {
                        setSelectedTransaction(row);
                        setIsHistoryModalOpen(true);
                      }}
                    />
                  </div>
                );
              },
            },
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={(row) => {
            navigate("/m-transaction-canvas", {
              state: {
                transactionId: row.nTransactionId,
                transactionCode: row.strCode,
                transaction: row,
                nUserId: row?.user?.nUserId || row?.latest_history?.nUserId,
                selectedStatusCode: selectedStatusCode,
              },
            });
          }}
        />

        <CustomPagination
          count={filteredTransactions.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      <MRevertModal
        open={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        transaction={selectedTransaction}
        transactionId={selectedTransaction?.nTransactionId}
        transactionCode={selectedTransaction?.strCode}
        transacstatus={transacstatus}
        onReverted={(newStatusCode) => {
          fetchTransactions();

          if (newStatusCode && transacstatus[newStatusCode]) {
            const newLabel = transacstatus[newStatusCode];

            setFilterStatus(newLabel);
            sessionStorage.setItem("selectedStatusCode", newStatusCode);
          }
        }}
      />

      {isHistoryModalOpen && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction?.nTransactionId}
          transactionCode={selectedTransaction?.strCode}
        />
      )}
    </PageLayout>
  );
}

export default MTransaction;
