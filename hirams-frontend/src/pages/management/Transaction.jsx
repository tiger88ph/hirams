import React, { useState, useEffect } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import TransactionHistoryModal from "../../components/ui/modals/admin/transaction/TransactionHistoryModal";
import { InfoButton, RevertButton } from "../../components/common/Buttons";
import TransactionInfoModal from "../../components/ui/modals/admin/transaction/TransactionInfoModal";
import MRevertModal from "../../components/ui/modals/admin/transaction/RevertModal";

import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

// 🟢 Status badge renderer
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

  // 🟢 Filter menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  const pendingCount = transactions.filter(
    (t) => t.status?.toLowerCase() === "pending"
  ).length;

  // -------------------------
  // 🔹 Fetch Transactions
  // -------------------------
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
      console.error("❌ Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchTransactions();
  }, [mappingLoading]);

  // -------------------------
  // 🔹 Search + Filter
  // -------------------------
  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.transactionName?.toLowerCase().includes(searchLower) ||
      t.clientName?.toLowerCase().includes(searchLower) ||
      t.companyName?.toLowerCase().includes(searchLower);

    const matchesFilter =
      filterStatus === "All" ||
      t.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // -------------------------
  // 🔹 Pagination Handlers
  // -------------------------
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // -------------------------
  // 🔹 Render
  // -------------------------
  return (
    <PageLayout title={HEADER_TITLES.TRANSACTION || "Transactions"}>
      {/* 🔍 Search + Filter */}
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* 🧭 Filter Menu */}
        <div className="relative flex items-center bg-gray-100 rounded-lg px-1.5 h-7 flex-shrink-0">
          <div className="relative flex items-center justify-center h-full">
            <IconButton size="small" onClick={handleMenuClick}>
              <FilterListIcon fontSize="small" />
            </IconButton>

            {pendingCount > 0 && (
              <span className="absolute -top-0 -right-3 bg-red-500 text-white text-[0.6rem] rounded-full px-1 py-[1px]">
                {pendingCount}
              </span>
            )}
          </div>

          <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
            <MenuItem
              key="All"
              onClick={() => handleMenuSelect("All")}
              selected={filterStatus === "All"}
            >
              All
            </MenuItem>

            {Object.values(transacstatus).map((label) => (
              <MenuItem
                key={label}
                onClick={() => handleMenuSelect(label)}
                selected={filterStatus === label}
              >
                {label}
                {label === "Pending" && pendingCount > 0
                  ? ` (${pendingCount})`
                  : ""}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </section>

      {/* 📋 Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "transactionId", label: "Code" },
            { key: "transactionName", label: "Transaction" },
            { key: "clientName", label: "Client" },
            { key: "companyName", label: "Company" },
            { key: "date", label: "Submission", align: "center" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => renderStatusBadge(row.status),
              align: "center",
            },
            {
              key: "actions",
              label: TABLE_HEADERS.CLIENT.ACTIONS,
              render: (_, row) => (
                <div className="flex justify-center space-x-3 text-gray-600">
                  <RevertButton
                    onClick={() => {
                      setSelectedTransaction(row);
                      setIsRevertModalOpen(true);
                    }}
                  />
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

      {/* 🔹 Info Modal */}
      {isInfoModalOpen && (
        <TransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          onUpdated={fetchTransactions}
          transaction={selectedTransaction}
        />
      )}

      {/* 🔹 Revert Modal */}
      {isRevertModalOpen && (
        <MRevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction?.nTransactionId}
          onReverted={fetchTransactions}
        />
      )}

      {/* 🔹 Transaction History Modal */}
      {isHistoryModalOpen && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transaction={selectedTransaction}
        />
      )}
    </PageLayout>
  );
}

export default MTransaction;
