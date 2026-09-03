import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BusinessIcon from "@mui/icons-material/Business";
import SidebarItem from "../../sidebar/SidebarItem";
import SidebarSubmenu from "../../sidebar/SidebarSubmenu";
import useMapping from "../../../../../../utils/mappings/useMapping";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

// NOTE: Assumes useMapping() exposes a `jevType` mapping (e.g. { code: label }),
// analogous to `voucherType`. Rename below if your hook uses a different key
// (e.g. `jev_types`, `jevTypes`).
const JevNavSection = ({ collapsed, forceExpanded, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jev_types, loading: mappingLoading } = useMapping();
  const safeJevType = jev_types || {};

  const SESSION_KEY = "selectedJevTypeCode";
  const firstCode = Object.keys(jev_types)[0] ?? "";
  const [selectedCode, setSelectedCode] = useState(() => getItem(SESSION_KEY, null) || firstCode);
  const isOnPage = location.pathname === "/for-jev";

  useEffect(() => {
    const saved = getItem(SESSION_KEY, null);
    if (saved) setSelectedCode(saved);
  }, [location.key]);

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
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    const first = Object.keys(safeJevType)[0];
    if (first) handleSelect(first);
  }, [safeJevType, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full mb-1.5">
      <SidebarItem
        icon={<BusinessIcon fontSize="small" />}
        label="For JEV"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={handleParentClick}
      >
        {Object.entries(safeJevType).map(([code, label]) => (
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