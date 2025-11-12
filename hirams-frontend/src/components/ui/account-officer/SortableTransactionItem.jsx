import React from "react";
import { Paper, Typography, Grid, Divider, Box } from "@mui/material";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PurchaseOptionsAccordion from "./PurchaseOptionsAccordion";

function SortableTransactionItem({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "16px",
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Paper
        sx={{
          p: 1.25,
          borderRadius: 2,
          backgroundColor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          boxShadow: isDragging ? 3 : 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, lineHeight: 1 }}
          >
            {item.name} ({item.specs})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.nItemNumber}
          </Typography>
        </Box>

        {/* Item Info */}
        <Grid container spacing={0.5} sx={{ mb: 0.75 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body2">
              {item.qty} {item.uom}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Total ABC
            </Typography>
            <Typography variant="body2">
              ₱{Number(item.abc).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Purchase Price
            </Typography>
            <Typography variant="body2">
              ₱{Number(item.purchasePrice).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 0.5 }} />

        <PurchaseOptionsAccordion
          item={item}
          expandedItemId={expandedItemId}
          addingOptionItemId={addingOptionItemId}
          togglePurchaseOptions={togglePurchaseOptions}
          formData={formData}
          errors={errors}
          fields={fields}
          handleChange={handleChange}
          handleSwitchChange={handleSwitchChange}
          handleEditOption={handleEditOption}
          handleDeleteOption={handleDeleteOption}
          handleToggleInclude={handleToggleInclude}
          setAddingOptionItemId={setAddingOptionItemId}
          savePurchaseOption={savePurchaseOption}
        />
      </Paper>
    </div>
  );
}

export default SortableTransactionItem;
