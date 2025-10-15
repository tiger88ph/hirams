import React, { useState, useEffect } from "react";
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

import AddUserModal from "../components/ui/modals/admin/user/AddUserModal";
import EditUserModal from "../components/ui/modals/admin/user/EditUserModal";
import ViewActivityLogModal from "../components/ui/modals/admin/user/ViewActivityLogModal";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [openActivityLogModal, setOpenActivityLogModal] = useState(false);
  const [selectedActivityLogs, setSelectedActivityLogs] = useState([]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();

      const formatted = data.map((user) => ({
        id: user.nUserId,
        firstName: user.strFName,
        middleName: user.strMName,
        lastName: user.strLName,
        nickname: user.strNickName,
        type: user.cUserType,
        status: user.cStatus === "A", // boolean for modal switch
        statusText: user.cStatus === "A" ? "Active" : "Inactive", // string for table
        fullName: `${user.strFName} ${user.strMName} ${user.strLName}`.trim(),
      }));

      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.nickname.toLowerCase().includes(search.toLowerCase())
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

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // const handleViewActivity = (user) => {
  //   setSelectedActivityLogs(user.activityLogs || []);
  //   setOpenActivityLogModal(true);
  // };

  // Delete single user
  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

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
        didOpen: async () => {
          Swal.showLoading();
          try {
            const response = await fetch(
              `http://127.0.0.1:8000/api/users/${id}`,
              {
                method: "DELETE",
              }
            );
            if (!response.ok) throw new Error("Failed to delete user");

            setUsers(users.filter((u) => u.id !== id));

            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: "User has been deleted successfully.",
              showConfirmButton: true,
            });
          } catch (error) {
            console.error(error);
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: "Failed to delete user.",
            });
          }
        },
      });
    }
  };

  // Delete selected users (IDs must be in selectedUsers array)
  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete selected!",
    });

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
        didOpen: async () => {
          Swal.showLoading();
          try {
            await Promise.all(
              selectedUsers.map((id) =>
                fetch(`http://127.0.0.1:8000/api/users/${id}`, {
                  method: "DELETE",
                })
              )
            );

            setUsers(users.filter((u) => !selectedUsers.includes(u.id)));
            setSelectedUsers([]);

            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: "Selected users have been deleted successfully.",
              showConfirmButton: true,
            });
          } catch (error) {
            console.error(error);
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: "Failed to delete selected users.",
            });
          }
        },
      });
    }
  };

  const isAllSelected =
    filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isIndeterminate =
    selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-l-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">User Management</h1>
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
                    <TableCell>
                      <strong>Full Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nickname</strong>
                    </TableCell>
                    {/* <TableCell>
                      <strong>Email</strong>
                    </TableCell> */}
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
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.nickname}</TableCell>
                        {/* <TableCell>{user.email}</TableCell> */}
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.status
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {user.statusText}
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
                              onClick={() => handleDeleteUser(user.id)}
                            />
                            {/* <InfoIcon
                                className="cursor-pointer hover:text-green-600"
                                fontSize="small"
                                onClick={() => handleViewActivity(user)}
                              /> */}
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

      <AddUserModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onUserAdded={fetchUsers} // ✅ pass reload function
      />
      <EditUserModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        user={selectedUser} // ✅ pass the selected user object
        onUserUpdated={fetchUsers} // ✅ pass reload function
      />
      {/* <ViewActivityLogModal
        open={openActivityLogModal}
        handleClose={() => setOpenActivityLogModal(false)}
        activityLogs={selectedActivityLogs}
      /> */}
    </div>
  );
}

export default User;
