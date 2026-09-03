import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import FormGrid from "../../../../../components/form/FormGrid.jsx";
import { Typography, Link, Box } from "@mui/material";
import {
  PersonOutlined,
  PersonAddOutlined,
  SearchOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PurchaseOptionAPI from "../../../../../api/endpoints/purchase-option.api.js";
import SupplierContactAPI from "../../../../../api/endpoints/supplier-contact.api.js";
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
  nSupplierContactId: "",
};

// ── Theme Color Map — ONLY uses tokens from getThemeColors ──
const useColors = (c, isDark) => ({
  // slate (structural surfaces)
  bgPaper: c.slate.outerBg,
  bgSoft: c.slate.mutedBg || (isDark ? "#334155" : "#f9fafb"),
  border: c.slate.border,
  shadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.10)",

  // gray (text hierarchy + inputs)
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  bgInput: c.gray.inputBg,

  // accent colors
  primary: c.blue.textStrong,
  primaryBg: c.blue.bg,
  success: c.green.text,
  successDark: c.green.textDark,
  successBg: c.green.bg,
  successBgSoft: c.green.bgSoft,
  error: c.red.text,
  borderError: c.red.borderStrong,
  borderFocus: c.blue.borderStrong,
  hoverBg: c.slate.hover,
});

function NewOptionModal({
  open,
  onClose,
  editingOption,
  itemId,
  sourceItem,
  onSuccess,
  suppliers,
  cItemType,
  isForPurchase = "",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Wire up theme colors — SINGLE SOURCE from getThemeColors
  const baseColors = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useColors(baseColors, isDark);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const ewtDebounceRef = useRef(null);
  const [calculatedEWT, setCalculatedEWT] = useState("");
  const [ewtLoading, setEwtLoading] = useState(false);
  const [supplierContacts, setSupplierContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [newContact, setNewContact] = useState({
    strName: "",
    strNumber: "",
    strPosition: "",
    strDepartment: "",
  });
  const [contactSaving, setContactSaving] = useState(false);
  const contactRef = useRef(null);

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
        nSupplierContactId: editingOption.nSupplierContactId || "",
      });
      setCalculatedEWT(editingOption.dEWT || "");
      setSelectedContact(null);
      setContactSearch("");
      setShowAddContact(false);
      setNewContact({
        strName: "",
        strNumber: "",
        strPosition: "",
        strDepartment: "",
      });
    } else {
      setFormData({
        ...initialFormData,
        quantity: sourceItem?.remainingQty ?? sourceItem?.qty ?? "",
        uom: sourceItem?.uom ?? "",
        specs: sourceItem?.specs ?? "",
      });
      setCalculatedEWT("");
      setSelectedContact(null);
      setContactSearch("");
      setShowAddContact(false);
      setNewContact({
        strName: "",
        strNumber: "",
        strPosition: "",
        strDepartment: "",
      });
    }
    setErrors({});
  }, [editingOption, open]);

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
        const response = await PurchaseOptionAPI.calculateEWT({
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

  useEffect(() => {
    if (!formData.nSupplierId) {
      setSupplierContacts([]);
      setSelectedContact(null);
      setContactSearch("");
      return;
    }

    const contactIdToRestore = editingOption?.nSupplierContactId ?? null;
    setContactsLoading(true);

    SupplierContactAPI.getBySupplier(formData.nSupplierId)
      .then((res) => {
        const contacts = res.contacts || [];
        setSupplierContacts(contacts);

        if (contactIdToRestore) {
          const match = contacts.find(
            (c) => c.nSupplierContactId === Number(contactIdToRestore),
          );
          if (match) {
            setSelectedContact(match);
            setContactSearch(`${match.strName} — ${match.strNumber}`);
            setFormData((prev) => ({
              ...prev,
              nSupplierContactId: match.nSupplierContactId,
            }));
          }
        }
      })
      .catch(() => setSupplierContacts([]))
      .finally(() => setContactsLoading(false));
  }, [formData.nSupplierId, editingOption]);

  useEffect(() => {
    const handler = (e) => {
      if (contactRef.current && !contactRef.current.contains(e.target))
        setShowContactDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSupplierChange = (value) => {
    const selectedSupplier = suppliers.find((s) => s.value === Number(value));
    setFormData((prev) => ({
      ...prev,
      nSupplierId: selectedSupplier?.value || "",
      nSupplierContactId: "",
    }));
    setSelectedContact(null);
    setContactSearch("");
    setShowContactDropdown(false);
    setShowAddContact(false);
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const validationErrors = validateFormData(formData, "TRANSACTION_OPTION");
    if (!formData.nSupplierContactId) {
      validationErrors.nSupplierContactId = "Supplier contact is required.";
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
    const entity = brandModel;
    const isEdit = Boolean(formData.id);

    // ✅ FIXED: removed the stray "npayload = {" typo
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
      nSupplierContactId: formData.nSupplierContactId || null,
    };

    try {
      handleClose();
      await withSpinner(entity, async () => {
        if (isEdit) await PurchaseOptionAPI.updateOption(formData.id, payload);
        else await PurchaseOptionAPI.createOption(payload);
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
    onClose();
  };

  const handleSaveNewContact = async () => {
    if (!newContact.strName.trim() || !newContact.strNumber.trim()) return;
    setContactSaving(true);
    try {
      const res = await SupplierContactAPI.createContact({
        nSupplierId: formData.nSupplierId,
        strName: newContact.strName.trim(),
        strNumber: newContact.strNumber.trim(),
        strPosition: newContact.strPosition.trim() || null,
        strDepartment: newContact.strDepartment.trim() || null,
      });
      const created = res.supplier_contact;
      setSupplierContacts((prev) => [...prev, created]);
      setSelectedContact(created);
      setContactSearch(`${created.strName} — ${created.strNumber}`);
      setFormData((prev) => ({
        ...prev,
        nSupplierContactId: created.nSupplierContactId,
      }));
      setShowAddContact(false);
      setNewContact({
        strName: "",
        strNumber: "",
        strPosition: "",
        strDepartment: "",
      });
    } catch {
    } finally {
      setContactSaving(false);
    }
  };

  const isEditForPurchase = Boolean(formData.id) && isForPurchase;

  const fields = [
    { name: "brand", label: "Brand", xs: 4, disabled: isEditForPurchase },
    { name: "model", label: "Model", xs: 4, disabled: isEditForPurchase },
    {
      name: "nSupplierId",
      label: "Supplier",
      type: "select",
      options: suppliers,
      xs: 4,
      value: formData.nSupplierId,
      onChange: handleSupplierChange,
      disabled: isEditForPurchase,
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
            color: colors.textSecondary,
          }}
        >
          New Supplier?{" "}
          <Link
            component="button"
            underline="hover"
            sx={{ fontSize: "inherit", color: colors.primary }}
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
      name: "_supplierContact",
      type: "custom",
      xs: 12,
      render: () => {
        const noSupplier = !formData.nSupplierId;

        if (showAddContact) {
          return (
            <Box
              sx={{
                border: `0.5px solid ${colors.border}`,
                borderRadius: "10px",
                overflow: "hidden",
                bgcolor: colors.bgPaper,
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  background: `linear-gradient(135deg, ${colors.successBg} 0%, ${colors.successBgSoft} 100%)`,
                  borderBottom: `0.5px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <PersonAddOutlined
                  sx={{ fontSize: "0.8rem", color: colors.successDark }}
                />
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: colors.successDark,
                  }}
                >
                  Add New Contact
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Box
                  onClick={() => {
                    setShowAddContact(false);
                    setNewContact({
                      strName: "",
                      strNumber: "",
                      strPosition: "",
                      strDepartment: "",
                    });
                  }}
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    p: 0.25,
                    borderRadius: "4px",
                    "&:hover": { bgcolor: colors.hoverBg },
                  }}
                >
                  <CloseOutlined
                    sx={{ fontSize: "0.75rem", color: colors.textMuted }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {[
                  {
                    key: "strName",
                    label: "Contact Name",
                    placeholder: "e.g. Juan Dela Cruz",
                  },
                  {
                    key: "strNumber",
                    label: "Contact Number",
                    placeholder: "e.g. 09171234567",
                  },
                  {
                    key: "strPosition",
                    label: "Position",
                    placeholder: "e.g. Purchasing Officer",
                  },
                  {
                    key: "strDepartment",
                    label: "Department",
                    placeholder: "e.g. Procurement",
                  },
                ].map(({ key, label, placeholder }) => (
                  <Box key={key}>
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: colors.textSecondary,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        mb: 0.4,
                      }}
                    >
                      {label}
                    </Typography>
                    <input
                      value={newContact[key]}
                      onChange={(e) =>
                        setNewContact((p) => ({ ...p, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border: `0.5px solid ${colors.border}`,
                        borderRadius: "7px",
                        padding: "6px 10px",
                        fontSize: "0.72rem",
                        color: colors.textPrimary,
                        background: colors.bgInput,
                        outline: "none",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = colors.success)
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = colors.border)
                      }
                    />
                  </Box>
                ))}

                <Box
                  onClick={contactSaving ? undefined : handleSaveNewContact}
                  sx={{
                    mt: 0.5,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "7px",
                    background:
                      !newContact.strName.trim() || !newContact.strNumber.trim()
                        ? colors.bgSoft
                        : `linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%)`,
                    cursor:
                      !newContact.strName.trim() || !newContact.strNumber.trim()
                        ? "not-allowed"
                        : contactSaving
                          ? "wait"
                          : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color:
                        !newContact.strName.trim() ||
                        !newContact.strNumber.trim()
                          ? colors.textMuted
                          : isDark
                            ? "#0f172a"
                            : "#fff",
                    }}
                  >
                    {contactSaving ? "Saving..." : "Save Contact"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        }

        const filtered = contactSearch.trim()
          ? supplierContacts.filter(
              (c) =>
                c.strName.toLowerCase().includes(contactSearch.toLowerCase()) ||
                c.strNumber.toLowerCase().includes(contactSearch.toLowerCase()),
            )
          : supplierContacts;
        const hasMatch = filtered.length > 0;

        return (
          <Box ref={contactRef} sx={{ position: "relative" }}>
            <Typography
              sx={{
                fontSize: "0.58rem",
                fontWeight: 700,
                color: errors.nSupplierContactId
                  ? colors.error
                  : colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                mb: 0.4,
              }}
            >
              Supplier Contact
            </Typography>

            {contactsLoading ? (
              <Box
                sx={{
                  height: 34,
                  borderRadius: "7px",
                  background: isDark
                    ? "linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%)"
                    : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.2s infinite",
                  "@keyframes shimmer": {
                    "0%": { backgroundPosition: "200% 0" },
                    "100%": { backgroundPosition: "-200% 0" },
                  },
                }}
              />
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: `0.5px solid ${
                      errors.nSupplierContactId
                        ? colors.borderError
                        : noSupplier
                          ? colors.border
                          : showContactDropdown
                            ? colors.borderFocus
                            : colors.border
                    }`,
                    borderRadius: "7px",
                    background: noSupplier ? colors.bgSoft : colors.bgInput,
                    px: 1,
                    height: 34,
                    gap: 0.5,
                    transition: "border-color 0.15s",
                  }}
                >
                  {selectedContact ? (
                    <PersonOutlined
                      sx={{
                        fontSize: "0.8rem",
                        color: colors.primary,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <SearchOutlined
                      sx={{
                        fontSize: "0.8rem",
                        color: errors.nSupplierContactId
                          ? colors.error
                          : colors.textMuted,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <input
                    disabled={noSupplier}
                    value={contactSearch}
                    placeholder={
                      noSupplier
                        ? "Select a supplier first"
                        : "Search contact..."
                    }
                    onChange={(e) => {
                      setContactSearch(e.target.value);
                      setShowContactDropdown(true);
                      if (!e.target.value) {
                        setSelectedContact(null);
                        setFormData((p) => ({ ...p, nSupplierContactId: "" }));
                      }
                    }}
                    onFocus={() => setShowContactDropdown(true)}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "0.72rem",
                      color: colors.textPrimary,
                      cursor: noSupplier ? "not-allowed" : "text",
                    }}
                  />
                  {selectedContact && (
                    <Box
                      onClick={() => {
                        setSelectedContact(null);
                        setContactSearch("");
                        setFormData((p) => ({ ...p, nSupplierContactId: "" }));
                      }}
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        "&:hover": { opacity: 0.7 },
                      }}
                    >
                      <CloseOutlined
                        sx={{ fontSize: "0.7rem", color: colors.textMuted }}
                      />
                    </Box>
                  )}
                </Box>

                {showContactDropdown && !noSupplier && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      zIndex: 1400,
                      background: colors.bgPaper,
                      border: `0.5px solid ${colors.border}`,
                      borderRadius: "8px",
                      boxShadow: colors.shadow,
                      overflow: "hidden",
                      maxHeight: 180,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { width: 3 },
                      "&::-webkit-scrollbar-thumb": {
                        background: colors.border,
                        borderRadius: 2,
                      },
                    }}
                  >
                    {hasMatch ? (
                      filtered.map((c) => (
                        <Box
                          key={c.nSupplierContactId}
                          onMouseDown={() => {
                            setSelectedContact(c);
                            setContactSearch(`${c.strName} — ${c.strNumber}`);
                            setFormData((p) => ({
                              ...p,
                              nSupplierContactId: c.nSupplierContactId,
                            }));
                            setShowContactDropdown(false);
                          }}
                          sx={{
                            px: 1.25,
                            py: 0.75,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            cursor: "pointer",
                            "&:hover": { bgcolor: colors.primaryBg },
                            borderBottom: `0.5px solid ${colors.border}`,
                          }}
                        >
                          <PersonOutlined
                            sx={{
                              fontSize: "0.75rem",
                              color: colors.primary,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                color: colors.textPrimary,
                                lineHeight: 1.2,
                              }}
                            >
                              {c.strName}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.58rem",
                                color: colors.textSecondary,
                                lineHeight: 1.2,
                              }}
                            >
                              {c.strNumber}
                              {(c.strPosition || c.strDepartment) && (
                                <Box
                                  component="span"
                                  sx={{ color: colors.textMuted, ml: 0.5 }}
                                >
                                  ·{" "}
                                  {[c.strPosition, c.strDepartment]
                                    .filter(Boolean)
                                    .join(", ")}
                                </Box>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box
                        sx={{
                          px: 1.25,
                          py: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            color: colors.textMuted,
                            textAlign: "center",
                          }}
                        >
                          No contact found
                          {contactSearch ? ` for "${contactSearch}"` : ""}
                        </Typography>
                        <Box
                          onMouseDown={() => {
                            setShowContactDropdown(false);
                            setShowAddContact(true);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                            px: 1,
                            py: 0.4,
                            borderRadius: "6px",
                            background: `linear-gradient(135deg, ${colors.successBg} 0%, ${colors.successBgSoft} 100%)`,
                            border: `0.5px solid ${colors.success}`,
                            cursor: "pointer",
                            "&:hover": { bgcolor: colors.successBgSoft },
                          }}
                        >
                          <PersonAddOutlined
                            sx={{
                              fontSize: "0.7rem",
                              color: colors.successDark,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: colors.successDark,
                            }}
                          >
                            Add Contact
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}

            {errors.nSupplierContactId && (
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  color: colors.error,
                  mt: 0.4,
                  ml: 0.25,
                }}
              >
                {errors.nSupplierContactId}
              </Typography>
            )}
          </Box>
        );
      },
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
      disabled: isEditForPurchase,
    },
    {
      name: "specs",
      label: "Specifications",
      placeholder: "Type here the specifications...",
      type: "textarea",
      xs: 12,
      multiline: true,
      minRows: 3,
      showOnlyHighlighter: isEditForPurchase,
      showAllFormatting: !isEditForPurchase,
      readOnlyHighlight: isEditForPurchase,
      sx: {
        "& textarea": {
          resize: "vertical",
          userSelect: "text",
          pointerEvents: "auto",
          backgroundColor: colors.bgSoft,
          borderRadius: 2,
          fontSize: "0.7rem",
          color: colors.textPrimary,
        },
      },
    },
  ];

  const switches = [
    { name: "bAddOn", label: "Add-On?", xs: 12, disabled: isEditForPurchase },
  ];

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={formData?.id ? "Edit Purchase Option" : "Add Purchase Option"}
      subTitle={
        formData.brand || formData.model
          ? `${[formData.brand, formData.model].filter(Boolean).join(" ")}`
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
  );
}

export default NewOptionModal;
