import React from "react";
import {
  Paper,
  Typography,
  Grid,
  Divider,
  Box,
  IconButton,
  Checkbox,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FormGrid from "../../common/FormGrid";
import { SaveButton, BackButton } from "../../common/Buttons";

function SortableTransactionItem({
  item,
  showPurchaseOptions,
  isNotVisibleCanvasVerification,
  showAddButton,
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
  onEdit,
  onDelete,
  setExpandedItemId,
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

  const isExpanded = expandedItemId === item.id;
  const isAdding = addingOptionItemId === item.id;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Paper
        sx={{
          p: 2,
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
            {item.nItemNumber}. {item.name} ({item.specs})
          </Typography>

          {showAddButton && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Edit Item">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
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
                    onDelete(item.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
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

        {/* PURCHASE OPTIONS */}
        {showPurchaseOptions && (
          <Box sx={{ mt: 0.5 }}>
            {/* Accordion Header */}
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

            {/* Accordion Content */}
            {isExpanded && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {/* FORM (Only visible when adding/editing) */}
                {isAdding && (
                  <Paper
                    sx={{ p: 2, borderRadius: 2, backgroundColor: "#fafafa" }}
                  >
                    <FormGrid
                      fields={fields}
                      formData={formData}
                      errors={errors}
                      handleChange={handleChange}
                      handleSwitchChange={handleSwitchChange}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <BackButton onClick={() => setAddingOptionItemId(null)} />
                      <SaveButton onClick={savePurchaseOption} />
                    </Box>
                  </Paper>
                )}

                {/* PURCHASE OPTION CARDS + ADD BUTTON (hidden when form is open) */}
                {!isAdding && (
                  <>
                    {/* Existing Options */}
                    {item.purchaseOptions.map((option) => (
                      <Paper
                        key={option.id}
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
                        {isNotVisibleCanvasVerification && (
                          <>
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
                              onClick={() => handleDeleteOption(option)}
                            >
                              ✖
                            </IconButton>
                          </>
                        )}
                        <Checkbox
                          checked={!!option.bIncluded}
                          disabled={!isNotVisibleCanvasVerification} // <-- disable when true
                          onChange={(e) =>
                            handleToggleInclude(
                              item.id,
                              option.id,
                              e.target.checked
                            )
                          }
                        />

                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600 }}
                          >
                            {option.supplierName || option.strSupplierName}
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
                            Unit Price/EWT: ₱
                            {option.dUnitPrice.toLocaleString()} | ₱
                            {option.dEWT?.toLocaleString() || 0}
                          </Typography>
                        </Box>
                        {isNotVisibleCanvasVerification && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditOption(option)}
                            >
                              ✎
                            </IconButton>
                          </>
                        )}
                      </Paper>
                    ))}

                    {/* ADD OPTION BUTTON */}
                    {isNotVisibleCanvasVerification && (
                      <>
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
                          onClick={() => {
                            setAddingOptionItemId(item.id);
                            setExpandedItemId(item.id);
                          }}
                        >
                          <IconButton color="primary" size="large">
                            <AddIcon />
                          </IconButton>
                          <Typography variant="caption" color="text.secondary">
                            Add Purchase Option
                          </Typography>
                        </Paper>
                      </>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </div>
  );
}

export default SortableTransactionItem;
