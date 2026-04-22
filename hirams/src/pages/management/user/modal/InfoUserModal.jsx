import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Fade,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  PlayArrow,
  PauseCircle,
  CheckCircle,
  Person,
  Badge,
  AlternateEmail,
  AccountCircle,
  Wc,
  WorkOutline,
  VerifiedUser,
} from "@mui/icons-material";
import ModalContainer from "../../../../components/common/ModalContainer";
import BaseButton from "../../../../components/common/BaseButton";
import Toast from "../../../../components/helper/Toast";
import uiMessages from "../../../../utils/helpers/uiMessages";
import { resolveProfileImage } from "../../../../utils/helpers/profileImage";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";

const fieldConfig = [
  { label: "Name", key: "fullName", icon: Person },
  { label: "Nickname", key: "nickname", icon: Badge },
  { label: "Username", key: "username", icon: AccountCircle },
  { label: "Email", key: "email", icon: AlternateEmail },
  { label: "User Type", key: "type", icon: WorkOutline },
  { label: "Sex", key: "sex", icon: Wc },
];

const statusConfig = {
  pending: {
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    label: "Pending Approval",
  },
  active: {
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    label: "Active",
  },
  inactive: {
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
    label: "Inactive",
  },
};

function InfoUserModal({
  open,
  handleClose,
  userData,
  onApprove,
  onActive,
  onInactive,
  onRedirect,
  activeKey,
  inactiveKey,
  pendingKey,
  activeLabel,
  inactiveLabel,
  pendingLabel,
  femaleKey,
  maleKey,
  userTypes,
}) {
  const [confirmLetter, setConfirmLetter] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");
  const errorAlertRef = useRef(null);

  useEffect(() => {
    if (confirmError && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [confirmError]);

  const handleConfirm = useCallback(
    async (action) => {
      if (!userData?.firstName) return;
      if (confirmLetter.toUpperCase() !== userData.firstName[0].toUpperCase()) {
        setConfirmError(uiMessages.common.errorReqChar);
        return;
      }
      if (action === pendingLabel && !selectedUserType) {
        setConfirmError(uiMessages.common.errorUserType);
        return;
      }

      const entity = userData.nickname || userData.firstName;

      const actionWord =
        action === activeLabel
          ? "activated"
          : action === inactiveLabel
            ? "deactivated"
            : "approved";

      setConfirmLetter("");
      setSelectedUserType("");
      setConfirmError("");
      handleClose();

      // Wait for modal close animation to finish before showing spinner
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        await withSpinner(entity, async () => {
          if (action === activeLabel) await onActive?.();
          else if (action === inactiveLabel) await onInactive?.();
          else if (action === pendingLabel) await onApprove?.(selectedUserType);
        });

        showSwal("SUCCESS", {}, { entity, action: actionWord });

        if (action === pendingLabel) onRedirect?.(activeLabel);
        else onRedirect?.(action);
      } catch (error) {
        showSwal("ERROR", {}, { entity });
      }
    },
    [
      userData,
      confirmLetter,
      selectedUserType,
      onApprove,
      onActive,
      onInactive,
      onRedirect,
      handleClose,
      activeLabel,
      inactiveLabel,
      pendingLabel,
    ],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      const { statusCode } = userData || {};
      if (statusCode === pendingKey) handleConfirm(pendingLabel);
      else if (statusCode === inactiveKey) handleConfirm(activeLabel);
      else if (statusCode === activeKey) handleConfirm(inactiveLabel);
    },
    [
      userData,
      pendingKey,
      inactiveKey,
      activeKey,
      pendingLabel,
      activeLabel,
      inactiveLabel,
      handleConfirm,
    ],
  );

  const profileImage = resolveProfileImage(userData);
  const showActiveDot =
    userData?.statusCode === activeKey && Number(userData?.bIsActive) === 0;

  const getActiveText = (user) => {
    if (!user?.dtLoggedIn) return "Offline";
    const updated = new Date(user.dtLoggedIn);
    if (isNaN(updated)) return "Offline";
    const diffMs = Date.now() - updated.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (Number(user.bIsActive) === 0) return "Online";
    if (mins < 1) return "Online just now";
    if (mins < 60) return `Online ${mins} min${mins === 1 ? "" : "s"} ago`;
    if (hours < 24) return `Online ${hours} hr${hours === 1 ? "" : "s"} ago`;
    return `Online ${days} day${days === 1 ? "" : "s"} ago`;
  };

  const statusCode = userData?.statusCode;
  const currentStatus =
    statusCode === pendingKey
      ? statusConfig.pending
      : statusCode === activeKey
        ? statusConfig.active
        : statusCode === inactiveKey
          ? statusConfig.inactive
          : null;

  const modalTitle =
    statusCode === pendingKey
      ? "User Approval"
      : statusCode === activeKey
        ? "User Deactivation"
        : "User Activation";

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmLetter("");
        setSelectedUserType("");
        setConfirmError("");
        handleClose();
      }}
      title={modalTitle}
      subTitle={`/ ${userData?.nickname || ""}`}
      showSave={false}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Toast
          ref={errorAlertRef}
          open={!!confirmError}
          message={confirmError}
          severity="error"
          onClose={() => setConfirmError("")}
        />

        <Fade in timeout={400}>
          <Box>
            {/* Header banner with avatar */}
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #115e59 100%)",
                borderRadius: "12px 12px 0 0",
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 1.5, sm: 2.5 },
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.2, sm: 2 },
                flexWrap: "wrap",
              }}
            >
              {/* Avatar */}
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Box
                  sx={{
                    width: { xs: 46, sm: 60 },
                    height: { xs: 46, sm: 60 },
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2.5px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <img
                    src={profileImage}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>

                {showActiveDot && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: { xs: 11, sm: 14 },
                      height: { xs: 11, sm: 14 },
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      border: "2px solid white",
                    }}
                  />
                )}
              </Box>

              {/* Name + active text */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: { xs: "0.58rem", sm: "0.68rem" },
                    fontWeight: 500,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  User Profile
                </Typography>

                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "0.85rem", sm: "1rem" },
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {userData?.lastName}, {userData?.firstName}{" "}
                  {userData?.middleName}
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: { xs: "0.65rem", sm: "0.72rem" },
                    mt: 0.3,
                  }}
                >
                  {getActiveText(userData)}
                </Typography>
              </Box>

              {/* Status chip */}
              {currentStatus && (
                <Chip
                  label={currentStatus.label}
                  size="small"
                  sx={{
                    backgroundColor: currentStatus.bg,
                    color: currentStatus.color,
                    border: `1px solid ${currentStatus.border}`,
                    fontWeight: 600,
                    fontSize: { xs: "0.6rem", sm: "0.7rem" },
                    letterSpacing: "0.3px",
                    flexShrink: 0,
                    height: { xs: 22, sm: 26 },
                  }}
                />
              )}
            </Box>

            {/* Info rows */}
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
                          width: { xs: 24, sm: 30 },
                          height: { xs: 24, sm: 30 },
                          borderRadius: "8px",
                          bgcolor: "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          sx={{
                            fontSize: { xs: "0.78rem", sm: "0.9rem" },
                            color: "#3b82f6",
                          }}
                        />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: { xs: "0.68rem", sm: "0.76rem" },
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
                        fontSize: { xs: "0.72rem", sm: "0.84rem" },
                        color: "#111827",
                        fontStyle: userData?.[key] ? "normal" : "italic",
                        pl: { xs: 4.5, sm: 0 },
                        wordBreak: "break-word",
                      }}
                    >
                      {userData?.[key] || "—"}
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
          </Box>
        </Fade>

        {/* Pending — user type selector */}
        {statusCode === pendingKey && (
          <Fade in timeout={500}>
            <FormControl fullWidth size="small">
              <InputLabel>Select User Type</InputLabel>
              <Select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                label="Select User Type"
                sx={{ borderRadius: "8px" }}
              >
                {Object.entries(userTypes || {}).map(([k, label]) => (
                  <MenuItem key={k} value={k}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Fade>
        )}

        {/* Action section */}
        <Fade in timeout={600}>
          <Box
            sx={{
              bgcolor: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              p: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#6b7280",
                mb: 0.5,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Confirm Action
            </Typography>

            <Box sx={{ position: "relative" }}>
              {/* Left icon */}
              <Box
                sx={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                <VerifiedUser
                  sx={{
                    fontSize: "1rem",
                    color: confirmError ? "#ef4444" : "#9ca3af",
                  }}
                />
              </Box>

              {/* Full width input */}
              <input
                value={confirmLetter}
                onChange={(e) => {
                  const val = e.target.value.slice(-1);
                  setConfirmLetter(val);
                  setConfirmError("");
                }}
                maxLength={1}
                placeholder={`Type first letter of "${userData?.firstName?.[0] || "?"}" to confirm`}
                style={{
                  width: "100%",
                  padding: "9px 160px 9px 34px",
                  fontSize: "0.82rem",
                  borderRadius: "50px",
                  border: confirmError
                    ? "1.5px solid #ef4444"
                    : "1.5px solid #d1d5db",
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                  transition: "border 0.2s",
                  color: "#111827",
                }}
                onFocus={(e) => {
                  if (!confirmError) e.target.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  if (!confirmError) e.target.style.borderColor = "#d1d5db";
                }}
                onKeyDown={handleKeyDown}
              />

              {/* Button overlaying right side */}
              <Box
                sx={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  gap: 0.5,
                }}
              >
                {statusCode === pendingKey && (
                  <BaseButton
                    label="Approve"
                    onClick={() => handleConfirm(pendingLabel)}
                    icon={<CheckCircle />}
                    size="small"
                    actionColor="approve"
                  />
                )}
                {statusCode === inactiveKey && (
                  <BaseButton
                    label="Activate"
                    onClick={() => handleConfirm(activeLabel)}
                    icon={<PlayArrow />}
                    size="small"
                    actionColor="activate"
                  />
                )}
                {statusCode === activeKey && (
                  <BaseButton
                    label="Deactivate"
                    onClick={() => handleConfirm(inactiveLabel)}
                    icon={<PauseCircle />}
                    size="small"
                    actionColor="deactivate"
                  />
                )}
              </Box>
            </Box>

            {confirmError && (
              <Typography
                sx={{ fontSize: "0.7rem", color: "#ef4444", mt: 0.5, pl: 1.5 }}
              >
                {confirmError}
              </Typography>
            )}
          </Box>
        </Fade>
      </Box>
    </ModalContainer>
  );
}

export default memo(InfoUserModal);