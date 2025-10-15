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

function Client() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");

      const data = await response.json();

      const formatted = data.map((client) => ({
        id: client.nClientId,
        name: client.strClientName, // mapped key
        nickname: client.strClientNickName, // note the typo from your API
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
  const [selectedClients, setSelectedClients] = useState([]);
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

  // --- Select handlers
  const handleSelectClient = (id) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedClients(filteredClients.map((c) => c.name));
    } else {
      setSelectedClients([]);
    }
  };

  // --- Delete client
  const handleDeleteClient = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // ✅ Show loading while deleting
          Swal.fire({
            title: "Deleting...",
            text: "Please wait while we remove the client.",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // ✅ API call to delete client
          const response = await fetch(
            `http://127.0.0.1:8000/api/clients/${id}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error("Failed to delete client");
          }

          // ✅ Update state (remove client locally)
          setClients((prev) => prev.filter((c) => c.id !== id));
          setSelectedClients((prev) => prev.filter((n) => n !== id));

          Swal.fire(
            "Deleted!",
            "Client has been deleted successfully.",
            "success"
          );
        } catch (error) {
          console.error("Error deleting client:", error);
          Swal.fire(
            "Error",
            "Failed to delete client. Please try again.",
            "error"
          );
        }
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

  const isAllSelected =
    filteredClients.length > 0 &&
    selectedClients.length === filteredClients.length;

  const isIndeterminate =
    selectedClients.length > 0 &&
    selectedClients.length < filteredClients.length;

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-l-xl p-3 pt-0">
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

          <div className="flex items-center gap-[6px]">
            <Button
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setOpenAddModal(true)}
              sx={{
                textTransform: "none",
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
                borderRadius: 2,
                fontSize: "0.75rem",
                px: 2,
              }}
            >
              Add Client
            </Button>

            <Button
              variant="contained"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => {
                selectedClients.forEach((id) => handleDeleteClient(id));
                setSelectedClients([]);
              }}
              disabled={selectedClients.length === 0}
              sx={{
                textTransform: "none",
                bgcolor: selectedClients.length > 0 ? "#d32f2f" : "#ccc",
                "&:hover": {
                  bgcolor: selectedClients.length > 0 ? "#b71c1c" : "#ccc",
                },
                borderRadius: 2,
                fontSize: "0.75rem",
                px: 2,
              }}
            >
              Delete Selected
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={() => handleSelectClient(client.id)} // ✅ use id
                      />
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
                    .map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onChange={() => handleSelectClient(client.id)}
                          />
                        </TableCell>
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
                              onClick={() => handleDeleteClient(client.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <TablePagination
            component="div"
            count={filteredClients.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </section>
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
