import React, { useState, useEffect } from "react";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";

import { InfoButton, RevertButton } from "../../components/common/Buttons";
import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";

import TransactionInfoModal from "../../components/ui/modals/admin/transaction/TransactionInfoModal";
import MRevertModal from "../../components/ui/modals/admin/transaction/RevertModal";
import TransactionHistoryModal from "../../components/ui/modals/admin/transaction/TransactionHistoryModal";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

function MTransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { transacstatus, loading: mappingLoading } = useMapping();
  const defaultStatus = Object.values(transacstatus)?.[0] || "";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);

  // Set default filter after mapping loads
  useEffect(() => {
    const values = Object.values(transacstatus);
    if (!mappingLoading && values.length > 0) {
      setFilterStatus(values[0]);
    }
  }, [mappingLoading, transacstatus]);

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

  // Filter transactions based on search and status
  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.transactionName?.toLowerCase().includes(searchLower) ||
      t.clientName?.toLowerCase().includes(searchLower) ||
      t.companyName?.toLowerCase().includes(searchLower);

    const matchesFilter =
      t.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <PageLayout title="Transactions">
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        <TransactionFilterMenu
          statuses={transacstatus}
          items={transactions} // transactions array
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          statusKey="status" // the property that holds transaction status
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
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex justify-center space-x-3 text-gray-600">
                  {row.status !== "Draft" && (
                    <RevertButton
                      onClick={() => {
                        setSelectedTransaction(row);
                        setIsRevertModalOpen(true);
                      }}
                    />
                  )}
                  <InfoButton
                    onClick={() => {
                      setSelectedTransaction(row);
                      setIsHistoryModalOpen(true);
                    }}
                  />
                </div>
              ),
            },
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={(row) => {
            setSelectedTransaction(row);
            setIsInfoModalOpen(true);
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

      {isInfoModalOpen && (
        <TransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          onUpdated={fetchTransactions}
          transaction={selectedTransaction}
        />
      )}

      {isRevertModalOpen && (
        <MRevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction?.nTransactionId}
          onReverted={fetchTransactions}
        />
      )}

      {isHistoryModalOpen && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction?.nTransactionId}
        />
      )}
    </PageLayout>
  );
}

export default MTransaction;
