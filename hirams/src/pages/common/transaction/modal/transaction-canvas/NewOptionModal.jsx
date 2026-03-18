import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import { Box, Typography, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../../utils/form/validation.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";

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

// ── Suggestion Panel ────────────────────────────────────────────────────────
function SuggestionPanel({
  suggestions,
  loading,
  highlightedIndex,
  onSelect,
  onHighlight,
  onDismiss,
  anchorRef,
  listRef,
  isPanelHovered,
  placement = "left",
  offset = { x: 0, y: 0 },
}) {
  const [panelStyle, setPanelStyle] = useState({ display: "none" });

  useEffect(() => {
    const reposition = () => {
      if (!anchorRef.current || (!suggestions.length && !loading)) {
        setPanelStyle({ display: "none" });
        return;
      }

      const rect = anchorRef.current.getBoundingClientRect();
      const PANEL_WIDTH = 300;
      const GAP = 30;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top, left;

      switch (placement) {
        case "right":
          left = rect.right + GAP;
          top = rect.top;
          break;
        case "below":
          left = rect.left;
          top = rect.bottom + GAP;
          break;
        case "above":
          left = rect.left;
          top = rect.top - GAP;
          break;
        case "left":
        default:
          left = rect.left - PANEL_WIDTH - GAP;
          top = rect.top;
          break;
      }

      left += offset.x;
      top += offset.y;

      left = Math.max(8, Math.min(left, vw - PANEL_WIDTH - 8));
      top = Math.max(8, top);

      const maxHeight = Math.min(400, vh - top - 16);

      setPanelStyle({
        position: "fixed",
        top: placement === "above" ? undefined : top,
        bottom: placement === "above" ? vh - top : undefined,
        left,
        width: PANEL_WIDTH,
        maxHeight,
        zIndex: 1500,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        border: "0.5px solid #e5e7eb",
        overflow: "hidden",
      });
    };

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [suggestions, loading, anchorRef, placement, offset]);

  useEffect(() => {
    if (!listRef.current || highlightedIndex < 0) return;
    const item = listRef.current.children[highlightedIndex];
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, listRef]);

  const visible = suggestions.length > 0 || loading;
  if (!visible) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes sfadeInRight {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .so-panel { animation: sfadeInRight 0.16s ease; }
        .so-item { transition: background 0.1s; }
        .so-item:hover { background: #eff6ff; }
        .so-close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 16px; line-height: 1; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
        .so-close-btn:hover { background: #f3f4f6; color: #374151; }
      `}</style>
      <div
        className="so-panel"
        style={panelStyle}
        onMouseEnter={() => {
          isPanelHovered.current = true;
        }}
        onMouseLeave={() => {
          isPanelHovered.current = false;
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "0.5px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f9fafb",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#9ca3af",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Recent Purchase Options
            </span>
          </div>
          <button
            className="so-close-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              onDismiss();
            }}
          >
            ×
          </button>
        </div>

        {/* List */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {loading && !suggestions.length ? (
            <div
              style={{
                padding: "18px 14px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 12,
              }}
            >
              Loading…
            </div>
          ) : (
            suggestions.map((s, i) => (
              <div
                key={i}
                className="so-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(s);
                }}
                onMouseEnter={() => onHighlight(i)}
                onMouseLeave={() => onHighlight(-1)}
                style={{
                  padding: "10px 14px",
                  borderLeft:
                    i === highlightedIndex
                      ? "2px solid #378ADD"
                      : "2px solid transparent",
                  background:
                    i === highlightedIndex ? "#EBF4FF" : "transparent",
                  cursor: "pointer",
                  borderBottom:
                    i < suggestions.length - 1 ? "0.5px solid #f3f4f6" : "none",
                }}
              >
                {/* Brand / Model */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 5,
                  }}
                >
                  {[s.brand, s.model].filter(Boolean).join(" · ") || (
                    <span style={{ color: "#9ca3af" }}>No brand/model</span>
                  )}
                </div>

                {/* Supplier + price badges */}
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    flexWrap: "wrap",
                    marginBottom: s.specs ? 5 : 0,
                  }}
                >
                  {s.supplierName && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#6b7280",
                        background: "#f3f4f6",
                        border: "0.5px solid #e5e7eb",
                        borderRadius: 4,
                        padding: "2px 7px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ color: "#9ca3af" }}>By</span>{" "}
                      {s.supplierNickName || s.supplierName}
                    </span>
                  )}
                  {(s.quantity || s.uom) && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#6b7280",
                        background: "#f3f4f6",
                        border: "0.5px solid #e5e7eb",
                        borderRadius: 4,
                        padding: "2px 7px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <span style={{ color: "#9ca3af" }}>Qty</span>{" "}
                      {[s.quantity, s.uom].filter(Boolean).join(" ")}
                    </span>
                  )}
                  {s.unitPrice > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#EAF3DE",
                        border: "0.5px solid #97C459",
                        borderRadius: 4,
                        padding: "2px 7px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <span style={{ color: "#3B6D11", fontWeight: 400 }}>
                        ₱
                      </span>
                      <span style={{ color: "#27500A", fontWeight: 500 }}>
                        {Number(s.unitPrice).toLocaleString()}
                      </span>
                    </span>
                  )}
                </div>

                {/* Specs */}
                {s.specs && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ color: "#6b7280", fontWeight: 500 }}>
                      Specs{" "}
                    </span>
                    {s.specs.replace(/<[^>]*>/g, "")}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && suggestions.length > 0 && (
          <div
            style={{
              padding: "6px 14px",
              borderTop: "0.5px solid #f0f0f0",
              fontSize: 10,
              color: "#d1d5db",
              background: "#f9fafb",
              flexShrink: 0,
            }}
          >
            Based on transaction history
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────
function NewOptionModal({
  open,
  onClose,
  editingOption,
  itemId,
  sourceItem,
  onSuccess,
  suppliers,
  cItemType,
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const ewtDebounceRef = useRef(null);
  const [calculatedEWT, setCalculatedEWT] = useState("");
  const [ewtLoading, setEwtLoading] = useState(false);

  // ── Suggestion state ────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggDebounceRef = useRef(null);
  const brandInputRef = useRef(null);
  const suggListRef = useRef(null);
  const isPanelHovered = useRef(false);

  // ── NEW: flag to suppress focus-triggered fetch right after a selection ──
  const justSelectedRef = useRef(false);

  // Populate form on open / edit
  useEffect(() => {
    if (editingOption) {
      setFormData({
        nSupplierId: editingOption.nSupplierId || "",
        quantity: editingOption.nQuantity || "",
        uom: editingOption.strUOM || "",
        brand: editingOption.strBrand || "",
        model: editingOption.strModel || "",
        specs: editingOption.strSpecs || "",
        unitPrice: editingOption.dUnitPrice || "",
        ewt: editingOption.dEWT || "",
        bIncluded: !!editingOption.bIncluded,
        bAddOn: editingOption.bAddOn,
        id: editingOption.id,
      });
      setCalculatedEWT(editingOption.dEWT || "");
    } else {
      setFormData({
        ...initialFormData,
        quantity: sourceItem?.qty ?? "",
        uom: sourceItem?.uom ?? "",
        specs: sourceItem?.specs ?? "",
      });
      setCalculatedEWT("");
    }
    setErrors({});
    setSuggestions([]);
    setHighlightedIndex(-1);
    isPanelHovered.current = false;
    justSelectedRef.current = false;
  }, [editingOption, open]);

  // Grab the brand input ref after modal opens
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      brandInputRef.current = document.querySelector('input[name="brand"]');
    }, 80);
    return () => clearTimeout(t);
  }, [open]);

  // EWT recalculation
  useEffect(() => {
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
    Number(formData.nSupplierId),
    Number(formData.quantity),
    Number(formData.unitPrice),
    cItemType,
  ]);

  // ── Suggestion fetch ────────────────────────────────────────────────────
  const lastSearchTermRef = useRef("");

  const fetchSuggestions = useCallback(async (search, supplierId) => {
    const term = search.trim();
    if (!term) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    try {
      const params = new URLSearchParams({ search: term });
      if (supplierId) params.append("supplierId", supplierId);
      const res = await api.get(
        `purchase-options/suggestions?${params.toString()}`,
      );
      setSuggestions(res.suggestions || res.data?.suggestions || []);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const triggerSuggestions = (brand, model, supplierId) => {
    const term = [brand, model].filter(Boolean).join(" ").trim();
    lastSearchTermRef.current = term;
    clearTimeout(suggDebounceRef.current);
    if (!term) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    suggDebounceRef.current = setTimeout(
      () => fetchSuggestions(term, supplierId),
      300,
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(newFormData);

    if (name === "brand" || name === "model") {
      triggerSuggestions(
        name === "brand" ? value : formData.brand,
        name === "model" ? value : formData.model,
        formData.nSupplierId,
      );
    }
  };

  const handleSupplierChange = (value) => {
    const selectedSupplier = suppliers.find((s) => s.value === Number(value));
    const newSupplierId = selectedSupplier?.value || "";
    setFormData((prev) => ({ ...prev, nSupplierId: newSupplierId }));

    const term = lastSearchTermRef.current;
    if (term) {
      setLoadingSuggestions(true);
      clearTimeout(suggDebounceRef.current);
      suggDebounceRef.current = setTimeout(
        () => fetchSuggestions(term, newSupplierId),
        150,
      );
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // When brand or model is focused, re-show suggestions if fields already have a value.
  // Skip this if we just finished a selection (justSelectedRef guard).
  const handleSearchFocus = () => {
    // If focus is firing because we just selected a suggestion, skip and clear the flag.
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const term = [formData.brand, formData.model]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (term) {
      lastSearchTermRef.current = term;
      setLoadingSuggestions(true);
      clearTimeout(suggDebounceRef.current);
      suggDebounceRef.current = setTimeout(
        () => fetchSuggestions(term, formData.nSupplierId),
        150,
      );
    }
  };

  // When brand or model blurs, dismiss suggestions unless panel is hovered
  const handleSearchBlur = () => {
    setTimeout(() => {
      if (!isPanelHovered.current) {
        setSuggestions([]);
        setLoadingSuggestions(false);
      }
    }, 150);
  };

  const handleSelectSuggestion = (s) => {
    // Signal that the upcoming focus event (from brandInputRef.focus()) is
    // a post-selection focus and should NOT re-trigger suggestions.
    justSelectedRef.current = true;

    isPanelHovered.current = false;
    setFormData((prev) => ({
      ...prev,
      brand: s.brand || "",
      model: s.model || "",
      nSupplierId: s.nSupplierId || prev.nSupplierId,
      // quantity: s.quantity != null ? String(s.quantity) : prev.quantity,
      // uom: s.uom || prev.uom,
      unitPrice: s.unitPrice != null ? String(s.unitPrice) : prev.unitPrice,
      specs: s.specs || prev.specs,
    }));
    setSuggestions([]);
    setLoadingSuggestions(false);
    setHighlightedIndex(-1);
    setTimeout(() => brandInputRef.current?.focus(), 0);
  };

  const dismissSuggestions = () => {
    isPanelHovered.current = false;
    setSuggestions([]);
    setLoadingSuggestions(false);
  };

  const handleSearchKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      dismissSuggestions();
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && suggListRef.current) {
      suggListRef.current.children[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_OPTION");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const brandModel =
      formData.model || formData.brand
        ? `${formData.model || ""}${formData.model && formData.brand ? " (" : ""}${formData.brand || ""}${formData.model && formData.brand ? ")" : ""}`
        : "Purchase Option";

    const entity = brandModel;
    const isEdit = Boolean(formData.id);

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
      await withSpinner(entity, async () => {
        if (isEdit) {
          await api.put(`purchase-options/${formData.id}`, payload);
        } else {
          await api.post("purchase-options", payload);
        }
        await onSuccess();
      });
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isEdit ? "updated" : "added" },
      );
    } catch (err) {
      setErrors(
        err.response?.data?.errors || {
          general: `${uiMessages.common.errorMessage}`,
        },
      );
      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setEwtLoading(false);
    setSuggestions([]);
    setLoadingSuggestions(false);
    clearTimeout(suggDebounceRef.current);
    isPanelHovered.current = false;
    justSelectedRef.current = false;
    onClose();
  };

  const fields = [
    {
      name: "brand",
      label: "Brand",
      xs: 6,
      inputProps: {
        onKeyDown: handleSearchKeyDown,
        onBlur: handleSearchBlur,
        onFocus: handleSearchFocus,
      },
    },
    {
      name: "model",
      label: "Model",
      xs: 6,
      inputProps: {
        onKeyDown: handleSearchKeyDown,
        onBlur: handleSearchBlur,
        onFocus: handleSearchFocus,
      },
    },
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      options: suppliers,
      xs: 12,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
    },
    // ── ADD THIS ──
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
      xs: 6,
      numberOnly: true,
    },
    { name: "uom", label: "UOM", xs: 6 },
    {
      name: "unitPrice",
      label: "Unit Price",
      type: "peso",
      xs: 6,
      numberOnly: true,
    },
    {
      name: "ewt",
      label: ewtLoading ? "EWT (calculating...)" : "EWT",
      type: "peso",
      xs: 6,
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

  if (!open) return null;

  return (
    <>
      <SuggestionPanel
        suggestions={suggestions}
        loading={loadingSuggestions}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelectSuggestion}
        onHighlight={setHighlightedIndex}
        onDismiss={dismissSuggestions}
        anchorRef={brandInputRef}
        listRef={suggListRef}
        isPanelHovered={isPanelHovered}
        placement="left"
      />

      <ModalContainer
        open={open}
        handleClose={handleClose}
        title={formData?.id ? "Edit Purchase Option" : "Add Purchase Option"}
        subTitle={
          formData.brand || formData.model
            ? `/ ${[formData.brand, formData.model].filter(Boolean).join(" ")}`
            : ""
        }
        onSave={handleSave}
        disabled={ewtLoading}
      >
        <FormGrid
          fields={fields}
          switches={switches}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleSwitchChange={handleSwitchChange}
        />
      </ModalContainer>
    </>
  );
}

export default NewOptionModal;
