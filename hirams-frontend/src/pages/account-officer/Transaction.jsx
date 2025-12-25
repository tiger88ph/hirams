import React, { useState, useEffect } from "react";
import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AccountOfficerIcons } from "../../components/common/Buttons";

import ATransactionInfoModal from "../../components/ui/modals/account-officer/TransactionInfoModal";
import ARevertModal from "../../components/ui/modals/account-officer/RevertModal";
import APricingModal from "../../components/ui/modals/account-officer/PricingModal";
import TransactionCanvassingModal from "../../components/ui/modals/account-officer/TransactionCanvassingModal";
import SyncMenu from "../../components/common/Syncmenu";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import TransactionFilterMenu from "../../components/common/TransactionFilterMenu";
import TransactionCanvas from "./TransactionCanvas";
import { useNavigate } from "react-router-dom";

function ATransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { ao_status, loading: mappingLoading } = useMapping();

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const itemsManagementKey = Object.keys(ao_status)[0] || "";
  const itemsFinalizeKey = Object.keys(ao_status)[1] || "";
  const itemsVerificationKey = Object.keys(ao_status)[2] || "";
  const forCanvasKey = Object.keys(ao_status)[3] || "";
  const canvasFinalizeKey = Object.keys(ao_status)[4] || "";
  const canvasVerificationKey = Object.keys(ao_status)[5] || "";

  // Modal states
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCanvassingModalOpen, setIsCanvassingModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);

  // Set default status filter
  useEffect(() => {
    if (!mappingLoading && Object.keys(ao_status).length > 0) {
      const firstLabel = Object.values(ao_status)[0];
      setSelectedStatus(firstLabel);
    }
  }, [mappingLoading, ao_status]);

  // Fetch transactions
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

        // Format submission date
        const submissionDateObj = txn.dtDocSubmission
          ? new Date(txn.dtDocSubmission)
          : null;
        let formattedSubmissionDate = "—";

        if (submissionDateObj && !isNaN(submissionDateObj)) {
          const options = { year: "numeric", month: "short", day: "2-digit" };
          const timeOptions = {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          };
          formattedSubmissionDate = submissionDateObj.toLocaleDateString(
            "en-US",
            options
          );
          if (
            submissionDateObj.getHours() !== 0 ||
            submissionDateObj.getMinutes() !== 0
          ) {
            formattedSubmissionDate += `, ${submissionDateObj.toLocaleTimeString(
              "en-US",
              timeOptions
            )}`;
          }
        }

        // Format AO due date
        const aoDueDateObj = txn.dtAODueDate ? new Date(txn.dtAODueDate) : null;
        let formattedAODueDate = "—";

        if (aoDueDateObj && !isNaN(aoDueDateObj)) {
          const options = { year: "numeric", month: "short", day: "2-digit" };
          const timeOptions = {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          };
          formattedAODueDate = aoDueDateObj.toLocaleDateString(
            "en-US",
            options
          );
          if (
            aoDueDateObj.getHours() !== 0 ||
            aoDueDateObj.getMinutes() !== 0
          ) {
            formattedAODueDate += `, ${aoDueDateObj.toLocaleTimeString(
              "en-US",
              timeOptions
            )}`;
          }
        }

        return {
          ...txn,
          id: txn.nTransactionId,
          transactionId: txn.strCode,
          transactionName: txn.strTitle,
          date: formattedSubmissionDate,
          status: ao_status[statusCode],
          status_code: statusCode,
          companyName: txn.company?.strCompanyNickName || "",
          clientName: txn.client?.strClientNickName || "",
          aoDueDate: formattedAODueDate,
          aoName: txn.user
            ? `${txn.user.strFName} ${txn.user.strLName}`.trim()
            : "",
        };
      });

      setTransactions(formatted);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };
  // Transaction.jsx
  const handleExportTransaction = async (row) => {
    if (!row.nTransactionId) return;

    try {
      // 1️⃣ Fetch transaction items
      const res = await api.get(`transactions/${row.nTransactionId}/items`);
      const items = res.items || [];
      console.log("Full transaction info:", row);
      console.log("Exported items:", items);

      // 2️⃣ Send items to backend to generate Excel
      // Assumes you have a POST endpoint 'export-transaction' that accepts JSON items
      const blob = await api.postBlob("export-transaction", {
        items,
        title: row.strTitle, // 👈 send it!
      });

      // 3️⃣ Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transaction_${row.strCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      console.log("Export successful!");
    } catch (error) {
      console.error("Error exporting transaction:", error);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchTransactions();
  }, [mappingLoading]);

  // Filter transactions
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
  // Map labels to codes
  const labelToCode = Object.fromEntries(
    Object.entries(ao_status).map(([code, label]) => [label, code])
  );
  const selectedStatusCode = labelToCode[selectedStatus];

  const isCreatedByColumnVisible =
    selectedStatusCode &&
    (itemsVerificationKey.includes(selectedStatusCode) ||
      itemsFinalizeKey.includes(selectedStatusCode));

  return (
    <PageLayout title="Transactions">
      {/* Top controls aligned like PTransaction */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        <SyncMenu onSync={fetchTransactions} />

        <TransactionFilterMenu
          statuses={ao_status}
          items={transactions}
          selectedStatus={selectedStatus}
          onSelect={setSelectedStatus}
          statusKey="status"
        />
      </section>

      {/* Transactions Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "transactionId", label: "Code" },
            { key: "transactionName", label: "Transaction" },
            { key: "clientName", label: "Client" },
            { key: "companyName", label: "Company" },
            { key: "aoDueDate", label: "AO Due Date", align: "center" },
            { key: "date", label: "Submission", align: "center" },
            ...(isCreatedByColumnVisible
              ? [{ key: "aoName", label: "Assigned AO" }]
              : []),
            {
              key: "actions",
              label: "Actions",
              align: "center",
              render: (_, row) => {
                const statusCode = String(row.status_code);
                const isItemsManagement =
                  itemsManagementKey.includes(statusCode);
                const isExportVisible = canvasFinalizeKey.includes(statusCode);
                const showRevert = !isItemsManagement;

                return (
                  <AccountOfficerIcons
                   onInfo={() => {
  navigate("/transaction-canvas", {
    state: {
      transactionId: row.nTransactionId,
      transactionCode: row.strCode,
      transaction: row,
      nUserId:
        row?.user?.nUserId ||
        row?.latest_history?.nUserId,
    },
  });
}}

                    onRevert={
                      showRevert
                        ? () => {
                            setSelectedTransaction(row);
                            setIsRevertModalOpen(true);
                          }
                        : undefined
                    }
                    onExport={
                      isExportVisible && (() => handleExportTransaction(row))
                    }
                  />
                );
              },
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

      {/* MODAL */}
      {isInfoModalOpen && selectedTransaction && (
        <ATransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transactionId={selectedTransaction.nTransactionId}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
        />
      )}

      {/* {isCanvassingModalOpen && selectedTransaction && (
        <TransactionCanvassingModal
          open={isCanvassingModalOpen}
          onClose={() => setIsCanvassingModalOpen(false)}
          transactionId={selectedTransaction.nTransactionId}
          transactionCode={selectedTransaction.strCode}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
          onVerified={fetchTransactions}
          onFinalized={fetchTransactions}
          onReverted={fetchTransactions}
        />
      )} */}

      {isRevertModalOpen && selectedTransaction && (
        <ARevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionCode={selectedTransaction.strCode}
          transactionId={selectedTransaction.nTransactionId}
          onReverted={fetchTransactions}
        />
      )}

      {isPricingModalOpen && selectedTransaction && (
        <APricingModal
          open={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          transactionId={selectedTransaction.nTransactionId}
          transaction={selectedTransaction}
        />
      )}
    </PageLayout>
  );
}

export default ATransaction;
