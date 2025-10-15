import React, { useState, useMemo } from "react";
import { Box, Button, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import Swal from "sweetalert2";

import AddSupplierModal from "../components/ui/modals/admin/supplier/AddSupplierModal";
import EditSupplierModal from "../components/ui/modals/admin/supplier/EditSupplierModal";

function Supplier() {
  const [users, setUsers] = useState([
    {
      id: 1,
      fullName: "Doe, John D.",
      username: "johndoe",
      email: "johndoe@gmail.com",
      status: "Active",
    },
    {
      id: 2,
      fullName: "Smith, Jane S.",
      username: "janesmith",
      email: "janesmith@gmail.com",
      status: "Inactive",
    },
  ]);

  const [search, setSearch] = useState("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const handleDeleteUser = (id) => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setUsers(users.filter((u) => u.id !== id));
        Swal.fire("Deleted!", "User has been deleted successfully.", "success");
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setUsers(users.filter((u) => !selectedIds.includes(u.id)));
    setSelectedIds([]);
    Swal.fire("Deleted!", "Selected users have been deleted successfully.", "success");
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const columns = [
    { field: "fullName", headerName: "Full Name", flex: 1 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            params.value === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box className="flex justify-center gap-2">
          <EditIcon
            className="cursor-pointer hover:text-blue-600"
            fontSize="small"
            onClick={() => handleEditClick(params.row)}
          />
          <DeleteIcon
            className="cursor-pointer hover:text-red-600"
            fontSize="small"
            onClick={() => handleDeleteUser(params.row.id)}
          />
          <InfoIcon className="cursor-pointer hover:text-green-600" fontSize="small" />
        </Box>
      ),
    },
  ];

  return (
    <Box className="p-3 bg-white shadow-lg rounded-l-xl">
      {/* Header */}
      <Box className="flex justify-between items-center mb-2">
        <h1 className="text-sm font-semibold text-gray-800">Supplier Management</h1>
      </Box>

      {/* Search + Buttons */}
      <Box className="flex justify-between items-center mb-2">
        <TextField
          label="Search User"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "25ch" }}
        />
        <Box className="flex gap-2">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddModal(true)}
          >
            Add User
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            color={selectedIds.length > 0 ? "error" : "inherit"}
          >
            Delete Selected
          </Button>
        </Box>
      </Box>

{/* DataGrid */}
<div style={{ width: "90%" }}>
  <DataGrid
    autoHeight
    rows={filteredUsers}
    columns={columns}
    pageSize={5}
    rowsPerPageOptions={[5, 10, 25]}
    checkboxSelection
    onSelectionModelChange={(ids) => setSelectedIds(ids)}
    selectionModel={selectedIds}
    hideFooterSelectedRowCount // optional: hide "x rows selected" text
  />
</div>



      {/* Modals */}
      <AddSupplierModal open={openAddModal} handleClose={() => setOpenAddModal(false)} />
      <EditSupplierModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        user={selectedUser}
      />
    </Box>
  );
}

export default Supplier;
