import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";

import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import { AddButton, ActionIcons } from "../../components/common/Buttons";

import AddCompanyModal from "../../components/ui/modals/admin/company/AddCompanyModal";
import EditCompanyModal from "../../components/ui/modals/admin/company/EditCompanyModal";
import PageLayout from "../../components/common/PageLayout";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";

function Company() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

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
        vat: item.bVAT ? "VAT" : "NVAT",
        ewt: item.bEWT ? "EWT" : "N/A",
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
    <PageLayout title={HEADER_TITLES.COMPANY}>
      {/* Search + Add */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Company"
            value={search}
            onChange={setSearch}
          />
        </div>
        <AddButton onClick={() => setOpenAddModal(true)} label="Add Company" />
      </section>

      {/* Company Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "name", label: TABLE_HEADERS.COMPANY.NAME },
            {
              key: "nickname",
              label: TABLE_HEADERS.COMPANY.NICKNAME,
              align: "center",
            },
            { key: "tin", label: TABLE_HEADERS.COMPANY.TIN, align: "center" },
            { key: "address", label: TABLE_HEADERS.COMPANY.ADDRESS },
            {
              key: "vat",
              label: TABLE_HEADERS.COMPANY.VAT,
              align: "center",
              render: (value) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value === "VAT"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {value}
                </span>
              ),
            },
            {
              key: "ewt",
              label: TABLE_HEADERS.COMPANY.EWT,
              align: "center",
              render: (value) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value === "EWT"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {value}
                </span>
              ),
            },
            {
              key: "actions",
              label: TABLE_HEADERS.COMPANY.ACTIONS,
              align: "center",
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
          loading={loading}
        />

        <CustomPagination
          count={filteredCompanies.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* Modals */}
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
    </PageLayout>
  );
}

export default Company;
