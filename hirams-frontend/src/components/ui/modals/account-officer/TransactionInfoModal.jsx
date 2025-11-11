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

// Reusable components
import InfoSection from "../../account-officer/InfoSection";
import DetailItem from "../../account-officer/DetailItem";
import PurchaseOptionCard from "../../account-officer/PurchaseoptionCard";

// ---------- Initial Data ----------
const initialFormData = {
  supplierName: "",
  quantity: "",
  uom: "",
  brand: "",
  model: "",
  specs: "",
  unitPrice: "",
  ewt: "",
};

// ---------- Main Component ----------
function ATransactionInfoModal({ open, onClose, transaction }) {
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [addingOptionItemId, setAddingOptionItemId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);

  const { procMode, procSource, itemType } = useMapping();

  // Fetch suppliers dynamically
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("suppliers/all");
        const options = res.suppliers.map((s) => ({
          label: s.strSupplierName,
          value: s.nSupplierId, // match backend field
        }));
        setSuppliers(options);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch transaction items
  useEffect(() => {
    const fetchItems = async () => {
      if (!transaction?.nTransactionId) return;
      try {
        const res = await api.get(
          `transactions/${transaction.nTransactionId}/items`
        );
        setItems(res?.items || []);
      } catch (err) {
        console.error("Error fetching transaction items:", err);
      }
    };
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

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const savePurchaseOption = () => {
    console.log("Save purchase option", formData);
    setFormData(initialFormData);
    setErrors({});
    setAddingOptionItemId(null);
  };

  // Fields for FormGrid with dynamic supplier options
  const fields = [
    {
      name: "supplierName",
      label: "Supplier",
      type: "select",
      xs: 12,
      options: suppliers, // dynamically fetched
      value: formData.supplierName,
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
          {/* ---------- Left Info ---------- */}
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
                <DetailItem label="Procurement Source" value={procSourceLabel} />
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

          {/* ---------- Right Items ---------- */}
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
                  <IconButton size="small" color="primary">
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
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
                        {/* Item Header */}
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 0.2, lineHeight: 1 }}
                        >
                          {item.name} ({item.specs})
                        </Typography>

                        {/* Item Details */}
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

                        {/* Purchase Options */}
                        {item.purchaseOptions?.length >= 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {/* Header */}
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

                            {/* Expanded content */}
                            {expandedItemId === item.id &&
                              (addingOptionItemId === item.id ? (
                                <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "#fafafa" }}>
                                  <FormGrid
                                    fields={fields}
                                    formData={formData}
                                    errors={errors}
                                    handleChange={handleChange}
                                    handleSwitchChange={handleSwitchChange}
                                  />
                                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <button onClick={savePurchaseOption}>Save</button>
                                    <button onClick={() => setAddingOptionItemId(null)}>Back</button>
                                  </Box>
                                </Paper>
                              ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                  {item.purchaseOptions.map((option) => (
                                    <PurchaseOptionCard
                                      key={option.id}
                                      option={option}
                                      onEdit={() => console.log("Edit", option)}
                                      onDelete={() => console.log("Delete", option)}
                                    />
                                  ))}

                                  {/* Add Purchase Option */}
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
