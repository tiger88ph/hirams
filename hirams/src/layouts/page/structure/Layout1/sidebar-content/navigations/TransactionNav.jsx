import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SidebarItem from "../../sidebar/SidebarItem";
import TransactionSubItems from "../TransactionSubItems";
import useMapping from "../../../../../../utils/mappings/useMapping";
import { getUserRoles } from "../../../../../../utils/helpers/roleHelper";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const TransactionNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    ao_status,
    aotl_status,
    proc_status,
    transacstatus,
    userTypes,
    financestatus,
    loading: mappingLoading,
  } = useMapping();

  const {
    isManagement,
    isProcurement,
    isAOTL,
    isProcurementTL,
    isFinanceOfficer,
  } = getUserRoles(userTypes);

  const sessionKey = isManagement
    ? "selectedStatusCode"
    : isProcurement
      ? "selectedProcStatusCode"
      : isFinanceOfficer
        ? "selectedStatusCode"
        : "selectedAOStatusCode";

  const statusMap = useMemo(
    () =>
      isManagement
        ? transacstatus
        : isProcurement
          ? proc_status
          : isAOTL
            ? aotl_status
            : isFinanceOfficer
              ? financestatus
              : ao_status,
    [
      isManagement,
      isFinanceOfficer,
      isProcurement,
      isAOTL,
      financestatus,
      transacstatus,
      proc_status,
      aotl_status,
      ao_status,
    ],
  );

  const [selectedCode, setSelectedCode] = useState(
    () => getItem(sessionKey, null) || Object.keys(statusMap)[0] || "",
  );

  useEffect(() => {
    if (!mappingLoading && Object.keys(statusMap).length > 0 && !selectedCode)
      setSelectedCode(Object.keys(statusMap)[0]);
  }, [mappingLoading, statusMap, selectedCode]);

  useEffect(() => {
    const saved = getItem(sessionKey, null);
    if (saved) setSelectedCode(saved);
  }, [location.key, sessionKey]);

  useEffect(() => {
    const onStatusChanged = (e) => {
      const code = e.detail?.code;
      if (code) {
        setItem(sessionKey, code);
        setSelectedCode(code);
      }
    };
    window.addEventListener("txn_status_changed", onStatusChanged);
    return () =>
      window.removeEventListener("txn_status_changed", onStatusChanged);
  }, [sessionKey]);

  const handleSelect = useCallback(
    (code) => {
      setItem(sessionKey, code);
      setSelectedCode(code);
      navigate("/transaction");
      onItemClick?.();
    },
    [sessionKey, navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const firstCode = Object.keys(statusMap)[0];
    if (firstCode) handleSelect(firstCode);
  }, [statusMap, handleSelect]);

  return (
    <div className="flex flex-col w-full mb-1.5">
      {(!collapsed || forceExpanded) && (
        <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
          TRANSACTION
        </span>
      )}
      <SidebarItem
        icon={<AccountBalanceIcon fontSize="small" />}
        label="Transactions"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <TransactionSubItems
          onItemClick={onItemClick}
          selectedCode={selectedCode}
          onSelect={handleSelect}
        />
      </SidebarItem>
    </div>
  );
};

export default TransactionNavSection;
