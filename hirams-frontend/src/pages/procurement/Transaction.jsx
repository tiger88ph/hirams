import React, { useState, useEffect } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, TransactionIcons } from "../../components/common/Buttons";

import AddTransactionModal from "../../components/ui/modals/procurement/transaction/AddTransactionModal";
import EditTransactionModal from "../../components/ui/modals/procurement/transaction/EditTransactionModal";
import TransactionInfoModal from "../../components/ui/modals/procurement/transaction/TransactionInfoModal";
import PRevertModal from "../../components/ui/modals/procurement/transaction/RevertModal";
import PricingModal from "../../components/ui/modals/procurement/transaction/PricingModal";

import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

function PTransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { transacstatus, loading: mappingLoading } = useMapping();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // 🟢 Filter state
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  // 🔹 Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await api.get("transaction/procurement");
      const transactionsArray = response.transactions || [];

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
        status: transacstatus[txn.cProcStatus] || txn.cProcStatus,
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

  // 🔹 Search + Filter
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

  return (
    <PageLayout title={HEADER_TITLES.TRANSACTION || "Transactions"}>
      {/* 🔍 Search + Filter + Add */}
      <section className="flex flex-wrap items-center gap-3 mb-4">
        {/* 🔎 Search */}
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* 🧭 Filter */}
        <div className="relative flex items-center bg-gray-100 rounded-lg px-1.5 h-7 flex-shrink-0">
          <IconButton size="small" onClick={handleMenuClick}>
            <FilterListIcon fontSize="small" />
          </IconButton>

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
              </MenuItem>
            ))}
          </Menu>
        </div>

        {/* ➕ Add Button */}
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
            { key: "clientName", label: "Client" },
            { key: "companyName", label: "Company" },
            { key: "date", label: "Submission", align: "center" },
            {
              key: "actions",
              label: TABLE_HEADERS.CLIENT.ACTIONS,
              render: (_, row) => (
                <TransactionIcons
                  onInfo={() => {
                    setSelectedTransaction(row);
                    setIsInfoModalOpen(true);
                  }}
                  onEdit={() => {
                    setSelectedTransaction(row);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={() => alert(`Deleting ${row.transactionId}`)}
                  onRevert={() => {
                    setSelectedTransaction(row);
                    setIsRevertModalOpen(true);
                  }}
                  onPricing={() => {
                    setSelectedTransaction(row);
                    setIsPricingModalOpen(true);
                  }}
                />
              ), align: "center"
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
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) =>
            setRowsPerPage(parseInt(e.target.value, 10))
          }
        />
      </section>

      {/* 🟢 Modals */}
      {isModalOpen && (
        <AddTransactionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchTransactions}
        />
      )}
      {isEditModalOpen && (
        <EditTransactionModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          transaction={selectedTransaction}
          onSaved={fetchTransactions}
        />
      )}
      {isInfoModalOpen && (
        <TransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transactionId={selectedTransaction?.nTransactionId}
          transaction={selectedTransaction}
        />
      )}
      {isRevertModalOpen && selectedTransaction && (
        <PRevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction?.nTransactionId}
          onReverted={fetchTransactions}
        />
      )}
      {isPricingModalOpen && (
        <PricingModal
          open={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          transaction={selectedTransaction}
        />
      )}
    </PageLayout>
  );
}

export default PTransaction;
