import React, { useState } from "react";
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

function Client() {
  const [clients, setClients] = useState([
    {
      strClientName: "Acme Corporation",
      strClientNickName: "Acme",
      strContactNumber: "0917-123-4567",
    },
    {
      strClientName: "Global Tech Solutions",
      strClientNickName: "GTS",
      strContactNumber: "0920-987-6543",
    },
  ]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedClients, setSelectedClients] = useState([]);

  const filteredClients = clients.filter(
    (c) =>
      c.strClientName.toLowerCase().includes(search.toLowerCase()) ||
      c.strClientNickName.toLowerCase().includes(search.toLowerCase()) ||
      (c.strContactNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectClient = (name) => {
    setSelectedClients((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedClients(filteredClients.map((c) => c.strClientName));
    } else {
      setSelectedClients([]);
    }
  };

  const handleDeleteClient = (name) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "",
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#f5c518">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <span style="font-size:16px;">Deleting... Please wait</span>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
              setClients(clients.filter((c) => c.strClientName !== name));
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "Client has been deleted successfully.",
                showConfirmButton: true,
              });
            }, 1000);
          },
        });
      }
    });
  };

  const isAllSelected =
    filteredClients.length > 0 &&
    selectedClients.length === filteredClients.length;
  const isIndeterminate =
    selectedClients.length > 0 &&
    selectedClients.length < filteredClients.length;

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-l-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">Client Management</h1>
      </header>

      <div className="space-y-2">
        {/* Search + Buttons */}
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
                selectedClients.forEach((name) => handleDeleteClient(name));
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
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><strong>Client Name</strong></TableCell>
                    <TableCell><strong>Nickname</strong></TableCell>
                    <TableCell><strong>Contact Number</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredClients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((client, index) => (
                      <TableRow key={index} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedClients.includes(client.strClientName)}
                            onChange={() => handleSelectClient(client.strClientName)}
                          />
                        </TableCell>
                        <TableCell>{client.strClientName}</TableCell>
                        <TableCell>{client.strClientNickName}</TableCell>
                        <TableCell>{client.strContactNumber || "N/A"}</TableCell>
                        <TableCell align="center">
                          <div className="flex justify-center space-x-3 text-gray-600">
                            <EditIcon
                              className="cursor-pointer hover:text-blue-600"
                              fontSize="small"
                            />
                            <DeleteIcon
                              className="cursor-pointer hover:text-red-600"
                              fontSize="small"
                              onClick={() => handleDeleteClient(client.strClientName)}
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
    </div>
  );
}

export default Client;
