import React from "react";
import { Paper, Box, Typography, Checkbox, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

const PurchaseOptionCard = ({ option, onEdit, onDelete }) => (
  <Paper
    sx={{
      p: 1,
      borderRadius: 2,
      backgroundColor: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      boxShadow: 1,
      position: "relative",
    }}
  >
    <IconButton
      size="small"
      sx={{
        position: "absolute",
        top: 4,
        right: 4,
        p: 0.5,
        color: "text.secondary",
        "&:hover": { color: "error.main" },
      }}
      onClick={onDelete}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
    <Checkbox checked={option.bIncluded} />
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {option.supplierName}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Qty: {option.nQuantity} {option.strUOM}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Brand/Model: {option.strBrand} | {option.strModel}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Specs: {option.strSpecs}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Unit Price/EWT: ₱{option.dUnitPrice.toLocaleString()} | ₱{option.dEWT?.toLocaleString() || 0}
      </Typography>
    </Box>
    <IconButton size="small" color="primary" onClick={onEdit}>
      <EditIcon fontSize="small" />
    </IconButton>
  </Paper>
);

export default PurchaseOptionCard;
