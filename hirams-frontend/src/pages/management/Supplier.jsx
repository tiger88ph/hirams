import React, { useState, useEffect } from "react";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import { AddButton, SupplierIcons } from "../../components/common/Buttons";
import SyncMenu from "../../components/common/Syncmenu";
import AddSupplierModal from "../../components/ui/modals/admin/supplier/AddSupplierModal";
import EditSupplierModal from "../../components/ui/modals/admin/supplier/EditSupplierModal";
import ContactModal from "../../components/ui/modals/admin/supplier/ContactModal";
import BankModal from "../../components/ui/modals/admin/supplier/BankModal";
import api from "../../utils/api/api";
import PageLayout from "../../components/common/PageLayout";
import useMapping from "../../utils/mappings/useMapping";

function Supplier() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [openContactModal, setOpenContactModal] = useState(false);
  const [openBankModal, setOpenBankModal] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load mappings
  const { vat, ewt, loading: mappingLoading } = useMapping();

  const fetchSuppliers = async () => {
    try {
      const data = await api.get(
        `suppliers?search=${encodeURIComponent(search)}`
      );

      const suppliersArray = data.suppliers || [];

      const formatted = suppliersArray.map((supplier) => {
        const contacts = supplier.contacts || [];
        const banks = supplier.banks || [];

        return {
          nSupplierId: supplier.nSupplierId,
          supplierName: supplier.strSupplierName,
          supplierNickName: supplier.strSupplierNickName,
          supplierTIN: supplier.strTIN,
          address: supplier.strAddress,
          vat: vat?.[supplier.bVAT],
          ewt: ewt?.[supplier.bEWT],
          strName: contacts.length > 0 ? contacts[0].strName : "",
          strNumber: contacts.length > 0 ? contacts[0].strNumber : "",
          strPosition: contacts.length > 0 ? contacts[0].strPosition : "",
          strDepartment: contacts.length > 0 ? contacts[0].strDepartment : "",
          contacts,
          bankInfo: banks,
        };
      });

      setSuppliers(formatted);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mappingLoading) {
      fetchSuppliers();
    }
  }, [search, mappingLoading]);

  const filteredUsers = suppliers;

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const handleDeleteUser = async (user) => {
    await confirmDeleteWithVerification(user.supplierName, async () => {
      try {
        await showSpinner(`Deleting ${user.supplierName}...`, 1000);
        await api.delete(`suppliers/${user.nSupplierId}`);
        setUsers((prev) =>
          prev.filter((u) => u.nSupplierId !== user.nSupplierId)
        );
        await showSwal("DELETE_SUCCESS", {}, { entity: user.supplierName });
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: user.supplierName });
      }
    });
  };

  return (
    <PageLayout title={"Suppliers"}>
      {/* Search + Add */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Supplier"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchSuppliers()} />
        <AddButton onClick={() => setOpenAddModal(true)} label="Add Supplier" />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "supplierName", label: "Name" },
            { key: "supplierNickName", label: "Nickname" },
            {
              key: "supplierTIN",
              label: "TIN",
              align: "center",
            },
            { key: "address", label: "Address" },
            {
              key: "vat",
              label: "VAT",
              align: "center",
              render: (value) => (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value === vat?.[1]
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
                    value === ewt?.[1]
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
                <div className="flex gap-2 justify-center">
                  <SupplierIcons
                    onEdit={() => handleEditClick(row)}
                    onContact={() => {
                      setSelectedUser(row);
                      setOpenContactModal(true);
                    }}
                    onBank={() => {
                      setSelectedUser(row);
                      setOpenBankModal(true);
                    }}
                    onDelete={() => handleDeleteUser(row)}
                  />
                </div>
              ),
            },
          ]}
          rows={filteredUsers}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
        />

        <CustomPagination
          count={filteredUsers.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </section>

      {/* Modals */}
      <AddSupplierModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSupplierAdded={fetchSuppliers}
      />

      <EditSupplierModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        supplier={selectedUser}
        onSupplierUpdated={fetchSuppliers}
      />

      <ContactModal
        open={openContactModal}
        handleClose={() => setOpenContactModal(false)}
        supplier={selectedUser}
        onUpdate={(updatedContacts) => {
          if (!selectedUser || !updatedContacts?.length) return;
          const [firstContact] = updatedContacts;
          const updatedUser = {
            ...selectedUser,
            contacts: updatedContacts,
            strName: firstContact.strName || selectedUser.strName,
            strNumber: firstContact.strNumber || selectedUser.strNumber,
            strPosition: firstContact.strPosition || selectedUser.strPosition,
            strDepartment:
              firstContact.strDepartment || selectedUser.strDepartment,
          };
          setSuppliers((prev) =>
            prev.map((u) =>
              u.nSupplierId === updatedUser.nSupplierId ? updatedUser : u
            )
          );
        }}
        supplierId={selectedUser?.nSupplierId || null}
      />

      <BankModal
        open={openBankModal}
        handleClose={() => setOpenBankModal(false)}
        supplier={selectedUser}
      />
    </PageLayout>
  );
}

export default Supplier;
