import React, { useMemo } from "react";
import { useTheme } from "@mui/material";
import { Visibility } from "@mui/icons-material";
import PageLayout from "../../../layouts/page/content-page";
import CustomTable from "../../../components/form/Table";
import CustomSearchField from "../../../components/form/SearchField";
import SyncMenu from "../../../components/form/SyncMenu";
import BaseButton from "../../../components/form/BaseButton";
import FormControlFilter from "../../../components/form/FormControlFilter";
import InventoryItemInfoModal from "./modal/InventoryItemInfoModal";
import { fmtDateTime } from "../../../utils/helpers/timeZone";
import getThemeColors from "../../../utils/style/getThemeColors.js";

// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — pulls ONLY tokens THIS component actually uses
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  cardBg: c.slate.btnBg,
  border: c.slate.border,
  shadow: "0 1px 2px rgba(0,0,0,0.05)",
  rounded: "0.5rem",
});

export default function InventoryView({
  itemsLoading,
  items,
  companies,
  search,
  setSearch,
  companyFilter,
  selectedItemId,
  viewModalOpen,
  page,
  rowsPerPage,
  selectedStatusCode,
  inventoryStatus,
  inventoryReceivedKey,
  inventoryDeliveredKey,
  inventoryPendingKey,
  inventoryCancelledKey,
  inventoryReceivedLabel,
  inventoryDeliveredLabel,
  inventoryPendingLabel,
  inventoryCancelledLabel,
  filteredItems,
  fetchItems,
  handlePageChange,
  handleRowsPerPageChange,
  handleRowClick,
  handleCompanyFilterChange,
  closeModal,
}) {
  // ✅ Standardized color wiring
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const tableRows = useMemo(
    () =>
      filteredItems.map((i) => ({
        _raw: i,
        id: i.nInventoryId,
        nInventoryId: i.nInventoryId,
        strBrand: i.purchaseOption?.strBrand ?? "—",
        strModel: i.purchaseOption?.strModel ?? "—",
        strUOM: i.purchaseOption?.strUOM ?? "—",
        dUnitPrice: Number(i.purchaseOption?.dUnitPrice ?? 0).toLocaleString(
          "en-PH",
          { minimumFractionDigits: 2 },
        ),
        nQuantity: Math.abs(i.nQuantity),
        cStatus: i.cStatus,
        dtLog: fmtDateTime(i.dtLog),
        strSupplierNickName: i.strSupplierNickName ?? "—",
        strClientNickName: i.strClientNickName ?? "—",
        strCompanyNickName: i.strCompanyNickName ?? "—",
      })),
    [filteredItems],
  );

  const columns = useMemo(
    () => [
      { key: "strBrand", label: "Brand" },
      { key: "strModel", label: "Model" },
      {
        key: "nQuantity",
        label: "Quantity",
        align: "center",
        render: (val, row) => `${val} ${row.strUOM}`,
      },
      {
        key: "dUnitPrice",
        label: "Unit Price",
        align: "right",
        render: (val) => `₱${val}`,
      },
      { key: "strSupplierNickName", label: "Supplier", align: "center" },
      { key: "strClientNickName", label: "Client", align: "center" },
      { key: "dtLog", label: "Date", align: "center", xs: 1.5 },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        render: (_, row) => (
          <div className="flex justify-center">
            <BaseButton
              icon={<Visibility fontSize="small" />}
              tooltip="View"
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
    [handleRowClick],
  );

  const companyOptions = useMemo(
    () =>
      companies.map((c) => ({
        value: c.strCompanyNickName,
        label: c.strCompanyNickName,
      })),
    [companies],
  );

  return (
    <PageLayout
      title="Inventory"
      subtitle={
        selectedStatusCode && inventoryStatus?.[selectedStatusCode]
          ? `${inventoryStatus[selectedStatusCode]}`
          : ""
      }
      footer={false}
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Brand / Model / Supplier / Client / Company"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchItems({ bustCache: true })} />
        <FormControlFilter
          value={companyFilter}
          onChange={handleCompanyFilterChange}
          options={companyOptions}
          allLabel="All Companies"
        />
      </section>

      {/* ✅ Hardcoded bg-white → theme token */}
      <section
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
          borderRadius: colors.rounded,
          overflow: "hidden",
        }}
      >
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

      <InventoryItemInfoModal
        open={viewModalOpen}
        item={items.find((i) => i.nInventoryId === selectedItemId)}
        inventoryStatus={inventoryStatus}
        onClose={closeModal}
        inventoryReceivedKey={inventoryReceivedKey}
        inventoryDeliveredKey={inventoryDeliveredKey}
        inventoryPendingKey={inventoryPendingKey}
        inventoryCancelledKey={inventoryCancelledKey}
        inventoryReceivedLabel={inventoryReceivedLabel}
        inventoryDeliveredLabel={inventoryDeliveredLabel}
        inventoryPendingLabel={inventoryPendingLabel}
        inventoryCancelledLabel={inventoryCancelledLabel}
      />
    </PageLayout>
  );
}
