import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SidebarItem from "../../sidebar/SidebarItem";
import SidebarSubmenu from "../../sidebar/SidebarSubmenu";
import useMapping from "../../../../../../utils/mappings/useMapping";
import { getUserRoles } from "../../../../../../utils/helpers/roleHelper";
import VoucherAPI from "../../../../../../api/endpoints/voucher.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const SESSION_KEY = "selectedVoucherStatusCode";
const VoucherNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    voucherStatus,
    voucherType,
    userTypes: voucherUserTypes,
    loading: mappingLoading,
  } = useMapping();
  const safeVoucherStatus = voucherStatus || {};
  const safeVoucherType = voucherType || {};
  const {
    isAOTL: voucherIsAOTL,
    isManagement: voucherIsManagement,
    isFinanceOfficer: voucherIsFinanceOfficer,
  } = getUserRoles(voucherUserTypes);
  const voucherAssigneeTypeKey = Object.keys(safeVoucherType)[1] ?? "";
  const currentUserId = useMemo(() => getItem("user", {})?.nUserId ?? null, []);
  const firstCode = Object.keys(safeVoucherStatus)[0] ?? "";
  const [selectedCode, setSelectedCode] = useState(
    () => getItem(SESSION_KEY) || firstCode,
  );
  const [vouchers, setVouchers] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage =
    location.pathname === "/voucher" || location.pathname === "/voucher-update";

  useEffect(() => {
    const saved = getItem(SESSION_KEY);
    if (saved && saved !== selectedCode) setSelectedCode(saved);
    if (!saved && firstCode) {
      setItem(SESSION_KEY, firstCode);
      setSelectedCode(firstCode);
    }
  }, [location.key, firstCode, selectedCode]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code || code === selectedCode) return;
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("voucher_status_changed", handler);
    return () => window.removeEventListener("voucher_status_changed", handler);
  }, [selectedCode]);

  const fetchVouchers = useCallback(
    async (silent = false) => {
      if (mappingLoading) return;
      if (!silent) setCountLoading(true);
      try {
        const res = await VoucherAPI.getVouchers();
        const list = Array.isArray(res)
          ? res
          : (res?.vouchers ?? res?.data ?? []);

        setVouchers(list);
      } catch (err) {
        console.error("Sidebar voucher fetch error:", err);
      } finally {
        if (!silent) setCountLoading(false);
      }
    },
    [mappingLoading],
  );

  const fetchRef = useRef(fetchVouchers);
  useEffect(() => {
    fetchRef.current = fetchVouchers;
  }, [fetchVouchers]);
  useEffect(() => {
    if (!mappingLoading) fetchVouchers(false);
  }, [mappingLoading, fetchVouchers]);

  useEffect(() => {
    const onUpdated = () => fetchRef.current(true);
    const onDeleted = (e) => {
      const id = e.detail?.voucherId;
      if (id) setVouchers((prev) => prev.filter((v) => v.nVoucherId !== id));
      else fetchRef.current(true);
    };
    window.addEventListener("voucher_data_updated", onUpdated);
    window.addEventListener("voucher_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("voucher_data_updated", onUpdated);
      window.removeEventListener("voucher_data_deleted", onDeleted);
    };
  }, []);

  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/voucher");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("voucher_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(safeVoucherStatus)[0];
    if (first) handleSelect(first);
  }, [safeVoucherStatus, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<ReceiptLongIcon fontSize="small" />}
        label="Vouchers"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        {Object.entries(safeVoucherStatus).map(([code, label]) => {
          const count = vouchers.filter((v) => {
            if (String(v.cStatus) !== String(code)) return false;
            if (voucherIsManagement || voucherIsFinanceOfficer) return true;
            if (String(v.nAssignedUserId) !== String(currentUserId))
              return false;
            if (voucherIsAOTL)
              return String(v.cType) !== String(voucherAssigneeTypeKey);
            return true;
          }).length;
          return (
            <SidebarSubmenu
              key={code}
              label={label}
              active={isOnPage && selectedCode === String(code)}
              count={count}
              countLoading={countLoading}
              onClick={() => handleSelect(String(code))}
            />
          );
        })}
      </SidebarItem>
    </div>
  );
};

export default VoucherNavSection;
