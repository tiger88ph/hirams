import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { TaskAltOutlined } from "@mui/icons-material";
import getThemeColors from "../../../../utils/style/getThemeColors.js";
import { getDelivered } from "../../../../utils/helpers/purchaseProgress.js";

const num = (v) => Number(v) || 0;

/**
 * Delivered phase (status 160) of the PO detail page.
 * Read-only list of the items that already went out — approved (A) + pending
 * (P) rows both count. Anything still undelivered is handled in For Delivery.
 */
export default function DeliveredPanel({ options = [], txnTotals }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const { slate, gray, blue } = base;
  const getKey = (opt, idx) => opt.purchase_option?.nPurchaseItemId ?? idx;

  const delivered = (opt) => getDelivered(opt?.purchase_option);

  // Hide items that have nothing delivered yet — same rule as the Delivered
  // card in the list. The card itself always stays visible.
  const visible = React.useMemo(
    () =>
      options
        .map((opt, origIdx) => ({ opt, origIdx }))
        .filter(({ opt }) => delivered(opt) > 0),
    [options]
  );

  return (
    <>
      {/* Section header */}
      <Box
        sx={{
          pt: 1,
          pb: 1.5,
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
            color: gray.textDisabled,
          }}
        >
          Purchase Items
        </Typography>
        <Box sx={{ flex: 1, height: "0.5px", background: slate.border }} />
      </Box>

      <Box
        sx={{
          border: `0.5px solid ${slate.border}`,
          borderRadius: 1,
          background: slate.outerBg,
          overflow: "hidden",
        }}
      >
        {visible.length === 0 && (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography sx={{ fontSize: "0.6rem", color: gray.textSecondary }}>
              No delivered items yet.
            </Typography>
          </Box>
        )}

        {visible.map(({ opt, origIdx }, idx) => {
          const p = opt.purchase_option;
          // Combined across every PO of the transaction so the row matches
          // the card (5 + 7 = 12).
          const total = txnTotals?.[p?.transaction_item?.nTransactionItemId];
          const cDlvd = total ? total.dlvd : num(p?.nDeliveredQty);

          return (
            <Box
              key={getKey(opt, origIdx)}
              sx={{
                borderBottom:
                  idx < visible.length - 1
                    ? `0.5px solid ${slate.divider}`
                    : "none",
              }}
            >
              {/* ROW */}
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  "&:hover": { background: slate.itemHover },
                  transition: "background 0.15s",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "6px",
                        background: slate.mutedBg,
                        border: `0.5px solid ${slate.mutedBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TaskAltOutlined
                        sx={{ fontSize: "0.75rem", color: slate.mutedColor }}
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
                        background: gray.textSecondary,
                        border: `1.5px solid ${slate.outerBg}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                        {idx + 1}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
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
                            color: gray.textPrimary,
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
                        color: gray.textSecondary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p?.transaction_item?.strName ?? "—"}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: Delivered total */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 92,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 0.2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.48rem",
                        fontWeight: 700,
                        color: gray.textSecondary,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        lineHeight: 1,
                      }}
                    >
                      Delivered
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        lineHeight: 1,
                        color:
                          cDlvd > 0 ? blue.textStrong : gray.textSecondary,
                      }}
                    >
                      {cDlvd}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "0.5rem",
                          ml: 0.3,
                          color: gray.textSecondary,
                        }}
                      >
                        {p?.strUOM}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
}
