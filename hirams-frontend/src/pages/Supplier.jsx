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
import ContactsIcon from "@mui/icons-material/Contacts";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import Swal from "sweetalert2";

import AddSupplierModal from "../components/ui/modals/admin/supplier/AddSupplierModal";
import EditSupplierModal from "../components/ui/modals/admin/supplier/EditSupplierModal";
import ContactModal from "../components/ui/modals/admin/supplier/ContactModal";
import BankModal from "../components/ui/modals/admin/supplier/BankModal";

function Supplier() {
  const [users, setUsers] = useState([
    {
      nSupplierId: 1,
      fullName: "Doe, John D.",
      username: "johndoe",
      email: "johndoe@gmail.com",
      address: "123 Main St, Quezon City",
      vat: "VAT",
      ewt: "",
      strNumber: "09171234567",
      strPosition: "Manager",
      strDepartment: "Procurement",
      bankInfo: {
        strBankName: "BDO",
        strAccountName: "John D. Doe",
        strAccountNumber: "1234-5678-9012",
      },
    },
    {
      nSupplierId: 2,
      fullName: "",
      username: "janesmith",
      email: "janesmith@yahoo.com",
      address: "456 Park Ave, Makati City",
      vat: "",
      ewt: "EWT",
      strNumber: "",
      strPosition: "",
      strDepartment: "",
      bankInfo: {
        strBankName: "",
        strAccountName: "",
        strAccountNumber: "",
      },
    },
    {
      nSupplierId: 3,
      fullName: "Lee, Michael",
      username: "mlee",
      email: "mlee@outlook.com",
      address: "789 Green St, Pasig City",
      vat: "VAT",
      ewt: "",
      strNumber: "09991234567",
      strPosition: "Director",
      strDepartment: "Operations",
      bankInfo: {
        strBankName: "Metrobank",
        strAccountName: "Michael Lee",
        strAccountNumber: "3456-7890-1234",
      },
    },
    {
      nSupplierId: 4,
      fullName: "Reyes, Anna B.",
      username: "areyes",
      email: "anna.reyes@gmail.com",
      address: "Lot 23, Block 5, Dasmariñas, Cavite",
      vat: "",
      ewt: "",
      strNumber: "09181239876",
      strPosition: "Finance Officer",
      strDepartment: "Accounting",
      bankInfo: {
        strBankName: "UnionBank",
        strAccountName: "Anna B. Reyes",
        strAccountNumber: "8901-2345-6789",
      },
    },
    {
      nSupplierId: 5,
      fullName: "Garcia, Pedro C.",
      username: "pgarcia",
      email: "pedro.garcia@yahoo.com",
      address: "123 Mabini St, Batangas City",
      vat: "VAT",
      ewt: "EWT",
      strNumber: "+639203456789",
      strPosition: "Owner",
      strDepartment: "Management",
      bankInfo: {
        strBankName: "Landbank",
        strAccountName: "Pedro C. Garcia",
        strAccountNumber: "6789-0123-4567",
      },
    },
  ]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [openBankModal, setOpenBankModal] = useState(false);

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
    Swal.fire(
      "Deleted!",
      "Selected users have been deleted successfully.",
      "success"
    );
  };

  const isAllSelected =
    filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isIndeterminate =
    selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
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
                Add Supplier
              </span>
              {/* Show only icon on xs */}
              <span className="flex sm:hidden">
                <AddIcon fontSize="small" />
              </span>
            </Button>

            {/* Delete Selected Button */}
            <Button
              variant="contained"
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
                px: { xs: 1, sm: 2 },
                minWidth: { xs: 0, sm: "auto" },
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span className="hidden sm:flex items-center gap-1">
                <DeleteIcon fontSize="small" />
                Delete Selected
              </span>
              <span className="flex sm:hidden">
                <DeleteIcon fontSize="small" />
              </span>
            </Button>
          </div>
        </section>

        {/* Table */}
        <section className="bg-white p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[80%]">
              <TableContainer component={Paper} elevation={0}>
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
                        <strong>Name</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Username</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Address</strong>
                      </TableCell>
                      <TableCell>
                        <strong>VAT</strong>
                      </TableCell>
                      <TableCell>
                        <strong>EWT</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Action</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
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
                          <TableCell>{user.address || "N/A"}</TableCell>

                          {/* ✅ VAT column */}
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                user.vat === "VAT"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-red-600"
                              }`}
                            >
                              {user.vat ? user.vat : "NVAT"}
                            </span>
                          </TableCell>

                          {/* ✅ EWT column */}
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                user.ewt === "EWT"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-red-600"
                              }`}
                            >
                              {user.ewt ? user.ewt : "N/A"}
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
                              <ContactsIcon
                                className="cursor-pointer text-gray-600 hover:text-blue-600 transition"
                                fontSize="small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenContactModal(true);
                                }}
                              />
                              <AccountBalanceIcon
                                className="cursor-pointer hover:text-cyan-600"
                                fontSize="small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenBankModal(true);
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
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
      <AddSupplierModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
      />
      <EditSupplierModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        supplier={selectedUser}
        onUpdate={(updatedSupplier) => {
          setUsers((prev) =>
            prev.map((u) =>
              u.nSupplierId === updatedSupplier.nSupplierId
                ? updatedSupplier
                : u
            )
          );
        }}
      />

      <ContactModal
        open={openContactModal}
        handleClose={() => setOpenContactModal(false)}
        contact={{
          nSupplierId: selectedUser?.nSupplierId || 1,
          strName: selectedUser?.fullName || "N/A",
          strNumber: selectedUser?.strNumber || "N/A",
          strPosition: selectedUser?.strPosition || "N/A",
          strDepartment: selectedUser?.strDepartment || "N/A",
        }}
        onUpdate={(updatedContact) =>
          console.log("Updated Contact:", updatedContact)
        }
      />
      <BankModal
        open={openBankModal}
        handleClose={() => setOpenBankModal(false)}
        supplier={selectedUser}
      />
    </div>
  );
}

export default Supplier;
