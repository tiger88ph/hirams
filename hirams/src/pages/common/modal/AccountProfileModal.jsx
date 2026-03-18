import React, { useCallback, useEffect, useRef, useState } from "react";
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
import uiMessages from "../../../utils/helpers/uiMessages";
import ModalContainer from "../../../components/common/ModalContainer";
import useMapping from "../../../utils/mappings/useMapping";
import api from "../../../utils/api/api";
import FormGrid from "../../../components/common/FormGrid";
import { resolveProfileImage } from "../../../utils/helpers/profileImage";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../../utils/helpers/passwordFormat";

// ── Constants ────────────────────────────────────────────────────────────────

const FIELD_CONFIG = [
  { label: "Name", key: "fullName", icon: Person },
  { label: "Nickname", key: "nickname", icon: Badge },
  { label: "Username", key: "username", icon: AccountCircle },
  { label: "Email", key: "email", icon: AlternateEmail },
  { label: "User Type", key: "type", icon: WorkOutline },
  { label: "Sex", key: "sex", icon: Wc },
];

const STATUS_MAP = {
  V: { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
  A: { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", label: "Active" },
  I: { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", label: "Inactive" },
};

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
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : {};
    localStorage.setItem("user", JSON.stringify({ ...parsed, ...updates }));
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
  if (mins < 60) return `Active ${mins}  min${mins === 1 ? "" : "s"} ago`;
  if (hours < 24) return `Active ${hours} hr${hours === 1 ? "" : "s"} ago`;
  return `Active ${days}  day${days === 1 ? "" : "s"} ago`;
};

// ── Component ────────────────────────────────────────────────────────────────

function AccountProfileModal({ open, onClose }) {
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

  const { userTypes, defaultUserType, sex: sexMap } = useMapping();
  const [imageError, setImageError] = useState(null);
  // ── Reset all transient state on close ──────────────────────────────────────
  useEffect(() => {
    if (open) return;
    setPwStep("idle");
    setVerifyData(INITIAL_VERIFY);
    setVerifyErrors({});
    setPwData(INITIAL_PW_DATA);
    setPwErrors({});
    // Revoke the object URL to avoid memory leaks
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  }, [open]); // intentionally excludes imagePreview from deps to avoid loop

  // ── Fetch user on open ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const nUserId = localStorage.getItem("userId");
    if (!nUserId) return;

    let cancelled = false;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await api.get(`users/${nUserId}`);
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
  const displayImage = imagePreview ?? resolveProfileImage(user);
  const statusChip = STATUS_MAP[user?.statusCode] ?? null;

  // ── Profile image handlers ──────────────────────────────────────────────────
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError(null); // ← add this
    e.target.value = "";
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    const nUserId = localStorage.getItem("userId");
    setImageUploading(true);
    setImageError(null); // clear previous error

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

      if (!response.ok) {
        // Parse Laravel's validation / error response
        let msg = "Upload failed. Please try again.";
        try {
          const errData = await response.json();
          if (errData?.errors?.strProfileImage?.[0])
            msg = errData.errors.strProfileImage[0];
          else if (errData?.message) msg = errData.message;
        } catch {}
        setImageError(msg);
        return; // keep the preview so user can see what failed
      }

      const data = await response.json();
      setUser((prev) => ({ ...prev, strProfileImage: data.strProfileImage }));
      syncLocalStorage({ strProfileImage: data.strProfileImage });

      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageFile(null);
    } catch (e) {
      console.error("Profile image upload failed:", e);
      setImageError("Network error. Please check your connection.");
    } finally {
      setImageUploading(false);
    }
  };
  const handleDiscardImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageError(null); // ← add this
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
      await api.post("auth/verify-password", {
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
        // Clear confirmPw if newPw is emptied
        if (!value) next.confirmPw = "";
      }

      return next;
    });

    // Validate using functional updater to avoid stale closure on pwData
    setPwErrors((prev) => {
      if (name === "newPw") {
        return {
          ...prev,
          newPw: validatePassword(value),
          // Re-validate confirm only if it already has a value
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
      const nUserId = localStorage.getItem("userId");
      await api.patch(`users/${nUserId}/password`, {
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
        {/* ── Header banner ──────────────────────────────────────────────── */}
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
          {/* Avatar */}
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Box
              sx={{
                width: { xs: 70, sm: 100 },
                height: { xs: 70, sm: 100 },
                borderRadius: "50%",
                overflow: "hidden",
                border: imageError
                  ? "2.5px solid #ef4444" // red on error
                  : "2.5px solid rgba(255,255,255,0.4)",
                boxShadow: imageError
                  ? "0 0 0 3px rgba(239,68,68,0.3)" // soft red glow
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
                  left: "110%", // floats to the right of the avatar
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "#ef4444",
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
                  // arrow pointing left (at the start of the message)
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    right: "100%", // arrow on the left side
                    transform: "translateY(-50%)",
                    border: "5px solid transparent",
                    borderRightColor: "#ef4444",
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
              border: "1px solid #e5e7eb",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              overflow: "hidden",
              bgcolor: "#fff",
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
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                >
                  {/* Icon + Label */}
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

                  {/* Mobile divider */}
                  <Divider
                    orientation="horizontal"
                    flexItem
                    sx={{
                      display: { xs: "block", sm: "none" },
                      borderColor: "#f3f4f6",
                    }}
                  />

                  {/* Desktop divider */}
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
                      pl: { xs: 4.5, sm: 0 },
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.[key] || "—"}
                  </Typography>
                </Box>

                {i < FIELD_CONFIG.length - 1 && (
                  <Divider
                    sx={{ mx: { xs: 1.5, sm: 2 }, borderColor: "#f3f4f6" }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* ── STEP: verify ───────────────────────────────────────────────── */}
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

        {/* ── STEP: done ─────────────────────────────────────────────────── */}
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
