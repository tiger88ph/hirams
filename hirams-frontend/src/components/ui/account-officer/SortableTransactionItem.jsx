import React from "react";
import {
  Paper,
  Typography,
  Grid,
  Divider,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PurchaseOptionsAccordion from "./PurchaseOptionsAccordion";

function SortableTransactionItem({
  item,
  status,
  expandedItemId,
  canEdit,
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
  onEdit, // ✅ Make sure this prop is accepted
  onDelete, // ✅ new prop
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "16px",
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
    touchAction: "none",
  };
  const showPurchaseOptions = status === "For Canvas"; // ✅ CHECK STATUS
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
          {/* Left side: Item number, name, and specs */}
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, lineHeight: 1 }}
          >
            {item.nItemNumber}. {item.name} ({item.specs})
          </Typography>

          {/* Right side: Edit + Delete icons */}
          {canEdit && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Tooltip title="Edit Item">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ prevent drag or accordion toggle
                      onEdit(item);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Item">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id); // ✅ now calls the correct delete handler
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Box>

        {/* Item Info */}
        <Grid container spacing={0.5} sx={{ mb: 0.75 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body2">
              {item.qty} {item.uom}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Total ABC
            </Typography>
            <Typography variant="body2">
              ₱{Number(item.abc).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
        {showPurchaseOptions && <Divider sx={{ my: 0.5 }} />}

        {/* ✅ ONLY SHOW PURCHASE OPTIONS WHEN STATUS = "Items Verification" */}
        {showPurchaseOptions && (
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
        )}
      </Paper>
    </div>
  );
}

export default SortableTransactionItem;
