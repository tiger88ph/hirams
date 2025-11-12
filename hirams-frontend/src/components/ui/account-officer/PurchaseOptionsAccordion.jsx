import React from "react";
import { Box, Typography, Paper, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FormGrid from "../../common/FormGrid";
import PurchaseOptionCard from "./PurchaseOptionCard";
import { SaveButton, BackButton } from "../../common/Buttons";

function PurchaseOptionsAccordion({
  item,
  expandedItemId,
  addingOptionItemId,
  togglePurchaseOptions,
  formData,
  errors,
  fields,
  handleChange,
  handleSwitchChange,
  handleEditOption,
  handleDeleteOption,
  handleToggleInclude,
  setAddingOptionItemId,
  savePurchaseOption,
}) {
  const isExpanded = expandedItemId === item.id;
  const isAdding = addingOptionItemId === item.id;

  return (
    <Box sx={{ mt: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          mb: 0.5,
        }}
        onClick={() => togglePurchaseOptions(item.id)}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Purchase Options
        </Typography>

        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <IconButton size="small" color="primary">
            {isExpanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>

          {item.purchaseOptions.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -6,
                right: -6,
                bgcolor: "error.main",
                color: "#fff",
                borderRadius: "50%",
                px: 0.5,
                fontSize: 10,
                fontWeight: 600,
                height: 16,
                minWidth: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.purchaseOptions.length}
            </Box>
          )}
        </Box>
      </Box>

      {isExpanded &&
        (isAdding ? (
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <FormGrid
              fields={fields}
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              handleSwitchChange={handleSwitchChange}
            />
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
            >
              <BackButton onClick={() => setAddingOptionItemId(null)} />
              <SaveButton onClick={savePurchaseOption} />
            </Box>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {item.purchaseOptions.map((option) => (
              <PurchaseOptionCard
                key={option.id}
                option={{
                  ...option,
                  supplierName: option.supplierName || option.strSupplierName,
                }}
                onEdit={() => handleEditOption(option)}
                onDelete={() => handleDeleteOption(option)}
                onToggleInclude={(value) =>
                  handleToggleInclude(item.id, option.id, value)
                }
              />
            ))}

            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                border: "1px dashed #bdbdbd",
                cursor: "pointer",
              }}
              onClick={() => setAddingOptionItemId(item.id)}
            >
              <IconButton color="primary" size="large">
                <AddIcon />
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                Add Purchase Option
              </Typography>
            </Paper>
          </Box>
        ))}
    </Box>
  );
}

export default PurchaseOptionsAccordion;
