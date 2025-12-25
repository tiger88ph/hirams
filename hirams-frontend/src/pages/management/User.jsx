import React, { useState, useEffect } from "react";
import AddUserModal from "../../components/ui/modals/admin/user/AddUserModal";
import EditUserModal from "../../components/ui/modals/admin/user/EditUserModal";
import InfoUserModal from "../../components/ui/modals/admin/user/InfoUserModal";
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
import SyncMenu from "../../components/common/Syncmenu";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    userTypes,
    sex,
    statuses,
    clientstatus,
    loading: mappingLoading,
  } = useMapping();

  const [filterStatus, setFilterStatus] = useState();

  const activeKey = Object.keys(clientstatus)[0]; // dynamically get "A"
  const inactiveKey = Object.keys(clientstatus)[1]; // dynamically get "I"
  const activeLabel = clientstatus[activeKey]; // "Active"
  const inactiveLabel = clientstatus[inactiveKey]; // "Inactive"
  const maleKey = Object.keys(sex)[0]; // dynamically get "A"
  const femaleKey = Object.keys(sex)[1]; // dynamically get "I"
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
        sex: sex[user.cSex] || user.cSex,
        status: user.cStatus,
        statusText: statuses[user.cStatus] || user.cStatus,
        fullName:
          `${user.strFName} ${user.strMName || ""} ${user.strLName}`.trim(),
        statusCode: user.cStatus,
        strProfileImage: user.strProfileImage, // ✅ add this
        cSex: user.cSex, // ✅ add this
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
  useEffect(() => {
    if (!mappingLoading && Object.keys(clientstatus).length > 0) {
      const defaultCode = Object.keys(clientstatus)[0]; // "A"
      const defaultLabel = clientstatus[defaultCode]; // "Active"
      setFilterStatus(defaultLabel);
    }
  }, [mappingLoading, clientstatus]);

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
  const handleInfoClick = (user) => {
    setSelectedUser(user);
    setOpenInfoModal(true);
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
  // Activate -> (I → A)
  const handleActivate = async () => {
    const activeKey = Object.keys(clientstatus)[0];
    const activeLabel = clientstatus[activeKey];

    await api.patch(`users/${selectedUser.id}/status`, {
      cStatus: activeKey,
    });

    await fetchUsers(); // <-- FIXED

    setFilterStatus(activeLabel); // <-- REDIRECT ADDED
  };

  // Deactivate -> (A → I)
  const handleDeactivate = async () => {
    const inactiveKey = Object.keys(clientstatus)[1];
    const inactiveLabel = clientstatus[inactiveKey];

    await api.patch(`users/${selectedUser.id}/status`, {
      cStatus: inactiveKey,
    });

    await fetchUsers(); // <-- FIXED

    setFilterStatus(inactiveLabel); // <-- REDIRECT ADDED
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
        <SyncMenu onSync={() => fetchUsers()} />
        {/* Reusable StatusFilterMenu */}
        <StatusFilterMenu
          statuses={statuses}
          items={users} // ✅ counts automatically calculated
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={clientstatus}
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
              render: (_, row) => {
                // Hide Edit button if status is Active ("A")
                const isActive = row.statusCode === activeKey;
                return (
                  <ActionIcons
                    onEdit={() => handleEditClick(row)}
                    onDelete={
                      isActive
                        ? null
                        : () => handleDeleteUser(row.id, row.fullName)
                    }
                  />
                );
              },
            },
          ]}
          rows={filteredUsers}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={handleInfoClick}
        />

        <CustomPagination
          count={filteredUsers.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* Modas */}
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
      <InfoUserModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        userData={selectedUser}
        onActive={handleActivate}
        onInactive={handleDeactivate}
        onRedirect={setFilterStatus}
        activeKey={activeKey}
        inactiveKey={inactiveKey}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        maleKey={maleKey}
        femaleKey={femaleKey}
      />
    </PageLayout>
  );
}

export default User;
