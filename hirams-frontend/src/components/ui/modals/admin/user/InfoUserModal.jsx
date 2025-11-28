import React, { useState, useCallback, memo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Fade,
  Alert,
  Divider,
} from "@mui/material";
import { PlayArrow, PauseCircle } from "@mui/icons-material";
import ModalContainer from "../../../../../components/common/ModalContainer";
import AlertBox from "../../../../common/AlertBox";
import {
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons";

function InfoUserModal({ open, handleClose, userData, onActive, onInactive }) {
  const [confirmLetter, setConfirmLetter] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleConfirm = useCallback(
    async (action) => {
      if (!userData?.firstName) return;

      if (confirmLetter.toUpperCase() !== userData.firstName[0].toUpperCase()) {
        setConfirmError(
          "The letter does not match the first letter of the user's first name."
        );
        return;
      }

      const message =
        action === "active"
          ? `Activating user ${userData.firstName}...`
          : `Deactivating user ${userData.firstName}...`;

      setLoading(true);
      setLoadingMessage(message);

      try {
        if (action === "active") await onActive?.();
        if (action === "inactive") await onInactive?.();

        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      } catch (error) {
        console.error(error);
        setConfirmError("Action failed. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    },
    [userData, confirmLetter, onActive, onInactive, handleClose]
  );

  const infoRows = [
    { label: "First Name", value: userData?.firstName },
    { label: "Middle Name", value: userData?.middleName },
    { label: "Last Name", value: userData?.lastName },
    { label: "Nickname", value: userData?.nickname },
    { label: "User Type", value: userData?.type },
    { label: "Sex", value: userData?.sex },
  ];

  const profileImage = userData?.strProfileImage
    ? `/profile/${userData.strProfileImage}`
    : userData?.cSex === "M"
      ? "/profile/profile-male.png"
      : userData?.cSex === "F"
        ? "/profile/profile-female.png"
        : "/profile/index.png";

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      }}
      title="User Information"
      subTitle={`${userData?.firstName || ""} ${userData?.lastName || ""}`}
      showSave={false}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {confirmError && !loading && (
          <Alert severity="error" sx={{ mb: 2, width: "100%", maxWidth: 600 }}>
            {confirmError}
          </Alert>
        )}

        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            overflow: "hidden",
            mb: 1,
            border: "2px solid #0d47a1",
          }}
        >
          <img
            src={profileImage}
            alt="Profile"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>

        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          {userData?.lastName}, {userData?.firstName} {userData?.middleName}
        </Typography>

        {loading && (
          <Fade in={true} timeout={300}>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "rgba(255, 255, 255, 0.9)",
                borderRadius: 2,
              }}
            >
              <CircularProgress size={50} thickness={4} />
              <Typography sx={{ mt: 2, fontWeight: 500 }}>
                {loadingMessage}
              </Typography>
            </Box>
          </Fade>
        )}

        <Fade in={true} timeout={300}>
          <Box sx={{ width: "100%", maxWidth: 600, mb: 1 }}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <AlertBox>
                Please review the user information below and take appropriate
                action.
              </AlertBox>
              <CardContent sx={{ p: 1 }}>
                {infoRows.map(({ label, value }) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      mb: 0.5,
                      wordBreak: "break-word",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        minWidth: "40%",
                        textAlign: "right",
                        pr: 2,
                      }}
                    >
                      {label}:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                        flex: 1,
                        textAlign: "left",
                        fontStyle: "italic",
                      }}
                    >
                      {value || "—"}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Fade>

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
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              right: 0,
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              width: "170px",
            }}
          >
            {userData?.statusCode === "I" && (
              <ActiveButton
                onClick={() => handleConfirm("active")}
                startIcon={<PlayArrow />}
              />
            )}
            {userData?.statusCode === "A" && (
              <InactiveButton
                onClick={() => handleConfirm("inactive")}
                startIcon={<PauseCircle />}
              />
            )}
          </Box>
        </Box>
      </Box>
    </ModalContainer>
  );
}

export default memo(InfoUserModal);
