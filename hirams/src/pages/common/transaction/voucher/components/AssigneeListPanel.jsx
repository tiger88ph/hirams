import { useState, useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { ReceiptLongOutlined } from "@mui/icons-material";
import { fmtPHP } from "../../../../../utils/formatters/formatter";
import getThemeColors from "../../../../../utils/style/getThemeColors";
import AssigneeRowPanel from "./AssigneeRowPanel";

const useColors = (c) => ({
  border: c.slate.border,
  totalBg: c.slate.totalBg,
  totalBorder: c.slate.totalBorder,
  purple: { bg: c.purple.bg, border: c.purple.border, text: c.purple.text },
  gray: {
    textMuted: c.gray.textMuted,
    textSecondary: c.gray.textSecondary,
    label: c.gray.label,
  },
  orange: { text: c.orange.text },
});

export default function AssigneeListPanel({
  assigneeLinks = [],
  onEdit,
  onDelete,
  voucherActiveKey,
  voucher,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [removingId, setRemovingId] = useState(null);

  const handleDelete = async (id) => {
    setRemovingId(id);
    try {
      await onDelete?.(id);
    } finally {
      setRemovingId(null);
    }
  };

  const grandTotal = assigneeLinks.reduce(
    (sum, a) => sum + Number(a.dAmount || 0) * Number(a.nQuantity || 1),
    0,
  );

  if (assigneeLinks.length === 0) {
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
          No assignee entries linked.
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
      }}
    >
      <Box sx={{ maxHeight: "25vh", overflowY: "auto", overflowX: "hidden" }}>
        {assigneeLinks.map((assignee, idx) => (
          <AssigneeRowPanel
            key={assignee.nVoucherAssigneeId ?? idx}
            assignee={assignee}
            idx={idx}
            totalCount={assigneeLinks.length}
            isRemoving={removingId === assignee.nVoucherAssigneeId}
            onEdit={onEdit}
            onDelete={
              onDelete
                ? () => handleDelete(assignee.nVoucherAssigneeId)
                : undefined
            }
            voucherActiveKey={voucherActiveKey}
            voucher={voucher}
          />
        ))}
      </Box>

      {/* Grand Total Footer — Sticky */}
      <Box
        sx={{
          px: 1.5,
          py: 0.875,
          display: "flex",
          alignItems: "center",
          background: colors.totalBg,
          borderTop: `1px solid ${colors.totalBorder}`,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "7px",
            background: colors.purple.bg,
            border: `0.5px solid ${colors.purple.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1,
            flexShrink: 0,
          }}
        >
          <ReceiptLongOutlined
            sx={{ fontSize: "0.85rem", color: colors.purple.text }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: "0.67rem",
              fontWeight: 700,
              color: colors.gray.label,
            }}
          >
            Grand Total
          </Typography>
          <Typography
            sx={{ fontSize: "0.54rem", color: colors.gray.textSecondary }}
          >
            {assigneeLinks.length}{" "}
            {assigneeLinks.length !== 1 ? "entries" : "entry"}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 800,
            color: colors.orange.text,
          }}
        >
          {fmtPHP(grandTotal)}
        </Typography>
      </Box>
    </Box>
  );
}
