import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import SidebarItem from "../../sidebar/SidebarItem";
import StatusSubItems from "../StatusSubItems";
import useMapping from "../../../../../../utils/mappings/useMapping";
import AssigneeAPI from "../../../../../../api/endpoints/assignee.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const SESSION_KEY = "selectedAssigneeStatusCode";

const AssigneeNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { statuses, loading: mappingLoading } = useMapping();
  const safeStatuses = statuses || {};
  const firstCode = Object.keys(safeStatuses)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(() => {
    const saved = getItem(SESSION_KEY);
    return saved || firstCode;
  });
  const [assignees, setAssignees] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage = location.pathname === "/assignee";
  const isInitialLoadRef = useRef(true); // ✅ Track first load

  // ── Sync status from localStorage ──
  useEffect(() => {
    const saved = getItem(SESSION_KEY);
    if (saved && saved !== selectedCode) setSelectedCode(saved);
    if (!saved && firstCode) {
      setItem(SESSION_KEY, firstCode);
      setSelectedCode(firstCode);
    }
  }, [location.key, firstCode, selectedCode]);

  // ── Sync status changes ──
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code || code === selectedCode) return;
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("assignee_status_changed", handler);
    return () => window.removeEventListener("assignee_status_changed", handler);
  }, [selectedCode]);

  // ── Fetch counts ──
  const fetchAssignees = useCallback(async (silent = false) => {
    if (mappingLoading) return;
    // ✅ Only show loading on initial load, NOT on realtime sync
    if (!silent) setCountLoading(true);
    try {
      const res = await AssigneeAPI.getAssignees();
      setAssignees(res.assignees || []);
    } catch (err) {
      console.error("Sidebar assignee fetch error:", err);
    } finally {
      // ✅ Never hide loading indicator in silent mode
      if (!silent) setCountLoading(false);
    }
  }, [mappingLoading]);

  const fetchRef = useRef(fetchAssignees);
  useEffect(() => { fetchRef.current = fetchAssignees; }, [fetchAssignees]);

  // ── Initial load ONLY ──
  useEffect(() => {
    if (!mappingLoading && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      fetchAssignees(false);
    }
  }, [mappingLoading, fetchAssignees]);

  // ── Realtime updates — SILENT refresh ✅ ──
  useEffect(() => {
    const onUpdated = () => fetchRef.current(true); // silent = true
    const onDeleted = (e) => {
      const id = e.detail?.assigneeId;
      if (id) setAssignees((prev) => prev.filter((a) => a.nAssigneeId !== id));
    };
    window.addEventListener("assignee_data_updated", onUpdated);
    window.addEventListener("assignee_data_deleted", onDeleted);
    return () => {
      window.removeEventListener("assignee_data_updated", onUpdated);
      window.removeEventListener("assignee_data_deleted", onDeleted);
    };
  }, []);

  // ── Handle status click ──
  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
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
    const first = Object.keys(safeStatuses)[0];
    if (first) handleSelect(first);
  }, [safeStatuses, handleSelect]);

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
          statusMap={safeStatuses}
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

export default AssigneeNavSection;