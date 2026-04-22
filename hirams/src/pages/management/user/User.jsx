import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import UserAEModal from "./modal/UserAEModal";
import InfoUserModal from "./modal/InfoUserModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import PageLayout from "../../../components/common/PageLayout";
import SyncMenu from "../../../components/common/Syncmenu";
// Replace the InfoOutlined import with these:
import {
  Add,
  Edit,
  Delete,
  HowToReg,
  PersonOff,
  PersonAdd,
} from "@mui/icons-material";
import { resolveProfileImage } from "../../../utils/helpers/profileImage";

// ── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = "selectedUserStatusCode";
const DEBOUNCE_MS = 300;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a raw user object from the API into the shape used by the table.
 */
function formatUser(user, { userTypes, defaultUserType, sex, statuses }) {
  return {
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
    fullName: `${user.strFName} ${user.strMName || ""} ${user.strLName}`.trim(),
    statusCode: user.cStatus,
    strProfileImage: user.strProfileImage,
    cSex: user.cSex,
    bIsActive: user.bIsActive,
    dtCreatedAt: user.dtCreatedAt,
    dtLoggedIn: user.dtLoggedIn,
  };
}

/**
 * Derives the display badge (text + className) for the online/offline status
 * of an active user, or returns the status label for inactive/pending users.
 */
function deriveStatusDisplay(row, { activeKey, pendingKey, statuses }) {
  if (row.statusCode !== activeKey) {
    return {
      text: statuses[row.statusCode] || row.statusText,
      className:
        row.statusCode === pendingKey
          ? "bg-amber-100 text-amber-700"
          : "bg-rose-100 text-rose-600",
    };
  }

  // Active users — show online / last-seen
  if (Number(row.bIsActive) === 0) {
    return { text: "Online", className: "bg-emerald-100 text-emerald-700" };
  }

  if (!row.dtLoggedIn) {
    return { text: "Offline", className: "bg-slate-100 text-slate-500" };
  }

  const lastSeen = new Date(row.dtLoggedIn);
  if (isNaN(lastSeen)) {
    return { text: "Offline", className: "bg-slate-100 text-slate-500" };
  }

  const diffMs = Date.now() - lastSeen.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (hours < 1)
    return {
      text: `Offline ${mins}m ago`,
      className: "bg-sky-100 text-sky-600",
    };
  if (hours < 24)
    return {
      text: `Offline ${hours}h ago`,
      className: "bg-violet-100 text-violet-600",
    };
  return {
    text: `Offline ${days}d ago`,
    className: "bg-orange-100 text-orange-600",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
function User() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openUserModal, setOpenUserModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [entityToDelete, setEntityToDelete] = useState(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || "",
  );

  const {
    userTypes,
    defaultUserType,
    sex,
    statuses,
    loading: mappingLoading,
  } = useMapping();

  // ── Derive stable status keys once mappings are ready ────────────────────
  const statusKeys = useMemo(() => {
    const keys = Object.keys(statuses);
    return {
      activeKey: keys[0] ?? "",
      inactiveKey: keys[1] ?? "",
      pendingKey: keys[2] ?? "",
      activeLabel: statuses[keys[0]] ?? "",
      inactiveLabel: statuses[keys[1]] ?? "",
      pendingLabel: statuses[keys[2]] ?? "",
    };
  }, [statuses]);

  const {
    activeKey,
    inactiveKey,
    pendingKey,
    activeLabel,
    inactiveLabel,
    pendingLabel,
  } = statusKeys;

  const sexKeys = useMemo(() => {
    const keys = Object.keys(sex);
    return { maleKey: keys[0] ?? "", femaleKey: keys[1] ?? "" };
  }, [sex]);

  const { maleKey, femaleKey } = sexKeys;

  // ── Debounce search input ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Initialise selected status once mappings load ─────────────────────────
  useEffect(() => {
    if (!mappingLoading && activeKey && !sessionStorage.getItem(SESSION_KEY)) {
      setSelectedStatusCode(activeKey);
      sessionStorage.setItem(SESSION_KEY, activeKey);
    }
  }, [mappingLoading, activeKey]);

  // ── Sync status code from sidebar submenu clicks ──────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setSelectedStatusCode(code);
      sessionStorage.setItem(SESSION_KEY, code);
      setPage(0);
    };
    window.addEventListener("user_status_changed", handler);
    return () => window.removeEventListener("user_status_changed", handler);
  }, []);
