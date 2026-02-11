import { useState, useEffect } from "react";
import api from "../api/api";

// const API_BASE_URL = "https://lgu.net.ph/apiHirams/public/api/mappings";
// const API_BASE_URL = "http://127.0.0.1:8000/api/mappings";
const API_BASE_URL = import.meta.env.VITE_API_MAPPINGS_BASE_URL;



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

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await fetch(API_BASE_URL);
        const data = await res.json();
        // MAIN MAPPING
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
