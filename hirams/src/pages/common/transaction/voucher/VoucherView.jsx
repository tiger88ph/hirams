import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import CustomSearchField from "../../../../components/form/SearchField";
import CustomTable from "../../../../components/form/Table";
import PageLayout from "../../../../layouts/page/content-page";
import SyncMenu from "../../../../components/form/SyncMenu";
import BaseButton from "../../../../components/form/BaseButton";
import FormControlFilter from "../../../../components/form/FormControlFilter";
import CreateVoucherModal from "./modal/CreateVoucherModal";
import getThemeColors from "../../../../utils/style/getThemeColors";
import icons from "../../../../utils/style/iconFormatStyles";

// ── Local Color Map — only tokens used in this component ──────────────
const useColors = (c) => ({
  border: c.slate.border,
  violet: { bg: c.violet.bg, text: c.violet.text },
  blue: { bg: c.blue.bg, text: c.blue.text, textDark: c.blue.textStrong },
  green: { bg: c.green.bg, text: c.green.text, textDark: c.green.textDark },
  amber: { bg: c.amber.bg, text: c.amber.text, textDark: c.amber.textDark },
});

export default function VoucherView({
  itemsLoading,
  search,
  setSearch,
  typeFilter,
  voucherModalOpen,
  page,
  rowsPerPage,
  selectedStatusCode,
  isAOTL,
  isManagement,
  isFinanceOfficer,
  currentUserId,
  voucherStatus,
  voucherActiveKey,
  voucherClosedKey,
  voucherCancelledKey,
  voucherSupplierTypeKey,
  voucherAssigneeTypeKey,
  closeCartKey,
  cancelCartKey,
  cancelPoKey,
  forPurchaseKey,
  paidKey,
  receivedKey,
  deliveredKey,
  chequeKey,
  jevDisbursementVoucherKey,
  tableRows,
  handleViewClick,
  handlePageChange,
  handleRowsPerPageChange,
  handleRowClick,
  handleTypeFilterChange,
  fetchVouchers,
  setVoucherModalOpen,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const typeBadgeColors = useMemo(
    () => ({
      assignee: colors.violet,
      supplier: colors.blue,
    }),
    [colors],
  );

  const statusBadgeColors = useMemo(
    () => ({
      paid: colors.green,
      unpaid: colors.amber,
    }),
    [colors],
  );

  const typeFilterOptions = [
    { value: "supplier", label: "Supplier" },
    { value: "assignee", label: "Assignee" },
  ];

  const columns = [
    { key: "strNumber", label: "HDV No.", align: "center" },
    ...(typeFilter === "all"
      ? [
          {
            key: "voucherTypeLabel",
            label: "Type",
            align: "center",
            render: (_, row) => {
              const c = row.isAssigneeType
                ? typeBadgeColors.assignee
                : typeBadgeColors.supplier;
              return (
                <span
                  style={{
                    padding: "4px 8px",
                    fontSize: "10px",
                    fontWeight: 500,
                    borderRadius: "9999px",
                    backgroundColor: c.bg,
                    color: c.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {row.voucherTypeLabel}
                </span>
              );
            },
          },
        ]
      : []),
    { key: "displayName", label: "Name", align: "center" },
    { key: "displayTIN", label: "TIN", align: "center" },
    { key: "displayAddress", label: "Address", xs: 2 },
    { key: "dtCreated", label: "Created", align: "center" },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => (
        <div className="flex justify-center gap-0">
          <BaseButton
            icon={icons.view}
            tooltip="View Voucher"
            size="small"
            actionColor="view"
            onClick={(e) => {
              e.stopPropagation();
              handleViewClick(row._raw);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="Vouchers"
      subtitle={
        selectedStatusCode && voucherStatus?.[selectedStatusCode]
          ? `${voucherStatus[selectedStatusCode]}`
          : ""
      }
      footer={false}
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Vouchers"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchVouchers({ bustCache: true })} />
        {(isFinanceOfficer || isManagement) && (
          <FormControlFilter
            value={typeFilter}
            onChange={handleTypeFilterChange}
            options={typeFilterOptions}
            allLabel="All Types"
            allValue="all"
          />
        )}
        {(isFinanceOfficer || isManagement) && (
          <BaseButton
            label="Create Voucher"
            tooltip="Create Voucher"
            icon={icons.add}
            variant="contained"
            actionColor="approve"
            onClick={() => setVoucherModalOpen(true)}
          />
        )}
      </section>
      <section>
        <CustomTable
          columns={columns}
          rows={tableRows}
          page={page}
          loading={itemsLoading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>
      <CreateVoucherModal
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        onSuccess={() => {
          setVoucherModalOpen(false);
          fetchVouchers({ bustCache: true });
          window.dispatchEvent(new CustomEvent("voucher_data_updated"));
        }}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
        voucherCancelledKey={voucherCancelledKey}
        voucherSupplierTypeKey={voucherSupplierTypeKey}
        voucherAssigneeTypeKey={voucherAssigneeTypeKey}
      />
    </PageLayout>
  );
}
