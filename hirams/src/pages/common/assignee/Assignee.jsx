import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import AssigneeAEModal from "./modal/AssigneeAEModal";
import InfoAssigneeModal from "./modal/InfoAssigneeModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import api from "../../../utils/api/api";
import PageLayout from "../../../components/common/PageLayout";
import SyncMenu from "../../../components/common/Syncmenu";
import {
  Add,
  Edit,
  Delete,
  PersonOff,
  PersonAdd,
  HowToReg,
} from "@mui/icons-material";
import useMapping from "../../../utils/mappings/useMapping";

// ── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = "selectedAssigneeStatusCode";
const DEBOUNCE_MS = 300;

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatAssignee(a) {
  return {
    id: a.nAssigneeId,
    name: a.strAssigneeName,
    nickname: a.strAssigneeNickName || "—",
    address: a.strAddress || "—",
    tin: a.strTIN || "—",
    statusCode: a.cStatus,
    dtCreatedAt: a.dtCreatedAt,
    dtUpdatedAt: a.dtUpdatedAt,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
function Assignee() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAEModal, setOpenAEModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [entityToDelete, setEntityToDelete] = useState(null);

  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);

  const { statuses, loading: mappingLoading } = useMapping();

  // ── Derive status keys from mappings ──────────────────────────────────────
  const statusKeys = useMemo(() => {
    const keys = Object.keys(statuses || {});
    return {
      activeKey: keys[0] ?? "",
      inactiveKey: keys[1] ?? "",
      pendingKey: keys[2] ?? "",
      activeLabel: statuses[keys[0]],
      inactiveLabel: statuses[keys[1]],
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

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || "",
  );

  // ── Initialise selected status once mappings load ─────────────────────────
  useEffect(() => {
    if (!mappingLoading && activeKey && !sessionStorage.getItem(SESSION_KEY)) {
      setSelectedStatusCode(activeKey);
      sessionStorage.setItem(SESSION_KEY, activeKey);
    }
  }, [mappingLoading, activeKey]);

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // ── Sync status from sidebar submenu ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setSelectedStatusCode(code);
      sessionStorage.setItem(SESSION_KEY, code);
      setPage(0);
    };
    window.addEventListener("assignee_status_changed", handler);
    return () => window.removeEventListener("assignee_status_changed", handler);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [selectedStatusCode]);

  // ── Fetch assignees ───────────────────────────────────────────────────────
  const fetchAssignees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `assignees?search=${encodeURIComponent(debouncedSearch)}`,
      );
      const raw = response.assignees ?? [];
      setAssignees(raw.map(formatAssignee));
    } catch (err) {
      console.error("Error fetching assignees:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  const fetchAssigneesRef = useRef(fetchAssignees);
  useEffect(() => {
    fetchAssigneesRef.current = fetchAssignees;
  }, [fetchAssignees]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  // ── Real-time WebSocket events ────────────────────────────────────────────
  useEffect(() => {
    const onUpdated = () => fetchAssigneesRef.current();
    const onDeleted = (e) =>
      setAssignees((prev) => prev.filter((a) => a.id !== e.detail?.assigneeId));

    window.addEventListener("assignee_data_updated", onUpdated);
    window.addEventListener("assignee_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("assignee_data_updated", onUpdated);
      window.removeEventListener("assignee_data_deleted", onDeleted);
    };
  }, []);

  // ── Filter by selected status ─────────────────────────────────────────────
  const filteredAssignees = useMemo(
    () =>
      selectedStatusCode
        ? assignees.filter((a) => a.statusCode === selectedStatusCode)
        : assignees,
    [assignees, selectedStatusCode],
  );

  // ── Notify sidebar ────────────────────────────────────────────────────────
  const notifySidebar = useCallback((code) => {
    sessionStorage.setItem(SESSION_KEY, code);
    setSelectedStatusCode(code);
    window.dispatchEvent(
      new CustomEvent("assignee_status_changed", { detail: { code } }),
    );
  }, []);

  // ── Status update via API ─────────────────────────────────────────────────
  const updateAssigneeStatus = useCallback(
    async (status) => {
      if (!selectedAssignee) return;
      await api.patch(`assignees/${selectedAssignee.id}/status`, {
        cStatus: status,
      });
      await fetchAssigneesRef.current();
    },
    [selectedAssignee],
  );

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleAddClick = useCallback(() => {
    setSelectedAssignee(null);
    setOpenAEModal(true);
  }, []);
  const handleEditClick = useCallback((a) => {
    setSelectedAssignee(a);
    setOpenAEModal(true);
  }, []);
  const handleInfoClick = useCallback((a) => {
    setSelectedAssignee(a);
    setOpenInfoModal(true);
  }, []);

  const handleDeleteClick = useCallback((a) => {
    setEntityToDelete({ type: "assignee", data: { id: a.id, name: a.name } });
    setOpenDeleteModal(true);
  }, []);

  const handleCloseAEModal = useCallback(() => {
    setOpenAEModal(false);
    setSelectedAssignee(null);
  }, []);
  const handleCloseInfoModal = useCallback(() => setOpenInfoModal(false), []);
  const handleCloseDeleteModal = useCallback(() => {
    setOpenDeleteModal(false);
    setEntityToDelete(null);
  }, []);

  const handlePageChange = useCallback((_, p) => setPage(p), []);
  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        xs: 3,
      },
      {
        key: "nickname",
        label: "Nickname",
        xs: 2,
      },
      { key: "address", label: "Address", xs: 2 },
      { key: "tin", label: "TIN", align: "center" },

      {
        key: "actions",
        label: "Actions",
        align: "center",
        xs: 1,
        render: (_, row) => {
          const isActive = row.statusCode === activeKey;
          const isInactive = row.statusCode === inactiveKey;
          const isPending = row.statusCode === pendingKey;
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
      activeKey,
      inactiveKey,
      pendingKey,
      statuses,
      handleEditClick,
      handleInfoClick,
      handleDeleteClick,
    ],
  );

  const handleRowClick = useCallback(
    (row) => {
      if (row.statusCode === activeKey) handleEditClick(row);
      else handleInfoClick(row);
    },
    [activeKey, handleEditClick, handleInfoClick],
  );

  const handleSetActive = useCallback(async () => {
    await updateAssigneeStatus(activeKey);
    await fetchAssigneesRef.current();
    window.dispatchEvent(new CustomEvent("assignee_data_updated")); // ← ADD
  }, [updateAssigneeStatus, activeKey]);

  const handleSetInactive = useCallback(async () => {
    await updateAssigneeStatus(inactiveKey);
    await fetchAssigneesRef.current();
    window.dispatchEvent(new CustomEvent("assignee_data_updated")); // ← ADD
  }, [updateAssigneeStatus, inactiveKey]);

  const handleApprove = useCallback(async () => {
    await updateAssigneeStatus(activeKey);
    await fetchAssigneesRef.current();
    window.dispatchEvent(new CustomEvent("assignee_data_updated")); // ← ADD
  }, [updateAssigneeStatus, activeKey]);
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageLayout
      title="Assignees"
      subtitle={
        selectedStatusCode && statuses[selectedStatusCode]
          ? `/ ${statuses[selectedStatusCode]}`
          : ""
      }
    >
      {/* Toolbar */}
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

      {/* Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={columns}
          rows={filteredAssignees}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>

      {/* Modals */}
      <AssigneeAEModal
        open={openAEModal}
        handleClose={handleCloseAEModal}
        assignee={selectedAssignee}
        activeKey={activeKey}
        onAssigneeSaved={fetchAssignees}
      />

      <InfoAssigneeModal
        open={openInfoModal}
        handleClose={handleCloseInfoModal}
        assigneeData={selectedAssignee}
        onActive={handleSetActive}
        onInactive={handleSetInactive}
        onApprove={handleApprove}
        activeKey={activeKey}
        inactiveKey={inactiveKey}
        pendingKey={pendingKey}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        pendingLabel={pendingLabel}
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

export default Assignee;
