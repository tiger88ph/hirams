import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Box, Typography, Fade, Chip, Divider } from "@mui/material";
import {
  CheckCircle,
  PlayArrow,
  PauseCircle,
  Business,
  Badge,
  Receipt,
  LocationOn,
  Percent,
  AccountBalance,
  VerifiedUser,
} from "@mui/icons-material";
import ModalContainer from "../../../../components/common/ModalContainer";
import BaseButton from "../../../../components/common/BaseButton";
import Toast from "../../../../components/helper/Toast";
import uiMessages from "../../../../utils/helpers/uiMessages";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";

const fieldConfig = [
  { label: "Supplier", key: "supplierName", icon: Business },
  { label: "Nickname", key: "supplierNickName", icon: Badge },
  { label: "TIN", key: "supplierTIN", icon: Receipt },
  { label: "Address", key: "address", icon: LocationOn },
  { label: "VAT", key: "vat", icon: Percent },
  { label: "EWT", key: "ewt", icon: AccountBalance },
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

function InfoSupplierModal({
  open,
  handleClose,
  supplierData,
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
  isManagement,
}) {
  const [confirmLetter, setConfirmLetter] = useState("");
  const [confirmError, setConfirmError] = useState("");
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
      if (!supplierData?.supplierName) return;
      if (
        confirmLetter.trim().toUpperCase() !==
        supplierData.supplierName[0].toUpperCase()
      ) {
        setConfirmError(uiMessages.common.errorReqChar);
        return;
      }

      const entity = supplierData.supplierNickName || supplierData.supplierName;

      const actionWord =
        action === activeLabel
          ? "activated"
          : action === inactiveLabel
            ? "deactivated"
            : "approved";

      setConfirmLetter("");
      setConfirmError("");
      handleClose();

      // Wait for modal close animation to finish before showing spinner
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        await withSpinner(entity, async () => {
          if (action === activeLabel) await onActive?.();
          else if (action === inactiveLabel) await onInactive?.();
          else if (action === pendingLabel) await onApprove?.();
        });

        showSwal("SUCCESS", {}, { entity, action: actionWord });

        if (action === pendingLabel) onRedirect?.(activeLabel);
        else onRedirect?.(action);
      } catch (error) {
        showSwal("ERROR", {}, { entity });
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
      const { statusCode } = supplierData || {};
      if (statusCode === pendingKey) handleConfirm(pendingLabel);
      else if (statusCode === inactiveKey) handleConfirm(activeLabel);
      else if (statusCode === activeKey) handleConfirm(inactiveLabel);
    },
    [
      supplierData,
      pendingKey,
      inactiveKey,
      activeKey,
      pendingLabel,
      activeLabel,
      inactiveLabel,
      handleConfirm,
    ],
  );

  const statusCode = supplierData?.statusCode;
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
      ? "Supplier Approval"
      : statusCode === activeKey
        ? "Supplier Deactivation"
        : "Supplier Activation";

  return (
    <ModalContainer
      open={open}
      handleClose={() => {
        setConfirmLetter("");
        setConfirmError("");
        handleClose();
      }}
      title={modalTitle}
      subTitle={
        supplierData?.supplierNickName
          ? `/ ${supplierData.supplierNickName}`
          : ""
      }
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
            {/* Header banner */}
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #115e59 100%)",
                borderRadius: "12px 12px 0 0",
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 1.5, sm: 2.5 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 36, sm: 44 },
                    height: { xs: 36, sm: 44 },
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Business
                    sx={{
                      color: "#fff",
                      fontSize: { xs: "1.1rem", sm: "1.4rem" },
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: { xs: "0.6rem", sm: "0.7rem" },
                      fontWeight: 500,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    Supplier Profile
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
                    {supplierData?.supplierName || "—"}
                  </Typography>
                </Box>
              </Box>

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
                          width: { xs: 26, sm: 32 },
                          height: { xs: 26, sm: 32 },
                          borderRadius: "8px",
                          bgcolor: "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          sx={{
                            fontSize: { xs: "0.8rem", sm: "0.95rem" },
                            color: "#3b82f6",
                          }}
                        />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.78rem" },
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
                        fontSize: { xs: "0.75rem", sm: "0.85rem" },
                        color: "#111827",
                        fontStyle: supplierData?.[key] ? "normal" : "italic",
                        pl: { xs: 4.5, sm: 0 },
                        wordBreak: "break-word",
                      }}
                    >
                      {supplierData?.[key] || "—"}
                    </Typography>
                  </Box>

                  {i < fieldConfig.length - 1 && (
                    <Divider
                      sx={{ mx: { xs: 1.5, sm: 2 }, borderColor: "#f3f4f6" }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>

        {/* Action section */}
        {isManagement && (
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

                <input
                  value={confirmLetter}
                  onChange={(e) => {
                    const val = e.target.value.slice(-1);
                    setConfirmLetter(val);
                    setConfirmError("");
                  }}
                  maxLength={1}
                  placeholder={`Type first letter of "${supplierData?.supplierName?.[0] || "?"}" to confirm`}
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
                  sx={{
                    fontSize: "0.7rem",
                    color: "#ef4444",
                    mt: 0.5,
                    pl: 1.5,
                  }}
                >
                  {confirmError}
                </Typography>
              )}
            </Box>
          </Fade>
        )}
      </Box>
    </ModalContainer>
  );
}

export default memo(InfoSupplierModal);