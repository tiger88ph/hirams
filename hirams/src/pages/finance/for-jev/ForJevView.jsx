import { useState, useEffect } from "react";
import { Box, Select, MenuItem, FormControl } from "@mui/material";
import { Visibility, FilterList } from "@mui/icons-material";
import CustomSearchField from "../../../components/form/SearchField.jsx";
import CustomTable from "../../../components/form/Table";
import PageLayout from "../../../layouts/page/content-page/PageLayout";
import SyncMenu from "../../../components/form/SyncMenu";
import BaseButton from "../../../components/form/BaseButton";
// ✅ Reuse your EXISTING Voucher modal directly (no duplicate code)
import VoucherUpdateModal from "../../common/transaction/voucher/modal/VoucherUpdateModal.jsx";
import VoucherJevModal from "./modal/VoucherJevModal.jsx";
import { getItem } from "../../../utils/storage/localStorage.js";

const JEV_TYPE_SESSION_KEY = "selectedJevTypeCode";
const VOUCHER_JEV_CODE = "V";

export default function ForJevView({
  itemsLoading,
  search,
  setSearch,
  typeFilter,
  modalOpen,
  page,
  rowsPerPage,
  selectedVoucher,
  isAOTL,
  isManagement,
  isFinanceOfficer,
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
  dvTypeKey,
  tableRows,
  handleViewClick,
  handleModalClose,
  handlePageChange,
  handleRowsPerPageChange,
  handleRowClick,
  handleTypeFilterChange,
  fetchVouchers,
}) {
  // ── Track which JEV type is currently selected in the sidebar ──────────
  const [selectedJevCode, setSelectedJevCode] = useState(() =>
    getItem(JEV_TYPE_SESSION_KEY, null),
  );

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setSelectedJevCode(code);
    };
    window.addEventListener("jev_type_changed", handler);
    return () => window.removeEventListener("jev_type_changed", handler);
  }, []);

  // ── PageLayout + modal ALWAYS render. Only the search/sync/filter/table
  // section is gated on the selected type being "V". ─────────────────────
  const showTable = String(selectedJevCode) === VOUCHER_JEV_CODE;

  // ── EXACT SAME COLUMNS AS VOUCHER ──────────────────────────────────────
  const columns = [
    { key: "strNumber", label: "HDV No.", align: "center" },

    { key: "displayName", label: "Name", align: "center" },

    { key: "dtCreated", label: "Created", align: "center" },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => (
        <div className="flex justify-center gap-0">
          <BaseButton
            icon={<Visibility fontSize="small" />}
            tooltip="View voucher"
            size="small"
            actionColor="view"
            onClick={(e) => {
              e.stopPropagation(); // prevent double-trigger with row click
              handleViewClick(row._raw); // ✅ pass raw voucher, same as VoucherView
            }}
          />
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <PageLayout title="For JEV" footer={false}>
      {showTable && (
        <>
          <section className="flex items-center gap-2 mb-3">
            <div className="flex-grow">
              <CustomSearchField
                label="Search HDV No. / Supplier / Assignee / PO No."
                value={search}
                onChange={setSearch}
              />
            </div>
            <SyncMenu onSync={() => fetchVouchers({ bustStorage: true })} />

            {/* ✅ CREATE VOUCHER BUTTON REMOVED ENTIRELY */}
          </section>

          <section className="bg-white shadow-sm">
            <CustomTable
              columns={columns}
              rows={tableRows}
              page={page}
              loading={itemsLoading}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onRowClick={handleRowClick} // ✅ row click also opens modal
              emptyMessage="No closed vouchers pending JEV."
            />
          </section>
        </>
      )}

      {/* ✅ Modal is already wired — opens when modalOpen becomes true */}
      <VoucherJevModal
        open={modalOpen}
        onClose={handleModalClose}
        voucher={selectedVoucher}
        onVoucherUpdated={() => {
          fetchVouchers({ bustStorage: true });
          window.dispatchEvent(new CustomEvent("jev_data_updated"));
        }}
        voucherAssigneeTypeKey={voucherAssigneeTypeKey}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
        voucherCancelledKey={voucherCancelledKey}
        voucherStatus={voucherStatus}
        paidKey={paidKey}
        receivedKey={receivedKey}
        deliveredKey={deliveredKey}
        closeCartKey={closeCartKey}
        cancelCartKey={cancelCartKey}
        cancelPoKey={cancelPoKey}
        forPurchaseKey={forPurchaseKey}
        chequeKey={chequeKey}
        dvTypeKey={dvTypeKey}
      />
    </PageLayout>
  );
}
