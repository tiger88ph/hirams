// PaymentTermsForm.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { ReceiptLongOutlined, LocalShippingOutlined } from "@mui/icons-material";

import FormGrid from "../../../../../components/common/FormGrid";

// Was previously inline JSX inside PurchaseOrderCartModal's `showPaymentForm` branch.
// Same markup, now controlled via props instead of closing over modal state directly.
export default function PaymentTermsForm({
  paymentForm,
  setPaymentForm,
  paymentErrors,
  paymentTerms,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        px: 2.5,
        py: 3,
        gap: 2.5,
        animation: "fadeSlideIn 0.18s ease",
        "@keyframes fadeSlideIn": {
          from: { opacity: 0, transform: "scale(0.97)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      {/* Payment Terms — unchanged chip buttons */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ReceiptLongOutlined sx={{ fontSize: "0.75rem", color: "#16a34a" }} />
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#374151",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Payment Terms
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          {Object.entries(paymentTerms || {}).map(([key, lbl]) => {
            const selected = paymentForm.cPaymentTerms === key;
            return (
              <Box
                key={key}
                onClick={() =>
                  setPaymentForm((p) => ({
                    ...p,
                    cPaymentTerms: key,
                  }))
                }
                sx={{
                  flex: 1,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9px",
                  border: selected
                    ? "1.5px solid #16a34a"
                    : "0.5px solid #D1D5DB",
                  background: selected
                    ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                    : "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: selected ? "0 2px 8px #16a34a22" : "none",
                  "&:hover": {
                    borderColor: "#16a34a",
                    background: selected ? undefined : "#f0fdf4",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: selected ? 700 : 500,
                    color: selected ? "#15803d" : "#6B7280",
                  }}
                >
                  {lbl}
                </Typography>
              </Box>
            );
          })}
        </Box>
        {paymentErrors.cPaymentTerms && (
          <Typography sx={{ fontSize: "0.6rem", color: "#dc2626", mt: -0.25 }}>
            {paymentErrors.cPaymentTerms}
          </Typography>
        )}
      </Box>
      {/* Shipping Method */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LocalShippingOutlined sx={{ fontSize: "0.75rem", color: "#16a34a" }} />
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#374151",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Shipping
          </Typography>
        </Box>
        <FormGrid
          fields={[
            {
              name: "strShippingDetails",
              label: "",
              type: "textarea",
              xs: 12,
              multiline: true,
              minRows: 3,
              sx: {
                "& textarea": {
                  resize: "vertical",
                  userSelect: "text",
                  pointerEvents: "auto",
                  backgroundColor: "#fafafa",
                  borderRadius: 2,
                  fontSize: "0.7rem",
                },
              },
            },
          ]}
          formData={{
            strShippingDetails: paymentForm.strShippingDetails,
          }}
          handleChange={(e) =>
            setPaymentForm((p) => ({
              ...p,
              strShippingDetails: e.target.value,
            }))
          }
          errors={{
            strShippingDetails: paymentErrors.strShippingDetails,
          }}
        />
      </Box>
    </Box>
  );
}