import React, { useState, useEffect } from "react";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, TransactionIcons } from "../../components/common/Buttons";
import AddTransactionModal from "../../components/ui/modals/procurement/transaction/AddTransactionModal";
import EditTransactionModal from "../../components/ui/modals/procurement/transaction/EditTransactionModal";
import TransactionInfoModal from "../../components/ui/modals/procurement/transaction/TransactionInfoModal";

import HEADER_TITLES from "../../utils/header/page";

import TABLE_HEADERS from "../../utils/header/table";
import api from "../../utils/api/api";

// 🟢 Badge renderer for Status
const renderStatusBadge = (status) => {
  const statusMap = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-600",
  };

  const colorClasses =
    statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}
    >
      {status}
    </span>
  );
};

function Transaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  const fetchTransactions = async () => {
    try {
      const response = await api.get("transactions");
      const transactionsArray = response.transactions || [];

      const formatted = transactionsArray.map((txn) => ({
        ...txn, // ✅ keep full backend object
        id: txn.nTransactionId,
        transactionId: txn.strCode,
        transactionName: txn.strTitle,
        companyName: txn.company?.strCompanyName || "",
        clientName: txn.client?.strClientName || "",
      }));

      setTransactions(formatted);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();

    return (
      (t.transactionId?.toString() || "").toLowerCase().includes(searchLower) ||
      (t.title?.toLowerCase() || "").includes(searchLower) ||
      (t.clientName?.toLowerCase() || "").includes(searchLower) ||
      (t.companyName?.toLowerCase() || "").includes(searchLower)
    );
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAction = (type, transaction) =>
    alert(`${type} ${transaction.transactionId}`);

  return (
    <PageLayout title={HEADER_TITLES.TRANSACTION || "Transactions"}>
      {/* 🔍 Search + Add */}
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        <AddButton
          onClick={() => setIsModalOpen(true)}
          label="Add Transaction"
          className="ml-auto"
        />
      </section>

      {/* 📋 Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "transactionId", label: "Code" },
            { key: "transactionName", label: "Transaction" },
            { key: "clientName", label: "Client Name" },
            { key: "companyName", label: "Company" },
            { key: "date", label: "Deadline" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => renderStatusBadge(row.status),
            },
            {
              key: "actions",
              label: TABLE_HEADERS.CLIENT.ACTIONS,
              render: (_, row) => (
                <TransactionIcons
                  onInfo={() => handleAction("Viewing details of", row)}
                  onEdit={() => {
                    setSelectedTransaction(row);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={() => handleAction("Deleting", row)}
                />
              ),
            },
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={false}
          onRowClick={(row) => {
            setSelectedTransaction(row);
            setSelectedTransactionId(row.id);
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

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <AddTransactionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isEditModalOpen && (
        <EditTransactionModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          transaction={selectedTransaction}
        />
      )}
      {isInfoModalOpen && (
        <TransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transaction={selectedTransaction}
        />  
      )}
    </PageLayout>
  );
}

export default Transaction;
