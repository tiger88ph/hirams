import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import api from "../../../../../utils/api/api.js";
import { withSpinner, showSwal } from "../../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../../utils/form/validation.js";
import uiMessages from "../../../../../utils/helpers/uiMessages.js";

const initialFormData = {
  name: "",
  specs: "",
  qty: "",
  uom: "",
  abc: "",
};

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
      const PANEL_WIDTH = 280;
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
        @keyframes sfadeIn {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .s-panel { animation: sfadeIn 0.16s ease; }
        .s-item { transition: background 0.1s; }
        .s-item:hover { background: #eff6ff; }
        .s-close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 16px; line-height: 1; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
        .s-close-btn:hover { background: #f3f4f6; color: #374151; }
      `}</style>
      <div
        className="s-panel"
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
              Recent Transaction Items
            </span>
          </div>
          <button
            className="s-close-btn"
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
                className="s-item"
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
                {/* Name */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 6,
                  }}
                >
                  {s.name}
                </div>

                {/* Qty + ABC badges */}
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    flexWrap: "wrap",
                    marginBottom: s.specs ? 5 : 0,
                  }}
                >
                  {(s.qty || s.uom) && (
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
                      {[s.qty, s.uom].filter(Boolean).join(" ")}
                    </span>
                  )}
                  {!s.abc || Number(s.abc) === 0 ? (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#FEF3C7",
                        border: "0.5px solid #FCD34D",
                        borderRadius: 4,
                        padding: "2px 7px",
                        color: "#92400E",
                      }}
                    >
                      No item ABC
                    </span>
                  ) : (
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
                        ABC
                      </span>
                      <span style={{ color: "#27500A", fontWeight: 500 }}>
                        ₱{Number(s.abc).toLocaleString()}
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
function NewItemModal({
  open,
  onClose,
  editingItem,
  onSuccess,
  transactionId,
  transactionHasABC,
  transactionABC,
  totalItemsABC,
  clientId,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const debounceRef = useRef(null);
  const nameInputRef = useRef(null);
  const suggListRef = useRef(null);
  const isPanelHovered = useRef(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || "",
        specs: editingItem.specs || "",
        qty: editingItem.qty || "",
        uom: editingItem.uom || "",
        abc: editingItem.abc || "",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setSuggestions([]);
    setHighlightedIndex(-1);
    isPanelHovered.current = false;
  }, [editingItem, open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      nameInputRef.current = document.querySelector('input[name="name"]');
    }, 80);
    return () => clearTimeout(t);
  }, [open]);

  const fetchSuggestions = useCallback(
    async (search) => {
      if (!clientId || !search.trim()) {
        setSuggestions([]);
        setLoadingSuggestions(false);
        return;
      }
      try {
        const res = await api.get(
          `transaction-items/suggestions?clientId=${encodeURIComponent(clientId)}&search=${encodeURIComponent(search)}`,
        );
        setSuggestions(res.suggestions || res.data?.suggestions || []);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [clientId],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setSuggestions([]);
        setLoadingSuggestions(false);
        return;
      }
      setLoadingSuggestions(true);
      debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    }
  };

  const handleNameBlur = () => {
    setTimeout(() => {
      if (!isPanelHovered.current) {
        setSuggestions([]);
        setLoadingSuggestions(false);
      }
    }, 150);
  };

  const handleSelectSuggestion = (s) => {
    isPanelHovered.current = false;
    setFormData({
      name: s.name || "",
      specs: s.specs || "",
      qty: String(s.qty ?? ""),
      uom: s.uom || "",
      abc: String(s.abc ?? ""),
    });
    setSuggestions([]);
    setLoadingSuggestions(false);
    setHighlightedIndex(-1);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const dismissSuggestions = () => {
    isPanelHovered.current = false;
    setSuggestions([]);
    setLoadingSuggestions(false);
  };

  const handleNameKeyDown = (e) => {
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
    const validationErrors = validateFormData(formData, "TRANSACTION_ITEM");

    if (!transactionHasABC) {
      if (!formData.abc || Number(formData.abc) <= 0)
        validationErrors.abc = `${uiMessages.common.invalidABC}`;
    }

    if (
      transactionHasABC &&
      transactionABC &&
      formData.abc &&
      Number(formData.abc) > 0
    ) {
      const otherItemsABC = editingItem
        ? totalItemsABC - Number(editingItem.abc || 0)
        : totalItemsABC;
      const newTotal = otherItemsABC + Number(formData.abc);
      if (newTotal > Number(transactionABC)) {
        validationErrors.abc = `Total items ABC (₱${newTotal.toLocaleString()}) would exceed Transaction ABC (₱${Number(transactionABC).toLocaleString()})`;
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const entity = formData.name?.trim() || "Transaction Item";
    const isEdit = Boolean(editingItem);
    try {
      handleClose();
      await withSpinner(entity, async () => {
        const payload = {
          nTransactionId: transactionId,
          strName: formData.name,
          strSpecs: formData.specs,
          nQuantity: Number(formData.qty),
          strUOM: formData.uom,
          dUnitABC: Number(formData.abc),
        };
        if (isEdit) {
          await api.put(`transaction-items/${editingItem.id}`, payload);
        } else {
          await api.post("transaction-items", payload);
        }
        await onSuccess();
      });
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isEdit ? "updated" : "added" },
      );
    } catch {
      await showSwal("ERROR", {}, { entity });
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setSuggestions([]);
    setLoadingSuggestions(false);
    isPanelHovered.current = false;
    clearTimeout(debounceRef.current);
    onClose();
  };

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
        anchorRef={nameInputRef}
        listRef={suggListRef}
        isPanelHovered={isPanelHovered}
      />

      <ModalContainer
        open={open}
        handleClose={handleClose}
        onSave={handleSave}
        title={editingItem ? "Edit Item" : "Add New Item"}
        subTitle={formData.name?.trim() ? `/ ${formData.name.trim()}` : ""}
      >
        <FormGrid
          fields={[
            {
              name: "name",
              label: "Item Name",
              xs: 12,
              inputProps: {
                onKeyDown: handleNameKeyDown,
                onBlur: handleNameBlur,
              },
            },
            {
              name: "qty",
              label: "Quantity",
              type: "number",
              xs: 4,
              numberOnly: true,
            },
            { name: "uom", label: "UOM", xs: 4 },
            {
              name: "abc",
              label: "Total ABC",
              type: "peso",
              xs: 4,
              numberOnly: true,
            },
            {
              label: "Specifications",
              placeholder: "Type here the specifications...",
              name: "specs",
              xs: 12,
              multiline: true,
              minRows: 1,
              showHighlighter: false,
              sx: { "& textarea": { resize: "vertical" } },
            },
          ]}
          formData={formData}
          handleChange={handleChange}
          errors={errors}
        />
      </ModalContainer>
    </>
  );
}

export default NewItemModal;
