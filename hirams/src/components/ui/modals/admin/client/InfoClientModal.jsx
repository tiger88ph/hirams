import React, { useState, useCallback, memo } from "react";
import { Box, Typography, Card, CardContent, Fade, Alert } from "@mui/material";
import { CheckCircle, PlayArrow, PauseCircle } from "@mui/icons-material";
import ModalContainer from "../../../../../components/common/ModalContainer";
import AlertBox from "../../../../common/AlertBox";
import {
  ApproveButton,
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons";
import messages from "../../../../../utils/messages/messages";
import DotSpinner from "../../../../common/DotSpinner";

function InfoClientModal({
  open,
  handleClose,
  clientData,
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
  managementKey,
}) {
  const [confirmLetter, setConfirmLetter] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleConfirm = useCallback(
    async (action) => {
      if (!clientData?.name) return;

      if (
        confirmLetter.trim().toUpperCase() !== clientData.name[0].toUpperCase()
      ) {
        setConfirmError(messages.client.confirmMess);
        return;
      }

      const actionMap = {
        [pendingLabel]: {
          message: `${messages.client.approvingMess} ${clientData.name}${messages.typography.ellipsis}`,
          handler: onApprove,
          redirect: activeLabel,
        },
        [activeLabel]: {
          message: `${messages.client.activatingMess} ${clientData.name}${messages.typography.ellipsis}`,
          handler: onActive,
          redirect: activeLabel,
        },
        [inactiveLabel]: {
          message: `${messages.client.deactivatingMess} ${clientData.name}${messages.typography.ellipsis}`,
          handler: onInactive,
          redirect: inactiveLabel,
        },
      };

      const { message, handler, redirect } = actionMap[action] || {};
      if (!handler) return;

      setLoading(true);
      setLoadingMessage(message);

      try {
        await handler?.();
        onRedirect?.(redirect);

        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      } catch (error) {
        console.error(error);
        setConfirmError(messages.client.errorMess);
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    },
    [
      clientData,
      confirmLetter,
      onApprove,
      onActive,
      onInactive,
      onRedirect,
      handleClose,
    ],
  );

  const infoRows = [
    { label: "Client", value: clientData?.name },
    { label: "Nickname", value: clientData?.nickname },
    { label: "TIN", value: clientData?.tin },
    { label: "Business Style", value: clientData?.businessStyle },
    { label: "Address", value: clientData?.address },
    { label: "Contact Person", value: clientData?.contactPerson },
    { label: "Contact Number", value: clientData?.contactNumber },
  ];

  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;
  const isManagement = managementKey.includes(userType);

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      }}
      title="Client Information"
      subTitle={clientData?.name || ""}
      showSave={false}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Loading Overlay */}
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
              <DotSpinner size={14} />
              <Typography sx={{ mt: 2, fontWeight: 500 }}>
                {loadingMessage}
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Error Message */}
        {confirmError && !loading && (
          <Alert severity="error" sx={{ mb: 2, width: "100%", maxWidth: 600 }}>
            {confirmError}
          </Alert>
        )}

        {/* Info Section */}
        <Fade in={true} timeout={300}>
          <Box sx={{ width: "100%", maxWidth: 600, mb: 1 }}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              {isManagement && (
                <AlertBox>
                  Please review the client information below and take
                  appropriate action.
                </AlertBox>
              )}
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
                        wordBreak: "break-word",
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

        {/* Input + Action Buttons (styled like supplier modal) */}
        {isManagement && (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 600,
            }}
          >
            <input
              type="text"
              value={confirmLetter}
              onChange={(e) => setConfirmLetter(e.target.value)}
              maxLength={1}
              placeholder="Enter first letter of the client name"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "30px",
                border: "1px solid #bdbdbd",
                outline: "none",
                background: "white",
                boxSizing: "border-box",
                paddingRight: "180px", // space for buttons
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
              {clientData?.statusCode === pendingKey && (
                <ApproveButton
                  onClick={() => handleConfirm(pendingLabel)}
                  startIcon={<CheckCircle />}
                />
              )}
              {clientData?.statusCode === inactiveKey && (
                <ActiveButton
                  onClick={() => handleConfirm(activeLabel)}
                  startIcon={<PlayArrow />}
                />
              )}
              {clientData?.statusCode === activeKey && (
                <InactiveButton
                  onClick={() => handleConfirm(inactiveLabel)}
                  startIcon={<PauseCircle />}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </ModalContainer>
  );
}

export default memo(InfoClientModal);
