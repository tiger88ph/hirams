import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SidebarItem from "../../sidebar/SidebarItem";
import SidebarSubmenu from "../../sidebar/SidebarSubmenu";
import useKeysLabels from "../../../../../../hooks/useKeysLabels.js";
import PurchaseCartAPI from "../../../../../../api/endpoints/purchase-cart.api.js";
import { getItem, setItem } from "../../../../../../utils/storage/localStorage";

const SESSION_KEY = "selectedItemPurchasingStatusCode";
// '110' => 'Cart', //Open Cart
//     '120' => 'For Approval', //Closed on Cart
//     '130' => 'For Payment', //Closed on PO
//     '140' => 'Pending Receipt', //Closed on Paid
//     '150' => 'For Delivery', //Closed on Received
//     '160' => 'Delivered', //Closed on Delivered
//     '170' => 'Cancelled' //Cancelled
// Returns true if this purchase-order option is assigned to the given AO.
function isAssignedToAO(option, aoUserId) {
  if (aoUserId === undefined || aoUserId === null || aoUserId === "")
    return false;
  const target = String(aoUserId);

  const txItem = option?.purchase_option?.transaction_item;
  const directAO = txItem?.nAssignedAO ?? txItem?.aoUserId ?? txItem?.nUserId;
  if (
    directAO !== undefined &&
    directAO !== null &&
    String(directAO) === target
  )
    return true;

  const tx = txItem?.transaction;
  const txAO = tx?.nAssignedAO ?? tx?.aoUserId ?? tx?.nAssignedAOId;
  if (txAO !== undefined && txAO !== null && String(txAO) === target)
    return true;

  return false;
}

const ItemPurchasingNavSection = ({
  collapsed,
  forceExpanded,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    itemPurchasingStatus,
    itemPurchasingStatusFinance,
    loading: mappingLoading,
    isManagement,
    isFinanceOfficer,
  } = useKeysLabels();

  const safeItemPurchasingStatus =
    (isManagement
      ? itemPurchasingStatus
      : isFinanceOfficer
        ? itemPurchasingStatusFinance
        : itemPurchasingStatus) || {};

  const entries = Object.entries(safeItemPurchasingStatus);
  const firstCode = entries[0]?.[0] ?? "";

  const [selectedCode, setSelectedCode] = useState(() => {
    const saved = getItem(SESSION_KEY);
    return saved || firstCode;
  });
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [countLoading, setCountLoading] = useState(true);
  const isOnPage =
    location.pathname === "/item-purchasing" ||
    location.pathname === "/item-purchasing-update" ||
    location.pathname === "/preview-po";

  const [viewingCode, setViewingCode] = useState(null);
  const activeCode =
    location.pathname === "/item-purchasing-update" && viewingCode
      ? viewingCode
      : selectedCode;
  const currentUserId = useMemo(() => getItem("user")?.nUserId, []);
  // ── Sync status from localStorage ──
  useEffect(() => {
    const saved = getItem(SESSION_KEY);
    if (saved && saved !== selectedCode) setSelectedCode(saved);
    if (!saved && firstCode) {
      setItem(SESSION_KEY, firstCode);
      setSelectedCode(firstCode);
    }
  }, [location.key, firstCode, selectedCode]);

  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (code) setViewingCode(String(code));
    };
    window.addEventListener("viewing_po_status", handler);
    return () => window.removeEventListener("viewing_po_status", handler);
  }, []);

  // clear it once we leave the update page, so it doesn't leak into the list view
  useEffect(() => {
    if (location.pathname !== "/item-purchasing-update") setViewingCode(null);
  }, [location.pathname]);
  // ── Fetch purchase orders ──
  const fetchPurchaseOrders = useCallback(
    async (silent = false) => {
      if (mappingLoading) return;
      if (!silent) setCountLoading(true);
      try {
        const res = await PurchaseCartAPI.getAllPurchaseOrders();
        setPurchaseOrders(res.purchaseOrders || []);
      } catch (err) {
        console.error("Sidebar cart (PO) fetch error:", err);
      } finally {
        if (!silent) setCountLoading(false);
      }
    },
    [mappingLoading],
  );

  const fetchRef = useRef(fetchPurchaseOrders);
  useEffect(() => {
    fetchRef.current = fetchPurchaseOrders;
  }, [fetchPurchaseOrders]);

  useEffect(() => {
    if (!mappingLoading) fetchPurchaseOrders(false);
  }, [mappingLoading, fetchPurchaseOrders]);

  // ── Realtime updates ──
  useEffect(() => {
    const handlePOUpdated = () => fetchRef.current(true);
    const handlePODeleted = (e) => {
      const id = e.detail?.purchaseOrderId;
      if (id) {
        setPurchaseOrders((prev) =>
          prev.filter((po) => po.nPurchaseOrderId !== id),
        );
      } else {
        fetchRef.current(true);
      }
    };
    const handleOptionUpdated = () => fetchRef.current(true);

    window.addEventListener("purchase_order_data_updated", handlePOUpdated);
    window.addEventListener("purchase_order_data_deleted", handlePODeleted);
    window.addEventListener(
      "purchase_order_option_data_updated",
      handleOptionUpdated,
    );
    window.addEventListener(
      "purchase_order_option_data_deleted",
      handleOptionUpdated,
    );
    window.addEventListener("cart_data_updated", handlePOUpdated);

    return () => {
      window.removeEventListener(
        "purchase_order_data_updated",
        handlePOUpdated,
      );
      window.removeEventListener(
        "purchase_order_data_deleted",
        handlePODeleted,
      );
      window.removeEventListener(
        "purchase_order_option_data_updated",
        handleOptionUpdated,
      );
      window.removeEventListener(
        "purchase_order_option_data_deleted",
        handleOptionUpdated,
      );
      window.removeEventListener("cart_data_updated", handlePOUpdated);
    };
  }, []);

  // ── Handle status click ──
  const handleSelect = useCallback(
    (code) => {
      setItem(SESSION_KEY, code);
      setSelectedCode(code);
      navigate("/item-purchasing");
      onItemClick?.();
      window.dispatchEvent(
        new CustomEvent("cart_status_changed", { detail: { code } }),
      );
    },
    [navigate, onItemClick],
  );

  const handleParentClick = useCallback(() => {
    if (firstCode) handleSelect(firstCode);
  }, [firstCode, handleSelect]);

  if (mappingLoading) return null;

  return (
    <div className="flex flex-col w-full ">
      <SidebarItem
        icon={<ShoppingCartIcon fontSize="small" />}
        label="Item Purchasing"
        collapsed={collapsed}
        forceExpanded={forceExpanded}
        onParentClick={entries.length ? handleParentClick : undefined}
      >
        {entries.length > 0 ? (
          entries.map(([code, label]) => {
            const count = purchaseOrders.reduce((acc, po) => {
              if (!po.purchase_order_options?.length) return acc;
              if (String(po.nStatus) !== String(code)) return acc;

              const hasAssignedOption =
                isManagement || isFinanceOfficer
                  ? true
                  : po.purchase_order_options.some((o) =>
                      isAssignedToAO(o, currentUserId),
                    );

              return hasAssignedOption ? acc + 1 : acc;
            }, 0);
            return (
              <SidebarSubmenu
                key={code}
                label={label}
                active={isOnPage && activeCode === String(code)}
                count={count}
                countLoading={countLoading}
                onClick={() => handleSelect(String(code))}
              />
            );
          })
        ) : (
          <div className="px-3 py-1 text-xs text-gray-500 italic">
            No cart statuses found
          </div>
        )}
      </SidebarItem>
    </div>
  );
};

export default ItemPurchasingNavSection;
