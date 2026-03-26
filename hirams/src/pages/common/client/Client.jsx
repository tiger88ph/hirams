import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import PageLayout from "../../../components/common/PageLayout";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import StatusFilterMenu from "../../../components/common/StatusFilterMenu";
import ClientAEModal from "./modal/ClientAEModal";
import InfoClientModal from "./modal/InfoClientModal";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import SyncMenu from "../../../components/common/Syncmenu";
import BaseButton from "../../../components/common/BaseButton";
import { Add, Edit, Delete, InfoOutlined } from "@mui/icons-material";
import { getUserRoles } from "../../../utils/helpers/roleHelper";
import echo from "../../../utils/echo"; // ← add this
function Client() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
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
  const { clientstatus, userTypes, loading: mappingLoading } = useMapping();
  const activeKey = Object.keys(clientstatus)[0] || "";
  const inactiveKey = Object.keys(clientstatus)[1] || "";
  const pendingKey = Object.keys(clientstatus)[2] || "";

  const activeLabel = clientstatus[activeKey] || "";
  const inactiveLabel = clientstatus[inactiveKey] || "";
  const pendingLabel = clientstatus[pendingKey] || "";
  const { isManagement } = getUserRoles(userTypes);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (!mappingLoading && activeKey) {
      setFilterStatus(activeLabel);
    }
  }, [mappingLoading, activeLabel]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setSelectedClient(null);
      setOpenAEModal(true);
      searchParams.delete("add");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchClients = async () => {
        setLoading(true); // ← Add this line
    try {
      setLoading(true);
      const result = await api.get("clients");
      const arr = result.clients || [];

      const formattedAll = arr.map((c) => ({
        id: c.nClientId,
        name: c.strClientName,
        nickname: c.strClientNickName,
        tin: c.strTIN,
        address: c.strAddress,
        businessStyle: c.strBusinessStyle,
        contactPerson: c.strContactPerson,
        contactNumber: c.strContactNumber,
        statusCode: c.cStatus,
      }));

      setAllClients(formattedAll); // filter useEffect will handle the rest
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch from API on mount or when mappings are ready
  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading]);

  // Filter locally — instant, no API call on every filter/search change
  useEffect(() => {
    if (!allClients.length) return;

    const statusFilterKey = Object.keys(clientstatus).find(
      (k) => clientstatus[k] === filterStatus,
    );

    let filtered = allClients.filter(
      (x) => !statusFilterKey || x.statusCode === statusFilterKey,
    );

    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchLower) ||
          client.nickname?.toLowerCase().includes(searchLower) ||
          client.tin?.toLowerCase().includes(searchLower) ||
          client.address?.toLowerCase().includes(searchLower) ||
          client.businessStyle?.toLowerCase().includes(searchLower) ||
          client.contactPerson?.toLowerCase().includes(searchLower) ||
          client.contactNumber?.toLowerCase().includes(searchLower),
      );
    }

    setClients(filtered);
  }, [allClients, filterStatus, search, clientstatus]);

  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("clients");

    channel.listen(".client.updated", (event) => {
      if (event.action === "deleted") {
        // Remove instantly from both state arrays
        setAllClients((prev) => prev.filter((c) => c.id !== event.clientId));
        return;
      }

      // created, updated, status_changed — refetch full list
      fetchClients();
    });

    return () => {
      echo.leaveChannel("clients");
    };
  }, [mappingLoading]);
  const updateClientStatus = async (status) => {
    try {
      await api.patch(`clients/${selectedClient.id}/status`, {
        cStatus: status,
      });
      await fetchClients();
    } catch (err) {
      console.error(err);
    }
  };
  const handleApprove = () => updateClientStatus(activeKey);
  const handleActivate = () => updateClientStatus(activeKey);
  const handleDeactivate = () => updateClientStatus(inactiveKey);
  const handleAddClick = () => {
    setSelectedClient(null);
    setOpenAEModal(true);
  };
  const handleEditClick = (client) => {
    setSelectedClient(client);
    setOpenAEModal(true);
  };
  const handleInfoClick = (client) => {
    setSelectedClient(client);
    setOpenInfoModal(true);
  };
  const handleDeleteClient = (client) => {
    setEntityToDelete({
      type: "client",
      data: {
        id: client.id,
        name: client.nickname || client.name,
        nickname: client.nickname,
      },
    });
    setOpenDeleteModal(true);
  };
  const handleDeleteSuccess = async () => {
    if (!entityToDelete?.data) return;
    await fetchClients();
  };
  const columns = [
    { key: "name", label: "Name" },
    { key: "nickname", label: "Nickname" },
    { key: "address", label: "Address" },
    { key: "tin", label: "TIN", align: "center" },
    { key: "contactPerson", label: "Contact Person", align: "center" },
    { key: "contactNumber", label: "Contact No.", align: "center" },
  ];
  if (isManagement) {
    columns.push({
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => (
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
          <BaseButton
            icon={<InfoOutlined fontSize="small" />}
            tooltip="View Client Info"
            actionColor="view"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleInfoClick(row);
            }}
          />
          {row.statusCode !== activeKey && (
            <BaseButton
              icon={<Delete fontSize="small" />}
              tooltip="Delete Client"
              actionColor="delete"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClient(row);
              }}
            />
          )}
        </div>
      ),
    });
  }
  return (
    <PageLayout title={"Clients"}>
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>

        <SyncMenu onSync={fetchClients} />

        <StatusFilterMenu
          statuses={clientstatus}
          items={allClients}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={clientstatus}
        />

        <BaseButton
          label="Add Client"
          icon={<Add />}
          onClick={handleAddClick}
          actionColor="approve"
          variant="contained"
          size="medium"
        />
      </section>
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={columns}
          rows={clients}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage} // ✅ Add this line
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleInfoClick}
        />
      </section>
      <ClientAEModal
        open={openAEModal}
        handleClose={() => setOpenAEModal(false)}
        clientData={selectedClient}
        onClientSaved={fetchClients}
        activeKey={activeKey}
        pendingKey={pendingKey}
        isManagement={isManagement}
      />
      <InfoClientModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        clientData={selectedClient}
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
        isManagement={isManagement}
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

export default Client;
