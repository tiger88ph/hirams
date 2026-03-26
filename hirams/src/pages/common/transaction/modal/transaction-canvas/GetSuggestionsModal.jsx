import React, { useState, useEffect, useRef, useCallback } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import {
  Box,
  Typography,
  Divider,
  Skeleton,
  InputBase,
  Link,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../../utils/form/validation.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";

/* ── Date formatter ── */
const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })}, ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
};

/* ── Initial form state ── */
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
  bAddOn: false,
};

/* ── Skeleton row ── */
function SuggestionRowSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        borderRadius: "8px",
        border: "0.5px solid #e5e7eb",
        background: "#fafafa",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Skeleton
            variant="text"
            width={140}
            height={16}
            sx={{ borderRadius: "4px" }}
          />
          <Skeleton
            variant="rounded"
            width={80}
            height={18}
            sx={{ borderRadius: "4px" }}
          />
          <Skeleton
            variant="rounded"
            width={55}
            height={18}
            sx={{ borderRadius: "4px" }}
          />
        </Box>
        <Skeleton
          variant="text"
          width="85%"
          height={13}
          sx={{ borderRadius: "4px" }}
        />
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <Skeleton
          variant="rounded"
          width={42}
          height={26}
          sx={{ borderRadius: "6px" }}
        />
        <Skeleton variant="text" width={90} height={12} sx={{ mt: "auto" }} />
      </Box>
    </Box>
  );
}

