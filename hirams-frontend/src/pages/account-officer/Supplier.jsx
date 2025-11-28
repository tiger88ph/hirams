import React, { useState, useEffect } from "react";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import StatusFilterMenu from "../../components/common/StatusFilterMenu";
import { AddButton, SupplierIcons } from "../../components/common/Buttons";
import SyncMenu from "../../components/common/Syncmenu";
import AddSupplierModal from "../../components/ui/modals/admin/supplier/AddSupplierModal";
import EditSupplierModal from "../../components/ui/modals/admin/supplier/EditSupplierModal";
import ContactModal from "../../components/ui/modals/admin/supplier/ContactModal";
import BankModal from "../../components/ui/modals/admin/supplier/BankModal";
import InfoSupplierModal from "../../components/ui/modals/admin/supplier/InfoSupplierModal";
import api from "../../utils/api/api";
import PageLayout from "../../components/common/PageLayout";
import useMapping from "../../utils/mappings/useMapping";
import { useLocation } from "react-router-dom";

function ASupplier() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [openContactModal, setOpenContactModal] = useState(false);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load mappings
  const {
    vat,
    ewt,
    loading: mappingLoading,
    clientstatus,
    activeClient,
    pendingClient,
  } = useMapping();

  // -------------------------
  // Status Filter
  // -------------------------
  const defaultStatus = Object.values(activeClient)[0] || "Active";
  const [filterStatus, setFilterStatus] = useState(defaultStatus);

  // -------------------------
  // Fetch Suppliers
  // -------------------------
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
          statusCode: supplier.cStatus, // ✅ for filtering
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
  // Inside the component
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search); // read query params
    if (params.get("add") === "true") {
      setOpenAddModal(true); // ✅ open AddSupplierModal automatically
    }
  }, [location.search]);

  useEffect(() => {
    if (!mappingLoading) fetchSuppliers();
  }, [search, mappingLoading, filterStatus]);

  // -------------------------
  // Apply filter
  // -------------------------
  const filteredSuppliers = suppliers.filter((supplier) => {
    const statusKey = Object.keys(clientstatus).find(
      (key) => clientstatus[key] === filterStatus
    );
    return !statusKey || supplier.statusCode === statusKey;
  });

  // -------------------------
  // Pagination
  // -------------------------
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // -------------------------
  // Actions
  // -------------------------
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };
  const handleInfoClick = (supplier) => {
    setSelectedUser(supplier);
    setOpenInfoModal(true);
  };
  const handleStatusChange = async (status) => {
    if (!selectedUser) return;

    try {
      await api.patch(`suppliers/${selectedUser.nSupplierId}/status`, {
        statusCode: status,
      });

      // Update local list
      setSuppliers((prev) =>
        prev.map((s) =>
          s.nSupplierId === selectedUser.nSupplierId
            ? { ...s, statusCode: status }
            : s
        )
      );

      setSelectedUser((prev) => ({ ...prev, statusCode: status }));

      // Redirect status filter (same pattern as client)
      setFilterStatus(
        status === "A" ? "Active" : status === "I" ? "Inactive" : "Pending"
      );

      // Close modal
      setOpenInfoModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout title={"Suppliers"}>
      {/* Search + Add + Status Filter */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Supplier"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchSuppliers()} />

        <StatusFilterMenu
          statuses={clientstatus}
          items={suppliers} // ✅ use supplier array with statusCode
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={pendingClient}
        />

        <AddButton onClick={() => setOpenAddModal(true)} label="Add Supplier" />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "supplierName", label: "Name" },
            { key: "supplierNickName", label: "Nickname" },
            { key: "supplierTIN", label: "TIN", align: "center" },
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
                    
                    onContact={() => {
                      setSelectedUser(row);
                      setOpenContactModal(true);
                    }}
                    onBank={() => {
                      setSelectedUser(row);
                      setOpenBankModal(true);
                    }}
                  />
                </div>
              ),
            },
          ]}
          rows={filteredSuppliers}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={handleInfoClick} // ✅ Add this line
        />

        <CustomPagination
          count={filteredSuppliers.length}
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
      <InfoSupplierModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        supplierData={selectedUser}
        onApprove={() => handleStatusChange("A")}
        onActive={() => handleStatusChange("A")}
        onInactive={() => handleStatusChange("I")}
        onRedirect={(status) => setFilterStatus(status)} // 🔥 Add this
      />
    </PageLayout>
  );
}

export default ASupplier;
