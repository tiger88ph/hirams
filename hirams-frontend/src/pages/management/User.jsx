import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";

import AddUserModal from "../../components/ui/modals/admin/user/AddUserModal";
import EditUserModal from "../../components/ui/modals/admin/user/EditUserModal";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, ActionIcons } from "../../components/common/Buttons";

import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
  withSpinner,
} from "../../utils/swal";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userTypes, statuses, loading: mappingLoading } = useMapping();
  const fetchUsers = async () => {
    setLoading(true); // ✅ start loading state
    try {
      const usersArray = await withSpinner(undefined, async () => {
        const data = await api.get("users");
        return data.users || [];
      });

      const formatted = usersArray.map((user) => ({
        id: user.nUserId,
        firstName: user.strFName,
        middleName: user.strMName,
        lastName: user.strLName,
        nickname: user.strNickName,
        type: userTypes[user.cUserType] || user.cUserType,
        status: user.cStatus === "A", // boolean for modal switch
        statusText: statuses[user.cStatus] || user.cStatus, // mapped label
        fullName:
          `${user.strFName} ${user.strMName || ""} ${user.strLName}`.trim(),
      }));

      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false); // ✅ stop loading so table renders
    }
  };

  // ✅ only run fetchUsers when mapping is done loading
  useEffect(() => {
    if (!mappingLoading) {
      fetchUsers();
    }
  }, [mappingLoading]);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.nickname.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">User Management</h1>
      </header>

      <div className="space-y-0">
        {/* 🔍 Search + ➕ Add Button Bar */}
        <section
          className="p-2 rounded-lg flex items-center gap-2 overflow-hidden whitespace-nowrap"
          style={{
            flexWrap: "nowrap",
            minWidth: 0,
          }}
        >
          {/* Search Field */}
          <div className="flex items-center gap-2 flex-grow">
            <CustomSearchField
              label="Search User"
              value={search}
              onChange={setSearch}
            />
          </div>

          {/* 🟧 Add Button (reusable) */}
          <AddButton onClick={() => setOpenAddModal(true)} label="Add User" />
        </section>

        {/* Table Section */}
        <section className="bg-white p-2 sm:p-4">
          <CustomTable
            columns={[
              { key: "fullName", label: "Name" },
              { key: "nickname", label: "Nickname" },
              { key: "type", label: "User Type" },
              {
                key: "statusText",
                label: "Status",
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
            loading={loading} // ✅ pass the loading state
          />

          {/* Pagination */}
          <CustomPagination
            count={filteredUsers.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </section>
      </div>

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
    </div>
  );
}

export default User;
