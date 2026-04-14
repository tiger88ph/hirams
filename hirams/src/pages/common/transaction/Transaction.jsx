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
import { useNavigate, useLocation } from "react-router-dom";
import RevertModal from "../../common/modal/RevertModal";
import TransactionHistoryModal from "./modal/transaction-drafting/TransactionHistoryModal";
import TransactionAEModal from "./modal/transaction-drafting/TransactionAEModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import DirectCostModal from "./modal/transaction-drafting/DirectCostModal";
import ATransactionInfoModal from "./modal/transaction-drafting/TransactionInfoModal";
import api from "../../../utils/api/api";
import useMapping from "../../../utils/mappings/useMapping";
import SyncMenu from "../../../components/common/Syncmenu";
import { getUserRoles } from "../../../utils/helpers/roleHelper";
import { useSidebar } from "../../../components/layout/SidebarContext";
import { getDueDateColor } from "../../../utils/helpers/dueDateColor";
import { TXN_CACHE_TTL } from "../../../utils/constants/cache";
import echo from "../../../utils/echo";
import {
  Add,
  Edit,
  Delete,
  Undo,
  RequestQuote,
  Replay,
  History,
  Visibility,
  GppGood,
  Description,
  ListAlt,
  CheckCircleOutline,
  AssignmentInd,
  ContactPage,
  PriceCheck,
  Verified,
  Sell,
} from "@mui/icons-material";

