import React from "react";
import PageLayout from "../../../layouts/page/content-page";
import CustomTable from "../../../components/form/Table";
import CustomSearchField from "../../../components/form/SearchField";
import BaseButton from "../../../components/form/BaseButton";
import SyncMenu from "../../../components/form/SyncMenu";
import DirectCostAEModal from "./modal/DirectCostAEModal";
import DeleteVerificationModal from "../../common/transaction/transactions/modal/DeleteVerificationModal";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────────
// LOCAL COLOR MAP — only tokens THIS component actually uses
// ─────────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  cardBg: c.slate.outerBg,
  textPrimary: c.gray.textPrimary,
});


export default function DirectCostView({
  search,
  setSearch,
  page,
  rowsPerPage,
  directCosts,
  loading,
  isModalOpen,
  selectedCost,
  openDeleteModal,
  setOpenDeleteModal,
  entityToDelete,
  setEntityToDelete,
  fetchDirectCosts,
  handleAdd,
  handleEdit,
  handleDelete,
  handleDeleteSuccess,
  handleModalClose,
  handleSaveSuccess,
  handlePageChange,
  handleRowsPerPageChange,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  const columns = React.useMemo(
    () => [
      {
        key: "costName",
        label: "Description",
        render: (_, row) => (
          <span style={{ color: colors.textPrimary }}>
            {row.costName}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <div className="flex justify-center space-x-2">
            <BaseButton
              icon={<Edit />}
              tooltip="Edit Direct Cost"
              size="small"
              actionColor="edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
            />
            <BaseButton
              icon={<Delete />}
              tooltip="Delete Direct Cost"
              size="small"
              actionColor="delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.id, row.costName);
              }}
            />
          </div>
        ),
      },
    ],
    [colors, handleEdit, handleDelete],
  );

  const handleDeleteModalClose = React.useCallback(() => {
    setOpenDeleteModal(false);
    setEntityToDelete(null);
  }, [setOpenDeleteModal, setEntityToDelete]);

  return (
    <PageLayout
      title="Direct Cost Options"
      subtitle="Manage direct cost configurations"
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Direct Cost"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchDirectCosts} />
        <BaseButton
          label="Direct Cost Option"
          tooltip="Add Direct Cost Option"
          icon={<Add />}
          onClick={handleAdd}
          actionColor="approve"
          variant="contained"
        />
      </section>

      {/* ✅ bg-white → theme-aware cardBg */}
      <section
        className="shadow-sm rounded-lg overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        <CustomTable
          columns={columns}
          rows={directCosts}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleEdit}
        />
      </section>

      <DirectCostAEModal
        open={isModalOpen}
        onClose={handleModalClose}
        initialData={selectedCost}
        onSaved={handleSaveSuccess}
      />

      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={handleDeleteModalClose}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}