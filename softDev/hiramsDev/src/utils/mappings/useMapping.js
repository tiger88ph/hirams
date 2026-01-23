// src/hooks/useMapping.js (or wherever your hooks are located)

import { useState, useEffect } from "react";
import api from "../api/api";

export default function useMapping() {
  const [userTypes, setUserTypes] = useState({});
  const [sex, setSex] = useState({});
  const [statuses, setStatuses] = useState({});
  const [roles, setRoles] = useState({});
  const [vat, setVAT] = useState({});
  const [ewt, setEWT] = useState({});
  const [clientstatus, setClientStatus] = useState({});
  const [transacstatus, setTransactionStatus] = useState({});
  const [proc_status, setProcStatus] = useState({});
  const [procSource, setProSource] = useState({});
  const [procMode, seProcMode] = useState({});
  const [itemType, setItemType] = useState({});
  const [loading, setLoading] = useState(true);
  const [ao_status, setAoStatus] = useState({});
  const [statusTransaction, setStatusTransaction] = useState({});
  const [vaGoSeValue, setVaGoSeValue] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the centralized api.get method - automatically uses correct URL
        const data = await api.get("mappings");
        
        // MAIN MAPPING
        setUserTypes(data.user_types || {});
        setSex(data.sex || {});
        setStatuses(data.status || {});
        setRoles(data.role || {});
        setVAT(data.vat || {});
        setEWT(data.ewt || {});
        setClientStatus(data.status_client || {});
        setTransactionStatus(data.transaction_filter_content || {});
        setProcStatus(data.proc_status || {});
        setProSource(data.proc_source || {});
        seProcMode(data.proc_mode || {});
        setItemType(data.item_type || {});
        setStatusTransaction(data.status_transaction || {});
        setAoStatus(data.ao_status || {});
        setVaGoSeValue(data.vaGoSeValue || {});
      } catch (err) {
        console.error("Error fetching mappings:", err);
        setError(err.message || "Failed to fetch mappings");
      } finally {
        setLoading(false);
      }
    };

    fetchMappings();
  }, []);

  return {
    userTypes,
    sex,
    statuses,
    roles,
    vat,
    ewt,
    loading,
    error,
    clientstatus,
    transacstatus,
    proc_status,
    procMode,
    procSource,
    itemType,
    ao_status,
    statusTransaction,
    vaGoSeValue,
  };
}