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
import api from "../utils/api/api";

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../utils/swal";

import AddCompanyModal from "../components/ui/modals/admin/company/AddCompanyModal";
import EditCompanyModal from "../components/ui/modals/admin/company/EditCompanyModal";

function Company() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const data = await api.get("companies"); // data is an object { message, companies }
      const companiesArray = data.companies || []; // safely get the array

      const formatted = companiesArray.map((item) => ({
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
      console.error("Error fetching companies:", error.message);
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

  const handleEditClick = (company) => {
    setSelectedCompany(company);
    setOpenEditModal(true);
  };

  const handleDeleteClick = async (company) => {
    await confirmDeleteWithVerification(company.name, async () => {
      try {
        // Show spinner with delay
        await showSpinner(`Deleting ${company.name}...`, 1000);
        // Perform API delete
        await api.delete(`companies/${company.id}`);
        // Update frontend list
        setCompanies((prev) => prev.filter((c) => c.id !== company.id));
        // Show success message
        await showSwal("DELETE_SUCCESS", {}, { entity: company.name });
      } catch (error) {
        console.error(error);
        // Show error message
        await showSwal("DELETE_ERROR", {}, { entity: company.name });
      }
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
          </div>
        </section>

        {/* ✅ Table Section */}
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
                    .map((company, index) => {
                      const rowNumber = page * rowsPerPage + index + 1; // correct count across pages
                      return (
                        <TableRow key={company.id} hover>
                          <TableCell padding="checkbox">{rowNumber}</TableCell>
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
                                onClick={() => handleDeleteClick(company)}
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
