import React, { useState, useEffect, useMemo, useCallback } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarSection from "./SidebarSection";
import SidebarProfile from "./SidebarProfile";
import SidebarOthers from "./SidebarOthers";
import SidebarItem from "./SidebarItem";
import SidebarSubmenu from "./SidebarSubmenu";
import { Skeleton, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import useMapping from "../../utils/mappings/useMapping";
import { getUserRoles } from "../../utils/helpers/roleHelper";
import api from "../../utils/api/api";
import echo from "../../utils/echo";

/* ── Skeleton: single item ── */
const SidebarItemSkeleton = ({ collapsed, forceExpanded }) => {
  const isCollapsed = collapsed && !forceExpanded;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, minHeight: 32 }}>
      <Skeleton variant="circular" width={16} height={16} sx={{ flexShrink: 0 }} />
      {!isCollapsed && (
        <Skeleton variant="text" width="65%" height={14} sx={{ borderRadius: 1 }} />
      )}
    </Box>
  );
};

/* ── Skeleton: section ── */
const SidebarSectionSkeleton = ({ collapsed, forceExpanded, itemCount = 3 }) => {
  const isCollapsed = collapsed && !forceExpanded;
  return (
    <Box sx={{ mb: 1.5 }}>
      {!isCollapsed && (
        <Skeleton
          variant="text"
          width="40%"
          height={10}
          sx={{ mb: 0.5, ml: 0.5, borderRadius: 1 }}
        />
      )}
      {Array.from({ length: itemCount }).map((_, i) => (
        <SidebarItemSkeleton key={i} collapsed={collapsed} forceExpanded={forceExpanded} />
      ))}
    </Box>
  );
};

