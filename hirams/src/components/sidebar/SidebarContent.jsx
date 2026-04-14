import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
import { TXN_CACHE_TTL } from "../../utils/constants/cache";

/* ── Skeleton: single item ── */
const SidebarItemSkeleton = ({ collapsed, forceExpanded }) => {
  const isCollapsed = collapsed && !forceExpanded;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        minHeight: 32,
      }}
    >
      <Skeleton
        variant="circular"
        width={16}
        height={16}
        sx={{ flexShrink: 0 }}
      />
      {!isCollapsed && (
        <Skeleton
          variant="text"
          width="65%"
          height={14}
          sx={{ borderRadius: 1 }}
        />
      )}
    </Box>
  );
};

/* ── Skeleton: section ── */
const SidebarSectionSkeleton = ({
  collapsed,
  forceExpanded,
  itemCount = 3,
}) => {
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
        <SidebarItemSkeleton
          key={i}
          collapsed={collapsed}
          forceExpanded={forceExpanded}
        />
      ))}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic status sub-items (used by User, Client, Supplier)
// ─────────────────────────────────────────────────────────────────────────────
const StatusSubItems = ({
  statusMap, // { code: label }
  items, // raw array fetched from API
  selectedCode, // currently selected status code string
  onSelect, // (code) => void
  isOnPage, // boolean — are we on the target page?
  statusCodeKey = "statusCode", // key on each item that holds the status code
  countLoading,
}) => (
  <>
    {Object.entries(statusMap).map(([code, label]) => {
      const count = items.filter(
        (item) => String(item[statusCodeKey]) === String(code),
      ).length;
      return (
        <SidebarSubmenu
          key={code}
          label={label}
          active={isOnPage && selectedCode === String(code)}
          count={count}
          countLoading={countLoading}
          onClick={() => onSelect(String(code))}
        />
      );
    })}
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// User Nav
// ─────────────────────────────────────────────────────────────────────────────
const UserNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { statuses, userTypes, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedUserStatusCode";
  const firstCode = Object.keys(statuses)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || firstCode,
  );
  const [users, setUsers] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/user";

  // ── Sync selectedCode from sessionStorage on route change ────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  // ── Listen for status changes dispatched by User.jsx ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (code) {
        sessionStorage.setItem(SESSION_KEY, code);
        setSelectedCode(code);
      }
    };
    window.addEventListener("user_status_changed", handler);
    return () => window.removeEventListener("user_status_changed", handler);
  }, []);

  // ── fetchUsers — defined first so fetchRef can reference it ──────────────
  const fetchUsers = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await api.get("users");
      setUsers(res.users || []);
    } catch (err) {
      console.error("Sidebar user fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  // ── Ref keeps Echo listener closure from going stale ─────────────────────
  const fetchRef = useRef(fetchUsers);
  useEffect(() => {
    fetchRef.current = fetchUsers;
  }); // no deps — always current

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mappingLoading) fetchUsers();
  }, [mappingLoading, fetchUsers]);

  // ── Echo — stable listener, ref handles stale closure ────────────────────
  useEffect(() => {
    if (mappingLoading) return;
    const channel = echo.channel("users");
    channel.listen(".user.updated", (event) => {
      if (event.action === "deleted") {
        setUsers((prev) => prev.filter((u) => u.nUserId !== event.userId));
        window.dispatchEvent(
          new CustomEvent("user_data_deleted", {
            detail: { userId: event.userId },
          }),
        );
        return;
      }
      fetchRef.current(); // ✅ always fresh, no stale closure
      window.dispatchEvent(new CustomEvent("user_data_updated"));
    });
    return () => {
      echo.leaveChannel("users");
    };
  }, [mappingLoading]); // ✅ stable — only re-runs if mappingLoading changes

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/user");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("user_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(statuses)[0];
    if (first) handleSelect(first);
  }, [statuses, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<PeopleIcon fontSize="small" />}
        label="Users"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <StatusSubItems
          statusMap={statuses}
          items={users.map((u) => ({ statusCode: u.cStatus }))}
          selectedCode={selectedCode}
          onSelect={handleSelect}
          isOnPage={isOnPage}
          countLoading={countLoading}
        />
      </SidebarItem>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ClientNavSection — drop-in replacement inside SidebarContent.jsx
