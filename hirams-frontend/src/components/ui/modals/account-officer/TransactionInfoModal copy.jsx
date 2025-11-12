import React, { useState, useEffect } from "react";

import {
  Box,
  Grid,
  Typography,
  Divider,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ModalContainer from "../../../common/ModalContainer";
import api from "../../../../utils/api/api";
import useMapping from "../../../../utils/mappings/useMapping";
import FormGrid from "../../../common/FormGrid";

import InfoSection from "../../account-officer/InfoSection";
import DetailItem from "../../account-officer/DetailItem";
import PurchaseOptionCard from "../../account-officer/PurchaseOptionCard";
import { SaveButton, BackButton } from "../../../common/Buttons";

const initialFormData = {
  nSupplierId: "",
  quantity: "",
  uom: "",
  brand: "",
  model: "",
  specs: "",
  unitPrice: "",
  ewt: "",
  bIncluded: false,
};

function ATransactionInfoModal({ open, onClose, transaction }) {
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    specs: "",
    qty: "",
    uom: "",
    abc: "",
    purchasePrice: "",
  });

  const { procMode, procSource, itemType } = useMapping();

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("suppliers/all");
        const options = res.suppliers.map((s) => ({
          label: s.strSupplierName,
          value: s.nSupplierId,
        }));
        setSuppliers(options);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch transaction items
  const fetchItems = async () => {
    if (!transaction?.nTransactionId) return;
    try {
      const res = await api.get(
        `transactions/${transaction.nTransactionId}/items`
      );
      setItems(res.items || []);
    } catch (err) {
      console.error("Error fetching transaction items:", err);
    }
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open, transaction]);

  if (!open || !transaction) return null;

  const details = transaction;
  const itemTypeLabel = itemType?.[details.cItemType] || details.cItemType;
  const procModeLabel = procMode?.[details.cProcMode] || details.cProcMode;
  const procSourceLabel =
    procSource?.[details.cProcSource] || details.cProcSource;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const togglePurchaseOptions = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    setAddingOptionItemId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItemForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (value) => {
    setFormData((prev) => ({ ...prev, nSupplierId: Number(value) }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  const saveNewItem = async () => {
    try {
      const payload = {
        nTransactionId: transaction.nTransactionId,
        strName: newItemForm.name,
        strSpecs: newItemForm.specs,
        nQuantity: Number(newItemForm.qty),
        strUOM: newItemForm.uom,
        dUnitABC: Number(newItemForm.abc),
      };

      await api.post("transaction-items", payload);
      await fetchItems();
      setNewItemForm({ name: "", specs: "", qty: "", uom: "", abc: "" });
      setAddingNewItem(false);
    } catch (err) {
      console.error("Error saving new item:", err);
    }
  };

  const savePurchaseOption = async () => {
    if (!addingOptionItemId) return;

    const payload = {
      nTransactionItemId: addingOptionItemId,
      nSupplierId: formData.nSupplierId || null,
      quantity: Number(formData.quantity),
      uom: formData.uom,
      brand: formData.brand || null,
      model: formData.model || null,
      specs: formData.specs || null,
      unitPrice: Number(formData.unitPrice),
      ewt: Number(formData.ewt) || 0,
      bIncluded: formData.bIncluded ? 1 : 0,
    };

    try {
      if (formData.id) {
        await api.put(`purchase-options/${formData.id}`, payload);
      } else {
        await api.post("purchase-options", payload);
      }

      await fetchItems(); // refresh items properly
      setFormData(initialFormData);
      setErrors({});
      setAddingOptionItemId(null);
    } catch (err) {
      console.error("Error saving purchase option:", err);
      setErrors(err.response?.data?.errors || { general: err.message });
    }
  };

  const handleEditOption = (option) => {
    setAddingOptionItemId(option.nTransactionItemId);
    setFormData({
      nSupplierId: option.nSupplierId || "",
      quantity: option.nQuantity,
      uom: option.strUOM,
      brand: option.strBrand || "",
      model: option.strModel || "",
      specs: option.strSpecs || "",
      unitPrice: option.dUnitPrice,
      ewt: option.dEWT,
      bIncluded: !!option.bIncluded,
      id: option.id,
    });
  };

  const handleDeleteOption = async (option) => {
    if (!confirm("Are you sure you want to delete this purchase option?"))
      return;

    try {
      await api.delete(`purchase-options/${option.id}`);
      await fetchItems();
    } catch (err) {
      console.error("Error deleting purchase option:", err);
    }
  };

  const handleToggleInclude = async (itemId, optionId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              purchaseOptions: item.purchaseOptions.map((option) =>
                option.id === optionId
                  ? { ...option, bIncluded: value }
                  : option
              ),
            }
          : item
      )
    );

    try {
      await api.put(`purchase-options/${optionId}`, {
        bIncluded: value ? 1 : 0,
      });
      await fetchItems(); // refresh items properly
    } catch (err) {
      console.error("Error updating included status:", err);
      // revert on failure
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                purchaseOptions: item.purchaseOptions.map((option) =>
                  option.id === optionId
                    ? { ...option, bIncluded: !value }
                    : option
                ),
              }
            : item
        )
      );
    }
  };

  const fields = [
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      xs: 12,
      options: suppliers,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    { name: "quantity", label: "Quantity", type: "number", xs: 6 },
    { name: "uom", label: "UOM", xs: 6 },
    { name: "brand", label: "Brand", xs: 6 },
    { name: "model", label: "Model", xs: 6 },
    { name: "specs", label: "Specs", xs: 12 },
    { name: "unitPrice", label: "Unit Price", type: "number", xs: 6 },
    { name: "ewt", label: "EWT", type: "number", xs: 6 },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Transaction Details"
      width={1080}
      showFooter={false}
    >
      <Box sx={{ pr: 1, pb: 1 }}>
        <Grid container spacing={2}>
          {/* Left Info */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ maxHeight: "75vh", overflowY: "auto", pr: 1 }}
          >
            <InfoSection title="Transaction Details">
              <Grid container spacing={0.1}>
                <DetailItem
                  label="Assigned AO"
                  value={
                    details.user?.strFName
                      ? `${details.user.strFName} ${details.user.strLName}`
                      : "Not Assigned"
                  }
                />
                <DetailItem label="Status" value={details.status || "—"} />
                <Divider sx={{ width: "100%", my: 0.1 }} />
                <DetailItem
                  label="Transaction Code"
                  value={details.strCode || details.transactionId}
                />
                <DetailItem
                  label="Title"
                  value={details.strTitle || details.transactionName}
                />
                <DetailItem
                  label="Company"
                  value={details.company?.strCompanyName || details.companyName}
                />
                <DetailItem
                  label="Client"
                  value={details.client?.strClientName || details.clientName}
                />
                <Divider sx={{ width: "100%", my: 0.1 }} />
                <DetailItem label="Item Type" value={itemTypeLabel} />
                <DetailItem label="Procurement Mode" value={procModeLabel} />
                <DetailItem
                  label="Procurement Source"
                  value={procSourceLabel}
                />
                <DetailItem
                  label="Total ABC"
                  value={
                    details.dTotalABC
                      ? `₱${Number(details.dTotalABC).toLocaleString()}`
                      : "—"
                  }
                />
                <Divider sx={{ width: "100%", my: 0.1 }} />
                <DetailItem
                  label="Pre-Bid"
                  value={
                    details.dtPreBid
                      ? `${formatDateTime(details.dtPreBid)}${details.strPreBid_Venue ? ` — ${details.strPreBid_Venue}` : ""}`
                      : "—"
                  }
                />
                <DetailItem
                  label="Doc Issuance"
                  value={
                    details.dtDocIssuance
                      ? `${formatDateTime(details.dtDocIssuance)}${details.strDocIssuance_Venue ? ` — ${details.strDocIssuance_Venue}` : ""}`
                      : "—"
                  }
                />
                <DetailItem
                  label="Doc Submission"
                  value={
                    details.dtDocSubmission
                      ? `${formatDateTime(details.dtDocSubmission)}${details.strDocSubmission_Venue ? ` — ${details.strDocSubmission_Venue}` : ""}`
                      : "—"
                  }
                />
                <DetailItem
                  label="Doc Opening"
                  value={
                    details.dtDocOpening
                      ? `${formatDateTime(details.dtDocOpening)}${details.strDocOpening_Venue ? ` — ${details.strDocOpening_Venue}` : ""}`
                      : "—"
                  }
                />
              </Grid>
            </InfoSection>
          </Grid>

          {/* Right Items */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ maxHeight: "75vh", overflowY: "auto", pr: 1 }}
          >
            <InfoSection
              title={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Transaction Items
                  </Typography>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setAddingNewItem(true)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              {addingNewItem && (
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    mb: 1,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <FormGrid
                    fields={[
                      { name: "name", label: "Item Name", xs: 12 },
                      { name: "specs", label: "Specs", xs: 12 },
                      { name: "qty", label: "Quantity", type: "number", xs: 4 },
                      { name: "uom", label: "UOM", xs: 4 },
                      {
                        name: "abc",
                        label: "Total ABC",
                        type: "number",
                        xs: 4,
                      },
                    ]}
                    formData={newItemForm}
                    handleChange={handleNewItemChange}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 1,
                      gap: 1,
                    }}
                  >
                    <BackButton onClick={() => setAddingNewItem(false)} />
                    <SaveButton onClick={saveNewItem} />
                  </Box>
                </Paper>
              )}

              {items.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 280,
                    border: "1px dashed #e0e0e0",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body2">No items loaded</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {items.map((item) => (
                    <Grid item xs={12} key={item.id}>
                      <Paper
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          backgroundColor: "#fafafa",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 0.2, lineHeight: 1 }}
                        >
                          {item.name} ({item.specs})
                        </Typography>

                        <Grid container spacing={0.5} sx={{ mb: 0.75 }}>
                          <Grid item xs={4}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Quantity
                            </Typography>
                            <Typography variant="body2">
                              {item.qty} {item.uom}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Total ABC
                            </Typography>
                            <Typography variant="body2">
                              ₱{Number(item.abc).toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Purchase Price
                            </Typography>
                            <Typography variant="body2">
                              ₱{Number(item.purchasePrice).toLocaleString()}
                            </Typography>
                          </Grid>
                        </Grid>
                        <Divider sx={{ my: 0.5 }} />

                        {item.purchaseOptions?.length >= 0 && (
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

                              <Box
                                sx={{
                                  position: "relative",
                                  display: "inline-flex",
                                }}
                              >
                                <IconButton size="small" color="primary">
                                  {expandedItemId === item.id ? (
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

                            {expandedItemId === item.id &&
                              (addingOptionItemId === item.id ? (
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
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mt: 1,
                                    }}
                                  >
                                    <BackButton
                                      onClick={() =>
                                        setAddingOptionItemId(null)
                                      }
                                    />
                                    <SaveButton onClick={savePurchaseOption} />
                                  </Box>
                                </Paper>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.5,
                                  }}
                                >
                                  {item.purchaseOptions.map((option) => (
                                    <PurchaseOptionCard
                                      key={option.id}
                                      option={{
                                        ...option,
                                        supplierName:
                                          option.supplierName ||
                                          option.strSupplierName,
                                      }}
                                      onEdit={() => handleEditOption(option)}
                                      onDelete={() =>
                                        handleDeleteOption(option)
                                      }
                                      onToggleInclude={(value) =>
                                        handleToggleInclude(
                                          item.id,
                                          option.id,
                                          value
                                        )
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
                                    onClick={() =>
                                      setAddingOptionItemId(item.id)
                                    }
                                  >
                                    <IconButton color="primary" size="large">
                                      <AddIcon />
                                    </IconButton>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Add Purchase Option
                                    </Typography>
                                  </Paper>
                                </Box>
                              ))}
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </InfoSection>
          </Grid>
        </Grid>
      </Box>
    </ModalContainer>
  );
}

export default ATransactionInfoModal;
