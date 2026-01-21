import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, TransactionIcons } from "../../components/common/Buttons";

import AddTransactionModal from "../../components/ui/modals/procurement/transaction/AddTransactionModal";
import EditTransactionModal from "../../components/ui/modals/procurement/transaction/EditTransactionModal";
import PRevertModal from "../../components/ui/modals/procurement/transaction/RevertModal";
import PricingModal from "../../components/ui/modals/procurement/transaction/PricingModal";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import SyncMenu from "../../components/common/Syncmenu";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";

function PTransaction() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { proc_status, clientstatus, loading: mappingLoading } = useMapping();
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const activeKey = Object.keys(clientstatus)[0];
  const draftKey = Object.keys(proc_status)[0] || "";
  const finalizeKey = Object.keys(proc_status)[1] || "";
  const finalizeVerificationKey = Object.keys(proc_status)[2] || "";
  const priceSettingKey = Object.keys(proc_status)[3] || "";
  const priceFinalizeKey = Object.keys(proc_status)[4] || "";
  const priceFinalizeVerificationKey = Object.keys(proc_status)[5] || "";
  const priceApprovalKey = Object.keys(proc_status)[6] || "";

  // Default status
  const defaultStatus = Object.values(proc_status)?.[0] || "";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);

  // Set default filter after mapping loads + restore from sessionStorage
  useEffect(() => {
    const values = Object.values(proc_status);
    if (!mappingLoading && values.length > 0) {
      const savedStatusCode = sessionStorage.getItem("selectedProcStatusCode");

      if (savedStatusCode && proc_status[savedStatusCode]) {
        setFilterStatus(proc_status[savedStatusCode]);
      } else {
        setFilterStatus(values[0]);
      }
    }
  }, [mappingLoading, proc_status]);

  // Selected status code (for filtering)
  const selectedStatusCode = Object.keys(proc_status).find(
    (key) => proc_status[key] === filterStatus
  );

  // Persist selected status
  useEffect(() => {
    if (selectedStatusCode) {
      sessionStorage.setItem("selectedProcStatusCode", selectedStatusCode);
    }
  }, [selectedStatusCode]);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;

      const response = await api.get(
        `transaction/procurement?nUserId=${userId}`
      );
      const transactionsArray = response.transactions || [];

      const formatted = transactionsArray.map((txn) => {
        const rowStatusCode = txn.latest_history?.nStatus;
        const rowStatusLabel = proc_status[rowStatusCode];

        return {
          ...txn,
          id: txn.nTransactionId,
          transactionId: txn.strCode || "--",
          transactionName: txn.strTitle || "--",
          date: txn.dtDocSubmission
            ? new Date(txn.dtDocSubmission).toLocaleString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "--",
          status: rowStatusLabel,
          status_code: rowStatusCode,
          companyName: txn.company?.strCompanyNickName || "--",
          clientName: txn.client?.strClientNickName || "--",
          createdBy: txn.created_by || "--",
        };
      });

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

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.transactionName?.toLowerCase().includes(searchLower) ||
      t.clientName?.toLowerCase().includes(searchLower) ||
      t.companyName?.toLowerCase().includes(searchLower);

    const matchesFilter = String(t.status_code) === String(selectedStatusCode);

    return matchesSearch && matchesFilter;
  });

  // Handle delete
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

  const isCreatedByColumnVisible =
    selectedStatusCode &&
    (finalizeVerificationKey.includes(selectedStatusCode) ||
      priceFinalizeVerificationKey.includes(selectedStatusCode));

  // ✅ Handle add transaction - reset filter to default status
  const handleAddTransactionSaved = async () => {
    const defaultStatusValue = Object.values(proc_status)?.[0];
    if (defaultStatusValue) {
      setFilterStatus(defaultStatusValue);
      // Also clear sessionStorage to truly reset to default
      const defaultStatusCode = Object.keys(proc_status)[0];
      sessionStorage.setItem("selectedProcStatusCode", defaultStatusCode);
    }
    await fetchTransactions();
  };

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

        {/* Filter Menu */}
        <TransactionFilterMenu
          statuses={proc_status}
          items={transactions}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          statusKey="status"
        />

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
            ...(isCreatedByColumnVisible
              ? [{ key: "createdBy", label: "Created by" }]
              : []),
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => {
                const isDraft = draftKey.includes(String(row.status_code));
                const isFinalize = finalizeKey.includes(
                  String(row.status_code)
                );

                return (
                  <TransactionIcons
                    onInfo={() => {
                      setSelectedTransaction(row);
                      setIsInfoModalOpen(true);
                    }}
                    onEdit={
                      isDraft
                        ? () => {
                            setSelectedTransaction(row);
                            setIsEditModalOpen(true);
                          }
                        : null
                    }
                    onDelete={isDraft ? () => handleDelete(row) : null}
                    onRevert={
                      !isDraft
                        ? () => {
                            setSelectedTransaction(row);
                            setIsRevertModalOpen(true);
                          }
                        : null
                    }
                    onFinalize={
                      !isFinalize
                        ? () => {
                            setSelectedTransaction(row);
                            setIsPricingModalOpen(true);
                          }
                        : null
                    }
                  />
                );
              },
              align: "center",
            },
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={(row) =>
            navigate("/p-transaction-info", {
              state: { transaction: row, selectedStatusCode },
            })
          }
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
          onSaved={handleAddTransactionSaved} 
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

      {isRevertModalOpen && (
        <PRevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction?.nTransactionId}
          onReverted={async (revertTo) => {
            await fetchTransactions();
            if (revertTo) setFilterStatus(proc_status[revertTo]);
          }}
          proc_status={proc_status}
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