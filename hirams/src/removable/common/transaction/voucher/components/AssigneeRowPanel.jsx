import { useMemo } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import {
  EditOutlined,
  DeleteOutlineOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";
import { fmtPHP } from "../../../../../utils/formatters/formatter";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const useColors = (c) => ({
  itemHeaderBg: c.slate.itemHeaderBg,
  divider: c.slate.divider,
  hover: c.slate.hover,
  outerBg: c.slate.outerBg,
  purple: { bg: c.purple.bg, border: c.purple.border, text: c.purple.text },
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
  blue: { text: c.blue.text },
  red: { text: c.red.text },
});

export default function AssigneeRowPanel({
  assignee,
  idx,
  totalCount,
  isRemoving,
  onEdit,
  onDelete,
  voucher,
  voucherActiveKey,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const qty = Number(assignee.nQuantity || 1);
  const unitAmount = Number(assignee.dAmount || 0);
  const lineTotal = qty * unitAmount;

  // Fixed: `!String(x) === String(y)` always evaluates to false (negating a
  // string then comparing the boolean to a string), so this never matched.
  const isVoucherOpen = String(voucher?.cStatus) === String(voucherActiveKey);

  const companyName =
    voucher?.company?.strCompanyNickName ||
    assignee?.voucher?.company?.strCompanyNickName ||
    "—";

  return (
    <>
      {/* COLUMN HEADER */}
      {idx === 0 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: 1,
            background: colors.itemHeaderBg,
            borderBottom: `0.5px solid ${colors.divider}`,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Box sx={{ width: 16, flexShrink: 0 }} />
          <Box sx={{ width: 30, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <Typography
              sx={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
                letterSpacing: "0.03em",
              }}
            >
              ITEM
            </Typography>
          </Box>
          <Box sx={{ width: 60, textAlign: "center", flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
                letterSpacing: "0.03em",
              }}
            >
              QTY
            </Typography>
          </Box>
          <Box sx={{ width: 80, textAlign: "center", flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
                letterSpacing: "0.03em",
              }}
            >
              UNIT PRICE
            </Typography>
          </Box>
          <Box sx={{ width: 80, textAlign: "center", flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
                letterSpacing: "0.03em",
              }}
            >
              TOTAL
            </Typography>
          </Box>
          {isVoucherOpen && <Box sx={{ width: 48, flexShrink: 0 }} />}
        </Box>
      )}

      {/* DATA ROW */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 0.75, sm: 1 },
          justifyContent: { sm: "space-between" },
          borderBottom:
            idx < totalCount - 1 ? `0.5px solid ${colors.divider}` : "none",
          "&:hover": { background: colors.hover },
        }}
      >
        {/* LEFT: Icon + Particulars + Company */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            flex: { sm: 1 },
            minWidth: 0,
          }}
        >
          <Box sx={{ position: "relative", flexShrink: 0, mt: 0.25 }}>
            <Box
              sx={{
                width: { xs: 26, sm: 30 },
                height: { xs: 26, sm: 30 },
                borderRadius: "7px",
                background: colors.purple.bg,
                border: `0.5px solid ${colors.purple.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Inventory2Outlined
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                  color: colors.purple.text,
                }}
              />
            </Box>
            {/* Number badge */}
            <Box
              sx={{
                position: "absolute",
                top: -5,
                left: -5,
                minWidth: 13,
                height: 13,
                px: 0.25,
                borderRadius: "50px",
                background: colors.gray.textSecondary,
                border: `1.5px solid ${colors.outerBg}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.4rem",
                  fontWeight: 600,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {idx + 1}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: { xs: "0.65rem", sm: "0.72rem" },
                fontWeight: 400,
                color: colors.gray.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {assignee.strParticular ?? "—"}
            </Typography>
            {companyName && (
              <Typography
                sx={{
                  fontSize: { xs: "0.5rem", sm: "0.56rem" },
                  color: colors.gray.textMuted,
                  mt: 0.1,
                }}
              >
                {companyName}
              </Typography>
            )}
          </Box>

          {/* MOBILE: Action buttons inline */}
          {isVoucherOpen && (
            <Box
              sx={{
                display: { xs: "flex", sm: "none" },
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 0.25,
                flexShrink: 0,
                ml: "auto",
              }}
            >
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={() => onEdit(assignee)}
                  sx={{
                    width: 20,
                    height: 20,
                    color: colors.blue.text,
                    opacity: 0.6,
                    p: 0,
                  }}
                >
                  <EditOutlined sx={{ fontSize: "0.75rem" }} />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small"
                  disabled={isRemoving}
                  onClick={onDelete}
                  sx={{
                    width: 20,
                    height: 20,
                    color: colors.red.text,
                    opacity: isRemoving ? 1 : 0.6,
                    p: 0,
                  }}
                >
                  {isRemoving ? (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        border: `1.5px solid ${colors.red.text}`,
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
          )}
        </Box>

        {/* QTY | UNIT PRICE | TOTAL */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "grid", sm: "row" },
            gridTemplateColumns: { xs: "repeat(3, 1fr)" },
            gap: { xs: 0.5, sm: 0 },
            alignItems: { xs: "start", sm: "center" },
            justifyContent: { xs: "space-between", sm: "flex-end" },
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: { sm: 60 },
              textAlign: { xs: "right", sm: "center" },
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                display: { xs: "block", sm: "none" },
                fontSize: "0.45rem",
                color: colors.gray.textSecondary,
                mb: 0.1,
              }}
            >
              QTY
            </Typography>
            <Typography
              sx={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
              }}
            >
              {qty}{" "}
              <Typography
                component="span"
                sx={{ fontSize: "0.5rem", color: colors.gray.textSecondary }}
              >
                {assignee.strUOM}
              </Typography>
            </Typography>
          </Box>
          <Box sx={{ width: { sm: 80 }, textAlign: "right", flexShrink: 0 }}>
            <Typography
              sx={{
                display: { xs: "block", sm: "none" },
                fontSize: "0.45rem",
                color: colors.gray.textSecondary,
                mb: 0.1,
              }}
            >
              Unit Price
            </Typography>
            <Typography
              sx={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
              }}
            >
              {fmtPHP(unitAmount)}
            </Typography>
          </Box>
          <Box sx={{ width: { sm: 80 }, textAlign: "right", flexShrink: 0 }}>
            <Typography
              sx={{
                display: { xs: "block", sm: "none" },
                fontSize: "0.45rem",
                color: colors.gray.textSecondary,
                mb: 0.1,
              }}
            >
              Total
            </Typography>
            <Typography
              sx={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: colors.gray.textSecondary,
              }}
            >
              {fmtPHP(lineTotal)}
            </Typography>
          </Box>
        </Box>

        {/* DESKTOP: Action buttons after Total */}
        {isVoucherOpen && (
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              justifyContent: "center",
              alignItems: "center",
              gap: 0.25,
              width: 48,
              flexShrink: 0,
            }}
          >
            {onEdit && (
              <IconButton
                size="small"
                onClick={() => onEdit(assignee)}
                sx={{
                  width: 20,
                  height: 20,
                  color: colors.blue.text,
                  opacity: 0.6,
                  p: 0,
                }}
              >
                <EditOutlined sx={{ fontSize: "0.75rem" }} />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                disabled={isRemoving}
                onClick={onDelete}
                sx={{
                  width: 20,
                  height: 20,
                  color: colors.red.text,
                  opacity: isRemoving ? 1 : 0.6,
                  p: 0,
                }}
              >
                {isRemoving ? (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      border: `1.5px solid ${colors.red.text}`,
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
        )}
      </Box>
    </>
  );
}
