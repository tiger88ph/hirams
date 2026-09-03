import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import { ReceiptLongOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import { fmtPHP } from "../../../../../utils/formatters/formatter";
import getThemeColors from "../../../../../utils/style/getThemeColors";
import PORowPanel from "./PORowPanel";

const useColors = (c) => ({
  border: c.slate.border,
  scrollbarThumb: c.slate.scrollbarThumb,
  totalBg: c.slate.totalBg,
  totalBorder: c.slate.totalBorder,
  blue: { bg: c.blue.bg, border: c.blue.border, text: c.blue.text },
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
  orange: { text: c.orange.text },
});

export default function POListPanel({
  supplierLinks = [],
  onRemovePO,
  isJEVPage = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);
  const [openRows, setOpenRows] = useState({});

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      await onRemovePO?.(id);
    } finally {
      setRemovingId(null);
    }
  };

  const toggleRow = (id) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (purchaseOrderId) => {
    navigate(`/purchase-cart-update?id=${purchaseOrderId}`);
  };

  const grandTotal = supplierLinks.reduce((sum, link) => {
    const opts = link.purchase_order?.purchase_order_options || [];
    return (
      sum +
      opts.reduce(
        (s, opt) =>
          s +
          (opt.purchase_option?.nQuantity || 0) *
            (opt.purchase_option?.dUnitPrice || 0),
        0,
      )
    );
  }, 0);

  const grandEwtTotal = supplierLinks.reduce((sum, link) => {
    const opts = link.purchase_order?.purchase_order_options || [];
    return (
      sum +
      opts.reduce((s, opt) => s + Number(opt.purchase_option?.dEWT || 0), 0)
    );
  }, 0);

  if (supplierLinks.length === 0) {
    return (
      <Box
        sx={{
          mx: 1.5,
          mb: 1.5,
          borderRadius: "10px",
          border: `0.5px solid ${colors.border}`,
          px: 2,
          py: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: "0.65rem", color: colors.gray.textMuted }}>
          No purchase orders linked.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: "10px",
        border: `0.5px solid ${colors.border}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "60vh",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: 3 },
          "&::-webkit-scrollbar-thumb": {
            background: colors.scrollbarThumb,
            borderRadius: 2,
          },
        }}
      >
        {supplierLinks.map((link, idx) => {
          const rowId = link.nVoucherSupplierId;
          const isOpen = !!openRows[rowId];
          const isRemoving = removingId === rowId;

          return (
            <PORowPanel
              key={rowId}
              link={link}
              idx={idx}
              totalCount={supplierLinks.length}
              isOpen={isOpen}
              isRemoving={isRemoving}
              onToggle={() => toggleRow(rowId)}
              onRemove={onRemovePO ? () => handleRemove(rowId) : undefined}
              onNavigate={handleNavigate}
              isJEVPage={isJEVPage}
            />
          );
        })}
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: colors.totalBg,
          borderTop: `1px solid ${colors.totalBorder}`,
          flexShrink: 0,
          zIndex: 5,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: colors.blue.bg,
            border: `0.5px solid ${colors.blue.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1,
            flexShrink: 0,
          }}
        >
          <ReceiptLongOutlined
            sx={{ fontSize: "0.85rem", color: colors.blue.text }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: colors.gray.textPrimary,
            }}
          >
            Grand Total
          </Typography>
          <Typography
            sx={{ fontSize: "0.54rem", color: colors.gray.textSecondary }}
          >
            {supplierLinks.length} PO{supplierLinks.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: colors.orange.text,
              textAlign: "right",
            }}
          >
            {fmtPHP(grandTotal)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.57rem",
              fontWeight: 500,
              fontStyle: "italic",
              color: colors.gray.textSecondary,
              textAlign: "right",
              lineHeight: 0.5,
            }}
          >
            {grandEwtTotal > 0 ? `EWT: ${fmtPHP(grandEwtTotal)}` : "No EWT"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
