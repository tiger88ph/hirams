import React, { useState, useEffect } from "react";
import echo from "../../../utils/echo"; // ← add this
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import { Add, Edit, Delete } from "@mui/icons-material";
import CustomTable from "../../../components/common/Table";
import CustomPagination from "../../../components/common/Pagination";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import CompanyAEModal from "./modal/CompanyAEModal";
import PageLayout from "../../../components/common/PageLayout";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import SyncMenu from "../../../components/common/Syncmenu";

function Company() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);
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
  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("companies");
    channel.listen(".company.updated", (event) => {
      if (event.action === "deleted") {
        // Remove instantly from local state — no refetch needed
        setCompanies((prev) => prev.filter((c) => c.id !== event.companyId));
        return;
      }

      // created or updated — refetch to get fresh data
      fetchCompanies();
    });

    return () => {
      echo.leaveChannel("companies");
    };
  }, [mappingLoading]);
  const filteredCompanies = companies;
  const handleAddClick = () => {
    setSelectedCompany(null); // null = Add mode
    setOpenModal(true);
  };
  const handleEditClick = (company) => {
    setSelectedCompany(company); // company object = Edit mode
    setOpenModal(true);
  };
  const handleDeleteClick = (company) => {
    setEntityToDelete({
      type: "company",
      data: {
        id: company.id,
        name: company.name,
        nickname: company.nickname, // ← add this
      },
    });
    setOpenDeleteModal(true);
  };
  const handleDeleteSuccess = async () => {
    if (!entityToDelete?.data) return;

    // Just refresh the table - the actual delete happens in the modal
    setCompanies((prev) => prev.filter((c) => c.id !== entityToDelete.data.id));
  };

  return (
    <PageLayout title={"Companies"}>
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
          actionColor="approve"
          size="medium"
        />
      </section>
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
      <BaseButton
        icon={<Edit fontSize="small" />}
        onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
        actionColor="edit"
        size="small"
        tooltip="Edit Company"
      />
      <BaseButton
        icon={<Delete fontSize="small" />}
        onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}
        actionColor="delete"
        size="small"
        tooltip="Delete Company"
      />
    </div>
  ),
},
          ]}
          rows={filteredCompanies}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage} // ✅ Add this line
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </section>
      <CompanyAEModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        company={selectedCompany}
        onCompanySubmitted={fetchCompanies}
      />
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setEntityToDelete(null);
        }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}

export default Company;