/* ── Transaction status sub-items ── */
const TransactionSubItems = ({ onItemClick, selectedCode, onSelect }) => {
  const location = useLocation();

  const {
    ao_status,
    aotl_status,
    proc_status,
    transacstatus,
    userTypes,
    loading: mappingLoading,
  } = useMapping();

  // ── Single source of truth for role flags ──────────────────────────────────
  const { isManagement, isProcurement, isAOTL } = getUserRoles(userTypes);

  const statusMap = useMemo(
    () =>
      isManagement
        ? transacstatus
        : isProcurement
          ? proc_status
          : isAOTL
            ? aotl_status
            : ao_status,
    [isManagement, isProcurement, isAOTL, transacstatus, proc_status, aotl_status, ao_status],
  );

  const isOnTransactionPage =
    location.pathname === "/transaction" ||
    location.pathname === "/transaction-canvas" ||
    location.pathname === "/transaction-pricing-set" ||
    location.pathname === "/transaction-pricing";

  const statusKeys = useMemo(() => {
    const mgmtKeys = Object.keys(transacstatus);
    const aoKeys   = Object.keys(isAOTL ? aotl_status : ao_status);
    return {
      forAssignmentKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 2 : 0] || "",
      itemsManagementKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 3 : isAOTL ? 1 : 0] || "",
      itemsVerificationKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 4 : isAOTL ? 3 : 2] || "",
      forCanvasKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 5 : isAOTL ? 4 : 3] || "",
      canvasVerificationKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 6 : isAOTL ? 6 : 5] || "",
    };
  }, [isManagement, isAOTL, transacstatus, proc_status, aotl_status, ao_status]);

  const {
    forAssignmentKey,
    itemsManagementKey,
    itemsVerificationKey,
    forCanvasKey,
    canvasVerificationKey,
  } = statusKeys;

  // ── Cache ─────────────────────────────────────────────────────────────────
  const userId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?.nUserId;
    } catch {
      return null;
    }
  }, []);

  const cacheKey = useMemo(
    () =>
      `txn_cache_${userId}_${isManagement ? "mgmt" : isProcurement ? "proc" : isAOTL ? "aotl" : "ao"}`,
    [userId, isManagement, isProcurement, isAOTL],
  );

  const TXN_CACHE_TTL = 60 * 1000;

  const readCache = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > TXN_CACHE_TTL) return null;
      return data;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const writeCache = useCallback(
    (data) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      } catch { /* storage full */ }
    },
    [cacheKey],
  );

  // ── Transactions state ────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState(() => readCache() || []);
  const [countLoading, setCountLoading] = useState(() => !readCache());

  // ── Silent background fetch ───────────────────────────────────────────────
  const fetchSilent = useCallback(async () => {
    if (mappingLoading) return;
    try {
      let list = [];
      if (isManagement) {
        const res = await api.get("transactions");
        list = res.transactions || res.data || [];
      } else if (isProcurement) {
        const res = await api.get(`transaction/procurement?nUserId=${userId}`);
        list = res.transactions || [];
      } else {
        const res = await api.get(
          `transaction/account_officer?nUserId=${userId}&isAOTL=${isAOTL ? 1 : 0}&fetchAll=${isAOTL ? 1 : 0}`,
        );
        list = res.transactions || [];
      }
      writeCache(list);
      setTransactions(list);
      window.dispatchEvent(new CustomEvent("txn_cache_updated"));
    } catch (err) {
      console.error("Sidebar silent fetch error:", err);
    }
  }, [mappingLoading, isManagement, isProcurement, isAOTL, userId, writeCache]);

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;
    const cached = readCache();
    if (cached) {
      setTransactions(cached);
      setCountLoading(false);
      fetchSilent();
    } else {
      setCountLoading(true);
      fetchSilent().finally(() => setCountLoading(false));
    }
  }, [mappingLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cache updated event ───────────────────────────────────────────────────
  useEffect(() => {
    const onCacheUpdated = () => {
      const fresh = readCache();
      if (fresh) setTransactions(fresh);
    };
    window.addEventListener("txn_cache_updated", onCacheUpdated);
    return () => window.removeEventListener("txn_cache_updated", onCacheUpdated);
  }, [readCache]);

  // ── Laravel Echo broadcast ────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;
    const channel = echo.channel("transactions");
    channel.listen(".transaction.updated", (event) => {
      if (event.action === "deleted") {
        setTransactions((prev) =>
          prev.filter((t) => (t.nTransactionId ?? t.id) !== event.transactionId),
        );
        return;
      }
      fetchSilent();
    });
    return () => { echo.leaveChannel("transactions"); };
  }, [mappingLoading, fetchSilent]);

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    if (!Object.keys(statusMap).length) return {};
    const counts = {};
    Object.entries(statusMap).forEach(([code, label]) => {
      const txnLabel = statusMap[forAssignmentKey];

      if (label === txnLabel) {
        const groupedCodes = [
          String(forAssignmentKey),
          String(itemsManagementKey),
          String(itemsVerificationKey),
          String(forCanvasKey),
        ];
        counts[code] = transactions.filter((t) =>
          groupedCodes.includes(String(t.latest_history?.nStatus ?? "")),
        ).length;

      } else if (
        label === statusMap[itemsVerificationKey] ||
        label === statusMap[canvasVerificationKey]
      ) {
        const verCodes = [String(itemsVerificationKey), String(canvasVerificationKey)];
        if (isAOTL) {
          counts[code] = transactions.filter(
            (t) =>
              verCodes.includes(String(t.latest_history?.nStatus ?? "")) &&
              String(t.nUserId ?? t.nAssignedAO ?? "") === String(userId),
          ).length;
        } else {
          counts[code] = transactions.filter((t) =>
            verCodes.includes(String(t.latest_history?.nStatus ?? "")),
          ).length;
        }

      } else {
        if (isAOTL && [String(itemsManagementKey), String(forCanvasKey)].includes(String(code))) {
          counts[code] = transactions.filter(
            (t) =>
              String(t.latest_history?.nStatus ?? "") === String(code) &&
              String(t.nUserId ?? t.nAssignedAO ?? "") === String(userId),
          ).length;
        } else {
          counts[code] = transactions.filter(
            (t) => String(t.latest_history?.nStatus ?? "") === String(code),
          ).length;
        }
      }
    });
    return counts;
  }, [
    transactions,
    statusMap,
    forAssignmentKey,
    itemsManagementKey,
    itemsVerificationKey,
    forCanvasKey,
    canvasVerificationKey,
    isAOTL,
    userId,
  ]);

  if (mappingLoading) {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", pl: 3, minHeight: 32 }}>
            <Skeleton variant="text" width="60%" height={13} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </>
    );
  }

  return (
    <>
      {Object.entries(statusMap).map(([code, label]) => (
        <SidebarSubmenu
          key={code}
          label={label}
          active={isOnTransactionPage && selectedCode === String(code)}
          count={statusCounts[code] || 0}
          countLoading={countLoading}
          onClick={() => onSelect(String(code))}
        />
      ))}
    </>
  );
};

