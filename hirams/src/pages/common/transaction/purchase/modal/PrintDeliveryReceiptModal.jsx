import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import InventoryAPI from "../../../../../api/endpoints/inventory.api.js";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import ConfirmationStructure from "../../../../../components/structure/ConfirmationStructure.jsx";
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
import { fmtDate } from "../../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  divider: c.slate.border,
  dividerFaint: c.slate.divider,
  rowBorder: c.slate.borderRow,
  rowAltBg: c.slate.stripeAltBg,
  badgeBg: c.slate.hover,
  badgeBorder: c.slate.borderLight,
  badgeText: c.slate.mutedText,
  textStrong: c.gray.textPrimary,
  textMed: c.gray.label,
  textFaint: c.gray.textDisabled,
  textMuted: c.gray.textSecondary,
  hoverBg: c.slate.hover,
  toggleActiveBg: c.slate.mutedBg,
  checkboxUnchecked: c.slate.scrollbarThumb,
  checkboxChecked: c.gray.label,
  checkedRowBg: c.blue.bgSoft,
  disabledRowBg: c.slate.hover,
  cancelBtnBorder: c.slate.btnBorder,
  cancelBtnText: c.gray.label,
  cancelBtnHoverBg: c.slate.btnHoverBg,
  panelBg: c.slate.innerBg,
  panelBorder: c.slate.border,
  tableHeaderBg: c.slate.itemHeaderBg,
  emptyIconColor: c.slate.scrollbarThumb,
  successColor: c.green.text,
  successBorder: c.green.border,
  successDot: c.green.text,
  textDisabled: c.gray.textDisabled,
});

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

