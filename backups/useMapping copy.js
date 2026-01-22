import { useState, useEffect } from "react";
import api from "../hirams/src/utils/api/api";

// const API_BASE_URL = "http://lgu.net.ph/apiHirams/public/api/mappings";
const API_BASE_URL = "http://127.0.0.1:8000/api/mappings";

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

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await fetch(API_BASE_URL);
        const data = await res.json();
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
    statusTransaction,
    vaGoSeValue,
  };
}
