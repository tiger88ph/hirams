import React from "react";
import { Box, Typography, Divider, Chip } from "@mui/material";
import {
  InventoryOutlined,
  ShoppingCartOutlined,
  ScaleOutlined,
  StraightenOutlined,
  LocalOfferOutlined,
  StorefrontOutlined,
  StyleOutlined,
  MonetizationOnOutlined,
  ReceiptLongOutlined,
  AccountBalanceOutlined,
} from "@mui/icons-material";
import InfoDialog from "../../../../components/common/InfoDialog";
import FormGrid from "../../../../components/common/FormGrid";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
      <Icon
        sx={{
          fontSize: 11,
          color: highlight ? "primary.main" : "text.disabled",
          mt: "2px",
          flexShrink: 0,
          opacity: 0.7,
        }}
      />
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 500,
            whiteSpace: "nowrap",
            lineHeight: 1.4,
          }}
        >
          {label}:
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: highlight ? "primary.dark" : "text.primary",
            fontWeight: highlight ? 700 : 600,
            lineHeight: 1.4,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function SectionLabel({
  color = "#0369a1",
  bgColor = "rgba(3,105,161,0.08)",
  borderColor = "rgba(3,105,161,0.2)",
  icon: Icon,
  label,
  badge,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "5px",
            background: bgColor,
            border: `0.5px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 11, color }} />
        </Box>
        <Typography
          variant="overline"
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color,
            letterSpacing: "0.08em",
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            height: 16,
            fontSize: "0.5rem",
            fontWeight: 700,
            bgcolor: bgColor,
            color,
            border: `0.5px solid ${borderColor}`,
            "& .MuiChip-label": { px: 0.75 },
          }}
        />
      )}
    </Box>
  );
}

// ─── Item Panel ───────────────────────────────────────────────────────────────

function ItemPanel({ compareData, onSpecsChange, forCanvasKey }) {
  return (
    <InfoDialog p={1.5}>
      <SectionLabel
        icon={InventoryOutlined}
        label="Transaction Item"
        color="#115293"
        bgColor="rgba(17,82,147,0.08)"
        borderColor="rgba(17,82,147,0.2)"
        badge="ITEM"
      />

      {/* Info rows */}
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 0.6, mb: 1.25 }}
      >
        <InfoRow
          icon={StyleOutlined}
          label="Name"
          value={compareData.itemName || "—"}
          highlight
        />
        <InfoRow
          icon={ScaleOutlined}
          label="Quantity"
          value={`${compareData.quantity} ${compareData.uom || ""}`.trim()}
        />
        <InfoRow
          icon={MonetizationOnOutlined}
          label="ABC"
          value={compareData.abc ? `₱ ${fmt(compareData.abc)}` : "—"}
          highlight={!!compareData.abc}
        />
      </Box>

      <Divider sx={{ mb: 1.25 }} />

      {/* Specs */}
      <Typography
        variant="overline"
        sx={{
          fontSize: "0.55rem",
          fontWeight: 700,
          color: "text.secondary",
          letterSpacing: "0.08em",
          display: "block",
          mb: 0.75,
        }}
      >
        Specifications
      </Typography>

      <FormGrid
        fields={[
          {
            name: "specs",
            label: "",
            type: "textarea",
            xs: 12,
            multiline: true,
            minRows: 3,
            showOnlyHighlighter: forCanvasKey ? false : true,
            readOnlyHighlight: forCanvasKey ? false : true,
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
        formData={{ specs: compareData.specs }}
        handleChange={(e) => onSpecsChange(e.target.value)}
        errors={{}}
      />
    </InfoDialog>
  );
}

// ─── Option Panel ─────────────────────────────────────────────────────────────

function OptionPanel({ option, onOptionSpecsChange, forCanvasKey, index }) {
  const totalPrice = option.quantity * option.unitPrice;

  return (
    <InfoDialog p={1.5}>
      <SectionLabel
        icon={ShoppingCartOutlined}
        label="Purchase Option"
        color="#1a7a3c"
        bgColor="rgba(26,122,60,0.08)"
        borderColor="rgba(26,122,60,0.2)"
        badge="OPTION"
      />

      {/* Info rows — 2 equal columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "start",
          mb: 1.25,
        }}
      >
        {/* Col 1: identity */}
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.6, pr: 1.25 }}
        >
          <InfoRow
            icon={StorefrontOutlined}
            label="Supplier"
            value={option.supplierName || option.supplierNickName || "—"}
            highlight
          />
          <InfoRow
            icon={StyleOutlined}
            label="Model / Brand"
            value={
              [option.model, option.brand].filter(Boolean).join(" · ") || "—"
            }
          />
          <InfoRow
            icon={StraightenOutlined}
            label="Quantity"
            value={`${option.quantity} ${option.uom || ""}`.trim()}
          />
        </Box>

        {/* Vertical divider */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: "divider" }}
        />

        {/* Col 2: pricing */}
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.6, pl: 1.25 }}
        >
          <InfoRow
            icon={LocalOfferOutlined}
            label="Unit Price"
            value={`₱ ${fmt(option.unitPrice)}`}
            highlight
          />
          <InfoRow
            icon={MonetizationOnOutlined}
            label="Total Price"
            value={`₱ ${fmt(totalPrice)}`}
            highlight
          />
          {option.ewt > 0 && (
            <InfoRow
              icon={ReceiptLongOutlined}
              label="EWT"
              value={`₱ ${fmt(option.ewt)}`}
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 1.25 }} />

      {/* Specs */}
      <Typography
        variant="overline"
        sx={{
          fontSize: "0.55rem",
          fontWeight: 700,
          color: "text.secondary",
          letterSpacing: "0.08em",
          display: "block",
          mb: 0.75,
        }}
      >
        Specifications
      </Typography>

      <FormGrid
        fields={[
          {
            name: "specs",
            label: "",
            type: "textarea",
            xs: 12,
            multiline: true,
            minRows: 3,
            showOnlyHighlighter: forCanvasKey ? false : true,
            readOnlyHighlight: forCanvasKey ? false : true,
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
        formData={{ specs: option.specs }}
        handleChange={(e) =>
          onOptionSpecsChange(option.nPurchaseOptionId, e.target.value)
        }
        errors={{}}
      />
    </InfoDialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CompareView({
  compareData,
  onSpecsChange,
  onOptionSpecsChange,
  forCanvasKey,
}) {
  if (!compareData) return null;

  const hasOptions = compareData.purchaseOptions?.length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.25,
        alignItems: "flex-start",
        overflowX: { xs: "auto", md: "visible" },
      }}
    >
      {/* Left: Transaction Item */}
      <Box sx={{ flex: { xs: "0 0 300px", md: 1 }, minWidth: 280 }}>
        <ItemPanel
          compareData={compareData}
          onSpecsChange={onSpecsChange}
          forCanvasKey={forCanvasKey}
        />
      </Box>

      {/* Right: Purchase Options */}
      <Box
        sx={{
          flex: { xs: "0 0 300px", md: 1 },
          minWidth: 280,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {hasOptions ? (
          compareData.purchaseOptions.map((option, idx) => (
            <OptionPanel
              key={option.nPurchaseOptionId}
              option={option}
              index={idx}
              onOptionSpecsChange={onOptionSpecsChange}
              forCanvasKey={forCanvasKey}
            />
          ))
        ) : (
          <InfoDialog p={1.5}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 3,
                gap: 0.75,
              }}
            >
              <ShoppingCartOutlined
                sx={{
                  fontSize: "1.5rem",
                  color: "text.disabled",
                  opacity: 0.4,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: "text.disabled", fontStyle: "italic" }}
              >
                No purchase options available
              </Typography>
            </Box>
          </InfoDialog>
        )}
      </Box>
    </Box>
  );
}

export default CompareView;
