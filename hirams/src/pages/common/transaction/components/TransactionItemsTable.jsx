import React from "react";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Add,
  AutoAwesome,
  ListAlt,
} from "@mui/icons-material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Edit, Delete } from "@mui/icons-material";
import BaseButton from "../../../../components/common/BaseButton";
import DataTable from "../../../../components/common/DataTable";
import DotSpinner from "../../../../components/common/DotSpinner";
import PurchaseOptionRow from "./PurchaseOptionsRow";
import CompareView from "./CompareView";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import {
  Business,
  MonetizationOnOutlined,
  ReceiptLongOutlined,
  EventOutlined,
  CalendarTodayOutlined,
} from "@mui/icons-material";
import InfoDialog from "../../../../components/common/InfoDialog";
/* ─── Helpers ─────────────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── Shared inline button style ─────────────────────────────────── */
const inlineBtnSx = (bg = "#fff") => ({
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
const STAT_STYLES = {
  default: {
    border: "rgba(3,105,161,0.15)",
    label: "#0369a1",
    value: "#0c4a6e",
    sub: "#0369a1",
  },
  warn: {
    border: "rgba(251,191,36,0.4)",
    label: "#b45309",
    value: "#92400e",
    sub: "#b45309",
  },
  danger: {
    border: "rgba(239,68,68,0.4)",
    label: "#dc2626",
    value: "#991b1b",
    sub: "#dc2626",
  },
  info: {
    border: "rgba(20,184,166,0.3)",
    label: "#0f766e",
    value: "#0f766e",
    sub: "#0f766e",
  },
};

const StatCard = ({ icon, label, value, sub, variant = "default" }) => {
  const s = STAT_STYLES[variant] ?? STAT_STYLES.default;
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "rgba(255,255,255,0.55)",
        border: `0.5px solid ${s.border}`,
        borderRadius: "7px",
        px: 1.25,
        py: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        {React.cloneElement(icon, { sx: { fontSize: 12, color: s.label } })}
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 500,
            color: s.label,
            letterSpacing: "0.03em",
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: s.value,
          lineHeight: 1.2,
          textAlign: "left",
          ml: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        {value || "—"}
      </Typography>
      {sub && (
        <Typography
          sx={{
            fontSize: "0.65rem",
            color: s.sub,
            opacity: 0.85,
            lineHeight: 1,
            textAlign: "left",
            ml: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          {sub}
        </Typography>
      )}
      <Box
        sx={{
          position: "absolute",
          right: -6,
          bottom: -6,
          width: 54,
          height: 54,
          opacity: 0.09,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 84, color: s.label } })}
      </Box>
    </Box>
  );
};
/* ─── Drag-and-drop row wrapper ─────────────────────────────────── */
const SortableWrapper = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: disabled ? "default" : "grab",
      }}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
    >
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   TRANSACTION ITEMS TABLE COMPONENT
   Props:
   - items                  : array
   - itemsLoading           : bool
   - expandedRows           : object
   - expandedOptions        : object
   - optionErrors           : object
   - compareData            : object | null
   - isCompareActive        : bool
   - crudItemsEnabled       : bool
   - showAddButton          : bool
   - showPurchaseOptions    : bool
   - checkboxOptionsEnabled : bool
   - anyItemHasABC          : bool
   - statusChangedAlert     : bool
   - isManagement           : bool
   - isAccountOfficer       : bool
   - suppliers              : array
   - cItemType              : string | null
   - currentStatusLabel     : string
   - transaction            : object
   - getEffectiveABC        : fn(item) => number
   - handleDragEnd          : fn
   - handleCollapseAllToggle: fn
   - toggleSpecsRow         : fn(id)
   - toggleOptionsRow       : fn(id)
   - toggleOptionSpecs      : fn(optionId)
   - handleToggleInclude    : fn(itemId, optionId, value)
   - handleCompareClick     : fn(item, option)
   - setEditingItem         : fn
   - setAddingNewItem       : fn
   - setEntityToDelete      : fn
   - setSuggestionsItem     : fn
   - setIsSuggestionsModalOpen: fn
   - setEditingOption       : fn
   - setOptionModalItemId   : fn
   - setOptionModalItem     : fn
   - forCanvasKey           : string
   - onSpecsChange          : fn(newSpecs)         [compare view]
   - onOptionSpecsChange    : fn(optionId, newSpecs) [compare view]