/* ── Suggestion row ── */
function SuggestionRow({ suggestion, onUse }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        borderRadius: "8px",
        border: "0.5px solid #e5e7eb",
        background: "#fafafa",
        "&:hover": { background: "#f0f7ff", borderColor: "#bfdbfe" },
        transition: "all 0.15s",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#111827",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 220,
            }}
          >
            {[suggestion.brand, suggestion.model]
              .filter(Boolean)
              .join(" · ") || (
              <span style={{ color: "#9ca3af" }}>No brand/model</span>
            )}
          </Typography>
          {suggestion.supplierName && (
            <Box
              sx={{
                fontSize: "0.63rem",
                color: "#6b7280",
                background: "#f3f4f6",
                border: "0.5px solid #e5e7eb",
                borderRadius: "4px",
                px: 0.75,
                py: 0.15,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#9ca3af", fontSize: "0.6rem" }}>By</span>{" "}
              {suggestion.supplierNickName || suggestion.supplierName}
            </Box>
          )}
          {suggestion.unitPrice > 0 && (
            <Box
              sx={{
                fontSize: "0.63rem",
                background: "#eaf3de",
                border: "0.5px solid #97c459",
                borderRadius: "4px",
                px: 0.75,
                py: 0.15,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.3,
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#3b6d11", fontSize: "0.6rem" }}>₱</span>
              <span style={{ color: "#27500a", fontWeight: 700 }}>
                {Number(suggestion.unitPrice).toLocaleString()}
              </span>
            </Box>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: "0.65rem",
            color: "#9ca3af",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {suggestion.specs ? (
            <>
              <Box component="span" sx={{ color: "#6b7280", fontWeight: 500 }}>
                Specs{" "}
              </Box>
              {suggestion.specs.replace(/<[^>]*>/g, "")}
            </>
          ) : (
            <Box
              component="span"
              sx={{ fontStyle: "italic", color: "#d1d5db" }}
            >
              No specifications.
            </Box>
          )}
        </Typography>
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 0.5,
          minWidth: 90,
        }}
      >
        <button
          onClick={() => onUse(suggestion)}
          style={{
            fontSize: "0.68rem",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "4px 12px",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          Use
        </button>
        {suggestion.dtCanvass && (
          <Typography
            sx={{
              fontSize: "0.58rem",
              color: "#c4c9d4",
              whiteSpace: "nowrap",
              mt: "auto",
              textAlign: "right",
            }}
          >
            {fmtDate(suggestion.dtCanvass)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
function GetSuggestionsModal({
  open,
  onClose,
  item,
  itemId,
  suppliers,
  cItemType,
  onSuccess,
}) {
  const navigate = useNavigate();

  /* ── Search state ── */
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Form view state ── */
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [calculatedEWT, setCalculatedEWT] = useState("");
  const [ewtLoading, setEwtLoading] = useState(false);
  const ewtDebounceRef = useRef(null);

  const hasQuery = query.trim().length > 0;
  const isEmpty = !loading && suggestions.length === 0;

  /* ── Fetch suggestions ── */
  const fetchSuggestions = useCallback(async (search) => {
    const term = search.trim();
    if (!term) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams({ search: term });
      const res = await api.get(
        `purchase-options/suggestions?${params.toString()}`,
      );
      setSuggestions(res.suggestions || res.data?.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    if (open) {
      if (item?.name) setQuery((prev) => prev || item.name);
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, item]);

  /* ── EWT auto-calculate ── */
  useEffect(() => {
    if (!showForm) return;
    const supplierId = Number(formData.nSupplierId);
    const quantity = Number(formData.quantity);
    const unitPrice = Number(formData.unitPrice);

    if (
      !supplierId ||
      !quantity ||
      !unitPrice ||
      isNaN(quantity) ||
      isNaN(unitPrice)
    ) {
      clearTimeout(ewtDebounceRef.current);
      setCalculatedEWT("");
      setFormData((prev) => ({ ...prev, ewt: "" }));
      setEwtLoading(false);
      return;
    }

    setEwtLoading(true);
    clearTimeout(ewtDebounceRef.current);
    let cancelled = false;

    ewtDebounceRef.current = setTimeout(async () => {
      try {
        const response = await api.post("purchase-options/calculate-ewt", {
          nSupplierId: supplierId,
          quantity,
          unitPrice,
          cItemType,
        });
        if (!cancelled) {
          const ewt = response.calculatedEWT;
          setCalculatedEWT(ewt);
          setFormData((prev) => ({ ...prev, ewt }));
        }
      } catch {
        if (!cancelled) {
          setCalculatedEWT("");
          setFormData((prev) => ({ ...prev, ewt: "" }));
        }
      } finally {
        if (!cancelled) setEwtLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(ewtDebounceRef.current);
    };
  }, [
    showForm,
    Number(formData.nSupplierId),
    Number(formData.quantity),
    Number(formData.unitPrice),
    cItemType,
  ]);

  /* ── Handlers: search view ── */
  const handleClose = () => {
    setQuery("");
    setSuggestions([]);
    setIsFocused(false);
    setShowForm(false);
    setFormData(initialFormData);
    setErrors({});
    setCalculatedEWT("");
    clearTimeout(debounceRef.current);
    onClose();
  };

  const handleUse = (suggestion) => {
    const includedQty = (item?.purchaseOptions || [])
      .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
    const remainingQty = Number(item?.qty || 0) - includedQty;

    setFormData({
      ...initialFormData,
      quantity: remainingQty > 0 ? remainingQty : (item?.qty ?? ""),
      uom: item?.uom ?? "",
      specs: suggestion.specs ?? item?.specs ?? "",
      brand: suggestion.brand ?? "",
      model: suggestion.model ?? "",
      nSupplierId: suggestion.nSupplierId ?? "",
      unitPrice:
        suggestion.unitPrice != null ? String(suggestion.unitPrice) : "",
    });
    setCalculatedEWT("");
    setErrors({});
    setShowForm(true);
  };

  /* ── Handlers: form view ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSupplierChange = (value) => {
    const selected = suppliers.find((s) => s.value === Number(value));
    setFormData((prev) => ({ ...prev, nSupplierId: selected?.value || "" }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_OPTION");
    const includedQty = (item?.purchaseOptions || [])
      .filter((o) => o.bIncluded && Number(o.bAddOn) !== 1)
      .reduce((s, o) => s + Number(o.nQuantity || 0), 0);
    const remainingQty = Number(item?.qty || 0) - includedQty;

    if (!formData.bAddOn && remainingQty != null) {
      const enteredQty = Number(formData.quantity);
      if (enteredQty > remainingQty) {
        validationErrors.quantity = `Quantity exceeds the remaining unfulfilled qty (${remainingQty} ${item?.uom || ""}).`;
      }
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const brandModel =
      formData.model || formData.brand
        ? `${formData.model || ""}${formData.model && formData.brand ? " (" : ""}${formData.brand || ""}${formData.model && formData.brand ? ")" : ""}`
        : "Purchase Option";

    const payload = {
      nTransactionItemId: itemId,
      nSupplierId: formData.nSupplierId || null,
      quantity: Number(formData.quantity),
      uom: formData.uom,
      brand: formData.brand || null,
      model: formData.model || null,
      specs: formData.specs || null,
      unitPrice: Number(formData.unitPrice),
      ewt: Number(formData.ewt) || 0,
      bIncluded: formData.bIncluded ? 1 : 0,
      bAddOn: formData.bAddOn ? 1 : 0,
    };

    try {
      handleClose();
      await withSpinner(brandModel, async () => {
        await api.post("purchase-options", payload);
        await onSuccess();
      });
      await showSwal("SUCCESS", {}, { entity: brandModel, action: "added" });
    } catch (err) {
      setErrors(
        err.response?.data?.errors || {
          general: `${uiMessages.common.errorMessage}`,
        },
      );
      await showSwal("ERROR", {}, { entity: brandModel });
    }
  };

  const fields = [
    { name: "brand", label: "Brand", xs: 4 },
    { name: "model", label: "Model", xs: 4 },
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      options: suppliers,
      xs: 4,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    {
      name: "_supplierLink",
      type: "custom",
      xs: 12,
      render: () => (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "right",
            mt: -0.5,
            fontSize: "0.65rem",
            lineHeight: 1,
          }}
        >
          New Supplier?{" "}
          <Link
            component="button"
            underline="hover"
            color="primary"
            sx={{ fontSize: "inherit" }}
            onClick={() => {
              handleClose();
              navigate("/supplier?add=true");
            }}
          >
            Click here
          </Link>
        </Typography>
      ),
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      xs: 4,
      numberOnly: true,
    },
    {
      name: "unitPrice",
      label: "Unit Price",
      type: "peso",
      xs: 4,
      numberOnly: true,
    },
    {
      name: "ewt",
      label: ewtLoading ? "EWT (calculating...)" : "EWT",
      type: "peso",
      xs: 4,
      numberOnly: true,
      value: calculatedEWT ? Number(calculatedEWT) : "",
      onChange: (e) =>
        setFormData((prev) => ({ ...prev, ewt: e.target.value })),
      placeholder: calculatedEWT
        ? Number(calculatedEWT).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0.00",
    },
    {
      name: "specs",
      label: "Specifications",
      placeholder: "Type here the specifications...",
      type: "textarea",
      xs: 12,
      multiline: true,
      minRows: 4,
      showHighlighter: false,
      showAllFormatting: true,
      sx: { "& textarea": { resize: "vertical" } },
    },
  ];

  const switches = [{ name: "bAddOn", label: "Add-On?", xs: 12 }];

  /* ── Render ── */
  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={showForm ? "Add Purchase Option" : "Get Suggestions"}
      subTitle={
        showForm
          ? formData.brand || formData.model
            ? `/ ${[formData.brand, formData.model].filter(Boolean).join(" ")}`
            : ""
          : "/ Purchase Options"
      }
      showSave={showForm}
      onSave={showForm ? handleSave : undefined}
      disabled={showForm && ewtLoading}
      cancelLabel={showForm ? "Back" : "Cancel"}
      onCancel={
        showForm
          ? () => {
              setShowForm(false);
              setErrors({});
            }
          : undefined
      }
    >
      {/* ══ SEARCH VIEW ══ */}
      {!showForm && (
        <>
          {/* Search bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
              background: isFocused ? "#fff" : "#f8fafc",
              border: isFocused ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
              borderRadius: "12px",
              px: 1.75,
              py: 1,
              mb: 2.5,
              boxShadow: isFocused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
              transition: "all 0.25s ease",
              position: "sticky",
              top: 0,
              zIndex: 10,
              backdropFilter: "blur(8px)",
            }}
          >
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              {loading ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isFocused ? "#3b82f6" : "#9ca3af"}
                  strokeWidth="2.5"
                  style={{ transition: "stroke 0.2s" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </Box>

            <InputBase
              inputRef={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search by brand, model, or item name..."
              sx={{
                flex: 1,
                fontSize: "0.82rem",
                color: "#111827",
                "& input": { padding: 0 },
                "& input::placeholder": { color: "#9ca3af", opacity: 1 },
              }}
            />

            {hasQuery && (
              <Box
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                sx={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  "&:hover": { background: "#d1d5db" },
                  transition: "background 0.15s",
                }}
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="3"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Box>
            )}
          </Box>

          {/* Results area */}
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <Divider sx={{ flex: 1 }} />
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: loading
                    ? "#93c5fd"
                    : hasQuery && suggestions.length > 0
                      ? "#60a5fa"
                      : "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                {loading
                  ? "Searching..."
                  : hasQuery && suggestions.length > 0
                    ? `${suggestions.length} result${suggestions.length !== 1 ? "s" : ""} found`
                    : "Recent Purchase Options"}
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            {loading && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[...Array(3)].map((_, i) => (
                  <SuggestionRowSkeleton key={i} />
                ))}
              </Box>
            )}

            {isEmpty && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 4,
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 0.5,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  {hasQuery
                    ? "No results found"
                    : "Search for purchase options"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    color: "#9ca3af",
                    textAlign: "center",
                    maxWidth: 260,
                  }}
                >
                  {hasQuery
                    ? `No purchase options matched "${query}". Try a different keyword.`
                    : "Type a brand, model, or item name to find matching purchase options from past transactions."}
                </Typography>
              </Box>
            )}

            {!loading && suggestions.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {suggestions.map((s, i) => (
                  <SuggestionRow
                    key={s.id ?? i}
                    suggestion={s}
                    onUse={handleUse}
                  />
                ))}
              </Box>
            )}
          </Box>
        </>
      )}

      {/* ══ FORM VIEW ══ */}
      {showForm && (
        <FormGrid
          fields={fields}
          switches={switches}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleSwitchChange={handleSwitchChange}
        />
      )}
    </ModalContainer>
  );
}

export default GetSuggestionsModal;
