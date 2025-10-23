import React, { useState } from "react";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, TransactionIcons } from "../../components/common/Buttons";
import AddTransactionModal from "../../components/ui/modals/procurement/transaction/AddTransactionModal";
import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";

// 🟢 Badge renderer for Status
const renderStatusBadge = (status) => {
  const statusMap = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-600",
  };

  const colorClasses = statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
      {status}
    </span>
  );
};

function Transaction() {
  const staticTransactions = [
    { id: 1, transactionId: "TXN-2025001", transactionName: "Purchasing of Light Bulb - DPWH", clientName: "ABC Trading Corp.", amount: "HiRAMS", date: "2025-10-20", status: "Completed" },
    { id: 2, transactionId: "TXN-2025002", transactionName: "Purchasing of 5 dozens of Cooking Oil - Robertos Sarisari Store", clientName: "Delos Reyes Enterprises", amount: "Teknokrat", date: "2025-10-21", status: "Pending" },
    { id: 3, transactionId: "TXN-2025003", transactionName: "Purchasing of Light Bulb - DPWH", clientName: "Dalina Foods", amount: "HiRAMS", date: "2025-10-22", status: "Failed" },
    { id: 4, transactionId: "TXN-2025004", transactionName: "Purchasing of Light Bulb - DPWH", clientName: "Evangelista Logistics", amount: "HiRAMS", date: "2025-10-23", status: "Completed" },
  ];

  const [transactions] = useState(staticTransactions);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    const query = search.toLowerCase();
    return (
      t.transactionId.toLowerCase().includes(query) ||
      t.clientName.toLowerCase().includes(query) ||
      t.status.toLowerCase().includes(query)
    );
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAction = (type, transaction) => alert(`${type} ${transaction.transactionId}`);

  return (
    <PageLayout title={HEADER_TITLES.TRANSACTION || "Transactions"}>
      {/* 🔍 Search + Add */}
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField label="Search Transaction" value={search} onChange={setSearch} />
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
            { key: "amount", label: "Company" },
            { key: "date", label: "Deadline" },
            { key: "status", label: "Status", render: (_, row) => renderStatusBadge(row.status) },
            {
              key: "actions",
              label: TABLE_HEADERS.CLIENT.ACTIONS,
              render: (_, row) => (
                <TransactionIcons
                  onInfo={() => handleAction("Viewing details of", row)}
                  onEdit={() => handleAction("Editing", row)}
                  onDelete={() => handleAction("Deleting", row)}
                />
              ),
            },
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={false}
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
    </PageLayout>
  );
}

export default Transaction;
