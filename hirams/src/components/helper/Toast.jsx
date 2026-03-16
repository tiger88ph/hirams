import React, { useEffect, useState, forwardRef, memo } from "react";
import { Alert, Fade, Box, alpha } from "@mui/material";

const Toast = forwardRef(function Toast(
  { open, message, severity = "error", duration = 5000, onClose, sx = {} },
  ref
) {
  const [visible, setVisible] = useState(open);

  // Sync visibility
  useEffect(() => {
    setVisible(open);
    if (!open) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  // Transparent colors for different severities
  const bgColors = {
    error: "rgba(211, 47, 47, 0.85)",     // red
    warning: "rgba(255, 143, 0, 0.85)",   // orange
    info: "rgba(2, 136, 209, 0.85)",      // blue
    success: "rgba(56, 142, 60, 0.85)",   // green
  };

  return (
    <Box
      sx={{
        position: "fixed", // overlay on top
        top: 50,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1300, // higher than modal
        width: "100%",
        maxWidth: 600,
        ...sx,
      }}
    >
      <Fade in={visible} timeout={100}>
        <Alert
          ref={ref}
          severity={severity}
          onClose={handleClose} // X button
          variant="filled"
          sx={{
            width: "100%",
            backgroundColor: bgColors[severity] || bgColors.error,
          }}
        >
          {message}
        </Alert>
      </Fade>
    </Box>
  );
});

export default memo(Toast);
