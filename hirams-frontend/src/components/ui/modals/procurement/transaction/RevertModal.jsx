import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ModalContainer from "../../../../common/ModalContainer";

function PRevertModal({ open, onClose, transaction, onReverted }) {
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const handleRevert = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onReverted) onReverted();
      onClose();
      alert("✅ Transaction reverted successfully (simulation).");
    }, 1000);
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Confirm Revert"
      width={400}
      showSave={false} // we'll use custom footer buttons
    >
      <Box sx={{ textAlign: "center", py: 3, px: 2 }}>
        <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Are you sure?
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          You are about to revert the transaction{" "}
          <span style={{ fontWeight: 600, color: "#4f46e5" }}>
            {transaction.transactionName || transaction.strTitle}
          </span>{" "}
          ({transaction.transactionId}). This action cannot be undone.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleRevert}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Revert"
            )}
          </Button>
        </Box>
      </Box>
    </ModalContainer>
  );
}

export default PRevertModal;
