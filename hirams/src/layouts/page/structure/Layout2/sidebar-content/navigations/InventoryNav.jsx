import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SidebarItem from "../../sidebar/SidebarItem";
import SidebarSubmenu from "../../sidebar/SidebarSubmenu";
import useKeysLabels from "../../../../../../hooks/useKeysLabels.js";
import InventoryAPI from "../../../../../../api/endpoints/inventory.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const SESSION_KEY = "selectedInventoryStatusCode";

const InventoryNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Single source from useKeysLabels
  const { inventoryStatus, loading: mappingLoading } = useKeysLabels();

  const safeInventoryStatus = inventoryStatus || {};
  const entries = Object.entries(safeInventoryStatus);
  const firstCode = entries[0]?.[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(() => {
    const saved = getItem(SESSION_KEY);
    return saved || firstCode;
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage = location.pathname === "/inventory";

  // ── Sync status from localStorage ──
  useEffect(() => {
    const saved = getItem(SESSION_KEY);
    if (saved && saved !== selectedCode) setSelectedCode(saved);
    if (!saved && firstCode) {
      setItem(SESSION_KEY, firstCode);
      setSelectedCode(firstCode);
    }
  }, [location.key, firstCode, selectedCode]);

  // ── Sync status changes ──
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code || code === selectedCode) return;
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("inventory_status_changed", handler);
    return () =>
      window.removeEventListener("inventory_status_changed", handler);
  }, [selectedCode]);

  // ── Fetch inventory ──
  const fetchInventory = useCallback(
    async (silent = false) => {
      if (mappingLoading) return;
      if (!silent) setCountLoading(true);
      try {
        const res = await InventoryAPI.getInventory();
        setInventoryItems(res.inventories || []);
      } catch (err) {
        console.error("Sidebar inventory fetch error:", err);
      } finally {
        if (!silent) setCountLoading(false);
      }
    },
    [mappingLoading],
  );

  const fetchRef = useRef(fetchInventory);
  useEffect(() => {
    fetchRef.current = fetchInventory;
  }, [fetchInventory]);
  useEffect(() => {
    if (!mappingLoading) fetchInventory(false);
  }, [mappingLoading, fetchInventory]);

  // ── Realtime updates ──
  useEffect(() => {
    const onUpdated = () => fetchRef.current(true);
    window.addEventListener("inventory_data_updated", onUpdated);
    window.addEventListener("inventory_data_deleted", onUpdated);
    window.addEventListener("cart_data_updated", onUpdated);

    return () => {
      window.removeEventListener("inventory_data_updated", onUpdated);
      window.removeEventListener("inventory_data_deleted", onUpdated);
      window.removeEventListener("cart_data_updated", onUpdated);
    };
  }, []);

  // ── Handle status click ──
  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/inventory");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("inventory_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    if (firstCode) handleSelect(firstCode);
  }, [firstCode, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full ">
      <SidebarItem
        icon={<Inventory2Icon fontSize="small" />}
        label="Inventory"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={entries.length ? handleParentClick : undefined}
      >
        {entries.length > 0 ? (
          entries.map(([code, label]) => (
            <SidebarSubmenu
              key={code}
              label={label}
              active={isOnPage && selectedCode === String(code)}
              count={
                inventoryItems.filter((i) => String(i.cStatus) === String(code))
                  .length
              }
              countLoading={countLoading}
              onClick={() => handleSelect(String(code))}
            />
          ))
        ) : (
          <div className="px-3 py-1 text-xs text-gray-500 italic">
            No inventory statuses found
          </div>
        )}
      </SidebarItem>
    </div>
  );
};

export default InventoryNavSection;
