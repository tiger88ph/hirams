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

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

function PTransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { transacstatus, proc_status, loading: mappingLoading } = useMapping();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [filterStatus, setFilterStatus] = useState(""); // ✅ Start empty

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  // ✅ Set default filter AFTER mapping loads
  useEffect(() => {
    if (!mappingLoading && Object.keys(proc_status)?.length > 0) {
      const firstStatus = Object.keys(proc_status)[0];
      setFilterStatus(firstStatus);
    }
  }, [mappingLoading, proc_status]);

  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;

      const response = await api.get(
        `transaction/procurement?nUserId=${userId}`
      );

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
        status:
          proc_status[txn.latest_history?.nStatus] ||
          txn.latest_history?.nStatus ||
          "Unknown",
        status_code: txn.latest_history?.nStatus,
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

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.transactionName?.toLowerCase().includes(searchLower) ||
      t.clientName?.toLowerCase().includes(searchLower) ||
      t.companyName?.toLowerCase().includes(searchLower);

    const matchesFilter =
      !filterStatus || String(t.status_code) === String(filterStatus);

    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (row) => {
    await confirmDeleteWithVerification(row.transactionName, async () => {
      try {
        await showSpinner(`Deleting ${row.transactionName}...`, 1000);
        await api.delete(`transactions/${row.nTransactionId}`);
        setTransactions((prev) =>
          prev.filter((t) => t.nTransactionId !== row.nTransactionId)
        );
        await showSwal("DELETE_SUCCESS", {}, { entity: row.transactionName });
      } catch (error) {
        await showSwal("DELETE_ERROR", {}, { entity: row.transactionName });
      }
    });
  };

  return (
    <PageLayout title={HEADER_TITLES.TRANSACTION || "Transactions"}>
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        <div
          className="flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none"
          onClick={handleMenuClick}
        >
          <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
          <span className="text-sm text-gray-700">
            {proc_status[filterStatus]}
          </span>
        </div>

        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          {Object.entries(proc_status).map(([code, label]) => (
            <MenuItem
              key={code}
              onClick={() => handleMenuSelect(code)}
              selected={filterStatus === code}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>

        <AddButton
          onClick={() => setIsModalOpen(true)}
          label="Add Transaction"
          className="ml-auto"
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
                  onDelete={() => handleDelete(row)}
                  onRevert={
                    row.status === "Creating Transaction"
                      ? null
                      : () => {
                          setSelectedTransaction(row);
                          setIsRevertModalOpen(true);
                        }
                  }
                  onPricing={
                    row.status === "Canvassing Items"
                      ? () => {
                          setSelectedTransaction(row);
                          setIsPricingModalOpen(true);
                        }
                      : null
                  }
                />
              ),
              align: "center",
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
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
          onFinalized={fetchTransactions}
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
          transactionId={selectedTransaction?.nTransactionId}
          transaction={selectedTransaction}
        />
      )}
    </PageLayout>
  );
}

export default PTransaction;
