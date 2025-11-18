import React, { useState, useEffect } from "react";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AccountOfficerIcons } from "../../components/common/Buttons";

import ATransactionInfoModal from "../../components/ui/modals/account-officer/TransactionInfoModal";
import APricingModal from "../../components/ui/modals/account-officer/PricingModal";
import TransactionCanvassingModal from "../../components/ui/modals/account-officer/TransactionCanvassingModal";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";

function ATransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { ao_status, loading: mappingLoading } = useMapping();

  const [selectedStatus, setSelectedStatus] = useState(""); // label-based like MTransaction
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCanvassingModalOpen, setIsCanvassingModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Set default filter as FIRST status label
  useEffect(() => {
    if (!mappingLoading && Object.keys(ao_status)?.length > 0) {
      const firstLabel = Object.values(ao_status)[0];
      setSelectedStatus(firstLabel);
    }
  }, [mappingLoading, ao_status]);

  // Fetch Account Officer transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;

      const response = await api.get(
        `transaction/account_officer?nUserId=${userId}`
      );
      const list = response.transactions || [];

      const formatted = list.map((txn) => {
        const statusCode = txn.latest_history?.nStatus;

        // Format date
        const dateObj = txn.dtDocSubmission
          ? new Date(txn.dtDocSubmission)
          : null;
        let formattedDate = "—";

        if (dateObj && !isNaN(dateObj)) {
          const options = { year: "numeric", month: "short", day: "2-digit" };
          const timeOptions = {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          };

          // Check if time is non-zero
          const hasTime =
            dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0;

          formattedDate = dateObj.toLocaleDateString("en-US", options);
          if (hasTime) {
            formattedDate += `, ${dateObj.toLocaleTimeString("en-US", timeOptions)}`;
          }
        }

        return {
          ...txn,
          id: txn.nTransactionId,
          transactionId: txn.strCode,
          transactionName: txn.strTitle,
          date: formattedDate,
          status: ao_status[statusCode], // readable label
          status_code: statusCode, // numeric code (210/220)
          companyName: txn.company?.strCompanyNickName || "",
          clientName: txn.client?.strClientNickName || "",
          aoDueDate: txn.dtAODueDate,
        };
      });

      setTransactions(formatted);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchTransactions();
  }, [mappingLoading]);

  // FILTERING EXACTLY LIKE MTransaction
  const filteredTransactions = transactions.filter((t) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      t.transactionId?.toLowerCase().includes(searchValue) ||
      t.transactionName?.toLowerCase().includes(searchValue) ||
      t.clientName?.toLowerCase().includes(searchValue) ||
      t.companyName?.toLowerCase().includes(searchValue);

    const matchesStatus = selectedStatus === "" || t.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

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

        {/* 🔥 Reusable menu with auto count */}
        <TransactionFilterMenu
          statuses={ao_status} // { 1:"Pending", 2:"Returned"... }
          items={transactions} // list of transactions
          selectedStatus={selectedStatus} // label
          onSelect={(label) => setSelectedStatus(label)}
          statusKey="status" // MATCH MTransaction
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
            { key: "aoDueDate", label: "AO Due Date", align: "center" },
            {
              key: "actions",
              label: "Actions",
              align: "center",
              render: (_, row) => (
                <AccountOfficerIcons
                  onInfo={() => {
                    setSelectedTransaction(row);
                    setIsCanvassingModalOpen(true);
                  }}
                  // Show revert only if status is "Items Verification"
                  onRevert={
                    row.status === "Items Verification"
                      ? () => {
                          setSelectedTransaction(row);
                          setIsRevertModalOpen(true);
                        }
                      : undefined
                  }
                />
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
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) =>
            setRowsPerPage(parseInt(e.target.value, 10))
          }
        />
      </section>

      {/* MODALS */}
      {isInfoModalOpen && (
        <ATransactionInfoModal
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
      {isCanvassingModalOpen && (
        <TransactionCanvassingModal
          open={isCanvassingModalOpen} // ✅ correct state
          onClose={() => setIsCanvassingModalOpen(false)}
          transactionId={selectedTransaction?.nTransactionId}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
          onFinalized={fetchTransactions}
        />
      )}

      {isPricingModalOpen && (
        <APricingModal
          open={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          transactionId={selectedTransaction?.nTransactionId}
          transaction={selectedTransaction}
        />
      )}
    </PageLayout>
  );
}

export default ATransaction;
