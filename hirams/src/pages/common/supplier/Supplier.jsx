import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import {
  Add,
  Edit,
  Delete,
  Contacts,
  AccountBalance,
  HowToReg,
  PersonOff,
  PersonAdd,
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

// ── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = "selectedSupplierStatusCode";
const DEBOUNCE_MS = 300;

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatSupplier(supplier, { vat, ewt }) {
  return {
    nSupplierId: supplier.nSupplierId,
    supplierName: supplier.strSupplierName,
    supplierNickName: supplier.strSupplierNickName,
    supplierTIN: supplier.strTIN,
    address: supplier.strAddress,
    vat: vat?.[supplier.bVAT],
    ewt: ewt?.[supplier.bEWT],
    statusCode: supplier.cStatus,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
function Supplier() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openModal, setOpenModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [entityToDelete, setEntityToDelete] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || "",
  );

  const {
    vat,
    ewt,
    clientstatus,
    loading: mappingLoading,
    userTypes,
  } = useMapping();

  const { isManagement } = getUserRoles(userTypes);
  const location = useLocation();

  // ── Derive stable status keys once mappings are ready ────────────────────
  const statusKeys = useMemo(() => {
    const keys = Object.keys(clientstatus);
    return {
      activeKey: keys[0] ?? "",
      inactiveKey: keys[1] ?? "",
      pendingKey: keys[2] ?? "",
      activeLabel: clientstatus[keys[0]] ?? "",
      inactiveLabel: clientstatus[keys[1]] ?? "",
      pendingLabel: clientstatus[keys[2]] ?? "",
      vatLabel: vat[Object.keys(vat)[1]] || "",
      ewtLabel: ewt[Object.keys(ewt)[1]] || "",
    };
  }, [clientstatus, vat, ewt]);

  const {
    activeKey,
    inactiveKey,
    pendingKey,
    activeLabel,
    inactiveLabel,
    pendingLabel,
    vatLabel,
    ewtLabel,
  } = statusKeys;

  // ── Debounce search input ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Initialise selected status once mappings load ─────────────────────────
  useEffect(() => {
    if (!mappingLoading && activeKey && !sessionStorage.getItem(SESSION_KEY)) {
      setSelectedStatusCode(activeKey);
      sessionStorage.setItem(SESSION_KEY, activeKey);
    }
  }, [mappingLoading, activeKey]);

  // ── Sync status code from sidebar submenu clicks ──────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setSelectedStatusCode(code);
      sessionStorage.setItem(SESSION_KEY, code);
      setPage(0);
    };
    window.addEventListener("supplier_status_changed", handler);
    return () => window.removeEventListener("supplier_status_changed", handler);
  }, []);

  // ── Reset page on status change ───────────────────────────────────────────
  useEffect(() => {
    setPage(0);
  }, [selectedStatusCode]);

  // ── Handle ?add=true query param ──────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") setOpenModal(true);
  }, [location.search]);

  // ── Fetch suppliers ───────────────────────────────────────────────────────
  const fetchSuppliers = useCallback(async () => {
    if (mappingLoading) return;
    setLoading(true);
    try {
      const response = await api.get("suppliers");
      const raw = response.suppliers ?? [];
      const mappings = { vat, ewt };
      setSuppliers(raw.map((s) => formatSupplier(s, mappings)));
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  }, [mappingLoading, vat, ewt]);

  const fetchSuppliersRef = useRef(fetchSuppliers);
  useEffect(() => {
    fetchSuppliersRef.current = fetchSuppliers;
  }, [fetchSuppliers]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // ── React to real-time WebSocket events ───────────────────────────────────
  useEffect(() => {
    const onUpdated = () => fetchSuppliersRef.current();
    const onDeleted = (e) =>
      setSuppliers((prev) =>
        prev.filter((s) => s.nSupplierId !== e.detail?.supplierId),
      );
    window.addEventListener("supplier_data_updated", onUpdated);
    window.addEventListener("supplier_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("supplier_data_updated", onUpdated);
      window.removeEventListener("supplier_data_deleted", onDeleted);
    };
  }, []);

  // ── Filter suppliers by selected status and search ────────────────────────
  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((supplier) => {
        if (selectedStatusCode && supplier.statusCode !== selectedStatusCode)
          return false;
        if (!debouncedSearch.trim()) return true;
        const q = debouncedSearch.toLowerCase();
        return (
          supplier.supplierName?.toLowerCase().includes(q) ||
          supplier.supplierNickName?.toLowerCase().includes(q) ||
          supplier.supplierTIN?.toLowerCase().includes(q) ||
          supplier.address?.toLowerCase().includes(q)
        );
      }),
    [suppliers, selectedStatusCode, debouncedSearch],
  );

  // ── Notify sidebar of status changes ──────────────────────────────────────
  const notifySidebar = useCallback((code) => {
    sessionStorage.setItem(SESSION_KEY, code);
    setSelectedStatusCode(code);
    window.dispatchEvent(
      new CustomEvent("supplier_status_changed", { detail: { code } }),
    );
  }, []);

  // ── Update a single supplier's status via API ─────────────────────────────
  const updateSupplierStatus = useCallback(
    async (status) => {
      if (!selectedSupplier) return;
      await api.patch(`suppliers/${selectedSupplier.nSupplierId}/status`, {
        statusCode: status,
      });
      await fetchSuppliersRef.current();
    },
    [selectedSupplier],
  );

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleAddClick = useCallback(() => {
    setSelectedSupplier(null);
    setOpenModal(true);
  }, []);

  const handleEditClick = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setOpenModal(true);
  }, []);

  const handleInfoClick = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setOpenInfoModal(true);
  }, []);

  const handleDeleteClick = useCallback((supplier) => {
    setEntityToDelete({
      type: "supplier",
      data: {
        id: supplier.nSupplierId,
        supplierName: supplier.supplierName,
        strSupplierName: supplier.supplierName,
      },
    });
    setOpenDeleteModal(true);
  }, []);
  const handleContactsClick = useCallback((supplier) => {
    setSelectedSupplier(supplier); // only core fields now
    setOpenContactModal(true);
  }, []);

  const handleBankClick = useCallback((supplier) => {
    setSelectedSupplier(supplier); // only core fields now
    setOpenBankModal(true);
  }, []);
  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedSupplier(null);
  }, []);

  const handleCloseContactModal = useCallback(
    () => setOpenContactModal(false),
    [],
  );
  const handleCloseBankModal = useCallback(() => setOpenBankModal(false), []);
  const handleCloseInfoModal = useCallback(() => setOpenInfoModal(false), []);
  const handleCloseDeleteModal = useCallback(() => {
    setOpenDeleteModal(false);
    setEntityToDelete(null);
  }, []);

  // ── Table: pagination ─────────────────────────────────────────────────────
  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { key: "supplierName", label: "Name", xs: 2 },
      { key: "supplierNickName", label: "Nickname", xs: 1 },
      { key: "supplierTIN", label: "TIN", align: "center" },
      { key: "address", label: "Address", xs: 2 },
      {
        key: "vat",
        label: "VAT",
        align: "center",
        xs: 0.5,
        render: (value) => (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              value === vatLabel
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
        xs: 0.5,
        render: (value) => (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              value === ewtLabel
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
        xs: 2,
        render: (_, row) => {
          const isActive = row.statusCode === activeKey;
          const isPending = row.statusCode === pendingKey;
          const isInactive = !isActive && !isPending;

          const actions = [
            isActive && (
              <BaseButton
                key="edit"
                icon={<Edit fontSize="small" />}
                tooltip="Edit Supplier"
                actionColor="edit"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(row);
                }}
              />
            ),
            isPending && (
              <BaseButton
                key="approve"
                icon={<HowToReg fontSize="small" />}
                tooltip="Approve Supplier"
                actionColor="approve"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInfoClick(row);
                }}
              />
            ),
            isActive && (
              <BaseButton
                key="deactivate"
                icon={<PersonOff fontSize="small" />}
                tooltip="Deactivate Supplier"
                actionColor="deactivate"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInfoClick(row);
                }}
              />
            ),
            isInactive && (
              <BaseButton
                key="activate"
                icon={<PersonAdd fontSize="small" />}
                tooltip="Activate Supplier"
                actionColor="revert"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInfoClick(row);
                }}
              />
            ),
            !isPending && (
              <BaseButton
                key="contacts"
                icon={<Contacts fontSize="small" />}
                tooltip="Manage Contacts"
                actionColor="apply"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContactsClick(row);
                }}
              />
            ),
            !isPending && (
              <BaseButton
                key="bank"
                icon={<AccountBalance fontSize="small" />}
                tooltip="Manage Bank Info"
                actionColor="markup"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBankClick(row);
                }}
              />
            ),
            !isActive && isManagement && (
              <BaseButton
                key="delete"
                icon={<Delete fontSize="small" />}
                tooltip="Delete Supplier"
                actionColor="delete"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(row);
                }}
              />
            ),
          ].filter(Boolean);

          return (
            <div className="flex items-center justify-center gap-1">
              {actions}
            </div>
          );
        },
      },
    ],
    [
      activeKey,
      pendingKey,
      isManagement,
      vatLabel,
      ewtLabel,
      handleEditClick,
      handleInfoClick,
      handleContactsClick,
      handleBankClick,
      handleDeleteClick,
    ],
  );

  // ── InfoSupplierModal action callbacks ────────────────────────────────────
  const handleApprove = useCallback(async () => {
    await updateSupplierStatus(activeKey);
    notifySidebar(activeKey);
  }, [updateSupplierStatus, activeKey, notifySidebar]);

  const handleActivate = useCallback(async () => {
    await updateSupplierStatus(activeKey);
    notifySidebar(activeKey);
  }, [updateSupplierStatus, activeKey, notifySidebar]);

  const handleDeactivate = useCallback(async () => {
    await updateSupplierStatus(inactiveKey);
    notifySidebar(inactiveKey);
  }, [updateSupplierStatus, inactiveKey, notifySidebar]);

  const handleRedirect = useCallback(
    (label) => {
      const code = Object.keys(clientstatus).find(
        (k) => clientstatus[k] === label,
      );
      if (code) notifySidebar(code);
    },
    [clientstatus, notifySidebar],
  );

  // // ── ContactModal onUpdate handler ─────────────────────────────────────────
  // const handleContactUpdate = useCallback(
  //   (updatedContacts) => {
  //     if (!selectedSupplier || !updatedContacts?.length) return;
  //     const [firstContact] = updatedContacts;
  //     const updatedSupplier = {
  //       ...selectedSupplier,
  //       contacts: updatedContacts,
  //       strName: firstContact.strName || selectedSupplier.strName,
  //       strNumber: firstContact.strNumber || selectedSupplier.strNumber,
  //       strPosition: firstContact.strPosition || selectedSupplier.strPosition,
  //       strDepartment:
  //         firstContact.strDepartment || selectedSupplier.strDepartment,
  //     };
  //     setSuppliers((prev) =>
  //       prev.map((s) =>
  //         s.nSupplierId === updatedSupplier.nSupplierId ? updatedSupplier : s,
  //       ),
  //     );
  //   },
  //   [selectedSupplier],
  // );

  // ── DeleteVerificationModal onSuccess handler ─────────────────────────────
  const handleDeleteSuccess = useCallback(() => {
    if (!entityToDelete?.data) return;
    setSuppliers((prev) =>
      prev.filter((s) => s.nSupplierId !== entityToDelete.data.id),
    );
  }, [entityToDelete]);

  const handleRowClick = useCallback(
    (supplier) => {
      if (supplier.statusCode === activeKey) {
        handleEditClick(supplier);
      } else {
        handleInfoClick(supplier);
      }
    },
    [activeKey, handleEditClick, handleInfoClick],
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageLayout
      title="Suppliers"
      // After
      subtitle={
        selectedStatusCode && clientstatus[selectedStatusCode]
          ? `/ ${clientstatus[selectedStatusCode]}`
          : ""
      }
    >
      {/* ── Toolbar ── */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Supplier"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchSuppliers} />
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

      {/* ── Table ── */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={columns}
          rows={filteredSuppliers}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ── */}
      <SupplierAEModal
        open={openModal}
        handleClose={handleCloseModal}
        supplier={selectedSupplier}
        onSupplierSubmitted={fetchSuppliers}
        activeKey={activeKey}
        pendingKey={pendingKey}
        isManagement={isManagement}
        vatLabel={vatLabel}
        ewtLabel={ewtLabel}
      />

      <ContactModal
        open={openContactModal}
        handleClose={handleCloseContactModal}
        supplier={selectedSupplier}
        supplierId={selectedSupplier?.nSupplierId || null}
        isManagement={isManagement}
      />

      <BankModal
        open={openBankModal}
        handleClose={handleCloseBankModal}
        supplier={selectedSupplier}
        isManagement={isManagement}
      />

      <InfoSupplierModal
        open={openInfoModal}
        handleClose={handleCloseInfoModal}
        supplierData={selectedSupplier}
        onApprove={handleApprove}
        onActive={handleActivate}
        onInactive={handleDeactivate}
        onRedirect={handleRedirect}
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
        onClose={handleCloseDeleteModal}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}

export default Supplier;
