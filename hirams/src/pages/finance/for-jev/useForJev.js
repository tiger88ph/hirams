import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import api from "../../../api/axios.js";
import { getUserRoles } from "../../../utils/helpers/roleHelper.js";
import { fmtDateTime } from "../../../utils/helpers/timeZone.js";
import useMapping from "../../../utils/mappings/useMapping.js";
import { getItem, setItem, removeItem } from "../../../utils/storage/localStorage.js";

export default function useForJev() {
  const [itemsLoading, setItemsLoading] = useState(false);
  const [jevLoading, setJevLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [jevStatusMap, setJevStatusMap] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [optionStatuses, setOptionStatuses] = useState({});

  const isFetchingRef = useRef(false);
  const fetchRef = useRef(null);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const currentUserId = user?.nUserId;
  const storageKey = `for_jev_list_${currentUserId}`;

  const {
    voucherStatus, voucherType, cartStatus, forPurchaseStatus,
    paymentTerms, userTypes, jev_types, loading: mappingLoading,
  } = useMapping();

  const { isAOTL, isManagement, isFinanceOfficer } = getUserRoles(userTypes);

  const vsKeys = Object.keys(voucherStatus || {});
  const voucherClosedKey = vsKeys[1] ?? "";
  const voucherActiveKey = vsKeys[0] ?? "";
  const voucherCancelledKey = vsKeys[2] ?? "";

  const vtKeys = Object.keys(voucherType || {});
  const voucherSupplierTypeKey = vtKeys[0] ?? "";
  const voucherAssigneeTypeKey = vtKeys[1] ?? "";

  const csKeys = Object.keys(cartStatus || {});
  const closeCartKey = csKeys[1] ?? "";
  const cancelCartKey = csKeys[2] ?? "";

  const fpKeys = Object.keys(forPurchaseStatus || {});
  const cancelPoKey = fpKeys[0] ?? "";
  const addToCartKey = fpKeys[1] ?? "";
  const purchaseOrderKey = fpKeys[2] ?? "";
  const forPurchaseKey = fpKeys[2] ?? "";
  const paidKey = fpKeys[3] ?? "";
  const receivedKey = fpKeys[4] ?? "";
  const deliveredKey = fpKeys[5] ?? "";

  const ptKeys = Object.keys(paymentTerms || {});
  const chequeKey = ptKeys[2] ?? "";

  const jevKeys = Object.keys(jev_types || {});
  const dvTypeKey = jevKeys[0] ?? "";

  const selectedVoucher = vouchers.find((v) => v.nVoucherId === selectedVoucherId) ?? null;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleViewClick = useCallback((voucher) => {
    setSelectedVoucherId(voucher.nVoucherId);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedVoucherId(null);
  }, []);

  const handlePageChange = useCallback((_, p) => setPage(p), []);
  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);
  const handleRowClick = useCallback((row) => handleViewClick(row._raw), [handleViewClick]);
  const handleTypeFilterChange = useCallback((e) => {
    setTypeFilter(e.target.value);
    setPage(0);
  }, []);

  // ── Fetch JEV statuses ─────────────────────────────────────────────────
  const fetchJevStatuses = useCallback(async (closedVouchers) => {
    if (!closedVouchers?.length) return {};
    setJevLoading(true);
    try {
      const BATCH_SIZE = 10;
      const results = {};
      for (let i = 0; i < closedVouchers.length; i += BATCH_SIZE) {
        const batch = closedVouchers.slice(i, i + BATCH_SIZE);
        const batchRes = await Promise.all(
          batch.map(async (v) => {
            try {
              const res = await api.get(`jev/by-link/${encodeURIComponent(v.strNumber)}`);
              const totals = res?.totals ?? { dTotalDebit: 0, dTotalCredit: 0 };
              const lineCount = res?.particulars?.length ?? 0;
              const hasJev = lineCount > 0;
              const balanced = hasJev && Math.abs(Number(totals.dTotalDebit||0) - Number(totals.dTotalCredit||0)) < 0.01;
              return { strNumber: v.strNumber, hasJev, balanced };
            } catch {
              return { strNumber: v.strNumber, hasJev: false, balanced: false };
            }
          })
        );
        batchRes.forEach((r) => (results[r.strNumber] = r));
      }
      return results;
    } finally {
      setJevLoading(false);
    }
  }, []);

  const fetchOptionStatuses = useCallback(async (voucherList) => {
    const ids = (voucherList || [])
      .flatMap((v) => v.voucher_suppliers ?? [])
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);
    if (!ids.length) return;
    try {
      const res = await api.post("purchase-item-histories/latest", { nPurchaseOptionId: ids });
      const map = {};
      (res?.histories || []).forEach((h) => { map[Number(h.nPurchaseOptionId)] = h?.nStatus ?? null; });
      setOptionStatuses(map);
    } catch (err) { console.error("fetchOptionStatuses:", err); }
  }, []);

  // ── ✅ MAIN FETCH — Updated filter logic ───────────────────────────────
  const fetchVouchers = useCallback(async ({ silent = false, bustStorage = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (bustStorage) removeItem(storageKey);

      if (!silent && !bustStorage) {
        const stored = getItem(storageKey);
        if (stored) {
          setVouchers(stored.vouchers ?? []);
          setJevStatusMap(stored.jevStatusMap ?? {});
          setItemsLoading(false);
          setTimeout(() => fetchVouchers({ silent: true }), 0);
          return;
        }
      }

      if (!silent) setItemsLoading(true);

      const res = await api.get("vouchers");
      const data = Array.isArray(res) ? res : res.data || [];

      // Keep ONLY closed vouchers
      const closedOnly = data.filter((v) => String(v.cStatus) === String(voucherClosedKey));

      // Get fresh JEV statuses
      const freshJevMap = await fetchJevStatuses(closedOnly);

      // ✅ TWO GROUPS LOGIC
      const filtered = closedOnly.filter((v) => {
        const jev = freshJevMap[v.strNumber];
        const bIsForJev = !!v.bIsForJev; // true = requested for JEV

        // Group A: bIsForJev = true AND (no JEV OR unbalanced)
        const groupA = bIsForJev && (!jev || !jev.hasJev || !jev.balanced);

        // Group B: bIsForJev = false AND JEV exists AND balanced
        const groupB = !bIsForJev && jev && jev.hasJev && jev.balanced;

        return groupA || groupB;
      });

      setJevStatusMap(freshJevMap);
      setVouchers(filtered);
      setItem(storageKey, { vouchers: filtered, jevStatusMap: freshJevMap, fetchedAt: Date.now() });
      fetchOptionStatuses(filtered);

    } catch (err) {
      console.error("fetchVouchers error:", err);
    } finally {
      if (!silent) setItemsLoading(false);
      isFetchingRef.current = false;
    }
  }, [storageKey, voucherClosedKey, fetchJevStatuses, fetchOptionStatuses]);

  useEffect(() => { fetchRef.current = fetchVouchers; }, [fetchVouchers]);

  useEffect(() => {
    if (!mappingLoading) fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappingLoading]);

  useEffect(() => {
    const handler = () => fetchRef.current?.({ bustStorage: true });
    window.addEventListener("voucher_data_updated", handler);
    window.addEventListener("jev_data_updated", handler);
    return () => {
      window.removeEventListener("voucher_data_updated", handler);
      window.removeEventListener("jev_data_updated", handler);
    };
  }, []);

  // ── Filtered data ──────────────────────────────────────────────────────
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];
    if (isAOTL) result = result.filter((v) => String(v.cType) !== String(voucherAssigneeTypeKey));
    else if (!isManagement && !isFinanceOfficer) {
      result = result.filter((v) => (v.voucher_suppliers ?? []).some((vs) =>
        String(vs.purchase_order?.purchase_order_options?.[0]?.purchase_option?.transaction_item?.transaction?.nUserId) === String(currentUserId)
      ));
    } else if (isFinanceOfficer || isManagement) {
      if (typeFilter === "assignee") result = result.filter((v) => String(v.cType) === String(voucherAssigneeTypeKey));
      else if (typeFilter === "supplier") result = result.filter((v) => String(v.cType) !== String(voucherAssigneeTypeKey));
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter((v) => {
      const poNos = (v.voucher_suppliers || []).map((s) => s.purchase_order?.strPurchaseOrderNo ?? "").join(" ").toLowerCase();
      return (
        v.strNumber?.toLowerCase().includes(q) ||
        v.supplier?.strSupplierNickName?.toLowerCase().includes(q) ||
        v.assignee?.strNickName?.toLowerCase().includes(q) ||
        poNos.includes(q)
      );
    });
  }, [vouchers, search, typeFilter, voucherAssigneeTypeKey, isAOTL, isManagement, isFinanceOfficer, currentUserId]);

  // ── Table rows ─────────────────────────────────────────────────────────
  const tableRows = useMemo(() => filteredVouchers.map((v) => {
    const isAssigneeType = String(v.cType) === String(voucherAssigneeTypeKey);
    const firstAssignee = v.voucher_assignees?.[0];
    const displayName = isAssigneeType ? (firstAssignee?.assignee?.strAssigneeNickName ?? "—") : (v.supplier?.strSupplierNickName ?? "—");
    const displayTIN = isAssigneeType ? (firstAssignee?.assignee?.strTIN ?? "—") : (v.supplier?.strTIN ?? "—");
    const displayAddress = isAssigneeType ? (firstAssignee?.assignee?.strAddress ?? "—") : (v.supplier?.strAddress ?? "—");
    const supplierLinks = v.voucher_suppliers ?? [];
    const voucherTypeLabel = isAssigneeType ? "Assignee" : "Supplier";
    let isPaid;
    if (isAssigneeType) isPaid = !!v.bIsPaid;
    else {
      const linkedOptionIds = supplierLinks.flatMap((vs) => vs.purchase_order?.purchase_order_options ?? []).map((o) => o.purchase_option?.nPurchaseOptionId).filter(Boolean);
      const isUnpaid = linkedOptionIds.some((id) => {
        const s = String(optionStatuses[Number(id)] ?? "");
        return s === String(addToCartKey) || s === String(purchaseOrderKey);
      });
      isPaid = linkedOptionIds.length > 0 && !isUnpaid;
    }
    const jev = jevStatusMap[v.strNumber];
    const bIsForJev = !!v.bIsForJev;
    return {
      _raw: v, id: v.nVoucherId, strNumber: v.strNumber ?? "—",
      displayName, displayTIN, displayAddress,
      dtCreated: fmtDateTime(v.dtCreated), poCount: supplierLinks.length,
      isAssigneeType, voucherTypeLabel, isPaid,
      bIsForJev, // expose for UI coloring/grouping
      jevStatus: jev
        ? (jev.hasJev
            ? (jev.balanced ? "balanced" : "unbalanced")
            : "none")
        : "checking",
    };
  }), [filteredVouchers, voucherAssigneeTypeKey, optionStatuses, addToCartKey, purchaseOrderKey, jevStatusMap]);

  return {
    itemsLoading: itemsLoading || jevLoading,
    search, setSearch, typeFilter, modalOpen, page, rowsPerPage,
    selectedVoucher, isAOTL, isManagement, isFinanceOfficer,
    voucherStatus, voucherActiveKey, voucherClosedKey, voucherCancelledKey,
    voucherSupplierTypeKey, voucherAssigneeTypeKey,
    closeCartKey, cancelCartKey, cancelPoKey, forPurchaseKey,
    paidKey, receivedKey, deliveredKey, chequeKey, dvTypeKey,
    tableRows,
    handleViewClick, handleModalClose,
    handlePageChange, handleRowsPerPageChange, handleRowClick, handleTypeFilterChange,
    fetchVouchers,
  };
}