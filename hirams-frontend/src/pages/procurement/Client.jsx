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

function PClient() {
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

  // -------------------------
  // Filter Menu
  // -------------------------
  const [filterStatus, setFilterStatus] = useState("");
  // When mapping loads, set the default label
  useEffect(() => {
    if (!mappingLoading && Object.keys(activeClient).length > 0) {
      const defaultCode = Object.keys(activeClient)[0]; // "A"
      const defaultLabel = activeClient[defaultCode]; // "Active"
      setFilterStatus(defaultLabel);
    }
  }, [mappingLoading, activeClient]);

  // -------------------------
  // Fetch Clients
  // -------------------------
  const fetchClients = async () => {
    try {
      const allData = await api.get(`clients`);
      const allArray = allData.clients || [];
      const formattedAll = allArray.map((client) => ({
        id: client.nClientId,
        name: client.strClientName,
        nickname: client.strClientNickName,
        tin: client.strTIN,
        address: client.strAddress,
        businessStyle: client.strBusinessStyle,
        contactPerson: client.strContactPerson,
        contactNumber: client.strContactNumber,
        statusCode: client.cStatus, // ✅ needed for automatic counts
      }));

      setAllClients(formattedAll);

      const statusCode =
        Object.keys(clientstatus).find(
          (key) => clientstatus[key] === filterStatus
        ) || "";
      const filteredData = allArray.filter(
        (client) => statusCode === "" || client.cStatus === statusCode
      );
      const formattedFiltered = filteredData.map((client) => ({
        id: client.nClientId,
        name: client.strClientName,
        nickname: client.strClientNickName,
        tin: client.strTIN,
        address: client.strAddress,
        businessStyle: client.strBusinessStyle,
        contactPerson: client.strContactPerson,
        contactNumber: client.strContactNumber,
        status_code: client.cStatus,
      }));
      setClients(formattedFiltered);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading, search, filterStatus]);

  // -------------------------
  // Pagination
  // -------------------------
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  // -------------------------
  // Client Actions
  // -------------------------
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
        await showSpinner(`Deleting ${client.name}...`, 1000);
        await api.delete(`clients/${client.id}`);
        fetchClients();
        await showSwal("DELETE_SUCCESS", {}, { entity: client.name });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: client.name });
      }
    });
  };
  const managementKey = Object.keys(managementCode)[0]; // dynamically get "A"
  const activeKey = Object.keys(activeClient)[0]; // dynamically get "A"
  const inactiveKey = Object.keys(inactiveClient)[0]; // dynamically get "I"
  const pendingKey = Object.keys(pendingClient)[0]; // dynamically get "P"
  const activeLabel = activeClient[activeKey]; // "Active"
  const inactiveLabel = inactiveClient[inactiveKey]; // "Inactive"
  const pendingLabel = pendingClient[pendingKey]; // "For Assignment"
  // Approve -> (P → A)
  const handleApprove = async () => {
    const activeKey = Object.keys(activeClient)[0]; // dynamically get "A"
    await api.patch(`clients/${selectedClient.id}/status`, {
      cStatus: activeKey,
    });
    await fetchClients();
  };

  // Activate -> (I → A)
  const handleActivate = async () => {
    const activeKey = Object.keys(activeClient)[0]; // dynamically get "A"
    await api.patch(`clients/${selectedClient.id}/status`, {
      cStatus: activeKey,
    });
    await fetchClients();
  };

  // Deactivate -> (A → I)
  const handleDeactivate = async () => {
    const inactiveKey = Object.keys(inactiveClient)[0]; // dynamically get "I"
    await api.patch(`clients/${selectedClient.id}/status`, {
      cStatus: inactiveKey,
    });
    await fetchClients();
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
        <SyncMenu onSync={() => fetchClients()} />
        <StatusFilterMenu
          statuses={clientstatus} // { code: "Label" }
          items={allClients} // all clients with `statusCode`
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={pendingClient}
        />

        <AddButton
          onClick={() => setOpenAddModal(true)}
          label="Add Client"
          className="ml-auto h-10 flex-shrink-0"
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
              render: (_, row) => {
                // Hide Edit button if status is Active ("A")
                const isActive = row.status_code === activeKey;

                return (
                  <ClientIcons
                    onEdit={() => handleEditClick(row)}
                    onDelete={isActive ? null : () => handleDeleteClient(row)}
                  />
                );
              },
              align: "center",
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

export default PClient;
