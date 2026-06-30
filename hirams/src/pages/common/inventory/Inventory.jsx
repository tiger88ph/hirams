import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Visibility } from "@mui/icons-material";
import { Box, Select, MenuItem, FormControl } from "@mui/material";
import { FilterList } from "@mui/icons-material";

import CustomSearchField from "../../../components/common/SearchField";
import CustomTable from "../../../components/common/Table";
import PageLayout from "../../../components/common/PageLayout";
import SyncMenu from "../../../components/common/SyncMenu";
import BaseButton from "../../../components/common/BaseButton";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import { TXN_CACHE_TTL } from "../../../utils/constants/cache";
import InventoryItemInfoModal from "./modal/InventoryItemInfoModal";
import { fmtDateTime } from "../../../utils/helpers/timeZone";

// ── Cache helpers ─────────────────────────────────────────────────────────────

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

// ── Inventory ─────────────────────────────────────────────────────────────────

function Inventory() {
  const [itemsLoading, setItemsLoading] = useState(false);
  const { inventoryStatus, loading: mappingLoading } = useMapping();
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const currentUserId = user?.nUserId;
  const invKeys = Object.keys(inventoryStatus || {});

  const receivedKey = invKeys[0] ?? "";
  const deliveredKey = invKeys[1] ?? "";

  // ── Cache key (per user, stable) ──────────────────────────────────────────
  const cacheKey = `inventory_cache_${currentUserId}`;

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem("selectedInventoryStatusCode") || "",
  );

  useEffect(() => {
    const handler = (e) => {
      setSelectedStatusCode(e.detail?.code ?? "");
      setPage(0);
    };
    window.addEventListener("inventory_status_changed", handler);
    return () =>
      window.removeEventListener("inventory_status_changed", handler);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  //   silent=true   → background refresh, no spinner
  //   bustCache=true → force re-fetch even if cache is warm

  const fetchItems = useCallback(
    async ({ silent = false, bustCache = false } = {}) => {
      if (bustCache) {
        invalidateCache(cacheKey);
      }

      // Serve from cache immediately on non-bust, non-silent loads
      if (!silent && !bustCache) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          setItems(cached);
          setItemsLoading(false);
          // Kick off a background refresh so data stays fresh
          fetchItems({ silent: true });
          return;
        }
      }

      if (!silent) setItemsLoading(true);

      try {
        const response = await api.get("inventory/all");
        const data = response.inventories || [];
        setItems(data);
        setCachedData(cacheKey, data);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      } finally {
        if (!silent) setItemsLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Fetch companies for filter dropdown ───────────────────────────────────
  useEffect(() => {
    api
      .get("companies?search=")
      .then((res) => setCompanies(res.companies || []))
      .catch((err) => console.error("Failed to fetch companies:", err));
  }, []);

  // Keep a stable ref so event-listener closures never go stale
  const fetchRef = useRef(fetchItems);
  useEffect(() => {
    fetchRef.current = fetchItems;
  }, [fetchItems]);

  useEffect(() => {
    const handler = () => fetchRef.current({ bustCache: true });
    window.addEventListener("inventory_data_updated", handler);
    window.addEventListener("cart_data_updated", handler);
    return () => {
      window.removeEventListener("inventory_data_updated", handler);
      window.removeEventListener("cart_data_updated", handler);
    };
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = selectedStatusCode
      ? items.filter((i) => String(i.cStatus) === String(selectedStatusCode))
      : items;

    if (companyFilter !== "all") {
      result = result.filter((i) => i.strCompanyNickName === companyFilter);
    }

    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter(
      (i) =>
        i.purchaseOption?.strBrand?.toLowerCase().includes(q) ||
        i.purchaseOption?.strModel?.toLowerCase().includes(q) ||
        i.strSupplierNickName?.toLowerCase().includes(q) ||
        i.strClientNickName?.toLowerCase().includes(q) ||
        i.strCompanyNickName?.toLowerCase().includes(q),
    );
  }, [items, selectedStatusCode, companyFilter, search]);

  const tableRows = useMemo(
    () =>
      filteredItems.map((i) => ({
        _raw: i,
        id: i.nInventoryId,
        nInventoryId: i.nInventoryId,
        strBrand: i.purchaseOption?.strBrand ?? "—",
        strModel: i.purchaseOption?.strModel ?? "—",
        strUOM: i.purchaseOption?.strUOM ?? "—",
        dUnitPrice: Number(i.purchaseOption?.dUnitPrice ?? 0).toLocaleString(
          "en-PH",
          { minimumFractionDigits: 2 },
        ),
        nQuantity: Math.abs(i.nQuantity),
        cStatus: i.cStatus,
        dtLog: fmtDateTime(i.dtLog),
        strSupplierNickName: i.strSupplierNickName ?? "—",
        strClientNickName: i.strClientNickName ?? "—",
        strCompanyNickName: i.strCompanyNickName ?? "—",
      })),
    [filteredItems],
  );

  const columns = useMemo(
    () => [
      { key: "strBrand", label: "Brand" },
      { key: "strModel", label: "Model" },
      {
        key: "nQuantity",
        label: "Quantity",
        align: "center",
        render: (val, row) => `${val} ${row.strUOM}`,
      },
      {
        key: "dUnitPrice",
        label: "Unit Price",
        align: "right",
        render: (val) => `₱${val}`,
      },
      { key: "strSupplierNickName", label: "Supplier", align: "center" },
      { key: "strClientNickName", label: "Client", align: "center" },
      { key: "dtLog", label: "Date", align: "center", xs: 1.5 },
      {
        key: "actions",
        label: "Actions",
        align: "center",
        render: (_, row) => (
          <div className="flex justify-center">
            <BaseButton
              icon={<Visibility fontSize="small" />}
              tooltip="View"
              size="small"
              actionColor="view"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItemId(row._raw.nInventoryId);
                setViewModalOpen(true);
              }}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const handlePageChange = useCallback((_, p) => setPage(p), []);
  const handleRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);
  const handleRowClick = useCallback((row) => {
    setSelectedItemId(row._raw.nInventoryId);
    setViewModalOpen(true);
  }, []);

  const handleCompanyFilterChange = useCallback((e) => {
    setCompanyFilter(e.target.value);
    setPage(0);
  }, []);

  return (
    <PageLayout
      title="Inventory"
      subtitle={
        selectedStatusCode && inventoryStatus?.[selectedStatusCode]
          ? `/ ${inventoryStatus[selectedStatusCode]}`
          : ""
      }
      footer={false}
    >
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Brand / Model / Supplier / Client / Company"
            value={search}
            onChange={setSearch}
          />
        </div>

        <SyncMenu onSync={() => fetchItems({ bustCache: true })} />

        {/* Company filter */}
        <FormControl size="small" sx={{ minWidth: 0, flexShrink: 0 }}>
          <Select
            value={companyFilter}
            onChange={handleCompanyFilterChange}
            displayEmpty
            renderValue={(val) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <FilterList
                  sx={{ fontSize: "0.9rem", color: "text.secondary" }}
                />
                <span style={{ fontSize: "0.8rem", color: "#374151" }}>
                  {val === "all" ? "All Companies" : val}
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
                <span style={{ fontSize: "0.82rem" }}>All Companies</span>
              </Box>
            </MenuItem>
            {companies.map((c) => (
              <MenuItem key={c.nCompanyId} value={c.strCompanyNickName}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "0.82rem" }}>{c.strCompanyNickName}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </section>

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

      <InventoryItemInfoModal
        open={viewModalOpen}
        item={items.find((i) => i.nInventoryId === selectedItemId)}
        inventoryStatus={inventoryStatus}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedItemId(null);
        }}
        receivedKey={receivedKey}
        deliveredKey={deliveredKey}
      />
    </PageLayout>
  );
}

export default Inventory;