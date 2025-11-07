import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping"; //

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

import { IconButton, Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

function Client() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedClient, setSelectedClient] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const {
    activeClient,
    pendingClient,
    inActiveClient,
    clientstatus,
    loading: mappingLoading,
  } = useMapping();

  const statusCodeMap = React.useMemo(() => {
    if (!clientstatus) return {};
    return Object.fromEntries(
      Object.entries(clientstatus).map(([code, label]) => [label, code])
    );
  }, [clientstatus]);

  const fetchClients = async () => {
    try {
      const statusCode = statusCodeMap[statusFilter] || "";

      // Use query string
      const data = await api.get(
        `clients?search=${encodeURIComponent(
          search
        )}&status=${encodeURIComponent(statusCode)}`
      );

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

        // ✅ Apply mapped name: clientstatus = { A: "Active", I: "Inactive", P: "Pending" }
        status: clientstatus[client.cStatus] || client.cStatus,
        status_code: client.cStatus,
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
  }, [mappingLoading, search, statusFilter]); // ✅ add statusFilter

  // Get the code for the mapped "Pending" status
  const pendingCode = Object.keys(pendingClient).find(() => true);
  const activeCode = Object.keys(activeClient).find(() => true);
  const inactiveCode = Object.keys(inActiveClient).find(() => true);


  const pendingCount = clients.filter(
    (c) => c.status_code === pendingCode
  ).length;

  // Pagination
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Client actions
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
      await api.patch(`clients/${selectedClient.id}/status`, { cStatus: activeCode });
    } catch (error) {
      console.error(error);
    }
  };

  const handleActive = async () => {
    try {
      await api.patch(`clients/${selectedClient.id}/status`, { cStatus: activeCode });
    } catch (error) {
      console.error(error);
    }
  };

  const handleInactive = async () => {
    try {
      await api.patch(`clients/${selectedClient.id}/status`, { cStatus: inactiveCode });
    } catch (error) {
      console.error(error);
    }
  };

  // Status badge renderer
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

  // Menu state for filter icon
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (status) => {
    setStatusFilter(status);
    handleMenuClose();
  };

  return (
    <PageLayout title={HEADER_TITLES.CLIENT}>
      <section className="flex items-center gap-2 mb-3">
        {/* Search bar that grows but doesn't overflow */}
        <div className="flex-grow">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* Filter icon with badge */}
        <div className="relative flex items-center bg-gray-100 rounded-lg px-1.5 h-7 flex-shrink-0">
          <div className="relative flex items-center justify-center h-full">
            <IconButton size="small" onClick={handleMenuClick}>
              <FilterListIcon fontSize="small" />
            </IconButton>

            {pendingCount > 0 && (
              <span className="absolute -top-0 -right-3 bg-red-500 text-white text-[0.6rem] rounded-full px-1 py-[1px]">
                {pendingCount}
              </span>
            )}
          </div>

          <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
            <MenuItem onClick={() => handleMenuSelect("")}>All</MenuItem>
            <MenuItem onClick={() => handleMenuSelect("Active")}>
              Active
            </MenuItem>
            <MenuItem onClick={() => handleMenuSelect("Inactive")}>
              Inactive
            </MenuItem>
            <MenuItem onClick={() => handleMenuSelect("Pending")}>
              Pending {pendingCount > 0 ? `(${pendingCount})` : ""}
            </MenuItem>
          </Menu>
        </div>

        {/* Add button aligned to the right, doesn't shrink */}
        <AddButton
          onClick={() => setOpenAddModal(true)}
          label="Add Client"
          className="ml-auto h-10 flex-shrink-0"
        />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            {
              key: "name",
              label: TABLE_HEADERS.CLIENT.NAME,
              render: (value) =>
                value && value.length > 25 ? value.slice(0, 25) + "…" : value,
            },
            {
              key: "address",
              label: TABLE_HEADERS.CLIENT.ADDRESS,
              render: (value) =>
                value && value.length > 25 ? value.slice(0, 25) + "…" : value,
            },
            { key: "tin", label: TABLE_HEADERS.CLIENT.TIN, align: "center" },
            {
              key: "contactPerson",
              label: TABLE_HEADERS.CLIENT.CONTACT_PERSON,
              align: "center",
            },
            {
              key: "contactNumber",
              label: TABLE_HEADERS.CLIENT.CONTACT_NUMBER,
              align: "center",
            },
            {
              key: "status",
              label: TABLE_HEADERS.CLIENT.STATUS,
              align: "center",
              render: (_, row) => renderStatusBadge(row.status),
            },
            {
              key: "actions",
              label: TABLE_HEADERS.CLIENT.ACTIONS,
              render: (_, row) => (
                <ClientIcons
                  onEdit={() => handleEditClick(row)}
                  onDelete={() => handleDeleteClient(row)}
                />
              ),
            },
          ]}
          rows={clients}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={(row) => handleInfoClick(row)}
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