useEffect(() => {
  setPage(0);
}, [selectedStatusCode]);
  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (mappingLoading) return;
    setLoading(true);
    try {
      const response = await api.get(
        `users?search=${encodeURIComponent(debouncedSearch)}`,
      );
      const raw = response.users ?? [];
      const mappings = { userTypes, defaultUserType, sex, statuses };
      setUsers(raw.map((u) => formatUser(u, mappings)));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [
    mappingLoading,
    debouncedSearch,
    userTypes,
    defaultUserType,
    sex,
    statuses,
  ]);

  // Keep a ref so real-time event handlers always call the latest version
  // without needing to re-register listeners on every render.
  const fetchUsersRef = useRef(fetchUsers);
  useEffect(() => {
    fetchUsersRef.current = fetchUsers;
  }, [fetchUsers]);

  // ── Fetch on mount and whenever search / mappings change ──────────────────
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── React to real-time WebSocket events dispatched by the sidebar ─────────
  useEffect(() => {
    const onUpdated = () => fetchUsersRef.current();
    const onDeleted = (e) =>
      setUsers((prev) => prev.filter((u) => u.id !== e.detail?.userId));

    window.addEventListener("user_data_updated", onUpdated);
    window.addEventListener("user_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("user_data_updated", onUpdated);
      window.removeEventListener("user_data_deleted", onDeleted);
    };
  }, []); // intentionally empty — ref keeps fetchUsers fresh

  // ── Filter users by selected status ──────────────────────────────────────
  const filteredUsers = useMemo(
    () =>
      selectedStatusCode
        ? users.filter((u) => u.statusCode === selectedStatusCode)
        : users,
    [users, selectedStatusCode],
  );

  // ── Status display helper (memoised factory) ──────────────────────────────
  const getStatusDisplay = useCallback(
    (row) => deriveStatusDisplay(row, { activeKey, pendingKey, statuses }),
    [activeKey, pendingKey, statuses],
  );

  // ── Notify sidebar of status changes (used by InfoUserModal callbacks) ────
  const notifySidebar = useCallback((code) => {
    sessionStorage.setItem(SESSION_KEY, code);
    setSelectedStatusCode(code);
    window.dispatchEvent(
      new CustomEvent("user_status_changed", { detail: { code } }),
    );
  }, []);

  // ── Update a single user's status via API ─────────────────────────────────
  const updateUserStatus = useCallback(
    async (status, userType = null) => {
      if (!selectedUser) return;
      const payload = { cStatus: status };
      if (userType) payload.cUserType = userType;
      await api.patch(`users/${selectedUser.id}/status`, payload);
      await fetchUsersRef.current();
    },
    [selectedUser],
  );

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleAddClick = useCallback(() => {
    setSelectedUser(null);
    setOpenUserModal(true);
  }, []);

  const handleEditClick = useCallback((user) => {
    setSelectedUser(user);
    setOpenUserModal(true);
  }, []);

  const handleInfoClick = useCallback((user) => {
    setSelectedUser(user);
    setOpenInfoModal(true);
  }, []);

  const handleDeleteClick = useCallback((user) => {
    setEntityToDelete({
      type: "user",
      data: { id: user.id, name: user.fullName },
    });
    setOpenDeleteModal(true);
  }, []);

  const handleCloseUserModal = useCallback(() => {
    setOpenUserModal(false);
    setSelectedUser(null);
  }, []);

  const handleCloseInfoModal = useCallback(() => setOpenInfoModal(false), []);

  const handleCloseDeleteModal = useCallback(() => {
    setOpenDeleteModal(false);
    setEntityToDelete(null);
  }, []);

  // ── Table: pagination ─────────────────────────────────────────────────────
  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  // ── Table columns (stable reference — only rebuilds when helpers change) ──
  const columns = useMemo(
    () => [
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
          const { text, className } = getStatusDisplay(row);
          return (
            <span
              className={`px-2 py-1 text-[10px] font-medium rounded-full ${className}`}
            >
              {text}
            </span>
          );
        },
      },
  {
  key: "actions",
  label: "Actions",
  align: "center",
  render: (_, row) => {
    const isActive   = row.statusCode === activeKey;
    const isPending  = row.statusCode === pendingKey;
    const isInactive = row.statusCode === inactiveKey;

    return (
      <div className="flex justify-center gap-1">
        {isActive && (
          <BaseButton
            icon={<Edit fontSize="small" />}
            tooltip="Edit User"
            actionColor="edit"
            onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
          />
        )}
        {isPending && (
          <BaseButton
            icon={<HowToReg fontSize="small" />}
            tooltip="Approve User"
            actionColor="approve"
            onClick={(e) => { e.stopPropagation(); handleInfoClick(row); }}
          />
        )}
        {isActive && (
          <BaseButton
            icon={<PersonOff fontSize="small" />}
            tooltip="Deactivate User"
            actionColor="deactivate"
            onClick={(e) => { e.stopPropagation(); handleInfoClick(row); }}
          />
        )}
        {isInactive && (
          <BaseButton
            icon={<PersonAdd fontSize="small" />}
            tooltip="Activate User"
            actionColor="revert"
            onClick={(e) => { e.stopPropagation(); handleInfoClick(row); }}
          />
        )}
        {!isActive && (
          <BaseButton
            icon={<Delete fontSize="small" />}
            tooltip="Delete User"
            actionColor="delete"
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}
          />
        )}
      </div>
    );
  },
},
    ],
    [
      activeKey,
      getStatusDisplay,
      handleEditClick,
      handleInfoClick,
      handleDeleteClick,
    ],
  );
