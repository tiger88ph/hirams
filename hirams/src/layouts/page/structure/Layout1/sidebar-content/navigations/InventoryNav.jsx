import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SidebarItem from "../../sidebar/SidebarItem";
import SidebarSubmenu from "../../sidebar/SidebarSubmenu";
import useMapping from "../../../../../../utils/mappings/useMapping";
import InventoryAPI from "../../../../../../api/endpoints/inventory.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const SESSION_KEY = "selectedInventoryStatusCode";

const InventoryNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { inventoryStatus, loading: mappingLoading } = useMapping();
  const safeInventoryStatus = inventoryStatus || {};
  const firstCode = Object.keys(safeInventoryStatus)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(() => {
    const saved = getItem(SESSION_KEY);
    return saved || firstCode;
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage = location.pathname === "/inventory";

  useEffect(() => {
    const saved = getItem(SESSION_KEY);
    if (saved && saved !== selectedCode) setSelectedCode(saved);
    if (!saved && firstCode) {
      setItem(SESSION_KEY, firstCode);
      setSelectedCode(firstCode);
    }
  }, [location.key, firstCode, selectedCode]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code || code === selectedCode) return;
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("inventory_status_changed", handler);
    return () => window.removeEventListener("inventory_status_changed", handler);
  }, [selectedCode]);

  const fetchInventory = useCallback(async (silent = false) => {
    if (mappingLoading) return;
    if (!silent) setCountLoading(true);
    try {
      console.log("📡 Sidebar: Fetching inventory...");
      const res = await InventoryAPI.getInventory();
      setInventoryItems(res.inventories || []);
      console.log("✅ Sidebar: Inventory updated", res.inventories?.length, "items");
    } catch (err) {
      console.error("❌ Sidebar inventory fetch error:", err);
    } finally {
      if (!silent) setCountLoading(false);
    }
  }, [mappingLoading]);

  const fetchRef = useRef(fetchInventory);
  useEffect(() => { fetchRef.current = fetchInventory; }, [fetchInventory]);
  useEffect(() => { if (!mappingLoading) fetchInventory(false); }, [mappingLoading, fetchInventory]);

  useEffect(() => {
    const onUpdated = () => {
      console.log("🔄 Sidebar: Refresh triggered by event");
      fetchRef.current(true);
    };

    const onDeleted = () => {
      console.log("🔄 Sidebar: Delete triggered → full refresh");
      fetchRef.current(true);
    };

    window.addEventListener("inventory_data_updated", onUpdated);
    window.addEventListener("inventory_data_deleted", onDeleted);
    window.addEventListener("cart_data_updated", onUpdated);

    return () => {
      window.removeEventListener("inventory_data_updated", onUpdated);
      window.removeEventListener("inventory_data_deleted", onDeleted);
      window.removeEventListener("cart_data_updated", onUpdated);
    };
  }, []);

  const handleSelect = useCallback((code) => {
    setItem(SESSION_KEY, code);
    setSelectedCode(code);
    navigate("/inventory");
    onItemClick?.();
    window.dispatchEvent(new CustomEvent("inventory_status_changed", { detail: { code } }));
  }, [navigate, onItemClick]);

  const handleParentClick = useCallback(() => {
    const first = Object.keys(safeInventoryStatus)[0];
    if (first) handleSelect(first);
  }, [safeInventoryStatus, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem icon={<Inventory2Icon fontSize="small" />} label="Inventory" collapsed={collapsed} forceExpanded={forceExpanded} onParentClick={handleParentClick}>
        {Object.entries(safeInventoryStatus).map(([code, label]) => (
          <SidebarSubmenu
            key={code}
            label={label}
            active={isOnPage && selectedCode === String(code)}
            count={inventoryItems.filter((i) => String(i.cStatus) === String(code)).length}
            countLoading={countLoading}
            onClick={() => handleSelect(String(code))}
          />
        ))}
      </SidebarItem>
    </div>
  );
};

export default InventoryNavSection;