// VoucherUpdateModal.jsx
import { useState, useEffect } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import {
  ReceiptLongOutlined,
  BadgeOutlined,
  LocationOnOutlined,
  AccessTimeOutlined,
  DeleteOutlineOutlined,
  StoreOutlined,
  Inventory2Outlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AddOutlined,
  ArrowBackOutlined,
  PersonOutlined,
  EditOutlined, // ← ADD THIS
  PrintOutlined, // ← ADD
  LockOutlined,
  CloseOutlined, // ← ADD
} from "@mui/icons-material";
import api from "../../../../../utils/api/api.js";
import { CircularProgress } from "@mui/material";
import { PersonAdd, PersonSearch } from "@mui/icons-material";
import BaseButton from "../../../../../components/common/BaseButton.jsx";
import MiniBaseButton from "../../../../../components/common/MiniBaseButton.jsx";
import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog.jsx";
import { showSwal } from "../../../../../utils/helpers/swal.jsx";
import { VoucherUpdateModalSkeleton } from "../../../../../components/helper/Skeleton.jsx";
import { printRoute } from "../../../../../utils/helpers/printRoute.js";
// ── Helpers ───────────────────────────────────────────────────────────────────

export const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
};

const fmtPHP = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ children, onAddItem }) => (
  <Box
    sx={{
      px: 2,
      pt: 1,
      pb: 0.5,
      display: "flex",
      alignItems: "center",
      gap: 0.75,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "text.disabled",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Typography>
    <Box sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }} />

    {/* Add Item button */}
    {onAddItem && (
      <Box
        onClick={onAddItem}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.35,
          px: 0.75,
          py: 0.3,
          borderRadius: "5px",
          background: "#EFF6FF",
          border: "0.5px solid #BFDBFE",
          cursor: "pointer",
          flexShrink: 0,
          transition: "all 0.15s",
          "&:hover": {
            background: "#DBEAFE",
            borderColor: "#93C5FD",
          },
          "&:active": {
            background: "#BFDBFE",
          },
        }}
      >
        <AddOutlined sx={{ fontSize: "0.6rem", color: "#3B82F6" }} />
        <Typography
          sx={{
            fontSize: "0.55rem",
            fontWeight: 700,
            color: "#3B82F6",
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Add Item
        </Typography>
      </Box>
    )}
  </Box>
);

// ── Add Item View ─────────────────────────────────────────────────────────────
const ADD_VIEW = {
  SEARCH: "SEARCH",
  VOUCHER_FORM: "VOUCHER_FORM",
};

const initialVoucherForm = { particular: "", amount: "" };
const initialAddForm = { particular: "", amount: "" };

