import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, ClientIcons } from "../../components/common/Buttons";
import StatusFilterMenu from "../../components/common/StatusFilterMenu";
import AddClientModal from "../../components/ui/modals/admin/client/AddClientModal";
import EditClientModal from "../../components/ui/modals/admin/client/EditClientModal";
import InfoClientModal from "../../components/ui/modals/admin/client/InfoClientModal";
import SyncMenu from "../../components/common/Syncmenu";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

function Client() {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedClient, setSelectedClient] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const {
    clientstatus,
    activeClient,
    inactiveClient,
    pendingClient,
    managementCode,
    loading: mappingLoading,
  } = useMapping();

  // -----------------------------------------------------
  // STATUS KEYS (dynamic — same logic as User)
  // -----------------------------------------------------
  const activeKey = Object.keys(activeClient)[0] || "";
  const inactiveKey = Object.keys(inactiveClient)[0] || "";
  const pendingKey = Object.keys(pendingClient)[0] || "";
  const managementKey = Object.keys(managementCode)[0] || "";

  const activeLabel = activeClient[activeKey] || "";
  const inactiveLabel = inactiveClient[inactiveKey] || "";
  const pendingLabel = pendingClient[pendingKey] || "";

  // -----------------------------------------------------
  // FILTER MENU — default to Active
  // -----------------------------------------------------
  const [filterStatus, setFilterStatus] = useState("");
  useEffect(() => {
    if (!mappingLoading && activeKey) {
      setFilterStatus(activeLabel);
    }
  }, [mappingLoading, activeLabel]);

  // -----------------------------------------------------
  // Fetch Clients
  // -----------------------------------------------------
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

      const statusFilterKey = Object.keys(clientstatus).find(
        (k) => clientstatus[k] === filterStatus
      );

      const filtered = formattedAll.filter(
        (x) => !statusFilterKey || x.statusCode === statusFilterKey
      );

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

  // -----------------------------------------------------
  // Pagination
  // -----------------------------------------------------
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // -----------------------------------------------------
  // ACTIONS (refactor same as User)
  // -----------------------------------------------------
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

  const handleEditClick = (client) => {
    setSelectedClient(client);
    setOpenEditModal(true);
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
          pendingClient={pendingClient}
        />

        <AddButton
          label="Add Client"
          className="ml-auto h-10"
          onClick={() => setOpenAddModal(true)}
        />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
            { key: "tin", label: "TIN", align: "center" },
            { key: "contactPerson", label: "Contact Person", align: "center" },
            { key: "contactNumber", label: "Contact No.", align: "center" },
            {
              key: "actions",
              label: "Actions",
              align: "center",
              render: (_, row) => (
                <ClientIcons
                  onEdit={() => handleEditClick(row)}
                  onDelete={
                    row.statusCode === activeKey
                      ? null
                      : () => handleDeleteClient(row)
                  }
                />
              ),
            },
          ]}
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
      <AddClientModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onClientAdded={fetchClients}
        activeKey={activeKey}
        pendingKey={pendingKey}
        managementKey={managementKey}
      />

      <EditClientModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        clientData={selectedClient}
        onClientUpdated={fetchClients}
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
