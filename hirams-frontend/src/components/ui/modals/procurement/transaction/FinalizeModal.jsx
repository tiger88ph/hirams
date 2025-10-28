import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ModalContainer from "../../../../common/ModalContainer";

function FinalizeModal({ open, onClose, transaction, onFinalized }) {
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const handleFinalize = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onFinalized) onFinalized();
      onClose();
      alert("✅ Transaction finalized successfully (simulation).");
    }, 1000);
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Confirm Finalize"
      width={400}
      showSave={false} // we'll use custom footer buttons
    >
      <Box sx={{ textAlign: "center", py: 3, px: 2 }}>
        <CheckCircleRoundedIcon color="success" sx={{ fontSize: 48, mb: 1 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Finalize Transaction?
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          You are about to <strong>finalize</strong> the transaction{" "}
          <span style={{ fontWeight: 600, color: "#4f46e5" }}>
            {transaction.transactionName || transaction.strTitle}
          </span>{" "}
          ({transaction.transactionId}). Once finalized, further edits may be restricted.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleFinalize}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Finalize"
            )}
          </Button>
        </Box>
      </Box>
    </ModalContainer>
  );
}

export default FinalizeModal;
