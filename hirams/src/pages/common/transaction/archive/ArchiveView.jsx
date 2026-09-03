import React, { useMemo } from "react";
import { useTheme } from "@mui/material";
import PageLayout from "../../../../layouts/page/content-page";
import CustomTable from "../../../../components/form/Table";
import CustomSearchField from "../../../../components/form/SearchField";
import BaseButton from "../../../../components/form/BaseButton";
import SyncMenu from "../../../../components/form/SyncMenu";
import { History, Visibility, Unarchive } from "@mui/icons-material";
import { getDueDateColor } from "../../../../utils/helpers/dueDateColor";
import TransactionHistoryModal from "../transactions/modal/TransactionHistoryModal";
import ArchiveModal from "./modal/ArchiveModal";
import useArchive from "./useArchive";
import getThemeColors from "../../../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — consistent with BankModal & ContactModal pattern
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  blueBg: c.blue.bg,
  blueHover: c.blue.hover,
  blueBorder: c.blue.border,
  blueText: c.blue.text,
  slateBtnBg: c.slate.btnBg,
  slateHover: c.slate.hover,
  grayTextPrimary: c.gray.textPrimary,
  grayTextSecondary: c.gray.textSecondary,
});

export default function ArchiveView() {
  // ✅ STANDARD THEME WIRING
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const {
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    filteredTransactions,
    loading,
    initialLoading,
    selectedArchiveStatusCode,
    selectedTransaction,
    setSelectedTransaction,
    archiveModalTransaction,
    setArchiveModalTransaction,
    archiveModalMode,
    setArchiveModalMode,
    isArchiveModalOpen,
    setIsArchiveModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    archiveStatus,
    isManagement,
    userId,
    completedKey,
    fetchTransactions,
    handleRowClick,
  } = useArchive();

  const columns = [
    { key: "transactionId", label: "Code", xs: 1 },
    { key: "transactionName", label: "Transaction", xs: 3 },
    { key: "clientName", label: "Client" },
    { key: "companyName", label: "Company" },

    ...(selectedArchiveStatusCode !== completedKey
      ? [
          {
            key: "date",
            label: "Submission",
            align: "center",
            xs: 2,
            render: (_, row) => {
              const color = getDueDateColor(row.dtDocSubmission);
              return (
                <span
                  style={{
                    color: color ?? "inherit",
                    fontWeight: color ? 600 : 400,
                  }}
                >
                  {row.date}
                </span>
              );
            },
          },
          { key: "createdBy", label: "Created By" },
          { key: "previous_status_label", label: "Previous", align: "center" },
        ]
      : [{ key: "createdBy", label: "Created By" }]),

    {
      key: "actions",
      label: "Actions",
      align: "center",
      xs: 1,
      render: (_, row) => (
        <div className="flex justify-center gap-0">
          <BaseButton
            icon={<Visibility />}
            tooltip="View Transaction"
            size="small"
            actionColor="view"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
          />
          {selectedArchiveStatusCode !== completedKey && (
            <BaseButton
              icon={<Unarchive />}
              tooltip="Unarchive Transaction"
              size="small"
              actionColor="revert"
              onClick={(e) => {
                e.stopPropagation();
                setArchiveModalTransaction(row);
                setArchiveModalMode("unarchive");
                setIsArchiveModalOpen(true);
              }}
            />
          )}
          {isManagement && (
            <BaseButton
              icon={<History />}
              tooltip="View Transaction History"
              size="small"
              actionColor="deactivate"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTransaction(row);
                setIsHistoryModalOpen(true);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="Transaction Archive"
      subtitle={
        selectedArchiveStatusCode && archiveStatus?.[selectedArchiveStatusCode]
          ? `${archiveStatus[selectedArchiveStatusCode]}`
          : ""
      }
      loading={initialLoading || loading}
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchTransactions({ silent: true })} />
      </section>

      <section
        className="shadow-sm rounded-lg overflow-hidden"
        style={{
          backgroundColor: isDark ? colors.blueBg : "#fff",
          transition: "background-color 0.2s ease",
        }}
      >
        <CustomTable
          columns={columns}
          rows={filteredTransactions}
          page={page}
          loading={initialLoading || loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleRowClick}
        />
      </section>

      {isHistoryModalOpen && selectedTransaction && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          transactionId={selectedTransaction.id}
          transactionCode={selectedTransaction.transactionId}
          isManagement={isManagement}
          currentUserId={userId}
        />
      )}

      {isArchiveModalOpen && archiveModalTransaction && (
        <ArchiveModal
          open={isArchiveModalOpen}
          onClose={() => {
            setIsArchiveModalOpen(false);
            setArchiveModalTransaction(null);
          }}
          transaction={archiveModalTransaction}
          transactionId={archiveModalTransaction.id}
          transactionCode={archiveModalTransaction.transactionId}
          mode={archiveModalMode}
          archiveStatus={archiveStatus}
          onSuccess={() => {
            setIsArchiveModalOpen(false);
            setArchiveModalTransaction(null);
            fetchTransactions({ silent: true });
          }}
        />
      )}
    </PageLayout>
  );
}
