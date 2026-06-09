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
    setArchiveStatus,
    setForPurchaseStatus,
    setCartStatus,
    setShippingMethod,
    setPaymentTerms,
    setVoucherStatus,
    setVoucherType
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
  setArchiveStatus(data.archive_status || {});
  setForPurchaseStatus(data.for_purchase_status || {});
  setCartStatus(data.cart_status || {});
  setShippingMethod(data.shipping_method || {})
  setPaymentTerms(data.payment_terms || {})
  setVoucherStatus(data.voucher_status || {})
  setVoucherType(data.voucher_type || {})

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
  const [archiveStatus, setArchiveStatus] = useState({});
  const [forPurchaseStatus, setForPurchaseStatus] = useState({});
  const [cartStatus, setCartStatus] = useState({});
  const [shippingMethod, setShippingMethod] = useState({});
  const [paymentTerms, setPaymentTerms] = useState({});
    const [voucherStatus, setVoucherStatus] = useState({});
    const [voucherType, setVoucherType] = useState({});

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
    setArchiveStatus,
    setForPurchaseStatus,
    setCartStatus,
    setShippingMethod,
    setPaymentTerms,
    setVoucherStatus,
    setVoucherType
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
    archiveStatus,
    forPurchaseStatus,
    cartStatus,
    paymentTerms,
    shippingMethod,
    voucherStatus,
    voucherType
  };
}
