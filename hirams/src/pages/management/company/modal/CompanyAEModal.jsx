import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Business, EditRounded } from "@mui/icons-material";
import api from "../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import { validateFormData } from "../../../../utils/form/validation.js";
import {
  formatTIN,
  tinToStorage,
  tinToDisplay,
} from "../../../../utils/helpers/tinFormat.js";
import ModalContainer from "../../../../components/common/ModalContainer.jsx";
import FormGrid from "../../../../components/common/FormGrid.jsx";
import { resolveCompanyLogo } from "../../../../utils/helpers/profileImage.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateLogoFilename = (companyId) => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${companyId}_${rand}.png`;
};

const uploadLogo = async (companyId, file, filename) => {
  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const form = new FormData();
  form.append("strLogo", file);
  form.append("strLogoFilename", filename);

  const res = await fetch(`${baseUrl}companies/${companyId}/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.strLogo ?? filename;
};

// ── Component ────────────────────────────────────────────────────────────────

function CompanyAEModal({ open, handleClose, company, onCompanySubmitted }) {
  const initialForm = {
    name: "",
    nickname: "",
    tin: "",
    address: "",
    vat: false,
    ewt: false,
    email: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const fileInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFilename, setLogoFilename] = useState(null);

  const isEditMode = Boolean(company);

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setLogoError(false);
      setLogoFile(null);
      setLogoFilename(null);
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }

      if (company) {
        setFormData({
          name: company.name || "",
          nickname: company.nickname || "",
          tin: tinToDisplay(company.tin) || "",
          address: company.address || "",
          vat: company.vat === "VAT",
          ewt: company.ewt === "EWT",
          email: company.email || "",
        });
      } else {
        setFormData(initialForm);
      }
      setErrors({});
    }
  }, [open, company]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  // ── Logo file selection ───────────────────────────────────────────────────
  const handleLogoClick = () => fileInputRef.current?.click();

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (logoPreview) URL.revokeObjectURL(logoPreview);

    // In add mode we don't have a real ID yet — use "new" as placeholder;
    // the real filename is regenerated with the actual ID after creation.
    const filename = generateLogoFilename(company?.id ?? "new");

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoFilename(filename);
    setLogoError(false);
    e.target.value = "";
  };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "tin" ? formatTIN(value) : value;
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const validationErrors = validateFormData(formData, "COMPANY");
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateForm()) return;

    const entity = formData.nickname.trim() || "Company";
    const action = isEditMode ? "updated" : "added";

    try {
      setLoading(true);
      handleClose();

      await withSpinner(entity, async () => {
        let finalLogoFilename = company?.strLogo ?? null;

        if (isEditMode) {
          // Upload logo first if a new one was selected
          if (logoFile && logoFilename) {
            const uploaded = await uploadLogo(
              company.id,
              logoFile,
              logoFilename
            );
            if (uploaded) finalLogoFilename = uploaded;
          }

          const payload = {
            strCompanyName: formData.name,
            strCompanyNickName: formData.nickname,
            strTIN: tinToStorage(formData.tin),
            strAddress: formData.address,
            bVAT: formData.vat ? 1 : 0,
            bEWT: formData.ewt ? 1 : 0,
            strEmail: formData.email,
            ...(finalLogoFilename && { strLogo: finalLogoFilename }),
          };

          await api.put(`companies/${company.id}`, payload);
        } else {
          // Add mode: create company first, then upload logo with real ID
          const payload = {
            strCompanyName: formData.name,
            strCompanyNickName: formData.nickname,
            strTIN: tinToStorage(formData.tin),
            strAddress: formData.address,
            bVAT: formData.vat ? 1 : 0,
            bEWT: formData.ewt ? 1 : 0,
            strEmail: formData.email,
          };

          const res = await api.post("companies", payload);
          const newId = res?.company?.nCompanyId;

          if (logoFile && newId) {
            const filename = generateLogoFilename(newId); // real ID now
            const uploaded = await uploadLogo(newId, logoFile, filename);

            if (uploaded) {
              await api.put(`companies/${newId}`, {
                ...payload,
                strLogo: uploaded,
              });
            }
          }
        }
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onCompanySubmitted?.();
    } catch (error) {
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const logoSrc = resolveCompanyLogo(company, logoPreview);
  const hasLogo = Boolean(logoPreview) || Boolean(company?.strLogo && !logoError);

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title={isEditMode ? "Edit Company" : "Add Company"}
      subTitle={formData.nickname ? `/ ${formData.nickname}` : ""}
      onSave={handleSave}
      loading={loading}
      saveLabel="Save"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleLogoChange}
      />

      {/* ── Logo banner ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #115e59 100%)",
          borderRadius: "12px 12px 0 0",
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mb: 0,
        }}
      >
        {/* Logo circle with pencil overlay */}
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: { xs: 70, sm: 90 },
              height: { xs: 70, sm: 90 },
              borderRadius: "50%",
              overflow: "hidden",
              border: "2.5px solid rgba(255,255,255,0.4)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasLogo ? (
              <img
                src={logoSrc}
                alt="Company Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <Business
                sx={{
                  fontSize: { xs: "1.8rem", sm: "2.4rem" },
                  color: "#134e4a",
                }}
              />
            )}
          </Box>

          {/* Pencil button — always visible */}
          <Tooltip title="Change logo" placement="bottom">
            <IconButton
              onClick={handleLogoClick}
              size="small"
              sx={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: { xs: 22, sm: 26 },
                height: { xs: 22, sm: 26 },
                bgcolor: "#fff",
                border: "2px solid #e5e7eb",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                "&:hover": {
                  bgcolor: "#f0f9ff",
                  borderColor: "#3b82f6",
                  "& svg": { color: "#3b82f6" },
                },
              }}
            >
              <EditRounded
                sx={{
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  color: "#6b7280",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Pending filename badge */}
        {logoFile && logoFilename && (
          <Typography
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.68rem",
              fontStyle: "italic",
              mt: 0.5,
            }}
          >
            {logoFilename}
          </Typography>
        )}
      </Box>

      {/* ── Form fields ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          border: "1px solid #e5e7eb",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          bgcolor: "#fff",
          p: { xs: 1.5, sm: 2 },
        }}
      >
        <FormGrid
          fields={[
            { label: "Company Name", name: "name", xs: 8 },
            { label: "Nickname", name: "nickname", xs: 4 },
            {
              label: "TIN",
              name: "tin",
              type: "tin",
              xs: 7,
              placeholder: "000 000 000 00000",
            },
            { label: "Email", name: "email", xs: 5 },
            {
              label: "Address",
              name: "address",
              xs: 12,
              multiline: true,
              plainMultiline: true,
              minRows: 2,
              sx: { "& textarea": { resize: "vertical" } },
            },
          ]}
          switches={[
            { label: "Value Added Tax", name: "vat", xs: 6 },
            { label: "Expanded Withholding Tax", name: "ewt", xs: 6 },
          ]}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleSwitchChange={handleSwitchChange}
        />
      </Box>
    </ModalContainer>
  );
}

export default CompanyAEModal;