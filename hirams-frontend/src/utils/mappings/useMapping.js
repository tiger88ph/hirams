import { useState, useEffect } from "react";
import api from "../api/api";

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

  const [activeClient, setActiveClient] = useState({});
  const [inactiveClient, setInactiveClient] = useState({});
  const [pendingClient, setPendingClient] = useState({});
  const [ao_status, setAoStatus] = useState({});
  const [statusTransaction, setStatusTransaction] = useState({});
  const [unitOfMeasurements, setUOM] = useState({});
  // INDIVIDUAL SEX
  const [maleCode, setMaleCode] = useState({});
  const [femaleCode, setFemaleCode] = useState({});
  // INDIVIDUAL USER TYPES
  const [managementCode, setManagementCode] = useState({});
  // INDIVIDUAL STATUS CODES
  const [draftCode, setDraftCode] = useState({});
  const [finalizeCode, setFinalizeCode] = useState({});
  const [forAssignmentCode, setForAssignmentCode] = useState({});
  const [itemsManagementCode, setItemsManagementCode] = useState({});
  const [itemsVerificationCode, setItemsVerificationCode] = useState({});
  const [forCanvasCode, setForCanvasCode] = useState({});
  const [canvasVerificationCode, setCanvasVerificationCode] = useState({});
  const [priceSettingCode, setPriceSettingCode] = useState({});
  const [priceVerificationCode, setPriceVerificationCode] = useState({});
  const [priceApprovalCode, setPriceApprovalCode] = useState({});
  //for other proc
  const [priceVerificationRequestCode, setPriceVerificationRequestCode] =
    useState({});
  const [
    transactionVerificationRequestCode,
    setTransactionVerificationRequestCode,
  ] = useState({});
  const [itemVerificationRequestCode, setItemVerificationRequestCode] =
    useState({});
  const [canvasVerificationRequestCode, setCanvasVerificationRequestCode] =
    useState({});
  const [itemTypeGoods, setItemTypeGoods] = useState({});
  const [goodsValue, setGoodsValue] = useState({});
  const [serviceValue, setServiceValue] = useState({});
  const [vatValue, setVatValue] = useState({});

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

        setActiveClient(data.active_client || {});
        setInactiveClient(data.inactive_client || {});
        setPendingClient(data.pending_client || {});
        setAoStatus(data.ao_status || {});
        setUOM(data.unit_of_measurements || {});
        //INDIVIDUAL SEX
        setMaleCode(data.male || {});
        setFemaleCode(data.female || {});
        //INDIVIDUAL USER TYPES
        setManagementCode(data.management || {});
        // INDIVIDUAL STATUS CODES
        setDraftCode(data.draft_code || {});
        setFinalizeCode(data.finalize_code || {});
        setForAssignmentCode(data.for_assignment || {});
        setItemsManagementCode(data.items_management || {});
        setItemsVerificationCode(data.items_verification || {});
        setForCanvasCode(data.for_canvas || {});
        setCanvasVerificationCode(data.canvas_verification || {});
        setPriceSettingCode(data.price_setting || {});
        setPriceVerificationCode(data.price_verification || {});
        setPriceApprovalCode(data.price_approval || {});
        //othe rproc
        setPriceVerificationRequestCode(data.price_verification_request || {});
        setTransactionVerificationRequestCode(data.finalize_code_request || {});
        setItemVerificationRequestCode(data.items_verification_request || {});
        setCanvasVerificationRequestCode(
          data.canvas_verification_request || {}
        );
        setItemTypeGoods(data.item_type_goods || {});
        setGoodsValue(data.goodsValue || {});
        setServiceValue(data.serviceValue || {});
        setVatValue(data.vatValue || {});
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
    activeClient,
    pendingClient,
    inactiveClient,
    ao_status,
    statusTransaction,
    unitOfMeasurements,
    managementCode,
    maleCode,
    femaleCode,
    // EXPORT ALL INDIVIDUAL CODES
    draftCode,
    finalizeCode,
    forAssignmentCode,
    itemsManagementCode,
    itemsVerificationCode,
    forCanvasCode,
    canvasVerificationCode,
    priceSettingCode,
    priceVerificationCode,
    priceApprovalCode,
    //other proc
    priceVerificationRequestCode,
    transactionVerificationRequestCode,
    itemVerificationRequestCode,
    canvasVerificationRequestCode,
    //formula
    itemTypeGoods,
    goodsValue,
    serviceValue,
    vatValue,
  };
}
