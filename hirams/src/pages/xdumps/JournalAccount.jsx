import React, { useState, useEffect } from "react";
import PageLayout from "../../../components/common/PageLayout";
import CustomTable from "../../components/common/Table";
import CustomSearchField from "../../components/common/SearchField";
import BaseButton from "../../components/common/BaseButton";
import { Box, Typography, IconButton, Collapse } from "@mui/material";

import {
  Edit,
  Delete,
  Add,
  HistoryOutlined,
  ArrowBackOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccountBalanceOutlined,
  StoreOutlined,
  BadgeOutlined,
  DateRangeOutlined,
  CalendarMonthOutlined,
  BusinessOutlined,
  FlashOnOutlined,
  LocalShippingOutlined, // ← add this
} from "@mui/icons-material";
import api from "../../utils/api/api";
import SyncMenu from "../../components/common/Syncmenu";
import JournalAccountAEModal from "../finance/journal-accounts/modal/JournalAccountAEModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import FlashImportClientsModal from "../finance/journal-accounts/modal/FlashImportClientsModal";
import FlashImportSuppliersModal from "../finance/journal-accounts/modal/FlashImportSuppliersModal";
import echo from "../../../utils/echo";
import useMapping from "../../utils/mappings/useMapping";

// ── Helpers ──────────────────────────────────────────────────────────────
const fmtPHP = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
};

const calcTotals = (logs = []) => {
  const debit = logs.reduce(
    (sum, log) => sum + (log.cType === "from" ? Number(log.dAmount || 0) : 0),
    0,
  );
  const credit = logs.reduce(
    (sum, log) => sum + (log.cType === "to" ? Number(log.dAmount || 0) : 0),
    0,
  );
  return { debit, credit, net: credit - debit };
};

const ALL_COMPANY_ID = "__all_companies__";

