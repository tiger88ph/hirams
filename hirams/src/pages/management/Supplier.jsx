import React, { useState, useEffect } from "react";
import CustomTable from "../../components/common/Table";
import CustomPagination from "../../components/common/Pagination";
import CustomSearchField from "../../components/common/SearchField";
import {
  confirmDeleteWithVerification,
  showSwal,
  showSpinner,
} from "../../utils/swal";
import BaseButton from "../../components/common/BaseButton";
import {
  Add,
  Edit,
  Delete,
  Contacts,
  AccountBalance,
} from "@mui/icons-material";
import StatusFilterMenu from "../../components/common/StatusFilterMenu";
import SyncMenu from "../../components/common/Syncmenu";
import SupplierAEModal from "../../components/ui/modals/admin/supplier/SupplierAEModal";
import ContactModal from "../../components/ui/modals/admin/supplier/ContactModal";
import BankModal from "../../components/ui/modals/admin/supplier/BankModal";
import InfoSupplierModal from "../../components/ui/modals/admin/supplier/InfoSupplierModal";
import api from "../../utils/api/api";
import PageLayout from "../../components/common/PageLayout";
import useMapping from "../../utils/mappings/useMapping";
import { useLocation } from "react-router-dom";

function Supplier() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openModal, setOpenModal] = useState(false);
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
    userTypes,
  } = useMapping();

  // -------------------------
  // Status Filter
  // -------------------------
  const activeKey = Object.keys(clientstatus)[0] || "";
  const inactiveKey = Object.keys(clientstatus)[1] || "";
  const pendingKey = Object.keys(clientstatus)[2] || "";
  const keys = Object.keys(userTypes);

  // array of the valid management roles
  const managementKey = [keys[1], keys[4]];
  const vatKey = Object.keys(vat)[1] || "";
  const ewtKey = Object.keys(ewt)[1] || "";

  const activeLabel = clientstatus[activeKey] || "";
  const inactiveLabel = clientstatus[inactiveKey] || "";
  const pendingLabel = clientstatus[pendingKey] || "";
  const vatLabel = vat[vatKey] || "";
  const ewtLabel = ewt[ewtKey] || "";
  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;
  const isManagement = userType ? managementKey.includes(userType) : true;

  // -----------------------------------------------------
  // FILTER MENU — default to Active
  // -----------------------------------------------------
  const [filterStatus, setFilterStatus] = useState("");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      setOpenModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!mappingLoading && activeKey) {
      setFilterStatus(activeLabel);
    }
  }, [mappingLoading, clientstatus]);

  // -------------------------
  // Fetch Suppliers
  // -------------------------
  const fetchSuppliers = async () => {
    try {
      const data = await api.get(
        `suppliers?search=${encodeURIComponent(search)}`,
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
          statusCode: supplier.cStatus,
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
    if (!mappingLoading) fetchSuppliers();
  }, [search, mappingLoading, filterStatus]);

  // -------------------------
  // Apply filter
  // -------------------------
  const filteredSuppliers = suppliers.filter((supplier) => {
    const statusKey = Object.keys(clientstatus).find(
      (key) => clientstatus[key] === filterStatus,
    );
    return !statusKey || supplier.statusCode === statusKey;
  });

  // Show Actions column if user is management OR if there are any non-pending rows
  const showActionsColumn =
    isManagement ||
    filteredSuppliers.some((row) => row.statusCode !== pendingKey);

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
  const handleAddClick = () => {
    setSelectedUser(null); // null = Add mode
    setOpenModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user); // user object = Edit mode
    setOpenModal(true);
  };

  const handleInfoClick = (supplier) => {
    setSelectedUser(supplier);
    setOpenInfoModal(true);
  };

  const updateSupplierStatus = async (status) => {
    try {
      await api.patch(`suppliers/${selectedUser.nSupplierId}/status`, {
        statusCode: status,
      });
      await fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, fullName) => {
    await confirmDeleteWithVerification(fullName || "Supplier", async () => {
      try {
        await showSpinner(`Deleting ${fullName || "Supplier"}...`, 1000);
        await api.delete(`suppliers/${id}`);
        setSuppliers((prev) => prev.filter((s) => s.nSupplierId !== id));
        await showSwal(
          "DELETE_SUCCESS",
          {},
          { entity: fullName || "Supplier" },
        );
      } catch (error) {
        console.error(error);
        await showSwal("DELETE_ERROR", {}, { entity: fullName || "Supplier" });
      }
    });
  };

  const handleApprove = () => updateSupplierStatus(activeKey);
  const handleActivate = () => updateSupplierStatus(activeKey);
  const handleDeactivate = () => updateSupplierStatus(inactiveKey);

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
          items={suppliers}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          pendingClient={clientstatus}
        />

        <BaseButton
          label="Add Supplier"
          onClick={handleAddClick}
          variant="contained"
          color="primary"
          icon={<Add />}
          size="medium"
        />
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
            ...(showActionsColumn
              ? [
                  {
                    key: "actions",
                    label: "Actions",
                    align: "center",
                    render: (_, row) => (
                      <div className="flex gap-2 justify-center">
                        {row.statusCode !== pendingKey && isManagement && (
                          <BaseButton
                            icon={<Edit />}
                            tooltip="Edit Supplier"
                            onClick={() => handleEditClick(row)}
                            size="small"
                            color="primary"
                          />
                        )}
                        {row.statusCode !== pendingKey && (
                          <>
                            <BaseButton
                              icon={<Contacts />}
                              tooltip="Manage Contacts"
                              onClick={() => {
                                setSelectedUser(row);
                                setOpenContactModal(true);
                              }}
                              size="small"
                              color="secondary"
                            />
                            <BaseButton
                              icon={<AccountBalance />}
                              tooltip="Manage Bank Info"
                              onClick={() => {
                                setSelectedUser(row);
                                setOpenBankModal(true);
                              }}
                              size="small"
                              color="secondary"
                            />
                          </>
                        )}
                        {row.statusCode !== activeKey && isManagement && (
                          <BaseButton
                            icon={<Delete />}
                            tooltip="Delete Supplier"
                            onClick={() =>
                              handleDelete(row.nSupplierId, row.supplierName)
                            }
                            size="small"
                            color="error"
                          />
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          rows={filteredSuppliers}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onRowClick={handleInfoClick}
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
      <SupplierAEModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        supplier={selectedUser}
        onSupplierSubmitted={fetchSuppliers}
        activeKey={activeKey}
        pendingKey={pendingKey}
        managementKey={managementKey}
        vatLabel={vatLabel}
        ewtLabel={ewtLabel}
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
              u.nSupplierId === updatedUser.nSupplierId ? updatedUser : u,
            ),
          );
        }}
        supplierId={selectedUser?.nSupplierId || null}
        managementKey={managementKey}
      />
      <BankModal
        open={openBankModal}
        handleClose={() => setOpenBankModal(false)}
        supplier={selectedUser}
        managementKey={managementKey}
      />
      <InfoSupplierModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        supplierData={selectedUser}
        onApprove={handleApprove}
        onActive={handleActivate}
        onInactive={handleDeactivate}
        onRedirect={setFilterStatus}
        activeKey={activeKey}
        inactiveKey={inactiveKey}
        pendingKey={pendingKey}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        pendingLabel={pendingLabel}
        managementKey={managementKey}
      />
    </PageLayout>
  );
}

export default Supplier;