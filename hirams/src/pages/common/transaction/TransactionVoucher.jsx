import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Box, Select, MenuItem, FormControl } from "@mui/material";
import {
  ReceiptLongOutlined,
  Add,
  Visibility,
  FilterList,
} from "@mui/icons-material";
import CustomSearchField from "../../../components/common/SearchField";
import CustomTable from "../../../components/common/Table";
import PageLayout from "../../../components/common/PageLayout";
import useMapping from "../../../utils/mappings/useMapping";
import api from "../../../utils/api/api";
import VoucherUpdateModal from "./modal/transaction-voucher/VoucherUpdateModal";
import CreateVoucherModal from "./modal/transaction-voucher/CreateVoucherModal";
import SyncMenu from "../../../components/common/SyncMenu";
import BaseButton from "../../../components/common/BaseButton";
import { TXN_CACHE_TTL } from "../../../utils/constants/cache";
import {
  getUserRoles,
  buildRoleGroups,
} from "../../../utils/helpers/roleHelper.js";
import { fmtDateTime } from "../../../utils/helpers/timeZone"; // adjust path

// ── Formatters (exported — LineItems.jsx imports these) ───────────────────────

// ── Cache helpers (mirrors TransactionPurchaseCart) ───────────────────────────

function getCachedData(key) {
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

function setCachedData(key, data) {
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

// ── TransactionVoucher ────────────────────────────────────────────────────────

function TransactionVoucher() {
  const [itemsLoading, setItemsLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "supplier" | "assignee"
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const currentUserId = user?.nUserId;

  // ── Cache key (per user, stable) ──────────────────────────────────────────
  const cacheKey = `voucher_cache_${currentUserId}`;

  const selectedVoucher =
    vouchers.find((v) => v.nVoucherId === selectedVoucherId) ?? null;

  const handleViewClick = useCallback((voucher) => {
    setSelectedVoucherId(voucher.nVoucherId);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedVoucherId(null);
  }, []);

  const {
    voucherStatus,
    voucherType,
    cartStatus,
    forPurchaseStatus,
    paymentTerms,
    userTypes,
    loading: mappingLoading,
  } = useMapping();
  const { isAOTL, isManagement, isFinanceOfficer } = getUserRoles(userTypes);

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem("selectedVoucherStatusCode") || "",
  );

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (code) {
        setSelectedStatusCode(code);
        setPage(0);
      }
    };
    window.addEventListener("voucher_status_changed", handler);
    return () => window.removeEventListener("voucher_status_changed", handler);
  }, []);

  const vsKeys = Object.keys(voucherStatus || {});
  const ptKeys = Object.keys(paymentTerms || {});

  const vtKeys = Object.keys(voucherType || {});
  const csKeys = Object.keys(cartStatus || {});
  const fpKeys = Object.keys(forPurchaseStatus || {});

  const voucherActiveKey = vsKeys[0] ?? "";
  const voucherClosedKey = vsKeys[1] ?? "";
  const voucherCancelledKey = vsKeys[2] ?? "";

  const voucherSupplierTypeKey = vtKeys[0] ?? "";
  const voucherAssigneeTypeKey = vtKeys[1] ?? "";

  const closeCartKey = csKeys[1] ?? "";
  const cancelCartKey = csKeys[2] ?? "";

  const cancelPoKey = fpKeys[0] ?? "";
  const forPurchaseKey = fpKeys[2] ?? "";
  const paidKey = fpKeys[3] ?? "";
  const receivedKey = fpKeys[4] ?? "";
  const deliveredKey = fpKeys[5] ?? "";

  const chequeKey = ptKeys[2] ?? "";
  // ── Fetch ─────────────────────────────────────────────────────────────────
  //   silent=true   → background refresh, no spinner
  //   bustCache=true → force re-fetch even if cache is warm

  const fetchVouchers = useCallback(
    async ({ silent = false, bustCache = false } = {}) => {
      if (bustCache) {
        invalidateCache(cacheKey);
      }

      // Serve from cache immediately on non-bust, non-silent loads
      if (!silent && !bustCache) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          setVouchers(cached);
          setItemsLoading(false);
          // Kick off a background refresh so data stays fresh
          fetchVouchers({ silent: true });
          return;
        }
      }

      if (!silent) setItemsLoading(true);

      try {
        const res = await api.get("vouchers");
        const data = Array.isArray(res) ? res : res.data || [];
        setVouchers(data);
        setCachedData(cacheKey, data);
      } catch (err) {
        console.error("Failed to fetch vouchers:", err);
      } finally {
        if (!silent) setItemsLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    if (!mappingLoading) fetchVouchers();
  }, [mappingLoading, fetchVouchers]);

  // Keep a stable ref so event-listener closures never go stale
  const fetchRef = useRef(fetchVouchers);
  useEffect(() => {
    fetchRef.current = fetchVouchers;
  }, [fetchVouchers]);

  useEffect(() => {
    const handler = () => fetchRef.current({ bustCache: true });
    window.addEventListener("voucher_data_updated", handler);
    return () => window.removeEventListener("voucher_data_updated", handler);
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredVouchers = useMemo(() => {
    let result = selectedStatusCode
      ? vouchers.filter((v) => String(v.cStatus) === String(selectedStatusCode))
      : vouchers;

    if (isAOTL) {
      result = result.filter(
        (v) => String(v.cType) !== String(voucherAssigneeTypeKey),
      );
    } else if (!isManagement && !isFinanceOfficer) {
      result = result.filter((v) =>
        (v.voucher_suppliers ?? []).some(
          (vs) =>
            String(
              vs.purchase_order?.purchase_order_options?.[0]?.purchase_option
                ?.transaction_item?.transaction?.nUserId,
            ) === String(currentUserId),
        ),
      );
    } else if (isFinanceOfficer || isManagement) {
      if (typeFilter === "assignee") {
        result = result.filter(
          (v) => String(v.cType) === String(voucherAssigneeTypeKey),
        );
      } else if (typeFilter === "supplier") {
        result = result.filter(
          (v) => String(v.cType) !== String(voucherAssigneeTypeKey),
        );
      }
    }
    // isAOTL: no type filter applied, sees all vouchers
    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((v) => {
      const poNos = (v.voucher_suppliers || [])
        .map((s) => s.purchase_order?.strPurchaseOrderNo ?? "")
        .join(" ")
        .toLowerCase();

      return (
        v.strNumber?.toLowerCase().includes(q) ||
        v.supplier?.strSupplierNickName?.toLowerCase().includes(q) ||
        v.assignee?.strNickName?.toLowerCase().includes(q) ||
        poNos.includes(q)
      );
    });
  }, [
    vouchers,
    selectedStatusCode,
    search,
    typeFilter,
    voucherAssigneeTypeKey,
    isAOTL,
    isManagement,
    isFinanceOfficer,
    currentUserId,
  ]);

  // ── Table rows ────────────────────────────────────────────────────────────

  const tableRows = useMemo(
    () =>
      filteredVouchers.map((v) => {
        const isAssigneeType =
          String(v.cType) === String(voucherAssigneeTypeKey);
        const firstAssignee = v.voucher_assignees?.[0];

        const displayName = isAssigneeType
          ? (firstAssignee?.assignee?.strAssigneeNickName ?? "—")
          : (v.supplier?.strSupplierNickName ?? "—");

        const displayTIN = isAssigneeType
          ? (firstAssignee?.assignee?.strTIN ?? "—")
          : (v.supplier?.strTIN ?? "—");

        const displayAddress = isAssigneeType
          ? (firstAssignee?.assignee?.strAddress ?? "—")
          : (v.supplier?.strAddress ?? "—");

        const supplierLinks = v.voucher_suppliers ?? [];
        const voucherTypeLabel = isAssigneeType ? "Assignee" : "Supplier";

        return {
          _raw: v,
          id: v.nVoucherId,
          strNumber: v.strNumber ?? "—",
          displayName,
          displayTIN,
          displayAddress,
          dtCreated: fmtDateTime(v.dtCreated),
          poCount: supplierLinks.length,
          isAssigneeType,
          voucherTypeLabel,
        };
      }),
    [filteredVouchers, voucherAssigneeTypeKey],
  );

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      {
        key: "strNumber",
        label: "HDV No.",
        align: "center",
      },
      ...(typeFilter === "all"
        ? [
            {
              key: "voucherTypeLabel",
              label: "Type",
              align: "center",
              render: (_, row) => (
                <span
                  className={`px-2 py-1 text-[10px] font-medium rounded-full ${
                    row.isAssigneeType
                      ? "bg-violet-100 text-violet-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {row.voucherTypeLabel}
                </span>
              ),
            },
          ]
        : []),
      {
        key: "displayName",
        label: "Name",
        align: "center",
      },
      {
        key: "displayTIN",
        label: "TIN",
        align: "center",
      },
      {
        key: "displayAddress",
        label: "Address",
        xs: 2,
      },
      {
        key: "dtCreated",
        label: "Created",
        align: "center",
      },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        render: (_, row) => (
          <div className="flex justify-center gap-0">
            <BaseButton
              icon={<Visibility fontSize="small" />}
              tooltip="View Voucher"
              size="small"
              actionColor="view"
              onClick={(e) => {
                e.stopPropagation();
                handleViewClick(row._raw);
              }}
            />
          </div>
        ),
      },
    ],
    [handleViewClick, typeFilter],
  );

  const handlePageChange = useCallback((_, p) => setPage(p), []);
  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  const handleRowClick = useCallback(
    (row) => handleViewClick(row._raw),
    [handleViewClick],
  );

  const handleTypeFilterChange = useCallback((e) => {
    setTypeFilter(e.target.value);
    setPage(0);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      title="Vouchers"
      subtitle={
        selectedStatusCode && voucherStatus?.[selectedStatusCode]
          ? `/ ${voucherStatus[selectedStatusCode]}`
          : ""
      }
      footer={false}
    >
      {/* ── Toolbar ── */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Vouchers"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchVouchers({ bustCache: true })} />

        {/* Type filter — Finance/Management only */}
        {(isFinanceOfficer || isManagement) && (
          <FormControl size="small" sx={{ minWidth: 0, flexShrink: 0 }}>
            <Select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              displayEmpty
              renderValue={(val) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <FilterList
                    sx={{ fontSize: "0.9rem", color: "text.secondary" }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#374151" }}>
                    {val === "all"
                      ? "All Types"
                      : val === "supplier"
                        ? "Supplier"
                        : "Assignee"}
                  </span>
                </Box>
              )}
              sx={{
                height: 36,
                borderRadius: "50px",
                fontSize: "0.8rem",
                bgcolor: "#fff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E5E7EB",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#9CA3AF",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#6B7280",
                  borderWidth: "1px",
                },
                "& .MuiSelect-select": {
                  py: "6px",
                  pr: "28px !important",
                  pl: "10px",
                },
              }}
            >
              <MenuItem value="all">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "0.82rem" }}>All Types</span>
                </Box>
              </MenuItem>
              <MenuItem value="supplier">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "0.82rem" }}>Supplier</span>
                </Box>
              </MenuItem>
              <MenuItem value="assignee">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "0.82rem" }}>Assignee</span>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Create Voucher — Finance/Management only */}
        {(isFinanceOfficer || isManagement) && (
          <BaseButton
            label="Create Voucher"
            tooltip="Create Voucher"
            icon={<Add fontSize="small" />}
            variant="contained"
            actionColor="approve"
            onClick={() => setVoucherModalOpen(true)}
          />
        )}
      </section>

      {/* ── Table ── */}
      <section className="bg-white shadow-sm">
        <CustomTable
          columns={columns}
          rows={tableRows}
          page={page}
          loading={itemsLoading}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ── */}
      <VoucherUpdateModal
        open={modalOpen}
        onClose={handleModalClose}
        voucher={selectedVoucher}
        onVoucherUpdated={() => {
          fetchVouchers({ bustCache: true });
          window.dispatchEvent(new CustomEvent("voucher_data_updated")); // ← ADD
        }}
        voucherAssigneeTypeKey={voucherAssigneeTypeKey}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
        voucherCancelledKey={voucherCancelledKey}
        voucherStatus={voucherStatus}
        paidKey={paidKey}
        receivedKey={receivedKey}
        deliveredKey={deliveredKey}
        closeCartKey={closeCartKey}
        cancelCartKey={cancelCartKey}
        cancelPoKey={cancelPoKey}
        currentUserId={currentUserId}
        isFinanceOfficer={isFinanceOfficer}
        isManagement={isManagement}
        chequeKey={chequeKey}
        forPurchaseKey={forPurchaseKey}
      />
      <CreateVoucherModal
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        onSuccess={() => {
          setVoucherModalOpen(false);
          fetchVouchers({ bustCache: true });
          window.dispatchEvent(new CustomEvent("voucher_data_updated")); // ← ADD
        }}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
        voucherCancelledKey={voucherCancelledKey}
        voucherSupplierTypeKey={voucherSupplierTypeKey}
        voucherAssigneeTypeKey={voucherAssigneeTypeKey}
      />
    </PageLayout>
  );
}

export default TransactionVoucher;