/* ── Transaction nav ── */
const TransactionNav = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const {
    ao_status,
    aotl_status,
    proc_status,
    transacstatus,
    userTypes,
    loading: mappingLoading,
  } = useMapping();

  // ── Single source of truth for role flags ──────────────────────────────────
  const { isManagement, isProcurement, isAOTL } = getUserRoles(userTypes);

  const sessionKey = isManagement
    ? "selectedStatusCode"
    : isProcurement
      ? "selectedProcStatusCode"
      : "selectedAOStatusCode";

  const statusMap = useMemo(
    () =>
      isManagement
        ? transacstatus
        : isProcurement
          ? proc_status
          : isAOTL
            ? aotl_status
            : ao_status,
    [isManagement, isProcurement, isAOTL, transacstatus, proc_status, aotl_status, ao_status],
  );

  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(sessionKey) || Object.keys(statusMap)[0] || "",
  );

  useEffect(() => {
    if (!mappingLoading && Object.keys(statusMap).length > 0 && !selectedCode)
      setSelectedCode(Object.keys(statusMap)[0]);
  }, [mappingLoading, statusMap, selectedCode]);

  useEffect(() => {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) setSelectedCode(saved);
  }, [location.key, sessionKey]);

  useEffect(() => {
    const onStatusChanged = (e) => {
      const code = e.detail?.code;
      if (code) {
        sessionStorage.setItem(sessionKey, code);
        setSelectedCode(code);
      }
    };
    window.addEventListener("txn_status_changed", onStatusChanged);
    return () => window.removeEventListener("txn_status_changed", onStatusChanged);
  }, [sessionKey]);

  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(sessionKey, code);
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
  );
};

/* ── TransactionNavSection ── */
const TransactionNavSection = ({ collapsed, forceExpanded, onItemClick }) => (
  <div className="flex flex-col w-full mb-1.5">
    {(!collapsed || forceExpanded) && (
      <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
        TRANSACTION
      </span>
    )}
    <TransactionNav
      collapsed={collapsed}
      forceExpanded={forceExpanded}
      onItemClick={onItemClick}
    />
  </div>
);

/* ── Main SidebarContent ── */
const SidebarContent = ({ collapsed, forceExpanded = false, onItemClick }) => {
  const layoutClass = forceExpanded ? "items-start" : collapsed ? "items-center" : "items-start";

  const { userTypes } = useMapping();

  // ── Single source of truth for role flags ──────────────────────────────────
  const { isManagement, isProcurement, isAccountOfficer } = getUserRoles(userTypes);

  const isLoading = !userTypes || Object.keys(userTypes).length === 0;

  return (
    <div className={`pl-2 pr-2 pt-2 flex flex-col ${layoutClass} h-full w-full`}>
      {/* Header */}
      <div className="flex-none sticky top-0 bg-white z-10 w-full">
        <SidebarHeader collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>

      {/* Middle */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 w-full scrollbar-hide">
        {isLoading ? (
          <Box sx={{ pt: 1 }}>
            <SidebarSectionSkeleton collapsed={collapsed} forceExpanded={forceExpanded} itemCount={2} />
            <SidebarSectionSkeleton collapsed={collapsed} forceExpanded={forceExpanded} itemCount={4} />
            <SidebarSectionSkeleton collapsed={collapsed} forceExpanded={forceExpanded} itemCount={2} />
          </Box>
        ) : (
          <>
            <SidebarSection
              title="OVERVIEW"
              items={[{ icon: <DashboardIcon fontSize="small" />, label: "Dashboard", to: "/dashboard" }]}
              collapsed={collapsed}
              forceExpanded={forceExpanded}
              onClick={onItemClick}
            />

            {/* ── Management ── */}
            {isManagement && (
              <>
                <SidebarSection
                  title="MANAGEMENT"
                  items={[
                    { icon: <PeopleIcon fontSize="small" />,        label: "User",     to: "/user" },
                    { icon: <BusinessIcon fontSize="small" />,       label: "Company",  to: "/company" },
                    { icon: <PersonIcon fontSize="small" />,         label: "Client",   to: "/client" },
                    { icon: <LocalShippingIcon fontSize="small" />,  label: "Supplier", to: "/supplier" },
                  ]}
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onClick={onItemClick}
                />
                <TransactionNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />
                <SidebarItem
                  icon={<LocalAtmIcon fontSize="small" />}
                  label="Direct Cost Options"
                  to="/direct-cost"
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onClick={onItemClick}
                />
              </>
            )}

            {/* ── Procurement ── */}
            {isProcurement && (
              <>
                <SidebarSection
                  title="MANAGEMENT"
                  items={[
                    { icon: <PersonIcon fontSize="small" />, label: "Client", to: "/client" },
                  ]}
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onClick={onItemClick}
                />
                <TransactionNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />
              </>
            )}

            {/* ── Account Officer (AO + AOTL) ── */}
            {isAccountOfficer && (
              <>
                <SidebarSection
                  title="MANAGEMENT"
                  items={[
                    { icon: <LocalShippingIcon fontSize="small" />, label: "Supplier", to: "/supplier" },
                  ]}
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onClick={onItemClick}
                />
                <TransactionNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom */}
      <div className="flex-none sticky bottom-0 w-full pt-1 border-t border-gray-200 bg-white z-10">
        <SidebarOthers collapsed={collapsed} forceExpanded={forceExpanded} onItemClick={onItemClick} />
        <SidebarProfile collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>
    </div>
  );
};

export default SidebarContent;