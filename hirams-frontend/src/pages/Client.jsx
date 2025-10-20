import React, { useState, useEffect } from "react";
import api from "../utils/api/api";

import CustomTable from "../components/common/Table";
import CustomPagination from "../components/common/Pagination";
import CustomSearchField from "../components/common/SearchField";
import { AddButton, ActionIcons } from "../components/common/Buttons";

import AddClientModal from "../components/ui/modals/admin/client/AddClientModal";
import EditClientModal from "../components/ui/modals/admin/client/EditClientModal";

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../utils/swal";

function Client() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedClient, setSelectedClient] = useState(null);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  // 🧩 Fetch clients
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
      }));

      setClients(formatted);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // 🔍 Filter logic
  const filteredClients = clients.filter((c) => {
    const query = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.nickname || "").toLowerCase().includes(query) ||
      (c.contactNumber || "").toLowerCase().includes(query)
    );
  });

  // Pagination
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🔧 Edit handler
  const handleEditClick = (client) => {
    setSelectedClient(client);
    setOpenEditModal(true);
  };

  // ❌ Delete handler
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

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* 🧭 Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Client Management
        </h1>
      </header>

      <div className="space-y-0">
        {/* 🔍 Search + Add */}
        <section
          className="p-2 rounded-lg flex items-center gap-2 overflow-hidden whitespace-nowrap"
          style={{
            flexWrap: "nowrap",
            minWidth: 0,
          }}
        >
          <div className="flex items-center gap-2 flex-grow">
            <CustomSearchField
              label="Search Client"
              value={search}
              onChange={setSearch}
            />
          </div>

          {/* 🟧 Add Button */}
          <AddButton onClick={() => setOpenAddModal(true)} label="Add Client" />
        </section>

        {/* 🧾 Table */}
        <section className="bg-white p-2 sm:p-4">
          <CustomTable
            columns={[
              { key: "name", label: "Client Name" },
              { key: "nickname", label: "Nickname" },
              { key: "contactNumber", label: "Contact Number" },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => (
                  <ActionIcons
                    onEdit={() => handleEditClick(row)}
                    onDelete={() => handleDeleteClient(row)}
                  />
                ),
              },
            ]}
            rows={filteredClients}
            page={page}
            rowsPerPage={rowsPerPage}
          />

          <CustomPagination
            count={filteredClients.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </section>
      </div>

      {/* 🪟 Modals */}
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
    </div>
  );
}

export default Client;
