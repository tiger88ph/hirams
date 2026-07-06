import React, { useState } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import ConfirmationDialog from "../../../../../components/common/ConfirmationDialog.jsx";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { printRoute } from "../../../../../utils/helpers/printRoute.js";
import { Box, Typography } from "@mui/material";
import {
  ReceiptLongOutlined,
  PersonOutlined,
  StorefrontOutlined,
  LocalShippingOutlined,
} from "@mui/icons-material";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 0.6 }}>
      <Icon
        sx={{ fontSize: "0.75rem", color: "text.disabled", mt: "2px", flexShrink: 0 }}
      />
      <Typography
        sx={{ fontSize: "0.65rem", color: "text.secondary", flexShrink: 0, minWidth: 90 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: "0.65rem", fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, mt: 0.5 }}>
      <Typography
        sx={{
          fontSize: "0.58rem",
          fontWeight: 700,
          color: "text.disabled",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: "0.5px", background: "#e2e8f0" }} />
    </Box>
  );
}

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({ item, index }) {
  const [specsOpen, setSpecsOpen] = useState(false);

  const hasSpecs =
    item.itemSpecs && item.itemSpecs.trim() && item.itemSpecs.trim() !== "<p></p>";

  return (
    <Box
      sx={{
        borderBottom: "0.5px solid #f0f4f8",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      {/* Main row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.5,
          py: 1.25,
          background: index % 2 === 0 ? "#fafbff" : "#fff",
        }}
      >
        {/* Index badge */}
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "5px",
            background: "#e8f0fe",
            border: "0.5px solid #c3d3f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: "#1565c0" }}>
            {index + 1}
          </Typography>
        </Box>

        {/* Item name */}
        <Typography
          sx={{
            flex: 1,
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {item.itemName || "—"}
        </Typography>

        {/* Qty (actual, not delivered) */}
        <Box sx={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
            {item.itemQty ?? "—"}
          </Typography>
          {item.itemUOM && (
            <Typography
              sx={{
                fontSize: "0.5rem",
                color: "text.disabled",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.2,
              }}
            >
              {item.itemUOM}
            </Typography>
          )}
        </Box>

        {/* Unit Price */}
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "text.secondary",
            textAlign: "right",
            minWidth: 64,
            flexShrink: 0,
          }}
        >
          ₱{fmt(item.unitPrice)}
        </Typography>

        {/* Total Price */}
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#15803d",
            textAlign: "right",
            minWidth: 72,
            flexShrink: 0,
          }}
        >
          ₱{fmt(item.totalPrice)}
        </Typography>

        {/* Specs toggle */}
        {hasSpecs ? (
          <Box
            component="button"
            onClick={() => setSpecsOpen((v) => !v)}
            sx={{
              background: "none",
              border: "none",
              cursor: "pointer",
              p: 0.5,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <ArrowDropDownIcon
              sx={{
                fontSize: "1.2rem",
                color: specsOpen ? "#1565c0" : "text.disabled",
                transform: specsOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </Box>
        ) : (
          <Box sx={{ width: 28, flexShrink: 0 }} />
        )}
      </Box>

      {/* Specs panel */}
      {specsOpen && hasSpecs && (
        <>
          <Box
            sx={{
              px: 1.5,
              py: 0.4,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#e8f0fe",
              borderBottom: "0.5px solid #c3d3f8",
            }}
          >
            <Typography
              sx={{
                width: "100%",
                textAlign: "center",
                fontSize: "0.55rem",
                fontWeight: 700,
                color: "#1565c0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              SPECIFICATIONS
            </Typography>
          </Box>
          <Box
            sx={{
              px: 2,
              py: 1,
              pl: 5,
              borderTop: "0.5px solid #e0f2fe",
              background: "#f4faff",
              fontSize: "0.6rem",
              color: "text.secondary",
              lineHeight: 1.5,
              "& *": { backgroundColor: "transparent !important" },
              "& ul, & ol": { paddingLeft: "1rem", margin: 0 },
              "& p": { margin: 0 },
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: item.itemSpecs }}
          />
        </>
      )}
    </Box>
  );
}

// ── PrintSalesInvoiceModal ────────────────────────────────────────────────────
export default function PrintSalesInvoiceModal({
  open,
  onClose,
  transaction,
  invoiceItems = [],
  assignedAOName,
  transactionCode,
}) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const PRINT_CONFIRM_STYLE = {
    color: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    dotColor: "#22c55e",
    icon: <ReceiptLongOutlined sx={{ fontSize: "1.4rem", color: "#15803d" }} />,
    title: "Print Sales Invoice?",
    desc: "This will open the print view for this sales invoice.",
    confirmLabel: "Yes, Print",
    confirmBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  };

  if (!open || !transaction) return null;

  const grandTotal = invoiceItems.reduce(
    (sum, i) => sum + Number(i.totalPrice || 0),
    0,
  );

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      handlePrint();
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handlePrint = () => {
    const payload = JSON.stringify({
      transaction,
      invoiceItems,
      assignedAOName,
      transactionCode,
    });
    sessionStorage.setItem("printSI_data", payload);
    setTimeout(() => {
      printRoute("/print-si");
    }, 50);
  };

  const client = transaction?.client;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Sales Invoice"
      subTitle={transactionCode ? `/ ${transactionCode}` : ""}
      contentPadding={0}
      showSave={!confirmAction}
      saveLabel="Print"
      onSave={() => setConfirmAction("print")}
      disabled={invoiceItems.length === 0}
      showCancel={true}
      cancelLabel={confirmAction ? "Back" : "Cancel"}
      onCancel={confirmAction ? () => setConfirmAction(null) : onClose}
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {confirmAction ? (
          <ConfirmationDialog
            style={PRINT_CONFIRM_STYLE}
            voucherNumber={transactionCode}
            loading={confirmLoading}
            onConfirm={handleConfirm}
            onBack={() => setConfirmAction(null)}
          />
        ) : (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            {/* Client info */}
            {client && (client.strClientNickName || client.strClientName) && (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: "0.5px solid #e2e8f0",
                  background: "#fafbff",
                  px: 1.5,
                  py: 1,
                  mb: 2,
                }}
              >
                <InfoRow
                  icon={ReceiptLongOutlined}
                  label="Transaction"
                  value={
                    transaction?.strTitle
                      ? `${transactionCode} | ${transaction.strTitle}`
                      : transactionCode
                  }
                />
                <InfoRow
                  icon={PersonOutlined}
                  label="Client"
                  value={(
                    client.strClientNickName || client.strClientName
                  )?.toUpperCase()}
                />
                {client.strTIN && (
                  <InfoRow icon={ReceiptLongOutlined} label="TIN" value={client.strTIN} />
                )}
                {client.strAddress && (
                  <InfoRow
                    icon={LocalShippingOutlined}
                    label="Address"
                    value={client.strAddress}
                  />
                )}
                {client.strBusinessStyle && (
                  <InfoRow
                    icon={StorefrontOutlined}
                    label="Business Style"
                    value={client.strBusinessStyle}
                  />
                )}
                <InfoRow icon={PersonOutlined} label="Account Officer" value={assignedAOName} />
              </Box>
            )}

            {/* Invoice items */}
            <SectionHeader label={`Invoice Items (${invoiceItems.length})`} />
            {invoiceItems.length === 0 ? (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: "0.5px solid #e2e8f0",
                  background: "#fafbff",
                  px: 2,
                  py: 3,
                  textAlign: "center",
                }}
              >
                <ReceiptLongOutlined sx={{ fontSize: "1.5rem", color: "#cbd5e1", mb: 0.5 }} />
                <Typography sx={{ fontSize: "0.65rem", color: "text.disabled" }}>
                  No invoiceable items found for this transaction.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  borderRadius: "8px",
                  border: "0.5px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                {/* Table header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.5,
                    py: 0.75,
                    background: "#f1f5f9",
                    borderBottom: "0.5px solid #e2e8f0",
                  }}
                >
                  <Box sx={{ width: 20, flexShrink: 0 }} />
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Item / Specifications
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      minWidth: 44,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      textAlign: "center",
                    }}
                  >
                    Qty
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      minWidth: 64,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      textAlign: "right",
                    }}
                  >
                    Unit Price
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.57rem",
                      fontWeight: 700,
                      minWidth: 72,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      textAlign: "right",
                    }}
                  >
                    Total
                  </Typography>
                  <Box sx={{ width: 28, flexShrink: 0 }} />
                </Box>

                {invoiceItems.map((item, i) => (
                  <ItemRow key={i} item={item} index={i} />
                ))}

                {/* Grand total */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    background: "#f0fdf4",
                    borderTop: "0.5px solid #86efac",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#15803d",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Grand Total:
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#15803d" }}>
                    ₱{fmt(grandTotal)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ModalContainer>
  );
}