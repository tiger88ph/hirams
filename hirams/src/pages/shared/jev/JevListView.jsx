import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import CustomSearchField from "../../../components/ui/form/SearchField";
import CustomTable from "../../../components/ui/form/Table";
import PageLayout from "../../../components/layouts/page/content-page";
import SyncMenu from "../../../components/ui/form/SyncMenu";
import FormControlFilter from "../../../components/ui/form/FormControlFilter";
import BaseButton from "../../../components/ui/form/BaseButton";
import JevEntriesViewModal from "../journal-accounts/modal/JevEntriesViewModal.jsx";
import getThemeColors from "../../../utils/style/getThemeColors.js";
import icons from "../../../utils/style/iconFormatStyles";

// ── Local Color Map — only tokens used in this component ──────────────
// (Named `makeColors`, not `useColors`, so calling it inside useMemo
// doesn't trip react-hooks/rules-of-hooks.)
const makeColors = (c) => ({
  border: c.slate.border,
  blue: { bg: c.blue.bg, text: c.blue.text },
  green: { bg: c.green.bg, text: c.green.text },
  amber: { bg: c.amber.bg, text: c.amber.text },
  red: { bg: c.red.bg, text: c.red.text },
});

// Same pill shape VoucherView uses for its Type / paid badges.
const badgeStyle = (c, colors) => ({
  padding: "4px 8px",
  fontSize: "10px",
  fontWeight: 500,
  borderRadius: "9999px",
  backgroundColor: c.bg,
  color: c.text,
  border: `1px solid ${colors.border}`,
});

// Read-only listing — the type comes from the sidebar (see useJevList), so
// there is no Create / Edit / Delete here, only "View" per row, which opens
// the shared JEV viewer modal.
export default function JevListView({
  itemsLoading,
  search,
  setSearch,
  page,
  rowsPerPage,
  selectedTypeCode,
  jev_types,
  jev_status,
  statusFilter,
  handleStatusFilterChange,
  jevActiveKey,
  jevPendingKey,
  jevCancelledKey,
  tableRows,
  fetchJevs,
  handlePageChange,
  handleRowsPerPageChange,
  handleRowClick,
  closeJevModal,
  jevModal,
  jevModalOpen,
  jevSubTitle,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => makeColors(base), [base]);

  const statusColors = useMemo(
    () => ({
      [jevActiveKey]: colors.green,
      [jevPendingKey]: colors.amber,
      [jevCancelledKey]: colors.red,
    }),
    [colors, jevActiveKey, jevPendingKey, jevCancelledKey],
  );

  // Active / Cancelled / Pending — straight from the jev_status mapping.
  const statusOptions = useMemo(
    () =>
      Object.entries(jev_status || {}).map(([value, label]) => ({
        value,
        label,
      })),
    [jev_status],
  );

  const columns = useMemo(
    () => [
      { key: "strJEVNumber", label: "JEV No.", align: "center" },
      {
        key: "totalLabel",
        label: "Amount",
        align: "right",
        render: (val) => `₱${val}`,
      },
      {
        key: "statusLabel",
        label: "Status",
        align: "center",
        render: (val, row) => (
          <span
            style={badgeStyle(statusColors[row.cStatus] ?? colors.blue, colors)}
          >
            {val}
          </span>
        ),
      },
      { key: "dtOccur", label: "Occurred", align: "center" },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        render: (_, row) => (
          <div className="flex justify-center gap-0">
            <BaseButton
              icon={icons.view}
              tooltip="View JEV"
              size="small"
              actionColor="view"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row);
              }}
            />
          </div>
        ),
      },
    ],
    [colors, statusColors, handleRowClick],
  );

  return (
    <PageLayout
      title="Journal Entry Voucher"
      subtitle={
        selectedTypeCode && jev_types?.[selectedTypeCode]
          ? `${jev_types[selectedTypeCode]}`
          : ""
      }
      footer={false}
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search JEV No. / Payee / Company"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchJevs()} />
        <FormControlFilter
          value={statusFilter}
          onChange={handleStatusFilterChange}
          options={statusOptions}
          allLabel="All Status"
        />
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

      <JevEntriesViewModal
        open={jevModalOpen}
        onClose={closeJevModal}
        jev={jevModal}
        subTitle={jevSubTitle}
      />
    </PageLayout>
  );
}
