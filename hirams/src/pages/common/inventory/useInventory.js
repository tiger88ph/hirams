import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InventoryAPI from "../../../api/endpoints/inventory.api.js";
import CompanyAPI from "../../../api/endpoints/company.api.js";
import useMapping from "../../../utils/mappings/useMapping";
import { getItem } from "../../../utils/storage/localStorage";
import useKeysLabels from "../../../hooks/useKeysLabels.js";
export default function useInventory() {
  const [itemsLoading, setItemsLoading] = useState(false);
  const {
    inventoryStatus,
    loading: mappingLoading, //Keys
    inventoryReceivedKey,
    inventoryDeliveredKey,
    inventoryPendingKey,
    inventoryCancelledKey,
    inventoryReceivedLabel,
    inventoryDeliveredLabel,
    inventoryPendingLabel,
    inventoryCancelledLabel,
  } = useKeysLabels();
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const user = useMemo(() => getItem("user", {}), []);
  const currentUserId = user?.nUserId;

  const [selectedStatusCode, setSelectedStatusCode] = useState(() =>
    getItem("selectedInventoryStatusCode", ""),
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

  const fetchItems = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setItemsLoading(true);
    try {
      // ✅ Use getInventory instead of getAll
      const response = await InventoryAPI.getInventory();
      const data = response.inventories || [];
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      if (!silent) setItemsLoading(false);
    }
  }, []);

  const fetchRef = useRef(fetchItems);
  useEffect(() => {
    fetchRef.current = fetchItems;
  }, [fetchItems]);

  useEffect(() => {
    if (!mappingLoading) fetchItems();
  }, [mappingLoading, fetchItems]);

  useEffect(() => {
    CompanyAPI.search("")
      .then((res) => setCompanies(res.companies || []))
      .catch((err) => console.error("Failed to fetch companies:", err));
  }, []);

  useEffect(() => {
    const handlerUpdated = () => {
      console.log("🔄 inventory_data_updated received → Refreshing...");
      fetchRef.current({ silent: true });
    };

    const handlerDeleted = () => {
      console.log("🔄 inventory_data_deleted received → Refreshing...");
      fetchRef.current({ silent: true });
    };

    window.addEventListener("inventory_data_updated", handlerUpdated);
    window.addEventListener("inventory_data_deleted", handlerDeleted); // ← WAS MISSING!
    window.addEventListener("cart_data_updated", handlerUpdated);

    return () => {
      window.removeEventListener("inventory_data_updated", handlerUpdated);
      window.removeEventListener("inventory_data_deleted", handlerDeleted);
      window.removeEventListener("cart_data_updated", handlerUpdated);
    };
  }, []);
  const filteredItems = useMemo(() => {
    let result = selectedStatusCode
      ? items.filter((i) => String(i.cStatus) === String(selectedStatusCode))
      : items;
    if (companyFilter !== "all")
      result = result.filter((i) => i.strCompanyNickName === companyFilter);
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
  const closeModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedItemId(null);
  }, []);

  return {
    itemsLoading,
    items,
    companies,
    search,
    setSearch,
    companyFilter,
    selectedItemId,
    viewModalOpen,
    page,
    rowsPerPage,
    selectedStatusCode,
    inventoryStatus,
    inventoryReceivedKey,
    inventoryDeliveredKey,
    inventoryPendingKey,
    inventoryCancelledKey,
    inventoryReceivedLabel,
    inventoryDeliveredLabel,
    inventoryPendingLabel,
    inventoryCancelledLabel,
    filteredItems,
    fetchItems,
    handlePageChange,
    handleRowsPerPageChange,
    handleRowClick,
    handleCompanyFilterChange,
    closeModal,
  };
}
