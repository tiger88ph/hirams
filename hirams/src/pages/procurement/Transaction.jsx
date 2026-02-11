import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Undo,
  PriceCheck,
} from "@mui/icons-material";
import BaseButton from "../../components/common/BaseButton";
import PRevertModal from "../../components/ui/modals/procurement/RevertModal";
import PricingModal from "../../components/ui/modals/procurement/PricingModal";
import TransactionAEModal from "../../components/ui/modals/procurement/TransactionAEModal";

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
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAEModalOpen, setIsAEModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    proc_status,
    clientstatus,
    itemType,
    procMode,
    procSource,
    loading: mappingLoading,
  } = useMapping();
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const activeKey = Object.keys(clientstatus)[0];
  const draftKey = Object.keys(proc_status)[0] || "";
  const finalizeKey = Object.keys(proc_status)[1] || "";
  const finalizeVerificationKey = Object.keys(proc_status)[2] || "";
  const priceSettingKey = Object.keys(proc_status)[3] || "";
  const priceFinalizeKey = Object.keys(proc_status)[4] || "";
  const priceFinalizeVerificationKey = Object.keys(proc_status)[5] || "";
  const priceApprovalKey = Object.keys(proc_status)[6] || "";
  const defaultStatus = Object.values(proc_status)?.[0] || "";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);

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
  const selectedStatusCode = Object.keys(proc_status).find(
    (key) => proc_status[key] === filterStatus,
  );

  useEffect(() => {
    if (selectedStatusCode) {
      sessionStorage.setItem("selectedProcStatusCode", selectedStatusCode);
    }
  }, [selectedStatusCode]);
  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;

      const response = await api.get(
        `transaction/procurement?nUserId=${userId}`,
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
  const handleDelete = async (row) => {
    await confirmDeleteWithVerification(row.transactionName, async () => {
      try {
        await showSpinner(`Deleting ${row.transactionName}...`, 1000);
        await api.delete(`transactions/${row.nTransactionId}`);
        setTransactions((prev) =>
          prev.filter((t) => t.nTransactionId !== row.nTransactionId),
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

        <BaseButton
          label="Add Transaction"
          icon={<Add />}
          onClick={() => {
            setSelectedTransaction(null); // null = add mode
            setIsAEModalOpen(true);
          }}
          color="primary"
          variant="contained"
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
              align: "center",
              render: (_, row) => {
                const isDraft = draftKey.includes(String(row.status_code));
                const isRevertVisible =
                  !draftKey.includes(String(row.status_code)) &&
                  !priceSettingKey.includes(String(row.status_code));

                const isPricing = priceSettingKey.includes(
                  String(row.status_code),
                );

                return (
                  <div className="flex justify-center gap-1">
                    {isDraft && (
                      <BaseButton
                        icon={<Edit />}
                        tooltip="Edit Transaction"
                        color="primary"
                        onClick={() => {
                          setSelectedTransaction(row);
                          setIsAEModalOpen(true);
                        }}
                      />
                    )}
                    {/* Delete (Draft only) */}
                    {isDraft && (
                      <BaseButton
                        icon={<Delete />}
                        tooltip="Delete Transaction"
                        color="error"
                        onClick={() => handleDelete(row)}
                      />
                    )}

                    {isRevertVisible && (
                      <BaseButton
                        icon={<Undo />}
                        tooltip="Revert Transaction"
                        onClick={() => {
                          setSelectedTransaction(row);
                          setIsRevertModalOpen(true);
                        }}
                      />
                    )}

                    {isPricing && (
                      <BaseButton
                        icon={<PriceCheck />}
                        tooltip="Set Pricing"
                        color="success"
                        onClick={() => {
                          setSelectedTransaction(row); // store locally if needed
                          navigate("/p-transaction-pricing", {
                            state: {
                              transaction: row,
                              selectedStatusCode,
                              clientNickName: row.clientName, // ✅ pass client nickname
                            },
                          });
                        }}
                      />
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={filteredTransactions}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={(row) =>
            navigate("/p-transaction-info", {
              state: {
                transaction: row,
                selectedStatusCode,
              },
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

      {isAEModalOpen && (
        <TransactionAEModal
          open={isAEModalOpen}
          onClose={() => {
            setIsAEModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onSaved={
            selectedTransaction ? fetchTransactions : handleAddTransactionSaved
          }
          itemType={itemType}
          procMode={procMode}
          procSource={procSource}
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
