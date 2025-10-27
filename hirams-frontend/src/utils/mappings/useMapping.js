import { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:8000/api/mappings";

export default function useMapping() {
  const [userTypes, setUserTypes] = useState({});
  const [genders, setGenders] = useState({});
  const [statuses, setStatuses] = useState({});
  const [roles, setRoles] = useState({});
  const [vat, setVAT] = useState({});
  const [ewt, setEWT] = useState({});
  const [clientstatus, setClientStatus] = useState({});
  const [transacstatus, setTransactionStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await fetch(API_BASE_URL);
        const data = await res.json();

        // Assign each sub-object properly
        setUserTypes(data.user_types || {});
        setGenders(data.gender || {});
        setStatuses(data.status || {});
        setRoles(data.role || {});
        setVAT(data.vat || {});
        setEWT(data.ewt || {});
        setClientStatus(data.status_client || {});
        setTransactionStatus(data.status_transaction || {});
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
    genders,
    statuses,
    roles,
    loading,
    vat,
    ewt,
    clientstatus,
    transacstatus,
  };
}
