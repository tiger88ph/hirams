import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import SidebarItem from "../../sidebar/SidebarItem";
import StatusSubItems from "../StatusSubItems";
import useMapping from "../../../../../../utils/mappings/useMapping";
import ClientAPI from "../../../../../../api/endpoints/client.api.js";

import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const ClientNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientstatus, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedClientStatusCode";
  const firstCode = Object.keys(clientstatus)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => getItem(SESSION_KEY, null) || firstCode,
  );
  const [clients, setClients] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/client";

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
    window.addEventListener("client_status_changed", handler);
    return () => window.removeEventListener("client_status_changed", handler);
  }, []);
  const fetchClients = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await ClientAPI.getClients();
      setClients(res.clients || []);
    } catch (err) {
      console.error("Sidebar client fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  const fetchRef = useRef(fetchClients);
  useEffect(() => {
    fetchRef.current = fetchClients;
  }, [fetchClients]);

  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading, fetchClients]);


  useEffect(() => {
    const handler = () => fetchRef.current();
    window.addEventListener("client_data_updated", handler);
    window.addEventListener("client_data_deleted", handler);
    return () => {
      window.removeEventListener("client_data_updated", handler);
      window.removeEventListener("client_data_deleted", handler);
    };
  }, []);

  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/client");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("client_status_changed", { detail: { code } }),
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
        icon={<PersonIcon fontSize="small" />}
        label="Clients"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <StatusSubItems
          statusMap={clientstatus}
          items={clients.map((c) => ({ statusCode: c.cStatus }))}
          selectedCode={selectedCode}
          onSelect={handleSelect}
          isOnPage={isOnPage}
          countLoading={countLoading}
        />
      </SidebarItem>
    </div>
  );
};

export default ClientNavSection;
