import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";

import AddCompanyModal from "../components/ui/modals/admin/company/AddCompanyModal";
import EditCompanyModal from "../components/ui/modals/admin/company/EditCompanyModal";

function Company() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      const formatted = data.map((item) => ({
        id: item.nCompanyId,
        name: item.strCompanyName,
        nickname: item.strCompanyNickName,
        tin: item.strTIN,
        address: item.strAddress,
        vat: item.bVAT === 1,
        ewt: item.bEWT === 1,
      }));
      setCompanies(formatted);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.nickname.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event) => {
    const pageCompanies = filteredCompanies.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
    if (event.target.checked) {
      setSelectedIds([
        ...new Set([...selectedIds, ...pageCompanies.map((c) => c.id)]),
      ]);
    } else {
      setSelectedIds(
        selectedIds.filter((id) => !pageCompanies.map((c) => c.id).includes(id))
      );
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleEditClick = (company) => {
    setSelectedCompany(company);
    setOpenEditModal(true);
  };

  const isAllSelected =
    filteredCompanies
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .every((c) => selectedIds.includes(c.id)) &&
    filteredCompanies.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    ).length > 0;

  // ---------- SWEETALERT DELETE WITH CONFIRMATION + SPINNER ----------
  const handleDeleteClick = (id) => {
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
              setCompanies(companies.filter((c) => c.id !== id));
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "The company has been deleted successfully.",
                showConfirmButton: true,
              });
            }, 1000);
          },
        });
      }
    });
  };

  const handleDeleteSelectedClick = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete selected!",
    });

    if (!result.isConfirmed) return;

    // 🔄 Show loading alert
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
          // 🧩 Send DELETE requests for each selected company
          const deletePromises = selectedIds.map((id) =>
            fetch(`http://127.0.0.1:8000/api/companies/${id}`, {
              method: "DELETE",
            })
          );

          // Wait for all deletions to complete
          const results = await Promise.all(deletePromises);
          const allSuccess = results.every((res) => res.ok);

          if (!allSuccess) throw new Error("Some deletions failed.");

          // ✅ Update local state
          setCompanies((prev) =>
            prev.filter((c) => !selectedIds.includes(c.id))
          );
          setSelectedIds([]);

          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Selected companies have been successfully deleted.",
            showConfirmButton: true,
          }).then(() => {
            // 🔄 Reload page if you prefer to sync with backend
            window.location.reload();
          });
        } catch (error) {
          console.error("❌ Delete error:", error);
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: "There was an issue deleting the selected companies. Please try again.",
          });
        }
      },
    });
  };

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Company Management
        </h1>
      </header>

      <div className="space-y-2">
        {/* Search + Buttons */}
        <section className="p-2 rounded-lg flex justify-between items-center">
          <TextField
            label="Search Company"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: "25ch" }}
          />

          <div className="flex items-center ml-2 gap-1">
            {/* Add Company Button */}
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
              {/* sm+: show icon + text */}
              <span className="hidden sm:flex items-center gap-1">
                <AddIcon fontSize="small" />
                Add Company
              </span>
              {/* xs: icon only */}
              <span className="flex sm:hidden">
                <AddIcon fontSize="small" />
              </span>
            </Button>

            {/* Delete Selected Button */}
            <Button
              variant="contained"
              onClick={handleDeleteSelectedClick}
              disabled={selectedIds.length === 0}
              sx={{
                textTransform: "none",
                bgcolor: selectedIds.length > 0 ? "#d32f2f" : "#ccc",
                "&:hover": {
                  bgcolor: selectedIds.length > 0 ? "#b71c1c" : "#ccc",
                },
                borderRadius: 2,
                fontSize: "0.75rem",
                px: { xs: 1, sm: 2 },
                minWidth: { xs: 0, sm: "auto" },
                display: "flex",
                justifyContent: "center",
              }}
            >
              {/* sm+: show icon + text */}
              <span className="hidden sm:flex items-center gap-1">
                <DeleteIcon fontSize="small" />
                Delete Selected
              </span>
              {/* xs: icon only */}
              <span className="flex sm:hidden">
                <DeleteIcon fontSize="small" />
              </span>
            </Button>
          </div>
        </section>

        {/* ✅ Table Section */}
        <section className="bg-white p-4">
          <div className="overflow-x-auto">
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={selectedIds.length > 0 && !isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>
                      <strong>Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nickname</strong>
                    </TableCell>
                    <TableCell>
                      <strong>TIN No.</strong>
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
                  {filteredCompanies
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((company) => (
                      <TableRow key={company.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(company.id)}
                            onChange={() => handleSelectRow(company.id)}
                          />
                        </TableCell>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.nickname}</TableCell>
                        <TableCell>{company.tin || "N/A"}</TableCell>
                        <TableCell>{company.address || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              company.vat
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {company.vat ? "VAT" : "None"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              company.ewt
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {company.ewt ? "EWT" : "None"}
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex justify-center space-x-3 text-gray-600">
                            <EditIcon
                              className="cursor-pointer hover:text-blue-600"
                              fontSize="small"
                              onClick={() => handleEditClick(company)}
                            />
                            <DeleteIcon
                              className="cursor-pointer hover:text-red-600"
                              fontSize="small"
                              onClick={() => handleDeleteClick(company.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </section>
        <TablePagination
  component="div"
  count={filteredCompanies.length}
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
    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
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

      <AddCompanyModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onCompanyAdded={fetchCompanies} // 🔄 re-fetch table data only
      />

      <EditCompanyModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        company={selectedCompany}
        onCompanyUpdated={fetchCompanies} // ✅ same idea
      />
    </div>
  );
}

export default Company;
