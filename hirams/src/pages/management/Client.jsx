import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import StatusFilterMenu from "../../components/common/StatusFilterMenu";
import ClientAEModal from "../../components/ui/modals/admin/client/ClientAEModal";
import InfoClientModal from "../../components/ui/modals/admin/client/InfoClientModal";
import SyncMenu from "../../components/common/Syncmenu";
import BaseButton from "../../components/common/BaseButton";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import { Add, Edit, Delete } from "@mui/icons-material";

function Client() {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedClient, setSelectedClient] = useState(null);
  const [openAEModal, setOpenAEModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const { clientstatus, userTypes, loading: mappingLoading } = useMapping();

  // Status keys
  const activeKey = Object.keys(clientstatus)[0] || "";
  const inactiveKey = Object.keys(clientstatus)[1] || "";
  const pendingKey = Object.keys(clientstatus)[2] || "";
  const keys = Object.keys(userTypes);

  const managementKey = [keys[1], keys[4]];

  const activeLabel = clientstatus[activeKey] || "";
  const inactiveLabel = clientstatus[inactiveKey] || "";
  const pendingLabel = clientstatus[pendingKey] || "";

  // Check if current user is management
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userType = user?.cUserType;
  const isManagement = managementKey.includes(userType);

  // Filter menu
  const [filterStatus, setFilterStatus] = useState("");
  useEffect(() => {
    if (!mappingLoading && activeKey) {
      setFilterStatus(activeLabel);
    }
  }, [mappingLoading, activeLabel]);

  // Fetch Clients
  const fetchClients = async () => {
    try {
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

      setAllClients(formattedAll);

      // Apply status filter
      const statusFilterKey = Object.keys(clientstatus).find(
        (k) => clientstatus[k] === filterStatus,
      );

      let filtered = formattedAll.filter(
        (x) => !statusFilterKey || x.statusCode === statusFilterKey,
      );

      // Apply search filter
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
            client.contactNumber?.toLowerCase().includes(searchLower)
        );
      }

      setClients(filtered);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading, filterStatus, search]);

  // Pagination
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Actions
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

  // Open Add modal (no client data)
  const handleAddClick = () => {
    setSelectedClient(null);
    setOpenAEModal(true);
  };

  // Open Edit modal (with client data)
  const handleEditClick = (client) => {
    setSelectedClient(client);
    setOpenAEModal(true);
  };

  const handleInfoClick = (client) => {
    setSelectedClient(client);
    setOpenInfoModal(true);
  };

  const handleDeleteClient = async (client) => {
    await confirmDeleteWithVerification(client.name, async () => {
      try {
        await showSpinner(`Deleting ${client.name}...`, 900);
        await api.delete(`clients/${client.id}`);
        fetchClients();
        await showSwal("DELETE_SUCCESS", {}, { entity: client.name });
      } catch {
        await showSwal("DELETE_ERROR", {}, { entity: client.name });
      }
    });
  };

  // Define columns based on user role
  const columns = [
    { key: "name", label: "Name" },
    { key: "nickname", label: "Nickname" },
    { key: "address", label: "Address" },
    { key: "tin", label: "TIN", align: "center" },
    { key: "contactPerson", label: "Contact Person", align: "center" },
    { key: "contactNumber", label: "Contact No.", align: "center" },
  ];

  // Only add Actions column for Management users
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
            onClick={() => handleEditClick(row)}
            color="info"
            size="small"
          />
          {row.statusCode !== activeKey && (
            <BaseButton
              icon={<Delete fontSize="small" />}
              tooltip="Delete Client"
              onClick={() => handleDeleteClient(row)}
              color="error"
              size="small"
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
          color="primary"
          variant="contained"
          size="medium"
        />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={columns}
          rows={clients}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={handleInfoClick}
        />

        <CustomPagination
          count={clients.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* Modals */}
      <ClientAEModal
        open={openAEModal}
        handleClose={() => setOpenAEModal(false)}
        clientData={selectedClient}
        onClientSaved={fetchClients}
        activeKey={activeKey}
        pendingKey={pendingKey}
        managementKey={managementKey}
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
        managementKey={managementKey}
      />
    </PageLayout>
  );
}

export default Client;