const handleRowClick = useCallback((row) => {
  const isActive = row.statusCode === activeKey;
  if (isActive) {
    handleEditClick(row);
  } else {
    handleInfoClick(row);
  }
}, [activeKey, handleEditClick, handleInfoClick]);
  // ── InfoUserModal action callbacks ────────────────────────────────────────
  const handleApprove = useCallback(
    async (userType) => {
      await updateUserStatus(activeKey, userType);
      notifySidebar(activeKey);
    },
    [updateUserStatus, activeKey, notifySidebar],
  );

  const handleSetActive = useCallback(async () => {
    await updateUserStatus(activeKey);
    notifySidebar(activeKey);
  }, [updateUserStatus, activeKey, notifySidebar]);

  const handleSetInactive = useCallback(async () => {
    await updateUserStatus(inactiveKey);
    notifySidebar(inactiveKey);
  }, [updateUserStatus, inactiveKey, notifySidebar]);

  const handleRedirect = useCallback(
    (label) => {
      const code = Object.keys(statuses).find((k) => statuses[k] === label);
      if (code) notifySidebar(code);
    },
    [statuses, notifySidebar],
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageLayout title="Users">
      {/* ── Toolbar ── */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search User"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchUsers} />
        <BaseButton
          label="User"
          tooltip="Add User"
          icon={<Add fontSize="small" />}
          onClick={handleAddClick}
          actionColor="approve"
          variant="contained"
        />
      </section>

      {/* ── Table ── */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={columns}
          rows={filteredUsers}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ── */}
      <UserAEModal
        open={openUserModal}
        handleClose={handleCloseUserModal}
        activeKey={activeKey}
        user={selectedUser}
        onUserSaved={fetchUsers}
      />

      <InfoUserModal
        open={openInfoModal}
        handleClose={handleCloseInfoModal}
        userData={selectedUser}
        onApprove={handleApprove}
        onActive={handleSetActive}
        onInactive={handleSetInactive}
        onRedirect={handleRedirect}
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
        onClose={handleCloseDeleteModal}
        entityToDelete={entityToDelete}
        onSuccess={fetchUsers}
      />
    </PageLayout>
  );
}

export default User;
