
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowBack, ShoppingCart } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";
import api from "../../../utils/api/api";

const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TransactionForPurchase() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { currentStatusLabel, transaction } = state || {};
  const transactionCode =
    transaction?.strCode || transaction?.transactionId || "";

  const [checkedOptions, setCheckedOptions] = useState(new Set());
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const txnId = transaction?.nTransactionId ?? transaction?.id;
    if (!txnId) return;
    api
      .get(`transactions/${txnId}/items`)
      .then((res) =>
        setItems(
          (res.items || []).map((item) => ({
            ...item,
            purchaseOptions: item.purchaseOptions || [],
          })),
        ),
      )
      .catch(console.error)
      .finally(() => setItemsLoading(false));
  }, [transaction?.nTransactionId, transaction?.id]);

  /* ── derived ── */
  const allOptionIds = items.flatMap((item) =>
    item.purchaseOptions.map((o) => o.id),
  );
  const isAllSelected =
    allOptionIds.length > 0 &&
    allOptionIds.every((id) => checkedOptions.has(id));

  const cart = items.flatMap((item) =>
    item.purchaseOptions
      .filter((o) => checkedOptions.has(o.id))
      .map((opt) => ({
        itemName: item.name,
        itemId: item.id,
        optId: opt.id,
        supplierName: opt.supplierName || opt.supplierNickName,
        brand: opt.strBrand,
        model: opt.strModel,
        qty: opt.nQuantity,
        uom: opt.strUOM,
        unitPrice: opt.dUnitPrice,
        total: Number(opt.nQuantity) * Number(opt.dUnitPrice),
        isAddon: Number(opt.bAddOn) === 1,
      })),
  );

  const grandTotal = cart.reduce((s, c) => s + c.total, 0);

  const cartBySupplier = cart.reduce((acc, c) => {
    const key = c.supplierName || "Unknown Supplier";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  /* ── supplier map for items view ── */
  const supplierMap = {};
  items.forEach((item) => {
    item.purchaseOptions.forEach((opt) => {
      const key = opt.supplierName || opt.supplierNickName || "Unknown Supplier";
      if (!supplierMap[key]) supplierMap[key] = [];
      supplierMap[key].push({ ...opt, _item: item });
    });
  });

  /* ── toggle handlers ── */
  const toggleOption = (optId) =>
    setCheckedOptions((prev) => {
      const next = new Set(prev);
      next.has(optId) ? next.delete(optId) : next.add(optId);
      return next;
    });

  const toggleSupplierAll = (opts, checked) =>
    setCheckedOptions((prev) => {
      const next = new Set(prev);
      opts.forEach((o) => (checked ? next.add(o.id) : next.delete(o.id)));
      return next;
    });

  const toggleSelectAll = (checked) =>
    setCheckedOptions(checked ? new Set(allOptionIds) : new Set());

  const removeFromCart = (optId) =>
    setCheckedOptions((prev) => {
      const next = new Set(prev);
      next.delete(optId);
      return next;
    });

  /* ── styles ── */
  const cardSx = {
    background: "#fff",
    border: "0.5px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  };

  const colHeaderSx = {
    display: "flex",
    alignItems: "center",
    px: 1.5,
    py: 0.75,
    background: "#f8fafc",
    borderBottom: "0.5px solid #e2e8f0",
    fontSize: "0.68rem",
    fontWeight: 600,
    color: "#94a3b8",
    gap: 1,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const optRowSx = (checked) => ({
    display: "flex",
    alignItems: "center",
    px: 1.5,
    py: 1,
    gap: 1,
    borderBottom: "0.5px solid #f1f5f9",
    background: checked ? "#eff6ff" : "#fff",
    cursor: "pointer",
    "&:last-child": { borderBottom: "none" },
    "&:hover": { background: checked ? "#dbeafe" : "#f8fafc" },
    transition: "background .12s",
  });

  const AddonBadge = () => (
    <Box
      component="span"
      sx={{
        fontSize: "0.58rem",
        background: "#fef9c3",
        color: "#854d0e",
        border: "0.5px solid #fde047",
        borderRadius: "4px",
        px: 0.6,
        py: 0.15,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      Add-on
    </Box>
  );

  return (
    <PageLayout
      title="Transaction"
      subtitle={` / ${currentStatusLabel} / ${transactionCode}`}
      loading={itemsLoading}
      headerRight={
        <button
          onClick={() => setShowCart((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 12px",
            background: showCart ? "#1565c0" : "#fff",
            color: showCart ? "#fff" : "#475569",
            border: `1px solid ${showCart ? "#1565c0" : "#cbd5e1"}`,
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.68rem",
            fontWeight: 600,
            position: "relative",
            transition: "all .15s",
          }}
        >
          <ShoppingCart sx={{ fontSize: "0.9rem" }} />
          Cart
          {cart.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: -7,
                right: -7,
                background: "#ee4d2d",
                color: "#fff",
                borderRadius: "50%",
                width: 17,
                height: 17,
                fontSize: "0.58rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                border: "1.5px solid #fff",
              }}
            >
              {cart.length}
            </span>
          )}
        </button>
      }
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => navigate(-1)}
            actionColor="back"
          />
          {showCart && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                  Grand Total
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#0c4a6e" }}>
                  ₱ {fmt(grandTotal)}
                </Typography>
              </Box>
              <BaseButton
                label="Proceed to Order"
                disabled={cart.length === 0}
                actionColor="finalize"
                onClick={() => { /* hook up your order action here */ }}
              />
            </Box>
          )}
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

        {/* ── Transaction info card ── */}
        <Box sx={cardSx}>
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Box
                sx={{
                  fontSize: "0.63rem",
                  background: "#bae6fd",
                  color: "#0c4a6e",
                  border: "0.5px solid #7dd3fc",
                  borderRadius: "5px",
                  px: 1,
                  py: 0.25,
                  display: "inline-block",
                  mb: 0.5,
                  fontWeight: 600,
                }}
              >
                # {transactionCode}
              </Box>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c4a6e", lineHeight: 1.3 }}>
                {transaction?.clientName || "—"}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontStyle: "italic" }}>
                {transaction?.strTitle || transaction?.transactionName || "—"}
              </Typography>
            </Box>

            {/* Cart pill */}
            <Box
              onClick={() => setShowCart((p) => !p)}
              sx={{
                background: cart.length > 0 ? (showCart ? "#1565c0" : "#0369a1") : "#f1f5f9",
                color: cart.length > 0 ? "#fff" : "#94a3b8",
                borderRadius: "20px",
                px: 1.75,
                py: 0.6,
                fontSize: "0.68rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                cursor: cart.length > 0 ? "pointer" : "default",
                transition: "background .2s",
                userSelect: "none",
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 18,
                  height: 18,
                  background: cart.length > 0 ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                }}
              >
                {cart.length}
              </Box>
              {cart.length > 0 ? `₱ ${fmt(grandTotal)}` : "Cart empty"}
            </Box>
          </Box>
        </Box>

        {/* ════════════ ITEMS VIEW ════════════ */}
        {!showCart && (
          <>
            {/* Select all bar */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.875,
                background: "#fff",
                border: "0.5px solid #e2e8f0",
                borderRadius: "8px",
              }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: "#1565c0", cursor: "pointer" }}
              />
              <Typography sx={{ fontSize: "0.75rem", color: "#334155", fontWeight: 500 }}>
                Select all options
              </Typography>
              <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                {checkedOptions.size > 0 && (
                  <Box
                    sx={{
                      fontSize: "0.63rem",
                      background: "#dbeafe",
                      color: "#1e40af",
                      border: "0.5px solid #bfdbfe",
                      borderRadius: "5px",
                      px: 0.75,
                      py: 0.2,
                      fontWeight: 600,
                    }}
                  >
                    {checkedOptions.size} selected · ₱ {fmt(grandTotal)}
                  </Box>
                )}
                {checkedOptions.size === 0 && (
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    0 selected
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Supplier cards */}
            {items.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, color: "#94a3b8", fontSize: "0.75rem", fontStyle: "italic" }}>
                No items available.
              </Box>
            ) : Object.keys(supplierMap).length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, color: "#94a3b8", fontSize: "0.75rem", fontStyle: "italic" }}>
                No purchase options available.
              </Box>
            ) : (
              Object.entries(supplierMap).map(([supplierName, opts]) => {
                const allSupplierChecked = opts.every((o) => checkedOptions.has(o.id));
                const someChecked = opts.some((o) => checkedOptions.has(o.id));
                const supplierTotal = opts
                  .filter((o) => checkedOptions.has(o.id))
                  .reduce((s, o) => s + Number(o.nQuantity) * Number(o.dUnitPrice), 0);

                return (
                  <Box key={supplierName} sx={cardSx}>
                    {/* Supplier header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        background: "linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)",
                        borderBottom: "0.5px solid #bfdbfe",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allSupplierChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allSupplierChecked; }}
                        onChange={(e) => toggleSupplierAll(opts, e.target.checked)}
                        style={{ width: 15, height: 15, accentColor: "#1565c0", cursor: "pointer" }}
                      />
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          background: "#1565c0",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Typography sx={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700, lineHeight: 1 }}>
                          {supplierName.charAt(0).toUpperCase()}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0c4a6e", flex: 1 }}>
                        {supplierName}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        {supplierTotal > 0 && (
                          <Box
                            sx={{
                              fontSize: "0.65rem",
                              background: "#dcfce7",
                              color: "#15803d",
                              border: "0.5px solid #bbf7d0",
                              borderRadius: "5px",
                              px: 0.75,
                              py: 0.2,
                              fontWeight: 600,
                            }}
                          >
                            ₱ {fmt(supplierTotal)}
                          </Box>
                        )}
                        <Box
                          sx={{
                            fontSize: "0.63rem",
                            background: "#dbeafe",
                            color: "#1e40af",
                            border: "0.5px solid #bfdbfe",
                            borderRadius: "5px",
                            px: 0.75,
                            py: 0.2,
                            fontWeight: 600,
                          }}
                        >
                          {opts.length} option{opts.length !== 1 ? "s" : ""}
                        </Box>
                      </Box>
                    </Box>

                    {/* Col header */}
                    <Box sx={colHeaderSx}>
                      <Box sx={{ width: 15, flexShrink: 0 }} />
                      <Box sx={{ flex: 2.5 }}>Item</Box>
                      <Box sx={{ flex: 2 }}>Brand / Model</Box>
                      <Box sx={{ flex: 1, textAlign: "center" }}>Qty</Box>
                      <Box sx={{ flex: 1.5, textAlign: "right" }}>Unit Price</Box>
                      <Box sx={{ flex: 1.5, textAlign: "right" }}>Total</Box>
                      <Box sx={{ flex: 0.5, textAlign: "center" }}>Tag</Box>
                    </Box>

                    {/* Option rows */}
                    {opts.map((opt) => {
                      const isChecked = checkedOptions.has(opt.id);
                      const isAddon = Number(opt.bAddOn) === 1;
                      const total = Number(opt.nQuantity) * Number(opt.dUnitPrice);
                      return (
                        <Box key={opt.id} sx={optRowSx(isChecked)} onClick={() => toggleOption(opt.id)}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOption(opt.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: 15, height: 15, accentColor: "#1565c0", cursor: "pointer", flexShrink: 0 }}
                          />
                          <Box sx={{ flex: 2.5, minWidth: 0 }}>
                            <Typography
                              sx={{ fontSize: "0.72rem", fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              <Box component="span" sx={{ color: "#0369a1", fontWeight: 700, mr: 0.5 }}>
                                {opt._item.nItemNumber}.
                              </Box>
                              {opt._item.name}
                            </Typography>
                            <Typography sx={{ fontSize: "0.63rem", color: "#94a3b8" }}>
                              Need: {opt._item.qty} {opt._item.uom}
                            </Typography>
                          </Box>
                          <Typography sx={{ flex: 2, fontSize: "0.71rem", color: "#64748b" }}>
                            {opt.strBrand || "—"}{opt.strModel ? ` | ${opt.strModel}` : ""}
                          </Typography>
                          <Typography sx={{ flex: 1, fontSize: "0.71rem", textAlign: "center", color: "#334155" }}>
                            {opt.nQuantity} {opt.strUOM}
                          </Typography>
                          <Typography sx={{ flex: 1.5, fontSize: "0.71rem", textAlign: "right", fontWeight: 500, color: "#0c4a6e" }}>
                            ₱ {fmt(opt.dUnitPrice)}
                          </Typography>
                          <Typography sx={{ flex: 1.5, fontSize: "0.71rem", textAlign: "right", fontWeight: 600, color: isChecked ? "#15803d" : "#334155" }}>
                            ₱ {fmt(total)}
                          </Typography>
                          <Box sx={{ flex: 0.5, textAlign: "center" }}>
                            {isAddon && <AddonBadge />}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })
            )}
          </>
        )}

        {/* ════════════ CART VIEW ════════════ */}
        {showCart && (
          <Box sx={cardSx}>
            {/* Cart header */}
            <Box
              sx={{
                px: 1.5,
                py: 1,
                background: "#f8fafc",
                borderBottom: "0.5px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <ShoppingCart sx={{ fontSize: "0.9rem", color: "#1565c0" }} />
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                  My Cart
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {cart.length} option{cart.length !== 1 ? "s" : ""} ·{" "}
                {Object.keys(cartBySupplier).length} supplier{Object.keys(cartBySupplier).length !== 1 ? "s" : ""}
              </Typography>
            </Box>

            {cart.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <ShoppingCart sx={{ fontSize: "2rem", color: "#e2e8f0", mb: 1 }} />
                <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                  No options selected yet.
                </Typography>
                <Typography
                  onClick={() => setShowCart(false)}
                  sx={{ fontSize: "0.7rem", color: "#1565c0", cursor: "pointer", mt: 0.5, "&:hover": { textDecoration: "underline" } }}
                >
                  Go back to select options
                </Typography>
              </Box>
            ) : (
              Object.entries(cartBySupplier).map(([supplierName, supplierItems], groupIdx) => {
                const supplierTotal = supplierItems.reduce((s, c) => s + c.total, 0);
                return (
                  <Box key={supplierName}>
                    {/* Supplier group header */}
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.7,
                        background: groupIdx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                        borderBottom: "0.5px solid #e2e8f0",
                        borderTop: groupIdx > 0 ? "2px solid #e2e8f0" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            background: "#1565c0",
                            borderRadius: "5px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.58rem", color: "#fff", fontWeight: 700 }}>
                            {supplierName.charAt(0).toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: "#1e293b" }}>
                          {supplierName}
                        </Typography>
                        <Box
                          sx={{
                            fontSize: "0.6rem",
                            background: "#dbeafe",
                            color: "#1e40af",
                            border: "0.5px solid #bfdbfe",
                            borderRadius: "4px",
                            px: 0.6,
                            py: 0.1,
                            fontWeight: 600,
                          }}
                        >
                          {supplierItems.length}
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: "0.73rem", fontWeight: 700, color: "#0c4a6e" }}>
                        ₱ {fmt(supplierTotal)}
                      </Typography>
                    </Box>

                    {/* Items under supplier */}
                    {supplierItems.map((c) => (
                      <Box
                        key={c.optId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.5,
                          py: 0.875,
                          borderBottom: "0.5px solid #f1f5f9",
                          "&:last-child": { borderBottom: "none" },
                          "&:hover": { background: "#fafbff" },
                          transition: "background .1s",
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{ fontSize: "0.73rem", fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {c.itemName}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
                            <Typography sx={{ fontSize: "0.65rem", color: "#64748b" }}>
                              {c.brand || "—"}{c.model ? ` | ${c.model}` : ""}
                            </Typography>
                            {c.isAddon && <AddonBadge />}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                            {c.qty} {c.uom} × ₱{fmt(c.unitPrice)}
                          </Typography>
                          <Typography sx={{ fontSize: "0.73rem", fontWeight: 700, color: "#15803d" }}>
                            ₱ {fmt(c.total)}
                          </Typography>
                        </Box>
                        <Box
                          component="button"
                          onClick={() => removeFromCart(c.optId)}
                          sx={{
                            background: "none",
                            border: "0.5px solid transparent",
                            cursor: "pointer",
                            color: "#cbd5e1",
                            fontSize: "1rem",
                            lineHeight: 1,
                            width: 22,
                            height: 22,
                            borderRadius: "5px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            "&:hover": { color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" },
                            transition: "all .12s",
                          }}
                        >
                          ×
                        </Box>
                      </Box>
                    ))}
                  </Box>
                );
              })
            )}

            {/* Grand total footer */}
            {cart.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  py: 1.25,
                  background: "#f0f7ff",
                  borderTop: "1.5px solid #bfdbfe",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.63rem", color: "#64748b", mb: 0.1 }}>
                    Grand Total ({Object.keys(cartBySupplier).length} supplier{Object.keys(cartBySupplier).length !== 1 ? "s" : ""}, {cart.length} option{cart.length !== 1 ? "s" : ""})
                  </Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#0c4a6e" }}>
                    ₱ {fmt(grandTotal)}
                  </Typography>
                </Box>
                <BaseButton
                  label="Proceed to Order"
                  disabled={cart.length === 0}
                  actionColor="finalize"
                  onClick={() => { /* hook up your order action here */ }}
                />
              </Box>
            )}
          </Box>
        )}

      </Box>
    </PageLayout>
  );
}

export default TransactionForPurchase;