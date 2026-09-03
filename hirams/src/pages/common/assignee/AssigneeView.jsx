import React from "react";
import PageLayout from "../../../layouts/page/content-page";
import CustomTable from "../../../components/form/Table";
import CustomSearchField from "../../../components/form/SearchField";
import BaseButton from "../../../components/form/BaseButton";
import SyncMenu from "../../../components/form/SyncMenu";
import AssigneeAEModal from "./modal/AssigneeAEModal";
import InfoAssigneeModal from "./modal/InfoAssigneeModal";
import DeleteVerificationModal from "../../common/transaction/transactions/modal/DeleteVerificationModal";
import {
  Add,
  Edit,
  Delete,
  PersonOff,
  PersonAdd,
  HowToReg,
} from "@mui/icons-material";

export default function AssigneeView({
  search,
  setSearch,
  page,
  rowsPerPage,
  openAEModal,
  openInfoModal,
  openDeleteModal,
  selectedAssignee,
  entityToDelete,
  assignees,
  loading,
  selectedStatusCode,
  statuses,
  activeStatusKey,
  inactiveStatusKey,
  forApprovalStatusKey,
  activeStatusLabel,
  inactiveStatusLabel,
  forApprovalStatusLabel,
  fetchAssignees,
  handleAddClick,
  handleEditClick,
  handleInfoClick,
  handleDeleteClick,
  handleCloseAEModal,
  handleCloseInfoModal,
  handleCloseDeleteModal,
  handlePageChange,
  handleRowsPerPageChange,
  handleRowClick,
  handleSetActive,
  handleSetInactive,
  handleApprove,
}) {
  const columns = React.useMemo(
    () => [
      { key: "name", label: "Name", xs: 3 },
      { key: "nickname", label: "Nickname", xs: 2 },
      { key: "address", label: "Address", xs: 2 },
      { key: "tin", label: "TIN", align: "center" },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        xs: 1,
        render: (_, row) => {
          const isActive = row.statusCode === activeStatusKey;
          const isInactive = row.statusCode === inactiveStatusKey;
          const isPending = row.statusCode === forApprovalStatusKey;
          return (
            <div className="flex justify-center gap-1">
              {isActive && (
                <BaseButton
                  icon={<Edit fontSize="small" />}
                  tooltip="Edit Assignee"
                  actionColor="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(row);
                  }}
                />
              )}
              {isActive && (
                <BaseButton
                  icon={<PersonOff fontSize="small" />}
                  tooltip="Deactivate Assignee"
                  actionColor="deactivate"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick(row);
                  }}
                />
              )}
              {isInactive && (
                <BaseButton
                  icon={<PersonAdd fontSize="small" />}
                  tooltip="Activate Assignee"
                  actionColor="revert"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick(row);
                  }}
                />
              )}
              {isInactive && (
                <BaseButton
                  icon={<Delete fontSize="small" />}
                  tooltip="Delete Assignee"
                  actionColor="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(row);
                  }}
                />
              )}
              {isPending && (
                <BaseButton
                  icon={<HowToReg fontSize="small" />}
                  tooltip="Approve Assignee"
                  actionColor="approve"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick(row);
                  }}
                />
              )}
            </div>
          );
        },
      },
    ],
    [
      activeStatusKey,
      inactiveStatusKey,
      forApprovalStatusKey,
      handleEditClick,
      handleInfoClick,
      handleDeleteClick,
    ],
  );

  return (
    <PageLayout
      title="Assignees"
      subtitle={
        selectedStatusCode && statuses[selectedStatusCode]
          ? `${statuses[selectedStatusCode]}`
          : ""
      }
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Assignee"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchAssignees} />
        <BaseButton
          label="Assignee"
          tooltip="Add Assignee"
          icon={<Add fontSize="small" />}
          onClick={handleAddClick}
          actionColor="approve"
          variant="contained"
        />
      </section>

      <section>
        <CustomTable
          columns={columns}
          rows={assignees}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>

      <AssigneeAEModal
        open={openAEModal}
        handleClose={handleCloseAEModal}
        assignee={selectedAssignee}
        activeStatusKey={activeStatusKey}
        onAssigneeSaved={fetchAssignees}
      />
      <InfoAssigneeModal
        open={openInfoModal}
        handleClose={handleCloseInfoModal}
        assigneeData={selectedAssignee}
        onActive={handleSetActive}
        onInactive={handleSetInactive}
        onApprove={handleApprove}
        activeStatusKey={activeStatusKey}
        inactiveStatusKey={inactiveStatusKey}
        forApprovalStatusKey={forApprovalStatusKey}
        activeStatusLabel={activeStatusLabel}
        inactiveStatusLabel={inactiveStatusLabel}
        forApprovalStatusLabel={forApprovalStatusLabel}
      />
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        entityToDelete={entityToDelete}
        onSuccess={fetchAssignees}
      />
    </PageLayout>
  );
}
