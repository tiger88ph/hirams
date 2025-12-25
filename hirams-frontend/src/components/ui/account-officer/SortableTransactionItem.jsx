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
  Link,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FormGrid from "../../common/FormGrid";
import { SaveButton, BackButton } from "../../common/Buttons";
import { useNavigate } from "react-router-dom";

function SortableTransactionItem({
  item,
  showPurchaseOptions,
  isNotVisibleCanvasVerification,
  showAddButton,
  expandedItemId,
  addingOptionItemId,
  togglePurchaseOptions,
  formData,
  purchaseOptionErrors,
  fields,
  handleChange,
  handleChangeAdd,
  handleSwitchChange,
  handleEditOption,
  handleShowDeleteOptionModal,
  handleToggleInclude,
  setAddingOptionItemId,
  savePurchaseOption,
  onEdit,
  onDelete,
  setExpandedItemId,
  onOpenAddSupplier,
  handleCompareClick,
  crudOptionsEnabled,
  checkboxOptionsEnabled,

}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const [toast, setToast] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });

    setTimeout(() => {
      setToast({ open: false, message: "", severity: "success" });
    }, 9000);
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "16px",
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
    touchAction: "none",
  };
  const [failedOptions, setFailedOptions] = React.useState({});

  const isExpanded = expandedItemId === item.id;
  const isAdding = addingOptionItemId === item.id;
  const navigate = useNavigate();
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(showAddButton ? attributes : {})}
      {...(showAddButton ? listeners : {})}
    >
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
        {!isAdding && (
          <>
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
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
              >
                {item.nItemNumber}. {item.name}
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
                        // Pass the item ID to the parent to show the modal
                        onDelete(item); // pass the whole item instead of just ID
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
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Specifications
                </Typography>

                <Box
                  sx={{
                    p: 1,
                    maxHeight: 100,
                    overflowY: "auto",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    "& *": {
                      backgroundColor: "transparent !important",
                    },
                    "& ul": {
                      paddingLeft: 2,
                      margin: 0,
                      listStyleType: "disc",
                    },
                    "& ol": {
                      paddingLeft: 2,
                      margin: 0,
                      listStyleType: "decimal",
                    },
                    "& li": { marginBottom: 0.25 },
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: item.specs || "" }}
                />
              </Grid>

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
          </>
        )}
        {!isAdding && showPurchaseOptions && <Divider sx={{ my: 0.5 }} />}

        {/* PURCHASE OPTIONS */}
        {showPurchaseOptions && (
          <Box sx={{ mt: 0.5 }}>
            {/* Accordion Header */}
            {!isAdding && (
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
            )}
            {/* Accordion Content */}
            {isExpanded && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {/* Toast Alert at the top of purchase options */}
                {toast.open && (
                  <Alert
                    severity={toast.severity}
                    sx={{
                      mb: 1,
                      width: "100%",
                    }}
                    onClose={() =>
                      setToast({
                        open: false,
                        message: "",
                        severity: "success",
                      })
                    }
                  >
                    {toast.message}
                  </Alert>
                )}

                {/* FORM (Only visible when adding/editing) */}
                {isAdding && (
                  <Paper
                    sx={{ p: 2, borderRadius: 2, backgroundColor: "#fafafa" }}
                  >
                    <FormGrid
                      fields={fields}
                      formData={formData}
                      errors={purchaseOptionErrors}
                      handleChange={handleChange}
                      handleSwitchChange={handleSwitchChange}
                    />
                    <Box sx={{ textAlign: "right", mt: 1 }}>
                      <Typography variant="caption">
                        New Client?{" "}
                        <Link
                          component="button"
                          underline="hover"
                          color="primary"
                          onClick={() => {
                            setAddingOptionItemId(null); // close the current form
                            navigate("/a-supplier?add=true"); // navigate to add supplier page
                          }}
                        >
                          Click here
                        </Link>
                      </Typography>
                    </Box>

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
                    {item.purchaseOptions.length > 0 ? (
                      // Existing Options

                      item.purchaseOptions.map((option) => (
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
                            border: failedOptions[option.id]
                              ? "1.5px solid red"
                              : "none",
                          }}
                        >
                          {/* Delete Button */}
                          {crudOptionsEnabled && (
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
                              onClick={() =>
                                handleShowDeleteOptionModal(item.id, option)
                              }
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          )}
                          {/* Compare Button */}
                          <IconButton
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: !crudOptionsEnabled ? 10 : 28,
                              p: 0.5,
                              color: "text.secondary",
                              "&:hover": { color: "primary.main" },
                            }}
                            key={option.nSupplierId}
                            onClick={() => handleCompareClick(item, option)}
                          >
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>

                          <Checkbox
                            checked={!!option.bIncluded}
                            disabled={!checkboxOptionsEnabled}
                            onChange={(e) => {
                              const num = (v) => Number(v ?? 0);

                              const itemQty = num(item.nQuantity ?? item.qty);
                              const itemABC = num(item.dUnitABC ?? item.abc);

                              const optionQty = num(
                                option.nQuantity ?? option.quantity
                              );
                              const optionUnitPrice = num(
                                option.dUnitPrice ??
                                  option.dUnitABC ??
                                  option.abc
                              );

                              const purchasePrice = optionQty * optionUnitPrice;

                              // Reset previous error
                              setFailedOptions((prev) => ({
                                ...prev,
                                [option.id]: null,
                              }));

                              // Validation: Quantity
                              if (optionQty > itemQty) {
                                setFailedOptions((prev) => ({
                                  ...prev,
                                  [option.id]: "quantity",
                                }));

                                showToast(
                                  `Purchase option's quantity (${optionQty}) exceeds ITEM QUANTITY (${itemQty}). Include rejected.`,
                                  "error"
                                );

                                // Clear red highlight after 6 seconds
                                setTimeout(() => {
                                  setFailedOptions((prev) => ({
                                    ...prev,
                                    [option.id]: null,
                                  }));
                                }, 6000);

                                return;
                              }

                              // Validation: Price
                              if (purchasePrice > itemABC) {
                                setFailedOptions((prev) => ({
                                  ...prev,
                                  [option.id]: "price",
                                }));

                                showToast(
                                  `Purchase price (₱${purchasePrice.toLocaleString()}.00) exceeds ITEM ABC (₱${itemABC.toLocaleString()}.00). Include rejected.`,
                                  "error"
                                );

                                // Clear red highlight after 6 seconds
                                setTimeout(() => {
                                  setFailedOptions((prev) => ({
                                    ...prev,
                                    [option.id]: null,
                                  }));
                                }, 6000);

                                return;
                              }

                              // ✅ Update handler
                              handleToggleInclude(
                                item.id,
                                option.id,
                                e.target.checked
                              );

                              // Success toast
                              showToast(
                                e.target.checked
                                  ? `Purchase option included successfully. Quantity: ${optionQty}, Total Price: ₱${purchasePrice.toLocaleString()}.00`
                                  : `Purchase option removed. Quantity: ${optionQty}, Total Price: ₱${purchasePrice.toLocaleString()}.00`,
                                "success"
                              );
                            }}
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
                            <Typography
                              variant="caption"
                              color={
                                failedOptions[option.id] === "quantity"
                                  ? "error.main"
                                  : "text.secondary"
                              }
                            >
                              Qty: {option.nQuantity} {option.strUOM}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Brand/Model: {option.strBrand} | {option.strModel}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Specifications:
                            </Typography>
                            <Box
                              sx={{
                                p: 1,
                                maxHeight: 100,
                                overflowY: "auto",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                "& ul": {
                                  paddingLeft: 2,
                                  margin: 0,
                                  listStyleType: "disc",
                                },
                                "& ol": {
                                  paddingLeft: 2,
                                  margin: 0,
                                  listStyleType: "decimal",
                                },
                                "& li": { marginBottom: 0.25 },
                                wordBreak: "break-word",
                                "& span[style*='background-color']": {
                                  backgroundColor: "transparent !important",
                                },
                              }}
                              dangerouslySetInnerHTML={{
                                __html: option.strSpecs || "",
                              }}
                            />

                            {/* ✅ Dynamic Total Price */}
                            <Typography
                              variant="caption"
                              color={
                                failedOptions[option.id] === "price"
                                  ? "error.main"
                                  : "text.secondary"
                              }
                            >
                              Unit Price: ₱{option.dUnitPrice.toLocaleString()}{" "}
                              • Total Price: ₱
                              {(
                                option.nQuantity * option.dUnitPrice
                              ).toLocaleString()}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              EWT: ₱{option.dEWT?.toLocaleString() || 0}
                            </Typography>
                          </Box>

                          {crudOptionsEnabled && (
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
                      ))
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px dashed #bdbdbd",
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="caption">
                          No purchase options available
                        </Typography>
                      </Box>
                    )}

                    {/* ADD OPTION BUTTON */}
                    {!isNotVisibleCanvasVerification && (
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
                          handleChangeAdd(item.id); // <-- pass item.id here
                        }}
                      >
                        <IconButton color="primary" size="large">
                          <AddIcon />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          Add Purchase Option
                        </Typography>
                      </Paper>
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

export default React.memo(SortableTransactionItem);
