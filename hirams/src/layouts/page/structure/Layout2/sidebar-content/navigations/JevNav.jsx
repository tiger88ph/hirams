import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BusinessIcon from "@mui/icons-material/Business";
import SidebarItem from "../../sidebar/SidebarItem";
import SidebarSubmenu from "../../sidebar/SidebarSubmenu";
import useKeysLabels from "../../../../../../hooks/useKeysLabels";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const JevNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ SINGLE SOURCE OF TRUTH — from unified hook
  const { jevTypes = {}, loading: isLoading } = useKeysLabels();
  const entries = Object.entries(jevTypes);
  const firstCode = entries[0]?.[0] ?? "";

  const SESSION_KEY = "selectedJevTypeCode";
  const [selectedCode, setSelectedCode] = useState(() => getItem(SESSION_KEY, null) || firstCode);
  const isOnPage = location.pathname === "/for-jev";

  // Sync state with localStorage on navigation
  useEffect(() => {
    const saved = getItem(SESSION_KEY, null);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

  // Listen for cross-component changes
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
    };
    window.addEventListener("jev_type_changed", handler);
    return () => window.removeEventListener("jev_type_changed", handler);
  }, []);

  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/for-jev");
      onItemClick?.();
      window.dispatchEvent(new CustomEvent("jev_type_changed", { detail: { code } }));
    },
    [navigate, onItemClick]
  );

  const handleParentClick = useCallback(() => {
    if (firstCode) handleSelect(firstCode);
  }, [firstCode, handleSelect]);

  if (isLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<BusinessIcon fontSize="small" />}
        label="For JEV"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        {entries.map(([code, label]) => (
          <SidebarSubmenu
            key={code}
            label={label}
            active={isOnPage && selectedCode === String(code)}
            count={0}
            countLoading={false}
            onClick={() => handleSelect(String(code))}
          />
        ))}
      </SidebarItem>
    </div>
  );
};

export default JevNavSection;