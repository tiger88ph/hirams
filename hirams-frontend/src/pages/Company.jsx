import React, { useState, useEffect } from "react";
import api from "../api/api";
import useMapping from "../utils/mappings/useMapping";

import CustomTable from "../components/common/Table";
import CustomPagination from "../components/common/Pagination";
import CustomSearchField from "../components/common/SearchField";
import { AddButton, ActionIcons } from "../components/common/Buttons";

import AddCompanyModal from "../components/ui/modals/admin/company/AddCompanyModal";
import EditCompanyModal from "../components/ui/modals/admin/company/EditCompanyModal";

import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../utils/swal";

function Company() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const { vat, ewt, loading: mappingLoading } = useMapping();

  // 🧩 Fetch companies
  const fetchCompanies = async () => {
    try {
      const data = await api.get("companies");
      const companiesArray = data.companies || [];

      const formatted = companiesArray.map((item) => ({
        id: item.nCompanyId,
        name: item.strCompanyName,
        nickname: item.strCompanyNickName,
        tin: item.strTIN,
        address: item.strAddress,
        vat: vat[item.bVAT] || item.bVAT, // mapped label
        ewt: ewt[item.bEWT] || item.bEWT, // mapped label
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

  // 🔍 Filter companies by name/nickname
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
        await showSpinner(`Deleting ${company.name}...`, 1000);
        await api.delete(`companies/${company.id}`);
        setCompanies((prev) => prev.filter((c) => c.id !== company.id));
        await showSwal("DELETE_SUCCESS", {}, { entity: company.name });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: company.name });
      }
    });
  };

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* 🧭 Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          Company Management
        </h1>
      </header>

      <div className="space-y-0">
        {/* 🔍 Search + ➕ Add Button */}
        <section
          className="p-2 rounded-lg flex items-center gap-2 overflow-hidden whitespace-nowrap"
          style={{
            flexWrap: "nowrap",
            minWidth: 0,
          }}
        >
          {/* Search Field */}
          <div className="flex items-center gap-2 flex-grow">
            <CustomSearchField
              label="Search Company"
              value={search}
              onChange={setSearch}
            />
          </div>

          {/* 🟧 Add Button */}
          <AddButton
            onClick={() => setOpenAddModal(true)}
            label="Add Company"
          />
        </section>

        {/* 🧾 Company Table */}
        <section className="bg-white p-2 sm:p-4">
          <CustomTable
            columns={[
              { key: "name", label: "Name" },
              { key: "nickname", label: "Nickname" },
              { key: "tin", label: "TIN Number" },
              { key: "address", label: "Address" },
              {
                key: "vat",
                label: "VAT",
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {vat[value]} {/* Uses mapping from 1->VAT, 0->NVAT */}
                  </span>
                ),
              },
              {
                key: "ewt",
                label: "EWT",
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {ewt[value]} {/* Uses mapping from 1->EWT, 0->NEWT */}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => (
                  <ActionIcons
                    onEdit={() => handleEditClick(row)}
                    onDelete={() => handleDeleteClick(row)}
                  />
                ),
              },
            ]}
            rows={filteredCompanies}
            page={page}
            rowsPerPage={rowsPerPage}
          />

          {/* 📄 Pagination */}
          <CustomPagination
            count={filteredCompanies.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </section>
      </div>

      {/* 🪟 Modals */}
      <AddCompanyModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onCompanyAdded={fetchCompanies}
      />
      <EditCompanyModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        company={selectedCompany}
        onCompanyUpdated={fetchCompanies}
      />
    </div>
  );
}

export default Company;
