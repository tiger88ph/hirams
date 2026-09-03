import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { AddOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { fmtPHP } from "../../utils/formatters/formatter.js";
import PurchaseOrderAPI from "../../api/endpoints/purchase-order.api.js";
import VoucherAPI from "../../api/endpoints/voucher.api.js";
import VoucherSupplierAPI from "../../api/endpoints/voucher-supplier.api.js";

export default function AddItemView({
  isAssigneeType,
  voucher,
  editingAssignee,
  formData,
  setFormData,
  formErrors,
  onSuccess,
  onBack,
  voucherActiveKey,
  voucherClosedKey,
}) {
  const [availablePOs, setAvailablePOs] = useState([]);
  const [posLoading, setPosLoading] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Fetch available POs for supplier
  useEffect(() => {
    if (isAssigneeType) return;
    const supplierId = voucher?.nTypeId;
    if (!supplierId) return setAvailablePOs([]);

    const load = async () => {
      setPosLoading(true);
      try {
        const [poRes, vRes] = await Promise.all([
          PurchaseOrderAPI.getBySupplier({ nSupplierId: supplierId }),
          VoucherAPI.getVouchers(),
        ]);
        const all = Array.isArray(poRes) ? poRes : (poRes.data ?? []);
        const vouchers = Array.isArray(vRes) ? vRes : (vRes.data ?? []);

        const vouchedPOIds = new Set();
        vouchers.forEach((v) => {
          if (
            String(v.cStatus) === String(voucherActiveKey) ||
            String(v.cStatus) === String(voucherClosedKey)
          ) {
            (v.voucher_suppliers ?? []).forEach((vs) =>
              vouchedPOIds.add(vs.nPurchaseOrderId),
            );
          }
        });

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
      } catch {
        setAvailablePOs([]);
      } finally {
        setPosLoading(false);
      }
    };
    load();
  }, [isAssigneeType, voucher, voucherActiveKey, voucherClosedKey]);

  // Populate edit form
  useEffect(() => {
    setFormData({
      particular: editingAssignee?.strParticular || "",
      amount: editingAssignee?.dAmount || "",
    });
  }, [editingAssignee, setFormData]);

  const handleLinkPO = async (po) => {
    setLinkError("");
    const existingLinks = voucher.voucher_suppliers ?? [];
    if (existingLinks.length > 0) {
      const existingTerms = existingLinks[0]?.purchase_order?.cPaymentTerms;
      if (String(po.cPaymentTerms) !== String(existingTerms)) {
        setLinkError(
          "Payment Terms does not match with the existing linked purchase order.",
        );
        return;
      }
    }

    setLinking(true);
    setSelectedPO(po.nPurchaseOrderId);
    try {
      await VoucherSupplierAPI.create({
        nVoucherId: voucher.nVoucherId,
        nPurchaseOrderId: po.nPurchaseOrderId,
      });
      await onSuccess?.();
      onBack?.();
    } finally {
      setLinking(false);
      setSelectedPO(null);
    }
  };

  // Assignee form
  if (isAssigneeType) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", px: 1.5, py: 1 }}>
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
            value={formData.particular}
            onChange={(e) =>
              setFormData((p) => ({ ...p, particular: e.target.value }))
            }
            sx={{
              width: "100%",
              px: 1.25,
              py: 0.875,
              fontSize: "0.75rem",
              border: `0.5px solid ${formErrors.particular ? "#EF4444" : "#D1D5DB"}`,
              borderRadius: "8px",
              outline: "none",
              fontFamily: "inherit",
              background: "#FAFAFA",
              "&:focus": { borderColor: "#93C5FD", background: "#fff" },
            }}
          />
          {formErrors.particular && (
            <Typography sx={{ fontSize: "0.58rem", color: "#EF4444", mt: 0.3 }}>
              {formErrors.particular}
            </Typography>
          )}
        </Box>

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
              value={formData.amount}
              onChange={(e) =>
                setFormData((p) => ({ ...p, amount: e.target.value }))
              }
              sx={{
                width: "100%",
                pl: 2.5,
                pr: 1.25,
                py: 0.875,
                fontSize: "0.75rem",
                border: `0.5px solid ${formErrors.amount ? "#EF4444" : "#D1D5DB"}`,
                borderRadius: "8px",
                outline: "none",
                fontFamily: "inherit",
                background: "#FAFAFA",
              }}
            />
          </Box>
          {formErrors.amount && (
            <Typography sx={{ fontSize: "0.58rem", color: "#EF4444", mt: 0.3 }}>
              {formErrors.amount}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Supplier PO picker
  return (
    <Box>
      {linkError && (
        <Box
          sx={{
            mx: 1.5,
            mt: 1,
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
            {linkError}
          </Typography>
        </Box>
      )}

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
        }}
      >
        {posLoading ? (
          <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={18} />
          </Box>
        ) : availablePOs.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF" }}>
              No available purchase orders for this supplier.
            </Typography>
          </Box>
        ) : (
          availablePOs.map((po, idx) => {
            const options = po.purchase_order_options ?? [];
            const poTotal = options.reduce(
              (sum, opt) =>
                sum +
                (opt.purchase_option?.nQuantity || 0) *
                  (opt.purchase_option?.dUnitPrice || 0),
              0,
            );
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
                  }}
                >
                  <ReceiptLongOutlined
                    sx={{ fontSize: "0.85rem", color: "#3B82F6" }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {po.strPurchaseOrderNo ?? `PO #${po.nPurchaseOrderId}`}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.58rem", color: "#9CA3AF", mt: 0.2 }}
                  >
                    {options.length} {options.length === 1 ? "item" : "items"}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#D85A30",
                  }}
                >
                  {fmtPHP(poTotal)}
                </Typography>
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
                          textTransform: "uppercase",
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
}
