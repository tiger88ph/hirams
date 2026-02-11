import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Fade,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { PlayArrow, PauseCircle, CheckCircle } from "@mui/icons-material";
import ModalContainer from "../../../../common/ModalContainer";
import AlertBox from "../../../../common/AlertBox";
import {
  ActiveButton,
  InactiveButton,
  ApproveButton,
} from "../../../../common/Buttons";
import messages from "../../../../../utils/messages/messages";
import DotSpinner from "../../../../common/DotSpinner";

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
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");

  const errorAlertRef = useRef(null);

  useEffect(() => {
    if (confirmError && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [confirmError]);

  const handleConfirm = useCallback(
    async (action) => {
      if (!userData?.firstName) return;

      if (confirmLetter.toUpperCase() !== userData.firstName[0].toUpperCase()) {
        setConfirmError(messages.user.confirmMess);
        return;
      }

      if (action === pendingLabel && !selectedUserType) {
        setConfirmError("Please select a user type before approving.");
        return;
      }

      const message =
        action === activeLabel
          ? `${messages.user.activatingMess}${userData.firstName}${messages.typography.ellipsis}`
          : action === inactiveLabel
            ? `${messages.user.deactivatingMess}${userData.firstName}${messages.typography.ellipsis}`
            : `Approving ${userData.firstName}${messages.typography.ellipsis}`;

      setLoading(true);
      setLoadingMessage(message);

      try {
        if (action === activeLabel) {
          await onActive?.();
          onRedirect?.(activeLabel);
        }
        if (action === inactiveLabel) {
          await onInactive?.();
          onRedirect?.(inactiveLabel);
        }
        if (action === pendingLabel) {
          await onApprove?.(selectedUserType);
          onRedirect?.(activeLabel);
        }

        setConfirmLetter("");
        setSelectedUserType("");
        setConfirmError("");
        handleClose();
      } catch (error) {
        console.error(error);
        setConfirmError(messages.user.errorMess);
      } finally {
        setLoading(false);
        setLoadingMessage("");
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
    ]
  );

  const profileImage = userData?.strProfileImage
    ? `/profile/${userData.strProfileImage}`
    : userData?.cSex === maleKey
      ? "/profile/profile-male.png"
      : userData?.cSex === femaleKey
        ? "/profile/profile-female.png"
        : "/profile/index.png";

  const showActiveDot = userData?.statusCode === activeKey && Number(userData?.bIsActive) === 0;

const getActiveText = (user) => {
  if (!user) return "Inactive"; // <-- first guard
  if (!user.dtUpdatedAt) return "Inactive";

  const updated = new Date(user.dtUpdatedAt);
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


  const infoRows = [
    { label: "First Name", value: userData?.firstName },
    { label: "Middle Name", value: userData?.middleName },
    { label: "Last Name", value: userData?.lastName },
    { label: "Nickname", value: userData?.nickname },
    { label: "Username", value: userData?.username },
    { label: "Email", value: userData?.email },
    { label: "User Type", value: userData?.type },
    { label: "Sex", value: userData?.sex },
  ];

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmLetter("");
        setSelectedUserType("");
        setConfirmError("");
        handleClose();
      }}
      title="User Information"
      subTitle={`/ ${userData?.nickname || ""} ${userData?.nickname || ""}`}
      showSave={false}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {confirmError && !loading && (
          <Alert ref={errorAlertRef} severity="error" sx={{ mb: 2, width: "100%", maxWidth: 600 }}>
            {confirmError}
          </Alert>
        )}

        {/* Avatar */}
        <Box sx={{ position: "relative", width: 100, height: 100, mb: 1 }}>
          <Box sx={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid #0d47a1" }}>
            <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>

          {showActiveDot && (
            <Box
              sx={{
                position: "absolute",
                bottom: 1,
                right: 7,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                border: "3px solid white",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
          )}
        </Box>

        <Typography variant="h6" fontWeight={600}>
          {userData?.lastName}, {userData?.firstName} {userData?.middleName}
        </Typography>

        {/* NEW: Active X ago */}
        <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
          {getActiveText(userData)}
        </Typography>

        {/* User Info Card */}
        <Fade in timeout={300}>
          <Box sx={{ width: "100%", maxWidth: 600, mb: 1 }}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <AlertBox>Please review the user information below and take appropriate action.</AlertBox>
              <CardContent sx={{ p: 1 }}>
                {infoRows.map(({ label, value }) => (
                  <Box key={label} sx={{ display: "flex", flexDirection: "row", alignItems: "center", mb: 0.5, wordBreak: "break-word" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary", minWidth: "40%", textAlign: "right", pr: 2 }}>
                      {label}:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: "text.primary", flex: 1, textAlign: "left", fontStyle: "italic" }}>
                      {value || "—"}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Fade>

        {/* User Type Select for Pending */}
        {userData?.statusCode === pendingKey && (
          <Box sx={{ width: "100%", maxWidth: 600, mb: 2, mt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select User Type</InputLabel>
              <Select value={selectedUserType} onChange={(e) => setSelectedUserType(e.target.value)} label="Select User Type">
                {Object.entries(userTypes || {}).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ position: "relative", width: "100%", maxWidth: 600 }}>
          <input
            type="text"
            value={confirmLetter}
            onChange={(e) => setConfirmLetter(e.target.value)}
            maxLength={1}
            placeholder="Enter first letter of the user's first name"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "12px",
              borderRadius: "30px",
              border: "1px solid #bdbdbd",
              outline: "none",
              background: "white",
              paddingRight: "180px",
            }}
          />
          <Box sx={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 1.5, width: "170px" }}>
            {userData?.statusCode === pendingKey && (
              <ApproveButton onClick={() => handleConfirm(pendingLabel)} startIcon={<CheckCircle />} />
            )}
            {userData?.statusCode === inactiveKey && (
              <ActiveButton onClick={() => handleConfirm(activeLabel)} startIcon={<PlayArrow />} />
            )}
            {userData?.statusCode === activeKey && (
              <InactiveButton onClick={() => handleConfirm(inactiveLabel)} startIcon={<PauseCircle />} />
            )}
          </Box>
        </Box>
      </Box>
    </ModalContainer>
  );
}

export default memo(InfoUserModal);
