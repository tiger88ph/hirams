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

import { IconButton, Menu, MenuItem } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

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

  // Count only for Pending
  const pendingCount = clients.filter((c) => c.status === "Pending").length;

  // Filtered clients based on search and status
  const filteredClients = clients.filter((c) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (c.name || "").toLowerCase().includes(query) ||
      (c.address || "").toLowerCase().includes(query) ||
      (c.contactPerson || "").toLowerCase().includes(query);

    const matchesStatus = statusFilter
      ? c.status.toLowerCase() === statusFilter.toLowerCase()
      : true;

    return matchesSearch && matchesStatus;
  });

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
      <section className="flex flex-wrap items-center gap-2 mb-4 relative">
        <div className="flex-grow min-w-[200px]">
          <CustomSearchField
            label="Search Client"
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* Filter Icon with red Pending badge */}
        <div className="relative flex items-center bg-gray-100 rounded-lg px-3 h-10">
          <div className="relative flex items-center justify-center h-full">
            <IconButton size="small" onClick={handleMenuClick}>
              <FilterListIcon />
            </IconButton>

            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[0.65rem] font-bold rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </div>

          <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
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

        <AddButton
          onClick={() => setOpenAddModal(true)}
          label="Add Client"
          className="ml-auto h-10"
        />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "name", label: TABLE_HEADERS.CLIENT.NAME}, 
            {
              key: "address",
              label: TABLE_HEADERS.CLIENT.ADDRESS
            },
            { key: "tin", label: TABLE_HEADERS.CLIENT.TIN, align: "center" },
            {
              key: "contactPerson",
              label: TABLE_HEADERS.CLIENT.CONTACT_PERSON, align: "center"
            },
            {
              key: "contactNumber",
              label: TABLE_HEADERS.CLIENT.CONTACT_NUMBER, align: "center"
            },
            {
              key: "status",
              label: TABLE_HEADERS.CLIENT.STATUS, align: "center",
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
