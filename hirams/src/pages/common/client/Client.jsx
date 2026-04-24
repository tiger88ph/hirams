import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import PageLayout from "../../../components/common/PageLayout";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import ClientAEModal from "./modal/ClientAEModal";
import InfoClientModal from "./modal/InfoClientModal";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import SyncMenu from "../../../components/common/Syncmenu";
import BaseButton from "../../../components/common/BaseButton";
// Replace InfoOutlined in the import:
import {
  Add,
  Edit,
  Delete,
  HowToReg,
  PersonOff,
  PersonAdd,
} from "@mui/icons-material";
import { getUserRoles } from "../../../utils/helpers/roleHelper";

// ── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = "selectedClientStatusCode";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a raw client object from the API into the shape used by the table.
 */
function formatClient(c) {
  return {
    id: c.nClientId,
    name: c.strClientName,
    nickname: c.strClientNickName,
    tin: c.strTIN,
    address: c.strAddress,
    businessStyle: c.strBusinessStyle,
    contactPerson: c.strContactPerson,
    contactNumber: c.strContactNumber,
    statusCode: c.cStatus,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
function Client() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedClient, setSelectedClient] = useState(null);
  const [openAEModal, setOpenAEModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || "",
  );

  const { clientstatus, userTypes, loading: mappingLoading } = useMapping();
  const { isManagement } = getUserRoles(userTypes);

  // ── Derive stable status keys once mappings are ready ────────────────────
  const statusKeys = useMemo(() => {
    const keys = Object.keys(clientstatus);
    return {
      activeKey: keys[0] ?? "",
      inactiveKey: keys[1] ?? "",
      pendingKey: keys[2] ?? "",
      activeLabel: clientstatus[keys[0]] ?? "",
      inactiveLabel: clientstatus[keys[1]] ?? "",
      pendingLabel: clientstatus[keys[2]] ?? "",
    };
  }, [clientstatus]);

  const {
    activeKey,
    inactiveKey,
    pendingKey,
    activeLabel,
    inactiveLabel,
    pendingLabel,
  } = statusKeys;

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
    window.addEventListener("client_status_changed", handler);
    return () => window.removeEventListener("client_status_changed", handler);
  }, []);

  // ── Handle ?add=true query param (e.g. from a shortcut link) ─────────────
  useEffect(() => {
    if (searchParams.get("add") !== "true") return;
    setSelectedClient(null);
    setOpenAEModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete("add");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // ── Fetch all clients from API ────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    if (mappingLoading) return;
    setLoading(true);
    try {
      const result = await api.get("clients");
      setAllClients((result.clients ?? []).map(formatClient));
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, [mappingLoading]);

  // Keep a ref so real-time event handlers always call the latest fetchClients
  // without needing to re-register listeners on every render.
  const fetchClientsRef = useRef(fetchClients);
  useEffect(() => {
    fetchClientsRef.current = fetchClients;
  }, [fetchClients]);

  // ── Fetch on mount and whenever mappings become ready ─────────────────────
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ── React to real-time WebSocket events dispatched by the sidebar ─────────
  useEffect(() => {
    const onUpdated = () => fetchClientsRef.current();
    const onDeleted = (e) =>
      setAllClients((prev) => prev.filter((c) => c.id !== e.detail?.clientId));

    window.addEventListener("client_data_updated", onUpdated);
    window.addEventListener("client_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("client_data_updated", onUpdated);
      window.removeEventListener("client_data_deleted", onDeleted);
    };
  }, []); // intentionally empty — ref keeps fetchClients fresh

  // ── Filter + search locally (instant, no extra API calls) ────────────────
  const filteredClients = useMemo(() => {
    let result = selectedStatusCode
      ? allClients.filter((c) => c.statusCode === selectedStatusCode)
      : allClients;

    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.nickname?.toLowerCase().includes(q) ||
        c.tin?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.businessStyle?.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.contactNumber?.toLowerCase().includes(q),
    );
  }, [allClients, selectedStatusCode, search]);

  // ── Update a single client's status via API ───────────────────────────────
  const updateClientStatus = useCallback(
    async (status) => {
      if (!selectedClient) return;
      await api.patch(`clients/${selectedClient.id}/status`, {
        cStatus: status,
      });
      await fetchClientsRef.current();
    },
    [selectedClient],
  );

  // ── Notify sidebar of status changes ─────────────────────────────────────
  const notifySidebar = useCallback((code) => {
    sessionStorage.setItem(SESSION_KEY, code);
    setSelectedStatusCode(code);
    window.dispatchEvent(
      new CustomEvent("client_status_changed", { detail: { code } }),
    );
  }, []);

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleAddClick = useCallback(() => {
    setSelectedClient(null);
    setOpenAEModal(true);
  }, []);

  const handleEditClick = useCallback((client) => {
    setSelectedClient(client);
    setOpenAEModal(true);
  }, []);

  const handleInfoClick = useCallback((client) => {
    setSelectedClient(client);
    setOpenInfoModal(true);
  }, []);

  const handleDeleteClick = useCallback((client) => {
    setEntityToDelete({
      type: "client",
      data: {
        id: client.id,
        name: client.nickname || client.name,
        nickname: client.nickname,
      },
    });
    setOpenDeleteModal(true);
  }, []);

  const handleCloseAEModal = useCallback(() => {
    setOpenAEModal(false);
    setSelectedClient(null);
  }, []);

  const handleCloseInfoModal = useCallback(() => setOpenInfoModal(false), []);

  const handleCloseDeleteModal = useCallback(() => {
    setOpenDeleteModal(false);
    setEntityToDelete(null);
  }, []);

  // ── Pagination ────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  // ── InfoClientModal action callbacks ──────────────────────────────────────
  // handleApprove and handleActivate were identical in the original — merged.
  const handleApproveOrActivate = useCallback(async () => {
    await updateClientStatus(activeKey);
    notifySidebar(activeKey);
  }, [updateClientStatus, activeKey, notifySidebar]);

  const handleDeactivate = useCallback(async () => {
    await updateClientStatus(inactiveKey);
    notifySidebar(inactiveKey);
  }, [updateClientStatus, inactiveKey, notifySidebar]);

  const handleRedirect = useCallback(
    (label) => {
      const code = Object.keys(clientstatus).find(
        (k) => clientstatus[k] === label,
      );
      if (code) notifySidebar(code);
    },
    [clientstatus, notifySidebar],
  );

  // ── Table columns (stable — rebuilds only when role or handlers change) ───
  const columns = useMemo(() => {
    const base = [
      { key: "name", label: "Name", xs: 2 },
      { key: "nickname", label: "Nickname" },
      { key: "address", label: "Address", xs: 2 },
      { key: "tin", label: "TIN", align: "center" },
      { key: "contactPerson", label: "Contact Person", align: "center" },
      { key: "contactNumber", label: "Contact No.", align: "center" },
    ];

    const actionsColumn = {
      key: "actions",
      label: "Actions",
      align: "center",
      xs: 1,
      render: (_, row) => {
        const isActive = row.statusCode === activeKey;
        const isPending = row.statusCode === pendingKey;
        const isInactive = row.statusCode === inactiveKey;

        return (
          <div className="flex gap-1 justify-center">
            <BaseButton
              icon={<Edit fontSize="small" />}
              tooltip="Edit Client"
              actionColor="edit"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(row);
              }}
            />
            {isManagement && (
              <>
                {isPending && (
                  <BaseButton
                    icon={<HowToReg fontSize="small" />}
                    tooltip="Approve Client"
                    actionColor="approve"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfoClick(row);
                    }}
                  />
                )}
                {isActive && (
                  <BaseButton
                    icon={<PersonOff fontSize="small" />}
                    tooltip="Deactivate Client"
                    actionColor="deactivate"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfoClick(row);
                    }}
                  />
                )}
                {isInactive && (
                  <BaseButton
                    icon={<PersonAdd fontSize="small" />}
                    tooltip="Activate Client"
                    actionColor="revert"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfoClick(row);
                    }}
                  />
                )}
                {!isActive && (
                  <BaseButton
                    icon={<Delete fontSize="small" />}
                    tooltip="Delete Client"
                    actionColor="delete"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(row);
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      },
    };

    return [...base, actionsColumn];
  }, [
    isManagement,
    activeKey,
    handleEditClick,
    handleInfoClick,
    handleDeleteClick,
  ]);
  const handleRowClick = useCallback(
    (client) => {
      if (client.statusCode === activeKey) {
        handleEditClick(client);
      } else {
        handleInfoClick(client);
      }
    },
    [activeKey, handleEditClick, handleInfoClick],
  );
  useEffect(() => {
    setPage(0);
  }, [selectedStatusCode]);
  // ─────────────────────────────────────────────────────────────────────────
  return (
<PageLayout title="Clients" subtitle={selectedStatusCode && clientstatus[selectedStatusCode] ? `/ ${clientstatus[selectedStatusCode]}` : ""}>
      {/* ── Toolbar ── */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchClients} />
        <BaseButton
          label="Add Client"
          icon={<Add />}
          onClick={handleAddClick}
          actionColor="approve"
          variant="contained"
          size="medium"
        />
      </section>

      {/* ── Table ── */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={columns}
          rows={filteredClients}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ── */}
      <ClientAEModal
        open={openAEModal}
        handleClose={handleCloseAEModal}
        clientData={selectedClient}
        onClientSaved={fetchClients}
        activeKey={activeKey}
        pendingKey={pendingKey}
        isManagement={isManagement}
      />

      <InfoClientModal
        open={openInfoModal}
        handleClose={handleCloseInfoModal}
        clientData={selectedClient}
        onApprove={handleApproveOrActivate}
        onActive={handleApproveOrActivate}
        onInactive={handleDeactivate}
        onRedirect={handleRedirect}
        activeKey={activeKey}
        inactiveKey={inactiveKey}
        pendingKey={pendingKey}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        pendingLabel={pendingLabel}
        isManagement={isManagement}
      />

      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        entityToDelete={entityToDelete}
        onSuccess={fetchClients}
      />
    </PageLayout>
  );
}

export default Client;
