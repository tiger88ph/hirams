import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import ModalContainer from "../../../../../components/common/ModalContainer";
import {
  ApproveButton,
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

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

  const handleActionClick = (action) => {
    setConfirmAction(action);
    setConfirmLetter("");
    setConfirmError("");
  };

  const handleConfirm = async () => {
    if (!clientData?.name) return;

    if (confirmLetter.toUpperCase() !== clientData.name[0].toUpperCase()) {
      setConfirmError("The letter does not match the first letter of the client name.");
      return;
    }

    let message = "";
    switch (confirmAction) {
      case "approve":
        message = `Approving account of ${clientData.name}...`;
        break;
      case "active":
        message = `Activating account of ${clientData.name}...`;
        break;
      case "inactive":
        message = `Deactivating account of ${clientData.name}...`;
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
          onRedirect?.("Pending");
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

      // ✅ Keep modal open but reset confirmation state
      setConfirmLetter("");
      setConfirmError("");
      setConfirmAction(null);
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

  const getActionIcon = () => (
    <WarningAmberIcon sx={{ fontSize: 60, color: "#f59e0b" }} />
  );

  const getConfirmTitle = () => {
    switch (confirmAction) {
      case "approve":
        return "Confirm Approval";
      case "active":
        return "Confirm Activation";
      case "inactive":
        return "Confirm Deactivation";
      default:
        return "";
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
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          position: "relative",
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

        {/* ⚠️ Confirmation Step */}
        {confirmAction ? (
          <Box sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <Box sx={{ mb: 2 }}>{getActionIcon()}</Box>

            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
              {getConfirmTitle()}
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: "#6B7280" }}>
              Type the first letter of the client name (
              <strong>{clientData?.name?.[0]}</strong>) to confirm.
            </Typography>

            {confirmError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {confirmError}
              </Alert>
            )}

            <TextField
              value={confirmLetter}
              onChange={(e) => setConfirmLetter(e.target.value)}
              inputProps={{ maxLength: 1 }}
              placeholder="First letter of name"
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirm}
              fullWidth
              sx={{ mb: 1 }}
            >
              Confirm
            </Button>
            <Button
              variant="outlined"
              onClick={() => setConfirmAction(null)}
              fullWidth
            >
              Back
            </Button>
          </Box>
        ) : (
          <>
            {/* 🧾 Client Information */}
            <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
              Please review the client information below and take appropriate action.
            </Typography>

            <Box
              sx={{
                mb: 2,
                px: 3,
                py: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                alignItems: "flex-start",
                width: "100%",
                maxWidth: 500,
              }}
            >
              {infoRows.map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#6B7280",
                      minWidth: "40%",
                      pr: 2,
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
                    }}
                  >
                    {value || "—"}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 4, width: "100%" }} />

            {/* 🟢 Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              {clientData?.status === "Pending" && (
                <ApproveButton onClick={() => handleActionClick("approve")} />
              )}
              {clientData?.status === "Inactive" && (
                <ActiveButton onClick={() => handleActionClick("active")} />
              )}
              {clientData?.status === "Active" && (
                <InactiveButton onClick={() => handleActionClick("inactive")} />
              )}
            </Box>
          </>
        )}
      </Box>
    </ModalContainer>
  );
}

export default InfoClientModal;
