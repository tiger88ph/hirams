import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import ModalContainer from "../../../../../components/common/ModalContainer";
import {
  ApproveButton,
  ActiveButton,
  InactiveButton,
} from "../../../../../components/common/Buttons"; // ✅ import your new buttons

function InfoClientModal({
  open,
  handleClose,
  clientData,
  onApprove,
  onDecline,
  onActive,
  onInactive,
}) {
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

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Approval Request"
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
        }}
      >
        {/* Description */}
        <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
          Please review the client information below and take appropriate
          action.
        </Typography>

        {/* Client Information */}
        <Box
          sx={{
            mb: 2,
            px: 3,
            py: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "center",
            width: "100%",
            maxWidth: 450,
          }}
        >
          {infoRows.map(([label, value]) => (
            <Box
              key={label}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#6B7280",
                  minWidth: "45%",
                  pr: 2,
                }}
              >
                {label}:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  textAlign: "left",
                  fontWeight: 500,
                  color: "#111827",
                  minWidth: "45%",
                  pr: 2,
                }}
              >
                {value || "—"}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 4, width: "100%" }} />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          {clientData?.status === "Pending" && (
            <ApproveButton onClick={onApprove} />
          )}
          {clientData?.status === "Inactive" && (
            <ActiveButton onClick={onActive} />
          )}
          {clientData?.status === "Active" && (
            <InactiveButton onClick={onInactive} />
          )}
        </Box>
      </Box>
    </ModalContainer>
  );
}

export default InfoClientModal;
