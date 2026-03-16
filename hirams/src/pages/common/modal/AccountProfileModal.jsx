import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Person,
  Badge,
  AlternateEmail,
  AccountCircle,
  Wc,
  WorkOutline,
  CheckCircle,
  EditRounded,
} from "@mui/icons-material";
import ModalContainer from "../../../components/common/ModalContainer";
import useMapping from "../../../utils/mappings/useMapping";
import api from "../../../utils/api/api";
import FormGrid from "../../../components/common/FormGrid";
import { resolveProfileImage } from "../../../utils/helpers/profileImage";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../../utils/helpers/passwordFormat";

const fieldConfig = [
  { label: "Name", key: "fullName", icon: Person },
  { label: "Nickname", key: "nickname", icon: Badge },
  { label: "Username", key: "username", icon: AccountCircle },
  { label: "Email", key: "email", icon: AlternateEmail },
  { label: "User Type", key: "type", icon: WorkOutline },
  { label: "Sex", key: "sex", icon: Wc },
];

// ── localStorage sync helper ─────────────────────────────────────────────────
// Header and SidebarProfile both read from localStorage("user"), so we patch
// that entry whenever the profile image changes inside the modal.
const syncLocalStorage = (updates = {}) => {
  try {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : {};
    localStorage.setItem("user", JSON.stringify({ ...parsed, ...updates }));
    // Notify same-tab listeners (native "storage" event only fires in other tabs)
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.warn("Failed to sync localStorage user:", err);
  }
};

