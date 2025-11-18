import React, { useState, useEffect } from "react";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, TransactionIcons } from "../../components/common/Buttons";

import AddTransactionModal from "../../components/ui/modals/procurement/transaction/AddTransactionModal";
import EditTransactionModal from "../../components/ui/modals/procurement/transaction/EditTransactionModal";
import PTransactionInfoModal from "../../components/ui/modals/procurement/transaction/TransactionInfoModal";
import PRevertModal from "../../components/ui/modals/procurement/transaction/RevertModal";
import PricingModal from "../../components/ui/modals/procurement/transaction/PricingModal";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";

function PTransaction() {
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
  const {
    draftCode,
    finalizeCode,
    proc_status,
    loading: mappingLoading,
  } = useMapping();

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Filter status—must match LABEL (not code)
  const [filterStatus, setFilterStatus] = useState("");

  // Set default filter using LABEL (same as MTransaction)
  useEffect(() => {
    if (!mappingLoading && Object.values(proc_status)?.length > 0) {
      const firstStatusLabel = Object.values(proc_status)[0];
      setFilterStatus(firstStatusLabel);
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
        status: proc_status[txn.latest_history?.nStatus], // LABEL
        status_code: txn.latest_history?.nStatus, // CODE
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

  // Filtering — MUST match STATUS LABEL (same as MTransaction)
  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.transactionName?.toLowerCase().includes(searchLower) ||
      t.clientName?.toLowerCase().includes(searchLower) ||
      t.companyName?.toLowerCase().includes(searchLower);

    // Match LABEL, not code
    const matchesFilter =
      t.status?.toLowerCase() === filterStatus?.toLowerCase();

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
    <PageLayout title={"Transactions"}>
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* Filter Menu — now works EXACTLY like MTransaction */}
        <TransactionFilterMenu
          statuses={proc_status}
          items={transactions}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          statusKey="status" // MATCH LABEL
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
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => {
                const isFinalized = Object.keys(finalizeCode).includes(
                  String(row.status_code)
                );

                return (
                  <TransactionIcons
                    onInfo={() => {
                      setSelectedTransaction(row);
                      setIsInfoModalOpen(true);
                    }}
                    onEdit={
                      isFinalized
                        ? null
                        : () => {
                            setSelectedTransaction(row);
                            setIsEditModalOpen(true);
                          }
                    }
                    onDelete={isFinalized ? null : () => handleDelete(row)}
                    onRevert={
                      Object.keys(draftCode).includes(String(row.status_code))
                        ? null
                        : () => {
                            setSelectedTransaction(row);
                            setIsRevertModalOpen(true);
                          }
                    }
                    onFinalize={
                      isFinalized
                        ? null
                        : () => {
                            setSelectedTransaction(row);
                            setIsPricingModalOpen(true);
                          }
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
          onRowClick={(row) => {
            setSelectedTransaction(row);
            setIsInfoModalOpen(true);
          }}
          rowClassName={(row) => {
            const user = JSON.parse(localStorage.getItem("user"));
            const userId = user?.nUserId;
            const isFinalized = Object.keys(finalizeCode).includes(
              String(row.status_code)
            );

            return isFinalized && row.latest_history?.nUserId !== userId
              ? "blinking-yellow"
              : "";
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
        <PTransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transactionId={selectedTransaction?.nTransactionId}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
          onFinalized={fetchTransactions}
          onVerified={fetchTransactions} // ← add this
        />
      )}

      {isRevertModalOpen && (
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
