import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import {
  AddButton,
  ClientIcons,
  SortClientToolbar,
} from "../../components/common/Buttons";

import AddClientModal from "../../components/ui/modals/admin/client/AddClientModal";
import EditClientModal from "../../components/ui/modals/admin/client/EditClientModal";
import InfoClientModal from "../../components/ui/modals/admin/client/InfoClientModal";

import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";
import PageLayout from "../../components/common/PageLayout";

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";

function Client() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedClient, setSelectedClient] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Active");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const { clientstatus, loading: mappingLoading } = useMapping();

  const fetchClients = async () => {
    try {
      const data = await api.get("clients");
      const clientsArray = data.clients || [];
      const formatted = clientsArray.map((client) => ({
        id: client.nClientId,
        name: client.strClientName,
        nickname: client.strClientNickName,
        tin: client.strTIN,
        address: client.strAddress,
        businessStyle: client.strBusinessStyle,
        contactPerson: client.strContactPerson,
        contactNumber: client.strContactNumber,
        status: clientstatus[client.cStatus] || client.cStatus,
      }));
      setClients(formatted);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading]);

  const filteredClients = clients.filter((c) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (c.name || "").toLowerCase().includes(query) ||
      (c.nickname || "").toLowerCase().includes(query) ||
      (c.contactNumber || "").toLowerCase().includes(query) || 
      (c.address || "").toLowerCase().includes(query);

    const matchesStatus = statusFilter
      ? c.status.toLowerCase() === statusFilter.toLowerCase()
      : true;

    return matchesSearch && matchesStatus;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
        setClients((prev) => prev.filter((c) => c.id !== client.id));
        await showSwal("DELETE_SUCCESS", {}, { entity: client.name });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: client.name });
      }
    });
  };

  const handleApprove = async () => {
    try {
      await api.patch(`clients/${selectedClient.id}/status`, { cStatus: "A" });
      fetchClients();
    } catch (error) {
      console.error(error);
    }
  };

  const handleActive = async () => {
    try {
      await api.patch(`clients/${selectedClient.id}/status`, { cStatus: "A" });
      fetchClients();
    } catch (error) {
      console.error(error);
    }
  };

  const handleInactive = async () => {
    try {
      await api.patch(`clients/${selectedClient.id}/status`, { cStatus: "I" });
      fetchClients();
    } catch (error) {
      console.error(error);
    }
  };
// 🟢 Badge renderer for Status (same size as EWT badge)
const renderStatusBadge = (status) => {
  let colorClasses = "";
  switch (status?.toLowerCase()) {
    case "active":
      colorClasses = "bg-green-100 text-green-700";
      break;
    case "inactive":
      colorClasses = "bg-red-100 text-red-600";
      break;
    case "pending":
      colorClasses = "bg-yellow-100 text-yellow-700";
      break;
    default:
      colorClasses = "bg-gray-100 text-gray-700";
      break;
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}
    >
      {status}
    </span>
  );
};


  return (
    <PageLayout title={HEADER_TITLES.CLIENT}>
      {/* 🔍 Search + Sort */}
      <section className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="flex flex-wrap items-center bg-gray-100 rounded-lg shadow-sm px-3 py-2 gap-1">
          <span className="text-gray-700 text-xs font-medium whitespace-nowrap">
            Sort by:
          </span>

          <SortClientToolbar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clients={clients}
          />
        </div>

        <AddButton
          onClick={() => setOpenAddModal(true)}
          label="Add Client"
          className="ml-auto"
        />
      </section>

      {/* 📋 Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "name", label: TABLE_HEADERS.CLIENT.NAME },
            { key: "address", label: TABLE_HEADERS.CLIENT.ADDRESS },
            { key: "tin", label: TABLE_HEADERS.CLIENT.TIN },
            {
              key: "contactPerson",
              label: TABLE_HEADERS.CLIENT.CONTACT_PERSON,
            },
            {
              key: "contactNumber",
              label: TABLE_HEADERS.CLIENT.CONTACT_NUMBER,
            },
            {
              key: "status",
              label: TABLE_HEADERS.CLIENT.STATUS,
              render: (_, row) => renderStatusBadge(row.status),
            },
            {
              key: "actions",
              label: TABLE_HEADERS.CLIENT.ACTIONS,
              render: (_, row) => (
                <ClientIcons
                  onInfo={() => handleInfoClick(row)}
                  onEdit={() => handleEditClick(row)}
                  onDelete={() => handleDeleteClient(row)}
                />
              ),
            },
          ]}
          rows={filteredClients}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
        />

        <CustomPagination
          count={filteredClients.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* 🧩 Modals */}
      <AddClientModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onClientAdded={fetchClients}
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
        onActive={handleActive}
        onInactive={handleInactive}
        onRedirect={(status) => setStatusFilter(status)}
      />
    </PageLayout>
  );
}

export default Client;
