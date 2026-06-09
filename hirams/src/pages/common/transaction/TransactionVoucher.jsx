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
import VoucherUpdateModal from "./modal/transaction-purchase/VoucherUpdateModal";
import CreateVoucherModal from "./modal/transaction-purchase/CreateVoucherModal";
import SyncMenu from "../../../components/common/SyncMenu";
import BaseButton from "../../../components/common/BaseButton";

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

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

  const { voucherStatus, voucherType, loading: mappingLoading } = useMapping();

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
  const vtKeys = Object.keys(voucherType || {});

  const voucherActiveKey = vsKeys[0] ?? "";
  const voucherClosedKey = vsKeys[1] ?? "";
  const voucherCancelledKey = vsKeys[2] ?? "";
  const voucherSupplierTypeKey = vtKeys[0] ?? "";
  const voucherAssigneeTypeKey = vtKeys[1] ?? "";

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchVouchers = useCallback(async () => {
    setItemsLoading(true);
    try {
      const res = await api.get("vouchers");
      setVouchers(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Failed to fetch vouchers:", err);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mappingLoading) fetchVouchers();
  }, [mappingLoading, fetchVouchers]);

  const fetchRef = useRef(fetchVouchers);
  useEffect(() => {
    fetchRef.current = fetchVouchers;
  }, [fetchVouchers]);

  useEffect(() => {
    const handler = () => fetchRef.current();
    window.addEventListener("voucher_data_updated", handler);
    return () => window.removeEventListener("voucher_data_updated", handler);
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredVouchers = useMemo(() => {
    let result = selectedStatusCode
      ? vouchers.filter((v) => String(v.cStatus) === String(selectedStatusCode))
      : vouchers;

    // ── Type filter ──────────────────────────────────────────────────────────
    if (typeFilter === "assignee") {
      result = result.filter(
        (v) => String(v.cType) === String(voucherAssigneeTypeKey),
      );
    } else if (typeFilter === "supplier") {
      result = result.filter(
        (v) => String(v.cType) !== String(voucherAssigneeTypeKey),
      );
    }

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
  ]);

  // ── Table rows (flat shape for CustomTable) ───────────────────────────────

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
          dtCreated: fmtDate(v.dtCreated),
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
      // After
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
        ),
      },
    ],
    // After
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
        <SyncMenu onSync={fetchVouchers} />
        {/* ── Type filter dropdown ── */}
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
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                  All
                </span>
                <span style={{ fontSize: "0.82rem" }}>All Types</span>
              </Box>
            </MenuItem>
            <MenuItem value="supplier">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
                  S
                </span>
                <span style={{ fontSize: "0.82rem" }}>Supplier</span>
              </Box>
            </MenuItem>
            <MenuItem value="assignee">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700">
                  A
                </span>
                <span style={{ fontSize: "0.82rem" }}>Assignee</span>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <BaseButton
          label="Create Voucher"
          tooltip="Create Voucher"
          icon={<Add fontSize="small" />}
          variant="contained"
          actionColor="approve"
          onClick={() => setVoucherModalOpen(true)}
        />
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
        onVoucherUpdated={fetchVouchers}
        voucherAssigneeTypeKey={voucherAssigneeTypeKey}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
        voucherCancelledKey={voucherCancelledKey}
      />
      <CreateVoucherModal
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        onSuccess={() => {
          setVoucherModalOpen(false);
          fetchVouchers();
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
