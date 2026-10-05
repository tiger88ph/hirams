import React from "react";
import { Box, Typography, Collapse, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalShippingOutlined, OutboxOutlined } from "@mui/icons-material";
import { fmtDate } from "../../../../utils/formatters/formatter.js";
import getThemeColors from "../../../../utils/style/getThemeColors.js";
import FormGrid from "../../../../components/ui/form/FormGrid.jsx";
import { getToDeliver } from "../../../../utils/helpers/purchaseProgress.js";

const num = (v) => Number(v) || 0;

export default function ForDeliveryPanel({
  options = [],
  forms,
  setForms,
  txnTotals,
  // One number for the whole card, pre-filled on every row — a delivery
  // cannot be submitted without it.
  suggestedReceiptNo = "",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const { slate, gray, blue, red } = base;
  const getKey = (opt, idx) => opt.purchase_option?.nPurchaseItemId ?? idx;

  // Received (approved + pending) − delivered. Pending rows count as in hand,
  // so they are deliverable too — same rule as the backend guard.
  const toDeliver = (opt) => getToDeliver(opt?.purchase_option);

  // Row figure combined across every PO of the transaction (5 from supplier A
  // + 5 from supplier B = 10). It is both what the row shows and the form max:
  // on submit the delivery is split over the purchase items it covers, so the
  // shared qty really can go out from here.
  const rowFree = (opt) => {
    const t = txnTotals?.[opt?.purchase_option?.transaction_item?.nTransactionItemId];
    return t ? Math.max(num(t.rcvd) - num(t.dlvd), 0) : toDeliver(opt);
  };

  // Hide items with nothing left to deliver on any of their POs
  const visible = React.useMemo(
    () =>
      options
        .map((opt, origIdx) => ({ opt, origIdx }))
        .filter(({ opt }) => rowFree(opt) > 0),
    [options, txnTotals]
  );

  const [expandedIds, setExpandedIds] = React.useState(() => new Set());
  const allKeys = visible.map(({ opt, origIdx }) => getKey(opt, origIdx));
  const allExpanded =
    allKeys.length > 0 && allKeys.every((k) => expandedIds.has(k));

  const toggleOne = (k) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const toggleAll = () =>
    setExpandedIds(allExpanded ? new Set() : new Set(allKeys));

  const getForm = (k) =>
    forms[k] ?? {
      qty: "",
      // Untouched rows track the card's number; a row the user edited keeps
      // whatever is in forms[k].
      receiptNo: suggestedReceiptNo || "",
      showSN: false,
      serials: [],
    };
  const setForm = (k, patch) =>
    setForms((prev) => ({ ...prev, [k]: { ...getForm(k), ...patch } }));

  const labelSx = {
    fontSize: "0.55rem",
    fontWeight: 700,
    color: gray.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  const inputSx = {
    flex: 1,
    height: 32,
    px: 0.9,
    fontSize: "0.7rem",
    fontWeight: 600,
    color: gray.textPrimary,
    border: `0.5px solid ${slate.border}`,
    borderRadius: "7px",
    outline: "none",
    background: slate.innerBg,
  };
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
        <Box
          component="button"
          onClick={toggleAll}
          sx={{
            px: 1,
            height: 22,
            fontSize: "0.55rem",
            fontWeight: 700,
            color: blue.textStrong,
            background: blue.bg,
            border: `0.5px solid ${blue.border}`,
            borderRadius: "50px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {allExpanded ? "Collapse" : "Show All"}
        </Box>
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
            <Typography
              sx={{ fontSize: "0.6rem", color: gray.textSecondary }}
            >
              No items left for delivery.
            </Typography>
          </Box>
        )}

        {visible.map(({ opt, origIdx }, idx) => {
          const p = opt.purchase_option;
          const tx = p?.transaction_item?.transaction;
          // Shared across every PO of this item — also the form max below.
          const left = rowFree(opt);
          const k = getKey(opt, origIdx);
          const expanded = expandedIds.has(k);
          const form = getForm(k);
          const isSingle = left === 1;
          // Qty in, receipt no. out — the field cannot be left blank.
          const receiptMissing =
            Number(form.qty) > 0 && !(form.receiptNo || "").trim();

          return (
            <Box
              key={k}
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
                {/* Left: icon + item info */}
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
                      <LocalShippingOutlined
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
                    <Typography
                      sx={{
                        fontSize: "0.48rem",
                        color: slate.mutedColor,
                        mt: 0.15,
                        lineHeight: 1,
                      }}
                    >
                      Delivery: {fmtDate(tx?.dtDelivery) || "—"}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: To Deliver + toggle button */}
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
                      To Deliver
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        lineHeight: 1,
                        color:
                          left > 0 ? blue.textStrong : gray.textSecondary,
                      }}
                    >
                      {left}
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

                  <Box
                    component="button"
                    onClick={() => toggleOne(k)}
                    disabled={left <= 0}
                    title={expanded ? "Hide deliver form" : "Show deliver form"}
                    sx={{
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: `0.5px solid ${expanded ? blue.border : slate.mutedBorder}`,
                      borderRadius: "50px",
                      background: expanded ? blue.bg : "transparent",
                      color: expanded ? blue.textStrong : slate.mutedColor,
                      cursor: "pointer",
                      "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
                    }}
                  >
                    <OutboxOutlined sx={{ fontSize: "0.85rem" }} />
                  </Box>
                </Box>
              </Box>

              {/* DELIVER FORM */}
              <Collapse in={expanded} unmountOnExit>
                <Box
                  sx={{
                    px: 2,
                    pb: 1.25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Divider sx={{ borderColor: slate.divider }} />

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}
                  >
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Typography sx={{ ...labelSx, flex: isSingle ? 1.4 : 1 }}>
                        Quantity to Deliver
                      </Typography>
                      <Box sx={{ width: 78, flexShrink: 0 }} />
                      <Typography
                        sx={{ ...labelSx, flex: 1, whiteSpace: "nowrap" }}
                      >
                        Receipt No. *
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
                    >
                      {isSingle ? (
                        <Box
                          component="button"
                          onClick={() =>
                            setForm(k, { qty: form.qty === "1" ? "" : "1" })
                          }
                          sx={{
                            flex: 1.4,
                            height: 32,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: form.qty === "1" ? "#fff" : blue.textStrong,
                            background:
                              form.qty === "1" ? blue.textStrong : blue.bg,
                            border: `0.5px solid ${blue.border}`,
                            borderRadius: "7px",
                            cursor: "pointer",
                          }}
                        >
                          {form.qty === "1"
                            ? "1 Delivered"
                            : `Mark 1 ${p?.strUOM ?? ""}`}
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", flex: 1 }}>
                          <Box
                            component="input"
                            type="number"
                            min={0}
                            max={left}
                            value={form.qty}
                            onChange={(e) => {
                              if (Number(e.target.value) <= left)
                                setForm(k, { qty: e.target.value });
                            }}
                            sx={{
                              ...inputSx,
                              borderRight: "none",
                              borderRadius: "7px 0 0 7px",
                            }}
                          />
                          <Box
                            sx={{
                              height: 32,
                              px: 1,
                              display: "flex",
                              alignItems: "center",
                              background: slate.mutedBg,
                              border: `0.5px solid ${slate.border}`,
                              borderRadius: "0 7px 7px 0",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.58rem",
                                fontWeight: 700,
                                color: gray.textMuted,
                                textTransform: "uppercase",
                              }}
                            >
                              {p?.strUOM ?? "—"}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      <Box
                        component="button"
                        onClick={() => setForm(k, { showSN: !form.showSN })}
                        disabled={!form.qty || Number(form.qty) <= 0}
                        sx={{
                          width: 78,
                          height: 32,
                          flexShrink: 0,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          color: form.showSN ? blue.textStrong : gray.textMuted,
                          background: form.showSN ? blue.bg : slate.outerBg,
                          border: `0.5px solid ${form.showSN ? blue.border : slate.border}`,
                          borderRadius: "7px",
                          cursor: "pointer",
                          "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                        }}
                      >
                        {form.showSN ? "− SN" : "+ SN"}
                      </Box>

                      <Box
                        component="input"
                        type="text"
                        value={form.receiptNo}
                        placeholder="e.g. RR-2025-0001"
                        onChange={(e) =>
                          setForm(k, { receiptNo: e.target.value })
                        }
                        sx={{
                          ...inputSx,
                          border: receiptMissing
                            ? `0.5px solid ${red.text}`
                            : inputSx.border,
                        }}
                      />
                    </Box>

                    {receiptMissing && (
                      <Typography
                        sx={{
                          fontSize: "0.5rem",
                          fontWeight: 600,
                          color: red.text,
                          lineHeight: 1.2,
                        }}
                      >
                        Receipt No. is required
                        {suggestedReceiptNo
                          ? ` — next for this card: ${suggestedReceiptNo}`
                          : ""}
                      </Typography>
                    )}
                  </Box>

                  {form.showSN && (
                    <FormGrid
                      fields={[
                        {
                          name: "serials",
                          label: "Serial Numbers",
                          type: "serialNumber",
                          xs: 12,
                          placeholder: "Scan or type S/N and press Enter...",
                          maxItems: Number(form.qty) || 0,
                        },
                      ]}
                      switches={[]}
                      formData={{ serials: form.serials }}
                      errors={{}}
                      handleChange={(e) => {
                        if (e.target.name === "serials")
                          setForm(k, { serials: e.target.value });
                      }}
                      autoFocus={false}
                    />
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </>
  );
}
