import React, { useState, useEffect } from "react";
import api from "../../../../../utils/api/api.js";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog.jsx";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { printRoute } from "../../../../../utils/helpers/printRoute.js";
import { Box, Typography, Checkbox } from "@mui/material";
import {
  LocalShippingOutlined,
  ReceiptLongOutlined,
  CalendarTodayOutlined,
  PersonOutlined,
  StorefrontOutlined,
  PrintOutlined,
} from "@mui/icons-material";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      });
};
const SHAKE_KEYFRAMES = `@keyframes drRowShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("dr-row-shake-kf")
) {
  const s = document.createElement("style");
  s.id = "dr-row-shake-kf";
  s.textContent = SHAKE_KEYFRAMES;
  document.head.appendChild(s);
}
// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 0.6 }}>
      <Icon
        sx={{
          fontSize: "0.75rem",
          color: "text.disabled",
          mt: "2px",
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: "0.65rem",
          color: "text.secondary",
          flexShrink: 0,
          minWidth: 90,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 600,
          color: "text.primary",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, mt: 0.5 }}>
      <Typography
        sx={{
          fontSize: "0.58rem",
          fontWeight: 700,
          color: "text.disabled",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: "0.5px", background: "#e2e8f0" }} />
    </Box>
  );
}

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  index,
  onSelectionChange,
  currentUserId,
  receivedKey,
  deliveredKey,
  paidKey,
  onStatusToggled,
}) {
  const [specsOpen, setSpecsOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);

  const hasSpecs =
    item.itemSpecs &&
    item.itemSpecs.trim() &&
    item.itemSpecs.trim() !== "<p></p>";
  const hasOptions = item.options && item.options.length > 0;
  const hasSerials = hasOptions
    ? item.options.some((opt) =>
        (opt.deliveredRows || []).some(
          (row) => (row.serialNumbers || []).filter(Boolean).length > 0,
        ),
      )
    : false;

  const allRows = hasOptions
    ? item.options.flatMap((opt) =>
        opt.deliveredRows.map((row) => ({
          ...row,
          uom: opt.uom,
          nPurchaseOptionId: opt.nPurchaseOptionId,
          nPurchaseOrderId: opt.nPurchaseOrderId,
        })),
      )
    : [];
  // Extract the numeric portion of a receipt number, e.g. "RN2024-0001" -> 20240001
  const extractReceiptNum = (str) => {
    if (!str) return -Infinity;
    const digits = String(str).replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : -Infinity;
  };

  const defaultSelectedIds = (() => {
    const activeRows = allRows.filter((r) => r.cStatus === "A");
    if (activeRows.length === 0) return [];
    const maxReceiptNum = Math.max(
      ...activeRows.map((r) => extractReceiptNum(r.strReceiptNumber)),
    );
    return activeRows
      .filter((r) => extractReceiptNum(r.strReceiptNumber) === maxReceiptNum)
      .map((r) => r.nInventoryId);
  })();
  const [selected, setSelected] = useState(defaultSelectedIds);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selectError, setSelectError] = useState("");
  const [shakeRowId, setShakeRowId] = useState(null);

  const flagSelectError = (id, message) => {
    setSelectError(message);
    setShakeRowId(id);
    setTimeout(() => {
      setSelectError("");
      setShakeRowId(null);
    }, 3000);
  };

  const toggleRowStatus = async (row) => {
    const newStatus = row.cStatus === "C" ? "A" : "C";
    setStatusUpdatingId(row.nInventoryId);
    try {
      await api.put(`inventory/${row.nInventoryId}`, { cStatus: newStatus });
      if (row.nPurchaseOrderId) {
        await api.post("purchase-order/sync-status", {
          nPurchaseOrderId: row.nPurchaseOrderId,
          nPurchaseOptionId: row.nPurchaseOptionId,
          nUserId: currentUserId,
          nReceivedStatus: receivedKey,
          nDeliveredStatus: deliveredKey,
          nPaidStatus: paidKey,
        });
      }
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
      onStatusToggled?.();
    } catch (err) {
      console.error("Failed to toggle inventory status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };
  useEffect(() => {
    if (qtyOpen && allRows.length > 0) {
      const totalQty = allRows
        .filter((r) => selected.includes(r.nInventoryId))
        .reduce((sum, r) => sum + (r.nQuantity || 0), 0);
      const selectedRow = allRows.find((r) =>
        selected.includes(r.nInventoryId),
      );
      onSelectionChange?.(
        item,
        totalQty,
        index,
        selectedRow?.strReceiptNumber || "",
      );
    }
  }, [qtyOpen]);
  const allSelected = allRows.length > 0 && selected.length === allRows.length;
  const indeterminate = selected.length > 0 && !allSelected;

  const computeSelectedQty = (ids) =>
    allRows
      .filter((r) => ids.includes(r.nInventoryId) && r.cStatus === "A")
      .reduce((sum, r) => sum + (r.nQuantity || 0), 0);
  const toggleAll = (e) => {
    e.stopPropagation();
    if (allSelected) {
      setSelected([]);
      onSelectionChange?.(item, computeSelectedQty([]), index, "");
      return;
    }

    // "Select all" only selects rows matching the currently-selected
    // group's receipt number (or the first row's, if none selected yet).
    const distinctReceipts = new Set(
      allRows.map((r) => r.strReceiptNumber || ""),
    );
    if (distinctReceipts.size > 1 && selected.length === 0) {
      flagSelectError(
        null,
        "Multiple Receipt Numbers found — select a row first to choose which batch to include.",
      );
      return;
    }

    const targetReceipt =
      selected.length > 0
        ? allRows.find((r) => r.nInventoryId === selected[0])
            ?.strReceiptNumber || ""
        : allRows[0]?.strReceiptNumber || "";

    const newIds = allRows
      .filter((r) => (r.strReceiptNumber || "") === targetReceipt)
      .map((r) => r.nInventoryId);
    setSelected(newIds);
    onSelectionChange?.(item, computeSelectedQty(newIds), index, targetReceipt);
  };

  const toggleOne = (id) => {
    const row = allRows.find((r) => r.nInventoryId === id);
    const isRemoving = selected.includes(id);

    // Only block when ADDING a row whose receipt number differs from
    // what's already selected — unchecking is always allowed.
    if (!isRemoving && selected.length > 0) {
      const existingRow = allRows.find((r) => r.nInventoryId === selected[0]);
      const sameReceipt =
        (row?.strReceiptNumber || "") === (existingRow?.strReceiptNumber || "");
      if (!sameReceipt) {
        flagSelectError(
          id,
          "Rows with different Receipt No. cannot be selected together.",
        );
        return;
      }
    }

  setSelected((prev) => {
      const newIds = isRemoving ? prev.filter((x) => x !== id) : [...prev, id];
      const receiptNumber = newIds.length > 0 ? (row?.strReceiptNumber || "") : "";
      onSelectionChange?.(item, computeSelectedQty(newIds), index, receiptNumber);
      return newIds;
    });
  
  };
  useEffect(() => {
    const selectedRow = allRows.find((r) => selected.includes(r.nInventoryId));
    onSelectionChange?.(
      item,
      computeSelectedQty(selected),
      index,
      selectedRow?.strReceiptNumber || "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── Displayed qty: sum of selected when open, else itemQty ──────────────────
  const displayedQty =
    qtyOpen && hasOptions
      ? computeSelectedQty(selected)
      : (item.itemQty ?? "—");

  return (
    <Box
      sx={{
        borderBottom: "0.5px solid #f0f4f8",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      {/* Main row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.5,
          py: 1.25,
          background: index % 2 === 0 ? "#fafbff" : "#fff",
        }}
      >
        {/* Index badge */}
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "5px",
            background: "#e8f0fe",
            border: "0.5px solid #c3d3f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{ fontSize: "0.55rem", fontWeight: 700, color: "#1565c0" }}
          >
            {index + 1}
          </Typography>
        </Box>

        {/* Item name */}
        <Typography
          sx={{
            flex: 1,
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {item.itemName || "—"}
        </Typography>

        {/* Qty + UOM — shows selected sum when history is open */}
        <Box
          component={hasOptions ? "button" : "div"}
          onClick={hasOptions ? () => setQtyOpen((v) => !v) : undefined}
          sx={{
            textAlign: "center",
            flexShrink: 0,
            minWidth: 52,
            cursor: hasOptions ? "pointer" : "default",
            background: hasOptions
              ? qtyOpen
                ? "#e8f0fe"
                : "rgba(21,101,192,0.05)"
              : "none",
            border: hasOptions ? "0.5px solid" : "none",
            borderColor: hasOptions
              ? qtyOpen
                ? "#c3d3f8"
                : "rgba(21,101,192,0.2)"
              : "transparent",
            borderRadius: "6px",
            px: hasOptions ? 0.75 : 0,
            py: hasOptions ? 0.4 : 0,
            transition: "all 0.15s",
            "&:hover": hasOptions
              ? { background: "#e8f0fe", borderColor: "#c3d3f8" }
              : {},
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: hasOptions
                ? qtyOpen
                  ? "#1565c0"
                  : "#1976d2"
                : "text.primary",
              lineHeight: 1.2,
            }}
          >
            {displayedQty}
          </Typography>
          {item.itemUOM && (
            <Typography
              sx={{
                fontSize: "0.52rem",
                color: hasOptions ? "#1565c0" : "text.disabled",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.2,
              }}
            >
              {item.itemUOM}
            </Typography>
          )}
        </Box>
        {/* Specs toggle */}
        {hasSpecs || hasSerials ? (
          <Box
            component="button"
            onClick={() => setSpecsOpen((v) => !v)}
            sx={{
              background: "none",
              border: "none",
              cursor: "pointer",
              p: 0.5,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <ArrowDropDownIcon
              sx={{
                fontSize: "1.2rem",
                color: specsOpen ? "#1565c0" : "text.disabled",
                transform: specsOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </Box>
        ) : (
          <Box sx={{ width: 28, flexShrink: 0 }} />
        )}
      </Box>

      {specsOpen && (hasSpecs || hasSerials) && (
        <>
          <Box
            sx={{
              px: 1.5,
              py: 0.4,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#e8f0fe",
              borderBottom: "0.5px solid #c3d3f8",
            }}
          >
            <Typography
              sx={{
                width: "100%",
                textAlign: "center",
                fontSize: "0.55rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              SPECIFICATIONS
            </Typography>
          </Box>
          {hasSpecs && (
            <Box
              sx={{
                px: 2,
                py: 1,
                pl: 5,
                borderTop: "0.5px solid #e0f2fe",
                background: "#f4faff",
                fontSize: "0.6rem",
                color: "text.secondary",
                lineHeight: 1.5,
                "& *": { backgroundColor: "transparent !important" },
                "& ul, & ol": { paddingLeft: "1rem", margin: 0 },
                "& p": { margin: 0 },
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: item.itemSpecs }}
            />
          )}
          {/* Serial numbers from all delivered rows */}
          {(() => {
            // Only show serials for checked delivery rows
            const checkedRowIds = new Set(selected);
            const allSerials = hasOptions
              ? item.options
                  .flatMap((opt) => opt.deliveredRows || [])
                  .filter((row) => checkedRowIds.has(row.nInventoryId))
                  .flatMap((row) => row.serialNumbers || [])
                  .filter(Boolean)
              : [];
            if (allSerials.length === 0) return null;
            return (
              <Box
                sx={{
                  px: 2,
                  py: 0.6,
                  pl: 5,
                  background: "#f4faff",
                  borderTop: "0.5px dashed #bfdbfe",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: "#1565c0",
                    flexShrink: 0,
                    lineHeight: 1.6,
                  }}
                >
                  S/N:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    color: "text.primary",
                    fontWeight: 500,
                    lineHeight: 1.6,
                    wordBreak: "break-all",
                  }}
                >
                  {allSerials.join(", ")}
                </Typography>
              </Box>
            );
          })()}
        </>
      )}

      {/* Qty history panel */}
      {qtyOpen && hasOptions && (
        <Box
          sx={{
            borderTop: "0.5px solid #e8f0fe",
            background: "#f0f6ff",
            // ── left + right padding to visually associate with the qty button ──

            mb: 1,
            borderRadius: "0 0 8px 8px",
            border: "0.5px solid #c3d3f8",

            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.4,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#e8f0fe",
              borderBottom: "0.5px solid #c3d3f8",
            }}
          >
            <Typography
              sx={{
                width: "100%",
                textAlign: "center",
                fontSize: "0.55rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              QUANTITY HISTORY
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.4,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: "#e8f0fe",
              borderBottom: "0.5px solid #c3d3f8",
            }}
          >
            <Typography
              sx={{
                width: 20,
                flexShrink: 0,
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textAlign: "center",
              }}
            >
              #
            </Typography>
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={toggleAll}
              sx={{
                p: 0,
                width: 16,
                height: 16,
                flexShrink: 0,
                color: "#93c5fd",
                "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                  color: "#1565c0",
                },
                "& .MuiSvgIcon-root": { fontSize: "0.85rem" },
              }}
            />
            <Typography
              sx={{
                minWidth: 70,
                flexShrink: 0,
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Receipt No
            </Typography>
            <Typography
              sx={{
                flex: 1,
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Qty Delivered
            </Typography>
            <Typography
              sx={{
                minWidth: 80,
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textAlign: "right",
              }}
            >
              Date
            </Typography>
          </Box>
          {selectError && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                background: "rgba(239,68,68,0.08)",
                borderBottom: "0.5px solid rgba(239,68,68,0.25)",
              }}
            >
              <Typography
                sx={{ fontSize: "0.56rem", fontWeight: 600, color: "#b91c1c" }}
              >
                {selectError}
              </Typography>
            </Box>
          )}
          {/* Rows */}
          {allRows.length === 0 ? (
            <Box sx={{ px: 1.5, py: 0.75 }}>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: "text.disabled",
                  fontStyle: "italic",
                }}
              >
                No delivery records.
              </Typography>
            </Box>
          ) : (
            allRows.map((row, rowIdx) => {
              const isChecked = selected.includes(row.nInventoryId);
              const rowSerials = (row.serialNumbers || []).filter(Boolean);
              return (
                <Box
                  key={row.nInventoryId}
                  sx={{
                    background:
                      row.cStatus === "C"
                        ? "rgba(239,68,68,0.04)"
                        : isChecked
                          ? "rgba(21,101,192,0.04)"
                          : rowIdx % 2 === 0
                            ? "#f0f6ff"
                            : "#f7faff",
                    opacity: row.cStatus === "C" ? 0.6 : 1,
                    borderBottom: "0.5px solid #dbeafe",
                    "&:last-of-type": { borderBottom: "none" },
                    animation:
                      shakeRowId === row.nInventoryId
                        ? "drRowShake 0.3s ease"
                        : "none",
                  }}
                >
                  <Box
                    onClick={() => toggleOne(row.nInventoryId)}
                    sx={{
                      px: 1.5,
                      py: 0.55,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    <Typography
                      sx={{
                        width: 20,
                        flexShrink: 0,
                        fontSize: "0.55rem",
                        fontWeight: 600,
                        color: "text.disabled",
                        textAlign: "center",
                      }}
                    >
                      {rowIdx + 1}
                    </Typography>
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleOne(row.nInventoryId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        p: 0,
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        color: "#93c5fd",
                        "&.Mui-checked": { color: "#1565c0" },
                        "& .MuiSvgIcon-root": { fontSize: "0.85rem" },
                      }}
                    />
                    <Typography
                      sx={{
                        minWidth: 70,
                        flexShrink: 0,
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        color: isChecked ? "#1565c0" : "text.secondary",
                        wordBreak: "break-word",
                      }}
                    >
                      {row.strReceiptNumber || "—"}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          background: isChecked ? "#dcfce7" : "#f0fdf4",
                          border: `0.5px solid ${isChecked ? "#86efac" : "#bbf7d0"}`,
                          borderRadius: "5px",
                          px: 0.75,
                          py: 0.2,
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: 0.4,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color: "#15803d",
                            lineHeight: 1.2,
                          }}
                        >
                          {row.nQuantity}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.48rem",
                            color: "#15803d",
                            textTransform: "uppercase",
                            lineHeight: 1,
                          }}
                        >
                          {row.uom}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        minWidth: 80,
                        fontSize: "0.58rem",
                        color: isChecked ? "#1565c0" : "text.secondary",
                        textAlign: "right",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        fontWeight: isChecked ? 600 : 400,
                      }}
                    >
                      {row.dtLog
                        ? new Date(row.dtLog).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </Typography>
                    <Box
                      component="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowStatus(row);
                      }}
                      disabled={statusUpdatingId === row.nInventoryId}
                      sx={{
                        ml: 0.75,
                        flexShrink: 0,
                        fontSize: "0.52rem",
                        fontWeight: 700,
                        px: 0.75,
                        py: 0.3,
                        borderRadius: "5px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        border: "none",
                        color: row.cStatus === "C" ? "#15803d" : "#dc2626",
                        background: row.cStatus === "C" ? "#F0FDF4" : "#FEF2F2",
                        boxShadow: `inset 0 0 0 0.5px ${row.cStatus === "C" ? "#86EFAC" : "#fecaca"}`,
                        opacity:
                          statusUpdatingId === row.nInventoryId ? 0.6 : 1,
                      }}
                    >
                      {statusUpdatingId === row.nInventoryId
                        ? "..."
                        : row.cStatus === "C"
                          ? "Re-activate"
                          : "Cancel"}
                    </Box>
                  </Box>

                  {/* Per-row serial numbers */}
                  {rowSerials.length > 0 && (
                    <Box
                      sx={{
                        px: 1.5,
                        pb: 0.6,
                        pl: 5.5,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.52rem",
                          fontWeight: 700,
                          color: "#1565c0",
                          flexShrink: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        S/N:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.52rem",
                          color: "text.secondary",
                          fontWeight: 500,
                          lineHeight: 1.5,
                          wordBreak: "break-all",
                        }}
                      >
                        {rowSerials.join(", ")}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
}

// ── PrintDeliveryReceiptModal ─────────────────────────────────────────────────
export default function PrintDeliveryReceiptModal({
  open,
  onClose,
  transaction,
  deliveredOptions = [],
  assignedAOName,
  assignedAONo,
  transactionCode,
  currentUserId, // ← ADD
  receivedKey, // ← ADD
  deliveredKey, // ← ADD
  paidKey, // ← ADD
  onStatusToggled, // ← ADD
}) {
const [itemQtyOverrides, setItemQtyOverrides] = useState({});
const [itemReceiptOverrides, setItemReceiptOverrides] = useState({});
const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const PRINT_CONFIRM_STYLE = {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <PrintOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Print Delivery Receipt?",
    desc: "This will open the print view for this delivery receipt.",
    confirmLabel: "Yes, Print",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  };
const handleSelectionChange = (item, selectedQty, index, receiptNumber) => {
  setItemQtyOverrides((prev) => ({
    ...prev,
    [index]: selectedQty,
  }));
  setItemReceiptOverrides((prev) => ({
    ...prev,
    [index]: receiptNumber,
  }));
};
  if (!open || !transaction) return null;

  const hasZeroQtyItem = deliveredOptions.some((item, index) => {
    const qty =
      itemQtyOverrides[index] !== undefined
        ? itemQtyOverrides[index]
        : item.itemQty;
    return qty === 0;
  });
  if (!open || !transaction) return null;
  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      handlePrint();
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };
const handlePrint = () => {
  // Merge qty + receipt overrides into the items before printing
  const itemsWithOverrides = deliveredOptions.map((item, index) => ({
    ...item,
    itemQty:
      itemQtyOverrides[index] !== undefined
        ? itemQtyOverrides[index]
        : item.itemQty,
    strReceiptNumber:
      itemReceiptOverrides[index] || item.strReceiptNumber || "",
  }));

const receiptNumber =
  itemsWithOverrides.find((it) => it.strReceiptNumber)?.strReceiptNumber ?? "";

const payload = JSON.stringify({
  transaction,
  deliveredOptions: itemsWithOverrides,
  assignedAOName,
  assignedAONo,
  transactionCode,
  receiptNumber, // guaranteed to be a string, never undefined
});
  sessionStorage.setItem("printDR_data", payload);
  setTimeout(() => {
    printRoute("/print-dr");
  }, 50);
};

  const deliveryInfo =
    transaction?.deliveryInfo || transaction?.delivery_info || null;
  const deliveryDate =
    deliveryInfo?.dtDeliveryDate || transaction?.dtDeliveryDate || null;
  const deliveryAddress =
    deliveryInfo?.strDeliveryAddress || transaction?.strDeliveryAddress || null;
  const deliveryNotes =
    deliveryInfo?.strDeliveryNotes || transaction?.strDeliveryNotes || null;
  const receiverName =
    deliveryInfo?.strReceiverName || transaction?.strReceiverName || null;
  const hasDeliveryDetails =
    deliveryDate || deliveryAddress || receiverName || deliveryNotes;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Delivery Receipt"
      subTitle={transactionCode ? `/ ${transactionCode}` : ""}
      contentPadding={0}
      showSave={!confirmAction}
      saveLabel="Print"
      onSave={() => setConfirmAction("print")}
      disabled={deliveredOptions.length === 0 || hasZeroQtyItem}
      showCancel={true}
      cancelLabel={confirmAction ? "Back" : "Cancel"}
      onCancel={confirmAction ? () => setConfirmAction(null) : onClose}
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {confirmAction ? (
          <ConfirmationDialog
            style={PRINT_CONFIRM_STYLE}
            voucherNumber={transactionCode}
            loading={confirmLoading}
            onConfirm={handleConfirm}
            onBack={() => setConfirmAction(null)}
          />
        ) : (
          /* ── Body ── */
          <Box sx={{ px: 2.5, py: 1.5 }}>
            {/* Client info */}
            {(() => {
              const client = transaction?.client;
              if (!client) return null;
              const name = client.strClientNickName || client.strClientName;
              const tin = client.strTIN;
              const address = client.strAddress;
              const style = client.strBusinessStyle;
              if (!name && !tin && !address && !style) return null;
              return (
                <>
                  <Box
                    sx={{
                      borderRadius: "8px",
                      border: "0.5px solid #e2e8f0",
                      background: "#fafbff",
                      px: 1.5,
                      py: 1,
                      mb: 2,
                    }}
                  >
                    <InfoRow
                      icon={ReceiptLongOutlined}
                      label="Transaction"
                      value={
                        transaction?.strTitle
                          ? `${transactionCode} | ${transaction.strTitle}`
                          : transactionCode
                      }
                    />
                    {name && (
                      <InfoRow
                        icon={PersonOutlined}
                        label="Client"
                        value={name.toUpperCase()}
                      />
                    )}
                    {tin && (
                      <InfoRow
                        icon={ReceiptLongOutlined}
                        label="TIN"
                        value={tin}
                      />
                    )}
                    {address && (
                      <InfoRow
                        icon={LocalShippingOutlined}
                        label="Address"
                        value={address}
                      />
                    )}
                    {style && (
                      <InfoRow
                        icon={StorefrontOutlined}
                        label="Business Style"
                        value={style}
                      />
                    )}
                    <InfoRow
                      icon={PersonOutlined}
                      label="Account Officer"
                      value={assignedAOName}
                    />
                  </Box>
                </>
              );
            })()}

            {/* Delivery details */}
            {hasDeliveryDetails && (
              <>
                <SectionHeader label="Delivery Details" />
                <Box
                  sx={{
                    borderRadius: "8px",
                    border: "0.5px solid #e2e8f0",
                    background: "#fafbff",
                    px: 1.5,
                    py: 1,
                    mb: 2,
                  }}
                >
                  {deliveryDate && (
                    <InfoRow
                      icon={CalendarTodayOutlined}
                      label="Delivery Date"
                      value={fmtDate(deliveryDate)}
                    />
                  )}
                  {receiverName && (
                    <InfoRow
                      icon={PersonOutlined}
                      label="Receiver"
                      value={receiverName}
                    />
                  )}
                  {deliveryAddress && (
                    <InfoRow
                      icon={LocalShippingOutlined}
                      label="Address"
                      value={deliveryAddress}
                    />
                  )}
                  {deliveryNotes && (
                    <InfoRow
                      icon={ReceiptLongOutlined}
                      label="Notes"
                      value={deliveryNotes}
                    />
                  )}
                </Box>
              </>
            )}

            {/* Delivered items */}
            <SectionHeader
              label={`Delivered Items (${deliveredOptions.length})`}
            />
            {deliveredOptions.length === 0 ? (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: "0.5px solid #e2e8f0",
                  background: "#fafbff",
                  px: 2,
                  py: 3,
                  textAlign: "center",
                }}
              >
                <LocalShippingOutlined
                  sx={{ fontSize: "1.5rem", color: "#cbd5e1", mb: 0.5 }}
                />
                <Typography
                  sx={{ fontSize: "0.65rem", color: "text.disabled" }}
                >
                  No delivered items found for this transaction.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: "0.5px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                {/* Table header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 0.75,
                    background: "#f1f5f9",
                    borderBottom: "0.5px solid #e2e8f0",
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Item / Specifications
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      mr: 7,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      textAlign: "right",
                      minWidth: 52,
                    }}
                  >
                    Qty
                  </Typography>
                </Box>
                {deliveredOptions.map((item, i) => (
                  <ItemRow
                    key={i}
                    item={item}
                    index={i}
                    onSelectionChange={handleSelectionChange}
                    currentUserId={currentUserId}
                    receivedKey={receivedKey}
                    deliveredKey={deliveredKey}
                    paidKey={paidKey}
                    onStatusToggled={onStatusToggled}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}{" "}
        {/* end confirmAction ternary */}
      </Box>
    </ModalContainer>
  );
}