//
// Fix applied: the Echo useEffect previously had [mappingLoading, fetchClients]
// as its deps. Because fetchClients is a useCallback that rebuilds whenever
// mappingLoading changes, the channel was being left and re-joined on every
// mapping toggle, risking duplicate listeners and missed events.
//
// Solution (mirrors UserNavSection): keep a fetchRef that is always updated to
// the latest fetchClients, then make the Echo useEffect depend only on
// [mappingLoading]. The ref guarantees the listener never holds a stale closure.
// ─────────────────────────────────────────────────────────────────────────────

const ClientNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientstatus, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedClientStatusCode";
  const firstCode = Object.keys(clientstatus)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || firstCode,
  );
  const [clients, setClients] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/client";

  // ── Sync selectedCode when navigating back to this route ─────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  // ── Listen for status changes dispatched by Client.jsx ───────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("client_status_changed", handler);
    return () => window.removeEventListener("client_status_changed", handler);
  }, []);

  // ── fetchClients — stable, only rebuilds when mappingLoading changes ──────
  const fetchClients = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await api.get("clients");
      setClients(res.clients || []);
    } catch (err) {
      console.error("Sidebar client fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  // ── Ref keeps Echo listener closure from going stale ─────────────────────
  const fetchRef = useRef(fetchClients);
  useEffect(() => {
    fetchRef.current = fetchClients;
  }, [fetchClients]); // updates whenever fetchClients rebuilds

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading, fetchClients]);

  // ── Echo — dep is [mappingLoading] only; ref handles stale closure ────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("clients");

    channel.listen(".client.updated", (event) => {
      if (event.action === "deleted") {
        setClients((prev) =>
          prev.filter((c) => c.nClientId !== event.clientId),
        );
        window.dispatchEvent(
          new CustomEvent("client_data_deleted", {
            detail: { clientId: event.clientId },
          }),
        );
        return;
      }
      fetchRef.current(); // ✅ always fresh, never stale
      window.dispatchEvent(new CustomEvent("client_data_updated"));
    });

    return () => {
      echo.leaveChannel("clients");
    };
  }, [mappingLoading]); // ✅ stable — only re-runs if mappingLoading changes

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/client");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("client_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(clientstatus)[0];
    if (first) handleSelect(first);
  }, [clientstatus, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<PersonIcon fontSize="small" />}
        label="Clients"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <StatusSubItems
          statusMap={clientstatus}
          items={clients.map((c) => ({ statusCode: c.cStatus }))}
          selectedCode={selectedCode}
          onSelect={handleSelect}
          isOnPage={isOnPage}
          countLoading={countLoading}
        />
      </SidebarItem>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// Supplier Nav
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Supplier Nav
// ─────────────────────────────────────────────────────────────────────────────
// Fix applied: mirrors UserNavSection and ClientNavSection patterns
//
// Previous issue: Echo useEffect had [mappingLoading, fetchSuppliers] as deps.
// Because fetchSuppliers is a useCallback that rebuilds whenever mappingLoading
// changes, the channel was being left and re-joined on every toggle, risking
// duplicate listeners and missed events.
//
// Solution: keep a fetchRef that is always updated to the latest fetchSuppliers,
// then make the Echo useEffect depend only on [mappingLoading]. The ref guarantees
// the listener never holds a stale closure.
// ─────────────────────────────────────────────────────────────────────────────

const SupplierNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientstatus, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedSupplierStatusCode";
  const firstCode = Object.keys(clientstatus)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || firstCode,
  );
  const [suppliers, setSuppliers] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/supplier";

  // ── Sync selectedCode when navigating back to this route ─────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  // ── Listen for status changes dispatched by Supplier.jsx ────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("supplier_status_changed", handler);
    return () => window.removeEventListener("supplier_status_changed", handler);
  }, []);

  // ── fetchSuppliers — stable, only rebuilds when mappingLoading changes ────
  const fetchSuppliers = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await api.get("suppliers");
      setSuppliers(res.suppliers || []);
    } catch (err) {
      console.error("Sidebar supplier fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  // ── Ref keeps Echo listener closure from going stale ─────────────────────
  const fetchRef = useRef(fetchSuppliers);
  useEffect(() => {
    fetchRef.current = fetchSuppliers;
  }, [fetchSuppliers]); // updates whenever fetchSuppliers rebuilds

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mappingLoading) fetchSuppliers();
  }, [mappingLoading, fetchSuppliers]);

  // ── Echo — dep is [mappingLoading] only; ref handles stale closure ────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("suppliers");

    channel.listen(".supplier.updated", (event) => {
      if (event.action === "deleted") {
        setSuppliers((prev) =>
          prev.filter((s) => s.nSupplierId !== event.supplierId),
        );
        window.dispatchEvent(
          new CustomEvent("supplier_data_deleted", {
            detail: { supplierId: event.supplierId },
          }),
        );
        return;
      }
      fetchRef.current(); // ✅ always fresh, never stale
      window.dispatchEvent(new CustomEvent("supplier_data_updated"));
    });

    return () => {
      echo.leaveChannel("suppliers");
    };
  }, [mappingLoading]); // ✅ stable — only re-runs if mappingLoading changes

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/supplier");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("supplier_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(clientstatus)[0];
    if (first) handleSelect(first);
  }, [clientstatus, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<LocalShippingIcon fontSize="small" />}
        label="Suppliers"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <StatusSubItems
          statusMap={clientstatus}
          items={suppliers.map((s) => ({ statusCode: s.cStatus }))}
          selectedCode={selectedCode}
          onSelect={handleSelect}
          isOnPage={isOnPage}
          countLoading={countLoading}
        />
      </SidebarItem>
    </div>
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

