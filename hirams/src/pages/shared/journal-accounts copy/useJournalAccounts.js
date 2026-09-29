import { useState, useEffect, useMemo } from "react";
import JournalAccountAPI from "../../../api/endpoints/journal-account.api.js";
import JevEntriesAPI from "../../../api/endpoints/jev-entries.api.js";
import useKeysLabels from "../../../hooks/useKeysLabels.js";
import { withSpinner } from "../../../utils/helpers/swal.jsx";
// ── Main Hook ─────────────────────────────────────────────────────────────
export default function useJournalAccounts() {
  // Table / Search State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Data State
  const [journalAccounts, setJournalAccounts] = useState([]);
  const [jevEntries, setJevEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  // Flash Import Modals
  const [flashImportOpen, setFlashImportOpen] = useState(false);
  const [flashImportTarget, setFlashImportTarget] = useState(null);
  const [flashImportSupplierOpen, setFlashImportSupplierOpen] = useState(false);
  const [flashImportSupplierTarget, setFlashImportSupplierTarget] =
    useState(null);

  // Account Report panel (view the accounts linked to one account)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  // Tree Expand State
  const [expandedAccountIds, setExpandedAccountIds] = useState(new Set());

  // Mappings
  const {
    // ─── JEV Raw ───
    jevDisbursementVoucherKey,
    jevReceivedPurchasesKey,
    jevDeliveredItemsKey,
    jevSalesInvoiceKey,
    jevCollectionKey,
    jevActiveKey,
    jevCancelledKey,
    jevPendingKey,
    // ─── JEV Labels ───
    jevDisbursementVoucherLabel,
    jevReceivedPurchasesLabel,
    jevDeliveredItemsLabel,
    jevSalesInvoiceLabel,
    jevCollectionLabel,
    jevActiveLabel,
    jevCancelledLabel,
    jevPendingLabel,
    jev_types,
    loading: mappingLoading,
  } = useKeysLabels();

  // ─── JEV key → label pairs (Account Report panel) ──────────────────────
  // jev.jev.cJEVLinkType carries the raw key (V / R / D / S / C), the pair
  // gives the matching label to display on each entry.
  const jevTypeOptions = [
    { key: jevDisbursementVoucherKey, label: jevDisbursementVoucherLabel },
    { key: jevReceivedPurchasesKey, label: jevReceivedPurchasesLabel },
    { key: jevDeliveredItemsKey, label: jevDeliveredItemsLabel },
    { key: jevSalesInvoiceKey, label: jevSalesInvoiceLabel },
    { key: jevCollectionKey, label: jevCollectionLabel },
  ];
  const jevStatusOptions = [
    { key: jevActiveKey, label: jevActiveLabel },
    { key: jevCancelledKey, label: jevCancelledLabel },
    { key: jevPendingKey, label: jevPendingLabel },
  ];

  // ── API Fetch ──────────────────────────────────────────────────────────
  const fetchJournalAccounts = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await JournalAccountAPI.getAll();
      const journalAccountsArray = response.data || response || [];

      const formatted = journalAccountsArray.map((account) => ({
        ...account,
        id: account.nJournalAccountId,
        accountName: account.display_name,
      }));

      setJournalAccounts(formatted);
    } catch (error) {
      console.error("Error fetching journal accounts:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // JEV entries feed the Account Report panel (linked-account activity)
  const fetchJevEntries = async () => {
    try {
      const response = await JevEntriesAPI.getAll();
      setJevEntries(response.data || response || []);
    } catch (error) {
      console.error("Error fetching JEV entries:", error);
    }
  };
  const handleMoveAccount = async (accountId, newParentId) => {
    try {
      // Spinner covers the move + refetch so the drag shows feedback
      await withSpinner("Account", async () => {
        await JournalAccountAPI.move(accountId, newParentId);
        // open the target first so the moved account is visible when the data lands
        setExpandedAccountIds((prev) => new Set(prev).add(newParentId));
        await fetchJournalAccounts({ silent: true });
      });
    } catch (err) {
      const message = err?.response?.data?.message ?? "Failed to link account.";
      console.error(message);
      // show it in your usual error swal
    }
  };
  const handleUpdated = () => {
    fetchJournalAccounts({ silent: true });
    fetchJevEntries();
  };
  // add handleMoveAccount to the hook's return object
  // ── Initial Load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchJournalAccounts();
    fetchJevEntries();
  }, []);

  // ── Real-time (listens to events dispatched globally by RealtimeProvider
  // via journalAccountChannel.js + journalEntryChannel.js — no direct echo
  // subscription needed here) ──
  useEffect(() => {
    const handleDeleted = (e) => {
      const { journalAccountId } = e.detail || {};
      setJournalAccounts((prev) =>
        prev.filter((a) => a.id !== journalAccountId),
      );
    };

    const handleUpdated = () => {
      fetchJournalAccounts({ silent: true }); // ✅ silent
      fetchJevEntries();
    };

    window.addEventListener("journal_account_data_deleted", handleDeleted);
    window.addEventListener("journal_account_data_updated", handleUpdated);
    // JEV entries change → the Account Report panel must stay in sync
    window.addEventListener("jev_entry_data_updated", handleUpdated);
    window.addEventListener("jev_entry_data_deleted", handleUpdated);

    return () => {
      window.removeEventListener("journal_account_data_deleted", handleDeleted);
      window.removeEventListener("journal_account_data_updated", handleUpdated);
      window.removeEventListener("jev_entry_data_updated", handleUpdated);
      window.removeEventListener("jev_entry_data_deleted", handleUpdated);
    };
  }, []);
  // ── Computed Values ───────────────────────────────────────────────────
  const filteredJournalAccounts = useMemo(() => {
    const searchLower = search.toLowerCase();
    return journalAccounts.filter((account) =>
      account.accountName?.toLowerCase().includes(searchLower),
    );
  }, [journalAccounts, search]);

  const accountTree = useMemo(() => {
    // parents in the FULL list, not just the filtered one
    const parentIds = new Set(
      journalAccounts.map((a) => a.nParentAccountId).filter(Boolean),
    );

    const byId = {};
    filteredJournalAccounts.forEach((a) => {
      byId[a.id] = { ...a, children: [], hasLinked: parentIds.has(a.id) };
    });

    const roots = [];
    filteredJournalAccounts.forEach((a) => {
      const parentNode = a.nParentAccountId ? byId[a.nParentAccountId] : null;
      if (parentNode) parentNode.children.push(byId[a.id]);
      else roots.push(byId[a.id]);
    });

    return roots;
  }, [filteredJournalAccounts, journalAccounts]);
  // ── Actions ───────────────────────────────────────────────────────────
  const toggleExpanded = (id) => {
    setExpandedAccountIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const collectParentIds = (nodes) =>
    nodes.flatMap((n) =>
      n.children.length ? [n.id, ...collectParentIds(n.children)] : [],
    );

  const expandAll = () =>
    setExpandedAccountIds(new Set(collectParentIds(accountTree)));

  const collapseAll = () => setExpandedAccountIds(new Set());
  const handleAdd = () => {
    setSelectedAccount(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleAddChild = (parentAccount) => {
    setSelectedAccount({ nParentAccountId: parentAccount.id });
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedAccount(row);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Accounts that already carry JEV entries are never deletable — the API
  // rejects them too, this just stops the confirm dialog from opening.
  const entryAccountIds = useMemo(
    () => new Set(jevEntries.map((e) => e?.nJournalAccountId)),
    [jevEntries],
  );

  const handleDelete = (id, accountName) => {
    if (entryAccountIds.has(id)) return;
    setEntityToDelete({
      type: "journal-account",
      data: { id, name: accountName },
    });
    setOpenDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    if (!entityToDelete?.data) return;
    setJournalAccounts((prev) =>
      prev.filter((a) => a.id !== entityToDelete.data.id),
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleSaveSuccess = () => {
    fetchJournalAccounts({ silent: true });
    handleModalClose();
  };

  const handleFlashImport = (node) => {
    setFlashImportTarget(node);
    setFlashImportOpen(true);
  };

  const handleFlashImportSupplier = (node) => {
    setFlashImportSupplierTarget(node);
    setFlashImportSupplierOpen(true);
  };

  const handleViewReport = (node) => {
    setReportTarget(node);
    setReportOpen(true);
  };

  return {
    // State
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    journalAccounts,
    jevEntries,
    loading,
    isModalOpen,
    selectedAccount,
    modalMode,
    openDeleteModal,
    entityToDelete,
    flashImportOpen,
    flashImportTarget,
    flashImportSupplierOpen,
    flashImportSupplierTarget,
    reportOpen,
    reportTarget,
    expandedAccountIds,
    jev_types,
    jevTypeOptions,
    jevStatusOptions,
    jevActiveKey,
    mappingLoading,

    // Computed
    accountTree,

    // Actions
    fetchJournalAccounts,
    toggleExpanded,
    expandAll,
    collapseAll,
    handleAdd,
    handleAddChild,
    handleEdit,
    handleDelete,
    handleDeleteSuccess,
    handleModalClose,
    handleSaveSuccess,
    handleFlashImport,
    handleFlashImportSupplier,
    handleViewReport,
    setOpenDeleteModal,
    setEntityToDelete,
    setFlashImportOpen,
    setFlashImportTarget,
    setFlashImportSupplierOpen,
    setFlashImportSupplierTarget,
    setReportOpen,
    setReportTarget,
    handleMoveAccount,
  };
}
