import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
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
import uiMessages from "../../../../utils/helpers/uiMessages.js";
import ModalContainer from "../../../../layouts/modal/ModalContainer.jsx";
import useKeysLabels from "../../../../hooks/useKeysLabels.js";
import UserAPI from "../../../../api/endpoints/user.api.js";
import AuthAPI from "../../../../api/endpoints/auth.api.js";
import FormGrid from "../../../../components/form/FormGrid.jsx";
import { resolveProfileImage } from "../../../../utils/helpers/profileImage.js";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import BaseButton from "../../../../components/form/BaseButton.jsx";
import { getItem, setItem } from "../../../../utils/storage/localStorage.js";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../../../utils/helpers/passwordFormat.js";

// ── Constants ────────────────────────────────────────────────────────────────

const FIELD_CONFIG = [
  { label: "Nickname", key: "nickname", icon: Badge },
  { label: "Username", key: "username", icon: AccountCircle },
  { label: "Phone Number", key: "phoneNumber", icon: PhoneIphoneOutlined },
  { label: "Email", key: "email", icon: AlternateEmail },
  { label: "Sex", key: "sex", icon: Wc },
];

const VERIFY_FIELDS = [
  { label: "Current Password", name: "currentPw", type: "password", xs: 12 },
];

const INITIAL_VERIFY = { currentPw: "" };
const INITIAL_PW_DATA = { newPw: "", confirmPw: "" };

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Merges updates into the "user" object stored in localStorage and dispatches
 * a synthetic "storage" event so same-tab listeners (e.g. Header, SidebarProfile)
 * pick up the change immediately.
 */
const syncLocalStorage = (updates = {}) => {
  try {
    const parsed = getItem("user", {});
    setItem("user", { ...parsed, ...updates });
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.warn("Failed to sync localStorage user:", err);
  }
};

/**
 * Returns a human-readable "active X ago" string.
 *
 * NOTE: `bIsActive === 1` means the user is currently online (active now).
 *       The previous implementation tested for `=== 0`, which was inverted.
 */
const getActiveText = (user) => {
  if (!user?.dtLoggedIn) return "Inactive";

  const lastSeen = new Date(user.dtLoggedIn);
  if (isNaN(lastSeen)) return "Inactive";

  // bIsActive flag: 1 = currently online
  if (Number(user.bIsActive) === 1) return "Active now";

  const diffMs = Date.now() - lastSeen.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "Active just now";
  if (mins < 60) return `Active ${mins} min${mins === 1 ? "" : "s"} ago`;
  if (hours < 24) return `Active ${hours} hr${hours === 1 ? "" : "s"} ago`;
  return `Active ${days} day${days === 1 ? "" : "s"} ago`;
};

// ── Component ────────────────────────────────────────────────────────────────

