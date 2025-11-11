import React, { useState, useEffect } from "react";
import { Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AccountOfficerIcons } from "../../components/common/Buttons";

import ATransactionInfoModal from "../../components/ui/modals/account-officer/TransactionInfoModal";

import APricingModal from "../../components/ui/modals/account-officer/PricingModal";

import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

function ATransaction() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { draftCode, ao_status, loading: mappingLoading } = useMapping();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [filterStatus, setFilterStatus] = useState();

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  // Set default filter AFTER mapping loads
  useEffect(() => {
    if (!mappingLoading && Object.keys(ao_status)?.length > 0) {
      setFilterStatus(Object.keys(ao_status)[0]);
    }
  }, [mappingLoading, ao_status]);

  // Fetch transactions assigned to this Account Officer
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.nUserId;

      const response = await api.get(
        `transaction/account_officer?nUserId=${userId}`
      );
      // const response = await api.get("transactions");
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
          ao_status[txn.latest_history?.nStatus] ||
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
            {ao_status[filterStatus]}
          </span>
        </div>

        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          {Object.entries(ao_status).map(([code, label]) => (
            <MenuItem
              key={code}
              onClick={() => handleMenuSelect(code)}
              selected={filterStatus === code}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>
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
                <AccountOfficerIcons
                  onInfo={() => {
                    setSelectedTransaction(row);
                    setIsInfoModalOpen(true);
                  }}
                  onPricing={() => {
                    setSelectedTransaction(row); // Set the clicked transaction
                    setIsPricingModalOpen(true); // Open the Pricing modal
                  }}
                  onRevert={() => console.log("Revert clicked")}
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
