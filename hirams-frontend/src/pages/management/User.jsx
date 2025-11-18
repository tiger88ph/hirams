import React, { useState, useEffect } from "react";
import AddUserModal from "../../components/ui/modals/admin/user/AddUserModal";
import EditUserModal from "../../components/ui/modals/admin/user/EditUserModal";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, ActionIcons } from "../../components/common/Buttons";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import PageLayout from "../../components/common/PageLayout";
import StatusFilterMenu from "../../components/common/StatusFilterMenu"; // ✅ Reusable menu
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userTypes, statuses, loading: mappingLoading } = useMapping();
  const [filterStatus, setFilterStatus] = useState(Object.values(statuses)[0] || "Active");

  const fetchUsers = async () => {
    try {
      const response = await api.get(
        `users?search=${encodeURIComponent(search)}`
      );

      const usersArray = response.users || [];
      const formatted = usersArray.map((user) => ({
        id: user.nUserId,
        firstName: user.strFName,
        middleName: user.strMName,
        lastName: user.strLName,
        nickname: user.strNickName,
        type: userTypes[user.cUserType] || user.cUserType,
        status: user.cStatus === "A",
        statusText: statuses[user.cStatus] || user.cStatus,
        fullName: `${user.strFName} ${user.strMName || ""} ${
          user.strLName
        }`.trim(),
        statusCode: user.cStatus, // for dynamic count
      }));

      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchUsers();
  }, [mappingLoading, search]);

  // Filtered users by selected status
  const filteredUsers = users.filter((u) => {
    if (!filterStatus) return true;
    return statuses[u.statusCode] === filterStatus;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const handleDeleteUser = async (id, fullName) => {
    await confirmDeleteWithVerification(fullName || "User", async () => {
      try {
        await showSpinner(`Deleting ${fullName || "User"}...`, 1000);
        await api.delete(`users/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        await showSwal("DELETE_SUCCESS", {}, { entity: fullName || "User" });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: fullName || "User" });
      }
    });
  };

  return (
    <PageLayout title={"Users"}>
      {/* Search + Add + Status Filter */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search User"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* Reusable StatusFilterMenu */}
        <StatusFilterMenu
          statuses={statuses}
          items={users} // ✅ counts automatically calculated
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
        />

        <AddButton onClick={() => setOpenAddModal(true)} label="Add User" />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "fullName", label: "Name" },
            { key: "nickname", label: "Nickname", align: "center" },
            { key: "type", label: "User Type", align: "center" },
            {
              key: "statusText",
              label: "Status",
              align: "center",
              render: (value, row) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    row.status
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {value}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              align: "center",
              render: (_, row) => (
                <ActionIcons
                  onEdit={() => handleEditClick(row)}
                  onDelete={() => handleDeleteUser(row.id, row.fullName)}
                />
              ),
            },
          ]}
          rows={filteredUsers}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
        />

        <CustomPagination
          count={filteredUsers.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* Modals */}
      <AddUserModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onUserAdded={fetchUsers}
      />
      <EditUserModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        user={selectedUser}
        onUserUpdated={fetchUsers}
      />
    </PageLayout>
  );
}

export default User;
