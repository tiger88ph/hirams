import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SidebarItem from "../../sidebar/SidebarItem";
import StatusSubItems from "../StatusSubItems";
import useMapping from "../../../../../../utils/mappings/useMapping";
import SupplierAPI from "../../../../../../api/endpoints/supplier.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const SupplierNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientstatus, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedSupplierStatusCode";
  const firstCode = Object.keys(clientstatus)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => getItem(SESSION_KEY, null) || firstCode,
  );
  const [suppliers, setSuppliers] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/supplier";

  useEffect(() => {
    const saved = getItem(SESSION_KEY, null);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("supplier_status_changed", handler);
    return () => window.removeEventListener("supplier_status_changed", handler);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await SupplierAPI.getSuppliers();
      setSuppliers(res.suppliers || []);
    } catch (err) {
      console.error("Sidebar supplier fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);
  const fetchRef = useRef(fetchSuppliers);
  useEffect(() => {
    fetchRef.current = fetchSuppliers;
  }, [fetchSuppliers]);

  useEffect(() => {
    if (!mappingLoading) fetchSuppliers();
  }, [mappingLoading, fetchSuppliers]);

  // Realtime subscription now lives centrally in realtime/channels/suppliersChannel.js
  useEffect(() => {
    const handler = (e) => {
      if (e.type === "supplier_data_deleted") {
        setSuppliers((prev) =>
          prev.filter((s) => s.nSupplierId !== e.detail?.supplierId),
        );
      } else {
        fetchRef.current();
      }
    };
    window.addEventListener("supplier_data_updated", handler);
    window.addEventListener("supplier_data_deleted", handler);
    return () => {
      window.removeEventListener("supplier_data_updated", handler);
      window.removeEventListener("supplier_data_deleted", handler);
    };
  }, []);

  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/supplier");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("supplier_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(clientstatus)[0];
    if (first) handleSelect(first);
  }, [clientstatus, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<LocalShippingIcon fontSize="small" />}
        label="Suppliers"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <StatusSubItems
          statusMap={clientstatus}
          items={suppliers.map((s) => ({ statusCode: s.cStatus }))}
          selectedCode={selectedCode}
          onSelect={handleSelect}
          isOnPage={isOnPage}
          countLoading={countLoading}
        />
      </SidebarItem>
    </div>
  );
};

export default SupplierNavSection;