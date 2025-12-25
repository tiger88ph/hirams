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
import SyncMenu from "../../components/common/Syncmenu";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";
import { filter } from "framer-motion/client";

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
    proc_status,
    clientstatus,
    loading: mappingLoading,
  } = useMapping();

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const draftKey = Object.keys(proc_status)[0] || "";
  const finalizeKey = Object.keys(proc_status)[1] || "";
  const finalizeVerificationKey = Object.keys(proc_status)[2] || "";
  const priceSettingKey = Object.keys(proc_status)[3] || "";
  const priceFinalizeKey = Object.keys(proc_status)[4] || "";
  const priceFinalizeVerificationKey = Object.keys(proc_status)[5] || "";
  const priceApprovalKey = Object.keys(proc_status)[6] || "";
  // Filter status—must match LABEL (not code)
  const [filterStatus, setFilterStatus] = useState("");

  // Set default filter using LABEL (same as MTransaction
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

      // Build label → code mapping
      const labelToCode = Object.fromEntries(
        Object.entries(proc_status).map(([code, label]) => [label, code])
      );

      const formatted = transactionsArray.map((txn) => {
        const rowStatusCode = txn.latest_history?.nStatus;
        const rowStatusLabel = proc_status[rowStatusCode];

        // Determine current_status based on filterStatus
        const current_status =
          rowStatusLabel === filterStatus ? rowStatusCode : rowStatusCode;

        return {
          ...txn,
          id: txn.nTransactionId,
          transactionId: txn.strCode || "--",
          transactionName: txn.strTitle || "--",
          // strRefNumber: txn.strRefNumber || "--",
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
          status: rowStatusLabel, // LABEL
          status_code: rowStatusCode, // CODE
          current_status, // <- now reflects FilterMenu selection
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
  // Map filter label to code
  const filterStatusCode = Object.entries(proc_status).find(
    ([code, label]) => label === filterStatus
  )?.[0]; // will be undefined if no match
  const isCreatedByColumnVisible =
    filterStatusCode &&
    (finalizeVerificationKey.includes(
      filterStatusCode
    ) ||
      priceFinalizeVerificationKey.includes(filterStatusCode));

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
        <SyncMenu onSync={() => fetchTransactions()} />
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
            ...(isCreatedByColumnVisible
              ? [{ key: "createdBy", label: "Created by" }]
              : []),
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => {
                const isDraft = draftKey.includes(
                  String(row.status_code)
                );
                const isFinalize = finalizeKey.includes(
                  String(row.status_code)
                );

                return (
                  <TransactionIcons
                    onInfo={() => {
                      setSelectedTransaction(row);
                      setIsInfoModalOpen(true);
                    }}
                    // Edit only if DRAFT
                    onEdit={
                      isDraft
                        ? () => {
                            setSelectedTransaction(row);
                            setIsEditModalOpen(true);
                          }
                        : null
                    }
                    // Delete only if DRAFT
                    onDelete={isDraft ? () => handleDelete(row) : null}
                    // Revert only if NOT draft
                    onRevert={
                      isDraft
                        ? null
                        : () => {
                            setSelectedTransaction(row);
                            setIsRevertModalOpen(true);
                          }
                    }
                    // Finalize only if NOT finalize status
                    onFinalize={
                      isFinalize
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
            const isFinalized = finalizeKey.includes(
              String(row.status_code)
            );
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
          transactionCode={selectedTransaction?.strCode}
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