═══════════════════════════════════════════════════════════════════ */
function TransactionItemsTable({
  items,
  itemsLoading,
  expandedRows,
  expandedOptions,
  optionErrors,
  compareData,
  isCompareActive,
  crudItemsEnabled,
  showAddButton,
  showPurchaseOptions,
  checkboxOptionsEnabled,
  anyItemHasABC,
  statusChangedAlert,
  isManagement,
  isAccountOfficer,
  suppliers,
  cItemType,
  currentStatusLabel,
  transaction,
  getEffectiveABC,
  handleDragEnd,
  handleCollapseAllToggle,
  toggleSpecsRow,
  toggleOptionsRow,
  toggleOptionSpecs,
  handleToggleInclude,
  handleCompareClick,
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
  transactionHasABC,
  abcValue,
  abcSub,
  abcValidation,
  totalCanvas,
  totalABC,
  fmtDate,
  fmtTime,
  getDueDateVariant,
  onSpecsChange,
  onOptionSpecsChange,
  readOnly = false,
}) {
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* ── Derived values ── */
  const isAnythingExpanded = Object.values(expandedRows).some(
    (r) => r?.specs || r?.options,
  );

  const descXs = showPurchaseOptions
    ? anyItemHasABC
      ? 3
      : 7
    : anyItemHasABC
      ? 5
      : 8;

  const qtyXs =
    crudItemsEnabled && !showPurchaseOptions ? 3 : showPurchaseOptions ? 2 : 4;

  /* ── Column definitions ── */
  const canvasColumns = [
    {
      key: "desc",
      label: "Description",
      xs: descXs,
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
            sx={{
              flexShrink: 0,
              mr: 3,
              display: "flex",
              alignItems: "center",
            }}
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
      key: "qty",
      label: "Quantity",
      xs: qtyXs,
      align: "center",
      render: (item) => {
        const includedQty = item.purchaseOptions
          .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
          .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
        const isFilled =
          showPurchaseOptions &&
          Number(includedQty) === Number(item.qty || 0) &&
          Number(item.qty) > 0;
        return (
          <Typography
            sx={{
              fontSize: ".7rem",
              lineHeight: 1.3,
              textAlign: "center",
              width: "100%",
              color: isFilled ? "#15803d" : "inherit",
              fontWeight: isFilled ? 700 : 400,
            }}
          >
            {showPurchaseOptions && `${includedQty} / `}
            {item.qty}
            <br />
            <span
              style={{
                fontSize: "0.65rem",
                color: isFilled ? "#15803d" : "#94A3B8",
              }}
            >
              {item.uom}
            </span>
          </Typography>
        );
      },
    },
    ...(showPurchaseOptions
      ? [
          {
            key: "canvas",
            label: "Canvas",
            xs: 2,
            align: "right",
            render: (item) => {
              const tot = item.purchaseOptions
                .filter((o) => o.bIncluded)
                .reduce(
                  (s, o) =>
                    s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
                  0,
                );
              return (
                <Typography sx={{ fontSize: ".7rem", lineHeight: 1.2 }}>
                  ₱ {fmt(tot)}
                </Typography>
              );
            },
          },
        ]
      : []),
    ...(anyItemHasABC
      ? [
          {
            key: "abc",
            label: "ABC",
            xs: showPurchaseOptions ? 2 : 3,
            align: "right",
            render: (item) => {
              const tot = item.purchaseOptions
                .filter((o) => o.bIncluded)
                .reduce(
                  (s, o) =>
                    s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
                  0,
                );
              const effectiveABC = getEffectiveABC(item);
              const isOver = tot > effectiveABC && effectiveABC > 0;
              return (
                <Typography
                  sx={{
                    fontSize: ".7rem",
                    lineHeight: 1.2,
                    color: isOver ? "#dc2626" : "inherit",
                    fontWeight: isOver ? 700 : 400,
                  }}
                >
                  ₱ {fmt(item.abc)}
                </Typography>
              );
            },
          },
        ]
      : []),
    ...(showPurchaseOptions && anyItemHasABC
      ? [
          {
            key: "balance",
            label: "Balance",
            xs: 2,
            align: "right",
            render: (item) => {
              const tot = item.purchaseOptions
                .filter((o) => o.bIncluded)
                .reduce(
                  (s, o) =>
                    s + Number(o.nQuantity || 0) * Number(o.dUnitPrice || 0),
                  0,
                );
              const balance = getEffectiveABC(item) - tot;
              const isNegative = balance < 0;
              return (
                <Typography
                  sx={{
                    fontSize: ".7rem",
                    lineHeight: 1.2,
                    color: isNegative ? "#dc2626" : "inherit",
                    fontWeight: isNegative ? 700 : 400,
                  }}
                >
                  ₱ {fmt(balance)}
                </Typography>
              );
            },
          },
        ]
      : []),
    ...(crudItemsEnabled ||
    (showPurchaseOptions && !readOnly) ||
    showPurchaseOptions
      ? [
          {
            key: "action",
            label: "Action",
            xs: 1,
            align: "center",
            hideBorder: true,
            render: (item) => (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                {isManagement && !readOnly && (
                  <>
                    <BaseButton
                      icon={<Edit sx={{ fontSize: "0.9rem" }} />}
                      tooltip="Edit"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                        setAddingNewItem(true);
                      }}
                      disabled={statusChangedAlert}
                    />
                    {crudItemsEnabled && (
                      <BaseButton
                        icon={<Delete sx={{ fontSize: "0.9rem" }} />}
                        tooltip="Delete"
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntityToDelete({ type: "item", data: item });
                        }}
                        disabled={statusChangedAlert}
                      />
                    )}
                  </>
                )}
                {showPurchaseOptions && (
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
                )}
              </Box>
            ),
          },
        ]
      : []),
  ];

  /* ── Row sx ── */
  const getRowSx = () => ({
    borderLeft: "4px solid #1565c0",
    "&:hover": { background: "#FAFBFF" },
  });

  /* ── Row wrapper (specs + options panels) ── */
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

    return (
      <SortableWrapper id={item.id} disabled={!crudItemsEnabled || isSpecsOpen}>
        <Box
          sx={{
            ...(prevExpanded && {
              mt: 0.5,
              "& > .MuiPaper-root": {
                borderTop: "2px solid #94A3B8 !important",
              },
            }),
            ...(isLastRow && !isExpanded
              ? {
                  "& > .MuiPaper-root": {
                    borderBottomLeftRadius: "10px !important",
                    borderBottomRightRadius: "10px !important",
                  },
                }
              : isLastRow && isExpanded
                ? {
                    "& > .MuiPaper-root": {
                      borderBottomLeftRadius: "0px !important",
                      borderBottomRightRadius: "0px !important",
                    },
                  }
                : undefined),
          }}
        >
          {paperNode}
        </Box>

        {/* ── Specs panel ── */}
        {isSpecsOpen && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #DDE3EE",
              borderTop: "none",
              borderLeft: "4px solid #1e88e5",
              background: "#f3f8ff",
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
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: "#e1efff",
                borderBottom: "1px solid #c7dcf5",
                color: "#1e88e5",
                fontWeight: 400,
                fontSize: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
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
            <Box
              sx={{
                px: 2,
                py: 1,
                maxHeight: 150,
                overflowY: "auto",
                backgroundColor: "#ADD8E65A",
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

        {/* ── Purchase Options panel ── */}
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
            <Box
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: "#eef4fb",
                borderBottom: "1px solid #d6e2f0",
                color: "#1565c0",
                fontSize: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => toggleOptionsRow(item.id)}
            >
              <span>Purchase Options</span>
              <Box sx={{ display: "flex", gap: 1 }}>
                {checkboxOptionsEnabled &&
                  !statusChangedAlert &&
                  !readOnly &&
                  (() => {
                    const includedQty = item.purchaseOptions
                      .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
                      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
                    const remainingQty = Number(item.qty || 0) - includedQty;
                    return (
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
                    );
                  })()}
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

            {/* Options sub-header */}
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
              {[
                "Supplier",
                "Brand | Model",
                "Quantity",
                "Unit Price",
                "EWT",
                "Total",
              ].map((h, i) => (
                <Box
                  key={h}
                  sx={{
                    flex: [2.5, 2, 1, 1.5, 1.5, 1.5][i],
                    textAlign: "center",
                  }}
                >
                  {h}
                </Box>
              ))}
              {checkboxOptionsEnabled && (
                <Box sx={{ flex: 1, textAlign: "center" }}>Action</Box>
              )}
            </Box>

            {/* Options rows */}
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
              item.purchaseOptions.map((option, index) => {
                const hasNoRegularOptions = item.purchaseOptions.every(
                  (o) => Number(o.bAddOn) === 1,
                );
                const isFirstAddOn =
                  Number(option.bAddOn) === 1 &&
                  (index === 0 ||
                    Number(item.purchaseOptions[index - 1].bAddOn) !== 1);
                const displayIndex =
                  Number(option.bAddOn) === 1
                    ? item.purchaseOptions
                        .slice(0, index)
                        .filter((o) => Number(o.bAddOn) === 1).length + 1
                    : item.purchaseOptions
                        .slice(0, index)
                        .filter((o) => Number(o.bAddOn) !== 1).length + 1;
                return (
                  <PurchaseOptionRow
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
                    onCompareClick={handleCompareClick}
                    isManagement={isManagement}
                    isFirstAddOn={isFirstAddOn}
                    hasNoRegularOptions={hasNoRegularOptions}
                    statusChangedAlert={statusChangedAlert}
                    readOnly={readOnly}
                  />
                );
              })
            )}
          </Paper>
        )}
      </SortableWrapper>
    );
  };

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Info card ── */}
      {!isCompareActive && (
        <InfoDialog p={1.5} mb={1}>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: "520px" }}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  mb: 1.25,
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

              {/* Stat cards */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: showPurchaseOptions
                    ? "repeat(4, minmax(0,1fr))"
                    : "repeat(3, minmax(0,1fr))",
                  gap: "8px",
                }}
              >
                <StatCard
                  icon={<MonetizationOnOutlined />}
                  label={
                    transactionHasABC
                      ? "Transaction ABC"
                      : "Total ABC (per item)"
                  }
                  value={abcValue}
                  sub={abcSub}
                  variant={abcValidation ? "danger" : "info"}
                />
                {showPurchaseOptions && (
                  <StatCard
                    icon={<ReceiptLongOutlined />}
                    label="Total Canvas"
                    value={`₱ ${fmt(totalCanvas)}`}
                    sub={
                      transactionHasABC || items.some((i) => Number(i.abc) > 0)
                        ? `Balance: ₱ ${fmt(totalABC - totalCanvas)}`
                        : null
                    }
                    variant={abcValidation ? "danger" : "info"}
                  />
                )}
                <StatCard
                  icon={<EventOutlined />}
                  label="AO Due Date"
                  value={
                    transaction.dtAODueDate
                      ? fmtDate(transaction.dtAODueDate)
                      : "—"
                  }
                  sub={
                    transaction.dtAODueDate
                      ? fmtTime(transaction.dtAODueDate)
                      : null
                  }
                  variant={getDueDateVariant(transaction.dtAODueDate)}
                />
                <StatCard
                  icon={<CalendarTodayOutlined />}
                  label="Document Submission"
                  value={
                    transaction.dtDocSubmission
                      ? fmtDate(transaction.dtDocSubmission)
                      : "No Date Attached."
                  }
                  sub={
                    transaction.dtDocSubmission
                      ? fmtTime(transaction.dtDocSubmission)
                      : "No Time Attached."
                  }
                  variant={getDueDateVariant(transaction.dtDocSubmission)}
                />
              </Box>
            </Box>
          </Box>
        </InfoDialog>
      )}

      {/* ── Toolbar ── */}
      {!isCompareActive && (
        <Box
          sx={{
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: label + progress badge */}
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
            <ListAlt sx={{ fontSize: "1rem" }} />
            Transaction Items
            {showPurchaseOptions && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.65rem",
                  background: "#bae6fd",
                  color: "#0c4a6e",
                  border: "0.5px solid #7dd3fc",
                  borderRadius: "5px",
                  px: 1,
                  py: 0.1,
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                PROGRESS:{" "}
                {
                  items.filter((item) => {
                    const includedQty = item.purchaseOptions
                      .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
                      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
                    return (
                      Number(includedQty) === Number(item.qty || 0) &&
                      Number(item.qty) > 0
                    );
                  }).length
                }
                /{items.length}
              </Box>
            )}
          </Typography>

          {/* Right: action buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {showAddButton && !statusChangedAlert && !readOnly && (
              <>
                <button
                  style={inlineBtnSx()}
                  onClick={() => {
                    setEditingItem(null);
                    setAddingNewItem(true);
                  }}
                >
                  <Add fontSize="small" />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Item
                  </Box>
                </button>
                <button
                  style={inlineBtnSx()}
                  onClick={() =>
                    navigate("/add-bulk-item", {
                      state: { currentStatusLabel, transaction },
                    })
                  }
                >
                  <Inventory2Outlined fontSize="small" />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Add Bulk Item
                  </Box>
                </button>
              </>
            )}
            <button
              style={inlineBtnSx("#f7fbff")}
              onClick={handleCollapseAllToggle}
            >
              {isAnythingExpanded ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {isAnythingExpanded ? "Hide all" : "Expand all"}
              </Box>
            </button>
          </Box>
        </Box>
      )}

      {/* ── DnD Table ── */}
      {!isCompareActive && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setExpandedRows({})}
          onDragEnd={crudItemsEnabled ? handleDragEnd : undefined}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <DataTable
              minWidth="650px"
              rows={items}
              rowKey={(row) => row.id}
              rowSx={getRowSx}
              columns={canvasColumns}
              wrapRow={wrapRow}
              emptyText="No items available."
            />
          </SortableContext>
        </DndContext>
      )}

      {/* ── Compare view ── */}
      {isCompareActive && compareData && (
        <CompareView
          compareData={compareData}
          onSpecsChange={onSpecsChange}
          onOptionSpecsChange={onOptionSpecsChange}
          forCanvasKey={forCanvasKey}
        />
      )}
    </>
  );
}

export default TransactionItemsTable;