function AccountProfileModal({ open, onClose }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ✅ THEME-AWARE COLORS — Auto switches Light/Dark
  const colors = {
    // Header gradient
    headerStart: isDark ? "#0f4c4a" : "#042f2e",
    headerMid: isDark ? "#1a6560" : "#134e4a",
    headerEnd: isDark ? "#14756e" : "#115e59",

    // Status chip colors
    statusPendingBg: isDark ? "rgba(245,158,11,0.15)" : "#fffbeb",
    statusPendingText: isDark ? "#fcd34d" : "#f59e0b",
    statusPendingBorder: isDark ? "rgba(253,230,138,0.3)" : "#fde68a",
    statusActiveBg: isDark ? "rgba(16,185,129,0.15)" : "#ecfdf5",
    statusActiveText: isDark ? "#6ee7b7" : "#10b981",
    statusActiveBorder: isDark ? "rgba(167,243,208,0.3)" : "#a7f3d0",
    statusInactiveBg: isDark ? "rgba(107,114,128,0.15)" : "#f9fafb",
    statusInactiveText: isDark ? "#9ca3af" : "#6b7280",
    statusInactiveBorder: isDark ? "rgba(229,231,235,0.2)" : "#e5e7eb",

    // Card & backgrounds
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "rgba(148,163,184,0.25)" : "#e5e7eb",
    rowHover: isDark ? "rgba(59,130,246,0.06)" : "#f8fafc",
    iconBoxBg: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff",
    primary: isDark ? "#60a5fa" : "#3b82f6",
    primaryDark: isDark ? "#3b82f6" : "#1976d2",

    // Text
    textPrimary: isDark ? "#f1f5f9" : "#111827",
    textSecondary: isDark ? "#94a3b8" : "#6b7280",
    textMuted: isDark ? "#64748b" : "#9ca3af",
    textInverse: "#ffffff",

    // Divider
    divider: isDark ? "rgba(148,163,184,0.18)" : "#f3f4f6",

    // Success state
    successBg: isDark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: isDark ? "rgba(110,231,183,0.3)" : "#a7f3d0",
    successText: isDark ? "#6ee7b7" : "#065f46",
    successTextBold: isDark ? "#a7f3d0" : "#047857",

    // Error
    errorRed: isDark ? "#f87171" : "#ef4444",
    errorRedGlow: isDark ? "rgba(248,113,113,0.25)" : "rgba(239,68,68,0.3)",

    // Edit photo button
    editBtnBg: isDark ? "#334155" : "#ffffff",
    editBtnBorder: isDark ? "rgba(148,163,184,0.4)" : "#e5e7eb",
    editBtnHoverBg: isDark ? "rgba(59,130,246,0.15)" : "#f0f9ff",
  };

  const STATUS_MAP = {
    V: {
      color: colors.statusPendingText,
      bg: colors.statusPendingBg,
      border: colors.statusPendingBorder,
      label: "Pending",
    },
    A: {
      color: colors.statusActiveText,
      bg: colors.statusActiveBg,
      border: colors.statusActiveBorder,
      label: "Active",
    },
    I: {
      color: colors.statusInactiveText,
      bg: colors.statusInactiveBg,
      border: colors.statusInactiveBorder,
      label: "Inactive",
    },
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwStep, setPwStep] = useState("idle");

  // Verify step
  const [verifyData, setVerifyData] = useState(INITIAL_VERIFY);
  const [verifyErrors, setVerifyErrors] = useState({});
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Change step
  const [pwData, setPwData] = useState(INITIAL_PW_DATA);
  const [pwErrors, setPwErrors] = useState({});
  const [changeLoading, setChangeLoading] = useState(false);

  // Profile image
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [editData, setEditData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const { userTypes, defaultUserType, sex: sexMap } = useKeysLabels();
  const [imageError, setImageError] = useState(null);
  // ── Reset all transient state on close ──────────────────────────────────────
  useEffect(() => {
    if (open) return;
    setPwStep("idle");
    setVerifyData(INITIAL_VERIFY);
    setVerifyErrors({});
    setPwData(INITIAL_PW_DATA);
    setPwErrors({});
    setEditData({});
    setEditErrors({});
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  }, [open]);
  // ── Fetch user on open ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const nUserId = getItem("userId");
    if (!nUserId) return;

    let cancelled = false;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await UserAPI.getById(nUserId);
        const raw = data?.user ?? {};

        if (!cancelled) {
          setUser({
            ...raw,
            firstName: raw.strFName || "",
            middleName: raw.strMName || "",
            lastName: raw.strLName || "",
            fullName:
              [raw.strFName, raw.strMName, raw.strLName]
                .filter(Boolean)
                .join(" ") || "No Name",
            nickname: raw.strNickName || "",
            username: raw.strUserName || "",
            phoneNumber: raw.strPhoneNo || "",
            email: raw.strEmail || "",
            type:
              userTypes?.[raw.cUserType] ??
              defaultUserType?.[raw.cUserType] ??
              "",
            sex: sexMap?.[raw.cSex] || raw.cSex || "",
            statusCode: raw.cStatus,
          });
        }
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [open, userTypes, defaultUserType, sexMap]);

  if (!open) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const fullName = [user?.firstName, user?.middleName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  const displayImage = resolveProfileImage(user, imagePreview);
  const statusChip = STATUS_MAP[user?.statusCode] ?? null;

  // ── Profile image handlers ──────────────────────────────────────────────────
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError(null);
    e.target.value = "";
  };
  const handleImageUpload = async () => {
    if (!imageFile) return;

    const nUserId = getItem("userId");
    setImageUploading(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append("strProfileImage", imageFile);

      const data = await UserAPI.uploadProfileImage(nUserId, formData);

      setUser((prev) => ({ ...prev, strProfileImage: data.strProfileImage }));
      syncLocalStorage({ strProfileImage: data.strProfileImage });

      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageFile(null);
    } catch (e) {
      console.error("Profile image upload failed:", e);
      const msg =
        e?.data?.errors?.strProfileImage?.[0] ||
        e?.data?.message ||
        e?.message ||
        "Upload failed. Please try again.";
      setImageError(msg);
    } finally {
      setImageUploading(false);
    }
  };
  const handleDiscardImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
  };

  // ── Password – verify step ──────────────────────────────────────────────────
  const handleVerifyChange = (e) => {
    const { name, value } = e.target;
    setVerifyData((prev) => ({ ...prev, [name]: value }));
    if (verifyErrors[name])
      setVerifyErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVerify = async () => {
    if (!verifyData.currentPw.trim()) {
      setVerifyErrors({ currentPw: uiMessages.common.requiredPassword });
      return;
    }

    setVerifyLoading(true);
    try {
      await AuthAPI.verifyPassword({
        strPassword: verifyData.currentPw,
      });
      setPwStep("change");
    } catch (e) {
      setVerifyErrors({
        currentPw:
          e.status === 404
            ? uiMessages.common.invalidPassword
            : uiMessages.common.failedVerification,
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Password – change step ──────────────────────────────────────────────────
  const handlePwChange = (e) => {
    const { name, value } = e.target;

    setPwData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "newPw") {
        if (!value) next.confirmPw = "";
      }

      return next;
    });

    setPwErrors((prev) => {
      if (name === "newPw") {
        return {
          ...prev,
          newPw: validatePassword(value),
          confirmPw: pwData.confirmPw
            ? validateConfirmPassword(value, pwData.confirmPw)
            : prev.confirmPw,
        };
      }
      if (name === "confirmPw") {
        return {
          ...prev,
          confirmPw: validateConfirmPassword(pwData.newPw, value),
        };
      }
      return prev;
    });
  };

  const handleChangePassword = async () => {
    const errors = {};

    if (!pwData.newPw) errors.newPw = uiMessages.common.requiredPassword;
    if (!pwData.confirmPw) errors.confirmPw = uiMessages.common.confirmPassword;

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
      const nUserId = getItem("userId");
      await UserAPI.updatePassword(nUserId, {
        strPassword: pwData.newPw,
        strPassword_confirmation: pwData.confirmPw,
      });
      setPwStep("done");
    } catch {
      setPwErrors({ newPw: uiMessages.common.failedUpdatePassword });
    } finally {
      setChangeLoading(false);
    }
  };

  // ── Dynamic FormGrid fields ─────────────────────────────────────────────────
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
  const handleStartEdit = () => {
    setEditData({
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      lastName: user?.lastName || "",
      nickname: user?.nickname || "",
      sex: user?.sex || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      username: user?.username || "",
    });
    setEditErrors({});
    setPwStep("editProfile");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSaveProfile = async () => {
    const newErrors = {};
    if (!editData.firstName?.trim())
      newErrors.firstName = "First name is required.";
    if (!editData.lastName?.trim())
      newErrors.lastName = "Last name is required.";
    if (!editData.nickname?.trim())
      newErrors.nickname = "Nickname is required.";

    if (Object.keys(newErrors).length) {
      setEditErrors(newErrors);
      return;
    }

    const nUserId = getItem("userId");
    setEditLoading(true);

    try {
      const payload = {
        strFName: editData.firstName,
        strMName: editData.middleName || "",
        strLName: editData.lastName,
        strNickName: editData.nickname,
        cSex:
          Object.keys(sexMap || {}).find((k) => sexMap[k] === editData.sex) ||
          user?.cSex,
        strPhoneNo: editData.phoneNumber || "",
        strEmail: editData.email || "",
        strUserName: editData.username || "",
        cUserType: user?.cUserType,
      };

      const res = await UserAPI.updateUser(nUserId, payload);
      const updated = res?.user ?? {};

      setUser((prev) => ({
        ...prev,
        firstName: updated.strFName ?? editData.firstName,
        middleName: updated.strMName ?? editData.middleName,
        lastName: updated.strLName ?? editData.lastName,
        fullName:
          [
            updated.strFName ?? editData.firstName,
            updated.strMName ?? editData.middleName,
            updated.strLName ?? editData.lastName,
          ]
            .filter(Boolean)
            .join(" ") || "No Name",
        nickname: updated.strNickName ?? editData.nickname,
        phoneNumber: updated.strPhoneNo ?? editData.phoneNumber,
        email: updated.strEmail ?? editData.email,
        username: updated.strUserName ?? editData.username,
        sex: sexMap?.[updated.cSex] || editData.sex,
      }));

      syncLocalStorage({
        strFName: updated.strFName ?? editData.firstName,
        strMName: updated.strMName ?? editData.middleName,
        strLName: updated.strLName ?? editData.lastName,
        strNickName: updated.strNickName ?? editData.nickname,
      });

      setPwStep("idle");
    } catch (e) {
      console.error("Failed to update profile:", e);
      setEditErrors({
        firstName: e?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setEditLoading(false);
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
      onCancel: imageFile ? handleDiscardImage : onClose,
      extraActions: !imageFile ? (
        <BaseButton
          label="Edit Profile"
          icon={<EditRounded />}
          variant="outlined"
          actionColor="edit"
          onClick={handleStartEdit}
        />
      ) : null,
    },
    editProfile: {
      showSave: true,
      saveLabel: editLoading ? "Saving…" : "Save Changes",
      onSave: handleSaveProfile,
      disabled: editLoading,
      showCancel: true,
      cancelLabel: "Cancel",
      onCancel: () => {
        setPwStep("idle");
        setEditData({});
        setEditErrors({});
      },
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
        setVerifyData(INITIAL_VERIFY);
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
        setPwData(INITIAL_PW_DATA);
        setPwErrors({});
      },
    },
    done: {
      showSave: false,
      showCancel: true,
      cancelLabel: "Back to Profile",
      onCancel: () => {
        setPwStep("idle");
        setPwData(INITIAL_PW_DATA);
        setVerifyData(INITIAL_VERIFY);
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
      subTitle={fullName ? `${fullName.trim()}` : ""}
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
        {/* ── Header banner ──────────────────────────────────────────────── */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${colors.headerStart} 0%, ${colors.headerMid} 50%, ${colors.headerEnd} 100%)`,
            borderRadius: "12px 12px 0 0",
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1.5, sm: 2.5 },
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Box
              sx={{
                width: { xs: 70, sm: 100 },
                height: { xs: 70, sm: 100 },
                borderRadius: "50%",
                overflow: "hidden",
                border: imageError
                  ? `2.5px solid ${colors.errorRed}`
                  : "2.5px solid rgba(255,255,255,0.4)",
                boxShadow: imageError
                  ? `0 0 0 3px ${colors.errorRedGlow}`
                  : "0 4px 12px rgba(0,0,0,0.25)",
                transition: "border 0.2s, box-shadow 0.2s",
              }}
            >
              <img
                src={displayImage}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            {imageError && (
              <Box
                sx={{
                  position: "absolute",
                  left: "110%",
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: colors.errorRed,
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  px: 1.2,
                  py: 0.6,
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  zIndex: 10,
                  pointerEvents: "none",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    right: "100%",
                    transform: "translateY(-50%)",
                    border: "5px solid transparent",
                    borderRightColor: colors.errorRed,
                  },
                }}
              >
                {imageError}
              </Box>
            )}
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
                  bgcolor: colors.editBtnBg,
                  border: `2px solid ${colors.editBtnBorder}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  "&:hover": {
                    bgcolor: colors.editBtnHoverBg,
                    borderColor: colors.primary,
                    "& svg": { color: colors.primary },
                  },
                }}
              >
                <EditRounded
                  sx={{
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    color: colors.textSecondary,
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
                color: colors.textInverse,
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
              {getActiveText(user)}
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

        {/* ── STEP: idle – profile info ───────────────────────────────────── */}
        {pwStep === "idle" && (
          <Box
            sx={{
              border: `1px solid ${colors.cardBorder}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              overflow: "hidden",
              bgcolor: colors.cardBg,
            }}
          >
            {FIELD_CONFIG.map(({ label, key, icon: Icon }, i) => (
              <Box key={label}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1.2, sm: 1.1 },
                    gap: { xs: 0.5, sm: 1.5 },
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: colors.rowHover },
                  }}
                >
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
                        bgcolor: colors.iconBoxBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        sx={{ fontSize: "0.85rem", color: colors.primary }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        color: colors.textSecondary,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>

                  <Divider
                    orientation="horizontal"
                    flexItem
                    sx={{
                      display: { xs: "block", sm: "none" },
                      borderColor: colors.divider,
                    }}
                  />

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      display: { xs: "none", sm: "block" },
                      mx: 0.5,
                      borderColor: colors.divider,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: { xs: "0.82rem", sm: "0.84rem" },
                      color: colors.textPrimary,
                      fontStyle: user?.[key] ? "normal" : "italic",
                      pl: { xs: 4.5, sm: 0 },
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.[key] || "—"}
                  </Typography>
                </Box>

                {i < FIELD_CONFIG.length - 1 && (
                  <Divider
                    sx={{ mx: { xs: 1.5, sm: 2 }, borderColor: colors.divider }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* ── STEP: editProfile ────────────────────────────────────────────── */}
        {pwStep === "editProfile" && (
          <Box
            sx={{
              border: `1px solid ${colors.cardBorder}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: colors.cardBg,
              p: 3,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 1.5,
              }}
            >
              Edit Profile
            </Typography>
            <FormGrid
              fields={[
                { label: "First Name", name: "firstName", xs: 4 },
                { label: "Middle Name", name: "middleName", xs: 4 },
                { label: "Last Name", name: "lastName", xs: 4 },
                { label: "Nickname", name: "nickname", xs: 6 },
                {
                  label: "Sex",
                  name: "sex",
                  type: "select",
                  xs: 6,
                  options: Object.entries(sexMap || {}).map(([, label]) => ({
                    value: label,
                    label,
                  })),
                },
                {
                  label: "Phone Number",
                  name: "phoneNumber",
                  type: "phone",
                  xs: 6,
                },
                {
                  label: "Username",
                  name: "username",
                  type: "username",
                  xs: 6,
                },
                { label: "Email", name: "email", type: "email", xs: 12 },
              ]}
              formData={editData}
              errors={editErrors}
              handleChange={handleEditChange}
            />
          </Box>
        )}
        {/* ── STEP: verify ───────────────────────────────────────────────── */}
        {pwStep === "verify" && (
          <Box
            sx={{
              border: `1px solid ${colors.cardBorder}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: colors.cardBg,
              p: 3,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: colors.textSecondary,
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
                color: colors.textPrimary,
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              Confirm your <strong>current password</strong> to proceed.
            </Typography>
            <FormGrid
              fields={VERIFY_FIELDS}
              formData={verifyData}
              errors={verifyErrors}
              handleChange={handleVerifyChange}
            />
          </Box>
        )}

        {/* ── STEP: change ───────────────────────────────────────────────── */}
        {pwStep === "change" && (
          <Box
            sx={{
              border: `1px solid ${colors.cardBorder}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: colors.cardBg,
              p: 3,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: colors.textSecondary,
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
                color: colors.textPrimary,
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

        {/* ── STEP: done ─────────────────────────────────────────────────── */}
        {pwStep === "done" && (
          <Box
            sx={{
              border: `1px solid ${colors.successBorder}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              bgcolor: colors.successBg,
              p: 3,
              mb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              textAlign: "center",
            }}
          >
            <CheckCircle
              sx={{ fontSize: 48, color: colors.statusActiveText }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: colors.successText,
              }}
            >
              Password Updated Successfully
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: colors.successTextBold,
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