const { isManagement, isProcurement, isAOTL, isProcurementTL } = getUserRoles(userTypes);
  const statusMap = useMemo(
    () =>
      isManagement
        ? transacstatus
        : isProcurement
          ? proc_status
          : isAOTL
            ? aotl_status
            : ao_status,
    [
      isManagement,
      isProcurement,
      isAOTL,
      transacstatus,
      proc_status,
      aotl_status,
      ao_status,
    ],
  );

  const isOnTransactionPage =
    location.pathname === "/transaction" ||
    location.pathname === "/transaction-canvas" ||
    location.pathname === "/transaction-pricing-set" ||
    location.pathname === "/transaction-pricing";

  const statusKeys = useMemo(() => {
    const mgmtKeys = Object.keys(transacstatus);
    const procKeys = Object.keys(proc_status);
    const aoKeys = Object.keys(ao_status);
    const aotlKeys = Object.keys(aotl_status);

    return {
      draftKey: isManagement ? mgmtKeys[0] : isProcurement ? procKeys[0] : "",
      finalizeKey: isManagement
        ? mgmtKeys[1]
        : isProcurement
          ? procKeys[1]
          : "",
      forAssignmentKey: isManagement ? mgmtKeys[2] : isAOTL ? aotlKeys[0] : "",

      itemsManagementKey: isManagement
        ? mgmtKeys[3]
        : isAOTL
          ? aotlKeys[1]
          : aoKeys[0],
      itemsFinalizeKey: isManagement
        ? mgmtKeys[4]
        : isAOTL
          ? aotlKeys[2]
          : aoKeys[1],
      itemsVerificationKey: isManagement
        ? mgmtKeys[4]
        : isAOTL
          ? aotlKeys[3]
          : aoKeys[2],

      forCanvasKey: isManagement
        ? mgmtKeys[5]
        : isAOTL
          ? aotlKeys[4]
          : aoKeys[3],
      canvasFinalizeKey: isAOTL ? aotlKeys[5] : aoKeys[4],
      canvasVerificationKey: isManagement
        ? mgmtKeys[6]
        : isAOTL
          ? aotlKeys[6]
          : aoKeys[5],

      forPricingKey: isManagement ? mgmtKeys[7] : "",
      priceVerificationKey: isManagement ? mgmtKeys[8] : "",
      priceApprovalKey: isManagement ? mgmtKeys[9] : "",

      finalizeVerificationKey: isProcurement ? procKeys[2] : "",
      priceSettingKey: isProcurement ? procKeys[3] : "",
      priceFinalizeKey: isProcurement ? procKeys[4] : "",
      priceFinalizeVerificationKey: isProcurement ? procKeys[5] : "",
      procPriceApprovalKey: isProcurement ? procKeys[6] : "",
    };
  }, [
    isManagement,
    isProcurement,
    isAOTL,
    transacstatus,
    proc_status,
    ao_status,
    aotl_status,
  ]);

  const {
    draftKey,
    finalizeKey,
    forAssignmentKey,
    itemsManagementKey,
    itemsFinalizeKey,
    itemsVerificationKey,
    forCanvasKey,
    canvasFinalizeKey,
    canvasVerificationKey,
    forPricingKey,
    priceVerificationKey,
    priceApprovalKey,
    finalizeVerificationKey,
    priceSettingKey,
    priceFinalizeKey,
    priceFinalizeVerificationKey,
    procPriceApprovalKey,
  } = statusKeys;

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

  // ✅ Use imported TXN_CACHE_TTL — no local redefinition

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
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() }),
        );
      } catch {
        /* storage full */
      }
    },
    [cacheKey],
  );

  const [transactions, setTransactions] = useState(() => readCache() || []);
  const [countLoading, setCountLoading] = useState(() => !readCache());

  // ✅ fetchSilent definition
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

  // ✅ Ref to always hold latest fetchSilent — prevents stale closures in Echo
  const fetchSilentRef = useRef(fetchSilent);
  useEffect(() => {
    fetchSilentRef.current = fetchSilent;
  }, [fetchSilent]);

  // ✅ Cache init — runs once when mappings are ready
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

  // ✅ Single Echo listener — uses fetchSilentRef, no stale closure, no duplicate listener
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("transactions");

    channel.listen(".transaction.updated", (event) => {
      if (event.action === "deleted") {
        setTransactions((prev) => {
          const updated = prev.filter(
            (t) => (t.nTransactionId ?? t.id) !== event.transactionId,
          );
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ data: updated, timestamp: Date.now() }),
            );
          } catch {
            /* storage full */
          }
          return updated;
        });
        window.dispatchEvent(
          new CustomEvent("txn_data_deleted", {
            detail: { transactionId: event.transactionId },
          }),
        );
        return;
      }

      fetchSilentRef.current(); // ✅ always latest, never stale
      window.dispatchEvent(new CustomEvent("txn_data_updated"));
    });

    return () => {
      echo.leaveChannel("transactions");
    };
  }, [mappingLoading]); // ✅ only mappingLoading — ref handles fetchSilent updates

  // ✅ Sync from cache when sidebar's own fetch updates it
  useEffect(() => {
    const onCacheUpdated = () => {
      const fresh = readCache();
      if (fresh) setTransactions(fresh);
    };
    window.addEventListener("txn_cache_updated", onCacheUpdated);
    return () =>
      window.removeEventListener("txn_cache_updated", onCacheUpdated);
  }, [readCache]);

  const statusCounts = useMemo(() => {
    if (!Object.keys(statusMap).length) return {};

    const txnCode = (t) =>
      String(t.current_status ?? t.latest_history?.nStatus ?? "");
    const isMe = (t) => String(t.nAssignedAO ?? "") === String(userId);
    const isMine = (t) => String(t.creator_id ?? "") === String(userId);

    const counts = {};

    if (isManagement) {
      Object.keys(statusMap).forEach((code) => {
        if (code === forAssignmentKey) {
          counts[code] = transactions.filter((t) =>
            ["200", "210", "220", "230", "240"].includes(txnCode(t)),
          ).length;
        } else {
          counts[code] = transactions.filter(
            (t) => txnCode(t) === String(code),
          ).length;
        }
      });
      return counts;
    }

    if (isProcurement) {
      Object.keys(statusMap).forEach((code) => {
        switch (code) {
          case draftKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMine(t),
            ).length;
            break;
          case finalizeKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMine(t),
            ).length;
            break;
          case finalizeVerificationKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code,
            ).length; 
            break;
          case priceSettingKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && (isProcurementTL || isMine(t)),
            ).length;
            break;
          case priceFinalizeKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMine(t),
            ).length;
            break;
          case priceFinalizeVerificationKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code,
            ).length;
            break;
          case procPriceApprovalKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMine(t),
            ).length;
            break;
          default:
            counts[code] = 0;
        }
      });
      return counts;
    }

    if (isAOTL) {
      Object.keys(statusMap).forEach((code) => {
        switch (code) {
          case forAssignmentKey:
            counts[code] = transactions.filter((t) =>
              ["200", "210", "220", "225", "230", "240", "245"].includes(
                txnCode(t),
              ),
            ).length;
            break;
          case itemsManagementKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMe(t),
            ).length;
            break;
          case itemsFinalizeKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMe(t),
            ).length;
            break;
          case itemsVerificationKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code,
            ).length;
            break;
          case forCanvasKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMe(t),
            ).length;
            break;
          case canvasFinalizeKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMe(t),
            ).length;
            break;
          case canvasVerificationKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code,
            ).length;
            break;
          default:
            counts[code] = 0;
        }
      });
      return counts;
    }

    // ✅ Account Officer
    Object.keys(statusMap).forEach((code) => {
      switch (code) {
        case itemsManagementKey:
          counts[code] = transactions.filter(
            (t) => txnCode(t) === code && isMe(t),
          ).length;
          break;
        case itemsFinalizeKey:
          counts[code] = transactions.filter(
            (t) => txnCode(t) === code && isMe(t),
          ).length;
          break;
        case itemsVerificationKey:
          counts[code] = transactions.filter((t) => txnCode(t) === code).length;
          break;
        case forCanvasKey:
          counts[code] = transactions.filter(
            (t) => txnCode(t) === code && isMe(t),
          ).length;
          break;
        case canvasFinalizeKey:
          counts[code] = transactions.filter(
            (t) => txnCode(t) === code && isMe(t),
          ).length;
          break;
        case canvasVerificationKey:
          counts[code] = transactions.filter((t) => txnCode(t) === code).length;
          break;
        default:
          counts[code] = 0;
      }
    });
    return counts;
  }, [
    transactions,
    statusMap,
    isManagement,
    isProcurement,
    isProcurementTL,
    isAOTL,
    userId,
    forAssignmentKey,
    itemsManagementKey,
    itemsFinalizeKey,
    itemsVerificationKey,
    forCanvasKey,
    canvasFinalizeKey,
    canvasVerificationKey,
    draftKey,
    finalizeKey,
    finalizeVerificationKey,
    priceSettingKey,
    priceFinalizeKey,
    priceFinalizeVerificationKey,
    procPriceApprovalKey,
  ]);

  if (mappingLoading) {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{ display: "flex", alignItems: "center", pl: 3, minHeight: 32 }}
          >
            <Skeleton
              variant="text"
              width="60%"
              height={13}
              sx={{ borderRadius: 1 }}
            />
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
  const navigate = useNavigate();
  const location = useLocation();

  const {
    ao_status,
    aotl_status,
    proc_status,
    transacstatus,
    userTypes,
    loading: mappingLoading,
  } = useMapping();

  const { isManagement, isProcurement, isAOTL, isProcurementTL } =
    getUserRoles(userTypes);
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
    [
      isManagement,
      isProcurement,
      isAOTL,
      transacstatus,
      proc_status,
      aotl_status,
      ao_status,
    ],
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
    return () =>
      window.removeEventListener("txn_status_changed", onStatusChanged);
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
  const layoutClass = forceExpanded
    ? "items-start"
    : collapsed
      ? "items-center"
      : "items-start";

  const { userTypes } = useMapping();
  const { isManagement, isProcurement, isAccountOfficer } =
    getUserRoles(userTypes);
  const isLoading = !userTypes || Object.keys(userTypes).length === 0;

  return (
    <div
      className={`pl-2 pr-2 pt-2 flex flex-col ${layoutClass} h-full w-full`}
    >
      {/* Header */}
      <div className="flex-none sticky top-0 bg-white z-10 w-full">
        <SidebarHeader collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>

      {/* Middle */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 w-full scrollbar-hide">
        {isLoading ? (
          <Box sx={{ pt: 1 }}>
            <SidebarSectionSkeleton
              collapsed={collapsed}
              forceExpanded={forceExpanded}
              itemCount={2}
            />
            <SidebarSectionSkeleton
              collapsed={collapsed}
              forceExpanded={forceExpanded}
              itemCount={4}
            />
            <SidebarSectionSkeleton
              collapsed={collapsed}
              forceExpanded={forceExpanded}
              itemCount={2}
            />
          </Box>
        ) : (
          <>
            <SidebarSection
              title="OVERVIEW"
              items={[
                {
                  icon: <DashboardIcon fontSize="small" />,
                  label: "Dashboard",
                  to: "/dashboard",
                },
              ]}
              collapsed={collapsed}
              forceExpanded={forceExpanded}
              onClick={onItemClick}
            />

            {/* ── Management ── */}
            {isManagement && (
              <>
                <div className="flex flex-col w-full mb-1.5">
                  {(!collapsed || forceExpanded) && (
                    <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
                      MANAGEMENT
                    </span>
                  )}
                  <UserNavSection
                    collapsed={collapsed}
                    forceExpanded={forceExpanded}
                    onItemClick={onItemClick}
                  />
                  <ClientNavSection
                    collapsed={collapsed}
                    forceExpanded={forceExpanded}
                    onItemClick={onItemClick}
                  />
                  <SupplierNavSection
                    collapsed={collapsed}
                    forceExpanded={forceExpanded}
                    onItemClick={onItemClick}
                  />
                  <SidebarItem
                    icon={<BusinessIcon fontSize="small" />}
                    label="Company"
                    to="/company"
                    collapsed={collapsed}
                    forceExpanded={forceExpanded}
                    onClick={onItemClick}
                  />
                </div>
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
                <div className="flex flex-col w-full mb-1.5">
                  {(!collapsed || forceExpanded) && (
                    <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
                      MANAGEMENT
                    </span>
                  )}
                  <ClientNavSection
                    collapsed={collapsed}
                    forceExpanded={forceExpanded}
                    onItemClick={onItemClick}
                  />
                </div>
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
                <div className="flex flex-col w-full mb-1.5">
                  {(!collapsed || forceExpanded) && (
                    <span className="text-gray-400 uppercase text-[10px] tracking-wider mb-0.5 px-0.5">
                      MANAGEMENT
                    </span>
                  )}
                  <SupplierNavSection
                    collapsed={collapsed}
                    forceExpanded={forceExpanded}
                    onItemClick={onItemClick}
                  />
                </div>
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
        <SidebarOthers
          collapsed={collapsed}
          forceExpanded={forceExpanded}
          onItemClick={onItemClick}
        />
        <SidebarProfile collapsed={collapsed} forceExpanded={forceExpanded} />
      </div>
    </div>
  );
};

export default SidebarContent;
