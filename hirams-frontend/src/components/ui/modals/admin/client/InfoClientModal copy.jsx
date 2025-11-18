import React, { useState, useCallback, memo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Alert,
  Fade,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CheckCircle, PlayArrow, PauseCircle } from "@mui/icons-material"; // Removed ArrowBack as per request
import ModalContainer from "../../../../../components/common/ModalContainer";
import {
  ApproveButton,
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons";
import VerificationModalCard from "../../../../../components/common/VerificationModalCard";

function InfoClientModal({
  open,
  handleClose,
  clientData,
  onApprove,
  onActive,
  onInactive,
  onRedirect,
}) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLetter, setConfirmLetter] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Handle action click
  const handleActionClick = useCallback((action) => {
    setConfirmAction(action);
    setConfirmLetter("");
    setConfirmError("");
  }, []);

  // Handle confirm action
  const handleConfirm = useCallback(async () => {
    if (!clientData?.name) return;

    if (confirmLetter.toUpperCase() !== clientData.name[0].toUpperCase()) {
      setConfirmError(
        "The letter does not match the first letter of the client name."
      );
      return;
    }

    let message = "";
    switch (confirmAction) {
      case "approve":
        message = `Approving client ${clientData.name}...`;
        break;
      case "active":
        message = `Activating client ${clientData.name}...`;
        break;
      case "inactive":
        message = `Deactivating client ${clientData.name}...`;
        break;
      default:
        break;
    }

    setLoading(true);
    setLoadingMessage(message);

    try {
      switch (confirmAction) {
        case "approve":
          await onApprove?.();
          onRedirect?.("Active");
          break;
        case "active":
          await onActive?.();
          onRedirect?.("Active");
          break;
        case "inactive":
          await onInactive?.();
          onRedirect?.("Inactive");
          break;
        default:
          break;
      }

      setConfirmLetter("");
      setConfirmError("");
      setConfirmAction(null);
      handleClose();
    } catch (error) {
      console.error(error);
      setConfirmError("Action failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }, [
    clientData,
    confirmLetter,
    confirmAction,
    onApprove,
    onActive,
    onInactive,
    onRedirect,
    handleClose,
  ]);

  // Handle cancel action (for deactivation)
  const handleCancel = useCallback(() => {
    setConfirmAction(null);
    setConfirmLetter("");
    setConfirmError("");
  }, []);

  // Helper to get action word
  const getActionWord = useCallback(() => {
    switch (confirmAction) {
      case "approve":
        return "Approve";
      case "active":
        return "Activate";
      case "inactive":
        return "Deactivate";
      default:
        return "";
    }
  }, [confirmAction]);

  // Helper to get button color
  const getButtonColor = useCallback(() => {
    switch (confirmAction) {
      case "approve":
        return "primary";
      case "active":
        return "success";
      case "inactive":
        return "error";
      default:
        return "primary";
    }
  }, [confirmAction]);

  // Client info rows
  const infoRows = [
    { label: "Client", value: clientData?.name },
    { label: "Nickname", value: clientData?.nickname },
    { label: "TIN", value: clientData?.tin },
    { label: "Business Style", value: clientData?.businessStyle },
    { label: "Address", value: clientData?.address },
    { label: "Contact Person", value: clientData?.contactPerson },
    { label: "Contact Number", value: clientData?.contactNumber },
    { label: "Assisted by", value: clientData?.clientName },
  ];

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmAction(null);
        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      }}
      title={
        confirmAction
          ? "Request Information / Confirmation"
          : "Request Information"
      }
      subTitle={clientData?.clientName || ""}
      showSave={false}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          maxHeight: "60vh",
          overflowY: "auto",
          textAlign: "center",
          position: "relative",
          p: isSmallScreen ? 1 : 2,
        }}
      >
        {/* Loading Overlay */}
        {loading && (
          <Fade in={loading} timeout={300}>
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

        {/* Error Alert */}
        {confirmError && !loading && (
          <Alert
            severity="error"
            sx={{ mb: 2, width: "100%", maxWidth: 600 }}
            onClose={() => setConfirmError("")}
          >
            {confirmError}
          </Alert>
        )}

        {/* Verification Step */}
        {confirmAction ? (
          <Fade in={confirmAction} timeout={300}>
            <Box sx={{ width: "100%", maxWidth: 600 }}>
              <VerificationModalCard
                entityName={clientData?.name}
                verificationInput={confirmLetter}
                setVerificationInput={setConfirmLetter}
                verificationError={confirmError}
                onBack={() => setConfirmAction(null)} // Keep internal back if needed
                onConfirm={handleConfirm}
                actionWord={getActionWord()}
                confirmButtonColor={getButtonColor()}
                instructionLabel="Enter the first letter of the client name"
                confirmButtonText={`Confirm ${getActionWord()}`}
              />
              {/* Add Cancel button for deactivation */}
            </Box>
          </Fade>
        ) : (
          <Fade in={!confirmAction} timeout={300}>
            <Box sx={{ width: "100%", maxWidth: 600 }}>
              {/* Client Information */}
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 3,
                  textAlign: "center",
                }}
              >
                Please review the client information below and take appropriate
                action.
              </Typography>

              <Card
                elevation={2}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: isSmallScreen ? 2 : 3 }}>
                  {infoRows.map(({ label, value }) => (
                    <Box
                      key={label}
                      sx={{
                        display: "flex",
                        flexDirection: isSmallScreen ? "column" : "row",
                        alignItems: isSmallScreen ? "flex-start" : "center",
                        mb: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                          minWidth: isSmallScreen ? "100%" : "40%",
                          textAlign: isSmallScreen ? "left" : "right",
                          pr: isSmallScreen ? 0 : 2,
                          mb: isSmallScreen ? 0.5 : 0,
                        }}
                      >
                        {label}:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          flex: 1,
                          textAlign: "left",
                        }}
                      >
                        {value || "—"}
                      </Typography>
                    </Box>
                  ))}

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isSmallScreen ? "column" : "row",
                      justifyContent: "center",
                      gap: 2,
                      marginTop: 3,
                      width: isSmallScreen ? "100%" : "auto",
                    }}
                  >
                    {/* Hide buttons if userType is 'P' */}
                    {userType !== "P" && (
                      <>
                        {clientData?.status === "For Approval" && (
                          <ApproveButton
                            onClick={() => handleActionClick("approve")}
                            fullWidth={isSmallScreen}
                            startIcon={<CheckCircle />}
                          />
                        )}

                        {clientData?.status === "Inactive" && (
                          <ActiveButton
                            onClick={() => handleActionClick("active")}
                            fullWidth={isSmallScreen}
                            startIcon={<PlayArrow />}
                          />
                        )}

                        {clientData?.status === "Active" && (
                          <InactiveButton
                            onClick={() => handleActionClick("inactive")}
                            fullWidth={isSmallScreen}
                            startIcon={<PauseCircle />}
                          />
                        )}
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Fade>
        )}
      </Box>
    </ModalContainer>
  );
}

export default memo(InfoClientModal);