function InfoRow({ icon: Icon, label, value, fullWidth = false }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  return (
    <Box
      sx={{
        gridColumn: fullWidth ? "1 / -1" : "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: 0.75,
        py: 0.5,
      }}
    >
      <Icon
        sx={{
          fontSize: "0.7rem",
          color: c.textDisabled,
          mt: "3px",
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.55rem",
            fontWeight: 700,
            color: c.textDisabled,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            lineHeight: 1.2,
            mb: 0.15,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: c.textStrong,
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {value || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

function SectionHeader({ label }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, mt: 0.5 }}>
      <Typography
        sx={{
          fontSize: "0.58rem",
          fontWeight: 700,
          color: c.textDisabled,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: "0.5px", background: c.divider }} />
    </Box>
  );
}

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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

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
  const selectableRows = allRows.filter((r) => r.cStatus === "A");

  const extractReceiptNum = (str) => {
    if (!str) return -Infinity;
    const digits = String(str).replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : -Infinity;
  };

  const defaultSelectedIds = (() => {
    if (selectableRows.length === 0) return [];
    const maxReceiptNum = Math.max(
      ...selectableRows.map((r) => extractReceiptNum(r.strReceiptNumber)),
    );
    return selectableRows
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
    const newStatus = "C";
    setStatusUpdatingId(row.nInventoryId);
    try {
      await InventoryAPI.updateInventory(row.nInventoryId, {
        cStatus: newStatus,
      });
      if (row.nPurchaseOrderId) {
        await PurchaseOrderAPI.syncStatus({
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

  const allSelected =
    selectableRows.length > 0 && selected.length === selectableRows.length;
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
    const distinctReceipts = new Set(
      selectableRows.map((r) => r.strReceiptNumber || ""),
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
        : selectableRows[0]?.strReceiptNumber || "";
    const newIds = selectableRows
      .filter((r) => (r.strReceiptNumber || "") === targetReceipt)
      .map((r) => r.nInventoryId);
    setSelected(newIds);
    onSelectionChange?.(item, computeSelectedQty(newIds), index, targetReceipt);
  };

  const toggleOne = (id) => {
    const row = allRows.find((r) => r.nInventoryId === id);
    if (!row || row.cStatus !== "A") return;
    const isRemoving = selected.includes(id);
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
      const receiptNumber =
        newIds.length > 0 ? row?.strReceiptNumber || "" : "";
      onSelectionChange?.(
        item,
        computeSelectedQty(newIds),
        index,
        receiptNumber,
      );
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

  const displayedQty =
    qtyOpen && hasOptions
      ? computeSelectedQty(selected)
      : (item.itemQty ?? "—");

  return (
    <Box
      sx={{
        borderBottom: `0.5px solid ${c.rowBorder}`,
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.5,
          py: 1.1,
          background:
            index % 2 === 0 ? c.rowAltBg : isDark ? "transparent" : "#fff",
        }}
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "5px",
            background: c.badgeBg,
            border: `0.5px solid ${c.badgeBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{ fontSize: "0.55rem", fontWeight: 700, color: c.badgeText }}
          >
            {index + 1}
          </Typography>
        </Box>
        <Typography
          sx={{
            flex: 1,
            fontSize: "0.7rem",
            fontWeight: 600,
            color: c.textStrong,
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {item.itemName || "—"}
        </Typography>
        <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: c.textMed,
              lineHeight: 1.2,
            }}
          >
            {displayedQty}
          </Typography>
          {item.itemUOM && (
            <Typography
              sx={{
                fontSize: "0.5rem",
                color: c.textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.2,
              }}
            >
              {item.itemUOM}
            </Typography>
          )}
        </Box>
      </Box>

      {(hasSpecs || hasSerials) && (
        <Box
          component="button"
          onClick={() => setSpecsOpen((v) => !v)}
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.6,
            background: specsOpen ? c.toggleActiveBg : "transparent",
            border: "none",
            borderTop: `0.5px solid ${c.dividerFaint}`,
            cursor: "pointer",
            textAlign: "left",
            "&:hover": { background: c.hoverBg },
          }}
        >
          <Typography
            sx={{
              fontSize: "0.58rem",
              fontWeight: 700,
              color: c.badgeText,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Specifications
          </Typography>
          <ArrowDropDownIcon
            sx={{
              fontSize: "1.1rem",
              color: c.textFaint,
              transform: specsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      )}

      {specsOpen && (hasSpecs || hasSerials) && (
        <Box
          sx={{
            background: c.rowAltBg,
            borderTop: `0.5px solid ${c.dividerFaint}`,
          }}
        >
          {hasSpecs && (
            <Box
              sx={{
                px: 2,
                py: 1,
                pl: 3.5,
                fontSize: "0.6rem",
                color: c.textMuted,
                lineHeight: 1.5,
                "& *": { backgroundColor: "transparent !important" },
                "& ul, & ol": { paddingLeft: "1rem", margin: 0 },
                "& p": { margin: 0 },
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: item.itemSpecs }}
            />
          )}
          {(() => {
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
                  pl: 3.5,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.5,
                  flexWrap: "wrap",
                  borderTop: hasSpecs
                    ? `0.5px dashed ${c.badgeBorder}`
                    : "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: c.badgeText,
                    flexShrink: 0,
                    lineHeight: 1.6,
                  }}
                >
                  S/N:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    color: c.textMed,
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
        </Box>
      )}

      {hasOptions && (
        <Box
          component="button"
          onClick={() => setQtyOpen((v) => !v)}
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.6,
            background: qtyOpen ? c.toggleActiveBg : "transparent",
            border: "none",
            borderTop: `0.5px solid ${c.dividerFaint}`,
            cursor: "pointer",
            textAlign: "left",
            "&:hover": { background: c.hoverBg },
          }}
        >
          <Typography
            sx={{
              fontSize: "0.58rem",
              fontWeight: 700,
              color: c.badgeText,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Quantity History
          </Typography>
          <ArrowDropDownIcon
            sx={{
              fontSize: "1.1rem",
              color: c.textFaint,
              transform: qtyOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      )}

      {qtyOpen && hasOptions && (
        <Box
          sx={{
            borderTop: `0.5px solid ${c.dividerFaint}`,
            background: c.rowAltBg,
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: `0.5px solid ${c.badgeBorder}`,
            }}
          >
            <Typography
              sx={{
                width: 20,
                flexShrink: 0,
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textFaint,
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
                color: c.checkboxUnchecked,
                "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                  color: c.checkboxChecked,
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
                color: c.textFaint,
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
                color: c.textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Qty
            </Typography>
            <Typography
              sx={{
                minWidth: 80,
                fontSize: "0.5rem",
                fontWeight: 700,
                color: c.textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textAlign: "right",
              }}
            >
              Date
            </Typography>
            <Box sx={{ width: 66, flexShrink: 0, ml: 0.75 }} />
          </Box>

          {selectError && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                background: c.badgeBg,
                borderBottom: `0.5px solid ${c.badgeBorder}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.56rem",
                  fontWeight: 600,
                  color: c.badgeText,
                }}
              >
                {selectError}
              </Typography>
            </Box>
          )}

          {allRows.length === 0 ? (
            <Box sx={{ px: 1.5, py: 0.75 }}>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: c.textFaint,
                  fontStyle: "italic",
                }}
              >
                No delivery records.
              </Typography>
            </Box>
          ) : (
            allRows.map((row, rowIdx) => {
              const isActive = row.cStatus === "A";
              const isPending = row.cStatus === "P";
              const isChecked = selected.includes(row.nInventoryId);
              const rowSerials = (row.serialNumbers || []).filter(Boolean);
              const isDisabledRow = !isActive;
              return (
                <Box
                  key={row.nInventoryId}
                  sx={{
                    background: isDisabledRow
                      ? c.disabledRowBg
                      : isChecked
                        ? c.checkedRowBg
                        : rowIdx % 2 === 0
                          ? c.rowAltBg
                          : isDark
                            ? "transparent"
                            : "#fff",
                    opacity: isDisabledRow ? 0.6 : 1,
                    borderBottom: `0.5px solid ${c.rowBorder}`,
                    "&:last-of-type": { borderBottom: "none" },
                    animation:
                      shakeRowId === row.nInventoryId
                        ? "drRowShake 0.3s ease"
                        : "none",
                  }}
                >
                  <Box
                    onClick={() => {
                      if (!isDisabledRow) toggleOne(row.nInventoryId);
                    }}
                    sx={{
                      px: 1.5,
                      py: 0.55,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: isDisabledRow ? "default" : "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    <Typography
                      sx={{
                        width: 20,
                        flexShrink: 0,
                        fontSize: "0.55rem",
                        fontWeight: 600,
                        color: c.textFaint,
                        textAlign: "center",
                      }}
                    >
                      {rowIdx + 1}
                    </Typography>
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      disabled={isDisabledRow}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (!isDisabledRow) toggleOne(row.nInventoryId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        p: 0,
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        color: c.checkboxUnchecked,
                        "&.Mui-checked": { color: c.checkboxChecked },
                        "& .MuiSvgIcon-root": { fontSize: "0.85rem" },
                      }}
                    />
                    <Typography
                      sx={{
                        minWidth: 70,
                        flexShrink: 0,
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        color: isChecked ? c.textStrong : c.badgeText,
                        wordBreak: "break-word",
                      }}
                    >
                      {row.strReceiptNumber || "—"}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "baseline",
                        gap: 0.4,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: c.textMed,
                          lineHeight: 1.2,
                        }}
                      >
                        {row.nQuantity}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.48rem",
                          color: c.textFaint,
                          textTransform: "uppercase",
                          lineHeight: 1,
                        }}
                      >
                        {row.uom}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        minWidth: 80,
                        fontSize: "0.58rem",
                        color: c.badgeText,
                        textAlign: "right",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
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
                      sx={{
                        ml: 0.75,
                        flexShrink: 0,
                        minWidth: 66,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {isActive ? (
                        <Box
                          component="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowStatus(row);
                          }}
                          disabled={statusUpdatingId === row.nInventoryId}
                          sx={{
                            fontSize: "0.52rem",
                            fontWeight: 700,
                            px: 0.75,
                            py: 0.3,
                            borderRadius: "5px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            border: `0.5px solid ${c.cancelBtnBorder}`,
                            color: c.cancelBtnText,
                            background: isDark ? "transparent" : "#fff",
                            opacity:
                              statusUpdatingId === row.nInventoryId ? 0.6 : 1,
                            "&:hover": { background: c.cancelBtnHoverBg },
                          }}
                        >
                          {statusUpdatingId === row.nInventoryId
                            ? "..."
                            : "Cancel"}
                        </Box>
                      ) : (
                        <Typography
                          sx={{
                            fontSize: "0.52rem",
                            fontWeight: 700,
                            color: c.textFaint,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {isPending ? "Pending" : "Cancelled"}
                        </Typography>
                      )}
                    </Box>
                  </Box>
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
                          color: c.badgeText,
                          flexShrink: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        S/N:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.52rem",
                          color: c.badgeText,
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

export default function PrintDeliveryReceiptModal({
  open,
  onClose,
  transaction,
  deliveredOptions = [],
  assignedAOName,
  assignedAONo,
  transactionCode,
  currentUserId,
  receivedKey,
  deliveredKey,
  paidKey,
  onStatusToggled,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => useColors(base), [base]);

  const [itemQtyOverrides, setItemQtyOverrides] = useState({});
  const [itemReceiptOverrides, setItemReceiptOverrides] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const PRINT_CONFIRM_STYLE = {
    color: c.successColor,
    bg: isDark
      ? "linear-gradient(135deg, rgba(21,128,61,0.18) 0%, rgba(34,197,94,0.12) 100%)"
      : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: c.successBorder,
    dotColor: c.successDot,
    icon: <PrintOutlined sx={{ fontSize: "1.4rem", color: c.successColor }} />,
    title: "Print Delivery Receipt?",
    desc: "This will open the print view for this delivery receipt.",
    confirmLabel: "Yes, Print",
    confirmBg: isDark
      ? "linear-gradient(135deg, #166534 0%, #14532d 100%)"
      : "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  };

  const handleSelectionChange = (item, selectedQty, index, receiptNumber) => {
    setItemQtyOverrides((prev) => ({ ...prev, [index]: selectedQty }));
    setItemReceiptOverrides((prev) => ({ ...prev, [index]: receiptNumber }));
  };

  if (!open || !transaction) return null;

  const hasZeroQtyItem = deliveredOptions.some((item, index) => {
    const qty =
      itemQtyOverrides[index] !== undefined
        ? itemQtyOverrides[index]
        : item.itemQty;
    return qty === 0;
  });

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
      itemsWithOverrides.find((it) => it.strReceiptNumber)?.strReceiptNumber ??
      "";
    const payload = JSON.stringify({
      transaction,
      deliveredOptions: itemsWithOverrides,
      assignedAOName,
      assignedAONo,
      transactionCode,
      receiptNumber,
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
      subTitle={transactionCode ? `${transactionCode}` : ""}
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
          <ConfirmationStructure
            style={PRINT_CONFIRM_STYLE}
            voucherNumber={transactionCode}
            loading={confirmLoading}
            onConfirm={handleConfirm}
            onBack={() => setConfirmAction(null)}
          />
        ) : (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            {(() => {
              const client = transaction?.client;
              if (!client) return null;
              const name = client.strClientNickName || client.strClientName;
              const tin = client.strTIN;
              const address = client.strAddress;
              const style = client.strBusinessStyle;
              if (!name && !tin && !address && !style) return null;
              return (
                <Box
                  sx={{
                    borderRadius: "8px",
                    border: `0.5px solid ${c.panelBorder}`,
                    background: c.panelBg,
                    px: 1.5,
                    py: 1,
                    mb: 2,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: 2,
                    rowGap: 0,
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
                    fullWidth
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
                    fullWidth
                  />
                </Box>
              );
            })()}

            {hasDeliveryDetails && (
              <>
                <SectionHeader label="Delivery Details" />
                <Box
                  sx={{
                    borderRadius: "8px",
                    border: `0.5px solid ${c.panelBorder}`,
                    background: c.panelBg,
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

            <SectionHeader
              label={`Delivered Items (${deliveredOptions.length})`}
            />
            {deliveredOptions.length === 0 ? (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: `0.5px solid ${c.panelBorder}`,
                  background: c.panelBg,
                  px: 2,
                  py: 3,
                  textAlign: "center",
                }}
              >
                <LocalShippingOutlined
                  sx={{ fontSize: "1.5rem", color: c.emptyIconColor, mb: 0.5 }}
                />
                <Typography sx={{ fontSize: "0.65rem", color: c.textDisabled }}>
                  No delivered items found for this transaction.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: `0.5px solid ${c.panelBorder}`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    background: c.tableHeaderBg,
                    borderBottom: `0.5px solid ${c.panelBorder}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      color: c.textDisabled,
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
                      color: c.textDisabled,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      textAlign: "right",
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
        )}
      </Box>
    </ModalContainer>
  );
}
