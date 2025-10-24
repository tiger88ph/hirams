import React, { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../../components/common/ModalContainer";
import {
  ApproveButton,
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
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

  // handle which action user is confirming (approve, activate, deactivate)
  const handleActionClick = (action) => {
    setConfirmAction(action);
    setConfirmLetter("");
    setConfirmError("");
  };

  // confirm action logic
  const handleConfirm = async () => {
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
  };

  const infoRows = [
    ["Client", clientData?.name],
    ["Nickname", clientData?.nickname],
    ["TIN", clientData?.tin],
    ["Business Style", clientData?.businessStyle],
    ["Address", clientData?.address],
    ["Contact Person", clientData?.contactPerson],
    ["Contact Number", clientData?.contactNumber],
    ["Assisted by", clientData?.clientName],
  ];

  const getActionWord = () => {
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
  };

  const getButtonColor = () => {
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
  };

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
          maxHeight: "50vh",
          overflowY: "auto",
          textAlign: "center",
          position: "relative",
          p: isSmallScreen ? 1 : 2,
        }}
      >
        {/* 🌀 Loading overlay */}
        {loading && (
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
              bgcolor: "rgba(255,255,255,0.7)",
            }}
          >
            <CircularProgress size={45} thickness={5} />
            <Typography sx={{ mt: 1 }}>{loadingMessage}</Typography>
          </Box>
        )}

        {/* ✅ Reusable Verification Component */}
        {confirmAction ? (
          <VerificationModalCard
            entityName={clientData?.name}
            verificationInput={confirmLetter}
            setVerificationInput={setConfirmLetter}
            verificationError={confirmError}
            onBack={() => setConfirmAction(null)}
            onConfirm={handleConfirm}
            actionWord={getActionWord()}
            confirmButtonColor={getButtonColor()}
            instructionLabel="Enter the first letter of the client name"
            confirmButtonText={`Confirm ${getActionWord()}`}
          />
        ) : (
          <>
            {/* 🧾 Client Information */}
            <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
              Please review the client information below and take appropriate
              action.
            </Typography>

            <Box
              sx={{
                mb: 2,
                px: isSmallScreen ? 1 : 3,
                py: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                alignItems: "stretch",
                width: "100%",
                maxWidth: 600,
              }}
            >
              {infoRows.map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    flexDirection: isSmallScreen ? "column" : "row",
                    alignItems: isSmallScreen ? "flex-start" : "center",
                    width: "100%",
                    wordBreak: "break-word",
                    borderBottom: isSmallScreen ? "1px solid #E5E7EB" : "none",
                    pb: isSmallScreen ? 0.5 : 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#6B7280",
                      minWidth: isSmallScreen ? "100%" : "40%",
                      textAlign: isSmallScreen ? "left" : "right",
                      pr: isSmallScreen ? 0 : 2,
                    }}
                  >
                    {label}:
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: "#111827",
                      flex: 1,
                      textAlign: "left",
                      mt: isSmallScreen ? 0.3 : 0,
                    }}
                  >
                    {value || "—"}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* 🟢 Action Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: isSmallScreen ? "column" : "row",
                justifyContent: "center",
                gap: 2,
                width: isSmallScreen ? "100%" : "auto",
              }}
            >
              {clientData?.status === "Pending" && (
                <ApproveButton
                  onClick={() => handleActionClick("approve")}
                  fullWidth={isSmallScreen}
                />
              )}
              {clientData?.status === "Inactive" && (
                <ActiveButton
                  onClick={() => handleActionClick("active")}
                  fullWidth={isSmallScreen}
                />
              )}
              {clientData?.status === "Active" && (
                <InactiveButton
                  onClick={() => handleActionClick("inactive")}
                  fullWidth={isSmallScreen}
                />
              )}
            </Box>
          </>
        )}
      </Box>
    </ModalContainer>
  );
}

export default InfoClientModal;
