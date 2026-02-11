import React, { useState, useEffect } from "react";
import api from "../../utils/api/api";
import useMapping from "../../utils/mappings/useMapping";
import { Add, Edit, Delete } from "@mui/icons-material";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import BaseButton from "../../components/common/BaseButton";
import CompanyAEModal from "../../components/ui/modals/admin/company/CompanyAEModal";
import PageLayout from "../../components/common/PageLayout";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import SyncMenu from "../../components/common/Syncmenu";

function Company() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openModal, setOpenModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ use your hook
  const { vat, ewt, loading: mappingLoading } = useMapping();

  const fetchCompanies = async () => {
    try {
      const data = await api.get(
        `companies?search=${encodeURIComponent(search || "")}`,
      );
      const companiesArray = data.companies || [];
      const formatted = companiesArray.map((item) => ({
        id: item.nCompanyId,
        name: item.strCompanyName,
        nickname: item.strCompanyNickName,
        tin: item.strTIN,
        address: item.strAddress,
        vat: vat?.[item.bVAT],
        ewt: ewt?.[item.bEWT],
      }));
      setCompanies(formatted);
    } catch (error) {
      console.error("Error fetching companies:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) {
      fetchCompanies();
    }
  }, [search, mappingLoading]);

  const filteredCompanies = companies;

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddClick = () => {
    setSelectedCompany(null); // null = Add mode
    setOpenModal(true);
  };

  const handleEditClick = (company) => {
    setSelectedCompany(company); // company object = Edit mode
    setOpenModal(true);
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
    <PageLayout title={"Companies"}>
      {/* Search + Add */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Company"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchCompanies()} />
        <BaseButton
          label="Add Company"
          icon={<Add />}
          onClick={handleAddClick}
          color="primary"
          size="medium"
        />
      </section>

      {/* Company Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "name", label: "Name" },
            {
              key: "nickname",
              label: "Nickname",
              align: "center",
            },
            { key: "tin", label: "TIN", align: "center" },
            {
              key: "address",
              label: "Address",
              render: (value) =>
                value && value.length > 30 ? value.slice(0, 30) + "…" : value,
            },
            {
              key: "vat",
              label: "VAT",
              align: "center",
              render: (value) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value === vat[1]
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
              label: "EWT",
              align: "center",
              render: (value) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value == ewt[1]
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
              label: "Actions",
              align: "center",
              render: (_, row) => (
                <div className="flex gap-1 justify-center">
                  {/* Edit Icon */}
                  <BaseButton
                    icon={<Edit fontSize="small" />}
                    onClick={() => handleEditClick(row)}
                    color="info"
                    size="small"
                    tooltip="Edit Company"
                  />
                  {/* Delete Icon */}
                  <BaseButton
                    icon={<Delete fontSize="small" />}
                    onClick={() => handleDeleteClick(row)}
                    color="error"
                    size="small"
                    tooltip="Delete Company"
                  />
                </div>
              ),
            },
          ]}
          rows={filteredCompanies}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={handleEditClick}
        />

        <CustomPagination
          count={filteredCompanies.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* Unified Modal */}
      <CompanyAEModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        company={selectedCompany}
        onCompanySubmitted={fetchCompanies}
      />
    </PageLayout>
  );
}

export default Company;