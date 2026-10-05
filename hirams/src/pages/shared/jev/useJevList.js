import { useCallback, useEffect, useMemo, useState } from "react";
import JevAPI from "../../../api/endpoints/jev.api.js";
import useKeysLabels from "../../../hooks/useKeysLabels.js";
import { fmtPHP } from "../../../utils/formatters/formatter.js";
import { fmtDate, fmtDateTime } from "../../../utils/helpers/timeZone.js";
import { getItem, setItem } from "../../../utils/storage/localStorage.js";

// The sidebar owns the picked JEV type: JevNav writes it here and announces
// every change with a "jev_type_changed" event — the same contract the
// Voucher / Client sections use for their status codes.
const SESSION_KEY = "selectedJevTypeCode";

// Read-only listing of the JEVs of ONE type — the type is chosen in the
// sidebar's "Journal Entry Voucher" section, not by a filter on the page.
// No Add / Edit / Delete for now: the only action is opening a JEV in the
// shared viewer modal (JevEntriesViewModal).
export default function useJevList() {
  const {
    jev_types,
    jev_status,
    jevActiveKey,
    jevPendingKey,
    jevCancelledKey,
    loading: mappingLoading,
  } = useKeysLabels();

  const [jevs, setJevs] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTypeCode, setSelectedTypeCode] = useState("");
  // "all" or a raw jev_status code (A / C / P) — page-local, unlike the type,
  // which the sidebar owns.
  const [statusFilter, setStatusFilter] = useState("all");
  const [jevModal, setJevModal] = useState(null);
  const [jevModalOpen, setJevModalOpen] = useState(false);

  const typeCodes = useMemo(() => Object.keys(jev_types || {}), [jev_types]);
  const firstCode = typeCodes[0] ?? "";

  // ── Fetch ────────────────────────────────────────────────────────────
  // No localStorage payload cache: a JEV row carries its entries AND its
  // voucher relations, which is far too heavy for the 5MB store.
  const fetchJevs = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setItemsLoading(true);
    try {
      const res = await JevAPI.getAll();
      const data = Array.isArray(res) ? res : res?.data || [];
      setJevs(data);
    } catch (err) {
      console.error("Failed to fetch JEVs:", err);
    } finally {
      if (!silent) setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mappingLoading) fetchJevs();
  }, [mappingLoading, fetchJevs]);

  // ── Selected type — follow the sidebar ───────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;
    const saved = getItem(SESSION_KEY, "");
    if (saved) {
      setSelectedTypeCode(saved);
      return;
    }
    if (firstCode) {
      setItem(SESSION_KEY, firstCode);
      setSelectedTypeCode(firstCode);
    }
  }, [mappingLoading, firstCode]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setItem(SESSION_KEY, code);
      setSelectedTypeCode(code);
      setPage(0);
    };
    window.addEventListener("jev_type_changed", handler);
    return () => window.removeEventListener("jev_type_changed", handler);
  }, []);

  // ── Filter — the sidebar's type, then status, then the search box ─────
  const filteredJevs = useMemo(() => {
    const byType = jevs.filter(
      (j) =>
        (!selectedTypeCode ||
          String(j.cJEVLinkType) === String(selectedTypeCode)) &&
        (statusFilter === "all" || String(j.cStatus) === String(statusFilter)),
    );

    // Newest first — dtOccur is "YYYY-MM-DD HH:mm:ss", so a plain string
    // compare already sorts correctly.
    const sorted = [...byType].sort((a, b) =>
      String(b.dtOccur ?? "").localeCompare(String(a.dtOccur ?? "")),
    );

    const q = search.trim().toLowerCase();
    if (!q) return sorted;

    return sorted.filter((j) =>
      [j.strJEVNumber, j.strPayeeName, j.strCompanyName, j.strVoucherNumber]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [jevs, selectedTypeCode, statusFilter, search]);

  const tableRows = useMemo(
    () =>
      filteredJevs.map((j) => {
        const entries = j.entries ?? [];
        // Debits are stored positive and credits negative (they net to 0),
        // so the JEV's gross total is the sum of the positive side.
        const total = entries.reduce(
          (sum, e) => sum + (Number(e.dAmount) > 0 ? Number(e.dAmount) : 0),
          0,
        );

        return {
          _raw: j,
          id: j.nJEVId,
          strJEVNumber: j.strJEVNumber ?? "—",
          total,
          totalLabel: fmtPHP(total),
          statusLabel: jev_status?.[j.cStatus] ?? j.cStatus ?? "—",
          cStatus: j.cStatus ?? "",
          dtOccur: fmtDateTime(j.dtOccur),
        };
      }),
    [filteredJevs, jev_status],
  );

  // ── Viewer ───────────────────────────────────────────────────────────
  const openJevModal = useCallback((row) => {
    const j = row?._raw ?? row;
    if (!j?.nJEVId) return;
    // Rebuilt WITHOUT `entries` → JevViewPanel fetches them fresh with
    // their journal_account data (same trick AccountReportPanel uses).
    setJevModal({
      nJEVId: j.nJEVId,
      strJEVNumber: j.strJEVNumber ?? "",
      dtOccur: j.dtOccur ?? "",
      cStatus: j.cStatus ?? "",
      cJEVLinkType: j.cJEVLinkType ?? "",
    });
    setJevModalOpen(true);
  }, []);

  const closeJevModal = useCallback(() => setJevModalOpen(false), []);

  // "Disbursement Voucher · Sep 15, 2026" — the type from the mapping plus
  // the day the JEV occurred.
  const jevSubTitle = useMemo(() => {
    if (!jevModal) return "";
    const typeLabel = jev_types?.[jevModal.cJEVLinkType] ?? "";
    const day = jevModal.dtOccur ? fmtDate(jevModal.dtOccur) : "";
    return [typeLabel, day].filter(Boolean).join(" · ");
  }, [jevModal, jev_types]);

  const handlePageChange = useCallback((_, p) => setPage(p), []);

  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  const handleRowClick = useCallback((row) => openJevModal(row), [openJevModal]);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  }, []);

  return {
    itemsLoading,
    search,
    setSearch,
    page,
    rowsPerPage,
    selectedTypeCode,
    statusFilter,
    handleStatusFilterChange,
    mappingLoading,
    jev_types,
    jev_status,
    jevActiveKey,
    jevPendingKey,
    jevCancelledKey,
    tableRows,
    fetchJevs,
    handlePageChange,
    handleRowsPerPageChange,
    handleRowClick,
    openJevModal,
    closeJevModal,
    jevModal,
    jevModalOpen,
    jevSubTitle,
  };
}
