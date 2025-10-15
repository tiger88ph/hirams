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
        { user: "John Doe", activity: "Added a new record", date: "2025-10-14 10:00 AM" },
        { user: "John Doe", activity: "Updated profile", date: "2025-10-14 10:30 AM" },
      ],
    },
    {
      fullName: "Smith, Jane S.",
      username: "janesmith",
      email: "janesmith@gmail.com",
      status: "Inactive",
      activityLogs: [
        { user: "Jane Smith", activity: "Deleted a record", date: "2025-10-13 09:20 AM" },
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
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(filteredUsers.map((u) => u.username));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleDeleteUser = (username) => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setUsers(users.filter((u) => u.username !== username));
        setSelectedUsers((prev) => prev.filter((u) => u !== username));
        Swal.fire("Deleted!", "User has been deleted successfully.", "success");
      }
    });
  };

  const handleDeleteSelectedUsers = () => {
    if (selectedUsers.length === 0) return;
    setUsers(users.filter((u) => !selectedUsers.includes(u.username)));
    setSelectedUsers([]);
    Swal.fire("Deleted!", "Selected users have been deleted successfully.", "success");
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-l-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">Supplier Management</h1>
      </header>



      {/* Modals */}
      <AddSupplierModal open={openAddModal} handleClose={() => setOpenAddModal(false)} />
      <EditSupplierModal open={openEditModal} handleClose={() => setOpenEditModal(false)} user={selectedUser} />
    </div>
  );
}

export default Supplier;
