import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import { useLocation } from "react-router-dom";

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
  const [allClients, setAllClients] = useState([]);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const location = useLocation();
  const [selectedClient, setSelectedClient] = useState(null);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const {
    clientstatus,
    activeClient,
    pendingClient,
    loading: mappingLoading,
  } = useMapping();

  // -------------------------
  // SAME FILTER as Client.jsx
  // -------------------------
  const defaultStatus = Object.values(activeClient)[0] || "Active";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);

  // -------------------------
  // Fetch clients (EXACT same logic)
  // -------------------------
  const fetchClients = async () => {
    try {
      const allData = await api.get(`clients`);
      const allArray = allData.clients || [];

      // 1. STORE ALL CLIENTS (for counts)
      const formattedAll = allArray.map((client) => ({
        id: client.nClientId,
        name: client.strClientName,
        nickname: client.strClientNickName,
        tin: client.strTIN,
        address: client.strAddress,
        businessStyle: client.strBusinessStyle,
        contactPerson: client.strContactPerson,
        contactNumber: client.strContactNumber,
        statusCode: client.cStatus, // used by StatusFilterMenu
      }));
      setAllClients(formattedAll);

      // 2. APPLY FILTERING IDENTICAL TO Client.jsx
      const statusCode =
        Object.keys(clientstatus).find(
          (key) => clientstatus[key] === filterStatus
        ) || "";

      const filtered = allArray.filter(
        (client) => !statusCode || client.cStatus === statusCode
      );

      const formattedFiltered = filtered.map((client) => ({
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") setOpenAddModal(true);
  }, [location]);

  // -------------------------
  // Pagination
  // -------------------------
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // -------------------------
  // Actions
  // -------------------------
  const handleInfoClick = (client) => {
    setSelectedClient(client);
    setOpenInfoModal(true);
  };

  return (
    <PageLayout title={"Clients"}>
      {/* Search + Filter Bar */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchClients()} />
        {/* ✔ EXACT SAME FILTER COMPONENT */}
        <StatusFilterMenu
          statuses={clientstatus}
          items={allClients}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={pendingClient} // pass this prop!
        />

        <AddButton
          onClick={() => setOpenAddModal(true)}
          label="Add Client"
          className="ml-auto h-10 flex-shrink-0"
        />
      </section>

      {/* TABLE */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
            { key: "tin", label: "TIN", align: "center" },
            {
              key: "contactPerson",
              label: "Contact Person",
              align: "center",
            },
            {
              key: "contactNumber",
              label: "Contact no.",
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

      {/* Modals */}
      <AddClientModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onClientAdded={fetchClients}
      />
      <InfoClientModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        clientData={selectedClient}
        onRedirect={setFilterStatus}
      />
    </PageLayout>
  );
}

export default PClient;