function getCachedTransactions(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > TXN_CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
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

function invalidateCache(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Date formatter (stable, defined once) ────────────────────────────────────
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

// ── Pure action renderer (outside component — never re-created) ───────────────
function buildActions(row, opts) {
  const {
    userId,
    isManagement,
    isProcurement,
    isProcurementTL,
    isAccountOfficer,
    selectedStatusCode: statusCode,
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
    finalizeKey: procFinalizeKey,
    finalizeVerificationKey,
    priceSettingKey,
    priceFinalizeKey,
    priceFinalizeVerificationKey,
    procPriceApprovalKey,
    isPricingSetting,
    filterStatus,
    proc_status,
    transacstatus,
    itemType,
    procMode,
    procSource,
    statusTransaction,
    userTypes,
    vaGoSeValue,
    buildCanvasState,
    navigate,
    setSelectedTransaction,
    setIsAEModalOpen,
    setIsHistoryModalOpen,
    setIsRevertModalOpen,
    setIsDirectCostModalOpen,
    setIsDeleteModalOpen,
    setEntityToDelete,
  } = opts;

  // ── Management ────────────────────────────────────────────────────────────
  if (isManagement) {
    const isDraft = draftKey.includes(statusCode);
    const isFinalize = finalizeKey.includes(statusCode);
    const isForAssignment = forAssignmentKey.includes(statusCode);
    const isItemsManagement = itemsManagementKey.includes(statusCode);
    const isItemsVerification = itemsVerificationKey.includes(statusCode);
    const isForCanvas = forCanvasKey.includes(statusCode);
    const isCanvasVerification = canvasVerificationKey.includes(statusCode);
    const isPriceVerification = priceVerificationKey.includes(statusCode);
    const isPricing =
      forPricingKey.includes(statusCode) ||
      priceVerificationKey.includes(statusCode) ||
      priceApprovalKey.includes(statusCode);
    const isRevertHidden = isDraft || forAssignmentKey.includes(statusCode);

    const viewIcon = isDraft ? (
      <Description />
    ) : isFinalize ||
      isItemsVerification ||
      isCanvasVerification ||
      isPriceVerification ? (
      <GppGood />
    ) : isForAssignment ? (
      <AssignmentInd />
    ) : isItemsManagement ? (
      <ListAlt />
    ) : isForCanvas ? (
      <ContactPage />
    ) : forPricingKey.includes(statusCode) ? (
      <PriceCheck />
    ) : (
      <Visibility />
    );

    const viewTooltip = isDraft
      ? "Draft"
      : isFinalize
        ? "Transaction"
        : isForAssignment
          ? "Assign/Reassign"
          : isItemsManagement
            ? "Item Management"
            : isItemsVerification
              ? "Verify Transaction Item"
              : isForCanvas
                ? "For Canvas"
                : isCanvasVerification
                  ? "Verify Canvas"
                  : isPricing
                    ? "Pricing"
                    : isPriceVerification
                      ? "Verify Pricing"
                      : "View Transaction";

    const handleView = (e) => {
      e.stopPropagation();
      navigate(isPricing ? "/transaction-pricing-set" : "/transaction-canvas", {
        state: isPricing
          ? {
              transaction: row,
              selectedStatusCode: statusCode,
              isManagement,
              isProcurementTL, // ← add
              transacstatus,
              forPricingKey,
              priceSettingKey: forPricingKey, // ← add this
              priceVerificationKey,
              priceApprovalKey,
              isPricingSetting,
              currentStatusLabel: filterStatus,
              currentUserId: userId,
            }
          : {
              ...buildCanvasState(row),
              selectedStatusCode: statusCode,
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
      });
    };

    return (
      <div className="flex justify-center gap-0">
        {(isDraft || isManagement) && (
          <BaseButton
            icon={<Edit />}
            tooltip="Edit Transaction"
            size="small"
            actionColor="edit"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsAEModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={viewIcon}
          tooltip={viewTooltip}
          size="small"
          actionColor="view"
          onClick={handleView}
        />
        {(isPricing || isForCanvas || isCanvasVerification) && (
          <BaseButton
            icon={<RequestQuote />}
            tooltip="Direct Cost"
            size="small"
            actionColor="breakdown"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsDirectCostModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={<History />}
          tooltip="View Transaction History"
          size="small"
          actionColor="deactivate"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTransaction(row);
            setIsHistoryModalOpen(true);
          }}
        />
        {!isRevertHidden && (
          <BaseButton
            icon={<Replay />}
            tooltip="Revert Transaction"
            size="small"
            actionColor="revert"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsRevertModalOpen(true);
            }}
          />
        )}
        {isDraft && (
          <BaseButton
            icon={<Delete />}
            tooltip="Delete Transaction"
            size="small"
            actionColor="delete"
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
  // ── Procurement ───────────────────────────────────────────────────────────
  if (isProcurement) {
    const isDraft = draftKey.includes(statusCode);
    const isFinalize = finalizeKey.includes(statusCode);
    const isFinalizeVerification = finalizeVerificationKey.includes(statusCode);
    const isPriceSet = priceSettingKey.includes(statusCode);
    const isPriceFinalize = priceFinalizeKey.includes(statusCode);
    const isPriceFinalizeVerification =
      priceFinalizeVerificationKey.includes(statusCode);
    const isPriceApproval = procPriceApprovalKey.includes(statusCode);
    const isPricing =
      isPriceSet ||
      isPriceFinalize ||
      isPriceFinalizeVerification ||
      isPriceApproval;
    const isRevertVisible =
      !draftKey.includes(statusCode) && !priceSettingKey.includes(statusCode);

    const viewIcon = isDraft ? (
      <Description />
    ) : isFinalize ? (
      <CheckCircleOutline />
    ) : isFinalizeVerification ? (
      <GppGood />
    ) : isPriceSet ? (
      <Sell />
    ) : isPriceFinalize ? (
      <PriceCheck />
    ) : isPriceFinalizeVerification ? (
      <GppGood />
    ) : isPriceApproval ? (
      <Verified />
    ) : (
      <Visibility />
    );

    const viewTooltip = isDraft
      ? "View Draft"
      : isFinalize
        ? "View Transaction"
        : isFinalizeVerification
          ? "Verify Transaction"
          : isPriceSet
            ? "Set Pricing"
            : isPriceFinalize
              ? "Finalize Pricing"
              : isPriceFinalizeVerification
                ? "Verify Pricing"
                : isPriceApproval
                  ? "Approve Pricing"
                  : "View Transaction";

    const handleView = (e) => {
      e.stopPropagation();
      navigate(isPricing ? "/transaction-pricing-set" : "/transaction-canvas", {
        state: isPricing
          ? {
              transaction: row,
              selectedStatusCode: statusCode,
              clientNickName: row.clientName,
              proc_status,
              priceSettingKey,
              priceFinalizeKey,
              priceFinalizeVerificationKey,
              priceApprovalKey: procPriceApprovalKey,
              isPricingSetting,
              isManagement,
              isProcurementTL, // ← add
              currentStatusLabel: filterStatus,
            }
          : {
              ...buildCanvasState(row),
              selectedStatusCode: statusCode,
              isProcurement,
              proc_status,
              draftKey,
              finalizeKey,
              priceSettingKey,
              finalizeVerificationKey,
              priceFinalizeVerificationKey,
              currentStatusLabel: filterStatus,
            },
      });
    };

    return (
      <div className="flex justify-center gap-0">
        {isDraft && (
          <BaseButton
            icon={<Edit />}
            tooltip="Edit Transaction"
            size="small"
            actionColor="edit"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsAEModalOpen(true);
            }}
          />
        )}
        <BaseButton
          icon={viewIcon}
          tooltip={viewTooltip}
          size="small"
          actionColor="view"
          onClick={handleView}
        />
        {isDraft && (
          <BaseButton
            icon={<Delete />}
            tooltip="Delete Transaction"
            size="small"
            actionColor="delete"
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
            icon={<Undo />}
            tooltip="Revert Transaction"
            size="small"
            actionColor="revert"
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
            size="small"
            actionColor="breakdown"
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
  // ── Account Officer ───────────────────────────────────────────────────────
  if (isAccountOfficer) {
    const isItemsManagement = itemsManagementKey.includes(statusCode);
    const isItemsFinalize = itemsFinalizeKey.includes(statusCode);
    const isItemsVerification = itemsVerificationKey.includes(statusCode);
    const isForCanvas = forCanvasKey.includes(statusCode);
    const isCanvasFinalize = canvasFinalizeKey.includes(statusCode);
    const isCanvasVerification = canvasVerificationKey.includes(statusCode);
    const isForAssignment = forAssignmentKey.includes(statusCode);
    const hideRevert = isItemsManagement || isForAssignment;

    const viewIcon = isItemsManagement ? (
      <ListAlt />
    ) : isItemsFinalize || isCanvasFinalize ? (
      <CheckCircleOutline />
    ) : isItemsVerification || isCanvasVerification ? (
      <GppGood />
    ) : isForCanvas ? (
      <ContactPage />
    ) : isForAssignment ? (
      <AssignmentInd />
    ) : (
      <Visibility />
    );

    const viewTooltip = isForAssignment
      ? "For Assignment"
      : isItemsManagement
        ? "Manage Items"
        : isItemsFinalize
          ? "Finalize Items"
          : isItemsVerification
            ? "Verify Items"
            : isForCanvas
              ? "Canvas"
              : isCanvasFinalize
                ? "Finalize Canvas"
                : isCanvasVerification
                  ? "Verify Canvas"
                  : "View Transaction";

    return (
      <div className="flex justify-center gap-0">
        <BaseButton
          icon={viewIcon}
          tooltip={viewTooltip}
          size="small"
          actionColor="view"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/transaction-canvas", { state: buildCanvasState(row) });
          }}
        />
        {(isCanvasFinalize || isForCanvas || isCanvasVerification) && (
          <BaseButton
            icon={<RequestQuote />}
            tooltip="Direct Cost"
            size="small"
            actionColor="breakdown"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsDirectCostModalOpen(true);
            }}
          />
        )}
        {!hideRevert && (
          <BaseButton
            icon={<Replay />}
            tooltip="Revert Transaction"
            size="small"
            actionColor="revert"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setIsRevertModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }
  return null;
}

// =============================================================================
function Transaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed: sidebarCollapsed } = useSidebar();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const prevFilterStatus = useRef("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDirectCostModalOpen, setIsDirectCostModalOpen] = useState(false);
  const [isAEModalOpen, setIsAEModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

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

  const {
    isManagement,
    isProcurement,
    isAccountOfficer,
    isAOTL,
    isProcurementTL,
  } = getUserRoles(userTypes);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const userId = user?.nUserId;

  // ── Status map (role-based) ───────────────────────────────────────────────
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

  const sessionKey = useMemo(
    () =>
      isManagement
        ? "selectedStatusCode"
        : isProcurement
          ? "selectedProcStatusCode"
          : "selectedAOStatusCode",
    [isManagement, isProcurement],
  );

  // ── Status keys ───────────────────────────────────────────────────────────
  // proc_status keys by index:
  //   0='100' Draft, 1='110' Finalized, 2='115' Verification(virtual),
  //   3='300' Price Setting, 4='310' Price Finalized, 5='315' Price Verif(virtual), 6='320' Price Approval
  //
  // ao_status keys by index:
  //   0='210' Items Mgmt, 1='220' Items Finalized, 2='225' Items Verif(virtual),
  //   3='230' For Canvas, 4='240' Canvas Finalized, 5='245' Canvas Verif(virtual)
  //
  // aotl_status keys by index:
  //   0='200' For Assignment, 1='210' Items Mgmt, 2='220' Items Finalized,
  //   3='225' Items Verif(virtual), 4='230' For Canvas, 5='240' Canvas Finalized, 6='245' Canvas Verif(virtual)
  const statusKeys = useMemo(() => {
    const mgmtKeys = Object.keys(transacstatus);
    const procKeys = Object.keys(proc_status);
    const aoKeys = Object.keys(ao_status);
    const aotlKeys = Object.keys(aotl_status);

    return {
      // ── Management ──────────────────────────────────────────────
      // mgmtKeys: 0='100',1='110',2='200',3='210',4='220',5='230',6='240',7='300',8='310',9='320'
      draftKey: isManagement ? mgmtKeys[0] : isProcurement ? procKeys[0] : "",
      finalizeKey: isManagement
        ? mgmtKeys[1]
        : isProcurement
          ? procKeys[1]
          : "",
      forAssignmentKey: isManagement ? mgmtKeys[2] : isAOTL ? aotlKeys[0] : "",

      // ── Items management / finalize / verification ───────────────
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
      // ↑ NOTE: management uses index 4 (220) for both "finalized" and "items verification"
      //   because the management view doesn't distinguish own vs others — it sees the real code.
      //   AO/AOTL use virtual codes (225) for "someone else's finalized items to verify".

      // ── Canvas ───────────────────────────────────────────────────
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

      // ── Pricing (management + procurement) ───────────────────────
      forPricingKey: isManagement ? mgmtKeys[7] : "",
      priceVerificationKey: isManagement ? mgmtKeys[8] : "",
      priceApprovalKey: isManagement ? mgmtKeys[9] : "",

      // ── Procurement-specific ─────────────────────────────────────
      // procKeys: 0='100',1='110',2='115'(virtual),3='300',4='310',5='315'(virtual),6='320'
      finalizeVerificationKey: isProcurement ? procKeys[2] : "", // '115' virtual
      priceSettingKey: isProcurement ? procKeys[3] : "", // '300'
      priceFinalizeKey: isProcurement ? procKeys[4] : "", // '310'
      priceFinalizeVerificationKey: isProcurement ? procKeys[5] : "", // '315' virtual
      procPriceApprovalKey: isProcurement ? procKeys[6] : "", // '320'
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

  // ── selectedStatusCode (derived, stable) ─────────────────────────────────
  const selectedStatusCode = useMemo(
    () =>
      Object.keys(statusMap).find((k) => statusMap[k] === filterStatus) ?? "",
    [statusMap, filterStatus],
  );

  // ── Persist selectedStatusCode to sessionStorage ──────────────────────────
  useEffect(() => {
    if (selectedStatusCode)
      sessionStorage.setItem(sessionKey, selectedStatusCode);
  }, [selectedStatusCode, sessionKey]);

  // ── Filter status init ────────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading || Object.keys(statusMap).length === 0) return;
    const savedCode = sessionStorage.getItem(sessionKey);
    setFilterStatus(
      savedCode && statusMap[savedCode]
        ? statusMap[savedCode]
        : (Object.values(statusMap)[0] ?? ""),
    );
  }, [mappingLoading, statusMap, sessionKey, location.key]);

  useEffect(() => {
    if (mappingLoading || Object.keys(statusMap).length === 0) return;
    const handleFocus = () => {
      const savedCode = sessionStorage.getItem(sessionKey);
      if (savedCode && statusMap[savedCode])
        setFilterStatus(statusMap[savedCode]);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [mappingLoading, statusMap, sessionKey]);

  // ── isPricingSetting ──────────────────────────────────────────────────────
  const isPricingSetting = useMemo(
    () =>
      isManagement
        ? selectedStatusCode === forPricingKey
        : isProcurement
          ? selectedStatusCode === priceSettingKey
          : false,
    [
      isManagement,
      isProcurement,
      selectedStatusCode,
      forPricingKey,
      priceSettingKey,
    ],
  );

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Pulse skeleton on filter tab switch ──────────────────────────────────
  useEffect(() => {
    if (!filterStatus || filterStatus === prevFilterStatus.current) return;
    prevFilterStatus.current = filterStatus;
    if (initialLoading) return;
    setFilterLoading(true);
    const id = setTimeout(() => setFilterLoading(false), 0);
    return () => clearTimeout(id);
  }, [filterStatus, initialLoading]);

  // ── Cache key ─────────────────────────────────────────────────────────────
  const cacheKey = `txn_cache_${userId}_${isManagement ? "mgmt" : isProcurement ? "proc" : isAOTL ? "aotl" : "ao"}`;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(
    async (opts = {}) => {
      const { silent = false, bustCache = false } = opts;

      if (bustCache) invalidateCache(cacheKey);

      if (!silent && !bustCache) {
        const cached = getCachedTransactions(cacheKey);
        if (cached) {
          setTransactions(cached);
          setLoading(false);
          setInitialLoading(false);
          fetchTransactions({ silent: true });
          return;
        }
      }

      setLoading(true);

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
        const formatted = list.map((txn, idx) => {
          // current_status already has virtual codes remapped by the backend
          const statusCode = txn.current_status ?? txn.latest_history?.nStatus;
          return {
            ...txn,
            id: txn.nTransactionId ?? `txn-fallback-${idx}`,
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
            creator_id: txn.creator_id ?? null,
            aoName: txn.user
              ? `${txn.user.strFName} ${txn.user.strLName}`.trim()
              : "",
            aoUserId: txn.nAssignedAO || txn.user?.nUserId,
            aoDueDate:
              isAccountOfficer || isManagement
                ? formatDate(txn.dtAODueDate, fallback)
                : undefined,
          };
        });

        setTransactions(formatted);
        setCachedTransactions(cacheKey, formatted);
        window.dispatchEvent(new CustomEvent("txn_cache_updated"));
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
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

  const fetchRef = useRef(fetchTransactions);
  useEffect(() => {
    fetchRef.current = fetchTransactions;
  }, [fetchTransactions]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!mappingLoading && !hasFetched.current) {
      hasFetched.current = true;
      fetchTransactions();
    }
  }, [mappingLoading, fetchTransactions]);

  // ── Echo real-time subscriptions ──────────────────────────────────────────
  // ✅ Add this NEW useEffect (after your existing window event useEffect)
  useEffect(() => {
    if (mappingLoading) return;

    const channel = echo.channel("transactions");

    channel.listen(".transaction.updated", (event) => {
      if (event.action === "deleted") {
        setTransactions((prev) =>
          prev.filter(
            (t) => (t.nTransactionId ?? t.id) !== event.transactionId,
          ),
        );
        invalidateCache(cacheKey);
        return;
      }
      fetchRef.current({ silent: true, bustCache: true });
    });

    return () => {
      echo.leaveChannel("transactions");
    };
  }, [mappingLoading, cacheKey]);
  useEffect(() => {
    const onUpdated = () => fetchRef.current({ silent: true, bustCache: true });
    const onDeleted = (e) => {
      setTransactions((prev) =>
        prev.filter((t) => t.id !== e.detail?.transactionId),
      );
      invalidateCache(cacheKey);
    };
    window.addEventListener("txn_data_updated", onUpdated);
    window.addEventListener("txn_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("txn_data_updated", onUpdated);
      window.removeEventListener("txn_data_deleted", onDeleted);
    };
  }, [cacheKey]);
  // ── Filtered transactions ─────────────────────────────────────────────────
  // Aligns to mappings.php comment rules per role:
  //
  // MANAGEMENT (transaction_filter_content):
  //   '100' => only status=100
  //   '110' => only status=110
  //   '200' => status IN (200,210,220,230,240)  ← "For Assignment" bucket
  //   '210' => only status=210
  //   '220' => only status=220
  //   '230' => only status=230
  //   '240' => only status=240
  //   '300' => only status=300
  //   '310' => only status=310
  //   '320' => only status=320
  //
  // PROCUREMENT (proc_status):
  //   '100' => status=100  AND creator_id == me
  //   '110' => status=110  AND creator_id == me
  //   '115' => status=115  (virtual — remapped by backend when creator != me)
  //   '300' => status=300  AND creator_id == me
  //   '310' => status=310  AND creator_id == me
  //   '315' => status=315  (virtual — remapped by backend when creator != me)
  //   '320' => status=320  AND creator_id == me
  //
  // AO (ao_status):
  //   '210' => status=210  AND nAssignedAO == me
  //   '220' => status=220  AND nAssignedAO == me
  //   '225' => status=225  (virtual — remapped by backend when nAssignedAO != me)
  //   '230' => status=230  AND nAssignedAO == me
  //   '240' => status=240  AND nAssignedAO == me
  //   '245' => status=245  (virtual — remapped by backend when nAssignedAO != me)
  //
  // AOTL (aotl_status):
  //   '200' => status IN (200,210,220,225,230,240,245)  ← "For Assignment" bucket (all)
  //   '210' => status=210  AND nAssignedAO == me
  //   '220' => status=220  AND nAssignedAO == me
  //   '225' => status=225  (virtual)
  //   '230' => status=230  AND nAssignedAO == me
  //   '240' => status=240  AND nAssignedAO == me
  //   '245' => status=245  (virtual)
  const filteredTransactions = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();

    return transactions.filter((t) => {
      // ── Search ──────────────────────────────────────────────────
      const matchesSearch =
        !searchLower ||
        t.transactionId?.toLowerCase().includes(searchLower) ||
        t.transactionName?.toLowerCase().includes(searchLower) ||
        t.clientName?.toLowerCase().includes(searchLower) ||
        t.companyName?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const txnCode = String(t.status_code ?? "");

      // ── Management ──────────────────────────────────────────────
      if (isManagement) {
        // '200' For Assignment tab: shows transactions in the entire AO pipeline
        if (selectedStatusCode === forAssignmentKey) {
          return ["200", "210", "220", "230", "240"].includes(txnCode);
        }
        return txnCode === String(selectedStatusCode);
      }

      // ── Procurement ─────────────────────────────────────────────
      // Virtual codes (115, 315) are already set by the backend.
      // Own transactions (100, 110, 300, 310, 320) must match creator_id == userId.
      if (isProcurement) {
        const isMyCode = (code) =>
          txnCode === String(code) && String(t.creator_id) === String(userId);
        const isVirtual = (code) => txnCode === String(code);

        switch (String(selectedStatusCode)) {
          case draftKey:
            return isMyCode(draftKey); // '100' — mine
          case finalizeKey:
            return isMyCode(finalizeKey); // '110' — mine
          case finalizeVerificationKey:
            return isVirtual(finalizeVerificationKey); // '115' — virtual
          // case priceSettingKey:
          //   return isMyCode(priceSettingKey); // '300' — mine
          case priceSettingKey:
            return txnCode === String(priceSettingKey);
          case priceFinalizeKey:
            return isMyCode(priceFinalizeKey); // '310' — mine
          case priceFinalizeVerificationKey:
            return isVirtual(priceFinalizeVerificationKey); // '315' — virtual
          case procPriceApprovalKey:
            return isMyCode(procPriceApprovalKey); // '320' — mine
          default:
            return false;
        }
      }

      // ── AOTL ─────────────────────────────────────────────────────
      if (isAOTL) {
        // '200' For Assignment tab: ALL AO-pipeline statuses
        if (selectedStatusCode === forAssignmentKey) {
          return ["200", "210", "220", "225", "230", "240", "245"].includes(
            txnCode,
          );
        }

        // Virtual verification codes are shown to AOTL regardless of assignment
        if (
          selectedStatusCode === itemsVerificationKey ||
          selectedStatusCode === canvasVerificationKey
        ) {
          return txnCode === String(selectedStatusCode);
        }

        // Own items: only if assigned to me
        return (
          txnCode === String(selectedStatusCode) &&
          String(t.aoUserId) === String(userId)
        );
      }

      // ── Account Officer ──────────────────────────────────────────
      // Virtual codes (225, 245) — show without user filter (backend already narrowed it)
      if (
        selectedStatusCode === itemsVerificationKey ||
        selectedStatusCode === canvasVerificationKey
      ) {
        return txnCode === String(selectedStatusCode);
      }

      // Own transactions: only if assigned to me
      return (
        txnCode === String(selectedStatusCode) &&
        String(t.aoUserId) === String(userId)
      );
    });
  }, [
    transactions,
    debouncedSearch,
    selectedStatusCode,
    isManagement,
    isProcurement,
    isAOTL,
    userId,
    forAssignmentKey,
    itemsManagementKey,
    itemsVerificationKey,
    canvasVerificationKey,
    draftKey,
    finalizeKey,
    finalizeVerificationKey,
    priceSettingKey,
    priceFinalizeKey,
    priceFinalizeVerificationKey,
    procPriceApprovalKey,
  ]);

  // ── Column visibility ─────────────────────────────────────────────────────
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
            priceVerificationKey.includes(selectedStatusCode) ||
            priceSettingKey.includes(selectedStatusCode) ||
            priceFinalizeVerificationKey.includes(selectedStatusCode) ||
            procPriceApprovalKey.includes(selectedStatusCode)
          : isProcurement
            ? finalizeVerificationKey.includes(selectedStatusCode) ||
              priceFinalizeVerificationKey.includes(selectedStatusCode) ||
              priceSettingKey.includes(selectedStatusCode) ||
              priceFinalizeKey.includes(selectedStatusCode) ||
              procPriceApprovalKey.includes(selectedStatusCode)
            : false),

      showAOActionColumn: isAccountOfficer && !!selectedStatusCode,
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

  // ── Status label helpers ──────────────────────────────────────────────────
  const statusLabelMap = isManagement ? transacstatus : ao_status;
  const itemsManagementLabel = statusLabelMap[itemsManagementKey] || "";
  const canvasVerificationLabel = statusLabelMap[canvasVerificationKey] || "";
  const forCanvasLabel = statusLabelMap[forCanvasKey] || "";
  const finalizeKeyLabel = isManagement
    ? transacstatus[finalizeKey] || ""
    : ao_status[itemsFinalizeKey] || "";

  const isDraft = draftKey.includes(selectedStatusCode);
  const isFinalize = finalizeKey.includes(selectedStatusCode);

  // ── Canvas state builder ──────────────────────────────────────────────────
  const buildCanvasState = useCallback(
    (row) => ({
      transactionId: row.id,
      transactionCode: row.transactionId,
      transaction: row,
      nUserId: row?.user?.nUserId || row?.latest_history?.nUserId,
      currentUserId: userId,
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
    }),
    [
      userId,
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
      filterStatus,
    ],
  );

  // ── Stable action options object ──────────────────────────────────────────
  const actionOpts = useMemo(
    () => ({
      userId,
      isManagement,
      isProcurement,
      isProcurementTL,
      isAccountOfficer,
      selectedStatusCode,
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
      priceSettingKey,
      priceFinalizeKey,
      priceFinalizeVerificationKey,
      procPriceApprovalKey,
      finalizeVerificationKey,
      isPricingSetting,
      filterStatus,
      proc_status,
      transacstatus,
      itemType,
      procMode,
      procSource,
      statusTransaction,
      userTypes,
      vaGoSeValue,
      buildCanvasState,
      navigate,
      setSelectedTransaction,
      setIsAEModalOpen,
      setIsHistoryModalOpen,
      setIsRevertModalOpen,
      setIsDirectCostModalOpen,
      setIsDeleteModalOpen,
      setEntityToDelete,
    }),
    [
      isManagement,
      isProcurement,
      isProcurementTL,
      isAccountOfficer,
      selectedStatusCode,
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
      priceSettingKey,
      priceFinalizeKey,
      priceFinalizeVerificationKey,
      procPriceApprovalKey,
      finalizeVerificationKey,
      isPricingSetting,
      filterStatus,
      proc_status,
      transacstatus,
      itemType,
      procMode,
      procSource,
      statusTransaction,
      userTypes,
      vaGoSeValue,
      buildCanvasState,
      navigate,
    ],
  );

  const renderActions = useCallback(
    (_, row) => buildActions(row, actionOpts),
    [actionOpts],
  );

  // ── Row click handler ─────────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (row) => {
      const statusCode = String(
        row.status_code ?? row.latest_history?.nStatus ?? "",
      );

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
                  isProcurementTL,
                  transacstatus,
                  forPricingKey,
                  priceVerificationKey,
                  priceApprovalKey,
                  isPricingSetting,
                  currentStatusLabel: filterStatus,
                  currentUserId: userId,
                }
              : {
                  ...buildCanvasState(row),
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
                  isProcurementTL,
                  currentStatusLabel: filterStatus,
                }
              : {
                  ...buildCanvasState(row),
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

      navigate("/transaction-canvas", { state: buildCanvasState(row) });
    },
    [
      isManagement,
      isProcurement,
      selectedStatusCode,
      isPricingSetting,
      filterStatus,
      forPricingKey,
      priceVerificationKey,
      priceApprovalKey,
      priceSettingKey,
      priceFinalizeKey,
      priceFinalizeVerificationKey,
      procPriceApprovalKey,
      draftKey,
      finalizeKey,
      finalizeVerificationKey,
      transacstatus,
      proc_status,
      itemType,
      procMode,
      procSource,
      statusTransaction,
      userTypes,
      buildCanvasState,
      navigate,
    ],
  );

  // ── Add transaction saved (procurement) ───────────────────────────────────
  const handleAddTransactionSaved = useCallback(async () => {
    const defaultValue = Object.values(proc_status)?.[0];
    if (defaultValue) {
      setFilterStatus(defaultValue);
      sessionStorage.setItem(sessionKey, Object.keys(proc_status)[0]);
    }
    await fetchTransactions({ bustCache: true });
  }, [proc_status, sessionKey, fetchTransactions]);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      { key: "transactionId", label: "Code" },
      { key: "transactionName", label: "Transaction" },
      { key: "clientName", label: "Client" },
      { key: "companyName", label: "Company" },
      {
        key: "date",
        label: "Submission",
        align: "center",
        render: (_, row) => {
          const color = getDueDateColor(row.dtDocSubmission);
          return (
            <span
              style={{
                color: color ?? "inherit",
                fontWeight: color ? 600 : 400,
              }}
            >
              {row.date}
            </span>
          );
        },
      },
      ...(isAssignedToColumnVisible
        ? [{ key: "aoName", label: "Assigned AO" }]
        : []),
      ...(isCreatedByColumnVisible
        ? [{ key: "createdBy", label: "Created by" }]
        : []),
      ...(isAssignedToColumnVisible
        ? [
            {
              key: "aoDueDate",
              label: "AO Due Date",
              align: "center",
              render: (_, row) => {
                const color = getDueDateColor(row.dtAODueDate);
                return (
                  <span
                    style={{
                      color: color ?? "inherit",
                      fontWeight: color ? 600 : 400,
                    }}
                  >
                    {row.aoDueDate}
                  </span>
                );
              },
            },
          ]
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
      isManagement,
      isDraft,
      isFinalize,
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

        <SyncMenu onSync={() => fetchTransactions({ bustCache: true })} />

        {/* {sidebarCollapsed && (
          <div className="hidden lg:block">
            <TransactionFilterMenu
              statuses={statusMap}
              items={transactions}
              selectedStatus={filterStatus}
              onSelect={setFilterStatus}
              // ── Role flags ──────────────────────────────────────────────
              isManagement={isManagement}
              isProcurement={isProcurement}
              isAOTL={isAOTL}
              currentUserId={userId}
              // ── Shared / management / AO keys ───────────────────────────
              forAssignmentCode={forAssignmentKey}
              itemsManagementCode={itemsManagementKey}
              itemsVerificationCode={itemsVerificationKey}
              forCanvasCode={forCanvasKey}
              canvasVerificationCode={canvasVerificationKey}
              // ── Procurement keys ─────────────────────────────────────────
              draftKey={draftKey}
              finalizeKey={finalizeKey}
              finalizeVerificationKey={finalizeVerificationKey}
              priceSettingKey={priceSettingKey}
              priceFinalizeKey={priceFinalizeKey}
              priceFinalizeVerificationKey={priceFinalizeVerificationKey}
              procPriceApprovalKey={procPriceApprovalKey}
            />
          </div>
        )} */}

        {(isProcurement || isManagement) && (
          <BaseButton
            label="Transaction"
            tooltip="Add Transaction"
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
          loading={initialLoading || filterLoading || loading}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleRowClick}
        />
      </section>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
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
            fetchTransactions({ bustCache: true });
            if (newStatusCode && statusMap[newStatusCode]) {
              setFilterStatus(statusMap[newStatusCode]);
              sessionStorage.setItem(sessionKey, newStatusCode);
              window.dispatchEvent(
                new CustomEvent("txn_status_changed", {
                  detail: { code: String(newStatusCode) },
                }),
              );
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

      {isDirectCostModalOpen && selectedTransaction && (
        <DirectCostModal
          open={isDirectCostModalOpen}
          onClose={() => {
            setIsDirectCostModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          isPricingSetting={
            isPricingSetting || forCanvasKey.includes(selectedStatusCode)
          }
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
            onSuccess={() => fetchTransactions({ bustCache: true })}
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
