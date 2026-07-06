import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
  Children,
  cloneElement,
} from "react";
import { Box, Typography, Collapse } from "@mui/material";
import {
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  UnfoldLess,
  UnfoldMore,
  CheckBoxOutlined,
  CheckBoxOutlineBlank,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import echo from "../../../utils/echo";
import CustomSearchField from "../../../components/common/SearchField";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";
import useMapping from "../../../utils/mappings/useMapping";
import api from "../../../utils/api/api";
import PurchaseOrderCartModal from "./modal/transaction-cart/PurchaseOrderCartModal.jsx";
import SyncMenu from "./../../../components/common/SyncMenu";
import { PurchaseCartSkeleton } from "../../../components/helper/Skeleton";
import {
  getUserRoles,
  buildRoleGroups,
} from "../../../utils/helpers/roleHelper.js";
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";
import POCard from "./components/transaction-cart/POCard.jsx";
import { TXN_CACHE_TTL } from "../../../utils/constants/cache";

// ── Cache helpers ─────────────────────────────────────────────────────────────
function getCachedData(key) {
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

function setCachedData(key, data) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    /* storage full */
  }
}

function invalidateCache(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Time period helpers ───────────────────────────────────────────────────────
function getTimePeriod(dateStr) {
  if (!dateStr) return "older";
  const date = new Date(dateStr);
  if (isNaN(date)) return "older";
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  if (date >= startOfDay) return "today";
  if (date >= startOfWeek) return "this_week";
  if (date >= startOfMonth) return "this_month";
  if (date >= startOfYear) return "this_year";
  return "older";
}

const TIME_PERIOD_ORDER = [
  "today",
  "this_week",
  "this_month",
  "this_year",
  "older",
];
const TIME_PERIOD_LABELS = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  this_year: "This Year",
  older: "Older",
};

function buildStatusSections(
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
) {
  return [
    {
      key: String(addToCartKey),
      label: "Added to Cart",
      color: "#B45309",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
    {
      key: String(purchaseOrderKey),
      label: "Purchase Order",
      color: "#7C3AED",
      bg: "#F5F3FF",
      border: "#DDD6FE",
    },
    {
      key: String(paidKey),
      label: "Paid",
      color: "#0F766E",
      bg: "#F0FDFA",
      border: "#99F6E4",
    },
    {
      key: String(receivedKey),
      label: "Received",
      color: "#0369A1",
      bg: "#F0F9FF",
      border: "#BAE6FD",
    },
    {
      key: String(deliveredKey),
      label: "Delivered",
      color: "#15803D",
      bg: "#F0FDF4",
      border: "#86EFAC",
    },
  ];
}

// ── Single-section configs for open and cancelled ─────────────────────────────
function buildOpenSection(addToCartKey) {
  return {
    key: String(addToCartKey),
    label: "Added to Cart",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
  };
}

function buildCancelledSection(cancelPoKey) {
  return {
    key: String(cancelPoKey),
    label: "Voided",
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
  };
}

function SectionGroup({
  title,
  count,
  color,
  bg,
  border,
  children,
  forceOpen,
  isFirst,
  isLast,
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (forceOpen !== undefined) setOpen(forceOpen);
  }, [forceOpen]);

  return (
    <Box
      sx={{
        borderBottom: isLast ? "none" : "1px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1.5,
          background: bg,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { filter: "brightness(0.97)" },
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color,
            flex: 1,
            lineHeight: 1,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            px: 0.75,
            py: 0.2,
            borderRadius: "5px",
            background: "rgba(255,255,255,0.7)",
            border: `0.5px solid ${border}`,
          }}
        >
          <Typography
            sx={{ fontSize: "0.6rem", fontWeight: 700, color, lineHeight: 1 }}
          >
            {count}
          </Typography>
        </Box>
        {open ? (
          <ExpandLess sx={{ fontSize: "0.9rem", color }} />
        ) : (
          <ExpandMore sx={{ fontSize: "0.9rem", color }} />
        )}
      </Box>

      <Collapse in={open}>
        <Box sx={{ p: 1, background: "#fff" }}>
          {Children.toArray(children)
            .filter(Boolean)
            .map((child) => cloneElement(child, { forceOpen: open }))}
        </Box>
      </Collapse>
    </Box>
  );
}

