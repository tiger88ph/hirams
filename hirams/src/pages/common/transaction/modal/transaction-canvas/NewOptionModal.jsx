import React, { useState, useEffect, useRef } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../../components/common/FormGrid.jsx";
import { Typography, Link, Box } from "@mui/material";
import {
  // ...existing...
  PersonOutlined,
  PersonAddOutlined,
  SearchOutlined,
  CloseOutlined,
} from "@mui/icons-material";
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
  nSupplierContactId: "",
};

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
  const navigate = useNavigate();
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
  // REPLACE:
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
        nSupplierContactId: editingOption.nSupplierContactId || "", // ← ADD
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
  useEffect(() => {
    if (!formData.nSupplierId) {
      setSupplierContacts([]);
      setSelectedContact(null);
      setContactSearch("");
      return;
    }

    const contactIdToRestore = editingOption?.nSupplierContactId ?? null;
    setContactsLoading(true); // ← start loading

    api
      .get(`supplier-contacts/by-supplier/${formData.nSupplierId}`)
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
      .finally(() => setContactsLoading(false)); // ← stop loading
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
    }));
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
    onClose();
  };
  const handleSaveNewContact = async () => {
    if (!newContact.strName.trim() || !newContact.strNumber.trim()) return;
    setContactSaving(true);
    try {
      const res = await api.post("supplier-contacts", {
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
      setNewContact({ strName: "", strNumber: "" });
    } catch {
      // silent
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
      name: "_supplierContact",
      type: "custom",
      xs: 12,
      render: () => {
        const noSupplier = !formData.nSupplierId;

        if (showAddContact) {
          return (
            <Box
              sx={{
                border: "0.5px solid #E5E7EB",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  background:
                    "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  borderBottom: "0.5px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <PersonAddOutlined
                  sx={{ fontSize: "0.8rem", color: "#16a34a" }}
                />
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#15803d",
                  }}
                >
                  Add New Contact
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Box
                  onClick={() => {
                    setShowAddContact(false);
                    setNewContact({ strName: "", strNumber: "" });
                  }}
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    p: 0.25,
                    borderRadius: "4px",
                    "&:hover": { background: "rgba(0,0,0,0.05)" },
                  }}
                >
                  <CloseOutlined
                    sx={{ fontSize: "0.75rem", color: "#6B7280" }}
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
                        color: "#6B7280",
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
                        border: "0.5px solid #D1D5DB",
                        borderRadius: "7px",
                        padding: "6px 10px",
                        fontSize: "0.72rem",
                        color: "#111827",
                        background: "#fafafa",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                      onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
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
                        ? "#E5E7EB"
                        : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
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
                          ? "#9CA3AF"
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
                color: errors.nSupplierContactId ? "#ef4444" : "#6B7280",
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
                  background:
                    "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
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
                        ? "#ef4444"
                        : noSupplier
                          ? "#E5E7EB"
                          : showContactDropdown
                            ? "#6366f1"
                            : "#D1D5DB"
                    }`,
                    borderRadius: "7px",
                    background: noSupplier ? "#F9FAFB" : "#fff",
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
                        color: "#6366f1",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <SearchOutlined
                      sx={{
                        fontSize: "0.8rem",
                        color: errors.nSupplierContactId
                          ? "#ef4444"
                          : "#9CA3AF",
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
                      color: "#111827",
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
                        sx={{ fontSize: "0.7rem", color: "#9CA3AF" }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Dropdown */}
                {showContactDropdown && !noSupplier && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      zIndex: 1400,
                      background: "#fff",
                      border: "0.5px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                      overflow: "hidden",
                      maxHeight: 180,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { width: 3 },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#D1D5DB",
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
                            "&:hover": { background: "#F5F3FF" },
                            borderBottom: "0.5px solid #F3F4F6",
                          }}
                        >
                          <PersonOutlined
                            sx={{
                              fontSize: "0.75rem",
                              color: "#6366f1",
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                color: "#111827",
                                lineHeight: 1.2,
                              }}
                            >
                              {c.strName}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.58rem",
                                color: "#6B7280",
                                lineHeight: 1.2,
                              }}
                            >
                              {c.strNumber}
                              {(c.strPosition || c.strDepartment) && (
                                <Box
                                  component="span"
                                  sx={{ color: "#9CA3AF", ml: 0.5 }}
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
                            color: "#9CA3AF",
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
                            background:
                              "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                            border: "0.5px solid #86efac",
                            cursor: "pointer",
                            "&:hover": { background: "#dcfce7" },
                          }}
                        >
                          <PersonAddOutlined
                            sx={{ fontSize: "0.7rem", color: "#16a34a" }}
                          />
                          <Typography
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "#15803d",
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

            {/* Error message */}
            {errors.nSupplierContactId && (
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  color: "#ef4444",
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
      // always editable
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
      showOnlyHighlighter: isEditForPurchase ? true : false,
      showAllFormatting: isEditForPurchase ? false : true,
      readOnlyHighlight: isEditForPurchase ? true : false,
      sx: {
        "& textarea": {
          resize: "vertical",
          userSelect: "text",
          pointerEvents: "auto",
          backgroundColor: "#fafafa",
          borderRadius: 2,
          fontSize: "0.7rem",
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
  );
}

export default NewOptionModal;
