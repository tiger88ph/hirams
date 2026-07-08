import React, { useState } from "react";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Add,
  AutoAwesome,
  ListAlt,
} from "@mui/icons-material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Business } from "@mui/icons-material";
import DataTable from "../../../../../components/common/DataTable";
import DotSpinner from "../../../../../components/common/DotSpinner";
import ForPurchaseOptionRow from "./ForPurchaseOptionsRow";
import InfoDialog from "../../../../../components/common/InfoDialog";

/* ─── Constants ───────────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const inlineBtnSx = (bg = "#fff") => ({
  fontSize: "0.7rem",
  backgroundColor: bg,
  border: "1px solid #cfd8dc",
  cursor: "pointer",
  color: "#1976d2",
  fontWeight: 500,
  borderRadius: "6px",
  padding: "1px 6px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

const PANEL_HEADER_SX = {
  px: 2,
  py: 0.5,
  pl: 5,
  backgroundColor: "#2272c3",
  borderBottom: "1px solid #d6e2f0",
  color: "#DDE3EE",
  fontSize: "0.75rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
};

const STEP_KEYS = [
  "addToCartKey",
  "purchaseOrderKey",
  "paidKey",
  "receivedKey",
  "deliveredKey",
];

/* ─── Sub-components ──────────────────────────────────────────────── */
function LConnector({ ml = "10px", x1 = 12, yEnd = 16, x2End = 22 }) {
  return (
    <Box sx={{ position: "relative", height: 0, overflow: "visible", ml }}>
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "visible",
          pointerEvents: "none",
        }}
        width="160"
        height="20"
      >
        <line
          x1={x1}
          y1="0"
          x2={x1}
          y2={yEnd}
          stroke="#DDE3EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {x2End && (
          <line
            x1={x1}
            y1={yEnd}
            x2={x2End}
            y2={yEnd}
            stroke="#DDE3EE"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </Box>
  );
}

function ProgressBar({ value }) {
  const done = value >= 100;
  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", px: 1 }}>
      <Box
        sx={{
          flex: 1,
          height: 18,
          background: "#e2e8f0",
          borderRadius: "99px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: `${value}%`,
            height: "100%",
            borderRadius: "99px",
            position: "relative",
            overflow: "hidden",
            background: done
              ? "linear-gradient(90deg,#16a34a,#22c55e)"
              : "linear-gradient(90deg,#1d4ed8,#3b82f6)",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.2) 4px,rgba(255,255,255,0.2) 8px)",
              backgroundSize: "20px 20px",
              animation: "slide 0.6s linear infinite",
            },
            transition: "width 0.4s ease",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: value > 45 ? "#fff" : done ? "#16a34a" : "#1d4ed8",
              lineHeight: 1,
              textShadow: value > 45 ? "0 1px 2px rgba(0,0,0,0.25)" : "none",
              transition: "color 0.3s",
            }}
          >
            {value}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function CircularProgress({ value, balance }) {
  const done = value >= 100;
  const r = 54,
    circ = 2 * Math.PI * r,
    offset = circ - (value / 100) * circ;
  return (
    <Box
      sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5 }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0.3,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.52rem",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1,
          }}
        >
          Balance
        </Typography>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: balance === 0 ? "#15803d" : "#92400e",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {balance === 0 ? "₱ 00.00" : `₱ ${fmt(balance)}`}
        </Typography>
        <Box
          sx={{ width: "100%", height: "1px", background: "#e2e8f0", mt: 0.2 }}
        />
        <Typography
          sx={{ fontSize: "0.52rem", color: "#94a3b8", lineHeight: 1 }}
        >
          unpaid total
        </Typography>
      </Box>
      <svg width="52" height="52" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={done ? "#16a34a" : "#3b82f6"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s" }}
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fontWeight="700"
          fill={done ? "#16a34a" : "#1d4ed8"}
        >
          {value.toFixed(2)}%
        </text>
      </svg>
    </Box>
  );
}