// ── Summary metrics bar (This Year / This Month) ────────────────────────────
const MetricCard = ({ icon: Icon, label, data, loading }) => (
  <Box
    sx={{
      flex: 1,
      px: 1.5,
      py: 1.25,
      borderRadius: "10px",
      background: "#fff",
      border: "0.5px solid #E5E7EB",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.75 }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "6px",
          background: "#EEEDFE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: "0.75rem", color: "#534AB7" }} />
      </Box>
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>
    </Box>

    {loading ? (
      <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF" }}>
        Loading…
      </Typography>
    ) : (
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: "0.55rem", color: "#9CA3AF" }}>
            Debit
          </Typography>
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#DC2626" }}
          >
            {fmtPHP(data?.dTotalDebit)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.55rem", color: "#9CA3AF" }}>
            Credit
          </Typography>
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#16A34A" }}
          >
            {fmtPHP(data?.dTotalCredit)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.55rem", color: "#9CA3AF" }}>
            Net
          </Typography>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: Number(data?.dNet) < 0 ? "#DC2626" : "#1a237e",
            }}
          >
            {fmtPHP(data?.dNet)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.55rem", color: "#9CA3AF" }}>
            Entries
          </Typography>
          <Typography
            sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151" }}
          >
            {data?.count ?? 0}
          </Typography>
        </Box>
      </Box>
    )}
  </Box>
);
const AccountTreeNode = ({
  node,
  depth,
  expandedIds,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  isLast,
  onFlashImport,
  onFlashImportSupplier, // ← add this, was missing
}) => {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <Box
      sx={{
        borderBottom: depth === 0 && !isLast ? "0.5px solid #F3F4F6" : "none",
      }}
    >
      <Box
        onClick={() => onToggle(node.id)}
        sx={{
          px: 1.5,
          py: depth === 0 ? 1 : 0.75,
          pl: 1.5 + depth * 2.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          background: depth === 0 ? "transparent" : "#FAFAFA",
          borderBottom: depth > 0 ? "0.5px solid #F3F4F6" : "none",
          "&:hover": { background: depth === 0 ? "#F9FAFB" : "#F3F4F6" },
          transition: "background 0.15s",
        }}
      >
        <Box
          sx={{
            width: depth === 0 ? 30 : 26,
            height: depth === 0 ? 30 : 26,
            borderRadius: depth === 0 ? "7px" : "6px",
            background: depth === 0 ? "#EEEDFE" : "#EFF6FF",
            border: depth === 0 ? "0.5px solid #AFA9EC" : "0.5px solid #BFDBFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AccountBalanceOutlined
            sx={{
              fontSize: depth === 0 ? "0.85rem" : "0.75rem",
              color: depth === 0 ? "#534AB7" : "#3B82F6",
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: depth === 0 ? "0.75rem" : "0.7rem",
              fontWeight: depth === 0 ? 700 : 600,
              color: "#111827",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.accountName}
          </Typography>
          {hasChildren && (
            <Typography sx={{ fontSize: "0.58rem", color: "#9CA3AF", mt: 0.2 }}>
              {node.children.length} linked account
              {node.children.length === 1 ? "" : "s"}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          {node.accountName === "Collection" && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFlashImport(node);
              }}
              sx={{
                width: 26,
                height: 26,
                color: "#F59E0B",
                "&:hover": { background: "#FFFBEB" },
              }}
            >
              <FlashOnOutlined sx={{ fontSize: "0.8rem" }} />
            </IconButton>
          )}

          {node.accountName === "Purchases" && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFlashImportSupplier(node);
              }}
              sx={{
                width: 26,
                height: 26,
                color: "#F59E0B",
                "&:hover": { background: "#F0FDFA" },
              }}
            >
              <FlashOnOutlined sx={{ fontSize: "0.8rem" }} />
            </IconButton>
          )}

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(node);
            }}
            sx={{
              width: 26,
              height: 26,
              color: "#16A34A",
              "&:hover": { background: "#F0FDF4" },
            }}
          >
            <Add sx={{ fontSize: "0.8rem" }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            sx={{
              width: 26,
              height: 26,
              color: "#3B82F6",
              "&:hover": { background: "#EFF6FF" },
            }}
          >
            <Edit sx={{ fontSize: "0.8rem" }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id, node.accountName);
            }}
            sx={{
              width: 26,
              height: 26,
              color: "#EF4444",
              "&:hover": { background: "#FEF2F2" },
            }}
          >
            <Delete sx={{ fontSize: "0.8rem" }} />
          </IconButton>
        </Box>

        <IconButton
          size="small"
          sx={{
            width: 22,
            height: 22,
            color: "#9CA3AF",
            border: "0.5px solid #E5E7EB",
            borderRadius: "50px",
            p: 0,
            ml: 0.5,
            visibility: hasChildren ? "visible" : "hidden",
          }}
        >
          {isExpanded ? (
            <KeyboardArrowUp sx={{ fontSize: "0.85rem" }} />
          ) : (
            <KeyboardArrowDown sx={{ fontSize: "0.85rem" }} />
          )}
        </IconButton>
      </Box>

      <Collapse in={isExpanded && hasChildren}>
        <Box sx={{ background: "#FAFAFA" }}>
          {node.children.map((child, idx) => (
            <AccountTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onFlashImport={onFlashImport}
              onFlashImportSupplier={onFlashImportSupplier} // ← add this
              isLast={idx === node.children.length - 1}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
const LogLineRow = ({ log, isLast, jevTypeLabels }) => (
  <Box
    sx={{
      px: 1.5,
      py: 0.75,
      pl: 5.5,
      display: "flex",
      alignItems: "center",
      gap: 1,
      borderBottom: isLast ? "none" : "0.5px solid #F3F4F6",
      "&:hover": { background: "#F3F4F6" },
      transition: "background 0.12s",
    }}
  >
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "6px",
        background: log.bIsAssigneeType ? "#EEEDFE" : "#EFF6FF",
        border: `0.5px solid ${log.bIsAssigneeType ? "#AFA9EC" : "#BFDBFE"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {log.bIsAssigneeType ? (
        <BadgeOutlined sx={{ fontSize: "0.75rem", color: "#534AB7" }} />
      ) : (
        <StoreOutlined sx={{ fontSize: "0.75rem", color: "#3B82F6" }} />
      )}
    </Box>

    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {log.strPayeeName ?? "—"}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.15 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 0.4,
            py: 0.05,
            borderRadius: "3px",
            background: "#F3F4F6",
            border: "0.5px solid #E5E7EB",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.5rem",
              fontWeight: 700,
              color: "#6B7280",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
            }}
          >
            {jevTypeLabels?.[log.cJevType] ?? log.cJevType ?? "—"}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.56rem",
            color: "#9CA3AF",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {log.strJevLink ?? "—"}
        </Typography>
      </Box>
    </Box>

    <Box sx={{ width: 100, flexShrink: 0 }}>
      <Typography
        sx={{
          fontSize: "0.58rem",
          color: "#9CA3AF",
          lineHeight: 1.2,
          textAlign: "right",
        }}
      >
        {fmtDate(log.dtCreated)}
      </Typography>
    </Box>

    <Typography
      sx={{
        fontSize: "0.68rem",
        fontWeight: 700,
        color: log.cType === "from" ? "#DC2626" : "#16A34A",
        flexShrink: 0,
        whiteSpace: "nowrap",
        textAlign: "right",
        minWidth: 78,
      }}
    >
      {log.cType === "from" ? "-" : "+"}
      {fmtPHP(log.dAmount)}
    </Typography>
  </Box>
);
const ChildAccountGroup = ({
  accountName,
  logs,
  defaultOpen,
  jevTypeLabels,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const totals = React.useMemo(() => calcTotals(logs), [logs]);

  return (
    <Box
      sx={{
        mx: 1.5,
        my: 0.4,
        borderRadius: "7px",
        border: "0.5px solid #EEF0F3",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          px: 1,
          py: 0.55,
          display: "flex",
          alignItems: "center",
          gap: 0.65,
          cursor: "pointer",
          background: "#FCFCFD",
          "&:hover": { background: "#F3F4F6" },
          transition: "background 0.15s",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 700,
            color: "#4B5563",
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {accountName}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mr: 1, flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 600,
              color: "#DC2626",
              minWidth: 58,
              textAlign: "right",
            }}
          >
            {fmtPHP(totals.debit)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 600,
              color: "#16A34A",
              minWidth: 58,
              textAlign: "right",
            }}
          >
            {fmtPHP(totals.credit)}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 0.5,
            py: 0.1,
            borderRadius: "4px",
            background: "#F3F4F6",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{ fontSize: "0.52rem", fontWeight: 700, color: "#9CA3AF" }}
          >
            {logs.length}
          </Typography>
        </Box>
        {open ? (
          <KeyboardArrowUp sx={{ fontSize: "0.7rem", color: "#9CA3AF" }} />
        ) : (
          <KeyboardArrowDown sx={{ fontSize: "0.7rem", color: "#9CA3AF" }} />
        )}
      </Box>
      <Collapse in={open}>
        <Box>
          {logs.map((log, i) => (
            <LogLineRow
              key={log.id ?? i}
              log={log}
              isLast={i === logs.length - 1}
              jevTypeLabels={jevTypeLabels}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
const ParentAccountGroup = ({
  parentName,
  logs,
  defaultOpen,
  jevTypeLabels,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const totals = React.useMemo(() => calcTotals(logs), [logs]);

  const groupedByChild = React.useMemo(() => {
    return logs.reduce((acc, log) => {
      const key = log.strAccountName || "—";
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});
  }, [logs]);
  const childNames = Object.keys(groupedByChild);

  return (
    <Box
      sx={{
        mx: 1,
        my: 0.5,
        borderRadius: "8px",
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          px: 1.25,
          py: 0.7,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          cursor: "pointer",
          background: "#EEEDFE",
          "&:hover": { background: "#E5E3FB" },
          transition: "background 0.15s",
        }}
      >
        <AccountBalanceOutlined
          sx={{ fontSize: "0.75rem", color: "#534AB7" }}
        />
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#374151",
            flex: 1,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {parentName}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.2, mr: 1.5, flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: "0.58rem",
              fontWeight: 600,
              color: "#DC2626",
              minWidth: 65,
              textAlign: "right",
            }}
          >
            {fmtPHP(totals.debit)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.58rem",
              fontWeight: 600,
              color: "#16A34A",
              minWidth: 65,
              textAlign: "right",
            }}
          >
            {fmtPHP(totals.credit)}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 0.6,
            py: 0.15,
            borderRadius: "4px",
            background: "#D9D6F8",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{ fontSize: "0.55rem", fontWeight: 700, color: "#534AB7" }}
          >
            {logs.length}
          </Typography>
        </Box>
        {open ? (
          <KeyboardArrowUp sx={{ fontSize: "0.75rem", color: "#9CA3AF" }} />
        ) : (
          <KeyboardArrowDown sx={{ fontSize: "0.75rem", color: "#9CA3AF" }} />
        )}
      </Box>
      <Collapse in={open}>
        <Box
          sx={{
            background: "#FAFAFA",
            borderTop: "0.5px solid #F3F4F6",
            py: 0.5,
          }}
        >
          {childNames.map((childName, idx) => (
            <ChildAccountGroup
              key={childName}
              accountName={childName}
              logs={groupedByChild[childName]}
              defaultOpen={idx === 0}
              jevTypeLabels={jevTypeLabels}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const CompanyTopGroup = ({
  companyName,
  logs,
  isExpanded,
  onToggle,
  jevTypeLabels,
}) => {
  const totals = React.useMemo(() => calcTotals(logs), [logs]);

  const groupedByParent = React.useMemo(() => {
    return logs.reduce((acc, log) => {
      const key = log.strParentAccountName || log.strAccountName || "—";
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});
  }, [logs]);
  const parentNames = Object.keys(groupedByParent);

  return (
    <Box
      sx={{
        borderBottom: "0.5px solid #F3F4F6",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          "&:hover": { background: "#F9FAFB" },
          transition: "background 0.15s",
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: "#F0F4FA",
            border: "0.5px solid #DDE3EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BusinessOutlined sx={{ fontSize: "0.85rem", color: "#3B5A8A" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {companyName}
          </Typography>
          <Typography sx={{ fontSize: "0.58rem", color: "#9CA3AF", mt: 0.2 }}>
            {isExpanded
              ? `${logs.length} log${logs.length === 1 ? "" : "s"}`
              : "Click to view logs"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mr: 1, flexShrink: 0 }}>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: "#9CA3AF" }}>
              Net
            </Typography>
            <Typography
              sx={{
                fontSize: "0.65rem",
                fontWeight: 800,
                color: totals.net < 0 ? "#DC2626" : "#1a237e",
              }}
            >
              {fmtPHP(totals.net)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: "#9CA3AF" }}>
              Debit
            </Typography>
            <Typography
              sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#DC2626" }}
            >
              {fmtPHP(totals.debit)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", minWidth: 70 }}>
            <Typography sx={{ fontSize: "0.5rem", color: "#9CA3AF" }}>
              Credit
            </Typography>
            <Typography
              sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#16A34A" }}
            >
              {fmtPHP(totals.credit)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          sx={{
            width: 22,
            height: 22,
            color: "#9CA3AF",
            border: "0.5px solid #E5E7EB",
            borderRadius: "50px",
            p: 0,
          }}
        >
          {isExpanded ? (
            <KeyboardArrowUp sx={{ fontSize: "0.85rem" }} />
          ) : (
            <KeyboardArrowDown sx={{ fontSize: "0.85rem" }} />
          )}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            background: "#FAFAFA",
            borderTop: "0.5px solid #F3F4F6",
            py: 0.5,
          }}
        >
          {logs.length === 0 ? (
            <Box sx={{ py: 2.5, display: "flex", justifyContent: "center" }}>
              <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF" }}>
                No logs found.
              </Typography>
            </Box>
          ) : (
            parentNames.map((parentName, idx) => (
              <ParentAccountGroup
                key={parentName}
                parentName={parentName}
                logs={groupedByParent[parentName]}
                defaultOpen={idx === 0}
                jevTypeLabels={jevTypeLabels}
              />
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
function JournalAccount() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [journalAccounts, setJournalAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const { jev_types, loading: mappingLoading } = useMapping();
  // ── Logs view state ──────────────────────────────────────────
  // ── Logs view state ──────────────────────────────────────────
  const [showLogs, setShowLogs] = useState(false);
  const [allLogs, setAllLogs] = useState([]); // ← single fetch, hierarchy built client-side
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [flashImportOpen, setFlashImportOpen] = useState(false);
  const [flashImportTarget, setFlashImportTarget] = useState(null);
  const [flashImportSupplierOpen, setFlashImportSupplierOpen] = useState(false);
  const [flashImportSupplierTarget, setFlashImportSupplierTarget] =
    useState(null);

  const handleFlashImportSupplier = (node) => {
    setFlashImportSupplierTarget(node);
    setFlashImportSupplierOpen(true);
  };
  const handleFlashImport = (node) => {
    setFlashImportTarget(node);
    setFlashImportOpen(true);
  };
  const [expandedAccountIds, setExpandedAccountIds] = useState(new Set());
  const toggleExpanded = (id) => {
    setExpandedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const jevKeys = Object.keys(jev_types || {});
  const dvTypeKey = jevKeys[0] ?? "";
  const rpTypeKey = jevKeys[1] ?? "";
  const drTypeKey = jevKeys[2] ?? "";
  const siTypeKey = jevKeys[3] ?? "";
  const crTypeKey = jevKeys[4] ?? "";

  const fetchJournalAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get("journal-accounts");
      const journalAccountsArray = response.data || response || [];

      const formatted = journalAccountsArray.map((account) => ({
        ...account,
        id: account.nJournalAccountId,
        accountName: account.strAccountName,
      }));

      setJournalAccounts(formatted);
    } catch (error) {
      console.error("Error fetching journal accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalAccounts();
  }, []);

  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    const channel = echo.channel("journal-accounts");

    channel.listen(".journal-account.updated", (event) => {
      if (event.action === "deleted") {
        // Remove instantly from local state
        setJournalAccounts((prev) =>
          prev.filter((a) => a.id !== event.journalAccountId),
        );
        return;
      }

      // created or updated — refetch
      fetchJournalAccounts();
    });

    return () => {
      echo.leaveChannel("journal-accounts");
    };
  }, []);

  const filteredJournalAccounts = journalAccounts.filter((account) => {
    const searchLower = search.toLowerCase();
    return account.accountName?.toLowerCase().includes(searchLower);
  });

  const handleAdd = () => {
    setSelectedAccount(null);
    setModalMode("add");
    setIsModalOpen(true);
  };
  const handleAddChild = (parentAccount) => {
    setSelectedAccount({ nParentAccountId: parentAccount.id });
    setModalMode("add");
    setIsModalOpen(true);
  };
  const handleEdit = (row) => {
    setSelectedAccount(row);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = (id, accountName) => {
    setEntityToDelete({
      type: "journal-account",
      data: {
        id: id,
        name: accountName,
      },
    });
    setOpenDeleteModal(true);
  };

  const handleDeleteSuccess = async () => {
    if (!entityToDelete?.data) return;
    setJournalAccounts((prev) =>
      prev.filter((account) => account.id !== entityToDelete.data.id),
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleSaveSuccess = () => {
    fetchJournalAccounts();
    handleModalClose();
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get("jev-logs/summary");
      setSummary(res?.data ?? res ?? null);
    } catch (error) {
      console.error("Error fetching JEV logs summary:", error);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleOpenLogs = async () => {
    setShowLogs(true);
    setExpandedCompany(null);
    fetchSummary();

    setLogsLoading(true);
    try {
      const res = await api.get("jev-logs/all");
      setAllLogs(Array.isArray(res) ? res : (res?.data ?? res?.logs ?? []));
    } catch (err) {
      console.error("Error fetching JEV logs:", err);
      setAllLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
    setExpandedCompany(null);
  };
  const accountTree = React.useMemo(() => {
    const byId = {};
    filteredJournalAccounts.forEach((a) => {
      byId[a.id] = { ...a, children: [] };
    });

    const roots = [];
    filteredJournalAccounts.forEach((a) => {
      const parentNode = a.nParentAccountId ? byId[a.nParentAccountId] : null;
      if (parentNode) {
        parentNode.children.push(byId[a.id]);
      } else {
        // No parent, or parent filtered out by search — treat as a root for display
        roots.push(byId[a.id]);
      }
    });

    return roots;
  }, [filteredJournalAccounts]);
  // Companies present in the data, plus a synthetic "All Companies" that shows everything
  const companyGroups = React.useMemo(() => {
    const byCompany = allLogs.reduce((acc, log) => {
      const key = log.strCompanyName || "No Company";
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});
    return [
      { id: ALL_COMPANY_ID, name: "All Companies", logs: allLogs },
      ...Object.keys(byCompany).map((name) => ({
        id: name,
        name,
        logs: byCompany[name],
      })),
    ];
  }, [allLogs]);

  return (
    <PageLayout
      title="Journal Accounts"
      subtitle={showLogs ? "/ Logs" : ""}
      footer={
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {showLogs ? (
            <BaseButton
              label="Back to Accounts"
              icon={<ArrowBackOutlined />}
              onClick={handleCloseLogs}
              actionColor="back"
            />
          ) : (
            <BaseButton
              label="Logs"
              tooltip="View JEV Logs"
              icon={<HistoryOutlined />}
              onClick={handleOpenLogs}
              actionColor="view"
            />
          )}
        </Box>
      }
    >
      {showLogs ? (
        <>
          {/* ── Summary metrics ── */}
          {/* <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
            <MetricCard
              icon={CalendarMonthOutlined}
              label="This Year"
              data={summary?.thisYear}
              loading={summaryLoading}
            />
            <MetricCard
              icon={DateRangeOutlined}
              label="This Month"
              data={summary?.thisMonth}
              loading={summaryLoading}
            />
          </Box> */}

          {/* ── Groups: Company → Parent Account → Child Account ── */}
          <section className="bg-white shadow-sm rounded-lg overflow-hidden">
            {logsLoading ? (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
                  Loading logs…
                </Typography>
              </Box>
            ) : (
              companyGroups.map((group) => (
                <CompanyTopGroup
                  key={group.id}
                  companyName={group.name}
                  logs={group.logs}
                  isExpanded={expandedCompany === group.id}
                  onToggle={() =>
                    setExpandedCompany((prev) =>
                      prev === group.id ? null : group.id,
                    )
                  }
                  jevTypeLabels={jev_types}
                />
              ))
            )}
          </section>
        </>
      ) : (
        <>
          <section className="flex items-center gap-2 mb-3">
            <div className="flex-grow">
              <CustomSearchField
                label="Search Journal Account"
                value={search}
                onChange={setSearch}
              />
            </div>
            <SyncMenu onSync={() => fetchJournalAccounts()} />

            <BaseButton
              label="Journal Account"
              tooltip="Add Journal Account"
              icon={<Add />}
              onClick={handleAdd}
              actionColor="approve"
              variant="contained"
            />
          </section>
          <section className="bg-white shadow-sm rounded-lg overflow-hidden">
            {loading ? (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
                  Loading accounts…
                </Typography>
              </Box>
            ) : accountTree.length === 0 ? (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
                  No journal accounts found.
                </Typography>
              </Box>
            ) : (
              accountTree.map((node, idx) => (
                <AccountTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedIds={expandedAccountIds}
                  onToggle={toggleExpanded}
                  onAdd={handleAddChild}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onFlashImport={handleFlashImport}
                  onFlashImportSupplier={handleFlashImportSupplier} // ← add this
                  isLast={idx === accountTree.length - 1}
                />
              ))
            )}
          </section>
        </>
      )}
      <JournalAccountAEModal
        open={isModalOpen}
        onClose={handleModalClose}
        initialData={selectedAccount}
        onSaved={handleSaveSuccess}
      />
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setEntityToDelete(null);
        }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
      <FlashImportClientsModal
        open={flashImportOpen}
        onClose={() => {
          setFlashImportOpen(false);
          setFlashImportTarget(null);
        }}
        parentAccount={flashImportTarget}
        onSaved={fetchJournalAccounts}
      />
      <FlashImportSuppliersModal
        open={flashImportSupplierOpen}
        onClose={() => {
          setFlashImportSupplierOpen(false);
          setFlashImportSupplierTarget(null);
        }}
        parentAccount={flashImportSupplierTarget}
        onSaved={fetchJournalAccounts}
      />
    </PageLayout>
  );
}

export default JournalAccount;
