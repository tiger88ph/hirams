import React, { useState, useEffect, useCallback } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer";
import { Box, Typography, Divider, Chip, IconButton } from "@mui/material";
import {
  MonetizationOn,
  AttachMoney,
  AddCircleOutline as AddCircleOutlineIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import api from "../../../../../utils/api/api";
import VerificationModalCard from "../../../../../components/common/VerificationModalCard";
import Toast from "../../../../../components/helper/Toast";
import FormGrid from "../../../../../components/common/FormGrid";
import uiMessages from "../../../../../utils/helpers/uiMessages";
const DirectCostRow = ({
  item,
  optionLabel,
  onEdit,
  onDelete,
  isManagement,
  isPricingSetting,
}) => {
  const canEdit = isManagement && isPricingSetting;
  const amount = Number(item.dAmount) || 0;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 2 },
        py: 1.2,
        px: { xs: 1, sm: 1.5 },
        borderRadius: 1.5,
        backgroundColor: amount > 0 ? "#e3f2fd" : "#fafafa",
        border: `1px solid ${amount > 0 ? "#90caf9" : "#e0e0e0"}`,
        transition: "all 0.2s ease",
        cursor: canEdit ? "pointer" : "default",
        "&:hover": canEdit
          ? {
              backgroundColor: "#d2e3fc",
              borderColor: "#64b5f6",
              boxShadow: "0 2px 8px rgba(25,118,210,0.10)",
            }
          : {},
      }}
      onClick={() => canEdit && onEdit()}
    >
      {/* Icon */}
      <Box
        sx={{
          backgroundColor: amount > 0 ? "#1976d2" : "#bdbdbd",
          borderRadius: "6px",
          p: 0.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background-color 0.2s",
        }}
      >
        <AttachMoney sx={{ color: "white", fontSize: "0.9rem" }} />
      </Box>

      {/* Label — hidden on xs */}
      <Typography
        sx={{
          flex: 1,
          fontSize: "0.78rem",
          fontWeight: amount > 0 ? 600 : 500,
          color: amount > 0 ? "#1565c0" : "#555",
          transition: "color 0.2s",
          display: { xs: "none", sm: "block" },
        }}
      >
        {optionLabel}
      </Typography>

      {/* Amount display */}
      <Box
        sx={{
          width: { xs: "100px", sm: "150px" },
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          px: 1,
          borderRadius: 1,
          backgroundColor: "white",
          border: "1px solid #e0e0e0",
          flexShrink: 0,
          ml: { xs: "auto", sm: 0 },
        }}
      >
        <Typography
          component="span"
          sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#666" }}
        >
          ₱
        </Typography>
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: amount > 0 ? 600 : 400,
            color: amount > 0 ? "#1565c0" : "#aaa",
          }}
        >
          {amount > 0
            ? amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—"}
        </Typography>
      </Box>

      {/* Delete button */}
      {canEdit && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            width: 24,
            height: 24,
            flexShrink: 0,
            bgcolor: "#fff",
            border: "1px solid #e0e0e0",
            "&:hover": { bgcolor: "#ffebee", borderColor: "#ef9a9a" },
          }}
        >
          <CloseIcon sx={{ fontSize: "0.75rem", color: "#e53935" }} />
        </IconButton>
      )}
    </Box>
  );
};
const AddCostRow = ({ onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: { xs: 1, sm: 2 },
      py: 1.2,
      px: { xs: 1, sm: 1.5 },
      borderRadius: 1.5,
      backgroundColor: "#fafafa",
      border: "2px dashed #90caf9",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#f0f8ff",
        borderColor: "#1976d2",
        "& .add-icon": { color: "#1976d2" },
        "& .add-label": { color: "#1565c0" },
      },
    }}
  >
    <Box
      sx={{
        backgroundColor: "#e3f2fd",
        borderRadius: "6px",
        p: 0.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AddCircleOutlineIcon
        className="add-icon"
        sx={{ color: "#90caf9", fontSize: "0.9rem", transition: "color 0.2s" }}
      />
    </Box>

    {/* Label — hidden on xs */}
    <Typography
      className="add-label"
      sx={{
        flex: 1,
        fontSize: "0.78rem",
        fontWeight: 500,
        color: "#90caf9",
        transition: "color 0.2s",
        display: { xs: "none", sm: "block" },
      }}
    >
      Add Direct Cost
    </Typography>

    <Box
      sx={{
        width: { xs: "100px", sm: "150px" },
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        backgroundColor: "#f5f5f5",
        border: "1px dashed #bdbdbd",
        flexShrink: 0,
        ml: { xs: "auto", sm: 0 },
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", color: "#bdbdbd" }}>
        ₱ 0.00
      </Typography>
    </Box>

    {/* Spacer — aligns with × button column */}
    <Box sx={{ width: 24, flexShrink: 0 }} />
  </Box>
);
const EditFormRow = ({
  formData,
  errors,
  formFields,
  handleChange,
  onCancel,
  saving,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: { xs: 1, sm: 2 },
      py: 1.2,
      px: { xs: 1, sm: 1.5 },
      borderRadius: 1.5,
      backgroundColor: "#fff8e1",
      border: "1.5px solid #ffb74d",
      boxShadow: "0 2px 8px rgba(255,152,0,0.08)",
    }}
  >
    {/* Icon */}
    <Box
      sx={{
        backgroundColor: "#f57c00",
        borderRadius: "6px",
        p: 0.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        mt: 0.5,
      }}
    >
      <AttachMoney sx={{ color: "white", fontSize: "0.9rem" }} />
    </Box>

    {/* FormGrid takes up remaining space */}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <FormGrid
        fields={formFields}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        autoFocus={false}
      />
    </Box>

    {/* Cancel button */}
    <IconButton
      size="small"
      onClick={onCancel}
      disabled={saving}
      sx={{
        width: 24,
        height: 24,
        flexShrink: 0,
        bgcolor: "#fff",
        border: "1px solid #e0e0e0",
        mt: 0.5,
        "&:hover": { bgcolor: "#ffebee", borderColor: "#ef9a9a" },
      }}
    >
      <CloseIcon sx={{ fontSize: "0.75rem", color: "#e53935" }} />
    </IconButton>
  </Box>
);
/* -------------------------------------------------------
   Main Modal
------------------------------------------------------- */
function DirectCostModal({
  open,
  onClose,
  transaction,
  isManagement = true,
  isPricingSetting,
}) {
  const [directCostOptions, setDirectCostOptions] = useState([]);
  const [directCostList, setDirectCostList] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // null = plain list, -1 = adding new row, number = editing that index
  const [editingIndex, setEditingIndex] = useState(null);

  const [formData, setFormData] = useState({
    nDirectCostOptionID: "",
    dAmount: "",
  });
  const [errors, setErrors] = useState({});

  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteLetter, setDeleteLetter] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });
  const handleCloseToast = () =>
    setToast({ open: false, message: "", severity: "success" });

  const [totalEWT, setTotalEWT] = useState(0);

  const isEWTOption = (optionId) => {
    const label = getOptionLabel(optionId);
    return label?.toLowerCase() === "ewt";
  };

  /* ---------- Helpers ---------- */
  const getOptionLabel = useCallback(
    (optionId) => {
      const found = directCostOptions.find(
        (o) => (o.nDirectCostOptionID || o.id) === optionId,
      );
      return found?.strName || found?.name || "Direct Cost";
    },
    [directCostOptions],
  );

  const getAvailableOptions = useCallback(() => {
    const usedIds = directCostList
      .filter((_, i) => i !== editingIndex)
      .map((item) => item.nDirectCostOptionID);

    return directCostOptions.filter(
      (opt) => !usedIds.includes(opt.nDirectCostOptionID || opt.id),
    );
  }, [directCostOptions, directCostList, editingIndex]);

  /* ---------- Fetch ---------- */
