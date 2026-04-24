import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import PageLayout from "../../../components/common/PageLayout";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import { useNavigate } from "react-router-dom";
import TransactionHistoryModal from "./modal/transaction-drafting/TransactionHistoryModal";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import SyncMenu from "../../../components/common/Syncmenu";
import { getUserRoles } from "../../../utils/helpers/roleHelper";
import { TXN_CACHE_TTL } from "../../../utils/constants/cache";
import echo from "../../../utils/echo";
import ArchiveModal from "../modal/ArchiveModal";
import { History, Visibility, Unarchive } from "@mui/icons-material";
// Add alongside other imports
import { getDueDateColor } from "../../../utils/helpers/dueDateColor";
// ── Cache helpers ─────────────────────────────────────────────────────────────
function getCachedTransactions(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > TXN_CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedTransactions(key, data) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    /* storage full — silently skip */
  }
}

function invalidateCache(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(dateStr, fallback = "—") {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d)) return fallback;
  const base = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  if (d.getHours() || d.getMinutes()) {
    return `${base}, ${d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }
  return base;
}

// =============================================================================
function TransactionArchive() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [archiveModalTransaction, setArchiveModalTransaction] = useState(null);
  const [archiveModalMode, setArchiveModalMode] = useState("unarchive");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const {
    archiveStatus,
    userTypes,
    statusTransaction, // ← add
    itemType, // ← add
    procMode, // ← add
    procSource, // ← add
    loading: mappingLoading,
  } = useMapping();
  const {
    isManagement,
    isProcurement,
    isAccountOfficer,
    isAOTL,
    isProcurementTL,
  } = getUserRoles(userTypes);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const userId = user?.nUserId;

  // ── Archive status keys (for client-side filtering only) ─────────────────
  const { archivedKey, lostKey } = useMemo(() => {
    const keys = Object.keys(archiveStatus || {});
    return {
      archivedKey: keys[0] ?? "",
      lostKey: keys[1] ?? "",
    };
  }, [archiveStatus]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Cache key ─────────────────────────────────────────────────────────────
  const cacheKey = `txn_archive_cache_${userId}_${
    isManagement ? "mgmt" : isProcurement ? "proc" : isAOTL ? "aotl" : "ao"
  }`;

  // ── Fetch (both archived + lost in one call, filtered client-side) ────────
  const fetchTransactions = useCallback(
    async (opts = {}) => {
      const { silent = false, bustCache = false } = opts;

      if (bustCache) invalidateCache(cacheKey);

      if (!silent && !bustCache) {
        const cached = getCachedTransactions(cacheKey);
        if (cached) {
          setTransactions(cached);
          setLoading(false);
          setInitialLoading(false);
          fetchTransactions({ silent: true });
          return;
        }
      }

      setLoading(true);

      try {
        let list = [];

        if (isManagement) {
          const res = await api.get("transactions/archive");
          list = res.transactions || [];
        } else if (isProcurement) {
          const res = await api.get(
            `transactions/archive/procurement?nUserId=${userId}&isProcTL=${isProcurementTL ? 1 : 0}`,
          );
          list = res.transactions || [];
        } else {
          const res = await api.get(
            `transactions/archive/account_officer?nUserId=${userId}&isAOTL=${isAOTL ? 1 : 0}`,
          );
          list = res.transactions || [];
        }

        const formatted = list.map((txn, idx) => {
          const statusCode = txn.current_status ?? txn.latest_history?.nStatus;
          const prevCode = txn.previous_status ?? null; // ← ADD

          return {
            ...txn,
            id: txn.nTransactionId ?? `txn-archive-${idx}`,
            transactionId: txn.strCode || "--",
            transactionName: txn.strTitle || "--",
            date: formatDate(txn.dtDocSubmission, "—"),
            status: (archiveStatus || {})[statusCode],
            status_code: statusCode,
            previous_status_code: prevCode, // ← ADD
            previous_status_label: (statusTransaction || {})[prevCode] ?? "--", // ← ADD
            companyName: txn.company?.strCompanyNickName || "",
            clientName: txn.client?.strClientNickName || "",
            createdBy: txn.created_by || "--",
            creator_id: txn.creator_id ?? null,
            aoName: txn.user ? `${txn.user.strNickName}`.trim() : "",
            aoUserId: txn.nAssignedAO || txn.user?.nUserId,
            archivedAt: formatDate(txn.dtArchivedAt, "—"),
          };
        });

        setTransactions(formatted);
        setCachedTransactions(cacheKey, formatted);
      } catch (err) {
        console.error("Error fetching archived transactions:", err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [isManagement, isProcurement, isAOTL, userId, archiveStatus, cacheKey],
  );

  const fetchRef = useRef(fetchTransactions);
  useEffect(() => {
    fetchRef.current = fetchTransactions;
  }, [fetchTransactions]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!mappingLoading && !hasFetched.current) {
      hasFetched.current = true;
      fetchTransactions();
    }
  }, [mappingLoading, fetchTransactions]);

  // ── Echo real-time subscription ───────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("transactions");

    channel.listen(".transaction.updated", (event) => {
      if (event.action === "deleted") {
        setTransactions((prev) =>
          prev.filter(
            (t) => (t.nTransactionId ?? t.id) !== event.transactionId,
          ),
        );
        invalidateCache(cacheKey);
        return;
      }
      fetchRef.current({ silent: true, bustCache: true });
    });

    return () => {
      echo.leaveChannel("transactions");
    };
  }, [mappingLoading, cacheKey]);

  useEffect(() => {
    const onUpdated = () => fetchRef.current({ silent: true, bustCache: true });
    const onDeleted = (e) => {
      setTransactions((prev) =>
        prev.filter((t) => t.id !== e.detail?.transactionId),
      );
      invalidateCache(cacheKey);
    };
    window.addEventListener("txn_data_updated", onUpdated);
    window.addEventListener("txn_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("txn_data_updated", onUpdated);
      window.removeEventListener("txn_data_deleted", onDeleted);
    };
  }, [cacheKey]);

  // ── Filtered transactions ─────────────────────────────────────────────────
  // Shows all archive-status rows (archivedKey + lostKey), search only.
  const filteredTransactions = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return transactions.filter((t) => {
      const matchesSearch =
        !searchLower ||
        t.transactionId?.toLowerCase().includes(searchLower) ||
        t.transactionName?.toLowerCase().includes(searchLower) ||
        t.clientName?.toLowerCase().includes(searchLower) ||
        t.companyName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
      const txnCode = String(t.status_code ?? "");
      const isArchived = archivedKey && txnCode === String(archivedKey);
      const isLost = lostKey && txnCode === String(lostKey);
      return isArchived || isLost;
    });
  }, [transactions, debouncedSearch, archivedKey, lostKey]);

  const handleRowClick = useCallback(
    (row) => {
      const statusCode = String(row.status_code ?? "");
      navigate("/transaction-canvas", {
        state: {
          transactionId: row.id,
          transactionCode: row.transactionId,
          transaction: row,
          currentUserId: userId,
          isArchiveView: true,

          selectedStatusCode: statusCode,
          draftKey: statusCode, // matches selectedStatusCode → triggers limitedContent
          finalizeKey: "",
          finalizeVerificationKey: "",
          priceApprovedKey: "",
          procPriceApprovedKey: "",
          // Pass mappings so TransactionDetails can render labels properly
          statusTransaction,
          itemType,
          procMode,
          procSource,
        },
      });
    },
    [navigate, userId, statusTransaction, itemType, procMode, procSource],
  );
  // ── Derive label for the dynamic timestamp column header ─────────────────
  // All tab → "Archived / Lost At"   |   Lost tab → "Lost At"

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { key: "transactionId", label: "Code", xs: 1 },
      { key: "transactionName", label: "Transaction", xs: 2 },
      { key: "clientName", label: "Client" },
      { key: "companyName", label: "Company" },
      {
        key: "date",
        label: "Submission",
        align: "center",
        xs: 2,  
        render: (_, row) => {
          const color = getDueDateColor(row.dtDocSubmission); // ← ADD
          return (
            <span
              style={{
                color: color ?? "inherit", // ← ADD
                fontWeight: color ? 600 : 400, // ← ADD
              }}
            >
              {row.date}
            </span>
          );
        },
      },
      { key: "createdBy", label: "Created By" },
      {
        key: "previous_status_label", // ← ADD
        label: "Previous",
        align: "center",
      },
      { key: "status", label: "Status", align: "center" },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        xs: 2,
        render: (_, row) => (
          <div className="flex justify-center gap-0">
            <BaseButton
              icon={<Visibility />}
              tooltip="View Transaction"
              size="small"
              actionColor="view"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row);
              }}
            />
            <BaseButton
              icon={<Unarchive />}
              tooltip="Unarchive Transaction"
              size="small"
              actionColor="revert"
              onClick={(e) => {
                e.stopPropagation();
                setArchiveModalTransaction(row);
                setArchiveModalMode("unarchive");
                setIsArchiveModalOpen(true);
              }}
            />
            {isManagement && (
              <BaseButton
                icon={<History />}
                tooltip="View Transaction History"
                size="small"
                actionColor="deactivate"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsHistoryModalOpen(true);
                }}
              />
            )}
          </div>
        ),
      },
    ],
    [isManagement, handleRowClick],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageLayout title="Transaction Archive" >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchTransactions({ bustCache: true })} />
      </section>

      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={columns}
          rows={filteredTransactions}
          page={page}
          loading={initialLoading || loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ── */}
      {isManagement && isHistoryModalOpen && selectedTransaction && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          transactionId={selectedTransaction.id}
          transactionCode={selectedTransaction.transactionId}
        />
      )}

      {isArchiveModalOpen && archiveModalTransaction && (
        <ArchiveModal
          open={isArchiveModalOpen}
          onClose={() => {
            setIsArchiveModalOpen(false);
            setArchiveModalTransaction(null);
          }}
          transaction={archiveModalTransaction}
          transactionId={archiveModalTransaction.id}
          transactionCode={archiveModalTransaction.transactionId}
          mode={archiveModalMode}
          archiveStatus={archiveStatus}
          onSuccess={() => {
            setIsArchiveModalOpen(false);
            setArchiveModalTransaction(null);
            fetchTransactions({ bustCache: true });
          }}
        />
      )}
    </PageLayout>
  );
}

export default TransactionArchive;
