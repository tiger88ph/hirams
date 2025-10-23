import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, ClientIcons } from "../../components/common/Buttons";

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
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.nickname || "").toLowerCase().includes(query) ||
      (c.contactNumber || "").toLowerCase().includes(query)
    );
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
  // ✅ Handle Approve
  const handleApprove = async () => {
    try {
      const response = await api.patch(`clients/${selectedClient.id}/status`, {
        cStatus: "A", // Active/Approved
      });
      console.log("✅ Client approved:", response);
      setOpenInfoModal(false); // ✅ Correct function name
      fetchClients(); // Refresh data
    } catch (error) {
      console.error("❌ Error approving client:", error.message);
    }
  };

  // ✅ Handle Activate
  const handleActive = async () => {
    try {
      const response = await api.patch(`clients/${selectedClient.id}/status`, {
        cStatus: "A",
      });
      console.log("✅ Client activated:", response);
      setOpenInfoModal(false); // ✅ Correct function name
      fetchClients();
    } catch (error) {
      console.error("❌ Error activating client:", error.message);
    }
  };

  // ✅ Handle Inactivate
  const handleInactive = async () => {
    try {
      const response = await api.patch(`clients/${selectedClient.id}/status`, {
        cStatus: "I", // Inactive
      });
      console.log("✅ Client deactivated:", response);
      setOpenInfoModal(false); // ✅ Correct function name
      fetchClients();
    } catch (error) {
      console.error("❌ Error deactivating client:", error.message);
    }
  };

  return (
    <PageLayout title={HEADER_TITLES.CLIENT}>
      <section className="flex items-center gap-2 mb-3">
        {/* Search Field */}
        <div className="flex-grow">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* Filter Buttons */}
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => console.log("Filter 1 clicked")}
        >
          Sort by:
        </button>
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => console.log("Filter 1 clicked")}
        >
          All
        </button>
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => console.log("Filter 2 clicked")}
        >
          Active
        </button>
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => console.log("Filter 3 clicked")}
        >
          Inactive
        </button>
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => console.log("Filter 3 clicked")}
        >
          Pending
        </button>

        {/* Add Button */}
        <AddButton onClick={() => setOpenAddModal(true)} label="Add Client" />
      </section>

      {/* Client Table */}
      <section className="bg-white shadow-sm">
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

      {/* Modals */}
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
      />
    </PageLayout>
  );
}

export default Client;
