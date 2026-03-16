import { useState, useEffect } from "react";
import api from "../api/api";
import { loadMappings, saveMappings } from "./mappingCache";

const parseData = (data, setters) => {
  const {
    setUserTypes,
    setDefaultUserType,
    setSex,
    setStatuses,
    setRoles,
    setVAT,
    setEWT,
    setClientStatus,
    setTransactionStatus,
    setProcStatus,
    setProSource,
    seProcMode,
    setItemType,
    setStatusTransaction,
    setAoStatus,
    setAotlStatus,
    setVaGoSeValue,
  } = setters;

  setUserTypes(data.user_types || {});
  setDefaultUserType(data.default_user_type || {});
  setSex(data.sex || {});
  setStatuses(data.status_user || {});
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
  setAotlStatus(data.aotl_status || {});
  setVaGoSeValue(data.vaGoSeValue || {});
};

export default function useMapping() {
  const [userTypes, setUserTypes] = useState({});
  const [defaultUserType, setDefaultUserType] = useState({});
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
  const [aotl_status, setAotlStatus] = useState({});
  const [statusTransaction, setStatusTransaction] = useState({});
  const [vaGoSeValue, setVaGoSeValue] = useState({});

  const setters = {
    setUserTypes,
    setDefaultUserType,
    setSex,
    setStatuses,
    setRoles,
    setVAT,
    setEWT,
    setClientStatus,
    setTransactionStatus,
    setProcStatus,
    setProSource,
    seProcMode,
    setItemType,
    setStatusTransaction,
    setAoStatus,
    setAotlStatus,
    setVaGoSeValue,
  };

  useEffect(() => {
    const fetchMappings = async () => {
      // ── 1. Try cache first ─────────────────────────────
      const cached = loadMappings();
      if (cached) {
        parseData(cached, setters);
        setLoading(false);
        return; // ← skip API call entirely
      }

      // ── 2. Cache miss — fetch from API ─────────────────
      try {
        const data = await api.get("mappings");
        parseData(data, setters);
        saveMappings(data); // ← save for next time
      } catch (error) {
        console.error("Error fetching mappings:", error);
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
    clientstatus,
    transacstatus,
    proc_status,
    procMode,
    procSource,
    itemType,
    ao_status,
    aotl_status,
    statusTransaction,
    vaGoSeValue,
    defaultUserType,
  };
}
