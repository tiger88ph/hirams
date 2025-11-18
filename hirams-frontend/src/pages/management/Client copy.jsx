import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import PageLayout from "../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, ClientIcons } from "../../components/common/Buttons";

import AddClientModal from "../../components/ui/modals/admin/client/AddClientModal";
import EditClientModal from "../../components/ui/modals/admin/client/EditClientModal";
import InfoClientModal from "../../components/ui/modals/admin/client/InfoClientModal";

import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";

import { Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

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
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedClient, setSelectedClient] = useState(null);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const {
    clientstatus,
    activeClient,
    pendingClient,
    inActiveClient,
    loading: mappingLoading,
  } = useMapping();

  // -------------------------
  // 🔹 Filter Menu
  // -------------------------
  const [anchorEl, setAnchorEl] = useState(null);
  const defaultStatus = Object.values(activeClient)[0] || "Active";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuSelect = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  // -------------------------
  // 🔹 Fetch Clients
  // -------------------------
  const fetchClients = async () => {
    try {
      const statusCode =
        Object.keys(clientstatus).find(
          (key) => clientstatus[key] === filterStatus
        ) || "";

      const data = await api.get(
        `clients?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusCode)}`
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
  }, [mappingLoading, search, filterStatus]);

  // -------------------------
  // 🔹 Pending count
  // -------------------------
  const pendingCode = Object.keys(pendingClient)[0];
  const pendingCount = clients.filter(
    (c) => c.status_code === pendingCode
  ).length;

  // -------------------------
  // 🔹 Pagination
  // -------------------------
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // -------------------------
  // 🔹 Client Actions
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
        setClients((prev) => prev.filter((c) => c.id !== client.id));
        await showSwal("DELETE_SUCCESS", {}, { entity: client.name });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: client.name });
      }
    });
  };

  // -------------------------
  // 🔹 Status badge renderer
  // -------------------------
  const renderStatusBadge = (status) => {
    let colorClasses = "";
    switch (status?.toLowerCase()) {
      case "active":
        colorClasses = "bg-green-100 text-green-700";
        break;
      case "inactive":
        colorClasses = "bg-red-100 text-red-600";
        break;
      case "for approval":
        colorClasses = "bg-yellow-100 text-yellow-700";
        break;
      default:
        colorClasses = "bg-gray-100 text-gray-700";
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
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>

        <div
          className="relative flex items-center bg-gray-100 rounded-lg px-2 h-8 cursor-pointer select-none"
          onClick={handleMenuClick}
        >
          <FilterListIcon fontSize="small" className="text-gray-600 mr-1" />
          <span className="text-sm text-gray-700">{filterStatus}</span>

          {/* Pending badge on icon */}
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.65rem] rounded-full px-1.5">
              {pendingCount}
            </span>
          )}
        </div>

        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          {Object.values(clientstatus).map((label) => (
            <MenuItem
              key={label}
              onClick={() => handleMenuSelect(label)}
              selected={filterStatus === label}
            >
              {label === "For Approval" && pendingCount > 0
                ? `For Approval (${pendingCount})`
                : label}
            </MenuItem>
          ))}
        </Menu>

        <AddButton
          onClick={() => setOpenAddModal(true)}
          label="Add Client"
          className="ml-auto h-10 flex-shrink-0"
        />
      </section>

      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "name", label: TABLE_HEADERS.CLIENT.NAME },
            { key: "address", label: TABLE_HEADERS.CLIENT.ADDRESS },
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
        onRedirect={setFilterStatus}
      />
    </PageLayout>
  );
}

export default Client;
