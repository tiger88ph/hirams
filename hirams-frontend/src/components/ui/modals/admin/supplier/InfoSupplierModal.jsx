import React, { useState, useCallback, memo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Fade,
  Alert,
} from "@mui/material";
import { CheckCircle, PlayArrow, PauseCircle } from "@mui/icons-material";
import ModalContainer from "../../../../../components/common/ModalContainer";
import AlertBox from "../../../../common/AlertBox";
import {
  ApproveButton,
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons";

function InfoSupplierModal({
  open,
  handleClose,
  supplierData,
  onApprove,
  onActive,
  onInactive,
  onRedirect,
}) {
  const [confirmLetter, setConfirmLetter] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleConfirm = useCallback(
    async (action) => {
      if (!supplierData?.supplierName) return;

      if (
        confirmLetter.toUpperCase() !==
        supplierData.supplierName[0].toUpperCase()
      ) {
        setConfirmError(
          "The letter does not match the first letter of the supplier name."
        );
        return;
      }

      let message = "";
      switch (action) {
        case "approve":
          message = `Approving supplier ${supplierData.supplierName}...`;
          break;
        case "active":
          message = `Activating supplier ${supplierData.supplierName}...`;
          break;
        case "inactive":
          message = `Deactivating supplier ${supplierData.supplierName}...`;
          break;
        default:
          break;
      }

      setLoading(true);
      setLoadingMessage(message);

      try {
        switch (action) {
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
        handleClose();
      } catch (error) {
        console.error(error);
        setConfirmError("Action failed. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    },
    [
      supplierData,
      confirmLetter,
      onApprove,
      onActive,
      onInactive,
      onRedirect,
      handleClose,
    ]
  );

  const infoRows = [
    { label: "Supplier", value: supplierData?.supplierName },
    { label: "Nickname", value: supplierData?.supplierNickName },
    { label: "TIN", value: supplierData?.supplierTIN },
    { label: "Address", value: supplierData?.address },
    { label: "VAT", value: supplierData?.vat },
    { label: "EWT", value: supplierData?.ewt },
  ];

  const user = JSON.parse(localStorage.getItem("user"));
  const userType = user?.cUserType || null;

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      }}
      title="Supplier Information"
      subTitle={supplierData?.supplierName || ""}
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
              <CircularProgress size={50} thickness={4} />
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
              <AlertBox>
                Please review the supplier information below and take
                appropriate action.
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

        {/* Input + Action Buttons */}
        {userType === "M" && (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 600,
            }}
          >
            {/* Input */}
            <input
              type="text"
              value={confirmLetter}
              onChange={(e) => setConfirmLetter(e.target.value)}
              maxLength={1}
              placeholder="Enter first letter of the supplier name"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "30px",
                border: "1px solid #bdbdbd",
                outline: "none",
                background: "white",
                boxSizing: "border-box",
                paddingRight: "180px", // make space for overlapping buttons
              }}
            />

            {/* Action Buttons */}
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
              {supplierData?.statusCode === "P" && (
                <ApproveButton
                  onClick={() => handleConfirm("approve")}
                  startIcon={<CheckCircle />}
                />
              )}

              {supplierData?.statusCode === "I" && (
                <ActiveButton
                  onClick={() => handleConfirm("active")}
                  startIcon={<PlayArrow />}
                />
              )}

              {supplierData?.statusCode === "A" && (
                <InactiveButton
                  onClick={() => handleConfirm("inactive")}
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

export default memo(InfoSupplierModal);
