import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import useMapping from "../../../../../utils/mappings/useMapping";
import { getUserRoles } from "../../../../../utils/helpers/roleHelper";
import { getDueDateColor } from "../../../../../utils/helpers/dueDateColor";
import SidebarSubmenu from "../sidebar/SidebarSubmenu";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { getItem } from "../../../../../utils/storage/localStorage";

function getRelevantDate(t) {
  const code = Number(t.current_status ?? t.latest_history?.nStatus ?? 0);
  return code >= 200 && code <= 245 ? t.dtAODueDate : t.dtDocSubmission;
}

const TransactionSubItems = ({ onItemClick, selectedCode, onSelect }) => {
  const location = useLocation();

  const {
    ao_status,
    aotl_status,
    proc_status,
    transacstatus,
    userTypes,
    archiveStatus,
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

  // Use the same storage helper as usePurchaseCart / useTransaction.
  // Raw localStorage.getItem("user") parsing was returning an object
  // without nUserId, leaving userId undefined and breaking both the
  // isMe/isMine filters below AND the `nUserId=${userId}` query params
  // sent to the API.
  const userId = useMemo(() => getItem("user", {})?.nUserId, []);

  const [transactions, setTransactions] = React.useState([]);
  const [countLoading, setCountLoading] = React.useState(true);

  const fetchSilent = React.useCallback(async () => {
    if (mappingLoading) return;
    try {
      let list = [];
      if (isManagement) {
        const res = await TransactionAPI.getAll();
        list = (res.transactions || res.data || []).filter(Boolean);
      } else if (isFinanceOfficer) {
        const res = await TransactionAPI.getFinance(`nUserId=${userId}`);
        list = (res.transactions || res.data || []).filter(Boolean);
      } else if (isProcurement) {
        const res = await TransactionAPI.getProcurement(
          `nUserId=${userId}&isProcTL=${isProcurementTL ? 1 : 0}`,
        );
        list = (res.transactions || []).filter(Boolean);
      } else {
        const res = await TransactionAPI.getAccountOfficer(
          `nUserId=${userId}&isAOTL=${isAOTL ? 1 : 0}&fetchAll=${isAOTL ? 1 : 0}`,
        );
        list = (res.transactions || []).filter(Boolean);
      }
      setTransactions(list);
    } catch (err) {
      console.error("Sidebar silent fetch error:", err);
    }
  }, [
    mappingLoading,
    isManagement,
    isFinanceOfficer,
    isProcurement,
    isProcurementTL,
    isAOTL,
    userId,
  ]);

  const fetchSilentRef = React.useRef(fetchSilent);
  React.useEffect(() => {
    fetchSilentRef.current = fetchSilent;
  }, [fetchSilent]);

  React.useEffect(() => {
    if (mappingLoading) return;
    setCountLoading(true);
    fetchSilent().finally(() => setCountLoading(false));
  }, [mappingLoading]);

  // ✅ Listen to global events from transactionsChannel
  React.useEffect(() => {
    const handleUpdated = () => fetchSilentRef.current();
    const handleDeleted = (e) => {
      const id = e.detail?.transactionId;
      if (id) {
        setTransactions((prev) =>
          prev.filter((t) => String(t.nTransactionId ?? t.id) !== String(id)),
        );
      } else {
        fetchSilentRef.current();
      }
    };

    window.addEventListener("txn_data_updated", handleUpdated);
    window.addEventListener("txn_data_deleted", handleDeleted);
    return () => {
      window.removeEventListener("txn_data_updated", handleUpdated);
      window.removeEventListener("txn_data_deleted", handleDeleted);
    };
  }, []);

  // Guarded ownership checks: both sides must actually have a value.
  // Prevents "undefined === undefined" false-positive matches if userId
  // or the transaction's assignment field is ever missing again.
  const isMe = useMemo(
    () => (t) =>
      userId != null &&
      t?.nAssignedAO != null &&
      String(t.nAssignedAO) === String(userId),
    [userId],
  );
  const isMine = useMemo(
    () => (t) =>
      userId != null &&
      t?.creator_id != null &&
      String(t.creator_id) === String(userId),
    [userId],
  );

  const statusCounts = useMemo(() => {
    if (!Object.keys(statusMap).length) return {};
    const txnCode = (t) =>
      t ? String(t.current_status ?? t.latest_history?.nStatus ?? "") : "";
    const counts = {};
    if (isManagement || isFinanceOfficer) {
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
          case forPurchaseKey:
            counts[code] = transactions.filter(
              (t) => txnCode(t) === code && (isProcurementTL || isMine(t)),
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
              (t) => txnCode(t) === code,
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
    isFinanceOfficer,
    isProcurement,
    isProcurementTL,
    isAOTL,
    isMe,
    isMine,
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
    const getBucket = (code) => {
      if (isManagement || isFinanceOfficer) {
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
          case forPurchaseKey:
            return transactions.filter(
              (t) => txnCode(t) === code && (isProcurementTL || isMine(t)),
            );
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
            return transactions.filter((t) => txnCode(t) === code);
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
    isFinanceOfficer,
    isProcurement,
    isProcurementTL,
    isAOTL,
    isMe,
    isMine,
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
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: "12px",
              minHeight: "32px",
            }}
          >
            <div
              style={{
                width: "60%",
                height: "13px",
                borderRadius: "4px",
                background: "#e0e0e0",
              }}
            />
          </div>
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

export default TransactionSubItems;
