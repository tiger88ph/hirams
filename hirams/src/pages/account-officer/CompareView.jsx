import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import FormGrid from "../../components/common/FormGrid";

function CompareView({ compareData, onSpecsChange, onOptionSpecsChange }) {
  if (!compareData) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        overflowX: { xs: "auto", md: "visible" },
      }}
    >
      {/* TRANSACTION ITEM */}
      <Paper
        sx={{
          position: "relative",
          flex: { xs: "0 0 300px", md: 1 },
          minWidth: 300,
          p: 1.5,
          borderRadius: 3,
          backgroundColor: "#F0F8FF",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          borderTop: "3px solid #115293",
          borderBottom: "2px solid #ADD8E6",
        }}
      >
        {/* Badge */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "#115293",
            color: "#fff",
            px: 1.5,
            py: 0.5,
            borderRadius: 3,
            fontSize: "0.50rem",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Transaction Item
        </Box>

        <Typography variant="caption" color="text.secondary">
          Name:{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            {compareData.itemName}
          </Box>
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Quantity:{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            {compareData.quantity}
          </Box>{" "}
          {compareData.uom}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          ABC:{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            ₱{Number(compareData.abc).toLocaleString()}
          </Box>
        </Typography>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Specifications:
          </Typography>

          <FormGrid
            fields={[
              {
                name: "specs",
                label: "",
                type: "textarea",
                xs: 12,
                multiline: true,
                minRows: 2,
                showOnlyHighlighter: true,
                sx: {
                  "& textarea": {
                    resize: "vertical",
                    userSelect: "text",
                    pointerEvents: "auto",
                    backgroundColor: "#fafafa",
                    borderRadius: 2,
                  },
                },
              },
            ]}
            formData={{ specs: compareData.specs }}
            handleChange={(e) => onSpecsChange(e.target.value)}
            errors={{}}
          />
        </Box>
      </Paper>

      {/* PURCHASE OPTIONS */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: { xs: "0 0 300px", md: 1 },
          minWidth: 300,
        }}
      >
        {compareData.purchaseOptions.length > 0 ? (
          compareData.purchaseOptions.map((option) => (
            <Paper
              key={option.nPurchaseOptionId}
              sx={{
                position: "relative",
                flex: "1",
                p: 1.5,
                borderRadius: 3,
                backgroundColor: "#F0FFF0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderTop: "3px solid #28a745",
                borderBottom: "2px solid #90EE90",
              }}
            >
              {/* Badge */}
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "#28a745",
                  color: "#fff",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 3,
                  fontSize: "0.50rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Purchase Option
              </Box>

              <Typography variant="caption" color="text.secondary">
                Model | Brand:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {option.model} | {option.brand}
                </Box>
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Quantity:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {option.quantity}
                </Box>{" "}
                {option.uom} | Unit Price:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  ₱{option.unitPrice.toLocaleString()}
                </Box>
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Total Price:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  ₱{(option.quantity * option.unitPrice).toLocaleString()}
                </Box>{" "}
                | EWT:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  ₱{option.ewt?.toLocaleString() || 0}
                </Box>
              </Typography>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Specifications:
                </Typography>

                <FormGrid
                  fields={[
                    {
                      name: "specs",
                      label: "",
                      type: "textarea",
                      xs: 12,
                      multiline: true,
                      minRows: 2,
                      showOnlyHighlighter: true,
                      sx: {
                        "& textarea": {
                          resize: "vertical",
                          userSelect: "text",
                          pointerEvents: "auto",
                          backgroundColor: "#fafafa",
                          borderRadius: 2,
                        },
                      },
                    },
                  ]}
                  formData={{ specs: option.specs }}
                  handleChange={(e) =>
                    onOptionSpecsChange(
                      option.nPurchaseOptionId,
                      e.target.value,
                    )
                  }
                  errors={{}}
                />
              </Box>
            </Paper>
          ))
        ) : (
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#fff",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No purchase options available
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default CompareView;
