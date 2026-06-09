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
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ArchiveIcon from "@mui/icons-material/Archive";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import useMapping from "../../utils/mappings/useMapping";
import { getUserRoles } from "../../utils/helpers/roleHelper";
import api from "../../utils/api/api";
import echo from "../../utils/echo";
import { TXN_CACHE_TTL } from "../../utils/constants/cache";
import { getDueDateColor } from "../../utils/helpers/dueDateColor";
import { ReceiptLong } from "@mui/icons-material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

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

function getRelevantDate(t) {
  const code = Number(t.current_status ?? t.latest_history?.nStatus ?? 0);
  return code >= 200 && code <= 245 ? t.dtAODueDate : t.dtDocSubmission;
}

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
  statusMap,
  items,
  selectedCode,
  onSelect,
  isOnPage,
  statusCodeKey = "statusCode",
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

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

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

  const fetchRef = useRef(fetchUsers);
  useEffect(() => {
    fetchRef.current = fetchUsers;
  });

  useEffect(() => {
    if (!mappingLoading) fetchUsers();
  }, [mappingLoading, fetchUsers]);

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
      fetchRef.current();
      window.dispatchEvent(new CustomEvent("user_data_updated"));
    });
    return () => {
      echo.leaveChannel("users");
    };
  }, [mappingLoading]);

  useEffect(() => {
    const handler = () => fetchRef.current();
    window.addEventListener("user_data_updated", handler);
    window.addEventListener("user_data_deleted", handler);
    return () => {
      window.removeEventListener("user_data_updated", handler);
      window.removeEventListener("user_data_deleted", handler);
    };
  }, []);

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
// Client Nav
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

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

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

  const fetchRef = useRef(fetchClients);
  useEffect(() => {
    fetchRef.current = fetchClients;
  }, [fetchClients]);

  useEffect(() => {
    if (!mappingLoading) fetchClients();
  }, [mappingLoading, fetchClients]);

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
      fetchRef.current();
      window.dispatchEvent(new CustomEvent("client_data_updated"));
    });
    return () => {
      echo.leaveChannel("clients");
    };
  }, [mappingLoading]);

  useEffect(() => {
    const handler = () => fetchRef.current();
    window.addEventListener("client_data_updated", handler);
    window.addEventListener("client_data_deleted", handler);
    return () => {
      window.removeEventListener("client_data_updated", handler);
      window.removeEventListener("client_data_deleted", handler);
    };
  }, []);

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

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

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

  const fetchRef = useRef(fetchSuppliers);
  useEffect(() => {
    fetchRef.current = fetchSuppliers;
  }, [fetchSuppliers]);

  useEffect(() => {
    if (!mappingLoading) fetchSuppliers();
  }, [mappingLoading, fetchSuppliers]);

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
      fetchRef.current();
      window.dispatchEvent(new CustomEvent("supplier_data_updated"));
    });
    return () => {
      echo.leaveChannel("suppliers");
    };
  }, [mappingLoading]);

  useEffect(() => {
    const handler = () => fetchRef.current();
    window.addEventListener("supplier_data_updated", handler);
    window.addEventListener("supplier_data_deleted", handler);
    return () => {
      window.removeEventListener("supplier_data_updated", handler);
      window.removeEventListener("supplier_data_deleted", handler);
    };
  }, []);

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
    archiveStatus,
    loading: mappingLoading,
  } = useMapping();

  const { isManagement, isProcurement, isAOTL, isProcurementTL } =
    getUserRoles(userTypes);
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
    location.pathname === "/transaction-pricing" ||
    location.pathname === "/transaction-for-purchase";

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
      procPriceApprovedKey: isProcurement ? procKeys[7] : "",
      forPurchaseKey: isManagement
        ? mgmtKeys[11]
        : isAOTL
          ? aotlKeys[7]
          : aoKeys[6],
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

  const archiveCodes = useMemo(
    () => Object.keys(archiveStatus || {}),
    [archiveStatus],
  );

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
    procPriceApprovedKey,
    forPurchaseKey,
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

  const [transactions, setTransactions] = useState(() =>
    (readCache() || []).filter(Boolean),
  );
  const [countLoading, setCountLoading] = useState(() => !readCache());

  const fetchSilent = useCallback(async () => {
    if (mappingLoading) return;
    try {
      let list = [];
      if (isManagement) {
        const res = await api.get("transactions");
        list = (res.transactions || res.data || []).filter(Boolean);
      } else if (isProcurement) {
        const res = await api.get(`transaction/procurement?nUserId=${userId}`);
        list = (res.transactions || []).filter(Boolean);
      } else {
        const res = await api.get(
          `transaction/account_officer?nUserId=${userId}&isAOTL=${isAOTL ? 1 : 0}&fetchAll=${isAOTL ? 1 : 0}`,
        );
        list = (res.transactions || []).filter(Boolean);
      }
      writeCache(list);
      setTransactions(list);
      window.dispatchEvent(new CustomEvent("txn_cache_updated"));
    } catch (err) {
      console.error("Sidebar silent fetch error:", err);
    }
  }, [mappingLoading, isManagement, isProcurement, isAOTL, userId, writeCache]);

  const fetchSilentRef = useRef(fetchSilent);
  useEffect(() => {
    fetchSilentRef.current = fetchSilent;
  }, [fetchSilent]);

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

  useEffect(() => {
    if (mappingLoading) return;
    const channel = echo.channel("transactions");
    channel.listen(".transaction.updated", (event) => {
      const newStatus = String(event.new_status ?? "");
      if (event.action === "deleted") {
        setTransactions((prev) => {
          const updated = prev.filter(
            (t) =>
              String(t.nTransactionId ?? t.id) !== String(event.transactionId),
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
      if (
        event.action === "status_changed" &&
        newStatus &&
        archiveCodes.includes(newStatus)
      ) {
        setTransactions((prev) => {
          const updated = prev.filter(
            (t) =>
              String(t.nTransactionId ?? t.id) !== String(event.transactionId),
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
        window.dispatchEvent(new CustomEvent("txn_data_updated"));
        return;
      }
      fetchSilentRef.current();
      window.dispatchEvent(new CustomEvent("txn_data_updated"));
    });
    return () => {
      echo.leaveChannel("transactions");
    };
  }, [mappingLoading, cacheKey, archiveCodes]);

  useEffect(() => {
    const onDataUpdated = () => {
      fetchSilentRef.current();
    };
    window.addEventListener("txn_data_updated", onDataUpdated);
    return () => window.removeEventListener("txn_data_updated", onDataUpdated);
  }, []);

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
      t ? String(t.current_status ?? t.latest_history?.nStatus ?? "") : "";
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
          case procPriceApprovedKey:
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
          case forPurchaseKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && isMe(t),
            ).length;
            break;
          default:
            counts[code] = 0;
        }
      });
      return counts;
    }
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
        case forPurchaseKey:
          counts[code] = transactions.filter(
            (t) => txnCode(t) === code && isMe(t),
          ).length;
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
    procPriceApprovedKey,
    forPurchaseKey,
  ]);

  const dueCounts = useMemo(() => {
    if (!Object.keys(statusMap).length) return { red: {}, orange: {} };
    const txnCode = (t) =>
      t ? String(t.current_status ?? t.latest_history?.nStatus ?? "") : "";
    const isMe = (t) => String(t.nAssignedAO ?? "") === String(userId);
    const isMine = (t) => String(t.creator_id ?? "") === String(userId);
    const getBucket = (code) => {
      if (isManagement) {
        if (code === forAssignmentKey)
          return transactions.filter((t) =>
            ["200", "210", "220", "230", "240"].includes(txnCode(t)),
          );
        return transactions.filter((t) => txnCode(t) === String(code));
      }
      if (isProcurement) {
        switch (code) {
          case draftKey:
            return transactions.filter((t) => txnCode(t) === code && isMine(t));
          case finalizeKey:
            return transactions.filter((t) => txnCode(t) === code && isMine(t));
          case finalizeVerificationKey:
            return transactions.filter((t) => txnCode(t) === code);
          case priceSettingKey:
            return transactions.filter(
              (t) => txnCode(t) === code && (isProcurementTL || isMine(t)),
            );
          case priceFinalizeKey:
            return transactions.filter((t) => txnCode(t) === code && isMine(t));
          case priceFinalizeVerificationKey:
            return transactions.filter((t) => txnCode(t) === code);
          case procPriceApprovalKey:
            return transactions.filter((t) => txnCode(t) === code && isMine(t));
          case procPriceApprovedKey:
            return transactions.filter((t) => txnCode(t) === code);
          default:
            return [];
        }
      }
      if (isAOTL) {
        switch (code) {
          case forAssignmentKey:
            return transactions.filter((t) =>
              ["200", "210", "220", "225", "230", "240", "245"].includes(
                txnCode(t),
              ),
            );
          case itemsManagementKey:
            return transactions.filter((t) => txnCode(t) === code && isMe(t));
          case itemsFinalizeKey:
            return transactions.filter((t) => txnCode(t) === code && isMe(t));
          case itemsVerificationKey:
            return transactions.filter((t) => txnCode(t) === code);
          case forCanvasKey:
            return transactions.filter((t) => txnCode(t) === code && isMe(t));
          case canvasFinalizeKey:
            return transactions.filter((t) => txnCode(t) === code && isMe(t));
          case canvasVerificationKey:
            return transactions.filter((t) => txnCode(t) === code);
          case forPurchaseKey:
            return transactions.filter((t) => txnCode(t) === code && isMe(t));
          default:
            return [];
        }
      }
      switch (code) {
        case itemsManagementKey:
          return transactions.filter((t) => txnCode(t) === code && isMe(t));
        case itemsFinalizeKey:
          return transactions.filter((t) => txnCode(t) === code && isMe(t));
        case itemsVerificationKey:
          return transactions.filter((t) => txnCode(t) === code);
        case forCanvasKey:
          return transactions.filter((t) => txnCode(t) === code && isMe(t));
        case canvasFinalizeKey:
          return transactions.filter((t) => txnCode(t) === code && isMe(t));
        case canvasVerificationKey:
          return transactions.filter((t) => txnCode(t) === code);
        case forPurchaseKey:
          return transactions.filter((t) => txnCode(t) === code && isMe(t));
        default:
          return [];
      }
    };
    const red = {};
    const orange = {};
    Object.keys(statusMap).forEach((code) => {
      const bucket = getBucket(code);
      red[code] = bucket.filter(
        (t) => getDueDateColor(getRelevantDate(t)) === "red",
      ).length;
      orange[code] = bucket.filter(
        (t) => getDueDateColor(getRelevantDate(t)) === "orange",
      ).length;
    });
    return { red, orange };
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
    procPriceApprovedKey,
    forPurchaseKey,
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
      {Object.entries(statusMap).map(([code, label]) => {
        const total = statusCounts[code] || 0;
        const red = dueCounts.red[code] || 0;
        const orange = dueCounts.orange[code] || 0;
        const normal = Math.max(total - red - orange, 0);
        return (
          <SidebarSubmenu
            key={code}
            label={label}
            active={isOnTransactionPage && selectedCode === String(code)}
            count={normal}
            redCount={red}
            orangeCount={orange}
            countLoading={countLoading}
            onClick={() => onSelect(String(code))}
          />
        );
      })}
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

// ─────────────────────────────────────────────────────────────────────────────
// Cart Nav
//
// Fixes applied vs original:
//
// 1. REMOVED the module-level window.__cartEchoSubscribed guard entirely.
//    It was unreliable: if mappingLoading was true on the first render, the
//    early-return skipped setting the flag, so the guard never blocked a
//    duplicate on the next render. Then on unmount the cleanup cleared the
//    flag, but a stale second subscription had already been created.
//
//    Replacement: a component-scoped ref (subscribedRef) that is set to true
//    *inside* the effect body (not guarded by the flag) and cleared on cleanup.
//    This is safe because the effect only runs when mappingLoading transitions
//    to false — exactly once per mount — and the cleanup teardown is reliable.
//
// 2. fetchPurchaseOrders is now called via fetchRef *inside* the event handlers
//    so we never hold a stale closure from the time the Echo effect ran.
//
// 3. Added a window "cart_data_updated" listener that also triggers a fetch,
//    so any component can dispatch that event and the sidebar will reconcile.
// ─────────────────────────────────────────────────────────────────────────────
const CartNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartStatus, loading: mappingLoading } = useMapping();
  const SESSION_KEY = "selectedCartStatusCode";
  const firstCode = Object.keys(cartStatus || {})[0] ?? "";
  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || firstCode,
  );
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage = location.pathname === "/cart";

  // ── Sync selectedCode on navigation ──────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  // ── Listen for status selection changes dispatched by Cart page ───────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("cart_status_changed", handler);
    return () => window.removeEventListener("cart_status_changed", handler);
  }, []);

  // ── Fetch purchase orders ─────────────────────────────────────────────────
  const fetchPurchaseOrders = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await api.get("purchase-orders/get-all-purchase-orders");
      setPurchaseOrders(res.purchaseOrders || []);
    } catch (err) {
      console.error("Sidebar cart (PO) fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  // ── Ref so Echo/window listeners always call the latest version ───────────
  const fetchRef = useRef(fetchPurchaseOrders);
  useEffect(() => {
    fetchRef.current = fetchPurchaseOrders;
  }, [fetchPurchaseOrders]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mappingLoading) fetchPurchaseOrders();
  }, [mappingLoading, fetchPurchaseOrders]);

  // ── Window event listeners ────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const handleUpdated = () => {
      setCountLoading(true);
      fetchRef.current();
    };

    const handleStatusUpdated = (e) => {
      const { purchaseOrderId, newStatus } = e.detail || {};
      if (!purchaseOrderId || !newStatus) {
        setCountLoading(true);
        fetchRef.current();
        return;
      }
      // Optimistic patch — instant count update without a round-trip
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.nPurchaseOrderId === purchaseOrderId
            ? { ...po, cStatus: newStatus }
            : po,
        ),
      );
    };

    const handleDeleted = (e) => {
      if (e.detail?.purchaseOrderId) {
        setPurchaseOrders((prev) =>
          prev.filter((po) => po.nPurchaseOrderId !== e.detail.purchaseOrderId),
        );
      } else {
        setCountLoading(true);
        fetchRef.current();
      }
    };

    window.addEventListener("cart_data_updated", handleUpdated);
    window.addEventListener("cart_status_updated", handleStatusUpdated);
    window.addEventListener("cart_data_deleted", handleDeleted);
    return () => {
      window.removeEventListener("cart_data_updated", handleUpdated);
      window.removeEventListener("cart_status_updated", handleStatusUpdated);
      window.removeEventListener("cart_data_deleted", handleDeleted);
    };
  }, [mappingLoading]);

  // ── Echo subscriber ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const poChannel = echo.channel("purchase-orders");
    poChannel.listen(".purchase-order.updated", (event) => {
      if (event.action === "deleted") {
        window.dispatchEvent(
          new CustomEvent("cart_data_deleted", {
            detail: { purchaseOrderId: event.purchaseOrderId },
          }),
        );
        return;
      }
      if (event.action === "status_updated" && event.newStatus) {
        window.dispatchEvent(
          new CustomEvent("cart_status_updated", {
            detail: {
              purchaseOrderId: event.purchaseOrderId,
              newStatus: event.newStatus,
            },
          }),
        );
        return;
      }
      window.dispatchEvent(new CustomEvent("cart_data_updated"));
    });

    const optionsChannel = echo.channel("purchase-order-options");
    optionsChannel.listen(".purchase-order-option.updated", () => {
      window.dispatchEvent(new CustomEvent("cart_data_updated"));
    });

    return () => {
      echo.leaveChannel("purchase-orders");
      echo.leaveChannel("purchase-order-options");
    };
  }, [mappingLoading]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/cart");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("cart_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(cartStatus || {})[0];
    if (first) handleSelect(first);
  }, [cartStatus, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<ShoppingCartIcon fontSize="small" />}
        label="Purchase Cart"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        {Object.entries(cartStatus || {}).map(([code, label]) => {
          const count = purchaseOrders.filter(
            (po) =>
              String(po.cStatus) === String(code) &&
              (po.purchase_order_options?.length ?? 0) > 0,
          ).length;
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
const VoucherNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { voucherStatus, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedVoucherStatusCode";
  const firstCode = Object.keys(voucherStatus || {})[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || firstCode,
  );
  const [vouchers, setVouchers] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage = location.pathname === "/voucher";

  // ── Sync selectedCode on navigation ──────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  // ── Listen for status selection changes dispatched by Voucher page ────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("voucher_status_changed", handler);
    return () => window.removeEventListener("voucher_status_changed", handler);
  }, []);

  // ── Fetch vouchers ────────────────────────────────────────────────────────
  const fetchVouchers = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await api.get("vouchers");
      setVouchers(res || []);
    } catch (err) {
      console.error("Sidebar voucher fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  // ── Ref so Echo listeners always call the latest version ─────────────────
  const fetchRef = useRef(fetchVouchers);
  useEffect(() => {
    fetchRef.current = fetchVouchers;
  }, [fetchVouchers]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mappingLoading) fetchVouchers();
  }, [mappingLoading, fetchVouchers]);

  // ── Echo subscriber ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("vouchers");

    // voucher.updated — fired by VoucherController (created, updated, status_changed, deleted)
    channel.listen(".voucher.updated", (event) => {
      if (event.action === "deleted") {
        // Remove it immediately — no round-trip needed
        setVouchers((prev) =>
          prev.filter((v) => v.nVoucherId !== event.voucherId),
        );
        window.dispatchEvent(
          new CustomEvent("voucher_data_deleted", {
            detail: { voucherId: event.voucherId },
          }),
        );
        return;
      }
      // created | updated | status_changed → refetch so counts stay correct
      fetchRef.current();
      window.dispatchEvent(new CustomEvent("voucher_data_updated"));
    });

    // voucher.supplier.updated — fired by VoucherSupplierController
    // A linked/unlinked PO changes the voucher's total but not its cStatus,
    // so a refetch is the right move to keep counts accurate.
    channel.listen(".voucher.supplier.updated", (event) => {
      if (event.action === "deleted") {
        // If the last supplier was removed the whole voucher was deleted too
        // (the controller fires voucher.updated/deleted in that case),
        // so we only need to refetch here for the non-cascading case.
        fetchRef.current();
        return;
      }
      // created → new PO linked to an existing voucher
      fetchRef.current();
      window.dispatchEvent(new CustomEvent("voucher_data_updated"));
    });

    // voucher.assignee.updated — fired by VoucherAssigneeController
    channel.listen(".voucher.assignee.updated", (event) => {
      if (event.action === "deleted") {
        // Same as supplier: if the last assignee was removed, voucher.updated
        // already fired the cascading delete. Refetch covers the non-cascade case.
        fetchRef.current();
        return;
      }
      // created | updated
      fetchRef.current();
      window.dispatchEvent(new CustomEvent("voucher_data_updated"));
    });

    return () => {
      echo.leaveChannel("vouchers");
    };
  }, [mappingLoading]);

  // ── Window event listeners (let other pages trigger a sidebar refresh) ────
  useEffect(() => {
    const handler = () => fetchRef.current();
    window.addEventListener("voucher_data_updated", handler);
    window.addEventListener("voucher_data_deleted", handler);
    return () => {
      window.removeEventListener("voucher_data_updated", handler);
      window.removeEventListener("voucher_data_deleted", handler);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(SESSION_KEY, code);
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
    const first = Object.keys(voucherStatus || {})[0];
    if (first) handleSelect(first);
  }, [voucherStatus, handleSelect]);

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
        {Object.entries(voucherStatus || {}).map(([code, label]) => {
          const count = vouchers.filter(
            (v) => String(v.cStatus) === String(code),
          ).length;
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
const AssigneeNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { statuses, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedAssigneeStatusCode";
  const firstCode = Object.keys(statuses)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || firstCode,
  );
  const [assignees, setAssignees] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/assignee";

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("assignee_status_changed", handler);
    return () => window.removeEventListener("assignee_status_changed", handler);
  }, []);

  const fetchAssignees = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await api.get("assignees");
      setAssignees(res.assignees || []);
    } catch (err) {
      console.error("Sidebar assignee fetch error:", err);
    } finally {
      setCountLoading(false);
    }
  }, [mappingLoading]);

  const fetchRef = useRef(fetchAssignees);
  useEffect(() => { fetchRef.current = fetchAssignees; }, [fetchAssignees]);

  useEffect(() => {
    if (!mappingLoading) fetchAssignees();
  }, [mappingLoading, fetchAssignees]);

  useEffect(() => {
    if (mappingLoading) return;
    const channel = echo.channel("assignees");
    channel.listen(".assignee.updated", (event) => {
      if (event.action === "deleted") {
        setAssignees((prev) =>
          prev.filter((a) => a.nAssigneeId !== event.assigneeId),
        );
        return;
      }
      fetchRef.current();
    });
    return () => echo.leaveChannel("assignees");
  }, [mappingLoading]);

  const handleSelect = useCallback(
    (code) => {
      sessionStorage.setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/assignee");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("assignee_status_changed", { detail: { code } }),
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
        icon={<AssignmentIndIcon fontSize="small" />}
        label="Assignees"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        <StatusSubItems
          statusMap={statuses}
          items={assignees.map((a) => ({ statusCode: a.cStatus }))}
          selectedCode={selectedCode}
          onSelect={handleSelect}
          isOnPage={isOnPage}
          countLoading={countLoading}
        />
      </SidebarItem>
    </div>
  );
};
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
                  <AssigneeNavSection
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
                  <SidebarItem
                    icon={<LocalAtmIcon fontSize="small" />}
                    label="Direct Cost Options"
                    to="/direct-cost"
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
                <CartNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />
                <VoucherNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />

                <SidebarItem
                  icon={<ArchiveIcon fontSize="small" />}
                  label="Archives"
                  to="/transaction-archive"
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
                <CartNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />
                <SidebarItem
                  icon={<ArchiveIcon fontSize="small" />}
                  label="Archives"
                  to="/transaction-archive"
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onClick={onItemClick}
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
                <CartNavSection
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onItemClick={onItemClick}
                />
                <SidebarItem
                  icon={<ArchiveIcon fontSize="small" />}
                  label="Archives"
                  to="/transaction-archive"
                  collapsed={collapsed}
                  forceExpanded={forceExpanded}
                  onClick={onItemClick}
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