const AddItemView = ({
  isAssigneeType,
  voucher,
  firstAssignee,
  editingAssignee,
  formData, // ← ADD THIS
  setFormData, // ← ADD THIS
  formErrors, // ← ADD THIS
  onSuccess,
  onBack,
  onSave,
  isSaving,
  voucherActiveKey,
  voucherClosedKey,
}) => {
  // ── Supplier state ────────────────────────────────────────────────────────
  const [availablePOs, setAvailablePOs] = useState([]);
  const [posLoading, setPosLoading] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [linking, setLinking] = useState(false);

  // ── Fetch available POs for supplier type ─────────────────────────────────
  useEffect(() => {
    if (isAssigneeType) return;

    const supplierId = voucher?.nTypeId;
    if (!supplierId) {
      setAvailablePOs([]);
      return;
    }

    const load = async () => {
      setPosLoading(true);
      try {
        const [poRes, vRes] = await Promise.all([
          api.get(`purchase-orders/by-supplier?nSupplierId=${supplierId}`),
          api.get("vouchers"),
        ]);

        const all = Array.isArray(poRes) ? poRes : (poRes.data ?? []);
        const vouchers = Array.isArray(vRes) ? vRes : (vRes.data ?? []);

        // Build set of PO IDs already covered by ANY active or closed voucher
        const vouchedPOIds = new Set();
        vouchers.forEach((v) => {
          const isActiveOrClosed =
            String(v.cStatus) === String(voucherActiveKey) ||
            String(v.cStatus) === String(voucherClosedKey);
          if (isActiveOrClosed) {
            (v.voucher_suppliers ?? []).forEach((vs) => {
              vouchedPOIds.add(vs.nPurchaseOrderId);
            });
          }
        });

        // Also collect IDs already linked to THIS voucher
        const linkedIds = new Set(
          (voucher.voucher_suppliers ?? []).map((s) => s.nPurchaseOrderId),
        );

        setAvailablePOs(
          all.filter(
            (po) =>
              !linkedIds.has(po.nPurchaseOrderId) &&
              !vouchedPOIds.has(po.nPurchaseOrderId),
          ),
        );
      } catch (err) {
        console.error("Failed to fetch POs:", err);
        setAvailablePOs([]);
      } finally {
        setPosLoading(false);
      }
    };
    load();
  }, [isAssigneeType, voucher, voucherActiveKey, voucherClosedKey]);
  useEffect(() => {
    if (editingAssignee) {
      setFormData({
        particular: editingAssignee.strParticular,
        amount: editingAssignee.dAmount,
      });
    } else {
      setFormData({ particular: "", amount: "" });
    }
  }, [editingAssignee, setFormData]);
  const handleLinkPO = async (po) => {
    setLinking(true);
    setSelectedPO(po.nPurchaseOrderId);
    try {
      await api.post(`voucher-suppliers`, {
        nVoucherId: voucher.nVoucherId,
        nPurchaseOrderId: po.nPurchaseOrderId,
      });
      await onSuccess();
      onBack();
    } catch (err) {
      console.error("Failed to link PO:", err);
    } finally {
      setLinking(false);
      setSelectedPO(null);
    }
  };

  // ── Assignee form ─────────────────────────────────────────────────────────
  if (isAssigneeType) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", px: 1.5, py: 1 }}>
        {/* Particular */}
        <Box sx={{ mb: 1 }}>
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 600,
              color: "#374151",
              mb: 0.4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Particular
          </Typography>
          <Box
            component="input"
            placeholder="e.g. Office supplies"
            value={formData.particular} // ← CORRECT
            onChange={(e) =>
              setFormData((p) => ({ ...p, particular: e.target.value }))
            }
            sx={{
              width: "100%",
              px: 1.25,
              py: 0.875,
              fontSize: "0.75rem",
              border: `0.5px solid ${formErrors.particular ? "#EF4444" : "#D1D5DB"}`, // ← CORRECT

              borderRadius: "8px",
              outline: "none",
              fontFamily: "inherit",
              color: "#111827",
              background: "#FAFAFA",
              boxSizing: "border-box",
              "&:focus": { borderColor: "#93C5FD", background: "#fff" },
            }}
          />
          {formErrors.particular && (
            <Typography sx={{ fontSize: "0.58rem", color: "#EF4444", mt: 0.3 }}>
              {formErrors.particular} // ← CORRECT
            </Typography>
          )}
        </Box>

        {/* Amount */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 600,
              color: "#374151",
              mb: 0.4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Amount
          </Typography>
          <Box sx={{ position: "relative" }}>
            <Typography
              sx={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.72rem",
                color: "#6B7280",
                pointerEvents: "none",
              }}
            >
              ₱
            </Typography>
            <Box
              component="input"
              type="number"
              placeholder="0.00"
              value={formData.amount} // ← CORRECT
              onChange={(e) =>
                setFormData((p) => ({ ...p, amount: e.target.value }))
              }
              sx={{
                width: "100%",
                pl: 2.5,
                pr: 1.25,
                py: 0.875,
                fontSize: "0.75rem",
                border: `0.5px solid ${formErrors.amount ? "#EF4444" : "#D1D5DB"}`, // ← CORRECT
                borderRadius: "8px",
                outline: "none",
                fontFamily: "inherit",
                color: "#111827",
                background: "#FAFAFA",
                boxSizing: "border-box",
                "&:focus": { borderColor: "#93C5FD", background: "#fff" },
              }}
            />
          </Box>
          {formErrors.amount && ( // ← CORRECT
            <Typography sx={{ fontSize: "0.58rem", color: "#EF4444", mt: 0.3 }}>
              {formErrors.amount} // ← CORRECT
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // ── Supplier: PO picker ───────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Section label */}
      <Box
        sx={{
          px: 2,
          pt: 1,
          pb: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "text.disabled",
            whiteSpace: "nowrap",
          }}
        >
          Available Purchase Orders
        </Typography>
        <Box sx={{ flex: 1, height: "0.5px", background: "#E5E7EB" }} />
      </Box>

      <Box
        sx={{
          mx: 1.5,
          mb: 1.5,
          borderRadius: "10px",
          border: "0.5px solid #E5E7EB",
          overflow: "hidden",
          maxHeight: 340,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 3 },
          "&::-webkit-scrollbar-thumb": {
            background: "#D1D5DB",
            borderRadius: 2,
          },
        }}
      >
        {posLoading ? (
          <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={18} />
          </Box>
        ) : availablePOs.length === 0 ? (
          <Box
            sx={{
              px: 2,
              py: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF" }}>
              No available purchase orders for this supplier.
            </Typography>
          </Box>
        ) : (
          availablePOs.map((po, idx) => {
            const options = po.purchase_order_options ?? [];
            const poTotal = options.reduce((sum, opt) => {
              const p = opt.purchase_option;
              return sum + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
            }, 0);
            const isLinking = linking && selectedPO === po.nPurchaseOrderId;

            return (
              <Box
                key={po.nPurchaseOrderId}
                sx={{
                  px: 1.5,
                  py: 0.875,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom:
                    idx < availablePOs.length - 1
                      ? "0.5px solid #F3F4F6"
                      : "none",
                  "&:hover": { background: "#F9FAFB" },
                  transition: "background 0.15s",
                }}
              >
                {/* PO icon */}
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "7px",
                    background: "#EFF6FF",
                    border: "0.5px solid #BFDBFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ReceiptLongOutlined
                    sx={{ fontSize: "0.85rem", color: "#3B82F6" }}
                  />
                </Box>

                {/* PO info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#111827",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {po.strPurchaseOrderNo ?? `PO #${po.nPurchaseOrderId}`}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.58rem",
                      color: "#9CA3AF",
                      lineHeight: 1,
                      mt: 0.2,
                    }}
                  >
                    {options.length} {options.length === 1 ? "item" : "items"}
                  </Typography>
                </Box>

                {/* PO total */}
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#D85A30",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtPHP(poTotal)}
                </Typography>

                {/* Link button */}
                <Box
                  onClick={!linking ? () => handleLinkPO(po) : undefined}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.35,
                    px: 0.75,
                    py: 0.35,
                    borderRadius: "5px",
                    background: isLinking ? "#DBEAFE" : "#EFF6FF",
                    border: "0.5px solid #BFDBFE",
                    cursor: linking ? "default" : "pointer",
                    flexShrink: 0,
                    transition: "all 0.15s",
                    "&:hover": {
                      background: "#DBEAFE",
                      borderColor: "#93C5FD",
                    },
                  }}
                >
                  {isLinking ? (
                    <CircularProgress size={10} sx={{ color: "#3B82F6" }} />
                  ) : (
                    <>
                      <AddOutlined
                        sx={{ fontSize: "0.6rem", color: "#3B82F6" }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: "#3B82F6",
                          lineHeight: 1,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Link
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};
const DarkHeader = ({
  voucher,
  payeeNickName,
  supplierTIN,
  supplierAddress,
  isAssigneeType,
  onClose,
  onPrint,
  onCancel,
  onReopen,
  onPrintOnly,
  onPrintCheque,
  voucherStatus,
  voucherActiveKey,
  voucherClosedKey,
  voucherCancelledKey,
  allOptionsEligibleForPaid,
  isManagement,
  isFinanceOfficer,
}) => (
  <Box sx={{ px: 2, pt: 2, position: "relative", overflow: "hidden" }}>
    <Box
      sx={{
        background:
          "linear-gradient(160deg, #1a2f4e 0%, #142540 60%, #0f1e33 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        p: 1.5,
      }}
    >
      {/* ── Row 1: Info cards ── */}
      <Box sx={{ display: "flex", gap: 1 }}>
        {/* Supplier / Assignee card */}
        <Box
          sx={{
            flex: 1,
            px: 1,
            py: 0.75,
            borderRadius: "8px",
            background: "rgba(255,255,255,0.07)",
            border: "0.5px solid rgba(255,255,255,0.12)",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}
          >
            <StoreOutlined sx={{ fontSize: "0.6rem", color: "#93c5fd" }} />
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#93c5fd",
                lineHeight: 1,
              }}
            >
              {isAssigneeType ? "Assignee" : "Supplier"}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              mb: 0.2,
            }}
          >
            {payeeNickName}
          </Typography>
          {supplierAddress && (
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.3,
              }}
            >
              {supplierAddress}
            </Typography>
          )}
          {supplierTIN && (
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.3,
                mt: 0.2,
              }}
            >
              TIN: {supplierTIN}
            </Typography>
          )}
        </Box>

        {/* Voucher meta card */}
        <Box
          sx={{
            flex: 1,
            px: 1,
            py: 0.75,
            borderRadius: "8px",
            background: "rgba(255,255,255,0.07)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* ── PAID stamp — inside card, right side ── */}
          {!isAssigneeType &&
            String(voucher?.cStatus) === String(voucherClosedKey) &&
            !allOptionsEligibleForPaid && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid #86efac",
                  outline: "1px solid #86efac",
                  outlineOffset: "2px",
                  boxShadow: "0 0 0 1px rgba(21,128,61,0.3)",
                  backgroundColor: "rgba(21,128,61,0.15)",
                }}
              >
                <Box
                  sx={{
                    fontSize: "0.42rem",
                    fontWeight: 900,
                    color: "#86efac",
                    backgroundColor: "rgba(21,128,61,0.15)",
                    border: "2px solid #86efac",
                    borderRadius: "4px",
                    px: 0.4,
                    py: 0.2,
                    lineHeight: 1.3,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transform: "rotate(-15deg)",
                    boxShadow: "inset 0 0 0 1px rgba(21,128,61,0.3)",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  PAID
                </Box>
              </Box>
            )}

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}
          >
            <ReceiptLongOutlined
              sx={{ fontSize: "0.6rem", color: "#93c5fd" }}
            />
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#93c5fd",
                lineHeight: 1,
              }}
            >
              No. HDV
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              mb: 0.2,
            }}
          >
            {voucher?.strNumber ?? "—"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.55rem",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.3,
            }}
          >
            Created {fmtDate(voucher?.dtCreated)}
          </Typography>
        </Box>
      </Box>

      {/* ── Row 2: Action buttons ── */}
      <Box
        sx={{
          mt: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
        }}
      >
        {/* Active → Close + Cancel */}
        {String(voucher?.cStatus) === String(voucherActiveKey) && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <MiniBaseButton.Green
              onClick={() => onPrint?.()}
              icon={<LockOutlined />}
              label="Close"
            />
            <MiniBaseButton.Red
              onClick={() => onCancel?.()}
              icon={<CloseOutlined />}
              label="Cancel"
            />
          </Box>
        )}

        {/* Closed → buttons */}
        {String(voucher?.cStatus) === String(voucherClosedKey) && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {(isAssigneeType || allOptionsEligibleForPaid) && (
              <MiniBaseButton.Blue
                onClick={() => onReopen?.()}
                icon={<ReceiptLongOutlined />}
                label="Open"
              />
            )}
            {(isAssigneeType || allOptionsEligibleForPaid) && (
              <MiniBaseButton.Green
                onClick={() => onPrintOnly?.()}
                icon={<PrintOutlined />}
                label="Print Voucher"
              />
            )}
            {(isManagement || isFinanceOfficer) && (
              <MiniBaseButton.Green
                onClick={() => onPrintCheque?.()}
                icon={<PrintOutlined />}
                label="Print Cheque"
              />
            )}
            <MiniBaseButton.Red
              onClick={() => onCancel?.()}
              icon={<CloseOutlined />}
              label="Cancel"
            />
          </Box>
        )}

        {/* Cancelled → badge */}
        {String(voucher?.cStatus) === String(voucherCancelledKey) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "0.5px solid rgba(239,68,68,0.2)",
            }}
          >
            <CloseOutlined
              sx={{ fontSize: "0.75rem", color: "rgba(252,165,165,0.7)" }}
            />
            <Typography
              sx={{
                fontSize: "0.52rem",
                fontWeight: 700,
                color: "rgba(252,165,165,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Cancelled
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  </Box>
);
// ── PO Row (expandable with items + total) ───────────────────────────────────

const PORow = ({ link, idx, total, isRemoving, onRemove }) => {
  const [open, setOpen] = useState(false);

  const poNo =
    link.purchase_order?.strPurchaseOrderNo ?? `PO #${link.nPurchaseOrderId}`;
  const options = link.purchase_order?.purchase_order_options || [];

  const poTotal = options.reduce((sum, opt) => {
    const p = opt.purchase_option;
    return sum + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
  }, 0);

  return (
    <Box
      sx={{
        borderBottom: "0.5px solid #F3F4F6",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      {/* ── PO header row ── */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          gap: 1,
          "&:hover": { background: "#F9FAFB" },
          transition: "background 0.15s",
        }}
      >
        {/* Row number */}
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: "#9CA3AF",
            width: 16,
            flexShrink: 0,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          {idx + 1}
        </Typography>

        {/* PO icon box */}
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: "#EFF6FF",
            border: "0.5px solid #BFDBFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#3B82F6" }} />
        </Box>

        {/* PO number + item count */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {poNo}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.58rem",
              color: "#9CA3AF",
              lineHeight: 1,
              mt: 0.2,
            }}
          >
            {options.length} {options.length === 1 ? "item" : "items"}
          </Typography>
        </Box>

        {/* PO total */}
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#D85A30",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {fmtPHP(poTotal)}
        </Typography>

        {/* Toggle expand */}
        {options.length > 0 && (
          <IconButton
            size="small"
            onClick={() => setOpen((v) => !v)}
            sx={{
              width: 20,
              height: 20,
              flexShrink: 0,
              color: "#9CA3AF",
              border: "0.5px solid #E5E7EB",
              borderRadius: "50px",
              "&:hover": { background: "#F3F4F6" },
              p: 0,
            }}
          >
            {open ? (
              <KeyboardArrowUp sx={{ fontSize: "0.8rem" }} />
            ) : (
              <KeyboardArrowDown sx={{ fontSize: "0.8rem" }} />
            )}
          </IconButton>
        )}

        {/* Remove button */}
        {onRemove && (
          <IconButton
            size="small"
            disabled={isRemoving}
            onClick={onRemove}
            sx={{
              width: 20,
              height: 20,
              flexShrink: 0,
              color: "#EF4444",
              opacity: isRemoving ? 0.4 : 0.6,
              "&:hover": { background: "#FEF2F2", opacity: 1 },
              transition: "opacity 0.15s",
              p: 0,
            }}
          >
            {isRemoving ? (
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  border: "1.5px solid #EF4444",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            ) : (
              <DeleteOutlineOutlined sx={{ fontSize: "0.8rem" }} />
            )}
          </IconButton>
        )}
      </Box>

      {/* ── Expanded items ── */}
      {open && options.length > 0 && (
        <Box sx={{ background: "#FAFAFA", borderTop: "0.5px solid #F3F4F6" }}>
          {options.map((opt, i) => {
            const p = opt.purchase_option;
            const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
            const txnCode = p?.transaction_item?.transaction?.strCode ?? "—";

            return (
              <Box
                key={opt.nPurchaseOrder_OptionId ?? i}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  pl: 5.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom:
                    i < options.length - 1 ? "0.5px solid #F3F4F6" : "none",
                  "&:hover": { background: "#F3F4F6" },
                  transition: "background 0.12s",
                }}
              >
                {/* Item icon */}
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "6px",
                    background: "#F3F4F6",
                    border: "0.5px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Inventory2Outlined
                    sx={{ fontSize: "0.75rem", color: "#9CA3AF" }}
                  />
                </Box>

                {/* Item details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                      mb: 0.2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 0.4,
                        py: 0.1,
                        borderRadius: "3px",
                        background: "#EFF6FF",
                        border: "0.5px solid #BFDBFE",
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.5rem",
                          fontWeight: 700,
                          color: "#3B82F6",
                          lineHeight: 1,
                        }}
                      >
                        {txnCode}
                      </Typography>
                    </Box>
                    {(p?.strBrand || p?.strModel) && (
                      <Typography
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: 1.2,
                        }}
                      >
                        {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.58rem",
                      color: "#6B7280",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}
                  >
                    {p?.transaction_item?.strName ?? "—"}
                  </Typography>
                </Box>

                {/* Qty + UOM */}
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 36,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#374151",
                      lineHeight: 1,
                    }}
                  >
                    {p?.nQuantity}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.5rem",
                      color: "#9CA3AF",
                      lineHeight: 1,
                      mt: 0.15,
                    }}
                  >
                    {p?.strUOM}
                  </Typography>
                </Box>

                {/* Unit price */}
                <Box sx={{ flexShrink: 0, textAlign: "right", width: 64 }}>
                  <Typography
                    sx={{
                      fontSize: "0.56rem",
                      color: "#9CA3AF",
                      lineHeight: 1.2,
                    }}
                  >
                    {fmtPHP(p?.dUnitPrice)}
                  </Typography>
                </Box>

                {/* Line total */}
                <Box
                  sx={{ flexShrink: 0, textAlign: "right", width: 72, mr: 6 }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      color: "#D85A30",
                      lineHeight: 1.2,
                    }}
                  >
                    {fmtPHP(lineTotal)}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {/* Items subtotal row */}
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              pl: 5.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1,
              background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.58rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1,
              }}
            >
              {options.length} {options.length === 1 ? "item" : "items"} ·
              subtotal
            </Typography>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#FAC775",
                lineHeight: 1,
                letterSpacing: "-0.01em",
                width: 72,
                textAlign: "right",
              }}
            >
              {fmtPHP(poTotal)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};
