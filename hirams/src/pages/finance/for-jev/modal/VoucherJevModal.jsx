// VoucherJevModal.jsx
import { useState, useEffect } from "react";
import ModalContainer from "../../../../layouts/modal/ModalContainer.jsx";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import JevForm, {
  JournalEntryVoucherTable,
} from "../../../../pages/common/transaction/voucher/components/JevTableForm.jsx";
import {
  ReceiptLongOutlined,
  BadgeOutlined,
  StoreOutlined,
  AddOutlined,
  CloseOutlined,
  Inventory2Outlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import JevAPI from "../../../../api/endpoints/jev.api.js";
import { VoucherUpdateSkeleton } from "../../../../components/loader/Skeleton.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────
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

// ── Section label with optional "Add JEV" chip ──────────────────────────
const SectionLabel = ({
  children,
  onAddItem,
  addLabel = "Add Item",
  badge,
}) => (
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

    {badge}

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
          "&:hover": { background: "#DBEAFE", borderColor: "#93C5FD" },
          "&:active": { background: "#BFDBFE" },
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
          {addLabel}
        </Typography>
      </Box>
    )}
  </Box>
);

// ── Simplified voucher header (info only, no action buttons) ───────────
const DarkHeader = ({
  voucher,
  payeeNickName,
  supplierTIN,
  supplierAddress,
  isAssigneeType,
  voucherCancelledKey,
  strTitle,
}) => (
  <Box sx={{ px: 2, pt: 2, position: "relative", overflow: "hidden" }}>
    <Box
      sx={{
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        p: 1.5,
      }}
    >
      <Box sx={{ display: "flex", gap: 1 }}>
        {/* Supplier / Assignee card */}
        <Box
          sx={{
            flex: 1,
            px: 1,
            py: 0.75,
            borderRadius: "8px",
            background: "#F3F4F6",
            border: "0.5px solid #E5E7EB",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}
          >
            <StoreOutlined sx={{ fontSize: "0.6rem", color: "#6B7280" }} />
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#6B7280",
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
              color: "#111827",
              lineHeight: 1.2,
              mb: 0.2,
            }}
          >
            {payeeNickName}
          </Typography>
          {supplierAddress && (
            <Typography
              sx={{ fontSize: "0.55rem", color: "#6B7280", lineHeight: 1.3 }}
            >
              {supplierAddress}
            </Typography>
          )}
          {supplierTIN && (
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "#9CA3AF",
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
            background: "#F3F4F6",
            border: "0.5px solid #E5E7EB",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.3 }}
          >
            <ReceiptLongOutlined
              sx={{ fontSize: "0.6rem", color: "#6B7280" }}
            />
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#6B7280",
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
              color: "#111827",
              lineHeight: 1.2,
              mb: 0.2,
            }}
          >
            {voucher?.strNumber ?? "—"}
          </Typography>
          <Typography
            sx={{ fontSize: "0.55rem", color: "#6B7280", lineHeight: 1.3 }}
          >
            Created {fmtDate(voucher?.dtCreated)}
          </Typography>
        </Box>
      </Box>

      {/* Title + Cancelled badge */}
      <Box
        sx={{
          mt: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {isAssigneeType && strTitle && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                maxWidth: "100%",
                px: 1,
                py: 0.4,
                borderRadius: "50px",
                background: "#EFF6FF",
                border: "0.5px solid #BFDBFE",
              }}
            >
              <BadgeOutlined
                sx={{ fontSize: "0.62rem", color: "#3B82F6", flexShrink: 0 }}
              />
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#3B82F6",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {strTitle}
              </Typography>
            </Box>
          )}
        </Box>

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
              background: "#FEF2F2",
              border: "0.5px solid #FECACA",
              flexShrink: 0,
            }}
          >
            <CloseOutlined sx={{ fontSize: "0.75rem", color: "#DC2626" }} />
            <Typography
              sx={{
                fontSize: "0.52rem",
                fontWeight: 700,
                color: "#DC2626",
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

// ── PO Row (expandable with items + total) ───────────────────────────────
const PORow = ({ link, idx, total }) => {
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
                key={opt.nPurchaseOrder_ItemId ?? i}
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

          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              pl: 5.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1,
              background: "#F9FAFB",
              borderTop: "0.5px solid #E5E7EB",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.58rem",
                color: "#9CA3AF",
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
                color: "#D85A30",
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

// ── PO List (Supplier Particulars) ───────────────────────────────────────
const POList = ({ supplierLinks }) => {
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
        <PORow key={link.nVoucherSupplierId} link={link} idx={idx} />
      ))}

      {/* Grand total row */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: "#F3F4F6",
          borderTop: "1px solid #DDE3EE",
        }}
      >
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
            mr: 1,
          }}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#3B82F6" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: "#334155",
              lineHeight: 1.2,
            }}
          >
            Grand Total
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: "#94A3B8",
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
            color: "#D85A30",
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

