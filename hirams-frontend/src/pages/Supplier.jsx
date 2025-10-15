import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  TablePagination,
  TextField,
  Button,
} from "@mui/material";
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
      fullName: "Doe, John D.",
      username: "johndoe",
      email: "johndoe@gmail.com",
      status: "Active",
      activityLogs: [
        {
          user: "John Doe",
          activity: "Added a new record",
          date: "2025-10-14 10:00 AM",
        },
        {
          user: "John Doe",
          activity: "Updated profile",
          date: "2025-10-14 10:30 AM",
        },
      ],
    },
    {
      fullName: "Smith, Jane S.",
      username: "janesmith",
      email: "janesmith@gmail.com",
      status: "Inactive",
      activityLogs: [
        {
          user: "Jane Smith",
          activity: "Deleted a record",
          date: "2025-10-13 09:20 AM",
        },
      ],
    },
  ]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [openActivityLogModal, setOpenActivityLogModal] = useState(false);
  const [selectedActivityLogs, setSelectedActivityLogs] = useState([]);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const handleSelectUser = (username) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(filteredUsers.map((u) => u.username));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleViewActivity = (user) => {
    setSelectedActivityLogs(user.activityLogs || []);
    setOpenActivityLogModal(true);
  };

  const handleDeleteUser = (username) => {
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
              setUsers(users.filter((u) => u.username !== username));
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "User has been deleted successfully.",
                showConfirmButton: true,
              });
            }, 1000);
          },
        });
      }
    });
  };

  const handleDeleteSelectedUsers = () => {
    if (selectedUsers.length === 0) return;

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete selected!",
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
              <span style="font-size:16px;">Deleting selected... Please wait</span>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
              setUsers(
                users.filter((u) => !selectedUsers.includes(u.username))
              );
              setSelectedUsers([]);
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "Selected users have been deleted successfully.",
                showConfirmButton: true,
              });
            }, 1000);
          },
        });
      }
    });
  };

  const isAllSelected =
    filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isIndeterminate =
    selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-l-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Supplier Management
        </h1>
      </header>

      <div className="space-y-2">
        {/* Search + Buttons */}
        <section className="p-2 rounded-lg flex justify-between items-center">
          <TextField
            label="Search User"
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
              Add User
            </Button>

            <Button
              variant="contained"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={handleDeleteSelectedUsers}
              disabled={selectedUsers.length === 0}
              sx={{
                textTransform: "none",
                bgcolor: selectedUsers.length > 0 ? "#d32f2f" : "#ccc",
                "&:hover": {
                  bgcolor: selectedUsers.length > 0 ? "#b71c1c" : "#ccc",
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
          {/* Outer scroll container for horizontal scrolling */}
          <div className="overflow-x-auto w-full">
            <TableContainer
              component={Paper}
              elevation={0}
              className="min-w-[700px]"
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>
                      <strong>Full Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Username</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Email</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user, index) => (
                      <TableRow key={index} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.includes(user.username)}
                            onChange={() => handleSelectUser(user.username)}
                          />
                        </TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex justify-center space-x-3 text-gray-600">
                            <EditIcon
                              className="cursor-pointer hover:text-blue-600"
                              fontSize="small"
                              onClick={() => handleEditClick(user)}
                            />
                            <DeleteIcon
                              className="cursor-pointer hover:text-red-600"
                              fontSize="small"
                              onClick={() => handleDeleteUser(user.username)}
                            />
                            <InfoIcon
                              className="cursor-pointer hover:text-green-600"
                              fontSize="small"
                              onClick={() => handleViewActivity(user)}
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
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </section>
      </div>

      {/* Modals */}
      <AddSupplierModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
      />
      <EditSupplierModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        user={selectedUser}
      />
    </div>
  );
}

export default Supplier;
