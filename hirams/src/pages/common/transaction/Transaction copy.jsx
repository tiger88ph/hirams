import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import PageLayout from "../../../components/common/PageLayout";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import TransactionFilterMenu from "../../../components/common/TransactionFilterMenu";
import { useNavigate } from "react-router-dom";
import RevertModal from "../../common/modal/RevertModal";
import TransactionHistoryModal from "./modal/transaction-drafting/TransactionHistoryModal";
import TransactionAEModal from "./modal/transaction-drafting/TransactionAEModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import DirectCostModal from "./modal/transaction-drafting/DirectCostModal";
import ATransactionInfoModal from "./modal/transaction-drafting/TransactionInfoModal";
import { AccountOfficerIcons } from "../../../components/common/Buttons";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import SyncMenu from "../../../components/common/Syncmenu";
import { getUserRoles } from "../../../utils/helpers/roleHelper";
import echo from "../../../utils/echo";
import {
  Add,
  Edit,
  Delete,
  Undo,
  RequestQuote,
  InfoOutlined,
  ShoppingCart,
  Drafts,
  Inventory2,
  AccountCircle,
  LocalOffer,
  Replay,
  History,
} from "@mui/icons-material";

const TXN_CACHE_TTL = 60 * 1000; // 1 minute

function getCachedTransactions(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > TXN_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedTransactions(key, data) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    /* storage full — silently skip */
  }
}

