import React, { useState, useEffect } from "react";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import RowActionsMenu from "../../../components/common/RowActionsMenu";
import {
  Add, Edit, Delete, Contacts, AccountBalance, InfoOutlined,
} from "@mui/icons-material";
import SyncMenu from "../../../components/common/Syncmenu";
import SupplierAEModal from "./modal/SupplierAEModal";
import ContactModal from "./modal/ContactModal";
import BankModal from "./modal/BankModal";
import InfoSupplierModal from "./modal/InfoSupplierModal";
import api from "../../../utils/api/api";
import PageLayout from "../../../components/common/PageLayout";
import useMapping from "../../../utils/mappings/useMapping";
import { useLocation } from "react-router-dom";
import { getUserRoles } from "../../../utils/helpers/roleHelper";
import echo from "../../../utils/echo";

const SESSION_KEY = "selectedSupplierStatusCode";

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
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  const {
    vat, ewt, loading: mappingLoading, clientstatus, userTypes,
  } = useMapping();

  const activeKey   = Object.keys(clientstatus)[0] || "";
  const inactiveKey = Object.keys(clientstatus)[1] || "";
  const pendingKey  = Object.keys(clientstatus)[2] || "";
  const vatKey  = Object.keys(vat)[1]  || "";
  const ewtKey  = Object.keys(ewt)[1]  || "";
  const activeLabel   = clientstatus[activeKey]   || "";
  const inactiveLabel = clientstatus[inactiveKey] || "";
  const pendingLabel  = clientstatus[pendingKey]  || "";
  const vatLabel = vat[vatKey] || "";
  const ewtLabel = ewt[ewtKey] || "";
  const { isManagement } = getUserRoles(userTypes);

  const location = useLocation();

  // ── Selected status code (driven by sidebar) ──────────────────────────────
  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || "",
  );

  // Initialise to first status once mappings are ready
  useEffect(() => {
    if (!mappingLoading && activeKey && !sessionStorage.getItem(SESSION_KEY)) {
      setSelectedStatusCode(activeKey);
      sessionStorage.setItem(SESSION_KEY, activeKey);
    }
  }, [mappingLoading, activeKey]);

  // Listen for sidebar submenu clicks
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (code) {
        setSelectedStatusCode(code);
        sessionStorage.setItem(SESSION_KEY, code);
        setPage(0);
      }
    };
    window.addEventListener("supplier_status_changed", handler);
    return () => window.removeEventListener("supplier_status_changed", handler);
  }, []);

  // Handle ?add=true query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") setOpenModal(true);
  }, [location.search]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.get(
        `suppliers?search=${encodeURIComponent(search)}`,
      );
      const suppliersArray = data.suppliers || [];

      const formatted = suppliersArray.map((supplier) => {
        const contacts = supplier.contacts || [];
        const banks    = supplier.banks    || [];
        return {
          nSupplierId:      supplier.nSupplierId,
          supplierName:     supplier.strSupplierName,
          supplierNickName: supplier.strSupplierNickName,
          supplierTIN:      supplier.strTIN,
          address:          supplier.strAddress,
          vat:              vat?.[supplier.bVAT],
          ewt:              ewt?.[supplier.bEWT],
          statusCode:       supplier.cStatus,
          strName:       contacts.length > 0 ? contacts[0].strName       : "",
          strNumber:     contacts.length > 0 ? contacts[0].strNumber     : "",
          strPosition:   contacts.length > 0 ? contacts[0].strPosition   : "",
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
  }, [search, mappingLoading]);

  useEffect(() => {
    if (mappingLoading) return;
    const channel = echo.channel("suppliers");
    channel.listen(".supplier.updated", (event) => {
      if (event.action === "deleted") {
        setSuppliers((prev) => prev.filter((s) => s.nSupplierId !== event.supplierId));
        return;
      }
      fetchSuppliers();
    });
    return () => { echo.leaveChannel("suppliers"); };
  }, [mappingLoading]);

  // ── Filter by status code then search ────────────────────────────────────
  const filteredSuppliers = suppliers.filter((supplier) => {
    if (selectedStatusCode && supplier.statusCode !== selectedStatusCode) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      supplier.supplierName?.toLowerCase().includes(q) ||
      supplier.supplierNickName?.toLowerCase().includes(q) ||
      supplier.supplierTIN?.toLowerCase().includes(q) ||
      supplier.address?.toLowerCase().includes(q)
    );
  });

  const showActionsColumn =
    isManagement || filteredSuppliers.some((row) => row.statusCode !== pendingKey);

  const handleAddClick  = () => { setSelectedUser(null); setOpenModal(true); };
  const handleEditClick = (user) => { setSelectedUser(user); setOpenModal(true); };
  const handleInfoClick = (supplier) => { setSelectedUser(supplier); setOpenInfoModal(true); };

  const updateSupplierStatus = async (status) => {
    await api.patch(`suppliers/${selectedUser.nSupplierId}/status`, { statusCode: status });
    await fetchSuppliers();
  };

  const notifySidebar = (code) => {
    sessionStorage.setItem(SESSION_KEY, code);
    setSelectedStatusCode(code);
    window.dispatchEvent(new CustomEvent("supplier_status_changed", { detail: { code } }));
  };

  const handleApprove    = async () => { await updateSupplierStatus(activeKey);   notifySidebar(activeKey);   };
  const handleActivate   = async () => { await updateSupplierStatus(activeKey);   notifySidebar(activeKey);   };
  const handleDeactivate = async () => { await updateSupplierStatus(inactiveKey); notifySidebar(inactiveKey); };

  const handleDelete = (id, fullName) => {
    setEntityToDelete({
      type: "supplier",
      data: { id, supplierName: fullName, strSupplierName: fullName },
    });
    setOpenDeleteModal(true);
  };
  const handleDeleteSuccess = async () => {
    if (!entityToDelete?.data) return;
    setSuppliers((prev) => prev.filter((s) => s.nSupplierId !== entityToDelete.data.id));
  };

  return (
    <PageLayout title={"Suppliers"}>
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Supplier"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchSuppliers()} />
        <BaseButton
          label="Supplier"
          tooltip="Add Supplier"
          onClick={handleAddClick}
          variant="contained"
          actionColor="approve"
          icon={<Add />}
          size="medium"
        />
      </section>

      <section className="bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "supplierName",     label: "Name" },
            { key: "supplierNickName", label: "Nickname" },
            { key: "supplierTIN",      label: "TIN",     align: "center" },
            { key: "address",          label: "Address" },
            {
              key: "vat",
              label: "VAT",
              align: "center",
              render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  value === vat?.[1] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {value}
                </span>
              ),
            },
            {
              key: "ewt",
              label: "EWT",
              align: "center",
              render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  value === ewt?.[1] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {value}
                </span>
              ),
            },
            ...(showActionsColumn
              ? [{
                  key: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => {
                    const actions = [
                      row.statusCode !== pendingKey && isManagement && {
                        label: "Edit Supplier",
                        icon: <Edit fontSize="small" />,
                        button: (
                          <BaseButton icon={<Edit />} tooltip="Edit Supplier" actionColor="edit" size="small"
                            onClick={(e) => { e.stopPropagation(); handleEditClick(row); }} />
                        ),
                        onClick: () => handleEditClick(row),
                      },
                      {
                        label: "View Supplier Info",
                        icon: <InfoOutlined fontSize="small" />,
                        button: (
                          <BaseButton icon={<InfoOutlined />} tooltip="View Supplier Info" actionColor="view" size="small"
                            onClick={(e) => { e.stopPropagation(); handleInfoClick(row); }} />
                        ),
                        onClick: () => handleInfoClick(row),
                      },
                      row.statusCode !== pendingKey && {
                        label: "Manage Contacts",
                        icon: <Contacts fontSize="small" />,
                        button: (
                          <BaseButton icon={<Contacts />} tooltip="Manage Contacts" actionColor="apply" size="small"
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setOpenContactModal(true); }} />
                        ),
                        onClick: () => { setSelectedUser(row); setOpenContactModal(true); },
                      },
                      row.statusCode !== pendingKey && {
                        label: "Manage Bank Info",
                        icon: <AccountBalance fontSize="small" />,
                        button: (
                          <BaseButton icon={<AccountBalance />} tooltip="Manage Bank Info" actionColor="markup" size="small"
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setOpenBankModal(true); }} />
                        ),
                        onClick: () => { setSelectedUser(row); setOpenBankModal(true); },
                      },
                      row.statusCode !== activeKey && isManagement && {
                        label: "Delete Supplier",
                        icon: <Delete fontSize="small" />,
                        button: (
                          <BaseButton icon={<Delete />} tooltip="Delete Supplier" actionColor="delete" size="small"
                            onClick={(e) => { e.stopPropagation(); handleDelete(row.nSupplierId, row.supplierName); }} />
                        ),
                        onClick: () => handleDelete(row.nSupplierId, row.supplierName),
                      },
                    ].filter(Boolean);

                    return <RowActionsMenu actions={actions} />;
                  },
                }]
              : []),
          ]}
          rows={filteredSuppliers}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleInfoClick}
        />
      </section>

      <SupplierAEModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        supplier={selectedUser}
        onSupplierSubmitted={fetchSuppliers}
        activeKey={activeKey}
        pendingKey={pendingKey}
        isManagement={isManagement}
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
            strName:       firstContact.strName       || selectedUser.strName,
            strNumber:     firstContact.strNumber     || selectedUser.strNumber,
            strPosition:   firstContact.strPosition   || selectedUser.strPosition,
            strDepartment: firstContact.strDepartment || selectedUser.strDepartment,
          };
          setSuppliers((prev) =>
            prev.map((u) => u.nSupplierId === updatedUser.nSupplierId ? updatedUser : u),
          );
        }}
        supplierId={selectedUser?.nSupplierId || null}
        isManagement={isManagement}
      />
      <BankModal
        open={openBankModal}
        handleClose={() => setOpenBankModal(false)}
        supplier={selectedUser}
        isManagement={isManagement}
      />
      <InfoSupplierModal
        open={openInfoModal}
        handleClose={() => setOpenInfoModal(false)}
        supplierData={selectedUser}
        onApprove={handleApprove}
        onActive={handleActivate}
        onInactive={handleDeactivate}
        onRedirect={(label) => {
          const code = Object.keys(clientstatus).find((k) => clientstatus[k] === label);
          if (code) notifySidebar(code);
        }}
        activeKey={activeKey}
        inactiveKey={inactiveKey}
        pendingKey={pendingKey}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
        pendingLabel={pendingLabel}
        isManagement={isManagement}
      />
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => { setOpenDeleteModal(false); setEntityToDelete(null); }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}

export default Supplier;