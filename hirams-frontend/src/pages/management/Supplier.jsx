import React, { useState, useEffect } from "react";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import HEADER_TITLES from "../../utils/header/page";
import TABLE_HEADERS from "../../utils/header/table";
import {
  AddButton,
  ActionIcons,
  SupplierIcons,
} from "../../components/common/Buttons";

import AddSupplierModal from "../../components/ui/modals/admin/supplier/AddSupplierModal";
import EditSupplierModal from "../../components/ui/modals/admin/supplier/EditSupplierModal";
import ContactModal from "../../components/ui/modals/admin/supplier/ContactModal";
import BankModal from "../../components/ui/modals/admin/supplier/BankModal";
import api from "../../utils/api/api";

import Swal from "sweetalert2";

function Supplier() {
  // const [users, setUsers] = useState([
  //   {
  //     nSupplierId: 1,
  //     fullName: "Doe, John D.",
  //     username: "johndoe",
  //     email: "johndoe@gmail.com",
  //     address: "123 Main St, Quezon City",
  //     vat: "VAT",
  //     ewt: "",
  //     strNumber: "09171234567",
  //     strPosition: "Manager",
  //     strDepartment: "Procurement",
  //     bankInfo: {
  //       strBankName: "BDO",
  //       strAccountName: "John D. Doe",
  //       strAccountNumber: "1234-5678-9012",
  //     },
  //   },
  //   // ... other users
  // ]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [openContactModal, setOpenContactModal] = useState(false);
  const [openBankModal, setOpenBankModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const data = await api.get("suppliers"); // your api helper
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
          vat: supplier.bVAT ? "VAT" : "",
          ewt: supplier.bEWT ? "EWT" : "",
          strName: contacts.length > 0 ? contacts[0].strName : "",
          strNumber: contacts.length > 0 ? contacts[0].strNumber : "",
          strPosition: contacts.length > 0 ? contacts[0].strPosition : "",
          strDepartment: contacts.length > 0 ? contacts[0].strDepartment : "",
          contacts: contacts, // Include full contacts array
          bankInfo: banks, // Include full banks array
        };
      });

      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      (user.supplierName || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.supplierNickName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (user.supplierTIN || "").toLowerCase().includes(search.toLowerCase())
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

  const handleDeleteUser = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete supplier ${user.supplierName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
    }).then((result) => {
      if (result.isConfirmed) {
        setUsers((prev) =>
          prev.filter((u) => u.nSupplierId !== user.nSupplierId)
        );
        Swal.fire("Deleted!", "Supplier deleted successfully.", "success");
      }
    });
  };

  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b mb-2 border-gray-300">
        <h1 className="text-sm font-semibold text-gray-800">
          {HEADER_TITLES.SUPPLIER}
        </h1>
      </header>

      <div className="space-y-2">
        {/* Search + Add */}
        <section className="p-2 rounded-lg flex items-center gap-2">
          <CustomSearchField
            label="Search Supplier"
            value={search}
            onChange={setSearch}
          />
          <AddButton
            onClick={() => setOpenAddModal(true)}
            label="Add Supplier"
          />
        </section>

        {/* Table */}
        <section className="bg-white p-2 sm:p-4">
          <CustomTable
            columns={[
              { key: "supplierName", label: TABLE_HEADERS.SUPPLIER.NAME },
              { key: "supplierTIN", label: TABLE_HEADERS.SUPPLIER.TIN },
              { key: "address", label: TABLE_HEADERS.SUPPLIER.ADDRESS },
              {
                key: "vat",
                label: TABLE_HEADERS.SUPPLIER.VAT,
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value === "VAT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {value || "NVAT"}
                  </span>
                ),
              },
              {
                key: "ewt",
                label: TABLE_HEADERS.SUPPLIER.EWT,
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value === "EWT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {value || "N/A"}
                  </span>
                ),
              },
              {
                key: "actions",
                label: TABLE_HEADERS.SUPPLIER.ACTIONS,
                render: (_, row) => (
                  <div className="flex gap-2 justify-center">
                    <ActionIcons
                      onEdit={() => handleEditClick(row)}
                      onDelete={() => handleDeleteUser(row)}
                    />
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
      </div>

      <AddSupplierModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSupplierAdded={fetchSuppliers}
      />

      <EditSupplierModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        supplier={selectedUser}
        onUpdate={fetchSuppliers}
        onSupplierUpdated={fetchSuppliers}
      />

      <ContactModal
        open={openContactModal}
        supplierId={selectedUser?.nSupplierId || null} // ensure safe fallback
        handleClose={() => setOpenContactModal(false)}
        contactList={selectedUser?.contacts || []}
        onUpdate={(updatedContacts) => {
          if (!selectedUser || !updatedContacts?.length) return; // prevent undefined access

          const [firstContact] = updatedContacts;

          const updatedUser = {
            ...selectedUser,
            contacts: updatedContacts, // keep the full updated contact list
            strName: firstContact.strName || selectedUser.strName,
            strNumber: firstContact.strNumber || selectedUser.strNumber,
            strPosition: firstContact.strPosition || selectedUser.strPosition,
            strDepartment:
              firstContact.strDepartment || selectedUser.strDepartment,
          };

          setUsers((prev) =>
            prev.map((u) =>
              u.nSupplierId === updatedUser.nSupplierId ? updatedUser : u
            )
          );
        }}
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