// ── Date formatter (outside component — no re-creation on render) ─────────────
function formatDate(dateStr, fallback = "—") {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d)) return fallback;
  const base = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  if (d.getHours() || d.getMinutes()) {
    return `${base}, ${d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────

function Transaction() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDirectCostModalOpen, setIsDirectCostModalOpen] = useState(false);
  const [isAEModalOpen, setIsAEModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Mappings ──────────────────────────────────────────────────────────────
  const {
    ao_status,
    aotl_status,
    proc_status,
    transacstatus,
    clientstatus,
    statusTransaction,
    itemType,
    userTypes,
    procMode,
    procSource,
    vaGoSeValue,
    loading: mappingLoading,
  } = useMapping();

  const { isManagement, isProcurement, isAccountOfficer, isAOTL } =
    getUserRoles(userTypes);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const userId = user?.nUserId;

  // ── Derived status keys (memoized) ────────────────────────────────────────
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

  const sessionKey = isManagement
    ? "selectedStatusCode"
    : isProcurement
      ? "selectedProcStatusCode"
      : "selectedAOStatusCode";

  const statusKeys = useMemo(() => {
    const mgmtKeys = Object.keys(transacstatus);
    const procKeys = Object.keys(proc_status);
    const aoKeys = Object.keys(isAOTL ? aotl_status : ao_status);

    return {
      draftKey: (isManagement ? mgmtKeys : procKeys)[0] || "",
      finalizeKey: (isManagement ? mgmtKeys : procKeys)[1] || "",
      forAssignmentKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 2 : 0] || "",
      itemsManagementKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 3 : isAOTL ? 1 : 0] ||
        "",
      itemsFinalizeKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 1 : isAOTL ? 2 : 1] ||
        "",
      itemsVerificationKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 4 : isAOTL ? 3 : 2] ||
        "",
      forCanvasKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 5 : isAOTL ? 4 : 3] ||
        "",
      canvasFinalizeKey: !isManagement ? aoKeys[isAOTL ? 5 : 4] || "" : "",
      canvasVerificationKey:
        (isManagement ? mgmtKeys : aoKeys)[isManagement ? 6 : isAOTL ? 6 : 5] ||
        "",
      forPricingKey:
        (isManagement ? mgmtKeys : procKeys)[isManagement ? 7 : 3] || "",
      priceVerificationKey:
        (isManagement ? mgmtKeys : procKeys)[isManagement ? 8 : 4] || "",
      priceApprovalKey:
        (isManagement ? mgmtKeys : procKeys)[isManagement ? 9 : 5] || "",
      finalizeVerificationKey: isProcurement ? procKeys[2] || "" : "",
      priceSettingKey: isProcurement ? procKeys[3] || "" : "",
      priceFinalizeKey: isProcurement ? procKeys[4] || "" : "",
      priceFinalizeVerificationKey: isProcurement ? procKeys[5] || "" : "",
      procPriceApprovalKey: isProcurement ? procKeys[6] || "" : "",
    };
  }, [
    isManagement,
    isProcurement,
    isAOTL,
    transacstatus,
    proc_status,
    aotl_status,
    ao_status,
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

  // ── Filter status init ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mappingLoading && Object.keys(statusMap).length > 0) {
      const savedCode = sessionStorage.getItem(sessionKey);
      setFilterStatus(
        savedCode && statusMap[savedCode]
          ? statusMap[savedCode]
          : Object.values(statusMap)[0],
      );
    }
  }, [mappingLoading, statusMap, sessionKey]);

  const selectedStatusCode = useMemo(
    () => Object.keys(statusMap).find((key) => statusMap[key] === filterStatus),
    [statusMap, filterStatus],
  );

  const isPricingSetting = useMemo(
    () =>
      isManagement
        ? forPricingKey.includes(selectedStatusCode)
        : isProcurement
          ? priceSettingKey.includes(selectedStatusCode)
          : false,
    [
      isManagement,
      isProcurement,
      forPricingKey,
      priceSettingKey,
      selectedStatusCode,
    ],
  );

  useEffect(() => {
    if (selectedStatusCode)
      sessionStorage.setItem(sessionKey, selectedStatusCode);
  }, [selectedStatusCode, sessionKey]);

  // ── Cache key (per role + user) ───────────────────────────────────────────
  const cacheKey = `txn_cache_${userId}_${isManagement ? "mgmt" : isProcurement ? "proc" : isAOTL ? "aotl" : "ao"}`;

  // ── Fetch Transactions ────────────────────────────────────────────────────
  const fetchTransactions = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;

      // ✅ Show stale cache instantly, then refresh in background
      if (!silent) {
        const cached = getCachedTransactions(cacheKey);
        if (cached) {
          setTransactions(cached);
          setLoading(false);
          // still fetch fresh data silently
          fetchTransactions({ silent: true });
          return;
        }
      }

      if (!silent) setLoading(true);

      try {
        let list = [];

        if (isManagement) {
          const res = await api.get("transactions");
          list = res.transactions || res.data || [];
        } else if (isProcurement) {
          const res = await api.get(
            `transaction/procurement?nUserId=${userId}`,
          );
          list = res.transactions || [];
        } else {
          const res = await api.get(
            `transaction/account_officer?nUserId=${userId}&isAOTL=${isAOTL ? 1 : 0}&fetchAll=${isAOTL ? 1 : 0}`,
          );
          list = res.transactions || [];
        }

        const fallback = isProcurement ? "--" : "—";
        const formatted = list.map((txn) => {
          const statusCode = txn.latest_history?.nStatus;
          return {
            ...txn,
            id: txn.nTransactionId,
            transactionId: txn.strCode || "--",
            transactionName: txn.strTitle || "--",
            date: formatDate(txn.dtDocSubmission, fallback),
            status: statusMap[statusCode],
            status_code: statusCode,
            companyName:
              txn.company?.strCompanyNickName || (isProcurement ? "--" : ""),
            clientName:
              txn.client?.strClientNickName || (isProcurement ? "--" : ""),
            createdBy: txn.created_by || "--",
            aoName: txn.user
              ? `${txn.user.strFName} ${txn.user.strLName}`.trim()
              : "",
            aoUserId: txn.user?.nUserId || txn.latest_history?.nUserId,
            aoDueDate: isAccountOfficer
              ? formatDate(txn.dtAODueDate, fallback)
              : undefined,
          };
        });

        setTransactions(formatted);
        setCachedTransactions(cacheKey, formatted);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      isManagement,
      isProcurement,
      isAOTL,
      isAccountOfficer,
      userId,
      statusMap,
      cacheKey,
    ],
  );

  // ── Fire fetch once mappings are ready ───────────────────────────────────
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!mappingLoading && !hasFetched.current) {
      hasFetched.current = true;
      fetchTransactions();
    }
  }, [mappingLoading, fetchTransactions]);

  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("transactions");

    channel.listen(".transaction.updated", (event) => {
      if (event.action === "deleted") {
        // Remove immediately from local state — no refetch needed
        setTransactions((prev) =>
          prev.filter((t) => t.id !== event.transactionId),
        );
        return;
      }

      // For all other actions, silently refetch in background
      fetchTransactions({ silent: true });
    });

    return () => {
      echo.leaveChannel("transactions");
    };
  }, [mappingLoading, fetchTransactions]);
  // ── Filtered transactions (memoized) ─────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();

    return transactions.filter((t) => {
      const matchesSearch =
        !searchLower ||
        t.transactionId?.toLowerCase().includes(searchLower) ||
        t.transactionName?.toLowerCase().includes(searchLower) ||
        t.clientName?.toLowerCase().includes(searchLower) ||
        t.companyName?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const txnStatusCode = String(
        t.status_code ?? t.latest_history?.nStatus ?? "",
      );

      if (isManagement) {
        if (selectedStatusCode === forAssignmentKey) {
          return [
            forAssignmentKey,
            itemsManagementKey,
            itemsVerificationKey,
            forCanvasKey,
          ]
            .map(String)
            .includes(txnStatusCode);
        }
        return txnStatusCode === String(selectedStatusCode);
      }

      if (isAOTL) {
        if (selectedStatusCode === forAssignmentKey) {
          return [
            forAssignmentKey,
            itemsManagementKey,
            itemsVerificationKey,
            forCanvasKey,
          ]
            .map(String)
            .includes(txnStatusCode);
        }
        const isItemsVer = txnStatusCode === String(itemsVerificationKey);
        const isCanvasVer = txnStatusCode === String(canvasVerificationKey);
        const selIsItemsVer =
          selectedStatusCode === String(itemsVerificationKey);
        const selIsCanvasVer =
          selectedStatusCode === String(canvasVerificationKey);

        if ((selIsItemsVer || selIsCanvasVer) && (isItemsVer || isCanvasVer)) {
          return txnStatusCode === String(selectedStatusCode);
        }
        if (t.aoUserId !== userId) return false;
        return txnStatusCode === String(selectedStatusCode);
      }

      // Account Officer & Procurement
      return txnStatusCode === String(selectedStatusCode);
    });
  }, [
    transactions,
    debouncedSearch,
    selectedStatusCode,
    isManagement,
    isAOTL,
    userId,
    forAssignmentKey,
    itemsManagementKey,
    itemsVerificationKey,
    forCanvasKey,
    canvasVerificationKey,
  ]);

  // ── Column visibility (memoized) ─────────────────────────────────────────
  const {
    isAssignedToColumnVisible,
    isCreatedByColumnVisible,
    showAOActionColumn,
  } = useMemo(
    () => ({
      isAssignedToColumnVisible:
        !isProcurement &&
        selectedStatusCode &&
        (forAssignmentKey.includes(selectedStatusCode) ||
          itemsManagementKey.includes(selectedStatusCode) ||
          itemsVerificationKey.includes(selectedStatusCode) ||
          forCanvasKey.includes(selectedStatusCode) ||
          canvasVerificationKey.includes(selectedStatusCode)),
      isCreatedByColumnVisible:
        selectedStatusCode &&
        (isManagement
          ? draftKey.includes(selectedStatusCode) ||
            finalizeKey.includes(selectedStatusCode) ||
            forPricingKey.includes(selectedStatusCode) ||
            priceVerificationKey.includes(selectedStatusCode)
          : isProcurement
            ? finalizeVerificationKey.includes(selectedStatusCode) ||
              priceFinalizeVerificationKey.includes(selectedStatusCode)
            : false),
      showAOActionColumn:
        isAccountOfficer &&
        selectedStatusCode &&
        !itemsManagementKey.includes(selectedStatusCode) &&
        !forAssignmentKey.includes(selectedStatusCode),
    }),
    [
      isProcurement,
      isManagement,
      isAccountOfficer,
      selectedStatusCode,
      forAssignmentKey,
      itemsManagementKey,
      itemsVerificationKey,
      forCanvasKey,
      canvasVerificationKey,
      draftKey,
      finalizeKey,
      forPricingKey,
      priceVerificationKey,
      finalizeVerificationKey,
      priceFinalizeVerificationKey,
    ],
  );

  const statusLabelMap = isManagement ? transacstatus : ao_status;
  const itemsManagementLabel = statusLabelMap[itemsManagementKey] || "";
  const canvasVerificationLabel = statusLabelMap[canvasVerificationKey] || "";
  const forCanvasLabel = statusLabelMap[forCanvasKey] || "";
  const finalizeKeyLabel = isManagement
    ? transacstatus[finalizeKey] || ""
    : ao_status[itemsFinalizeKey] || "";

  const renderActions = useCallback(
    (_, row) => {
      const statusCode = selectedStatusCode;

      // ── Shared canvasState builder ────────────────────────────────────────
      const canvasState = {
        transactionId: row.id,
        transactionCode: row.transactionId,
        transaction: row,
        nUserId: row?.user?.nUserId || row?.latest_history?.nUserId,
        itemsManagementKey,
        itemsFinalizeKey,
        itemsVerificationKey,
        forCanvasKey,
        canvasFinalizeKey,
        canvasVerificationKey,
        forAssignmentKey,
        procMode,
        itemType,
        procSource,
        statusTransaction,
        vaGoSeValue,
        userTypes,
        isAOTL,
        isManagement,
        isAccountOfficer,
        selectedStatusCode,
        statusLabelMap,
        itemsManagementLabel,
        canvasVerificationLabel,
        forCanvasLabel,
        finalizeKeyLabel,
        ao_status,
        transacstatus,
        currentStatusLabel: filterStatus,
      };

      // ── Management ────────────────────────────────────────────────────────
      if (isManagement) {
        const isDraft = draftKey.includes(statusCode);
        const isForAssignment = forAssignmentKey.includes(statusCode);
        const hasAssignedAO = Number(row.nAssignedAO) > 0;
        const isRevertVisible = isDraft || (isForAssignment && hasAssignedAO);
        const isPricing =
          forPricingKey.includes(statusCode) ||
          priceVerificationKey.includes(statusCode) ||
          priceApprovalKey.includes(statusCode);

        return (
          <div className="flex justify-center gap-0">
            {/* Navigate to Canvas or Pricing */}
            <BaseButton
              icon={isPricing ? <LocalOffer /> : isDraft || finalizeKey.includes(statusCode) ? <InfoOutlined /> : itemsManagementKey.includes(statusCode) || itemsFinalizeKey.includes(statusCode)  ? <Inventory2 /> : <AccountCircle />}
              tooltip={isPricing ? "View Pricing" : "View Canvas"}
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  isPricing
                    ? "/transaction-pricing-set"
                    : "/transaction-canvas",
                  {
                    state: isPricing
                      ? {
                          transaction: row,
                          selectedStatusCode,
                          isManagement,
                          transacstatus,
                          forPricingKey,
                          priceVerificationKey,
                          priceApprovalKey,
                          isPricingSetting,
                          currentStatusLabel: filterStatus,
                        }
                      : {
                          ...canvasState,
                          selectedStatusCode,
                          transacstatus,
                          itemType,
                          userTypes,
                          statusTransaction,
                          procMode,
                          procSource,
                          draftKey,
                          finalizeKey,
                          forPricingKey,
                          priceVerificationKey,
                          currentStatusLabel: filterStatus,
                        },
                  },
                );
              }}
            />

            {isDraft && (
              <BaseButton
                icon={<Edit />}
                tooltip="Edit Transaction"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsAEModalOpen(true);
                }}
              />
            )}

            {isPricing && (
              <BaseButton
                icon={<RequestQuote />}
                tooltip="Direct Cost"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsDirectCostModalOpen(true);
                }}
              />
            )}

            {!isRevertVisible && (
              <BaseButton
                icon={<Replay />}
                tooltip="Revert Transaction"
                size="small"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsRevertModalOpen(true);
                }}
              />
            )}

            <BaseButton
              icon={<History />}
              tooltip="View Transaction History"
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTransaction(row);
                setIsHistoryModalOpen(true);
              }}
            />

            {isDraft && (
              <BaseButton
                icon={<Delete />}
                tooltip="Delete Transaction"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setEntityToDelete({
                    type: "transaction",
                    data: { id: row.id, code: row.transactionName },
                  });
                  setIsDeleteModalOpen(true);
                }}
              />
            )}
          </div>
        );
      }

      // ── Procurement ───────────────────────────────────────────────────────
      if (isProcurement) {
        const isDraft = draftKey.includes(statusCode);
        const isRevertVisible =
          !draftKey.includes(statusCode) &&
          !priceSettingKey.includes(statusCode);
        const isPricing =
          priceSettingKey.includes(statusCode) ||
          priceFinalizeKey.includes(statusCode) ||
          priceFinalizeVerificationKey.includes(statusCode) ||
          procPriceApprovalKey.includes(statusCode);

        return (
          <div className="flex justify-center gap-0">
            {/* Navigate to Canvas or Pricing */}
            <BaseButton
              icon={isPricing ? <LocalOffer /> : <ShoppingCart />}
              tooltip={isPricing ? "View Pricing" : "View Canvas"}
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  isPricing
                    ? "/transaction-pricing-set"
                    : "/transaction-canvas",
                  {
                    state: isPricing
                      ? {
                          transaction: row,
                          selectedStatusCode,
                          clientNickName: row.clientName,
                          proc_status,
                          priceSettingKey,
                          priceFinalizeKey,
                          priceFinalizeVerificationKey,
                          priceApprovalKey: procPriceApprovalKey,
                          isPricingSetting,
                          isManagement,
                          currentStatusLabel: filterStatus,
                        }
                      : {
                          ...canvasState,
                          selectedStatusCode,
                          isProcurement,
                          proc_status,
                          draftKey,
                          finalizeKey,
                          priceSettingKey,
                          finalizeVerificationKey,
                          priceFinalizeVerificationKey,
                          currentStatusLabel: filterStatus,
                        },
                  },
                );
              }}
            />

            {isDraft && (
              <BaseButton
                icon={<Edit />}
                tooltip="Edit Transaction"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsAEModalOpen(true);
                }}
              />
            )}

            {isDraft && (
              <BaseButton
                icon={<Delete />}
                tooltip="Delete Transaction"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setEntityToDelete({
                    type: "transaction",
                    data: { id: row.id, code: row.transactionName },
                  });
                  setIsDeleteModalOpen(true);
                }}
              />
            )}

            {isRevertVisible && (
              <BaseButton
                icon={<Replay />}
                tooltip="Revert Transaction"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsRevertModalOpen(true);
                }}
              />
            )}

            {isPricing && (
              <BaseButton
                icon={<RequestQuote />}
                tooltip="Direct Cost"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(row);
                  setIsDirectCostModalOpen(true);
                }}
              />
            )}
          </div>
        );
      }

      // ── Account Officer ───────────────────────────────────────────────────
      if (isAccountOfficer) {
        return (
          <AccountOfficerIcons
            onRevert={() => {
              setSelectedTransaction(row);
              setIsRevertModalOpen(true);
            }}
          />
        );
      }

      return null;
    },
    [
      isManagement,
      isProcurement,
      isAccountOfficer,
      isAOTL,
      selectedStatusCode,
      isPricingSetting,
      filterStatus,
      draftKey,
      finalizeKey,
      forAssignmentKey,
      forPricingKey,
      priceVerificationKey,
      priceApprovalKey,
      priceSettingKey,
      priceFinalizeKey,
      priceFinalizeVerificationKey,
      procPriceApprovalKey,
      finalizeVerificationKey,
      itemsManagementKey,
      itemsFinalizeKey,
      itemsVerificationKey,
      forCanvasKey,
      canvasFinalizeKey,
      canvasVerificationKey,
      proc_status,
      ao_status,
      transacstatus,
      itemType,
      procMode,
      procSource,
      statusTransaction,
      vaGoSeValue,
      userTypes,
      statusLabelMap,
      itemsManagementLabel,
      canvasVerificationLabel,
      forCanvasLabel,
      finalizeKeyLabel,
      navigate,
    ],
  );
  // ── Procurement: add saved ────────────────────────────────────────────────
  const handleAddTransactionSaved = useCallback(async () => {
    const defaultValue = Object.values(proc_status)?.[0];
    if (defaultValue) {
      setFilterStatus(defaultValue);
      sessionStorage.setItem(sessionKey, Object.keys(proc_status)[0]);
    }
    await fetchTransactions();
  }, [proc_status, sessionKey, fetchTransactions]);

  // ── Row Click ─────────────────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (row) => {
      const statusCode = String(
        row.status_code ?? row.latest_history?.nStatus ?? "",
      );

      const canvasState = {
        transactionId: row.id,
        transactionCode: row.transactionId,
        transaction: row,
        nUserId: row?.user?.nUserId || row?.latest_history?.nUserId,
        itemsManagementKey,
        itemsFinalizeKey,
        itemsVerificationKey,
        forCanvasKey,
        canvasFinalizeKey,
        canvasVerificationKey,
        forAssignmentKey,
        procMode,
        itemType,
        procSource,
        statusTransaction,
        vaGoSeValue,
        userTypes,
        isAOTL,
        isManagement,
        isAccountOfficer,
        selectedStatusCode,
        statusLabelMap,
        itemsManagementLabel,
        canvasVerificationLabel,
        forCanvasLabel,
        finalizeKeyLabel,
        ao_status,
        transacstatus,
        currentStatusLabel: filterStatus,
      };

      if (isManagement) {
        const isPricingStatus =
          forPricingKey.includes(statusCode) ||
          priceVerificationKey.includes(statusCode) ||
          priceApprovalKey.includes(statusCode);

        return navigate(
          isPricingStatus ? "/transaction-pricing-set" : "/transaction-canvas",
          {
            state: isPricingStatus
              ? {
                  transaction: row,
                  selectedStatusCode,
                  isManagement,
                  transacstatus,
                  forPricingKey,
                  priceVerificationKey,
                  priceApprovalKey,
                  isPricingSetting,
                  currentStatusLabel: filterStatus,
                }
              : {
                  ...canvasState,
                  selectedStatusCode,
                  transacstatus,
                  itemType,
                  userTypes,
                  statusTransaction,
                  procMode,
                  procSource,
                  draftKey,
                  finalizeKey,
                  forPricingKey,
                  priceVerificationKey,
                  currentStatusLabel: filterStatus,
                },
          },
        );
      }

      if (isProcurement) {
        const isPricing =
          priceSettingKey.includes(statusCode) ||
          priceFinalizeKey.includes(statusCode) ||
          priceFinalizeVerificationKey.includes(statusCode) ||
          procPriceApprovalKey.includes(statusCode);

        return navigate(
          isPricing ? "/transaction-pricing-set" : "/transaction-canvas",
          {
            state: isPricing
              ? {
                  transaction: row,
                  selectedStatusCode,
                  clientNickName: row.clientName,
                  proc_status,
                  priceSettingKey,
                  priceFinalizeKey,
                  priceFinalizeVerificationKey,
                  priceApprovalKey: procPriceApprovalKey,
                  isPricingSetting,
                  isManagement,
                  currentStatusLabel: filterStatus,
                }
              : {
                  ...canvasState,
                  selectedStatusCode,
                  isProcurement,
                  proc_status,
                  draftKey,
                  finalizeKey,
                  priceSettingKey,
                  finalizeVerificationKey,
                  priceFinalizeVerificationKey,
                  currentStatusLabel: filterStatus,
                },
          },
        );
      }

      navigate("/transaction-canvas", { state: canvasState });
    },
    [
      isManagement,
      isProcurement,
      isAOTL,
      isAccountOfficer,
      selectedStatusCode,
      isPricingSetting,
      mappingLoading,
      forPricingKey,
      priceVerificationKey,
      priceApprovalKey,
      priceSettingKey,
      priceFinalizeKey,
      priceFinalizeVerificationKey,
      procPriceApprovalKey,
      draftKey,
      finalizeKey,
      forAssignmentKey,
      itemsManagementKey,
      itemsFinalizeKey,
      itemsVerificationKey,
      forCanvasKey,
      canvasFinalizeKey,
      canvasVerificationKey,
      transacstatus,
      proc_status,
      ao_status,
      clientstatus,
      itemType,
      procMode,
      procSource,
      statusTransaction,
      vaGoSeValue,
      userTypes,
      itemsManagementLabel,
      canvasVerificationLabel,
      forCanvasLabel,
      finalizeKeyLabel,
      statusLabelMap,
      navigate,
    ],
  );

  // ── Columns (memoized) ────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { key: "transactionId", label: "Code" },
      { key: "transactionName", label: "Transaction" },
      { key: "clientName", label: "Client" },
      { key: "companyName", label: "Company" },
      { key: "date", label: "Submission", align: "center" },
      ...(isAssignedToColumnVisible
        ? [{ key: "aoName", label: "Assigned AO" }]
        : []),
      ...(isCreatedByColumnVisible
        ? [{ key: "createdBy", label: "Created by" }]
        : []),
      ...(isAccountOfficer
        ? [{ key: "aoDueDate", label: "AO Due Date", align: "center" }]
        : []),
      ...(!isAccountOfficer || showAOActionColumn
        ? [
            {
              key: "actions",
              label: "Actions",
              align: "center",
              render: renderActions,
            },
          ]
        : []),
    ],
    [
      isAssignedToColumnVisible,
      isCreatedByColumnVisible,
      isAccountOfficer,
      showAOActionColumn,
      renderActions,
    ],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageLayout title="Transaction">
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Transaction"
            value={search}
            onChange={setSearch}
          />
        </div>

        <SyncMenu onSync={fetchTransactions} />

        <TransactionFilterMenu
          statuses={statusMap}
          items={transactions}
          selectedStatus={filterStatus}
          onSelect={setFilterStatus}
          statusKey="status"
          forAssignmentCode={
            isManagement || isAccountOfficer ? forAssignmentKey : null
          }
          itemsManagementCode={
            isManagement || isAccountOfficer ? itemsManagementKey : null
          }
          itemsVerificationCode={
            isManagement || isAccountOfficer ? itemsVerificationKey : null
          }
          forCanvasCode={isManagement || isAccountOfficer ? forCanvasKey : null}
          {...(isAccountOfficer && { isAOTL, currentUserId: userId })}
        />

        {isProcurement && (
          <BaseButton
            label="Add Transaction"
            icon={<Add />}
            actionColor="approve"
            variant="contained"
            onClick={() => {
              setSelectedTransaction(null);
              setIsAEModalOpen(true);
            }}
          />
        )}
      </section>

      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={columns}
          rows={filteredTransactions}
          page={page}
          loading={loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {isRevertModalOpen && selectedTransaction && (
        <RevertModal
          open={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          transaction={selectedTransaction}
          transactionCode={selectedTransaction.transactionId}
          transactionId={selectedTransaction.id}
          statusMapping={statusMap}
          saveButtonColor={isAccountOfficer ? "error" : "success"}
          onReverted={(newStatusCode) => {
            fetchTransactions();
            if (newStatusCode && statusMap[newStatusCode]) {
              setFilterStatus(statusMap[newStatusCode]);
              sessionStorage.setItem(sessionKey, newStatusCode);
            }
          }}
        />
      )}

      {isManagement && isHistoryModalOpen && selectedTransaction && (
        <TransactionHistoryModal
          open={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transaction={selectedTransaction}
          transactionId={selectedTransaction.id}
          transactionCode={selectedTransaction.transactionId}
        />
      )}

      {(isManagement || isProcurement) &&
        isDirectCostModalOpen &&
        selectedTransaction && (
          <DirectCostModal
            open={isDirectCostModalOpen}
            onClose={() => {
              setIsDirectCostModalOpen(false);
              setSelectedTransaction(null);
            }}
            transaction={selectedTransaction}
            isPricingSetting={isPricingSetting}
          />
        )}

      {isAEModalOpen && (
        <TransactionAEModal
          open={isAEModalOpen}
          onClose={() => {
            setIsAEModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onSaved={
            selectedTransaction ? fetchTransactions : handleAddTransactionSaved
          }
          itemType={itemType}
          procMode={procMode}
          procSource={procSource}
        />
      )}

      {(isManagement || isProcurement) &&
        isDeleteModalOpen &&
        entityToDelete && (
          <DeleteVerificationModal
            open={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setEntityToDelete(null);
            }}
            entityToDelete={entityToDelete}
            onSuccess={fetchTransactions}
          />
        )}

      {isAccountOfficer && isInfoModalOpen && selectedTransaction && (
        <ATransactionInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          transactionId={selectedTransaction.id}
          transaction={selectedTransaction}
          nUserId={
            selectedTransaction?.user?.nUserId ||
            selectedTransaction?.latest_history?.nUserId
          }
        />
      )}
    </PageLayout>
  );
}

export default Transaction;
