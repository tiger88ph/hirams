import React from "react";
import PageLayout from "../../../layouts/page/content-page";
import CustomTable from "../../../components/form/Table";
import CustomSearchField from "../../../components/form/SearchField";
import BaseButton from "../../../components/form/BaseButton";
import SyncMenu from "../../../components/form/SyncMenu";
import CompanyAEModal from "./modal/CompanyAEModal";
import DeleteVerificationModal from "../../common/transaction/transactions/modal/DeleteVerificationModal";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../utils/style/getThemeColors";


// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — only tokens THIS component actually uses
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  textPrimary: c.gray.textPrimary,
  success: {
    bg: c.green.bg,
    text: c.green.text,
  },
  danger: {
    bg: c.red.bg,
    text: c.red.text,
  },
});


export default function CompanyView({
  search,
  setSearch,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  openModal,
  selectedCompany,
  companies,
  loading,
  openDeleteModal,
  setOpenDeleteModal,   // ✅ ADDED
  entityToDelete,
  setEntityToDelete,     // ✅ ADDED
  vat,
  ewt,
  fetchCompanies,
  handleAddClick,
  handleEditClick,
  handleDeleteClick,
  handleDeleteSuccess,
  handleModalClose,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);


  const columns = React.useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (value) => (
          <span style={{ color: colors.textPrimary }}>{value}</span>
        ),
      },
      { key: "nickname", label: "Nickname", align: "center" },
      { key: "tin", label: "TIN", align: "center" },
      {
        key: "address",
        label: "Address",
        render: (value) =>
          value && value.length > 30 ? `${value.slice(0, 30)}…` : value,
      },
      {
        key: "vat",
        label: "VAT",
        align: "center",
        render: (value) => {
          const isActive = value === vat[1];
          const badge = isActive ? colors.success : colors.danger;
          return (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {value}
            </span>
          );
        },
      },
      {
        key: "ewt",
        label: "EWT",
        align: "center",
        render: (value) => {
          const isActive = value == ewt[1];
          const badge = isActive ? colors.success : colors.danger;
          return (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {value}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        render: (_, row) => (
          <div className="flex gap-1 justify-center">
            <BaseButton
              icon={<Edit fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(row);
              }}
              actionColor="edit"
              size="small"
              tooltip="Edit Company"
            />
            <BaseButton
              icon={<Delete fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              actionColor="delete"
              size="small"
              tooltip="Delete Company"
            />
          </div>
        ),
      },
    ],
    [vat, ewt, colors, handleEditClick, handleDeleteClick],
  );


  return (
    <PageLayout
      title={"Companies"}
      subtitle={"Browse and manage all company profiles"}
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Company"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchCompanies} />
        <BaseButton
          label="Company"
          tooltip="Add Company"
          icon={<Add />}
          onClick={handleAddClick}
          actionColor="approve"
        />
      </section>

      <section>
        <CustomTable
          columns={columns}
          rows={companies}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleEditClick}
        />
      </section>

      <CompanyAEModal
        open={openModal}
        handleClose={handleModalClose}
        company={selectedCompany}
        onCompanySubmitted={fetchCompanies}
      />

      {/* ✅ DELETE MODAL — NOW ACTUALLY CLOSES + CLEARS STATE */}
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);   // ✅ Close modal
          setEntityToDelete(null);       // ✅ Clear selected data
        }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}