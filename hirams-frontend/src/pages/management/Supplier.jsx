import React, { useState, useEffect } from "react";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
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
        const contact = supplier.contacts[0] || {};
        const bank = supplier.banks[0] || {};

        return {
          nSupplierId: supplier.nSupplierId,
          supplierName: supplier.strSupplierName,
          supplierNickName: supplier.strSupplierNickName,
          supplierTIN: supplier.strTIN,
          username: contact.strName?.toLowerCase().replace(/\s+/g, "") || "",
          email: contact.strEmail || "",
          address: supplier.strAddress,
          vat: supplier.bVAT ? "VAT" : "",
          ewt: supplier.bEWT ? "EWT" : "",
          strName: contact.strName || "",
          strNumber: contact.strNumber || "",
          strPosition: contact.strPosition || "",
          strDepartment: contact.strDepartment || "",
          bankInfo: {
            strBankName: bank.strBankName || "",
            strAccountName: bank.strAccountName || "",
            strAccountNumber: bank.strAccountNumber || "",
          },
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
      (user.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(search.toLowerCase())
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
      text: `Delete supplier ${user.fullName}?`,
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
          Supplier Management
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
              { key: "supplierName", label: "Name" },
              { key: "supplierTIN", label: "TIN Number" },
              { key: "address", label: "Address" },
              {
                key: "vat",
                label: "VAT",
                render: (_, user) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.vat === "VAT"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-red-600"
                    }`}
                  >
                    {user.vat || "NVAT"}
                  </span>
                ),
              },
              {
                key: "ewt",
                label: "EWT",
                render: (_, user) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.ewt === "EWT"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-red-600"
                    }`}
                  >
                    {user.ewt || "N/A"}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Action",
                render: (_, user) => (
                  <div className="flex gap-2 justify-center">
                    <ActionIcons
                      onEdit={() => handleEditClick(user)}
                      onDelete={() => handleDeleteUser(user)}
                    />
                    <SupplierIcons
                      onContact={() => {
                        setSelectedUser(user);
                        setOpenContactModal(true);
                      }}
                      onBank={() => {
                        setSelectedUser(user);
                        setOpenBankModal(true);
                      }}
                    />
                  </div>
                ),
              },
            ]}
            rows={filteredUsers.slice(
              page * rowsPerPage,
              page * rowsPerPage + rowsPerPage
            )}
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

      {/* Modals */}
      <AddSupplierModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
      />
      <EditSupplierModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        supplier={selectedUser}
        onUpdate={(updatedSupplier) => {
          setUsers((prev) =>
            prev.map((u) =>
              u.nSupplierId === updatedSupplier.nSupplierId
                ? updatedSupplier
                : u
            )
          );
        }}
      />
      <ContactModal
        open={openContactModal}
        handleClose={() => setOpenContactModal(false)}
        contactList={
          selectedUser
            ? [
                {
                  strName: selectedUser.strName || "N/A",
                  strNumber: selectedUser.strNumber || "N/A",
                  strPosition: selectedUser.strPosition || "N/A",
                  strDepartment: selectedUser.strDepartment || "N/A",
                },
              ]
            : []
        }
        onUpdate={(updatedContacts) => {
          if (!selectedUser) return;
          const updatedUser = {
            ...selectedUser,
            fullName: updatedContacts[0].strName,
            strNumber: updatedContacts[0].strNumber,
            strPosition: updatedContacts[0].strPosition,
            strDepartment: updatedContacts[0].strDepartment,
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
