import { useState, useEffect, useMemo } from "react";
import { JevAPI } from "../../../api/endpoints/jev.api.js";
import JevEntriesApi from "../../../api/endpoints/jev-entries.api.js";
import JournalAccountAPI from "../../../api/endpoints/journal-account.api.js";
import echo from "../../../lib/echo";
import useMapping from "../../../utils/mappings/useMapping";
/**
 * Calculate totals using FROM / TO instead of Debit / Credit
 * - cType = "from" → outgoing amount
 * - cType = "to"   → incoming amount
 */
export const calcTotals = (logs = []) => {
  const fromTotal = logs.reduce(
    (sum, log) => sum + (log.cType === "from" ? Number(log.dAmount || 0) : 0),
    0,
  );
  const toTotal = logs.reduce(
    (sum, log) => sum + (log.cType === "to" ? Number(log.dAmount || 0) : 0),
    0,
  );
  return { fromTotal, toTotal, net: toTotal - fromTotal };
};

const ALL_COMPANY_ID = "__all_companies__";

// ── Tree Builders ───────────────────────────────────────────────────────
const buildAccountIndex = (accounts = []) => {
  const byId = {};
  accounts.forEach((a) => {
    byId[a.nJournalAccountId] = {
      ...a,
      id: a.nJournalAccountId,
      accountName: a.strAccountName,
    };
  });
  return byId;
};

const getAccountChain = (accountId, byId) => {
  const chain = [];
  let current = byId[accountId];
  while (current) {
    chain.unshift(current.id);
    current = current.nParentAccountId ? byId[current.nParentAccountId] : null;
  }
  return chain;
};

const aggregateNodeTotals = (node) => {
  let allLogs = [...node.logs];
  node.children.forEach((child) => {
    const childData = aggregateNodeTotals(child);
    allLogs = allLogs.concat(childData.allLogs);
  });
  node.totals = calcTotals(allLogs);
  node.allLogs = allLogs;
  node.logCount = allLogs.length;
  return { allLogs };
};

const buildCompanyAccountTree = (companyLogs = [], byId = {}) => {
  const roots = [];
  companyLogs.forEach((log) => {
    const accId = log.nJournalAccountId;
    if (!byId[accId]) return;

    const chain = getAccountChain(accId, byId);
    let parentList = roots;

    chain.forEach((id, idx) => {
      const acc = byId[id];
      if (!acc) return;

      let node = parentList.find((n) => n.id === id);
      if (!node) {
        node = {
          id,
          accountName: acc.accountName,
          nParentAccountId: acc.nParentAccountId,
          children: [],
          logs: [],
        };
        parentList.push(node);
      }

      if (idx === chain.length - 1) {
        node.logs.push(log);
      }
      parentList = node.children;
    });
  });

  roots.forEach(aggregateNodeTotals);
  return roots;
};

// ── Main Hook ─────────────────────────────────────────────────────────────
export default function useJournalEntryVoucher() {
  const [jevList, setJevList] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState(null);

  const { jev_types, loading: mappingLoading } = useMapping();

  // ── API — using YOUR actual available endpoints ──────────────────────────
  const fetchAllJEV = async () => {
    setLoading(true);
    try {
      const res = await JevAPI.getAll();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setJevList(data);
    } catch (err) {
      console.error("Error fetching JEV:", err);
      setJevList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAccounts = async () => {
    try {
      const res = await JournalAccountAPI.getAll();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setAllAccounts(data);
    } catch (err) {
      console.error("Error fetching journal accounts:", err);
      setAllAccounts([]);
    }
  };

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllJEV();
    fetchAllAccounts();
  }, []);

  useEffect(() => {
    const channel = echo.channel("journal-entry-voucher");
    const handler = () => fetchAllJEV();

    channel.listen(".jev.updated", handler);

    return () => {
      channel.stopListening(".jev.updated", handler);
      echo.leaveChannel("journal-entry-voucher");
    };
  }, []);

  // ── Flatten JEV + Entries into unified log list ─────────────────────────
  const allLogs = useMemo(() => {
    const logs = [];
    jevList.forEach((jev) => {
      (jev.entries || []).forEach((entry) => {
        logs.push({
          ...entry,
          nJEVId: jev.nJEVId,
          cJEVLinkType: jev.cJEVLinkType,
          dtOccur: jev.dtOccur,
          cStatus: jev.cStatus,
          cJevType: jev.cJEVLinkType,
          strPayeeName: entry.strPayeeName || jev.strRemark || "—",
          strJevLink: jev.cJEVLinkType,
          dtCreated: jev.dtOccur,
          cType: Number(entry.dAmount) >= 0 ? "to" : "from",
          dAmount: Math.abs(Number(entry.dAmount)),
        });
      });
    });
    return logs;
  }, [jevList]);

  // ── Computed: Companies + recursive account trees ──────────────────────
  const companyGroups = useMemo(() => {
    const byId = buildAccountIndex(allAccounts);

    const byCompany = allLogs.reduce((acc, log) => {
      const key = log.strCompanyName || "No Company";
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});

    const companies = Object.entries(byCompany).map(([name, logs]) => ({
      id: name,
      name,
      logs,
      accountTree: buildCompanyAccountTree(logs, byId),
    }));

    return [
      {
        id: ALL_COMPANY_ID,
        name: "All Companies",
        logs: allLogs,
        accountTree: buildCompanyAccountTree(allLogs, byId),
      },
      ...companies,
    ];
  }, [allLogs, allAccounts]);

  const jevKeys = Object.keys(jev_types || {});
  const dvTypeKey = jevKeys[0] ?? "";
  const rpTypeKey = jevKeys[1] ?? "";
  const drTypeKey = jevKeys[2] ?? "";
  const siTypeKey = jevKeys[3] ?? "";
  const crTypeKey = jevKeys[4] ?? "";

  return {
    jevList,
    allLogs,
    loading,
    expandedCompany,
    setExpandedCompany,
    jev_types,
    mappingLoading,
    companyGroups,
    calcTotals,
    fetchAllJEV,
    fetchAllAccounts,
    dvTypeKey,
    rpTypeKey,
    drTypeKey,
    siTypeKey,
    crTypeKey,
  };
}