function TimePeriodGroup({
  period,
  count,
  children,
  defaultOpen = true,
  forceOpen,
  cardsCollapsed,
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen ? defaultOpen : false);
    }
  }, [forceOpen]);

  return (
    <Box
      sx={{
        mb: 0.75,
        borderRadius: "7px",
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.75,
          py: 1.25,
          background: "#F9FAFB",
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { background: "#F3F4F6" },
        }}
      >
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "#6B7280",
            flex: 1,
            lineHeight: 1,
          }}
        >
          {TIME_PERIOD_LABELS[period]}
        </Typography>
        <Box
          sx={{ px: 0.6, py: 0.15, borderRadius: "4px", background: "#E5E7EB" }}
        >
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 700,
              color: "#6B7280",
              lineHeight: 1,
            }}
          >
            {count}
          </Typography>
        </Box>
        {open ? (
          <ExpandLess sx={{ fontSize: "0.75rem", color: "#9CA3AF" }} />
        ) : (
          <ExpandMore sx={{ fontSize: "0.75rem", color: "#9CA3AF" }} />
        )}
      </Box>

      <Collapse in={open}>
        <Box sx={{ p: 0.75 }}>
          {Children.map(children, (child) =>
            child ? cloneElement(child, { collapsed: cardsCollapsed }) : child,
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Reusable time-period card grid ────────────────────────────────────────────
function renderTimePeriodCards(pos, sharedCardProps) {
  return (
    <>
      {/* Mobile */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {pos.map((po) => (
          <POCard key={po.nPurchaseOrderId} {...sharedCardProps(po)} />
        ))}
      </Box>
      {/* Desktop two-column */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          gap: 0.5,
          alignItems: "flex-start",
        }}
      >
        {[0, 1].map((col) => (
          <Box
            key={col}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            {pos
              .filter((_, i) => i % 2 === col)
              .map((po) => (
                <POCard key={po.nPurchaseOrderId} {...sharedCardProps(po)} />
              ))}
          </Box>
        ))}
      </Box>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function TransactionPurchaseCart() {
  const [itemsLoading, setItemsLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState(null);

  const [selectError, setSelectError] = useState("");
  const selectErrorTimeoutRef = useRef(null);
  const [allOptionHistories, setAllOptionHistories] = useState({});
  const [selectedPOIds, setSelectedPOIds] = useState(new Set());
  const [groupError, setGroupError] = useState("");
  const groupErrorTimeoutRef = useRef(null);

  const showGroupError = (message) => {
    if (groupErrorTimeoutRef.current)
      clearTimeout(groupErrorTimeoutRef.current);
    setGroupError(message);
    groupErrorTimeoutRef.current = setTimeout(() => setGroupError(""), 3500);
  };

  // shake + top-banner message together
  const flagSelectionError = (id, message) => {
    if (selectErrorTimeoutRef.current)
      clearTimeout(selectErrorTimeoutRef.current);
    setSelectError(id);
    selectErrorTimeoutRef.current = setTimeout(() => setSelectError(""), 3000);
    showGroupError(message);
  };
  const [vouchersByPO, setVouchersByPO] = useState({});

  const [aoGmDirectory, setAoGmDirectory] = useState({
    checkByOtherAOName: "—",
    generalManagerName: "—",
  });

  const aoGmFetchedRef = useRef(false);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const currentUserId = user?.nUserId;

  const cacheKeyPO = `cart_po_cache_${currentUserId}`;
  const cacheKeyVouchers = `cart_voucher_cache_${currentUserId}`;
  const cacheKeyHistories = `cart_histories_cache_${currentUserId}`;

  const {
    forPurchaseStatus,
    cartStatus,
    shippingMethod,
    paymentTerms,
    voucherStatus,
    voucherType,
    userTypes,
    loading: mappingLoading,
  } = useMapping();
  const { isGeneralManager, isAccountOfficer, isAOTL, isManagement } =
    getUserRoles(userTypes);

  const [selectedStatusCode, setSelectedStatusCode] = useState(
    () => sessionStorage.getItem("selectedCartStatusCode") || "",
  );

  const fpKeys = Object.keys(forPurchaseStatus || {});
  const csKeys = Object.keys(cartStatus || {});
  const vsKeys = Object.keys(voucherStatus || {});
  const vtKeys = Object.keys(voucherType || {});

  const [
    cancelPoKey,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
  ] = fpKeys;
  const removedFromCartKey = fpKeys[6] ?? "";
  const [openCartKey, closeCartKey, cancelCartKey] = csKeys;
  const [voucherActiveKey, voucherClosedKey] = vsKeys;
  const [voucherSupplierTypeKey] = vtKeys;

  // ── Fetch option histories ────────────────────────────────────────────────
  const fetchAllOptionHistories = useCallback(
    async (orders, { silent = false } = {}) => {
      const ids = (orders || [])
        .flatMap((po) => po.purchase_order_options || [])
        .map((o) => o.purchase_option?.nPurchaseOptionId)
        .filter(Boolean);
      if (!ids.length) return;
      if (silent) {
        const cached = getCachedData(cacheKeyHistories);
        if (cached) setAllOptionHistories(cached);
      }
      try {
        const res = await api.post("purchase-item-histories/latest", {
          nPurchaseOptionId: ids,
        });
        const map = {};
        (res?.histories || []).forEach((h) => {
          map[Number(h.nPurchaseOptionId)] = h;
        });
        setAllOptionHistories(map);
        setCachedData(cacheKeyHistories, map);
      } catch (err) {
        console.error("fetchAllOptionHistories error:", err);
      }
    },
    [cacheKeyHistories],
  );

  // ── Main fetch ────────────────────────────────────────────────────────────
  const fetchAllPurchaseOrders = useCallback(
    async ({ silent = false, bustCache = false } = {}) => {
      if (bustCache) {
        invalidateCache(cacheKeyPO);
        invalidateCache(cacheKeyVouchers);
        invalidateCache(cacheKeyHistories);
      }
      if (!silent && !bustCache) {
        const cachedPO = getCachedData(cacheKeyPO);
        const cachedVouchers = getCachedData(cacheKeyVouchers);
        const cachedHist = getCachedData(cacheKeyHistories);
        if (cachedPO && cachedVouchers) {
          setPurchaseOrders(cachedPO);
          setVouchersByPO(cachedVouchers);
          if (cachedHist) setAllOptionHistories(cachedHist);
          setItemsLoading(false);
          fetchAllPurchaseOrders({ silent: true });
          return;
        }
      }
      if (!silent) setItemsLoading(true);
      try {
        const [poResult, voucherResult] = await Promise.allSettled([
          api.get("purchase-orders/get-all-purchase-orders"),
          api.get("vouchers"),
        ]);
        if (poResult.status === "fulfilled") {
          const orders = poResult.value.purchaseOrders || [];
          setPurchaseOrders(orders);
          setCachedData(cacheKeyPO, orders);
          fetchAllOptionHistories(orders);
        }
        if (voucherResult.status === "fulfilled") {
          const vouchers = Array.isArray(voucherResult.value)
            ? voucherResult.value
            : (voucherResult.value.data ?? []);
          const map = {};
          vouchers.forEach((v) => {
            (v.voucher_suppliers ?? []).forEach((vs) => {
              if (!map[vs.nPurchaseOrderId])
                map[vs.nPurchaseOrderId] = v.cStatus;
            });
          });
          setVouchersByPO(map);
          setCachedData(cacheKeyVouchers, map);
        }
      } finally {
        if (!silent) setItemsLoading(false);
      }
    },
    [cacheKeyPO, cacheKeyVouchers, cacheKeyHistories, fetchAllOptionHistories],
  );

  const fetchRef = useRef(fetchAllPurchaseOrders);
  useEffect(() => {
    fetchRef.current = fetchAllPurchaseOrders;
  }, [fetchAllPurchaseOrders]);

  useEffect(() => {
    if (!mappingLoading) fetchAllPurchaseOrders();
  }, [mappingLoading, fetchAllPurchaseOrders]);

  // ── AO / GM directory ────────────────────────────────────────────────────
  useEffect(() => {
    if (
      mappingLoading ||
      !userTypes ||
      Object.keys(userTypes).length === 0 ||
      aoGmFetchedRef.current
    )
      return;
    aoGmFetchedRef.current = true;
    api
      .get("users")
      .then((res) => {
        const users = res.users ?? [];
        const { accountOfficerKey, generalManagerKey } =
          buildRoleGroups(userTypes);
        const buildName = (u) =>
          [
            u?.strFName,
            u?.strMName ? u.strMName[0].toUpperCase() + "." : "",
            u?.strLName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
        const ao = users.find((u) =>
          accountOfficerKey.includes(String(u.cUserType)),
        );
        const gm = users.find((u) =>
          generalManagerKey.includes(String(u.cUserType)),
        );
        setAoGmDirectory({
          checkByOtherAOName: ao ? buildName(ao) || "—" : "—",
          generalManagerName: gm ? buildName(gm) || "—" : "—",
          _users: users,
          _accountOfficerKey: accountOfficerKey,
          _generalManagerKey: generalManagerKey,
        });
      })
      .catch((err) =>
        console.error("Failed to fetch users for PO names:", err),
      );
  }, [mappingLoading, userTypes]);

  // ── Status code sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      setSelectedStatusCode(code);
      sessionStorage.setItem("selectedCartStatusCode", code);
    };
    window.addEventListener("cart_status_changed", handler);
    return () => window.removeEventListener("cart_status_changed", handler);
  }, []);

  // ── Echo real-time ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mappingLoading) return;
    const poChannel = echo.channel("purchase-orders");
    poChannel.listen(".purchase-order.updated", (event) => {
      if (event.action === "status_updated" && event.newStatus) {
        setPurchaseOrders((prev) =>
          prev.map((po) =>
            po.nPurchaseOrderId === event.purchaseOrderId
              ? { ...po, cStatus: event.newStatus }
              : po,
          ),
        );
        invalidateCache(cacheKeyPO);
        fetchRef.current({ silent: true, bustCache: false });
        return;
      }
      if (event.action === "deleted") {
        setPurchaseOrders((prev) =>
          prev.filter((po) => po.nPurchaseOrderId !== event.purchaseOrderId),
        );
        invalidateCache(cacheKeyPO);
        return;
      }
      invalidateCache(cacheKeyPO);
      fetchRef.current({ silent: true });
    });
    echo
      .channel("purchase-order-options")
      .listen(".purchase-order-option.updated", () => {
        invalidateCache(cacheKeyHistories);
        fetchRef.current({ silent: true });
      });
    return () => {
      echo.leaveChannel("purchase-orders");
      echo.leaveChannel("purchase-order-options");
    };
  }, [mappingLoading, cacheKeyPO, cacheKeyHistories]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPoSupplierId = (po) =>
    po?.purchase_order_options?.[0]?.purchase_option?.supplier?.nSupplierId ??
    null;

  const getPoPaymentTerms = (po) => po?.cPaymentTerms ?? null;
  const getPoDominantStatus = useCallback(
    (po) => {
      const opts = po.purchase_order_options || [];
      if (!opts.length) return null;

      const stepOrder = [
        addToCartKey,
        purchaseOrderKey,
        paidKey,
        receivedKey,
        deliveredKey,
      ];

      let lowestIdx = Infinity;
      let lowestStatus = null;

      opts.forEach((o) => {
        const id = Number(o.purchase_option?.nPurchaseOptionId);
        const histStatus = String(allOptionHistories[id]?.nStatus ?? "");

        const p = o.purchase_option;
        const ordered = p?.nQuantity || 0;
        const received = Math.min(p?.nInventoryQty || 0, ordered);
        const delivered = Math.min(p?.nDeliveredQty || 0, ordered);
        const allReceived = ordered > 0 && received >= ordered;
        const allDelivered = ordered > 0 && delivered >= ordered;

        // Promote status based on qty fulfillment
        let effectiveStatus = histStatus;
        if (allDelivered) {
          effectiveStatus = deliveredKey;
        } else if (allReceived) {
          effectiveStatus = receivedKey;
        } else if (received > 0 || delivered > 0) {
          // Partial — keep at receivedKey level so it moves out of paid
          effectiveStatus = receivedKey;
        }

        const idx = stepOrder.indexOf(effectiveStatus);
        const effective = idx === -1 ? -1 : idx;
        if (effective < lowestIdx) {
          lowestIdx = effective;
          lowestStatus = effectiveStatus;
        }
      });

      return lowestStatus;
    },
    [
      allOptionHistories,
      addToCartKey,
      purchaseOrderKey,
      paidKey,
      receivedKey,
      deliveredKey,
    ],
  );
  const getPoDate = useCallback(
    (po) => {
      const opts = po.purchase_order_options || [];
      let latest = null;
      opts.forEach((o) => {
        const hist =
          allOptionHistories[Number(o.purchase_option?.nPurchaseOptionId)];
        const raw =
          hist?.dtOccur ??
          hist?.dtCreated ??
          hist?.created_at ??
          hist?.dtLog ??
          hist?.updated_at;
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d) && (!latest || d > latest)) latest = d;
        }
      });
      return latest
        ? latest.toISOString()
        : po.updated_at || po.created_at || null;
    },
    [allOptionHistories],
  );

  // ── Filtered & sorted POs ─────────────────────────────────────────────────
  const filteredPurchaseOrders = useMemo(() => {
    let result = selectedStatusCode
      ? purchaseOrders.filter(
          (po) => String(po.cStatus) === String(selectedStatusCode),
        )
      : purchaseOrders;

    if (!isAOTL && !isManagement) {
      result = result.filter((po) => {
        const opts = po.purchase_order_options || [];
        return opts.some(
          (o) =>
            String(
              o.purchase_option?.transaction_item?.transaction?.nUserId,
            ) === String(currentUserId),
        );
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((po) => {
        if (String(po.nPurchaseOrderId).includes(q)) return true;
        if ((po.strPurchaseOrderNo ?? "").toLowerCase().includes(q))
          return true;
        return (po.purchase_order_options || []).some((o) => {
          const opt = o.purchase_option ?? {};
          const sup = opt.supplier ?? {};
          const txItem = opt.transaction_item ?? {};
          return [
            sup.strSupplierName,
            sup.strSupplierNickName,
            txItem.strName,
            opt.strBrand,
            opt.strModel,
            opt.strProductCode,
            opt.strSpecs,
          ].some((f) => f && String(f).toLowerCase().includes(q));
        });
      });
    }

    const statusOrder = {
      [addToCartKey]: 0,
      [purchaseOrderKey]: 1,
      [paidKey]: 2,
      [receivedKey]: 3,
      [deliveredKey]: 4,
    };

    const getLowestOrder = (po) => {
      const opts = po.purchase_order_options || [];
      let lowest = 999;
      opts.forEach((o) => {
        const id = Number(o.purchase_option?.nPurchaseOptionId);
        const order =
          statusOrder[String(allOptionHistories[id]?.nStatus ?? "")] ?? 999;
        if (order < lowest) lowest = order;
      });
      return lowest;
    };

    return result.slice().sort((a, b) => getLowestOrder(a) - getLowestOrder(b));
  }, [
    purchaseOrders,
    selectedStatusCode,
    search,
    allOptionHistories,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    isAOTL,
    isManagement,
    currentUserId,
  ]);

  // ── Grouped POs (closed, open, cancelled) ────────────────────────────────
  const groupedClosedPOs = useMemo(() => {
    if (
      selectedStatusCode !== closeCartKey &&
      selectedStatusCode !== openCartKey &&
      selectedStatusCode !== cancelCartKey
    )
      return null;

    const statusSections = buildStatusSections(
      addToCartKey,
      purchaseOrderKey,
      paidKey,
      receivedKey,
      deliveredKey,
    );
    const result = {};

    statusSections.forEach(({ key }) => {
      result[key] = {};
    });

    // Also seed open-section key and cancelled-section key so they bucket correctly
    const openSec = buildOpenSection(addToCartKey);
    const cancelSec = buildCancelledSection(cancelPoKey);
    if (!result[openSec.key]) result[openSec.key] = {};
    if (!result[cancelSec.key]) result[cancelSec.key] = {};

    filteredPurchaseOrders.forEach((po) => {
      const domStatus = String(getPoDominantStatus(po) ?? "");
      const bucket = result[domStatus];
      if (!bucket) return;
      const period = getTimePeriod(getPoDate(po));
      if (!bucket[period]) bucket[period] = [];
      bucket[period].push(po);
    });

    return result;
  }, [
    filteredPurchaseOrders,
    selectedStatusCode,
    closeCartKey,
    openCartKey,
    cancelCartKey,
    cancelPoKey,
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
    getPoDominantStatus,
    getPoDate,
  ]);

  // ── Voucher eligibility ───────────────────────────────────────────────────
  const voucherEligibleIds = useMemo(
    () =>
      new Set(
        filteredPurchaseOrders
          .filter((po) => {
            if (po.cStatus !== closeCartKey) return false;
            const vs = vouchersByPO[po.nPurchaseOrderId];
            if (
              vs &&
              (String(vs) === String(voucherActiveKey) ||
                String(vs) === String(voucherClosedKey))
            )
              return false;
            const opts = po.purchase_order_options || [];
            return (
              opts.length > 0 &&
              opts.every(
                (o) =>
                  String(
                    allOptionHistories[
                      Number(o.purchase_option?.nPurchaseOptionId)
                    ]?.nStatus ?? "",
                  ) === String(purchaseOrderKey),
              )
            );
          })
          .map((po) => po.nPurchaseOrderId),
      ),
    [
      filteredPurchaseOrders,
      closeCartKey,
      allOptionHistories,
      purchaseOrderKey,
      vouchersByPO,
      voucherActiveKey,
      voucherClosedKey,
    ],
  );

  const firstEligibleSupplierId = useMemo(() => {
    const firstId = [...voucherEligibleIds][0];
    return firstId
      ? getPoSupplierId(
          filteredPurchaseOrders.find((p) => p.nPurchaseOrderId === firstId),
        )
      : null;
  }, [voucherEligibleIds, filteredPurchaseOrders]);

  const sameSupplierEligibleIds = useMemo(
    () =>
      new Set(
        [...voucherEligibleIds].filter(
          (id) =>
            getPoSupplierId(
              filteredPurchaseOrders.find((p) => p.nPurchaseOrderId === id),
            ) === firstEligibleSupplierId,
        ),
      ),
    [voucherEligibleIds, filteredPurchaseOrders, firstEligibleSupplierId],
  );

  const allEligibleSelected =
    sameSupplierEligibleIds.size > 0 &&
    [...sameSupplierEligibleIds].every((id) => selectedPOIds.has(id));

  // ── Selection logic ───────────────────────────────────────────────────────
  const toggleSelectPO = (id) => {
    setSelectedPOIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      const incomingPO = filteredPurchaseOrders.find(
        (po) => po.nPurchaseOrderId === id,
      );
      if (prev.size > 0) {
        const existingPO = filteredPurchaseOrders.find(
          (po) => po.nPurchaseOrderId === [...prev][0],
        );
        if (getPoSupplierId(incomingPO) !== getPoSupplierId(existingPO)) {
          flagSelectionError(
            id,
            "Supplier of selected Purchase Carts should be all same",
          );
          return prev;
        }
        if (getPoPaymentTerms(incomingPO) !== getPoPaymentTerms(existingPO)) {
          flagSelectionError(
            id,
            "Payment Terms of the selected Purchase Carts does not match.",
          );
          return prev;
        }
      }
      return new Set(prev).add(id);
    });
  };
  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleUpdateClick = ({ po }) => {
    setSelectedPOId(po.nPurchaseOrderId);
    setUpdateModalOpen(true);
  };

  const selectedPO = useMemo(
    () =>
      purchaseOrders.find((po) => po.nPurchaseOrderId === selectedPOId) ?? null,
    [purchaseOrders, selectedPOId],
  );

  useEffect(() => {
    if (updateModalOpen && selectedPO?.purchase_order_options?.length === 0)
      setUpdateModalOpen(false);
  }, [selectedPO, updateModalOpen]);

  // ── Shared card props ─────────────────────────────────────────────────────
  const sharedCardProps = (po) => ({
    po,
    cartStatus,
    addToCartKey,
    cancelCartKey,
    cancelPoKey: cancelPoKey ?? "",
    purchaseOrderKey: purchaseOrderKey ?? "",
    paidKey: paidKey ?? "",
    receivedKey: receivedKey ?? "",
    deliveredKey: deliveredKey ?? "",
    removedFromCartKey,
    currentUserId,
    openCartKey: openCartKey ?? "",
    closeCartKey: closeCartKey ?? "",
    onUpdateClick: handleUpdateClick,
    collapsed: allCollapsed,
    onRemoved: () => fetchAllPurchaseOrders({ bustCache: true }),
    optionHistories: allOptionHistories,
    isEligible: voucherEligibleIds.has(po.nPurchaseOrderId),
    isSelected: selectedPOIds.has(po.nPurchaseOrderId),
    onToggleSelect: toggleSelectPO,
    voucherStatus: vouchersByPO[po.nPurchaseOrderId] ?? null,
    voucherActiveKey: voucherActiveKey ?? "",
    voucherClosedKey: voucherClosedKey ?? "",
    selectError: selectError === po.nPurchaseOrderId,
    onCreateVoucherClick: async ({ po: targetPo }) => {
      try {
        await withSpinner("Voucher", () =>
          api.post("vouchers", {
            cType: voucherSupplierTypeKey,
            nTypeId: getPoSupplierId(targetPo),
            cStatus: voucherActiveKey,
            nPurchaseOrderIds: [targetPo.nPurchaseOrderId],
          }),
        );
        await showSwal("SUCCESS", {}, { entity: "Voucher", action: "created" });
        fetchAllPurchaseOrders({ bustCache: true });
      } catch (err) {
        console.error("Failed to create voucher:", err);
        await showSwal("ERROR", {}, { entity: "Voucher" });
      }
    },
  });

  // ── Shared time-period renderer inside a section ──────────────────────────
  const renderSectionTimePeriods = (byPeriod) => {
    const renderedPeriods = TIME_PERIOD_ORDER.filter(
      (p) => (byPeriod[p] || []).length > 0,
    );
    return TIME_PERIOD_ORDER.map((period) => {
      const pos = byPeriod[period] || [];
      if (!pos.length) return null;
      const isFirstPeriod = period === renderedPeriods[0];
      return (
        <TimePeriodGroup
          key={period}
          period={period}
          count={pos.length}
          defaultOpen={isFirstPeriod}
          forceOpen={search.trim() ? true : undefined}
          cardsCollapsed={allCollapsed}
        >
          {renderTimePeriodCards(pos, sharedCardProps)}
        </TimePeriodGroup>
      );
    });
  };

  // ── Grouped renderer (closed, open, cancelled) ────────────────────────────
  const renderGroupedClosedCart = () => {
    if (!groupedClosedPOs) return null;

    // ── Open cart: single "Added to Cart" section ─────────────────────────
    if (selectedStatusCode === openCartKey) {
      const section = buildOpenSection(addToCartKey);
      const byPeriod = groupedClosedPOs[section.key] || {};
      const totalCount = Object.values(byPeriod).reduce(
        (s, arr) => s + arr.length,
        0,
      );
      return (
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionGroup
            title={section.label}
            count={totalCount}
            color={section.color}
            bg={section.bg}
            border={section.border}
            isFirst
            isLast
            forceOpen={search.trim() ? true : !allCollapsed}
          >
            {renderSectionTimePeriods(byPeriod)}
          </SectionGroup>
        </Box>
      );
    }

    // ── Cancelled cart: single "Voided" section ───────────────────────────
    if (selectedStatusCode === cancelCartKey) {
      const section = buildCancelledSection(cancelPoKey);
      const byPeriod = groupedClosedPOs[section.key] || {};
      const totalCount = Object.values(byPeriod).reduce(
        (s, arr) => s + arr.length,
        0,
      );
      return (
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionGroup
            title={section.label}
            count={totalCount}
            color={section.color}
            bg={section.bg}
            border={section.border}
            isFirst
            isLast
            forceOpen={search.trim() ? true : !allCollapsed}
          >
            {renderSectionTimePeriods(byPeriod)}
          </SectionGroup>
        </Box>
      );
    }

    // ── Closed cart: status sections + time periods ───────────────────────
    const statusSections = buildStatusSections(
      addToCartKey,
      purchaseOrderKey,
      paidKey,
      receivedKey,
      deliveredKey,
    );

    const visibleSections = statusSections.filter((section) => {
      const periods = groupedClosedPOs[section.key] || {};
      return Object.values(periods).reduce((s, arr) => s + arr.length, 0) > 0;
    });

    return (
      <Box
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {visibleSections.map((section, idx) => {
          const periods = groupedClosedPOs[section.key] || {};
          const totalCount = Object.values(periods).reduce(
            (s, arr) => s + arr.length,
            0,
          );
          const isFirst = idx === 0;
          const isLast = idx === visibleSections.length - 1;

          return (
            <SectionGroup
              key={section.key}
              title={section.label}
              count={totalCount}
              color={section.color}
              bg={section.bg}
              border={section.border}
              isFirst={isFirst}
              isLast={isLast}
              forceOpen={search.trim() ? true : !allCollapsed}
            >
              {renderSectionTimePeriods(periods)}
            </SectionGroup>
          );
        })}
      </Box>
    );
  };

  // ── Regular (non-grouped) renderer ───────────────────────────────────────
  const renderRegularList = () => (
    <>
      {/* Mobile */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 0.5,
          width: "100%",
        }}
      >
        {filteredPurchaseOrders.map((po) => (
          <POCard key={po.nPurchaseOrderId} {...sharedCardProps(po)} />
        ))}
      </Box>
      {/* Desktop two-column */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          gap: 0.5,
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        {[0, 1].map((col) => (
          <Box
            key={col}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            {filteredPurchaseOrders
              .filter((_, i) => i % 2 === col)
              .map((po) => (
                <POCard key={po.nPurchaseOrderId} {...sharedCardProps(po)} />
              ))}
          </Box>
        ))}
      </Box>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const isGroupedView =
    selectedStatusCode === closeCartKey ||
    selectedStatusCode === openCartKey ||
    selectedStatusCode === cancelCartKey;

  return (
    <PageLayout
      title="Purchase Cart"
      subtitle={
        selectedStatusCode && cartStatus?.[selectedStatusCode]
          ? `/ ${cartStatus[selectedStatusCode]}`
          : ""
      }
      footer={
        voucherEligibleIds.size > 0 ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <BaseButton
              label="Create Voucher"
              icon={<ReceiptLongOutlined />}
              actionColor="approve"
              disabled={selectedPOIds.size === 0}
              onClick={async () => {
                const selectedPOs = filteredPurchaseOrders.filter((po) =>
                  selectedPOIds.has(po.nPurchaseOrderId),
                );
                const terms = new Set(
                  selectedPOs.map((po) => getPoPaymentTerms(po)),
                );
                if (terms.size > 1) {
                  showGroupError("Payment Term");
                  return;
                }
                try {
                  await withSpinner("Voucher", () =>
                    api.post("vouchers", {
                      cType: voucherSupplierTypeKey,
                      nTypeId: getPoSupplierId(selectedPOs[0]),
                      cStatus: voucherActiveKey,
                      nPurchaseOrderIds: selectedPOs.map(
                        (po) => po.nPurchaseOrderId,
                      ),
                    }),
                  );
                  setSelectedPOIds(new Set());
                  await showSwal(
                    "SUCCESS",
                    {},
                    { entity: "Voucher", action: "created" },
                  );
                  fetchAllPurchaseOrders({ bustCache: true });
                } catch (err) {
                  console.error("Failed to create voucher:", err);
                  await showSwal("ERROR", {}, { entity: "Voucher" });
                }
              }}
            />
          </Box>
        ) : (
          false
        )
      }
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes optionErrorFade { from { opacity: 0; transform: translateY(-50%) scale(0.95); } to { opacity: 1; transform: translateY(-50%) scale(1); } }
        @keyframes errorShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
      `}</style>

      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <CustomSearchField
            label="Search PO / Supplier / Item"
            value={search}
            onChange={setSearch}
          />
        </Box>

        <SyncMenu onSync={() => fetchAllPurchaseOrders({ bustCache: true })} />
        {voucherEligibleIds.size > 0 && (
          <BaseButton
            label={allEligibleSelected ? "Unselect All" : "Select All"}
            icon={
              allEligibleSelected ? (
                <CheckBoxOutlined />
              ) : (
                <CheckBoxOutlineBlank />
              )
            }
            actionColor={allEligibleSelected ? "deactivate" : "confirm"}
            onClick={() => {
              if (allEligibleSelected) {
                setSelectedPOIds(new Set());
                return;
              }
              const eligiblePOs = filteredPurchaseOrders.filter((po) =>
                sameSupplierEligibleIds.has(po.nPurchaseOrderId),
              );
              const terms = new Set(
                eligiblePOs.map((po) => getPoPaymentTerms(po)),
              );
              if (terms.size > 1) {
                showGroupError(
                  "Payment Terms of selected Purchase Carts should be all same",
                );
                return;
              }
              setSelectedPOIds(new Set(sameSupplierEligibleIds));
            }}
          />
        )}

        <BaseButton
          label={allCollapsed ? "Expand All" : "Collapse All"}
          icon={allCollapsed ? <UnfoldMore /> : <UnfoldLess />}
          actionColor="default"
          onClick={() => setAllCollapsed((v) => !v)}
        />
      </Box>
      {/* Group error banner */}
      {groupError && (
        <Box
          sx={{
            mb: 1,
            px: 1.5,
            py: 0.75,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
          }}
        >
          <Typography
            sx={{ fontSize: "0.68rem", color: "#B91C1C", fontWeight: 600 }}
          >
            {groupError}
          </Typography>
        </Box>
      )}
      {/* Content */}
      {itemsLoading ? (
        <PurchaseCartSkeleton />
      ) : filteredPurchaseOrders.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "60vh",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: "#F3F4F6",
              border: "0.5px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCartOutlined
              sx={{ fontSize: "1.5rem", color: "#D1D5DB" }}
            />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#374151",
                lineHeight: 1.4,
              }}
            >
              No purchase orders found
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                mt: 0.4,
                lineHeight: 1.4,
              }}
            >
              {selectedStatusCode
                ? "No orders match the selected status filter."
                : "Items added to cart will appear here."}
            </Typography>
          </Box>
        </Box>
      ) : isGroupedView ? (
        renderGroupedClosedCart()
      ) : (
        renderRegularList()
      )}

      <PurchaseOrderCartModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        currentStatus={selectedPO?.cStatus}
        po={selectedPO}
        openCartKey={openCartKey ?? ""}
        closeCartKey={closeCartKey ?? ""}
        cancelCartKey={cancelCartKey ?? ""}
        optionHistories={allOptionHistories}
        aoGmDirectory={aoGmDirectory}
        onUpdateStatus={async (newStatusKey) => {
          await api.patch("purchase-orders/update-cart-status", {
            nPurchaseOrderId: selectedPO?.nPurchaseOrderId,
            cStatus: newStatusKey,
            nUserId: currentUserId,
          });
          setUpdateModalOpen(false);
          fetchAllPurchaseOrders({ bustCache: true });
          window.dispatchEvent(
            new CustomEvent("cart_status_updated", {
              detail: {
                purchaseOrderId: selectedPO?.nPurchaseOrderId,
                newStatus: newStatusKey,
              },
            }),
          );
        }}
        onProceedToPayment={async ({ strShippingDetails, cPaymentTerms }) => {
          await api.patch("purchase-orders/proceed-to-payment", {
            nPurchaseOrderId: selectedPO?.nPurchaseOrderId,
            strShippingDetails,
            cPaymentTerms,
            nUserId: currentUserId,
            nStatus: purchaseOrderKey,
          });
          fetchAllPurchaseOrders({ bustCache: true });
          window.dispatchEvent(
            new CustomEvent("cart_status_updated", {
              detail: {
                purchaseOrderId: selectedPO?.nPurchaseOrderId,
                newStatus: purchaseOrderKey,
              },
            }),
          );
        }}
        shippingMethod={shippingMethod}
        paymentTerms={paymentTerms}
        addToCartKey={addToCartKey ?? ""}
        purchaseOrderKey={purchaseOrderKey ?? ""}
        paidKey={paidKey ?? ""}
        receivedKey={receivedKey ?? ""}
        deliveredKey={deliveredKey ?? ""}
        currentUserId={currentUserId}
        cancelPoKey={cancelPoKey ?? ""}
        removedFromCartKey={removedFromCartKey}
        poVoucherStatus={vouchersByPO[selectedPO?.nPurchaseOrderId] ?? null}
        voucherActiveKey={voucherActiveKey ?? ""}
        voucherClosedKey={voucherClosedKey ?? ""}
        isAccountOfficer={isAccountOfficer}
        isGeneralManager={isGeneralManager}
        userTypes={userTypes}
      />
    </PageLayout>
  );
}

export default TransactionPurchaseCart;
