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
import InfoIcon from "@mui/icons-material/Info";
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

  // ✅ Fetch data from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/companies");
        if (!response.ok) throw new Error("Failed to fetch companies");
        const data = await response.json();

        // ✅ Map backend fields to frontend keys
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
    if (event.target.checked) {
      const newIds = filteredCompanies
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((c) => c.id);
      setSelectedIds([...new Set([...selectedIds, ...newIds])]);
    } else {
      const newIds = filteredCompanies
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((c) => c.id);
      setSelectedIds(selectedIds.filter((id) => !newIds.includes(id)));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setCompanies(companies.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-600">
        Loading companies...
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-l-xl p-3 pt-0">
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Company Management
        </h1>
      </header>

      <div className="space-y-2">
        <section className="p-2 rounded-lg flex justify-between items-center">
          <TextField
            label="Search Company"
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
              Add Company
            </Button>

            <Button
              variant="contained"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={handleDeleteSelected}
              sx={{
                textTransform: "none",
                bgcolor: "#d32f2f",
                "&:hover": { bgcolor: "#b71c1c" },
                borderRadius: 2,
                fontSize: "0.75rem",
                px: 2,
              }}
              disabled={selectedIds.length === 0}
            >
              Delete Selected
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
                        <TableCell>{company.address}</TableCell>
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
                              onClick={() =>
                                setCompanies(
                                  companies.filter((c) => c.id !== company.id)
                                )
                              }
                            />
                            <InfoIcon
                              className="cursor-pointer hover:text-green-600"
                              fontSize="small"
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
            count={filteredCompanies.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </section>
      </div>

      {/* Modals */}
      <AddCompanyModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
      />

      <EditCompanyModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        company={selectedCompany}
      />
    </div>
  );
}

export default Company;