function OptionsSubHeader({ columns }) {
  return (
    <Box
      sx={{
        px: 1.2,
        py: 0.7,
        display: "flex",
        background: "#f3f3f3",
        fontSize: "0.72rem",
        borderBottom: "1px solid #ddd",
        fontWeight: 600,
        color: "#555",
      }}
    >
      {columns.map(([label, flex]) => (
        <Box key={label} sx={{ flex, textAlign: "center" }}>
          {label}
        </Box>
      ))}
    </Box>
  );
}
const getOptionStep = (nStatus, option, keys) => {
  const { addToCartKey, purchaseOrderKey, paidKey, receivedKey, deliveredKey } = keys;
  const ordered = Number(option?.nQuantity || 0);

  if (ordered > 0) {
    const delivered = Math.min(Number(option?.nDeliveredQty || 0), ordered);
    const received  = Math.min(Number(option?.nInventoryQty  || 0), ordered);

    if (delivered >= ordered) return 5;
    if (delivered > 0) return 4 + delivered / ordered;
    if (received  >= ordered) return 4;
    if (received  > 0) return 3 + received  / ordered;
  }

  if (!nStatus) return 0;
  const s = String(nStatus);
  const order = [addToCartKey, purchaseOrderKey, paidKey, receivedKey, deliveredKey];
  const idx = order.findIndex((k) => s === String(k));
  return idx >= 0 ? idx + 1 : 0;
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
function PurchaseItemsTable({
  items,
  expandedRows,
  expandedOptions,
  optionErrors,
  crudItemsEnabled,
  showAddButton,
  showPurchaseOptions,
  checkboxOptionsEnabled,
  statusChangedAlert,
  isManagement,
  currentStatusLabel,
  transaction,
  transactionCode,
  handleCollapseAllToggle,
  toggleSpecsRow,
  toggleOptionsRow,
  toggleOptionSpecs,
  handleToggleInclude,
  setEditingItem,
  setAddingNewItem,
  setEntityToDelete,
  setSuggestionsItem,
  setIsSuggestionsModalOpen,
  setEditingOption,
  setOptionModalItemId,
  setOptionModalItem,
  setExpandedRows,
  forCanvasKey,
  readOnly = false,
  currentUserId,
  cancelPoKey,
  addToCartKey,
  purchaseOrderKey,
  paidKey,
  receivedKey,
  deliveredKey,
  removedFromCartKey,
  optionCartStatuses = {},
  optionStatuses = {},
  latestHistories = {},
  onRefreshOptionData,
  openCartKey,
  closeCartKey,
  cancelCartKey,
  optionAllHistories = {},
  onFetchAllOptionHistory,
  totalPurchaseProgress,
  totalPurchaseBalance,
  onCompareClick,
}) {
  const [chosenOnlyMap, setChosenOnlyMap] = useState({});

  const isChosenOnly = (id) => chosenOnlyMap[id] ?? true;
  const toggleChosenOnly = (id) =>
    setChosenOnlyMap((p) => ({ ...p, [id]: !isChosenOnly(id) }));
  const isAnythingExpanded = Object.values(expandedRows).some(
    (r) => r?.specs || r?.options,
  );

  const stepKeys = {
    addToCartKey,
    purchaseOrderKey,
    paidKey,
    receivedKey,
    deliveredKey,
  };
const getStep = (nStatus, option = null) => {
  const keys = { addToCartKey, purchaseOrderKey, paidKey, receivedKey, deliveredKey };
  return getOptionStep(nStatus, option, keys);
};
  /* ── Columns ─────────────────────────────────────────────────── */
  const canvasColumns = [
    {
      key: "desc",
      label: "Description",
      xs: 5,
      headerAlign: "center",
      cellSxExtra: { pl: 1.5 },
      render: (item) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            minWidth: 0,
          }}
        >
          <Inventory2OutlinedIcon
            sx={{ fontSize: "1rem", color: "text.secondary", flexShrink: 0 }}
          />
          <Typography
            fontWeight={500}
            sx={{
              fontSize: ".75rem",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ml: 1,
              flexGrow: 1,
            }}
          >
            <Box component="span" sx={{ fontWeight: 600 }}>
              {item.nItemNumber}.
            </Box>{" "}
            {item.name || "—"}
          </Typography>
          <Box
            sx={{ flexShrink: 0, mr: 3, display: "flex", alignItems: "center" }}
          >
            <Box
              component="button"
              title="Specs"
              onClick={(e) => {
                e.stopPropagation();
                toggleSpecsRow(item.id);
              }}
              sx={{
                background: "none",
                border: "none",
                cursor: "pointer",
                p: 0.5,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ArrowDropDownIcon
                sx={{
                  transform: expandedRows[item.id]?.specs
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  fontSize: "1.2rem",
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
    },
  {
  key: "progress",
  label: "Progress",
  xs: 4,
  align: "center",
  render: (item) => {
    let num = 0, den = 0;
    (item.purchaseOptions || [])
      .filter((o) => Number(o.bPurchaseIncluded) === 1)
      .forEach((o) => {
        const step = getStep(optionStatuses[o.nPurchaseOptionId], o);
        const qty  = Number(o.nQuantity || 0);
        num += qty * step;
        den += qty * 5;
      });
    return <ProgressBar value={den > 0 ? Math.round((num / den) * 100) : 0} />;
  },
},
    {
      key: "balance",
      label: "Balance",
      xs: 2,
      align: "right",
      render: (item) => {
        const paidStatuses = [
          String(paidKey),
          String(receivedKey),
          String(deliveredKey),
        ];
        const unpaid = (item.purchaseOptions || [])
          .filter((o) => {
            const included =
              Number(o.bPurchaseIncluded) === 1 ||
              (Number(o.bPurchaseIncluded) !== 1 && Number(o.bIncluded) === 1);
            if (!included || Number(o.bAddOn) === 1) return false;
            const s = optionStatuses[o.nPurchaseOptionId];
            return s == null || !paidStatuses.includes(String(s));
          })
          .reduce(
            (sum, o) =>
              sum + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
            0,
          );
        return (
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: unpaid === 0 ? "#15803d" : "#92400e",
              textAlign: "center",
            }}
          >
            {unpaid === 0 ? "₱ 00.00" : `₱ ${fmt(unpaid)}`}
          </Typography>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      xs: 1,
      align: "center",
      hideBorder: true,
      render: (item) =>
        showPurchaseOptions ? (
          <IconButton
            size="small"
            sx={{ position: "relative" }}
            onClick={(e) => {
              e.stopPropagation();
              toggleOptionsRow(item.id);
            }}
          >
            <ArrowDropDownIcon
              sx={{
                transform: expandedRows[item.id]?.options
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "transform 0.2s",
                fontSize: "1.4rem",
              }}
            />
            {item.purchaseOptions.length > 0 &&
              !expandedRows[item.id]?.options && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "1px",
                    right: "-3px",
                    backgroundColor: "#d9ecff",
                    color: "#1976d2",
                    width: "14px",
                    height: "14px",
                    fontSize: "0.50rem",
                    borderRadius: "50%",
                    border: "1px solid #90caf9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    fontWeight: 600,
                  }}
                >
                  {item.purchaseOptions.length}
                </Box>
              )}
          </IconButton>
        ) : null,
    },
  ];

  /* ── Row wrapper ─────────────────────────────────────────────── */
  const wrapRow = (item, rowIndex, paperNode, isLastRow) => {
    const isSpecsOpen = !!expandedRows[item.id]?.specs;
    const isOptionsOpen = !!expandedRows[item.id]?.options;
    const isExpanded = isSpecsOpen || isOptionsOpen;
    const prevItem = rowIndex > 0 ? items[rowIndex - 1] : null;
    const prevExpanded = prevItem
      ? !!(
          expandedRows[prevItem.id]?.specs || expandedRows[prevItem.id]?.options
        )
      : false;

    const anyProgressed = item.purchaseOptions.some((o) => {
      const s = latestHistories[o.nPurchaseOptionId]?.nStatus;
      return (
        s &&
        [
          String(purchaseOrderKey),
          String(paidKey),
          String(receivedKey),
          String(deliveredKey),
        ].includes(String(s))
      );
    });

    const visibleOptions = isChosenOnly(item.id)
      ? item.purchaseOptions.filter(
          (o) => Number(o.bPurchaseIncluded) === 1 || Number(o.bIncluded) === 1,
        )
      : item.purchaseOptions;

    const includedQty = item.purchaseOptions
      .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
    const purchasedQty = item.purchaseOptions
      .filter((o) => o.bPurchaseIncluded && Number(o.bAddOn) !== 1)
      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
    const totalQty = Number(item.qty || 0);
    const remainingQty = totalQty - includedQty;

    return (
      <Box
        sx={{
          ...(prevExpanded && {
            mt: 2.5,
            "& > .MuiPaper-root": { borderTop: "2px solid #94A3B8 !important" },
          }),
          ...(isLastRow &&
            !isExpanded && {
              "& > .MuiPaper-root": {
                borderBottomLeftRadius: "10px !important",
                borderBottomRightRadius: "10px !important",
              },
            }),
          ...(isLastRow &&
            isExpanded && {
              "& > .MuiPaper-root": {
                borderBottomLeftRadius: "0px !important",
                borderBottomRightRadius: "0px !important",
              },
            }),
        }}
      >
        {paperNode}

        {/* Connectors */}
        {isSpecsOpen && isOptionsOpen && (
          <LConnector ml="10px" x1={12} yEnd={30} x2End={null} />
        )}
        {isSpecsOpen && <LConnector ml="16px" x1={12} yEnd={16} x2End={22} />}

        {/* Specs Panel */}
        {isSpecsOpen && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #DDE3EE",
              borderTop: "none",
              borderLeft: "4px solid rgba(59,130,246,0.25)",
              background: "#2272c3",
              overflow: "hidden",
              borderRadius: 0,
              ...(isLastRow &&
                !isOptionsOpen && {
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "10px",
                }),
            }}
          >
            <Box
              sx={{ ...PANEL_HEADER_SX, borderBottom: "1px solid #c7dcf5" }}
              onClick={() => toggleSpecsRow(item.id)}
            >
              <span>Specifications:</span>
              <button
                style={{
                  ...inlineBtnSx("#f7fbff"),
                  fontSize: "0.6rem",
                  padding: "1px 8px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSpecsRow(item.id);
                }}
              >
                Hide <ExpandLess fontSize="small" />
              </button>
            </Box>
            {isSpecsOpen && isOptionsOpen && (
              <LConnector ml="6px" x1={12} yEnd={34} x2End={null} />
            )}
            <Box
              sx={{
                px: 2,
                py: 1,
                pl: 7,
                maxHeight: 150,
                overflowY: "auto",
                backgroundColor: "#e0f7ff",
                borderBottom: "1px solid #2272c3",
                color: "text.secondary",
                fontSize: "0.8rem",
                "& *": { backgroundColor: "transparent !important" },
                "& ul": { paddingLeft: 2, margin: 0, listStyleType: "disc" },
                "& ol": { paddingLeft: 2, margin: 0, listStyleType: "decimal" },
                "& li": { marginBottom: 0.25 },
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{
                __html: item.specs || "No data available.",
              }}
            />
          </Paper>
        )}

        {isOptionsOpen && <LConnector ml="10px" x1={12} yEnd={16} x2End={27} />}

        {/* Purchase Options Panel */}
        {isOptionsOpen && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #DDE3EE",
              borderTop: "none",
              borderLeft: "4px solid #90caf9",
              background: "#fafbfd",
              overflow: "hidden",
              borderRadius: 0,
              ...(isLastRow && {
                borderBottomLeftRadius: "10px",
                borderBottomRightRadius: "10px",
              }),
            }}
          >
            {/* Panel header */}
            <Box sx={PANEL_HEADER_SX} onClick={() => toggleOptionsRow(item.id)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Purchase Options</span>
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    px: 0.8,
                    py: 0.15,
                    borderRadius: "5px",
                    border: `0.5px solid ${purchasedQty >= totalQty && totalQty > 0 ? "#86efac" : "#90caf9"}`,
                    background:
                      purchasedQty >= totalQty && totalQty > 0
                        ? "#dcfce7"
                        : "#dbeafe",
                    color:
                      purchasedQty >= totalQty && totalQty > 0
                        ? "#15803d"
                        : "#1e40af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {purchasedQty} / {totalQty}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                {checkboxOptionsEnabled &&
                  !statusChangedAlert &&
                  !readOnly &&
                  !anyProgressed && (
                    <>
                      <button
                        style={inlineBtnSx()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSuggestionsItem(item);
                          setIsSuggestionsModalOpen(true);
                        }}
                      >
                        <AutoAwesome fontSize="small" /> Get Suggestions
                      </button>
                      <button
                        style={inlineBtnSx()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOption(null);
                          setOptionModalItemId(item.id);
                          setOptionModalItem({ ...item, remainingQty });
                        }}
                      >
                        <Add fontSize="small" /> Option
                      </button>
                    </>
                  )}
                <button
                  style={{
                    ...inlineBtnSx(isChosenOnly(item.id) ? "#dbeafe" : "#fff"),
                    color: isChosenOnly(item.id) ? "#1e40af" : "#1976d2",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChosenOnly(item.id);
                  }}
                >
                  {isChosenOnly(item.id) ? "Show all" : "Chosen only"}
                </button>
                <button
                  style={inlineBtnSx("#f7fbff")}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOptionsRow(item.id);
                  }}
                >
                  Hide <ExpandLess fontSize="small" />
                </button>
              </Box>
            </Box>

            <OptionsSubHeader
              columns={[
                ["Supplier", 2],
                ["Brand | Model", 2],
                ["Quantity", 1],
                ["Unit Price", 2],
                ["Total", 2],
                ...(checkboxOptionsEnabled ? [["Action", 1]] : []),
              ]}
            />

            {/* Option rows */}
            {item.optionsLoading ? (
              <Box
                sx={{
                  py: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <DotSpinner size={6} />
              </Box>
            ) : item.purchaseOptions.length === 0 ? (
              <Box
                sx={{
                  py: 1,
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                No options available.
              </Box>
            ) : (
              visibleOptions.map((option, index) => {
                const hasNoRegularOptions = visibleOptions.every(
                  (o) => Number(o.bAddOn) === 1,
                );
                const isFirstAddOn =
                  Number(option.bAddOn) === 1 &&
                  (index === 0 ||
                    Number(visibleOptions[index - 1].bAddOn) !== 1);
                const displayIndex =
                  Number(option.bAddOn) === 1
                    ? visibleOptions
                        .slice(0, index)
                        .filter((o) => Number(o.bAddOn) === 1).length + 1
                    : visibleOptions
                        .slice(0, index)
                        .filter((o) => Number(o.bAddOn) !== 1).length + 1;
                const latestStatus = latestHistories[option.nPurchaseOptionId]
                  ? String(latestHistories[option.nPurchaseOptionId].nStatus)
                  : null;
                const isInCart = latestStatus === String(addToCartKey);
                const ordered = Number(option.nQuantity || 0);
                const hasPartialReceived =
                  Number(option.nInventoryQty || 0) > 0;
                const hasPartialDelivered =
                  Number(option.nDeliveredQty || 0) > 0;

                const isOptionProgressed =
                  (latestStatus !== null &&
                    [
                      String(purchaseOrderKey),
                      String(paidKey),
                      String(receivedKey),
                      String(deliveredKey),
                    ].includes(latestStatus)) ||
                  hasPartialReceived ||
                  hasPartialDelivered;
                return (
                  <ForPurchaseOptionRow
                    key={option.id}
                    option={option}
                    index={index}
                    displayIndex={displayIndex}
                    isLastOption={index === item.purchaseOptions.length - 1}
                    itemId={item.id}
                    item={item}
                    checkboxOptionsEnabled={checkboxOptionsEnabled}
                    expandedOptions={expandedOptions}
                    optionErrors={optionErrors}
                    onToggleInclude={handleToggleInclude}
                    onToggleOptionSpecs={toggleOptionSpecs}
                    onEditOption={(opt) => {
                      setEditingOption(opt);
                      setOptionModalItemId(opt.nTransactionItemId);
                    }}
                    onDeleteOption={(_id, opt) =>
                      setEntityToDelete({ type: "option", data: opt })
                    }
                    isManagement={isManagement}
                    isFirstAddOn={isFirstAddOn}
                    hasNoRegularOptions={hasNoRegularOptions}
                    statusChangedAlert={statusChangedAlert}
                    readOnly={readOnly}
                    currentUserId={currentUserId}
                    cancelPoKey={cancelPoKey}
                    addToCartKey={addToCartKey}
                    purchaseOrderKey={purchaseOrderKey}
                    paidKey={paidKey}
                    receivedKey={receivedKey}
                    deliveredKey={deliveredKey}
                    removedFromCartKey={removedFromCartKey}
                    latestHistory={
                      latestHistories[option.nPurchaseOptionId] ?? null
                    }
                    onAddedToCart={(optionId) =>
                      onRefreshOptionData(undefined, optionId)
                    }
                    isProgressed={isOptionProgressed}
                    isInCart={isInCart}
                    openCartKey={openCartKey}
                    closeCartKey={closeCartKey}
                    cancelCartKey={cancelCartKey}
                    allHistories={
                      optionAllHistories[option.nPurchaseOptionId] ?? null
                    }
                    onFetchAllHistory={() =>
                      onFetchAllOptionHistory(option.nPurchaseOptionId)
                    }
                    currentCartStatus={
                      optionCartStatuses[option.nPurchaseOptionId] ?? null
                    }
                    onCompareClick={onCompareClick} 
                  />
                );
              })
            )}
          </Paper>
        )}
      </Box>
    );
  };
  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes slide { from { background-position: 0 0; } to { background-position: 20px 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Transaction info card */}
      <InfoDialog p={1.5} mb={1}>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: "520px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    background: "#0369a1",
                    borderRadius: "7px",
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Business sx={{ color: "white", fontSize: "1rem" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.2,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: "0.65rem",
                        background: "#bae6fd",
                        color: "#0c4a6e",
                        border: "0.5px solid #7dd3fc",
                        borderRadius: "5px",
                        px: 1,
                        py: 0.3,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      #{" "}
                      {transaction.strCode || transaction.transactionId || "—"}
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      textAlign: "left",
                      fontSize: "0.7rem",
                      fontStyle: "italic",
                      color: "#0369a1",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        fontStyle: "normal",
                        color: "#0c4a6e",
                      }}
                    >
                      {transaction.clientName || "—"}
                    </Box>
                    <Box
                      component="span"
                      sx={{ mx: 0.5, color: "#7dd3fc", fontStyle: "normal" }}
                    >
                      :
                    </Box>
                    {transaction.strTitle || transaction.transactionName || "—"}
                  </Typography>
                </Box>
              </Box>
              {showPurchaseOptions && (
                <CircularProgress
                  value={totalPurchaseProgress ?? 0}
                  balance={totalPurchaseBalance ?? 0}
                />
              )}
            </Box>
          </Box>
        </Box>
      </InfoDialog>

      {/* Table toolbar */}
      <Box
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <ListAlt sx={{ fontSize: "1rem" }} /> Transaction Items
        </Typography>
        <button
          style={inlineBtnSx("#f7fbff")}
          onClick={handleCollapseAllToggle}
        >
          {isAnythingExpanded ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {isAnythingExpanded ? "Hide all" : "Expand all"}
          </Box>
        </button>
      </Box>

      <DataTable
        minWidth="650px"
        rows={items}
        rowKey={(row) => row.id}
        rowSx={() => ({
          borderLeft: "4px solid #1565c0",
          "&:hover": { background: "#FAFBFF" },
        })}
        columns={canvasColumns}
        wrapRow={wrapRow}
        emptyText="No items available."
      />
    </>
  );
}

export default PurchaseItemsTable;
