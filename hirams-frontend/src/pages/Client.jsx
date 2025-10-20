import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TablePagination,
  TextField,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Swal from "sweetalert2";
import AddClientModal from "../components/ui/modals/admin/client/AddClientModal";
import EditClientModal from "../components/ui/modals/admin/client/EditClientModal";
import api from "../utils/api/api";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../utils/swal";

function Client() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const data = await api.get("clients"); // data is { message, clients }
      const clientsArray = data.clients || []; // safely get the array

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

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedClient, setSelectedClient] = useState(null);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  const filteredClients = clients.filter((c) => {
    const name = (c.strClientName || "").toLowerCase();
    const nickname = (c.strCientNickName || "").toLowerCase();
    const contactNumber = (c.strContactNumber || "").toLowerCase();
    const query = search.toLowerCase();

    return (
      name.includes(query) ||
      nickname.includes(query) ||
      contactNumber.includes(query)
    );
  });

  // --- Pagination handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  // --- Delete client
  const handleDeleteClient = async (client) => {
    // Use first-letter verification before deletion
    await confirmDeleteWithVerification(client.name, async () => {
      try {
        // Show spinner with 1s minimum delay
        await showSpinner(`Deleting ${client.name}...`, 1000);
        // Perform API delete
        await api.delete(`clients/${client.id}`);
        // Update frontend list
        setClients((prev) => prev.filter((c) => c.id !== client.id));
        // Show success message
        await showSwal("DELETE_SUCCESS", {}, { entity: client.name });
      } catch (error) {
        console.error(error);
        // Show error message
        await showSwal("DELETE_ERROR", {}, { entity: client.name });
      }
    });
  };

  // --- Add client
  const handleSaveClient = (newClient) => {
    setClients((prev) => [...prev, { ...newClient, id: Date.now() }]);
  };

  // --- Edit client
  const handleEditClick = (client) => {
    setSelectedClient(client);
    setOpenEditModal(true);
  };

  const handleUpdateClient = (updatedClient) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
  };

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Client Management
        </h1>
      </header>

      <div className="space-y-2">
        <section className="p-2 rounded-lg flex justify-between items-center">
          <TextField
            label="Search Client"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: "25ch" }}
          />

          <div className="flex items-center ml-2 gap-1">
            {/* Add Client Button */}
            <Button
              variant="contained"
              onClick={() => setOpenAddModal(true)}
              sx={{
                textTransform: "none",
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
                borderRadius: 2,
                fontSize: "0.75rem",
                px: { xs: 1, sm: 2 },
                minWidth: { xs: 0, sm: "auto" },
                display: "flex",
                justifyContent: "center",
              }}
            >
              {/* sm+: icon + text */}
              <span className="hidden sm:flex items-center gap-1">
                <AddIcon fontSize="small" />
                Add Client
              </span>
              {/* xs: icon only */}
              <span className="flex sm:hidden">
                <AddIcon fontSize="small" />
              </span>
            </Button>
          </div>
        </section>
        {/* Table */}
        <section className="bg-white p-4">
          <div className="overflow-x-auto">
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>#</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Client Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nickname</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Contact Number</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((client, index) => {
                      const rowNumber = page * rowsPerPage + index + 1; // calculate sequential row number
                      return (
                        <TableRow key={client.id} hover>
                          <TableCell>{rowNumber}</TableCell>
                          <TableCell>{client.name}</TableCell>
                          <TableCell>{client.nickname}</TableCell>
                          <TableCell>{client.contactNumber || "N/A"}</TableCell>
                          <TableCell align="center">
                            <div className="flex justify-center space-x-3 text-gray-600">
                              <EditIcon
                                className="cursor-pointer hover:text-blue-600"
                                fontSize="small"
                                onClick={() => handleEditClick(client)}
                              />
                              <DeleteIcon
                                className="cursor-pointer hover:text-red-600"
                                fontSize="small"
                                onClick={() => handleDeleteClient(client)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </section>
        <TablePagination
          component="div"
          count={filteredClients.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            width: "100%",
            overflow: "hidden",
            "& .MuiTablePagination-toolbar": {
              display: "flex",
              flexWrap: "nowrap", // ❗never wrap
              justifyContent: "end", // space evenly
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
              width: "100%",
              minWidth: 0,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: { xs: "0.6rem", sm: "0.775rem" },
                whiteSpace: "nowrap", // ❗keep text in one line
              },
            "& .MuiTablePagination-select": {
              fontSize: { xs: "0.6rem", sm: "0.775rem" },
            },
            "& .MuiTablePagination-actions": {
              flexShrink: 0, // prevent action buttons from shrinking
            },
            "& .MuiTablePagination-spacer": {
              display: "none", // removes unneeded spacing
            },
          }}
        />
      </div>

      {/* Modals */}
      <AddClientModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSave={handleSaveClient}
        onClientAdded={fetchClients} // ✅ pass reload function
      />

      <EditClientModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        clientData={selectedClient}
        onSave={handleUpdateClient}
        onClientUpdated={fetchClients} // ✅ pass reload function
      />
    </div>
  );
}

export default Client;