const fetchData = useCallback(async () => {
  if (!transaction?.nTransactionId) return;
  setOptionsLoading(true);
  try {
    // Cache direct-cost-options — they never change per session
    let optionsData = null;
    const cached = sessionStorage.getItem("direct_cost_options_cache");
    if (cached) {
      optionsData = JSON.parse(cached);
    }

    const costsPromise = api.get(
      `direct-cost?nTransactionID=${transaction.nTransactionId}&withEWT=1`,
    );
    const optionsPromise = optionsData
      ? Promise.resolve(optionsData)
      : api.get("direct-cost-options");

    const [costsRes, optionsRes] = await Promise.all([
      costsPromise,
      optionsPromise,
    ]);

    const opts = optionsRes.data || optionsRes || [];
    if (!cached) {
      sessionStorage.setItem("direct_cost_options_cache", JSON.stringify(opts));
    }

    setDirectCostOptions(opts);
    setDirectCostList(costsRes.directCosts || costsRes.data || costsRes || []);
    setTotalEWT(Number(costsRes.totalEWT) || 0);
  } catch (err) {
    console.error("Error fetching direct costs:", err);
  } finally {
    setOptionsLoading(false);
    setLoadingMessage("");
  }
}, [transaction?.nTransactionId]);
  useEffect(() => {
    if (open) {
      fetchData();
      setEditingIndex(null);
      setDeleteIndex(null);
      setFormData({ nDirectCostOptionID: "", dAmount: "" });
      setErrors({});
    }
  }, [open, fetchData]);

  /* ---------- Form ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nDirectCostOptionID") {
      setFormData((prev) => ({
        ...prev,
        nDirectCostOptionID: value,
        dAmount: "",
      }));
    } else {
      const sanitized =
        name === "dAmount" ? value.replace(/[^0-9.]/g, "") : value;
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.nDirectCostOptionID) errs.nDirectCostOptionID = "Required";
    if (
      !formData.dAmount ||
      isNaN(Number(formData.dAmount)) ||
      Number(formData.dAmount) <= 0
    )
      errs.dAmount = "Enter valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ nDirectCostOptionID: "", dAmount: "" });
    setErrors({});
  };

  /* ---------- Save ---------- */
  const handleSave = async () => {
    if (!validateForm()) return;
    const isNew = editingIndex === -1;
    const entity = getOptionLabel(formData.nDirectCostOptionID);
    setLoading(true);
    setLoadingMessage(
      isNew
        ? `${uiMessages.common.adding}${entity}${uiMessages.common.ellipsis}`
        : `${uiMessages.common.updating}${entity}${uiMessages.common.ellipsis}`,
    );
    try {
      const payload = {
        nTransactionID: transaction.nTransactionId,
        nDirectCostOptionID: formData.nDirectCostOptionID,
        dAmount: Number(formData.dAmount),
      };
      if (isNew) {
        await api.post("direct-cost", payload);
      } else {
        const existingId = directCostList[editingIndex].nDirectCostID;
        await api.put(`direct-cost/${existingId}`, payload);
      }
      const costsRes = await api.get(
        `direct-cost?nTransactionID=${transaction.nTransactionId}`,
      );
      setDirectCostList(costsRes.data || costsRes || []);
      showToast(
        isNew
          ? `${entity}${uiMessages.common.addedSuccessfully}`
          : `${entity}${uiMessages.common.updatedSuccessfully}`,
        "success",
      );
      cancelEdit();
    } catch (err) {
      console.error("Error saving direct cost:", err);
      showToast("Failed to save direct cost.", "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  /* ---------- Delete ---------- */
  const handleDeleteCost = (index) => {
    setDeleteIndex(index);
    setDeleteLetter("");
    setDeleteError("");
    cancelEdit();
  };

  const confirmDelete = async () => {
    const item = directCostList[deleteIndex];
    if (!item) return;
    const entity = getOptionLabel(item.nDirectCostOptionID);
    if (deleteLetter.toUpperCase() !== entity[0]?.toUpperCase()) {
      setDeleteError(`${uiMessages.common.errorReqChar}`);
      return;
    }
    setLoading(true);
    setLoadingMessage(
      `${uiMessages.common.deleting}${entity}${uiMessages.common.ellipsis}`,
    );
    try {
      await api.delete(`direct-cost/${item.nDirectCostID}`);
      const costsRes = await api.get(
        `direct-cost?nTransactionID=${transaction.nTransactionId}`,
      );
      setDirectCostList(costsRes.data || costsRes || []);
      showToast(`${entity}${uiMessages.common.deletedSuccessfully}`, "success");
    } catch (err) {
      showToast("Failed to delete direct cost.", "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setDeleteIndex(null);
      setDeleteLetter("");
      setDeleteError("");
    }
  };

  /* ---------- Derived ---------- */
  const total = directCostList.reduce(
    (sum, item) => sum + (Number(item.dAmount) || 0),
    0,
  );
  const isInDeleteMode = deleteIndex !== null;
  const isInEditMode = editingIndex !== null;
  const availableOptions = getAvailableOptions();
  const allOptionsUsed = availableOptions.length === 0 && editingIndex === null;

  const formFields = [
    {
      name: "nDirectCostOptionID",
      label: "Cost Type",
      type: "select",
      xs: 12,
      options: availableOptions.map((opt) => ({
        value: opt.nDirectCostOptionID || opt.id,
        label:
          opt.strName ||
          opt.name ||
          `Option ${opt.nDirectCostOptionID || opt.id}`,
      })),
    },
    {
      name: "dAmount",
      label: "Amount (₱)",
      type: "text",
      xs: 12,
      placeholder: isEWTOption(formData.nDirectCostOptionID)
        ? totalEWT.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0.00",
      numberOnly: false,
    },
  ];

  if (!open) return null;

  // Combine optionsLoading into the modal's loading state
  const isLoading = loading || optionsLoading;

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        cancelEdit();
        setDeleteIndex(null);
        onClose();
      }}
      title={isInDeleteMode ? "Delete Direct Cost" : "Direct Costs"}
      subTitle={
        isInDeleteMode && directCostList[deleteIndex]
          ? `/ ${transaction?.strCode} / ${getOptionLabel(directCostList[deleteIndex].nDirectCostOptionID)}`
          : transaction?.strCode
            ? `/ ${transaction.strCode}`
            : ""
      }
      onSave={
        isInDeleteMode ? confirmDelete : isInEditMode ? handleSave : undefined
      }
      loading={isLoading}
      customMessage={loadingMessage}
      disabled={isLoading}
      showSave={(isInEditMode || isInDeleteMode) && isManagement}
      saveLabel={isInDeleteMode ? "Confirm" : "Save"}
      showCancel={true}
      cancelLabel={isInEditMode || isInDeleteMode ? "Back" : "Cancel"}
      onCancel={() => {
        if (isInDeleteMode) setDeleteIndex(null);
        else if (isInEditMode) cancelEdit();
        else onClose();
      }}
    >
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />

      {/* ---- DELETE VERIFICATION ---- */}
      {isInDeleteMode ? (
        <VerificationModalCard
          entityName={getOptionLabel(
            directCostList[deleteIndex]?.nDirectCostOptionID,
          )}
          verificationInput={deleteLetter}
          setVerificationInput={setDeleteLetter}
          verificationError={deleteError}
          onBack={() => setDeleteIndex(null)}
          onConfirm={confirmDelete}
          actionWord="Delete"
          confirmButtonColor="error"
          showToast={showToast}
        />
      ) : (
        <Box sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              pb: 1,
              borderBottom: "2px solid #f57c00",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  backgroundColor: "#f57c00",
                  borderRadius: "6px",
                  p: 0.6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MonetizationOn sx={{ color: "white", fontSize: "1rem" }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#f57c00",
                }}
              >
                Direct Cost Items
              </Typography>
            </Box>

            <Chip
              label={`${directCostList.length} item${directCostList.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{
                fontSize: "0.7rem",
                backgroundColor:
                  directCostList.length > 0 ? "#fff3e0" : "#f5f5f5",
                color: directCostList.length > 0 ? "#e65100" : "#666",
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Rows */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Existing saved rows */}
            {directCostList.map((item, index) =>
              editingIndex === index ? (
                <EditFormRow
                  key={item.nDirectCostID || index}
                  formData={formData}
                  errors={errors}
                  formFields={formFields}
                  handleChange={handleChange}
                  onCancel={cancelEdit}
                  saving={loading}
                />
              ) : (
                <DirectCostRow
                  key={item.nDirectCostID || index}
                  item={item}
                  optionLabel={getOptionLabel(item.nDirectCostOptionID)}
                  onEdit={() => {
                    setEditingIndex(index);
                    setFormData({
                      nDirectCostOptionID: item.nDirectCostOptionID,
                      dAmount: String(item.dAmount || ""),
                    });
                    setErrors({});
                  }}
                  onDelete={() => handleDeleteCost(index)}
                  isManagement={isManagement}
                  isPricingSetting={isPricingSetting}
                />
              ),
            )}
            {/* Empty state — shown when no costs and not in add/edit mode */}
            {directCostList.length === 0 && editingIndex === null && (
              <Box
                sx={{
                  py: 3,
                  textAlign: "center",
                  border: "1px dashed #e0e0e0",
                  borderRadius: 1.5,
                  backgroundColor: "#fafafa",
                }}
              >
                <Typography sx={{ fontSize: "0.75rem", color: "#aaa" }}>
                  No direct costs recorded for this transaction.
                </Typography>
              </Box>
            )}
            {/* Add row — only when isPricingSetting is true and options still available */}
            {isManagement &&
              isPricingSetting &&
              editingIndex === null &&
              !allOptionsUsed && (
                <AddCostRow
                  onClick={() => {
                    setEditingIndex(-1);
                    setFormData({ nDirectCostOptionID: "", dAmount: "" });
                    setErrors({});
                  }}
                />
              )}

            {/* Inline add form */}
            {isManagement && isPricingSetting && editingIndex === -1 && (
              <EditFormRow
                formData={formData}
                errors={errors}
                formFields={formFields}
                handleChange={handleChange}
                onCancel={cancelEdit}
                saving={loading}
              />
            )}

            {/* All options used message */}
            {isManagement &&
              isPricingSetting &&
              allOptionsUsed &&
              directCostList.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 1,
                    borderRadius: 1.5,
                    backgroundColor: "#f5f5f5",
                    border: "1px dashed #bdbdbd",
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", color: "#999" }}>
                    All cost types have been added.
                  </Typography>
                </Box>
              )}
          </Box>

          {/* Total */}
          {directCostList.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: { xs: 1, sm: 1.5 },
                  py: 1.2,
                  borderRadius: 1.5,
                  backgroundColor: "#fff3e0",
                  border: "1px solid #ffb74d",
                  borderLeft: "4px solid #f57c00",
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "0.72rem", sm: "0.8rem" },
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#e65100",
                  }}
                >
                  Total Direct Cost
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    fontWeight: 700,
                    color: "#e65100",
                  }}
                >
                  ₱{" "}
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )}
    </ModalContainer>
  );
}

export default DirectCostModal;
