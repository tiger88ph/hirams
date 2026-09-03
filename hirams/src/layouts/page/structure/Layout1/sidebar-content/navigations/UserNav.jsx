import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PeopleIcon from "@mui/icons-material/People";
import SidebarItem from "../../sidebar/SidebarItem";
import StatusSubItems from "../StatusSubItems";
import useMapping from "../../../../../../utils/mappings/useMapping";
import UserAPI from "../../../../../../api/endpoints/user.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const UserNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { statuses, loading: mappingLoading } = useMapping();

  const SESSION_KEY = "selectedUserStatusCode";
  const firstCode = Object.keys(statuses)[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(
    () => getItem(SESSION_KEY, null) || firstCode,
  );
  const [users, setUsers] = useState([]);
  const [countLoading, setCountLoading] = useState(true);

  const isOnPage = location.pathname === "/user";

  useEffect(() => {
    const saved = getItem(SESSION_KEY, null);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (code) {
        setItem(SESSION_KEY, code);
        setSelectedCode(code);
      }
    };
    window.addEventListener("user_status_changed", handler);
    return () => window.removeEventListener("user_status_changed", handler);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (mappingLoading) return;
    try {
      const res = await UserAPI.getAllUsers();
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

  // Realtime subscription now lives centrally in realtime/channels/usersChannel.js
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.action === "deleted" || e.type === "user_data_deleted") {
        setUsers((prev) => prev.filter((u) => u.nUserId !== e.detail?.userId));
      } else {
        fetchRef.current();
      }
    };
    window.addEventListener("user_data_updated", handler);
    window.addEventListener("user_data_deleted", handler);
    return () => {
      window.removeEventListener("user_data_updated", handler);
      window.removeEventListener("user_data_deleted", handler);
    };
  }, []);

  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
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

export default UserNavSection;