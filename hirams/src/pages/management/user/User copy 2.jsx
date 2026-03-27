import React, { useState, useEffect } from "react";
import UserAEModal from "./modal/UserAEModal";
import InfoUserModal from "./modal/InfoUserModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import PageLayout from "../../../components/common/PageLayout";
import StatusFilterMenu from "../../../components/common/StatusFilterMenu";
import SyncMenu from "../../../components/common/Syncmenu";
import { Add, Edit, Delete, InfoOutlined } from "@mui/icons-material";
import { resolveProfileImage } from "../../../utils/helpers/profileImage";
import echo from "../../../utils/echo";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    userTypes,
    defaultUserType,
    sex,
    statuses,
    loading: mappingLoading,
  } = useMapping();
  const activeKey = Object.keys(statuses)[0] || ""; // dynamically get "A"
  const inactiveKey = Object.keys(statuses)[1] || ""; // dynamically get "I"
  const pendingKey = Object.keys(statuses)[2] || ""; // dynamically get "V"
  const activeLabel = statuses[activeKey] || ""; // "Active"
  const inactiveLabel = statuses[inactiveKey] || ""; // "Inactive"
  const pendingLabel = statuses[pendingKey] || ""; // "Pending"
  const maleKey = Object.keys(sex)[0] || ""; // dynamically get "M"
  const femaleKey = Object.keys(sex)[1] || ""; // dynamically get "F"
  const [filterStatus, setFilterStatus] = useState("");
  useEffect(() => {
    if (!mappingLoading && activeKey) {
      setFilterStatus(activeLabel);
    }
  }, [mappingLoading, activeLabel]);
  const fetchUsers = async () => {
    setLoading(true); // ← Add this line
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
        dtLoggedIn: user.dtLoggedIn,
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
  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("users");
    channel.listen(".user.updated", (event) => {
      if (event.action === "deleted") {
        setUsers((prev) => prev.filter((u) => u.id !== event.userId));
        return;
      }

      // For created, updated, status_changed — silently refetch
      fetchUsers();
    });

    return () => {
      echo.leaveChannel("users");
    };
  }, [mappingLoading]);
  // Filtered users by selected status
  const filteredUsers = users.filter((u) => {
    if (!filterStatus) return true;
    return statuses[u.statusCode] === filterStatus;
  });
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
  const handleDeleteClick = (user) => {
    setEntityToDelete({
      type: "user",
      data: {
        id: user.id,
        name: user.fullName,
      },
    });
    setOpenDeleteModal(true);
  };
  const handleDeleteSuccess = async () => {
    await fetchUsers();
  };
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
  const getStatusDisplay = (row) => {
    if (row.statusCode !== activeKey) {
      return {
        text: statuses[row.statusCode] || row.statusText,
        className:
          row.statusCode === pendingKey
            ? "bg-amber-100 text-amber-700" // Pending — amber
            : "bg-rose-100 text-rose-600", // Inactive — rose
      };
    }

    if (Number(row.bIsActive) === 0) {
      return {
        text: "Online",
        className: "bg-emerald-100 text-emerald-700", // Online — emerald green
      };
    }

    if (!row.dtLoggedIn) {
      return {
        text: "Offline",
        className: "bg-slate-100 text-slate-500", // Never logged in — slate
      };
    }

    const updated = new Date(row.dtLoggedIn);
    if (isNaN(updated)) {
      return {
        text: "Offline",
        className: "bg-slate-100 text-slate-500",
      };
    }

    const diffMs = Date.now() - updated.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return {
        text: `Offline ${mins}m ago`,
        className: "bg-sky-100 text-sky-600", // < 1 hour — sky blue
      };
    }

    if (hours < 24) {
      return {
        text: `Offline ${hours}h ago`,
        className: "bg-violet-100 text-violet-600", // < 24 hours — violet
      };
    }

    return {
      text: `Offline ${days}d ago`,
      className: "bg-orange-100 text-orange-600", // 24h+ — orange
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
          label="User"
          tooltip="Add User"
          icon={<Add fontSize="small" />}
          onClick={handleAddClick}
          actionColor="approve"
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
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <img
                    src={resolveProfileImage(row)}
                    alt={row.fullName}
                    onError={(e) => {
                      e.target.src = resolveProfileImage(null);
                    }}
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {row.fullName}
                  </span>
                </div>
              ),
            },
            { key: "nickname", label: "Nickname", align: "center" },
            { key: "type", label: "User Type", align: "center" },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (_, row) => {
                const status = getStatusDisplay(row);
                return (
                  <span
                    className={`px-2 py-1 text-[10px] font-medium rounded-full ${status.className}`}
                  >
                    {status.text}
                  </span>
                );
              },
            },
            {
              key: "actions",
              label: "Actions",
              align: "center",
              render: (_, row) => {
                const isActive = row.statusCode === activeKey;
                return (
                  <div className="flex justify-center gap-1">
                    {/* Edit — only if active */}
                    {isActive && (
                      <BaseButton
                        icon={<Edit fontSize="small" />}
                        tooltip="Edit User"
                        actionColor="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(row);
                        }}
                      />
                    )}
                    {/* Info — always visible */}
                    <BaseButton
                      icon={<InfoOutlined fontSize="small" />}
                      tooltip="View User Info"
                      actionColor="view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInfoClick(row);
                      }}
                    />

                    {/* Delete — hidden if active */}
                    {!isActive && (
                      <BaseButton
                        icon={<Delete fontSize="small" />}
                        tooltip="Delete User"
                        actionColor="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(row);
                        }}
                      />
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={filteredUsers}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleInfoClick}
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
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setEntityToDelete(null);
        }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}

export default User;