// ── PO List ───────────────────────────────────────────────────────────────────

const POList = ({ supplierLinks, onRemovePO }) => {
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (nVoucherSupplierId) => {
    setRemovingId(nVoucherSupplierId);
    try {
      await onRemovePO(nVoucherSupplierId);
    } finally {
      setRemovingId(null);
    }
  };

  const grandTotal = supplierLinks.reduce((sum, link) => {
    const opts = link.purchase_order?.purchase_order_options || [];
    return (
      sum +
      opts.reduce((s, opt) => {
        const p = opt.purchase_option;
        return s + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
      }, 0)
    );
  }, 0);

  if (supplierLinks.length === 0) {
    return (
      <Box
        sx={{
          mx: 1.5,
          mb: 1.5,
          borderRadius: "10px",
          border: "0.5px solid #E5E7EB",
          px: 2,
          py: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{ fontSize: "0.65rem", color: "#9CA3AF", lineHeight: 1 }}
        >
          No purchase orders linked.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        borderRadius: "10px",
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
        maxHeight: 420,
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: 3 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "#D1D5DB",
          borderRadius: 2,
        },
        "&::-webkit-scrollbar-thumb:hover": { background: "#9CA3AF" },
      }}
    >
      {supplierLinks.map((link, idx) => (
        <PORow
          key={link.nVoucherSupplierId}
          link={link}
          idx={idx}
          isRemoving={removingId === link.nVoucherSupplierId}
          onRemove={
            onRemovePO // ← only define the handler if onRemovePO exists
              ? () => handleRemove(link.nVoucherSupplierId)
              : undefined
          }
        />
      ))}

      {/* Grand total row */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)",
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mr: 1,
          }}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#90caf9" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.2,
            }}
          >
            Grand Total
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.2,
            }}
          >
            {supplierLinks.length} PO{supplierLinks.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 800,
            color: "#FAC775",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {fmtPHP(grandTotal)}
        </Typography>
      </Box>
    </Box>
  );
};
const AssigneeList = ({ assigneeLinks, onEdit, onDelete }) => {
  const [removingId, setRemovingId] = useState(null); // ← ADD

  const handleDelete = async (nVoucherAssigneeId) => {
    // ← ADD
    setRemovingId(nVoucherAssigneeId);
    try {
      await onDelete(nVoucherAssigneeId);
    } finally {
      setRemovingId(null);
    }
  };
  const grandTotal = assigneeLinks.reduce(
    (sum, a) => sum + Number(a.dAmount || 0),
    0,
  );

  if (assigneeLinks.length === 0) {
    return (
      <Box
        sx={{
          mx: 1.5,
          mb: 1.5,
          borderRadius: "10px",
          border: "0.5px solid #E5E7EB",
          px: 2,
          py: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF" }}>
          No assignee entries linked.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        borderRadius: "10px",
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      {assigneeLinks.map((a, idx) => (
        <Box
          key={a.nVoucherAssigneeId ?? idx}
          sx={{
            px: 1.5,
            py: 0.875,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom:
              idx < assigneeLinks.length - 1 ? "0.5px solid #F3F4F6" : "none",
            "&:hover": { background: "#F9FAFB" },
            transition: "background 0.15s",
          }}
        >
          {/* Row number */}
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#9CA3AF",
              width: 16,
              flexShrink: 0,
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            {idx + 1}
          </Typography>

          {/* Icon box */}
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "7px",
              background: "#EEEDFE",
              border: "0.5px solid #AFA9EC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Inventory2Outlined
              sx={{ fontSize: "0.85rem", color: "#534AB7" }}
            />
          </Box>

          {/* Particular */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {a.strParticular ?? "—"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.58rem",
                color: "#9CA3AF",
                lineHeight: 1,
                mt: 0.2,
              }}
            >
              qty: 1
            </Typography>
          </Box>

          {/* Amount */}
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#D85A30",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {fmtPHP(a.dAmount)}
          </Typography>

          {/* Edit button */}
          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(a);
              }}
              sx={{
                width: 20,
                height: 20,
                flexShrink: 0,
                color: "#3B82F6",
                opacity: 0.6,
                "&:hover": { background: "#EFF6FF", opacity: 1 },
                transition: "opacity 0.15s",
                p: 0,
              }}
            >
              <EditOutlined sx={{ fontSize: "0.75rem" }} />
            </IconButton>
          )}
          {/* Delete button */}
          {onDelete && (
            <IconButton
              size="small"
              disabled={removingId !== null}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(a.nVoucherAssigneeId);
              }}
              sx={{
                width: 20,
                height: 20,
                flexShrink: 0,
                color: "#EF4444",
                opacity: removingId === a.nVoucherAssigneeId ? 1 : 0.6,
                "&:hover": { background: "#FEF2F2", opacity: 1 },
                transition: "opacity 0.15s",
                p: 0,
              }}
            >
              {removingId === a.nVoucherAssigneeId ? (
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    border: "1.5px solid #EF4444",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              ) : (
                <DeleteOutlineOutlined sx={{ fontSize: "0.75rem" }} />
              )}
            </IconButton>
          )}
        </Box>
      ))}

      {/* Grand total row */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #1a2f4e 0%, #142540 100%)",
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mr: 1,
          }}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#90caf9" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.2,
            }}
          >
            Grand Total
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.2,
            }}
          >
            {assigneeLinks.length}{" "}
            {assigneeLinks.length !== 1 ? "entries" : "entry"}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 800,
            color: "#FAC775",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {fmtPHP(grandTotal)}
        </Typography>
      </Box>
    </Box>
  );
};
// ── Confirm Styles ────────────────────────────────────────────────────────────
const VOUCHER_CONFIRM_STYLES = {
  cancel: {
    color: "#dc2626",
    bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    border: "#fecaca",
    dotColor: "#ef4444",
    icon: <CloseOutlined sx={{ fontSize: "1.4rem", color: "#dc2626" }} />,
    title: "Cancel this Voucher?",
    desc: "Cancelling the voucher will void all entries. This action cannot be undone.",
    confirmLabel: "Yes, Cancel Voucher",
    confirmBg: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  },
  reopen: {
    color: "#1D4ED8",
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    border: "#BFDBFE",
    dotColor: "#3B82F6",
    icon: <ReceiptLongOutlined sx={{ fontSize: "1.4rem", color: "#1D4ED8" }} />,
    title: "Re-open this Voucher?",
    desc: "This will reactivate the voucher and allow further edits.",
    confirmLabel: "Yes, Re-open Voucher",
    confirmBg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)",
  },
  print: {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <LockOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Close this Voucher?",
    desc: "Closing the voucher will lock it from further edits.",
    confirmLabel: "Yes, Close Voucher",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  },
  // Find VOUCHER_CONFIRM_STYLES and add this entry:
  print_only: {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <PrintOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Print this Voucher?",
    desc: "This will open the print view for this voucher.",
    confirmLabel: "Yes, Print Voucher",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  },
  print_cheque: {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <PrintOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Print Cheque?",
    desc: "This will open the cheque print view for this voucher.",
    confirmLabel: "Yes, Print Cheque",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  },
  paid: {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <BadgeOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Mark as Paid?",
    desc: "This will mark the voucher as paid. This action cannot be undone.",
    confirmLabel: "Yes, Mark as Paid",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  },
};

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function VoucherUpdateModal({
  open,
  onClose,
  voucher,
  onVoucherUpdated,
  voucherAssigneeTypeKey,
  voucherActiveKey,
  voucherClosedKey,
  voucherCancelledKey,
  voucherStatus,
  paidKey,
  receivedKey,
  deliveredKey,
  closeCartKey,
  cancelCartKey,
  closePoKey,
  currentUserId,
  isManagement,
  isFinanceOfficer,
}) {
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ particular: "", amount: "" });
  const [formErrors, setFormErrors] = useState({});
  // ── ADD THESE TWO ──────────────────────────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState(null); // 'cancel' | 'reopen' | 'print'
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [optionHistories, setOptionHistories] = useState({});
  const [historiesLoading, setHistoriesLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setLoading(true);
      setShowAddItem(false);
      setEditingAssignee(null);
      setSaving(false);
      setFormData({ particular: "", amount: "" });
      setFormErrors({});
      setConfirmAction(null);
      setConfirmLoading(false);
      setOptionHistories({}); // ← ADD
      setHistoriesLoading(false); // ← ADD
      const t = setTimeout(() => setLoading(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);
  useEffect(() => {
    if (!open || !voucher) return;

    // Only fetch for supplier-type vouchers
    const isSupplier =
      !voucher.voucher_assignees?.length ||
      voucher.voucher_suppliers?.length > 0;
    if (!isSupplier) return;

    const ids = (voucher.voucher_suppliers ?? [])
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);

    if (!ids.length || !paidKey) return;

    setHistoriesLoading(true);
    api
      .post("purchase-item-histories/latest", { nPurchaseOptionId: ids })
      .then((res) => {
        const map = {};
        (res?.histories || []).forEach((h) => {
          map[Number(h.nPurchaseOptionId)] = h;
        });
        setOptionHistories(map);
      })
      .catch((err) => console.error("fetchOptionHistories error:", err))
      .finally(() => setHistoriesLoading(false));
  }, [open, voucher, paidKey]);
  if (!open || !voucher) return null;

  const isAssigneeType =
    voucher.voucher_assignees?.length > 0 && !voucher.voucher_suppliers?.length;

  const firstAssignee = voucher.voucher_assignees?.[0];

  const payeeName = isAssigneeType
    ? (firstAssignee?.assignee?.strAssigneeName ??
      voucher.assignee?.strAssigneeName ??
      "—")
    : (voucher.supplier?.strSupplierName ?? "—");
  const payeeNickName = isAssigneeType
    ? (firstAssignee?.assignee?.strAssigneeNickName ??
      voucher.assignee?.strAssigneeNickName ??
      "—")
    : (voucher.supplier?.strSupplierNickName ?? "—");

  const supplierTIN = isAssigneeType
    ? (firstAssignee?.assignee?.strTIN ?? null)
    : (voucher.supplier?.strTIN ?? null);

  const supplierAddress = isAssigneeType
    ? (firstAssignee?.assignee?.strAddress ?? null)
    : (voucher.supplier?.strAddress ?? null);

  const supplierLinks = voucher.voucher_suppliers || [];
  const assigneeLinks = voucher.voucher_assignees || [];
  // true only when ALL options are NOT yet at paid/received/delivered
  const allOptionsEligibleForPaid =
    !isAssigneeType &&
    !historiesLoading &&
    supplierLinks.length > 0 &&
    supplierLinks
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .every((o) => {
        const id = Number(o.purchase_option?.nPurchaseOptionId);
        const status = String(optionHistories[id]?.nStatus ?? "");
        return (
          status !== String(paidKey) &&
          status !== String(receivedKey) &&
          status !== String(deliveredKey)
        );
      });
  const handleRemovePO = async (nVoucherSupplierId) => {
    await api.delete(`voucher-suppliers/${nVoucherSupplierId}`);
    onVoucherUpdated();
  };

  const particularsCount = isAssigneeType
    ? assigneeLinks.length
    : supplierLinks.length;
  const handleEditAssignee = (assignee) => {
    setEditingAssignee(assignee);
    setShowAddItem(true);
  };
  const handleVoucherStatusChange = async (newStatus) => {
    try {
      await api.patch(`vouchers/${voucher.nVoucherId}/status`, {
        cStatus: newStatus,
      });
      await onVoucherUpdated();
      onClose(); // ← ADD THIS
    } catch (err) {
      console.error("Failed to update voucher status:", err);
    }
  };
  const handleDeleteAssignee = async (nVoucherAssigneeId) => {
    const res = await api.delete(`voucher-assignees/${nVoucherAssigneeId}`);
    if (res.voucher_deleted) {
      onVoucherUpdated();
      onClose(); // ← close modal since voucher no longer exists
    } else {
      onVoucherUpdated();
    }
  };
  const handleSaveAssignee = async () => {
    const errs = {};
    if (!formData.particular?.trim())
      errs.particular = "Particular is required";
    if (!formData.amount || Number(formData.amount) <= 0)
      errs.amount = "Amount must be greater than 0";

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (editingAssignee) {
        await api.put(
          `voucher-assignees/${editingAssignee.nVoucherAssigneeId}`,
          {
            strParticular: formData.particular,
            dAmount: Number(formData.amount),
          },
        );
      } else {
        const firstAssignee = voucher.voucher_assignees?.[0];
        await api.post("voucher-assignees", {
          nVoucherId: voucher.nVoucherId,
          nAssigneeId: firstAssignee.nAssigneeId,
          strParticular: formData.particular,
          dAmount: Number(formData.amount),
        });
      }
      await onVoucherUpdated();
      setShowAddItem(false);
      setEditingAssignee(null);
      setFormData({ particular: "", amount: "" });
      setFormErrors({});
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };
  const handlePrintVoucher = async () => {
    const isAssignee =
      voucher.voucher_assignees?.length > 0 &&
      !voucher.voucher_suppliers?.length;

    // ── Capture particulars from the CURRENT voucher BEFORE any status change ──
    const particulars = isAssignee
      ? (voucher.voucher_assignees ?? []).map((a) => ({
          particular: a.strParticular ?? "—",
          qty: 1,
          unit_price: 0,
          amount: Number(a.dAmount || 0),
        }))
      : (voucher.voucher_suppliers ?? []).map((vs) => ({
          particular:
            vs.purchase_order?.strPurchaseOrderNo ??
            `PO #${vs.nPurchaseOrderId}`,
          qty: 1,
          unit_price: 0,
          amount: (vs.purchase_order?.purchase_order_options ?? []).reduce(
            (sum, opt) => {
              const p = opt.purchase_option;
              return sum + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
            },
            0,
          ),
        }));

    const snapshot = {
      voucher,
      isAssigneeType: isAssignee,
      payeeNickName,
      payeeName,
      supplierTIN,
      supplierAddress,
      particulars,
      cPaymentTerms:
        voucher?.voucher_suppliers?.[0]?.purchase_order?.cPaymentTerms ?? null, // ← ADD
    };

    // If still active, close it first
    if (String(voucher.cStatus) === String(voucherActiveKey)) {
      try {
        await api.patch(`vouchers/${voucher.nVoucherId}/status`, {
          cStatus: voucherClosedKey,
        });
        await onVoucherUpdated();
      } catch (err) {
        console.error("Failed to close voucher before printing:", err);
        return;
      }
    }

    sessionStorage.setItem("printVoucher_data", JSON.stringify(snapshot));

    onClose();
    printRoute("/print-voucher");
  };
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === "cancel") {
        await api.patch(`vouchers/${voucher.nVoucherId}/status`, {
          cStatus: voucherCancelledKey,
        });
        onClose();
        onVoucherUpdated();
        await showSwal(
          "SUCCESS",
          {},
          { entity: "Voucher", action: "cancelled" },
        );
      } else if (confirmAction === "reopen") {
        await api.patch(`vouchers/${voucher.nVoucherId}/status`, {
          cStatus: voucherActiveKey,
        });
        onClose();
        onVoucherUpdated();
        await showSwal("SUCCESS", {}, { entity: "Voucher", action: "updated" });
      } else if (confirmAction === "print_only") {
        await handlePrintVoucher();
      } else if (confirmAction === "paid") {
        const nPurchaseOrderIds = (voucher.voucher_suppliers ?? [])
          .map((vs) => vs.nPurchaseOrderId)
          .filter(Boolean);

        await api.patch("purchase-orders/update-cart-status-bulk", {
          nPurchaseOrderIds,
          nStatus: paidKey, // ← was cStatus, now nStatus
          nUserId: currentUserId,
          // ← remove cancelCartKey and cancelPoKey, not needed
        });
        onClose();
        onVoucherUpdated();
        await showSwal(
          "SUCCESS",
          {},
          { entity: "Voucher", action: "marked as paid" },
        );
      } else if (confirmAction === "print") {
        await api.patch(`vouchers/${voucher.nVoucherId}/status`, {
          cStatus: voucherClosedKey,
        });
        onClose();
        onVoucherUpdated();
        await showSwal("SUCCESS", {}, { entity: "Voucher", action: "updated" });
      } else if (confirmAction === "print_cheque") {
        const chequeParticulars = isAssigneeType
          ? (assigneeLinks ?? []).map((a) => ({
              particular: a.strParticular ?? "—",
              qty: 1,
              unit_price: 0,
              amount: Number(a.dAmount || 0),
            }))
          : (supplierLinks ?? []).map((vs) => ({
              particular:
                vs.purchase_order?.strPurchaseOrderNo ??
                `PO #${vs.nPurchaseOrderId}`,
              qty: 1,
              unit_price: 0,
              amount: (vs.purchase_order?.purchase_order_options ?? []).reduce(
                (sum, opt) => {
                  const p = opt.purchase_option;
                  return sum + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
                },
                0,
              ),
            }));

        const chequeSnapshot = {
          voucher,
          payeeName,
          particulars: chequeParticulars, // ← was missing entirely
        };
        sessionStorage.setItem(
          "printCheque_data",
          JSON.stringify(chequeSnapshot),
        );
        printRoute("/print-cheque");
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <ModalContainer
        open={open}
        handleClose={onClose}
        title="Disbursement Voucher Details"
        subTitle={(() => {
          const statusLabel = voucherStatus?.[voucher.cStatus];
          const parts = [];
          if (statusLabel) parts.push(`/ ${statusLabel}`);
          if (voucher.strNumber) parts.push(`/ ${voucher.strNumber}`);
          return parts.join(" ");
        })()}
        contentPadding={0}
        saveLabel={editingAssignee ? "Update Entry" : "Save Entry"}
        onSave={handleSaveAssignee}
        isSaving={saving}
        showSave={showAddItem && isAssigneeType && !saving}
        cancelLabel={showAddItem ? "Back" : "Close"}
        onCancel={
          showAddItem
            ? () => {
                if (saving) return; // block back while saving
                setShowAddItem(false);
                setEditingAssignee(null);
                setFormData({ particular: "", amount: "" });
                setFormErrors({});
              }
            : onClose
        }
        disabled={confirmLoading || saving}
        extraActions={
          (isManagement || isFinanceOfficer) &&
          !loading &&
          !confirmAction &&
          !showAddItem &&
          String(voucher?.cStatus) === String(voucherClosedKey) &&
          allOptionsEligibleForPaid ? ( // ← was just the closed check
            <BaseButton
              label="Mark as Paid"
              onClick={() => setConfirmAction("paid")}
              disabled={confirmLoading || saving || historiesLoading}
              actionColor="approve"
            />
          ) : null
        }
      >
        {loading ? (
          <VoucherUpdateModalSkeleton />
        ) : confirmAction ? (
          <ConfirmationDialog
            style={VOUCHER_CONFIRM_STYLES[confirmAction]}
            voucherNumber={voucher?.strNumber}
            loading={confirmLoading}
            onConfirm={handleConfirmAction}
            onBack={() => setConfirmAction(null)}
          />
        ) : showAddItem ? (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* DarkHeader removed when in add/edit view */}
            {saving ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 6,
                  px: 3,
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                    background:
                      "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                    border: "0.5px solid #BFDBFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={22} sx={{ color: "#3B82F6" }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#111827",
                      mb: 0.4,
                    }}
                  >
                    {editingAssignee ? "Updating Entry…" : "Saving Entry…"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.62rem", color: "#9CA3AF" }}>
                    Please wait while we save your changes.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <AddItemView
                isAssigneeType={isAssigneeType}
                voucher={voucher}
                firstAssignee={firstAssignee}
                editingAssignee={editingAssignee}
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                onSuccess={onVoucherUpdated}
                voucherActiveKey={voucherActiveKey}
                voucherClosedKey={voucherClosedKey}
                onBack={() => {
                  setShowAddItem(false);
                  setEditingAssignee(null);
                  setFormData({ particular: "", amount: "" });
                  setFormErrors({});
                }}
              />
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <DarkHeader
              voucher={voucher}
              payeeNickName={payeeNickName}
              supplierTIN={supplierTIN}
              supplierAddress={supplierAddress}
              isAssigneeType={isAssigneeType}
              onClose={onClose}
              onPrint={() => setConfirmAction("print")}
              onCancel={() => setConfirmAction("cancel")}
              onReopen={() => setConfirmAction("reopen")}
              voucherActiveKey={voucherActiveKey}
              voucherClosedKey={voucherClosedKey}
              voucherCancelledKey={voucherCancelledKey}
              onPrintOnly={() => setConfirmAction("print_only")}
              onPrintCheque={() => setConfirmAction("print_cheque")}
              allOptionsEligibleForPaid={allOptionsEligibleForPaid} // ← ADD
              isFinanceOfficer={isFinanceOfficer}
              isManagement={isManagement}
            />
            {isAssigneeType ? (
              <>
                <SectionLabel
                  onAddItem={
                    String(voucher.cStatus) === String(voucherActiveKey)
                      ? () => setShowAddItem(true)
                      : undefined
                  }
                >
                  Particulars ({particularsCount})
                </SectionLabel>
                <AssigneeList
                  assigneeLinks={assigneeLinks}
                  onEdit={
                    String(voucher.cStatus) === String(voucherActiveKey)
                      ? handleEditAssignee
                      : undefined
                  }
                  onDelete={
                    // ← ADD
                    String(voucher.cStatus) === String(voucherActiveKey)
                      ? handleDeleteAssignee
                      : undefined
                  }
                />
              </>
            ) : (
              <>
                <SectionLabel
                  onAddItem={
                    String(voucher.cStatus) === String(voucherActiveKey)
                      ? () => setShowAddItem(true)
                      : undefined
                  }
                >
                  Particulars ({particularsCount})
                </SectionLabel>
                <POList
                  supplierLinks={supplierLinks}
                  onRemovePO={
                    String(voucher.cStatus) === String(voucherActiveKey)
                      ? handleRemovePO
                      : undefined // ← hide remove when not active
                  }
                />
              </>
            )}
          </Box>
        )}
      </ModalContainer>
    </>
  );
}