function AccountProfileModal({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwStep, setPwStep] = useState("idle");

  // verify step
  const [verifyData, setVerifyData] = useState({ currentPw: "" });
  const [verifyErrors, setVerifyErrors] = useState({});
  const [verifyLoading, setVerifyLoading] = useState(false);

  // change step
  const [pwData, setPwData] = useState({ newPw: "", confirmPw: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [changeLoading, setChangeLoading] = useState(false);

  // profile image upload
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const { userTypes, defaultUserType, sex: sexMap } = useMapping();

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setPwStep("idle");
      setVerifyData({ currentPw: "" });
      setVerifyErrors({});
      setPwData({ newPw: "", confirmPw: "" });
      setPwErrors({});
      setImagePreview(null);
      setImageFile(null);
    }
  }, [open]);

  // Fetch user on open
  useEffect(() => {
    if (!open) return;
    const nUserId = localStorage.getItem("userId");
    if (!nUserId) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await api.get(`users/${nUserId}`);
        const rawUser = data?.user || {};
        setUser({
          ...rawUser,
          firstName: rawUser.strFName || "",
          middleName: rawUser.strMName || "",
          lastName: rawUser.strLName || "",
          fullName:
            [rawUser.strFName, rawUser.strMName, rawUser.strLName]
              .filter(Boolean)
              .join(" ") || "No Name",
          nickname: rawUser.strNickName || "",
          username: rawUser.strUserName || "",
          email: rawUser.strEmail || "",
          type:
            userTypes?.[rawUser.cUserType] ??
            defaultUserType?.[rawUser.cUserType] ??
            "",
          sex: sexMap?.[rawUser.cSex] || rawUser.cSex || "",
          statusCode: rawUser.cStatus,
        });
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [open, userTypes, defaultUserType, sexMap]);

  if (!open) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const fullName = [user?.firstName, user?.middleName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  const displayImage = imagePreview ?? resolveProfileImage(user);

  const getActiveText = () => {
    if (!user?.dtLoggedIn) return "Inactive";
    const updated = new Date(user.dtLoggedIn);
    if (isNaN(updated)) return "Inactive";
    const diffMs = Date.now() - updated.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (Number(user.bIsActive) === 0) return "Active now";
    if (mins < 1) return "Active just now";
    if (mins < 60) return `Active ${mins} min${mins === 1 ? "" : "s"} ago`;
    if (hours < 24) return `Active ${hours} hr${hours === 1 ? "" : "s"} ago`;
    return `Active ${days} day${days === 1 ? "" : "s"} ago`;
  };

  const statusChip =
    user?.statusCode === "V"
      ? { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Pending" }
      : user?.statusCode === "A"
        ? {
            color: "#10b981",
            bg: "#ecfdf5",
            border: "#a7f3d0",
            label: "Active",
          }
        : user?.statusCode === "I"
          ? {
              color: "#6b7280",
              bg: "#f9fafb",
              border: "#e5e7eb",
              label: "Inactive",
            }
          : null;

  // ── FormGrid field definitions ──────────────────────────────────────────────
  const verifyFields = [
    { label: "Current Password", name: "currentPw", type: "password", xs: 12 },
  ];

  const changeFields = [
    { label: "New Password", name: "newPw", type: "password", xs: 12 },
    {
      label: "Confirm Password",
      name: "confirmPw",
      type: "password",
      xs: 12,
      disabled: !pwData.newPw || pwData.newPw.length < 6,
    },
  ];

  // ── Profile image handlers ───────────────────────────────────────────────────
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    const nUserId = localStorage.getItem("userId");
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("strProfileImage", imageFile);

      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}users/${nUserId}/profile-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      // 1. Update modal's internal state
      setUser((prev) => ({ ...prev, strProfileImage: data.strProfileImage }));

      // 2. Persist to localStorage so Header & SidebarProfile re-read the new image
      syncLocalStorage({ strProfileImage: data.strProfileImage });

      setImagePreview(null);
      setImageFile(null);
    } catch (e) {
      console.error("Profile image upload failed:", e);
    } finally {
      setImageUploading(false);
    }
  };

  // ── Change handlers with live password validation ────────────────────────────
  const handleVerifyChange = (e) => {
    const { name, value } = e.target;
    setVerifyData((prev) => ({ ...prev, [name]: value }));
    if (verifyErrors[name])
      setVerifyErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwData((prev) => ({ ...prev, [name]: value }));
    if (name === "newPw") {
      setPwErrors((prev) => ({
        ...prev,
        newPw: validatePassword(value),
        confirmPw: pwData.confirmPw
          ? validateConfirmPassword(value, pwData.confirmPw)
          : prev.confirmPw,
      }));
      if (!value) setPwData((prev) => ({ ...prev, confirmPw: "" }));
    } else if (name === "confirmPw") {
      setPwErrors((prev) => ({
        ...prev,
        confirmPw: validateConfirmPassword(pwData.newPw, value),
      }));
    }
  };

  // ── Step action handlers ──────────────────────────────────────────────────────
  const handleVerify = async () => {
    const errors = {};
    if (!verifyData.currentPw.trim())
      errors.currentPw = "Current password is required.";
    if (Object.keys(errors).length) {
      setVerifyErrors(errors);
      return;
    }

    setVerifyLoading(true);
    try {
      await api.post("auth/verify-password", {
        strPassword: verifyData.currentPw,
      });
      setPwStep("change");
    } catch (e) {
      setVerifyErrors({
        currentPw:
          e.status === 404
            ? "Incorrect password. Please try again."
            : "Verification failed. Please try again.",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = {};
    if (!pwData.newPw) errors.newPw = "New password is required.";
    if (!pwData.confirmPw)
      errors.confirmPw = "Please confirm your new password.";
    const pwErr = validatePassword(pwData.newPw);
    const cpErr = validateConfirmPassword(pwData.newPw, pwData.confirmPw);
    if (pwErr) errors.newPw = pwErr;
    if (cpErr) errors.confirmPw = cpErr;
    if (Object.keys(errors).length) {
      setPwErrors(errors);
      return;
    }

    setChangeLoading(true);
    try {
      const nUserId = localStorage.getItem("userId");
      await api.patch(`users/${nUserId}/password`, {
        strPassword: pwData.newPw,
        strPassword_confirmation: pwData.confirmPw,
      });
      setPwStep("done");
    } catch (e) {
      setPwErrors({ newPw: "Failed to update password. Please try again." });
    } finally {
      setChangeLoading(false);
    }
  };

  // ── Per-step ModalContainer props ───────────────────────────────────────────
  const stepModalProps = {
    idle: {
      showSave: true,
      saveLabel: imageFile
        ? imageUploading
          ? "Uploading…"
          : "Save Photo"
        : "Change Password",
      onSave: imageFile ? handleImageUpload : () => setPwStep("verify"),
      disabled: imageUploading,
      showCancel: true,
      cancelLabel: imageFile ? "Discard" : "Close",
      onCancel: imageFile
        ? () => {
            setImageFile(null);
            setImagePreview(null);
          }
        : onClose,
    },
    verify: {
      showSave: true,
      saveLabel: verifyLoading ? "Verifying…" : "Confirm",
      onSave: handleVerify,
      disabled: verifyLoading,
      showCancel: true,
      cancelLabel: "Back",
      onCancel: () => {
        setPwStep("idle");
        setVerifyData({ currentPw: "" });
        setVerifyErrors({});
      },
    },
    change: {
      showSave: true,
      saveLabel: changeLoading ? "Saving…" : "Update Password",
      onSave: handleChangePassword,
      disabled: changeLoading,
      showCancel: true,
      cancelLabel: "Back",
      onCancel: () => {
        setPwStep("verify");
        setPwData({ newPw: "", confirmPw: "" });
        setPwErrors({});
      },
    },
    done: {
      showSave: false,
      showCancel: true,
      cancelLabel: "Back to Profile",
      onCancel: () => {
        setPwStep("idle");
        setPwData({ newPw: "", confirmPw: "" });
        setVerifyData({ currentPw: "" });
      },
    },
  };

  const currentStepProps = stepModalProps[pwStep] ?? stepModalProps.idle;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Account Profile"
      subTitle={fullName ? `/ ${fullName.trim()}` : ""}
      width={850}
      loading={loading}
      {...currentStepProps}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageChange}
      />

      <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
        {/* ── Header banner ── */}
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #115e59 100%)",
            borderRadius: "12px 12px 0 0",
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1.5, sm: 2.5 },
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Box
              sx={{
                width: { xs: 70, sm: 100 },
                height: { xs: 70, sm: 100 },
                borderRadius: "50%",
                overflow: "hidden",
                border: "2.5px solid rgba(255,255,255,0.4)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              <img
                src={displayImage}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>

            <Tooltip title="Change photo" placement="bottom">
              <IconButton
                onClick={handleImageClick}
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

          {/* Profile text */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: { xs: "0.6rem", sm: "0.68rem" },
                fontWeight: 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              My Profile
            </Typography>

            <Typography
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              {fullName}
            </Typography>

            {user?.type && (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  mt: 0.2,
                }}
              >
                {user.type}
              </Typography>
            )}

            <Typography
              sx={{
                color: "rgba(255,255,255,0.5)",
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                mt: 0.3,
              }}
            >
              {getActiveText()}
            </Typography>
          </Box>

          {/* Status chip */}
          {statusChip && (
            <Chip
              label={statusChip.label}
              size="small"
              sx={{
                backgroundColor: statusChip.bg,
                color: statusChip.color,
                border: `1px solid ${statusChip.border}`,
                fontWeight: 600,
                fontSize: { xs: "0.62rem", sm: "0.7rem" },
                letterSpacing: "0.3px",
                flexShrink: 0,
                height: { xs: 22, sm: 26 },
              }}
            />
          )}
        </Box>

        {/* Info section */}
        {pwStep === "idle" && (
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            {fieldConfig.map(({ label, key, icon: Icon }, i) => (
              <Box key={label}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" }, // same as user
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1.2, sm: 1.1 },
                    gap: { xs: 0.5, sm: 1.5 },
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                >
                  {/* Icon + Label (always horizontal) */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minWidth: { sm: 140 },
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        bgcolor: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: "0.85rem", color: "#3b82f6" }} />
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>

                  {/* Divider mobile */}
                  <Divider
                    orientation="horizontal"
                    flexItem
                    sx={{
                      display: { xs: "block", sm: "none" },
                      borderColor: "#f3f4f6",
                    }}
                  />

                  {/* Divider desktop */}
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", sm: "block" }, mx: 0.5 }}
                  />

                  {/* Value */}
                  <Typography
                    sx={{
                      fontSize: { xs: "0.82rem", sm: "0.84rem" },
                      color: "#111827",
                      fontStyle: user?.[key] ? "normal" : "italic",
                      pl: { xs: 4.5, sm: 0 }, // indent under icon
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.[key] || "—"}
                  </Typography>
                </Box>

                {i < fieldConfig.length - 1 && (
                  <Divider
                    sx={{
                      mx: { xs: 1.5, sm: 2 },
                      borderColor: "#f3f4f6",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* ══ STEP: verify ══ */}
        {pwStep === "verify" && (
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: "#fff",
              p: 3,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 1.5,
              }}
            >
              Verify Identity
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: "#374151",
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              Confirm your <strong>current password</strong> to proceed.
            </Typography>
            <FormGrid
              fields={verifyFields}
              formData={verifyData}
              errors={verifyErrors}
              handleChange={handleVerifyChange}
            />
          </Box>
        )}

        {/* ══ STEP: change ══ */}
        {pwStep === "change" && (
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: "#fff",
              p: 3,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 1.5,
              }}
            >
              Set New Password
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: "#374151",
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              Enter and confirm your <strong>new password</strong>.
            </Typography>
            <FormGrid
              fields={changeFields}
              formData={pwData}
              errors={pwErrors}
              handleChange={handlePwChange}
            />
          </Box>
        )}

        {/* ══ STEP: done ══ */}
        {pwStep === "done" && (
          <Box
            sx={{
              border: "1px solid #a7f3d0",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: "#ecfdf5",
              p: 3,
              mb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              textAlign: "center",
            }}
          >
            <CheckCircle sx={{ fontSize: 48, color: "#10b981" }} />
            <Typography
              sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#065f46" }}
            >
              Password Updated Successfully
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: "#047857",
                lineHeight: 1.6,
                maxWidth: 320,
              }}
            >
              Your password has been changed. Use your new password the next
              time you log in.
            </Typography>
          </Box>
        )}
      </Paper>
    </ModalContainer>
  );
}

export default AccountProfileModal;
