import React, { useState, useEffect } from "react";
import UserAEModal from "../../components/ui/modals/admin/user/UserAEModal";
import InfoUserModal from "../../components/ui/modals/admin/user/InfoUserModal";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import BaseButton from "../../components/common/BaseButton";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import PageLayout from "../../components/common/PageLayout";
import StatusFilterMenu from "../../components/common/StatusFilterMenu";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import SyncMenu from "../../components/common/Syncmenu";
import { Add, Edit, Delete } from "@mui/icons-material";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    userTypes,
    defaultUserType,
    sex,
    statuses,
    loading: mappingLoading,
  } = useMapping();

  // -----------------------------------------------------
  // STATUS KEYS (dynamic — same logic as Client)
  // -----------------------------------------------------
  const activeKey = Object.keys(statuses)[0] || ""; // dynamically get "A"
  const inactiveKey = Object.keys(statuses)[1] || ""; // dynamically get "I"
  const pendingKey = Object.keys(statuses)[2] || ""; // dynamically get "V"

  const activeLabel = statuses[activeKey] || ""; // "Active"
  const inactiveLabel = statuses[inactiveKey] || ""; // "Inactive"
  const pendingLabel = statuses[pendingKey] || ""; // "Pending"

  const maleKey = Object.keys(sex)[0] || ""; // dynamically get "M"
  const femaleKey = Object.keys(sex)[1] || ""; // dynamically get "F"

  // -----------------------------------------------------
  // FILTER MENU — default to Active
  // -----------------------------------------------------
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (!mappingLoading && activeKey) {
      setFilterStatus(activeLabel);
    }
  }, [mappingLoading, activeLabel]);

  const fetchUsers = async () => {
    try {
      const response = await api.get(
        `users?search=${encodeURIComponent(search)}`,
      );

      const usersArray = response.users || [];
      const formatted = usersArray.map((user) => ({
        id: user.nUserId,
        firstName: user.strFName,
        middleName: user.strMName,
        lastName: user.strLName,
        nickname: user.strNickName,
        type: userTypes[user.cUserType] ?? defaultUserType[user.cUserType],
        sex: sex[user.cSex] || user.cSex,
        email: user.strEmail,
        username: user.strUserName,
        status: user.cStatus,
        statusText: statuses[user.cStatus] || user.cStatus,
        fullName:
          `${user.strFName} ${user.strMName || ""} ${user.strLName}`.trim(),
        statusCode: user.cStatus,
        strProfileImage: user.strProfileImage,
        cSex: user.cSex,
        bIsActive: user.bIsActive,
        dtCreatedAt: user.dtCreatedAt,
        dtUpdatedAt: user.dtUpdatedAt,
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

  const handleAddClick = () => {
    setSelectedUser(null);
    setOpenUserModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setOpenUserModal(true);
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

  // -----------------------------------------------------
  // ACTIONS (refactor same as Client)
  // -----------------------------------------------------
  const updateUserStatus = async (status, userType = null) => {
    try {
      const payload = {
        cStatus: status,
      };

      // Include user type if provided (for approval)
      if (userType) {
        payload.cUserType = userType;
      }

      await api.patch(`users/${selectedUser.id}/status`, payload);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };
  const getPresenceBadge = (row) => {
    // Active Now → green dot only
    if (Number(row.bIsActive) === 0) {
      return {
        isDot: true,
        dotClass: "bg-green-500",
      };
    }

    if (!row.dtUpdatedAt) {
      return {
        isDot: false,
        text: "Inactive",
        className: "bg-gray-100 text-gray-600",
      };
    }

    const updated = new Date(row.dtUpdatedAt);
    if (isNaN(updated)) {
      return {
        isDot: false,
        text: "Inactive",
        className: "bg-gray-100 text-gray-600",
      };
    }

    const diffMs = Date.now() - updated.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    // Less than 1 hour
    if (hours < 1) {
      return {
        isDot: false,
        text: `Active ${mins}m ago`,
        className: "bg-green-100 text-green-700",
      };
    }

    // Less than 24 hours
    if (hours < 24) {
      return {
        isDot: false,
        text: `Active ${hours}h ago`,
        className: "bg-yellow-100 text-yellow-600",
      };
    }

    // 24 hours or more
    return {
      isDot: false,
      text: `Active ${days}d ago`,
      className: "bg-orange-100 text-orange-600",
    };
  };

  const handleApprove = (userType) => updateUserStatus(activeKey, userType);
  const handleActivate = () => updateUserStatus(activeKey);
  const handleDeactivate = () => updateUserStatus(inactiveKey);

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
          items={users}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={statuses}
        />

        <BaseButton
          label="Add User"
          icon={<Add fontSize="small" />}
          onClick={handleAddClick}
          color="primary"
          variant="contained"
        />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            {
              key: "fullName",
              label: "Name",
              render: (value, row) => {
                // Show presence ONLY if account status is Active
                if (row.statusCode !== activeKey) {
                  return <span>{value}</span>;
                }

                const badge = getPresenceBadge(row);

                return (
                  <div className="flex items-center gap-1">
                    <span>{value}</span>

                    {badge.isDot ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full inline-block ${badge.dotClass}`}
                      />
                    ) : (
                      <span
                        className={`px-1 py-[1px] text-[9px] leading-none font-medium rounded ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    )}
                  </div>
                );
              },
            },
            { key: "nickname", label: "Nickname", align: "center" },
            { key: "type", label: "User Type", align: "center" },
            {
              key: "statusText",
              label: "Account Status",
              align: "center",
              render: (value, row) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    row.statusCode === activeKey
                      ? "bg-green-100 text-green-700"
                      : row.statusCode === pendingKey
                        ? "bg-yellow-100 text-yellow-700"
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
                // Hide Delete button if status is Active ("A")
                const isActive = row.statusCode === activeKey;
                return (
                  <div className="flex justify-center gap-1">
                    {/* Edit (only show if active) */}
                    {isActive && (
                      <BaseButton
                        icon={<Edit fontSize="small" />}
                        tooltip="Edit User"
                        onClick={() => handleEditClick(row)}
                        color="primary"
                      />
                    )}

                    {/* Delete (hidden if active) */}
                    {!isActive && (
                      <BaseButton
                        icon={<Delete fontSize="small" />}
                        tooltip="Delete User"
                        onClick={() => handleDeleteUser(row.id, row.fullName)}
                        color="error"
                      />
                    )}
                  </div>
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

      {/* Modals */}
      <UserAEModal
        open={openUserModal}
        handleClose={() => {
          setOpenUserModal(false);
          setSelectedUser(null);
        }}
        activeKey={activeKey}
        user={selectedUser}
        onUserSaved={fetchUsers}
      />
      <InfoUserModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        userData={selectedUser}
        onApprove={handleApprove}
        onActive={handleActivate}
        onInactive={handleDeactivate}
        onRedirect={setFilterStatus}
        activeKey={activeKey}
        inactiveKey={inactiveKey}
        pendingKey={pendingKey}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        pendingLabel={pendingLabel}
        maleKey={maleKey}
        femaleKey={femaleKey}
        userTypes={userTypes}
      />
    </PageLayout>
  );
}

export default User;