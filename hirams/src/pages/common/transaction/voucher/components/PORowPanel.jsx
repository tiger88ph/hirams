import { useMemo } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import {
  ReceiptLongOutlined,
  KeyboardArrowUp,
  KeyboardArrowDown,
  DeleteOutlineOutlined,
  Inventory2Outlined,
  OpenInNew,
} from "@mui/icons-material";
import { fmtPHP } from "../../../../../utils/formatters/formatter";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const useColors = (c) => ({
  border: c.slate.border,
  divider: c.slate.divider,
  hover: c.slate.hover,
  expandedBg: c.slate.expandedBg,
  itemHeaderBg: c.slate.itemHeaderBg,
  itemHover: c.slate.itemHover,
  scrollbarThumb: c.slate.scrollbarThumb,
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  mutedColor: c.slate.mutedColor,
  outerBg: c.slate.outerBg,
  blue: {
    bg: c.blue.bg,
    border: c.blue.border,
    text: c.blue.text,
    hover: c.blue.hover,
  },
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
  },
  orange: { text: c.orange.text },
  amber: { text: c.amber.text },
  red: { text: c.red.text, bg: c.red.bg },
});

export default function PORowPanel({
  link,
  idx,
  totalCount,
  isOpen,
  isRemoving,
  onToggle,
  onRemove,
  onNavigate,
  isJEVPage = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const rowId = link.nVoucherSupplierId;
  const poNo =
    link.purchase_order?.strPurchaseOrderNo ?? `PO #${link.nPurchaseOrderId}`;
  const options = link.purchase_order?.purchase_order_options || [];

  const poTotal = options.reduce((sum, opt) => {
    const p = opt.purchase_option;
    return sum + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
  }, 0);

  const poQtyTotal = options.reduce(
    (sum, opt) => sum + Number(opt.purchase_option?.nQuantity || 0),
    0,
  );

  const poEwtTotal = options.reduce(
    (sum, opt) => sum + Number(opt.purchase_option?.dEWT || 0),
    0,
  );

  return (
    <Box
      sx={{
        borderBottom:
          idx < totalCount - 1 ? `0.5px solid ${colors.divider}` : "none",
      }}
    >
      {/* PO ROW HEADER */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          position: "sticky",
          top: 0,
          background: colors.hover,
          backdropFilter: "blur(6px)",
          zIndex: 2,
          "&:hover": { background: colors.hover },
          transition: "background 0.15s",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "0.52rem", sm: "0.56rem", md: "0.6rem" },
            fontWeight: 700,
            color: colors.gray.textMuted,
            width: 16,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {idx + 1}
        </Typography>

        <Box
          sx={{
            width: { xs: 26, sm: 30 },
            height: { xs: 26, sm: 30 },
            borderRadius: "7px",
            background: colors.blue.bg,
            border: `0.5px solid ${colors.blue.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ReceiptLongOutlined
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
              color: colors.blue.text,
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: "0.62rem", sm: "0.68rem", md: "0.72rem" },
              fontWeight: 700,
              color: colors.gray.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {poNo}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "0.48rem", sm: "0.54rem", md: "0.58rem" },
              color: colors.gray.textMuted,
              mt: 0.2,
            }}
          >
            {options.length > 0 && (
              <>
                {options[0].purchase_option?.transaction_item?.transaction
                  ?.strCode ?? "—"}
                {" - "}
              </>
            )}
            {options.length} {options.length === 1 ? "item" : "items"}
          </Typography>
        </Box>

        {/* Right-side cluster: total + action buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.35, sm: 0.5 },
            flexShrink: 0,
          }}
        >
          {!isOpen && totalCount > 1 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "0.65rem", sm: "0.72rem", md: "0.78rem" },
                  fontWeight: 800,
                  color: colors.orange.text,
                  textAlign: "right",
                }}
              >
                {fmtPHP(poTotal)}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "0.48rem", sm: "0.52rem", md: "0.57rem" },
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: colors.gray.textSecondary,
                  textAlign: "right",
                  lineHeight: 0.5,
                }}
              >
                {poEwtTotal > 0 ? `EWT: ${fmtPHP(poEwtTotal)}` : "No EWT"}
              </Typography>
            </Box>
          )}
          {options.length > 0 && (
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{
                width: { xs: 18, sm: 20 },
                height: { xs: 18, sm: 20 },
                color: colors.gray.textMuted,
                border: `0.5px solid ${colors.border}`,
                borderRadius: "50px",
                p: 0,
              }}
            >
              {isOpen ? (
                <KeyboardArrowUp
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                />
              ) : (
                <KeyboardArrowDown
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                />
              )}
            </IconButton>
          )}
          {!isJEVPage && (
            <IconButton
              size="small"
              onClick={() => onNavigate?.(link.nPurchaseOrderId)}
              sx={{
                width: { xs: 18, sm: 20 },
                height: { xs: 18, sm: 20 },
                color: colors.blue.text,
                border: `0.5px solid ${colors.blue.border}`,
                borderRadius: "50px",
                background: colors.blue.bg,
                p: 0,
                "&:hover": { background: colors.blue.hover },
              }}
              title="View PO"
            >
              <OpenInNew sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }} />
            </IconButton>
          )}
          {onRemove && (
            <IconButton
              size="small"
              disabled={isRemoving}
              onClick={onRemove}
              sx={{
                width: { xs: 18, sm: 20 },
                height: { xs: 18, sm: 20 },
                color: colors.red.text,
                opacity: isRemoving ? 0.4 : 0.6,
                "&:hover": { background: colors.red.bg, opacity: 1 },
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
                <DeleteOutlineOutlined
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                />
              )}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* EXPANDED ITEMS */}
      {isOpen && options.length > 0 && (
        <Box
          sx={{
            background: colors.expandedBg,
            borderTop: `0.5px solid ${colors.divider}`,
            display: "flex",
            flexDirection: "column",
            maxHeight: "30vh",
          }}
        >
          {/* ITEMS HEADER — Desktop only */}
          <Box
            sx={{
              px: 2,
              py: 1,
              pl: 2,
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              justifyContent: "space-between",
              background: colors.itemHeaderBg,
              backdropFilter: "blur(6px)",
              borderBottom: `0.5px solid ${colors.divider}`,
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box sx={{ width: 26, flexShrink: 0, textAlign: "center" }} />
              <Typography
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: colors.gray.textSecondary,
                  letterSpacing: "0.03em",
                }}
              >
                ITEMS
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexShrink: 0,
              }}
            >
              {poEwtTotal > 0 && (
                <Box sx={{ minWidth: 70, textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      color: colors.gray.textSecondary,
                      letterSpacing: "0.03em",
                    }}
                  >
                    EWT
                  </Typography>
                </Box>
              )}
              <Box sx={{ minWidth: 60, textAlign: "center" }}>
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
              <Box sx={{ minWidth: 80, textAlign: "center" }}>
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
              <Box sx={{ minWidth: 80, textAlign: "center" }}>
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
            </Box>
          </Box>

          {/* SCROLLABLE ITEMS BODY */}
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
            {options.map((opt, i) => {
              const p = opt.purchase_option;
              const lineTotal = (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
              const ewtAmount = Number(p?.dEWT || 0);

              return (
                <Box
                  key={opt.nPurchaseOrder_OptionId ?? i}
                  sx={{
                    px: 2,
                    py: 1,
                    pl: 2,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: { xs: 0.75, sm: 0 },
                    justifyContent: "space-between",
                    borderBottom:
                      i < options.length - 1
                        ? `0.5px solid ${colors.divider}`
                        : "none",
                    "&:hover": { background: colors.itemHover },
                  }}
                >
                  {/* LEFT — Item Info with numbered badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box sx={{ position: "relative", flexShrink: 0, mt: 0.25 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "6px",
                          background: colors.mutedBg,
                          border: `0.5px solid ${colors.mutedBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Inventory2Outlined
                          sx={{ fontSize: "0.75rem", color: colors.mutedColor }}
                        />
                      </Box>
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
                            fontWeight: 700,
                            color: "#fff",
                            lineHeight: 1,
                          }}
                        >
                          {i + 1}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          mb: 0.2,
                          flexWrap: "wrap",
                        }}
                      >
                        {(p?.strBrand || p?.strModel) && (
                          <Typography
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              color: colors.gray.textPrimary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {[p?.strBrand, p?.strModel]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.58rem",
                          color: colors.gray.textSecondary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p?.transaction_item?.strName ?? "—"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* RIGHT — Item values */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "grid", sm: "row" },
                      gridTemplateColumns: { xs: "repeat(4, 1fr)" },
                      gap: { xs: 0.5, sm: 3 },
                      alignItems: { xs: "start", sm: "center" },
                      justifyContent: { xs: "space-between", sm: "flex-end" },
                      flexShrink: 0,
                    }}
                  >
                    {poEwtTotal > 0 && (
                      <Box
                        sx={{
                          minWidth: { sm: 70 },
                          textAlign: { xs: "right", sm: "right" },
                        }}
                      >
                        <Typography
                          sx={{
                            display: { xs: "block", sm: "none" },
                            fontSize: "0.45rem",
                            color: colors.gray.textSecondary,
                            lineHeight: 1,
                            mb: 0.1,
                          }}
                        >
                          EWT
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            color: colors.gray.textSecondary,
                          }}
                        >
                          {ewtAmount > 0 ? fmtPHP(ewtAmount) : "--"}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        minWidth: { sm: 60 },
                        textAlign: { xs: "right", sm: "right" },
                      }}
                    >
                      <Typography
                        sx={{
                          display: { xs: "block", sm: "none" },
                          fontSize: "0.45rem",
                          color: colors.gray.textSecondary,
                          lineHeight: 1,
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
                          lineHeight: 1,
                        }}
                      >
                        {p?.nQuantity}{" "}
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "0.5rem",
                            color: colors.gray.textSecondary,
                          }}
                        >
                          {p?.strUOM}
                        </Typography>
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        minWidth: { sm: 80 },
                        textAlign: { xs: "right", sm: "right" },
                      }}
                    >
                      <Typography
                        sx={{
                          display: { xs: "block", sm: "none" },
                          fontSize: "0.45rem",
                          color: colors.gray.textSecondary,
                          lineHeight: 1,
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
                        {fmtPHP(p?.dUnitPrice)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        minWidth: { sm: 80 },
                        textAlign: { xs: "right", sm: "right" },
                      }}
                    >
                      <Typography
                        sx={{
                          display: { xs: "block", sm: "none" },
                          fontSize: "0.45rem",
                          color: colors.gray.textSecondary,
                          lineHeight: 1,
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
                </Box>
              );
            })}
          </Box>

          {/* SUBTOTAL — Sticky bottom */}
          {totalCount > 1 && (
            <Box
              sx={{
                px: 2,
                py: 1,
                display: "flex",
                alignItems: "center",
                background: colors.itemHover,
                borderTop: `0.5px solid ${colors.divider}`,
                flexShrink: 0,
                position: "sticky",
                bottom: 0,
                zIndex: 4,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.67rem",
                    fontWeight: 700,
                    color: colors.gray.textPrimary,
                  }}
                >
                  Subtotal
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
                    color: colors.amber.text,
                    textAlign: "right",
                  }}
                >
                  {fmtPHP(poTotal)}
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
                  {poEwtTotal > 0 ? `EWT: ${fmtPHP(poEwtTotal)}` : "No EWT"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
