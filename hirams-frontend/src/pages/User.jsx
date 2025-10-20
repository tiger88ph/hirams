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
import api from "../utils/api/api";
import useMapping from "../utils/mappings/useMapping";

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../utils/swal";

function User() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [openActivityLogModal, setOpenActivityLogModal] = useState(false);
  const [selectedActivityLogs, setSelectedActivityLogs] = useState([]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userTypes, statuses, loading: mappingLoading } = useMapping();

  const fetchUsers = async () => {
    try {
      const data = await api.get("users"); // data is an object { message, users }
      const usersArray = data.users || []; // safely get the array

      const formatted = usersArray.map((user) => ({
        id: user.nUserId,
        firstName: user.strFName,
        middleName: user.strMName,
        lastName: user.strLName,
        nickname: user.strNickName,
        type: user.cUserType,
        status: user.cStatus === "A", // boolean for modal switch
        statusText: statuses[user.cStatus] || user.cStatus, // mapped label
        fullName: `${user.strFName} ${user.strMName || ""} ${
          user.strLName
        }`.trim(),
      }));

      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ only run fetchUsers when mapping is done loading
  useEffect(() => {
    if (!mappingLoading) {
      fetchUsers();
    }
  }, [mappingLoading]);

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
  // const handleViewActivity = (user) => {
  //   setSelectedActivityLogs(user.activityLogs || []);
  //   setOpenActivityLogModal(true);
  // };

  const handleDeleteUser = async (id, fullName) => {
    await confirmDeleteWithVerification(fullName || "User", async () => {
      try {
        await showSpinner(`Deleting ${fullName || "User"}...`, 1000);
        await api.delete(`users/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        await showSwal("DELETE_SUCCESS", {}, { entity: fullName || "User" });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: fullName || "User" });
      }
    });
  };

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
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

          <div className="flex items-center ml-2 gap-1">
            {/* Add User Button */}
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
              {/* Show text only on sm+ */}
              <span className="hidden sm:flex items-center gap-1">
                <AddIcon fontSize="small" />
                Add User
              </span>
              {/* Show only icon on xs */}
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
                      <strong>Name</strong>
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
                    .map((user, index) => {
                      const rowNumber = page * rowsPerPage + index + 1; // calculate row number
                      return (
                        <TableRow key={user.id} hover>
                          <TableCell>{rowNumber}</TableCell> {/* Row number */}
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
                                onClick={() =>
                                  handleDeleteUser(user.id, user.fullName)
                                }
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
          count={filteredUsers.length}
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
              justifyContent: "end", // evenly distribute space
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