// ── Assignee List (Assignee Particulars) ─────────────────────────────────
const AssigneeList = ({ assigneeLinks }) => {
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
        </Box>
      ))}

      {/* Grand total row */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: "#F0F4FA",
          borderTop: "1px solid #DDE3EE",
        }}
      >
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
            mr: 1,
          }}
        >
          <ReceiptLongOutlined sx={{ fontSize: "0.85rem", color: "#534AB7" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: "#334155",
              lineHeight: 1.2,
            }}
          >
            Grand Total
          </Typography>
          <Typography
            sx={{
              fontSize: "0.54rem",
              color: "#94A3B8",
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
            color: "#D85A30",
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

// ── Main Modal ───────────────────────────────────────────────────────────
export default function VoucherJevModal({
  open,
  onClose,
  voucher,
  onVoucherUpdated,
  voucherActiveKey,
  voucherClosedKey,
  voucherCancelledKey,
  voucherStatus,
  dvTypeKey,
}) {
  // ── State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [showAddJev, setShowAddJev] = useState(false);
  const [jevFormData, setJevFormData] = useState({
    nJournalAccountId: "",
    cType: "from", // "from" | "to"
    amount: "",
  });
  const [editingJev, setEditingJev] = useState(null); // { nJEVId, nJournalAccountId, cType, amount, hasOpposite }
  const [removingJevAccountId, setRemovingJevAccountId] = useState(null);
  const [jevFormErrors, setJevFormErrors] = useState({});
  const [savingJev, setSavingJev] = useState(false);
  const [jevRefreshKey, setJevRefreshKey] = useState(0);
  const [jevParticulars, setJevParticulars] = useState([]);

  // ── Derived values ───────────────────────────────────────────────────
  const isAssigneeType =
    voucher?.voucher_assignees?.length > 0 &&
    !voucher?.voucher_suppliers?.length;

  const assigneeLinks = voucher?.voucher_assignees || [];
  const supplierLinks = voucher?.voucher_suppliers || [];

  const particularsCount = isAssigneeType
    ? assigneeLinks.length
    : supplierLinks.length;

  const particularsGrandTotal = isAssigneeType
    ? assigneeLinks.reduce((sum, a) => sum + Number(a.dAmount || 0), 0)
    : supplierLinks.reduce((sum, link) => {
        const opts = link.purchase_order?.purchase_order_options ?? [];
        return (
          sum +
          opts.reduce((s, opt) => {
            const p = opt.purchase_option;
            return s + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
          }, 0)
        );
      }, 0);

  // ── Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setLoading(true);
      setShowAddJev(false);
      setJevFormData({ nJournalAccountId: "", cType: "from", amount: "" });
      setJevFormErrors({});
      setSavingJev(false);
      setEditingJev(null);
      setRemovingJevAccountId(null);
      setJevParticulars([]);
      const t = setTimeout(() => setLoading(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!showAddJev) return;
    if (editingJev) {
      setJevFormData({
        nJournalAccountId: editingJev.nJournalAccountId,
        cType: editingJev.cType,
        amount: editingJev.amount,
      });
    } else {
      setJevFormData({
        nJournalAccountId: "",
        cType: "from",
        amount: particularsGrandTotal > 0 ? particularsGrandTotal : "",
      });
    }
  }, [showAddJev, editingJev, particularsGrandTotal]);

  useEffect(() => {
    if (!open || !voucher?.strNumber) return;
    JevAPI.getByLink(voucher.strNumber)
      .then((res) => {
        setJevParticulars(res?.particulars ?? []);
      })
      .catch((err) => {
        console.error("Failed to fetch JEV totals:", err);
        setJevParticulars([]);
      });
  }, [open, voucher?.strNumber, jevRefreshKey]);

  // ── Early return (AFTER all hooks) ──────────────────────────────────
  if (!open || !voucher) return null;

  const firstAssignee = voucher.voucher_assignees?.[0];

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

  // ── Remaining amount available for the current From/To type ─────────
  const jevRemainingAmount = (() => {
    if (!jevFormData.cType) return particularsGrandTotal;
    const sumForType = jevParticulars.reduce((sum, row) => {
      const isEditingThisRow =
        editingJev &&
        (jevFormData.cType === "from"
          ? row.nDebitJEVId === editingJev.nJEVId
          : row.nCreditJEVId === editingJev.nJEVId);
      if (isEditingThisRow) return sum;
      return (
        sum +
        (jevFormData.cType === "from" ? row.dDebit || 0 : row.dCredit || 0)
      );
    }, 0);
    return Math.max(particularsGrandTotal - sumForType, 0);
  })();

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSaveJev = async () => {
    const errs = {};
    if (!jevFormData.nJournalAccountId)
      errs.nJournalAccountId = "Account is required";
    if (!jevFormData.amount || Number(jevFormData.amount) <= 0)
      errs.amount = "Amount must be greater than 0";

    setJevFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const amount = Number(jevFormData.amount);
    const dFromAmount = jevFormData.cType === "from" ? amount : 0;
    const dToAmount = jevFormData.cType === "to" ? amount : 0;

    setSavingJev(true);
    try {
      if (editingJev?.nJEVId) {
        await JevAPI.updateEntry(editingJev.nJEVId, { dFromAmount, dToAmount });
      } else {
        await JevAPI.createEntry({
          nJournalAccountId: jevFormData.nJournalAccountId,
          strJevLink: voucher.strNumber,
          cJevType: dvTypeKey,
          dFromAmount,
          dToAmount,
        });
      }
      setJevRefreshKey((k) => k + 1);
      setShowAddJev(false);
      setEditingJev(null);
      setJevFormData({ nJournalAccountId: "", cType: "from", amount: "" });
      setJevFormErrors({});
      onVoucherUpdated?.();
    } catch (err) {
      console.error("Failed to save JEV line:", err);
      const serverMessage = err?.response?.data?.message ?? err?.data?.message;
      if (serverMessage) setJevFormErrors({ nJournalAccountId: serverMessage });
    } finally {
      setSavingJev(false);
    }
  };

  const handleDeleteJevLine = async (nJEVId, nJournalAccountId) => {
    setRemovingJevAccountId(nJournalAccountId);
    try {
      await JevAPI.deleteEntry(nJEVId);
      setJevRefreshKey((k) => k + 1);
      onVoucherUpdated?.();
    } catch (err) {
      console.error("Failed to delete JEV line:", err);
    } finally {
      setRemovingJevAccountId(null);
    }
  };

  // ── JSX return ───────────────────────────────────────────────────────
  return (
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
      saveLabel={editingJev ? "Update JEV" : "Save JEV"}
      onSave={handleSaveJev}
      isSaving={savingJev}
      showSave={showAddJev && !savingJev}
      cancelLabel={showAddJev ? "Back" : "Close"}
      onCancel={
        showAddJev
          ? () => {
              if (savingJev) return;
              setShowAddJev(false);
              setEditingJev(null);
              setJevFormData({
                nJournalAccountId: "",
                cType: "from",
                amount: "",
              });
              setJevFormErrors({});
            }
          : onClose
      }
      disabled={savingJev}
    >
      {loading ? (
        <VoucherUpdateSkeleton />
      ) : showAddJev ? (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {savingJev ? (
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
                  {editingJev ? "Updating JEV Entry…" : "Saving JEV Entry…"}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", color: "#9CA3AF" }}>
                  Please wait while we save your changes.
                </Typography>
              </Box>
            </Box>
          ) : (
            <JevForm
              formData={jevFormData}
              setFormData={setJevFormData}
              formErrors={jevFormErrors}
              lockedType={
                editingJev?.hasOpposite
                  ? editingJev.cType === "from"
                    ? "to"
                    : "from"
                  : null
              }
              suggestedAmount={jevRemainingAmount}
              isEditing={!!editingJev}
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
            voucherCancelledKey={voucherCancelledKey}
            strTitle={voucher.strTitle}
          />

          {/* ════════ NEW: PARTICULARS SECTION ════════ */}
          <SectionLabel>Particulars ({particularsCount})</SectionLabel>
          {isAssigneeType ? (
            <AssigneeList assigneeLinks={assigneeLinks} />
          ) : (
            <POList supplierLinks={supplierLinks} />
          )}
          {/* ════════ END PARTICULARS SECTION ════════ */}

          <SectionLabel
            addLabel="Add JEV"
            onAddItem={
              String(voucher.cStatus) === String(voucherClosedKey)
                ? () => setShowAddJev(true)
                : undefined
            }
          >
            Journal Entry Voucher
          </SectionLabel>
          <JournalEntryVoucherTable
            jevLink={voucher.strNumber}
            refreshKey={jevRefreshKey}
            removingAccountId={removingJevAccountId}
            onEdit={
              String(voucher.cStatus) === String(voucherClosedKey)
                ? (jevRow) => {
                    setEditingJev(jevRow);
                    setShowAddJev(true);
                  }
                : undefined
            }
            onDelete={
              String(voucher.cStatus) === String(voucherClosedKey)
                ? handleDeleteJevLine
                : undefined
            }
          />
        </Box>
      )}
    </ModalContainer>
  );
}
